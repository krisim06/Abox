import type { AssetType, GenerationPlan } from "./planning";

export type GenerationStatus =
  | "queued"
  | "running"
  | "succeeded"
  | "failed"
  | "canceled";

// Per-provider arguments (seed, steps, aspect_ratio, negative_prompt, etc.)
// are intentionally loosely typed here. The service layer validates the shape
// per model against a server-side allowlist before insert, so callers cannot
// smuggle arbitrary provider args.
export type GenerationParams = Record<string, unknown>;

export interface GenerationJob {
  id: string;
  userId: string;
  status: GenerationStatus;
  provider: string;
  providerJobId: string | null;
  model: string;
  prompt: string;
  params: GenerationParams;
  outputContentId: string | null;
  errorCode: string | null;
  errorMessage: string | null;
  attempts: number;
  createdAt: string;
  updatedAt: string;
  startedAt: string | null;
  finishedAt: string | null;
}

// ---------------------------------------------------------------------------
// API contract (POST /api/generate)
// ---------------------------------------------------------------------------
// These shapes are the stable boundary between clients and the server.
// They are intentionally narrower than GenerationJob so we can evolve internal
// fields (attempts, provider_job_id, error_code, ...) without breaking clients.

export interface CreateGenerationJobRequest {
  prompt: string;
  // Optional: the client may hint the asset type (matches docs/api-contracts).
  // Defaults to "image" at the service layer.
  assetType?: AssetType;
  // Optional: allow advanced clients to pin a specific (provider, model).
  // When absent, the orchestrator resolves a default from the allowlist
  // based on assetType. Unknown pairs are rejected up front.
  provider?: string;
  model?: string;
  // Optional extra provider arguments; merged into generation_jobs.params
  // alongside the generated plan.
  params?: GenerationParams;
}

export interface CreateGenerationJobResponse {
  jobId: string;
  status: GenerationStatus;
  provider: string;
  model: string;
  createdAt: string;
  // The structured plan that will drive generation. Exposed so clients/UI can
  // render retrieval provenance ("we used these style guides") and so future
  // evals can diff plan-vs-output without needing a second endpoint.
  plan: GenerationPlan;
}
