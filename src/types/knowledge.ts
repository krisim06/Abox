// Domain types for the knowledge/RAG layer.
//
// These shapes are the stable contract between services, routes, and any
// future UI. They intentionally omit the raw embedding vector: embeddings are
// storage/retrieval concerns owned by the AI layer, not something the rest of
// the app should handle.

export type KnowledgeDocType =
  | "style_guide"
  | "policy"
  | "prompt_template";

export type KnowledgeVisibility = "system" | "public" | "private";

export interface KnowledgeDocument {
  id: string;
  ownerUserId: string | null;
  docType: KnowledgeDocType;
  title: string;
  body: string;
  visibility: KnowledgeVisibility;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// Result of a semantic retrieval call. Carries enough document context to
// render/cite without a second round trip.
export interface KnowledgeChunkMatch {
  chunkId: string;
  documentId: string;
  chunkIndex: number;
  chunkText: string;
  chunkMetadata: Record<string, unknown>;
  docType: KnowledgeDocType;
  docTitle: string;
  docVisibility: KnowledgeVisibility;
  similarity: number;
}

// ---------------------------------------------------------------------------
// API contract
// ---------------------------------------------------------------------------

export interface CreateKnowledgeDocumentRequest {
  docType: KnowledgeDocType;
  title: string;
  body: string;
  visibility: Exclude<KnowledgeVisibility, "system">;
  metadata?: Record<string, unknown>;
}

export interface CreateKnowledgeDocumentResponse {
  document: KnowledgeDocument;
  chunkCount: number;
}

export interface SearchKnowledgeRequest {
  query: string;
  topK?: number;
  docTypes?: KnowledgeDocType[];
}

export interface SearchKnowledgeResponse {
  query: string;
  matches: KnowledgeChunkMatch[];
}
