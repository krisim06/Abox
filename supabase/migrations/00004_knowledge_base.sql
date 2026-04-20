-- ABox: knowledge base (RAG foundation)
--
-- Introduces the retrieval layer that future generation planning can consult
-- for style guides, policy/safety notes, and prompt templates.
--
-- Design notes:
-- - pgvector is the embedding store; we keep a single embedding dimension
--   (1536, OpenAI text-embedding-3-small) so indexing/search stays uniform.
--   If we add a second embedding family later, it will get its own column or
--   its own table rather than a widened union type.
-- - Chunks reference documents with ON DELETE CASCADE: retrieval rows are
--   derived artifacts, not first-class records.
-- - `embedding` is NULLABLE so we can insert chunks before embeddings resolve
--   (future async embedding pipeline), without losing the audit trail.
-- - No ANN (IVFFlat/HNSW) index yet. At MVP volume, sequential scan is fine
--   and keeps this migration portable. An index migration is a safe follow-up
--   once we know real data distribution.
-- - RLS governs visibility. The match_knowledge_chunks function runs as
--   SECURITY INVOKER so the same policies apply to retrieval queries.

create extension if not exists vector;

-- =====================================================================
-- ENUMS
-- =====================================================================

-- We gate doc_type at the type level so new knowledge classes require a
-- deliberate migration rather than string-typing inside jsonb metadata.
create type public.knowledge_doc_type as enum (
  'style_guide',
  'policy',
  'prompt_template'
);

-- Visibility is the single axis for access control.
-- - 'system'  : platform-owned reference content (owner_user_id IS NULL)
-- - 'public'  : shared across all authenticated users
-- - 'private' : scoped to a single owner
create type public.knowledge_visibility as enum (
  'system',
  'public',
  'private'
);

-- =====================================================================
-- KNOWLEDGE DOCUMENTS
-- =====================================================================
create table public.knowledge_documents (
  id              uuid primary key default uuid_generate_v4(),
  owner_user_id   uuid references public.users(id) on delete cascade,
  doc_type        public.knowledge_doc_type not null,
  title           text not null,
  body            text not null,
  visibility      public.knowledge_visibility not null,
  metadata        jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  -- Ownership invariant:
  -- - system docs must not have an owner (platform-owned reference material)
  -- - private docs must have an owner
  -- - public docs may or may not have an owner (user-shared or platform-published)
  constraint knowledge_documents_owner_visibility check (
    (visibility = 'system'  and owner_user_id is null) or
    (visibility = 'private' and owner_user_id is not null) or
    (visibility = 'public')
  ),

  -- Bound inputs at the DB layer; the service layer validates more strictly.
  constraint knowledge_documents_title_length check (
    char_length(title) between 1 and 200
  ),
  constraint knowledge_documents_body_length check (
    char_length(body) between 1 and 200000
  )
);

create index idx_knowledge_documents_owner
  on public.knowledge_documents (owner_user_id);

create index idx_knowledge_documents_type_visibility
  on public.knowledge_documents (doc_type, visibility);

create trigger knowledge_documents_set_updated_at
  before update on public.knowledge_documents
  for each row execute function public.set_updated_at();

-- =====================================================================
-- KNOWLEDGE CHUNKS
-- =====================================================================
create table public.knowledge_chunks (
  id           uuid primary key default uuid_generate_v4(),
  document_id  uuid not null references public.knowledge_documents(id) on delete cascade,
  chunk_index  integer not null,
  chunk_text   text not null,
  -- 1536 matches OpenAI text-embedding-3-small. If we ever switch models with
  -- a different dimension, we add a new column/table rather than altering this.
  embedding    vector(1536),
  metadata     jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now(),

  constraint knowledge_chunks_index_nonneg check (chunk_index >= 0),
  constraint knowledge_chunks_text_length check (
    char_length(chunk_text) between 1 and 8000
  ),
  -- Chunks are deterministic per document: re-chunking must replace, not
  -- duplicate. Enforced at the DB so services cannot silently double-insert.
  unique (document_id, chunk_index)
);

create index idx_knowledge_chunks_document
  on public.knowledge_chunks (document_id);

-- =====================================================================
-- ROW LEVEL SECURITY
-- =====================================================================
alter table public.knowledge_documents enable row level security;
alter table public.knowledge_chunks    enable row level security;

-- Documents: read access.
create policy "System and public docs are readable by authenticated users"
  on public.knowledge_documents for select
  using (
    visibility in ('system', 'public')
    or owner_user_id = auth.uid()
  );

-- Documents: owner-scoped writes. Users can only create/modify their own
-- docs, and they cannot create 'system' docs (invariant above also forbids it
-- by requiring owner_user_id IS NULL, which auth.uid() never is).
create policy "Owners can insert their own documents"
  on public.knowledge_documents for insert
  with check (
    owner_user_id = auth.uid()
    and visibility in ('public', 'private')
  );

create policy "Owners can update their own documents"
  on public.knowledge_documents for update
  using (owner_user_id = auth.uid());

create policy "Owners can delete their own documents"
  on public.knowledge_documents for delete
  using (owner_user_id = auth.uid());

-- Chunks: readable iff the parent document is readable.
-- The EXISTS subquery respects RLS on knowledge_documents, so this policy
-- automatically inherits the document visibility rules above.
create policy "Chunks are readable when parent document is readable"
  on public.knowledge_chunks for select
  using (
    exists (
      select 1 from public.knowledge_documents d
      where d.id = knowledge_chunks.document_id
    )
  );

-- Intentionally NO insert/update/delete policy on knowledge_chunks.
-- Chunk/embedding writes are server-side operations using the service-role
-- key. Keeping this as a trust boundary means clients cannot smuggle bogus
-- embeddings or impersonate retrieval output.

-- =====================================================================
-- VECTOR SEARCH FUNCTION
-- =====================================================================
-- Single entry point for semantic retrieval. Callers pass a query embedding
-- and optional filters; visibility is enforced by RLS via SECURITY INVOKER.
--
-- Returns the top `match_count` chunks by cosine similarity together with
-- enough parent-document context for the retrieval layer to render or cite
-- them, without a second round trip.
create or replace function public.match_knowledge_chunks(
  query_embedding vector(1536),
  match_count     integer default 5,
  p_doc_types     text[]  default null
)
returns table (
  chunk_id        uuid,
  document_id     uuid,
  chunk_index     integer,
  chunk_text      text,
  chunk_metadata  jsonb,
  doc_type        text,
  doc_title       text,
  doc_visibility  text,
  similarity      float
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    c.id                                     as chunk_id,
    c.document_id                            as document_id,
    c.chunk_index                            as chunk_index,
    c.chunk_text                             as chunk_text,
    c.metadata                               as chunk_metadata,
    d.doc_type::text                         as doc_type,
    d.title                                  as doc_title,
    d.visibility::text                       as doc_visibility,
    1 - (c.embedding <=> query_embedding)    as similarity
  from public.knowledge_chunks   c
  join public.knowledge_documents d on d.id = c.document_id
  where c.embedding is not null
    and (p_doc_types is null or d.doc_type::text = any(p_doc_types))
  order by c.embedding <=> query_embedding
  limit greatest(match_count, 1);
$$;
