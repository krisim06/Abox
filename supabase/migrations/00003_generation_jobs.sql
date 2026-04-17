-- ABox: generation_jobs
-- Introduces the async generation job lifecycle used by the AI generation flow.
--
-- Design notes:
-- - Users can read and insert their own jobs via RLS.
-- - No update/delete policy is granted: state transitions are privileged operations
--   performed server-side with the service-role key. This is the trust boundary
--   that keeps status/output_content_id tamper-proof from the client.
-- - params is jsonb so per-provider arguments (seed, steps, aspect_ratio, etc.)
--   can evolve without schema churn; the service layer validates shape per model.
-- - provider_job_id is populated when dispatch to the provider returns an external
--   handle; webhooks resolve our job by (provider, provider_job_id).
-- - output_content_id points at a contents row on success; on delete of that
--   content we set null rather than cascade-delete the audit trail.

create type public.generation_status as enum (
  'queued',
  'running',
  'succeeded',
  'failed',
  'canceled'
);

create table public.generation_jobs (
  id                 uuid primary key default uuid_generate_v4(),
  user_id            uuid not null references public.users(id) on delete cascade,
  status             public.generation_status not null default 'queued',
  provider           text not null,
  provider_job_id    text,
  model              text not null,
  prompt             text not null,
  params             jsonb not null default '{}'::jsonb,
  output_content_id  uuid references public.contents(id) on delete set null,
  error_code         text,
  error_message      text,
  attempts           smallint not null default 0,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  started_at         timestamptz,
  finished_at        timestamptz,

  -- Invariant: a succeeded job must have a resolved output.
  -- We do NOT invert the check (allowing output to be set while status is still
  -- 'running') so the finalize flow can write output_content_id before flipping
  -- status, even without a single transaction wrapping both writes.
  constraint generation_jobs_succeeded_has_output check (
    status <> 'succeeded' or output_content_id is not null
  ),

  -- Defense in depth: prompt length is also bounded at the service layer.
  constraint generation_jobs_prompt_length check (
    char_length(prompt) between 1 and 4000
  ),

  constraint generation_jobs_attempts_nonneg check (attempts >= 0)
);

-- Per-user timeline queries (jobs list, /jobs dashboard, rate limit lookups).
create index idx_generation_jobs_user_created
  on public.generation_jobs (user_id, created_at desc);

-- Cheap scan for future workers / dashboards that want only active jobs.
create index idx_generation_jobs_active_status
  on public.generation_jobs (status)
  where status in ('queued', 'running');

-- Webhook path: resolve our job from (provider, provider_job_id) in O(log n).
create index idx_generation_jobs_provider_lookup
  on public.generation_jobs (provider, provider_job_id)
  where provider_job_id is not null;

-- updated_at trigger: keep in sync on any row update so clients can rely on it
-- as a change timestamp (Realtime subscribers, polling UIs).
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger generation_jobs_set_updated_at
  before update on public.generation_jobs
  for each row execute function public.set_updated_at();

-- =====================================================================
-- ROW LEVEL SECURITY
-- =====================================================================
alter table public.generation_jobs enable row level security;

create policy "Users can read their own generation jobs"
  on public.generation_jobs for select
  using (auth.uid() = user_id);

create policy "Users can create their own generation jobs"
  on public.generation_jobs for insert
  with check (auth.uid() = user_id);

-- Intentionally no update/delete policy.
-- Status transitions and error recording are performed server-side only
-- using the service-role key, which bypasses RLS.
