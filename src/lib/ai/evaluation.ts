import type {
  EvaluationReason,
  EvaluationResult,
  GenerationJob,
  GenerationOutput,
  GenerationPlan,
  RetryCategory,
} from "@/types";

// Evaluator v1.
//
// MVP posture (docs/ai-system.md §8):
// - deterministic, LLM-free
// - check that generation completed successfully
// - check that asset exists and has plausible shape
// - check that metadata is attached
// - emit a reason-coded EvaluationResult
//
// MVP posture (docs/ai-system.md §9):
// - retryRecommended is set ONLY when the reason maps to one of three
//   narrow categories: empty/invalid asset, provider timeout, malformed
//   result. Every other rejection is a hard fail with no retry.

const MIN_REASONABLE_BYTES = 1024; // below 1 KB is almost certainly empty
const ACCEPTED_SCORE = 0.9;
const SOFT_REJECT_SCORE = 0.3;
const HARD_REJECT_SCORE = 0.0;

function isPlausibleImageUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function isImageContentType(ct: string | null | undefined): boolean {
  if (!ct) return true; // absence is tolerated; evaluators only check when present
  return ct.toLowerCase().startsWith("image/");
}

export interface EvaluateGenerationOutputInput {
  job: GenerationJob;
  plan: GenerationPlan | null;
  output: GenerationOutput;
}

export function evaluateGenerationOutput(
  input: EvaluateGenerationOutputInput
): EvaluationResult {
  const { output, plan } = input;
  const reasons: EvaluationReason[] = [];
  let retryCategory: RetryCategory | null = null;
  let score = ACCEPTED_SCORE;
  let verdict: EvaluationResult["verdict"] = "accepted";

  // 1) Provider-reported failures. These are the cleanest signal we can
  //    get; prefer them over heuristic checks.
  if (output.providerError) {
    const { code, message } = output.providerError;
    switch (code) {
      case "timeout":
        reasons.push({ code: "provider_timeout", detail: message });
        retryCategory = "provider_timeout";
        verdict = "rejected";
        score = HARD_REJECT_SCORE;
        break;
      case "malformed":
        reasons.push({ code: "malformed_result", detail: message });
        retryCategory = "malformed_result";
        verdict = "rejected";
        score = HARD_REJECT_SCORE;
        break;
      case "safety_rejection":
        // Safety rejections never retry; the fix is a prompt change, not
        // another attempt (docs/ai-system.md §9 narrow retry categories).
        reasons.push({ code: "safety_rejection", detail: message });
        retryCategory = null;
        verdict = "rejected";
        score = HARD_REJECT_SCORE;
        break;
      case "provider_error":
      default:
        reasons.push({ code: "provider_error", detail: message });
        retryCategory = null;
        verdict = "rejected";
        score = HARD_REJECT_SCORE;
        break;
    }
  }

  // 2) Asset presence + shape. Only check if the provider did not already
  //    report an error — otherwise we'd double-count reasons.
  if (!output.providerError) {
    if (!output.imageUrl) {
      reasons.push({ code: "missing_asset" });
      retryCategory = "empty_asset";
      verdict = "rejected";
      score = HARD_REJECT_SCORE;
    } else if (!isPlausibleImageUrl(output.imageUrl)) {
      reasons.push({
        code: "invalid_asset_url",
        detail: "output.imageUrl is not a valid http(s) URL",
      });
      retryCategory = "malformed_result";
      verdict = "rejected";
      score = HARD_REJECT_SCORE;
    } else if (!isImageContentType(output.contentType)) {
      reasons.push({
        code: "malformed_result",
        detail: `unexpected contentType: ${output.contentType}`,
      });
      retryCategory = "malformed_result";
      verdict = "rejected";
      score = HARD_REJECT_SCORE;
    } else if (
      typeof output.byteSize === "number" &&
      output.byteSize < MIN_REASONABLE_BYTES
    ) {
      reasons.push({
        code: "missing_asset",
        detail: `asset size ${output.byteSize}B < ${MIN_REASONABLE_BYTES}B`,
      });
      retryCategory = "empty_asset";
      verdict = "rejected";
      score = SOFT_REJECT_SCORE;
    }
  }

  // 3) Retrieval usefulness signal (non-blocking).
  //    If the plan said we needed retrieval but got nothing, surface it.
  //    This does NOT reject by itself — retrieval is optional — but it
  //    lowers the score so eval dashboards can track empty-retrieval rate.
  if (
    verdict === "accepted" &&
    plan &&
    plan.needsRetrieval &&
    plan.retrievedChunks.length === 0
  ) {
    reasons.push({
      code: "bad_retrieval",
      detail: "plan expected retrieval but no chunks were attached",
    });
    score = Math.min(score, 0.7);
  }

  if (verdict === "accepted" && reasons.length === 0) {
    reasons.push({ code: "ok" });
  }

  return {
    version: "v1",
    verdict,
    score,
    reasons,
    retryRecommended: retryCategory !== null,
    retryCategory,
    evaluatedAt: new Date().toISOString(),
  };
}
