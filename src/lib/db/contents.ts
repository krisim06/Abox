import type { SupabaseClient } from "@supabase/supabase-js";
import type { DbContent } from "@/types";

// Persistence layer for generation-produced content rows.
//
// This module is distinct from src/services/content-service.ts on purpose:
// - content-service is a *user-context* service that creates content via
//   the anon client and relies on RLS (auth.uid() = user_id).
// - this module is used by the finalizer running with the service-role
//   client, which bypasses RLS. Keeping the trusted path in its own file
//   makes it obvious that callers must be server-internal.

export interface InsertGeneratedContentRow {
  user_id: string;
  title: string;
  image_url: string;
  prompt: string;
  model: string;
  seed?: string | null;
  parent_content_id?: string | null;
}

export async function insertGeneratedContent(
  supabase: SupabaseClient,
  row: InsertGeneratedContentRow
): Promise<DbContent> {
  const { data, error } = await supabase
    .from("contents")
    .insert({
      user_id: row.user_id,
      title: row.title,
      image_url: row.image_url,
      prompt: row.prompt,
      model: row.model,
      seed: row.seed ?? null,
      parent_content_id: row.parent_content_id ?? null,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw error ?? new Error("Failed to insert generated content");
  }
  return data as DbContent;
}
