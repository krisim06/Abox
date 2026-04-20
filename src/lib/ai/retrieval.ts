import { createClient } from "@/lib/supabase/server";
import { mapDbKnowledgeChunkMatch } from "@/lib/mappers";
import { matchKnowledgeChunks } from "@/lib/db/knowledge-chunks";
import { getEmbeddingProvider } from "@/lib/ai/embeddings";
import type { KnowledgeChunkMatch, KnowledgeDocType } from "@/types";

// Retrieval orchestrator.
//
// This is the seam future generation planning will call. It composes
// embedding + vector RPC + mapping so callers need only supply a plain query.
// RLS on the underlying tables enforces visibility, so this function is safe
// to call with a user-scoped Supabase client.

export interface RetrieveSimilarChunksInput {
  query: string;
  topK?: number;
  docTypes?: KnowledgeDocType[];
}

const DEFAULT_TOP_K = 5;
const MAX_TOP_K = 20;
const MAX_QUERY_CHARS = 2000;

export async function retrieveSimilarChunks(
  input: RetrieveSimilarChunksInput
): Promise<KnowledgeChunkMatch[]> {
  const query = (input.query ?? "").trim();
  if (!query) return [];
  if (query.length > MAX_QUERY_CHARS) {
    // Retrieval queries should be short; if a caller hands us something
    // enormous it's almost certainly a bug (pasting a whole doc).
    throw new Error(`Retrieval query exceeds ${MAX_QUERY_CHARS} chars`);
  }

  const topK = Math.min(Math.max(input.topK ?? DEFAULT_TOP_K, 1), MAX_TOP_K);

  const provider = getEmbeddingProvider();
  const [embedding] = await provider.embed([query]);
  if (!embedding || embedding.length !== provider.dimensions) {
    throw new Error("Embedding provider returned an invalid vector");
  }

  const supabase = await createClient();
  const rows = await matchKnowledgeChunks(supabase, {
    queryEmbedding: embedding,
    matchCount: topK,
    docTypes: input.docTypes,
  });

  return rows.map(mapDbKnowledgeChunkMatch);
}
