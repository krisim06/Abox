import type { KnowledgeDocType } from "./knowledge";

// Domain types for the planning layer.
//
// The shapes are deliberately serializable: a GenerationPlan is persisted as
// jsonb inside generation_jobs.params.plan, so every field must survive a
// JSON round-trip with no functions, no class instances, no undefineds where
// null is meant.
//
// We version the plan explicitly so we can evolve fields without breaking
// older rows. Consumers must check `version` before reading structured fields.

// Asset type reuses the docs' taxonomy. Only "image" resolves to a default
// model today; the others are accepted for schema stability and will error at
// validation until providers exist.
export type AssetType = "image" | "video" | "audio";

// Safety mode drives how the downstream generator should treat the prompt.
// For now the analyzer chooses it deterministically from sensitive vocabulary.
export type SafetyMode = "standard" | "strict";

// Retrieval targets align with the seeded knowledge doc types so the analyzer
// and retrieval layer share one vocabulary.
export type RetrievalTarget = KnowledgeDocType;

export interface PromptAnalysis {
  assetType: AssetType;
  needsRetrieval: boolean;
  retrievalTargets: RetrievalTarget[];
  safetyMode: SafetyMode;
  styleHints: string[];
}

// A trimmed view of a retrieved chunk as it appears in the persisted plan.
// We intentionally do not store the full chunk_text here — that belongs in
// knowledge_chunks and can be re-fetched by chunkId when needed for auditing.
export interface PlanRetrievedChunk {
  chunkId: string;
  documentId: string;
  docType: RetrievalTarget;
  docTitle: string;
  similarity: number;
}

export interface GenerationPlan {
  version: "v1";
  assetType: AssetType;
  originalPrompt: string;
  revisedPrompt: string;
  needsRetrieval: boolean;
  retrievalTargets: RetrievalTarget[];
  retrievedChunks: PlanRetrievedChunk[];
  contextSummary: string;
  safetyMode: SafetyMode;
  candidateCount: number;
  modelHint: { provider: string; model: string };
}
