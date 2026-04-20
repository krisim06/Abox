import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  DbKnowledgeDocument,
  DbKnowledgeDocType,
  DbKnowledgeVisibility,
} from "@/types";

// Persistence layer for knowledge_documents.
//
// Contract:
// - Takes snake_case DB values and returns raw DB rows.
// - No validation, no auth, no chunking/embedding. Those belong in the
//   service/AI layers.
// - Callers pass in the Supabase client so the service can choose between
//   anon-key (RLS-enforced, user context) and, later, service-role (seeding
//   system docs, background jobs).

export interface InsertKnowledgeDocumentRow {
  owner_user_id: string | null;
  doc_type: DbKnowledgeDocType;
  title: string;
  body: string;
  visibility: DbKnowledgeVisibility;
  metadata?: Record<string, unknown>;
}

export async function insertKnowledgeDocument(
  supabase: SupabaseClient,
  row: InsertKnowledgeDocumentRow
): Promise<DbKnowledgeDocument> {
  const { data, error } = await supabase
    .from("knowledge_documents")
    .insert({
      owner_user_id: row.owner_user_id,
      doc_type: row.doc_type,
      title: row.title,
      body: row.body,
      visibility: row.visibility,
      metadata: row.metadata ?? {},
    })
    .select("*")
    .single();

  if (error || !data) {
    throw error ?? new Error("Failed to insert knowledge document");
  }

  return data as DbKnowledgeDocument;
}

export async function getKnowledgeDocumentById(
  supabase: SupabaseClient,
  id: string
): Promise<DbKnowledgeDocument | null> {
  const { data, error } = await supabase
    .from("knowledge_documents")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return (data as DbKnowledgeDocument) ?? null;
}
