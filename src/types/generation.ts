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
  provider: string;
  model: string;
  prompt: string;
  params?: GenerationParams;
}

export interface CreateGenerationJobResponse {
  jobId: string;
  status: GenerationStatus;
  provider: string;
  model: string;
  createdAt: string;
}
