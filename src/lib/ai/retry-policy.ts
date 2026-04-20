import type {
  EvaluationResult,
  GenerationJob,
  GenerationPlan,
  RetryDecision,
} from "@/types";

// Retry policy v1 (docs/ai-system.md §9).
//
// Hard bound: at most one retry beyond the original attempt. A job starts
// with attempts=0; a retry child inherits attempts=parent.attempts+1, so
// attempts>=1 blocks further retries.
//
// This module is pure and deterministic: (job, evaluation) -> RetryDecision.
// No DB access, no side effects. The finalization service reads its output
// and performs persistence.

export const MAX_ATTEMPTS = 1;

export function decideRetry(
  job: GenerationJob,
  evaluation: EvaluationResult
): RetryDecision {
  if (!evaluation.retryRecommended || !evaluation.retryCategory) {
    return {
      retry: false,
      reason: "evaluator did not recommend retry",
      nextAttemptNumber: job.attempts,
      category: null,
    };
  }

  if (job.attempts >= MAX_ATTEMPTS) {
    return {
      retry: false,
      reason: `max attempts (${MAX_ATTEMPTS}) reached`,
      nextAttemptNumber: job.attempts,
      category: null,
    };
  }

  return {
    retry: true,
    reason: `retry-eligible category: ${evaluation.retryCategory}`,
    nextAttemptNumber: job.attempts + 1,
    category: evaluation.retryCategory,
  };
}

// Given the original plan and the evaluation that justified retrying,
// produce the adjusted plan for the retry child. Deterministic text append
// only — no LLM rewrite and no silent model swap (provider/model stays the
// same so evals can attribute quality differences to the retry hint alone).
export function adjustPlanForRetry(
  plan: GenerationPlan,
  evaluation: EvaluationResult
): GenerationPlan {
  const category = evaluation.retryCategory ?? "unknown";
  const hint = retryHintForCategory(category);
  return {
    ...plan,
    revisedPrompt: `${plan.revisedPrompt}\n\n[retry: ${category}] ${hint}`,
  };
}

function retryHintForCategory(category: string): string {
  switch (category) {
    case "empty_asset":
      return "Previous attempt produced no image. Please return a complete image asset.";
    case "provider_timeout":
      return "Previous attempt timed out. Keep the response concise and return a single image.";
    case "malformed_result":
      return "Previous attempt returned a malformed result. Return a single valid image URL with a proper image content type.";
    default:
      return "Please return a valid image asset.";
  }
}
