import type {
  GenerationPlan,
  KnowledgeChunkMatch,
  PlanRetrievedChunk,
  PromptAnalysis,
} from "@/types";

// Plan builder.
//
// Pure function: (prompt, analysis, retrievedChunks, modelHint) -> plan.
// No I/O, no hidden state, no LLM call. Easy to unit test and cheap to run
// on every request. The plan is serializable jsonb (see types/planning.ts).
//
// Design notes:
// - We cap chunks and context summary aggressively. A plan is an audit
//   artifact, not a prompt-stuffing dump. Downstream executors are free to
//   pull the full chunk_text by id if they need more context.
// - `revisedPrompt` is a deterministic composition, not an LLM rewrite. An
//   LLM rewrite belongs behind a clearly named, optional step (planner v2).

const MAX_CHUNKS_IN_PLAN = 5;
const CONTEXT_SUMMARY_MAX_CHARS = 1200;
const CHUNK_TEXT_PREVIEW_CHARS = 400;

function previewChunk(text: string, limit: number): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  return normalized.length > limit
    ? normalized.slice(0, limit).trimEnd() + "…"
    : normalized;
}

function buildContextSummary(matches: KnowledgeChunkMatch[]): string {
  if (matches.length === 0) return "";
  const lines = matches.map((c) => {
    const preview = previewChunk(c.chunkText, CHUNK_TEXT_PREVIEW_CHARS);
    return `- [${c.docType}] ${c.docTitle}: ${preview}`;
  });
  const joined = lines.join("\n");
  return joined.length > CONTEXT_SUMMARY_MAX_CHARS
    ? joined.slice(0, CONTEXT_SUMMARY_MAX_CHARS).trimEnd() + "…"
    : joined;
}

function toPlanChunks(matches: KnowledgeChunkMatch[]): PlanRetrievedChunk[] {
  return matches.map((c) => ({
    chunkId: c.chunkId,
    documentId: c.documentId,
    docType: c.docType,
    docTitle: c.docTitle,
    similarity: c.similarity,
  }));
}

export interface BuildGenerationPlanInput {
  prompt: string;
  analysis: PromptAnalysis;
  retrievedChunks: KnowledgeChunkMatch[];
  modelHint: { provider: string; model: string };
}

export function buildGenerationPlan(
  input: BuildGenerationPlanInput
): GenerationPlan {
  const capped = input.retrievedChunks.slice(0, MAX_CHUNKS_IN_PLAN);
  const contextSummary = buildContextSummary(capped);

  // Deterministic revision: keep the original prompt verbatim so we never
  // silently alter user intent, then append a labeled context block only
  // when retrieval found something.
  const revisedPrompt =
    contextSummary.length === 0
      ? input.prompt
      : `${input.prompt}\n\nRelevant context:\n${contextSummary}`;

  return {
    version: "v1",
    assetType: input.analysis.assetType,
    originalPrompt: input.prompt,
    revisedPrompt,
    needsRetrieval: input.analysis.needsRetrieval,
    retrievalTargets: input.analysis.retrievalTargets,
    retrievedChunks: toPlanChunks(capped),
    contextSummary,
    safetyMode: input.analysis.safetyMode,
    candidateCount: 1,
    modelHint: input.modelHint,
  };
}
