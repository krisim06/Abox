import type { SupabaseClient } from "@supabase/supabase-js";
import type { DbKnowledgeChunkMatch } from "@/types";

// Persistence layer for knowledge_chunks.
//
// Contract:
// - Batch inserts are the common path: documents produce many chunks at once.
// - The embedding array is encoded to pgvector's textual literal format here
//   so callers can stay in plain JS numbers[] without knowing pgvector syntax.

export interface InsertKnowledgeChunkRow {
  document_id: string;
  chunk_index: number;
  chunk_text: string;
  embedding: number[] | null;
  metadata?: Record<string, unknown>;
}

function encodeVector(values: number[] | null): string | null {
  if (!values) return null;
  // pgvector accepts a textual literal "[v1,v2,...]" on insert via PostgREST.
  // Keeping this centralized avoids leaking vector formatting into services.
  return `[${values.join(",")}]`;
}

export async function insertKnowledgeChunks(
  supabase: SupabaseClient,
  rows: InsertKnowledgeChunkRow[]
): Promise<number> {
  if (rows.length === 0) return 0;

  const payload = rows.map((r) => ({
    document_id: r.document_id,
    chunk_index: r.chunk_index,
    chunk_text: r.chunk_text,
    embedding: encodeVector(r.embedding),
    metadata: r.metadata ?? {},
  }));

  const { error, count } = await supabase
    .from("knowledge_chunks")
    .insert(payload, { count: "exact" });

  if (error) throw error;
  return count ?? rows.length;
}

export interface MatchKnowledgeChunksParams {
  queryEmbedding: number[];
  matchCount: number;
  docTypes?: string[];
}

// Thin RPC wrapper. Keeping the wire shape (snake_case) and the calling
// convention in one place makes it cheap to adapt if we ever swap RPC names
// or add new filter args.
export async function matchKnowledgeChunks(
  supabase: SupabaseClient,
  params: MatchKnowledgeChunksParams
): Promise<DbKnowledgeChunkMatch[]> {
  const { data, error } = await supabase.rpc("match_knowledge_chunks", {
    query_embedding: encodeVector(params.queryEmbedding),
    match_count: params.matchCount,
    p_doc_types: params.docTypes ?? null,
  });

  if (error) throw error;
  return (data as DbKnowledgeChunkMatch[]) ?? [];
}
