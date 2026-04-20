export interface DbUser {
  id: string;
  username: string;
  bio: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface DbContent {
  id: string;
  user_id: string;
  title: string;
  image_url: string;
  prompt: string;
  model: string;
  seed: string | null;
  parent_content_id: string | null;
  created_at: string;
}

export interface DbLike {
  id: string;
  user_id: string;
  content_id: string;
  created_at: string;
}

export interface DbFollow {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
}

export type DbGenerationStatus =
  | "queued"
  | "running"
  | "succeeded"
  | "failed"
  | "canceled";

export type DbKnowledgeDocType =
  | "style_guide"
  | "policy"
  | "prompt_template";

export type DbKnowledgeVisibility = "system" | "public" | "private";

export interface DbKnowledgeDocument {
  id: string;
  owner_user_id: string | null;
  doc_type: DbKnowledgeDocType;
  title: string;
  body: string;
  visibility: DbKnowledgeVisibility;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface DbKnowledgeChunk {
  id: string;
  document_id: string;
  chunk_index: number;
  chunk_text: string;
  // pgvector is exposed as a string like "[0.1,0.2,...]" through PostgREST.
  // We normally do not read it back from the client; the retrieval RPC
  // returns similarity instead. Typed as string for completeness.
  embedding: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

// Row shape returned by the public.match_knowledge_chunks RPC.
export interface DbKnowledgeChunkMatch {
  chunk_id: string;
  document_id: string;
  chunk_index: number;
  chunk_text: string;
  chunk_metadata: Record<string, unknown>;
  doc_type: DbKnowledgeDocType;
  doc_title: string;
  doc_visibility: DbKnowledgeVisibility;
  similarity: number;
}

export interface DbGenerationJob {
  id: string;
  user_id: string;
  status: DbGenerationStatus;
  provider: string;
  provider_job_id: string | null;
  model: string;
  prompt: string;
  params: Record<string, unknown>;
  output_content_id: string | null;
  error_code: string | null;
  error_message: string | null;
  attempts: number;
  created_at: string;
  updated_at: string;
  started_at: string | null;
  finished_at: string | null;
}
