// Domain types for the evaluation + retry layer.
//
// Everything here is serializable jsonb: EvaluationResult is persisted under
// generation_jobs.params.evaluation, and retry linkage is persisted under
// generation_jobs.params.retry_of. Version the shape explicitly so we can
// evolve reason codes without breaking historical rows.

// Canonical reason codes. Vocabulary follows docs/evals.md §7 "failure
// taxonomy" so that eval dashboards and manual review use one shared set.
export type EvaluationReasonCode =
  | "ok"
  | "missing_asset"
  | "invalid_asset_url"
  | "malformed_result"
  | "provider_timeout"
  | "provider_error"
  | "low_quality_result"
  | "safety_rejection"
  | "bad_retrieval";

// Verdict is the binary accept/reject at the evaluator level.
// Retry decisioning is separate (retry-policy.ts) so "rejected" does not
// automatically imply "retry".
export type EvaluationVerdict = "accepted" | "rejected";

// Narrow retry categories explicitly enumerated in docs/ai-system.md §9.
// Anything outside this set is a hard reject with no retry.
export type RetryCategory =
  | "empty_asset"
  | "provider_timeout"
  | "malformed_result";

export interface EvaluationReason {
  code: EvaluationReasonCode;
  detail?: string;
}

export interface EvaluationResult {
  version: "v1";
  verdict: EvaluationVerdict;
  // 0..1. Treated as coarse-grained for now: 0 on hard fail, 0.5 on soft
  // issues, ~0.9 on pass. We intentionally avoid precise scoring until an
  // LLM-based evaluator replaces the heuristic one.
  score: number;
  reasons: EvaluationReason[];
  retryRecommended: boolean;
  retryCategory: RetryCategory | null;
  evaluatedAt: string;
}

// Shape supplied by the worker/finalizer after executing the provider.
// Kept narrow: what the evaluator actually needs to judge completion.
export interface GenerationOutput {
  imageUrl?: string | null;
  contentType?: string | null;
  byteSize?: number | null;
  // Optional hint that the provider already told us it failed. Lets the
  // evaluator classify timeouts/malformed-results without guessing.
  providerError?: {
    code: "timeout" | "provider_error" | "malformed" | "safety_rejection";
    message?: string;
  } | null;
}

export interface RetryDecision {
  retry: boolean;
  reason: string;
  nextAttemptNumber: number;
  category: RetryCategory | null;
}

// Shape of params.retry_of when a retry child is created.
export interface RetryOfRecord {
  originalJobId: string;
  originalAttempts: number;
  retryCategory: RetryCategory;
  evaluation: EvaluationResult;
}

// ---------------------------------------------------------------------------
// API contract — POST /api/generate/:jobId/finalize
// ---------------------------------------------------------------------------
//
// This endpoint is server-internal: it expects a shared worker secret in
// the `x-abox-worker-secret` header. End-user clients must never call it.

export interface FinalizeGenerationJobRequest {
  output: GenerationOutput;
  // Optional override for the generated content title. If absent the
  // finalizer derives a short title from the prompt.
  title?: string;
}

export interface FinalizeGenerationJobResponseJob {
  jobId: string;
  status: "succeeded" | "failed" | "queued" | "running" | "canceled";
  outputContentId: string | null;
}

export interface FinalizeGenerationJobResponse {
  evaluation: EvaluationResult;
  job: FinalizeGenerationJobResponseJob;
  // Populated only when a retry child was created.
  retriedJob?: FinalizeGenerationJobResponseJob;
}
