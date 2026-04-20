import type { SupabaseClient } from "@supabase/supabase-js";
import type { DbGenerationJob } from "@/types";

// Persistence layer for generation_jobs.
//
// Contract:
// - Takes snake_case DB values and returns raw DB rows.
// - No validation, no auth, no mapping to domain — that is the service layer's job.
// - Callers pass in the Supabase client so the service can choose between
//   anon-key (user context, RLS-enforced) and, later, service-role (worker/webhook).

export interface InsertGenerationJobRow {
  user_id: string;
  provider: string;
  model: string;
  prompt: string;
  params: Record<string, unknown>;
}

export async function insertGenerationJob(
  supabase: SupabaseClient,
  row: InsertGenerationJobRow
): Promise<DbGenerationJob> {
  // status defaults to 'queued' and attempts to 0 at the DB layer, so we don't
  // set them here. Keeping the insert payload minimal makes the intent obvious:
  // "create a pending job; let the DB own lifecycle defaults."
  const { data, error } = await supabase
    .from("generation_jobs")
    .insert(row)
    .select("*")
    .single();

  if (error || !data) {
    // Surface the Postgres error upward; the service layer decides how to
    // translate it into a user-safe message.
    throw error ?? new Error("Failed to insert generation job");
  }

  return data as DbGenerationJob;
}
