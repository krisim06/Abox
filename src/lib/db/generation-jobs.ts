import type { SupabaseClient } from "@supabase/supabase-js";
import type { DbGenerationJob, DbGenerationStatus } from "@/types";

// Persistence layer for generation_jobs.
//
// Contract:
// - Takes snake_case DB values and returns raw DB rows.
// - No validation, no auth, no mapping to domain — that is the service layer's job.
// - Callers pass in the Supabase client so the service can choose between
//   anon-key (user context, RLS-enforced) and service-role (finalization,
//   worker, webhook flows).

export interface InsertGenerationJobRow {
  user_id: string;
  provider: string;
  model: string;
  prompt: string;
  params: Record<string, unknown>;
  // Optional: used by the retry path so the child job starts with the
  // correct attempt counter. Defaults to 0 at the DB layer when omitted.
  attempts?: number;
}

export async function insertGenerationJob(
  supabase: SupabaseClient,
  row: InsertGenerationJobRow
): Promise<DbGenerationJob> {
  // status defaults to 'queued' at the DB layer, so we don't set it here.
  // Keeping the insert payload minimal makes the intent obvious: "create a
  // pending job; let the DB own lifecycle defaults."
  const payload: Record<string, unknown> = {
    user_id: row.user_id,
    provider: row.provider,
    model: row.model,
    prompt: row.prompt,
    params: row.params,
  };
  if (typeof row.attempts === "number") payload.attempts = row.attempts;

  const { data, error } = await supabase
    .from("generation_jobs")
    .insert(payload)
    .select("*")
    .single();

  if (error || !data) {
    throw error ?? new Error("Failed to insert generation job");
  }

  return data as DbGenerationJob;
}

export async function getGenerationJobById(
  supabase: SupabaseClient,
  id: string
): Promise<DbGenerationJob | null> {
  const { data, error } = await supabase
    .from("generation_jobs")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return (data as DbGenerationJob) ?? null;
}

// Finalization patch. `params_patch` is merged into the row's existing
// params in JS and the whole params blob is rewritten — safe for a
// single-row update and avoids a custom SQL function.
export interface FinalizeGenerationJobPatch {
  status: DbGenerationStatus;
  output_content_id?: string | null;
  error_code?: string | null;
  error_message?: string | null;
  started_at?: string | null;
  finished_at?: string | null;
  params_patch?: Record<string, unknown>;
}

export async function finalizeGenerationJob(
  supabase: SupabaseClient,
  id: string,
  patch: FinalizeGenerationJobPatch
): Promise<DbGenerationJob> {
  // Read current params to merge. We do this in JS to keep the update
  // atomic from the DB's point of view (single UPDATE) without reaching
  // for a bespoke SQL function.
  const current = await getGenerationJobById(supabase, id);
  if (!current) throw new Error(`generation_jobs row ${id} not found`);

  const nextParams: Record<string, unknown> = patch.params_patch
    ? { ...(current.params ?? {}), ...patch.params_patch }
    : (current.params ?? {});

  const update: Record<string, unknown> = {
    status: patch.status,
    params: nextParams,
  };
  if (patch.output_content_id !== undefined) {
    update.output_content_id = patch.output_content_id;
  }
  if (patch.error_code !== undefined) update.error_code = patch.error_code;
  if (patch.error_message !== undefined) {
    update.error_message = patch.error_message;
  }
  if (patch.started_at !== undefined) update.started_at = patch.started_at;
  if (patch.finished_at !== undefined) update.finished_at = patch.finished_at;

  const { data, error } = await supabase
    .from("generation_jobs")
    .update(update)
    .eq("id", id)
    .select("*")
    .single();

  if (error || !data) {
    throw error ?? new Error("Failed to finalize generation job");
  }
  return data as DbGenerationJob;
}
