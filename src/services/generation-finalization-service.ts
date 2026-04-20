import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { mapDbGenerationJob } from "@/lib/mappers";
import {
  finalizeGenerationJob as dbFinalizeGenerationJob,
  getGenerationJobById,
  insertGenerationJob,
} from "@/lib/db/generation-jobs";
import { insertGeneratedContent } from "@/lib/db/contents";
import { evaluateGenerationOutput } from "@/lib/ai/evaluation";
import { adjustPlanForRetry, decideRetry } from "@/lib/ai/retry-policy";
import type {
  EvaluationResult,
  GenerationJob,
  GenerationOutput,
  GenerationPlan,
  RetryOfRecord,
  ServiceResult,
} from "@/types";

// Finalization orchestrator (docs/ai-system.md §7–9, docs/evals.md §3.1).
//
// Called from a trusted server path (worker, admin tool, finalize route).
// Composes: fetch job -> evaluate -> decide retry -> persist.
//
// Persistence rules:
// - Evaluation is written to params.evaluation on the original job, always.
// - On retry: original becomes 'failed' with error_code='retrying' and a
//   retry child job is created with attempts=parent.attempts+1. The child
//   carries params.retry_of so we can audit the linkage without a migration.
// - On accept: a contents row is created via service-role (this satisfies
//   the generation_jobs_succeeded_has_output CHECK), output_content_id is
//   set on the job, and status flips to 'succeeded'.
// - On non-retryable reject: status flips to 'failed'.

const TITLE_MAX_CHARS = 120;
const RETRY_ERROR_CODE = "retrying";

export interface FinalizeGenerationJobInput {
  jobId: string;
  output: GenerationOutput;
  title?: string;
}

export interface FinalizeGenerationJobOutput {
  evaluation: EvaluationResult;
  job: GenerationJob;
  retriedJob?: GenerationJob;
}

export async function finalizeGenerationJob(
  input: FinalizeGenerationJobInput
): Promise<ServiceResult<FinalizeGenerationJobOutput>> {
  const supabase = createServiceRoleClient();

  // Step 1) Load the job. The finalizer is the single writer for status
  // transitions, so any caller with a stale jobId is a bug to surface.
  const row = await getGenerationJobById(supabase, input.jobId);
  if (!row) {
    return {
      success: false,
      error: "Generation job not found",
      errorCode: "JOB_NOT_FOUND",
    };
  }
  const job = mapDbGenerationJob(row);

  // Step 2) Idempotency: if the job is already in a terminal state, do not
  // re-run the evaluator. Return a structured error so the worker knows to
  // stop retrying.
  if (
    job.status === "succeeded" ||
    job.status === "failed" ||
    job.status === "canceled"
  ) {
    return {
      success: false,
      error: `Job is already in terminal state '${job.status}'`,
      errorCode: "JOB_ALREADY_TERMINAL",
    };
  }

  // Step 3) Recover the plan from params, if present. The evaluator tolerates
  // a missing plan (older jobs pre-step-3); it just loses retrieval signal.
  const plan = extractPlan(job.params);

  // Step 4) Evaluate. Pure function.
  const evaluation = evaluateGenerationOutput({
    job,
    plan,
    output: input.output,
  });

  // Step 5) Retry decision. Pure function, bounded to one retry.
  const retryDecision = decideRetry(job, evaluation);

  const nowIso = new Date().toISOString();

  try {
    if (retryDecision.retry && plan) {
      return await handleRetry({
        jobId: input.jobId,
        originalJob: job,
        evaluation,
        plan,
        nowIso,
      });
    }

    if (evaluation.verdict === "accepted") {
      return await handleAccept({
        jobId: input.jobId,
        job,
        output: input.output,
        evaluation,
        titleOverride: input.title,
        nowIso,
      });
    }

    return await handleReject({
      jobId: input.jobId,
      evaluation,
      nowIso,
    });
  } catch (err) {
    console.error("Finalization failed:", err);
    return {
      success: false,
      error: "Failed to finalize generation job",
      errorCode: "FINALIZE_ERROR",
    };
  }
}

// -------------------- internal helpers --------------------

function extractPlan(
  params: Record<string, unknown> | null | undefined
): GenerationPlan | null {
  const raw = (params ?? {})["plan"];
  if (!raw || typeof raw !== "object") return null;
  // We trust the shape because the creation service wrote it. A future
  // schema change would bump plan.version and we'd branch here.
  return raw as GenerationPlan;
}

function deriveContentTitle(prompt: string, override?: string): string {
  const source = (override ?? prompt ?? "Generated image").trim();
  if (source.length <= TITLE_MAX_CHARS) return source;
  return source.slice(0, TITLE_MAX_CHARS - 1).trimEnd() + "…";
}

async function handleRetry(args: {
  jobId: string;
  originalJob: GenerationJob;
  evaluation: EvaluationResult;
  plan: GenerationPlan;
  nowIso: string;
}): Promise<ServiceResult<FinalizeGenerationJobOutput>> {
  const supabase = createServiceRoleClient();
  const retryCategory = args.evaluation.retryCategory;
  if (!retryCategory) {
    // Defensive: decideRetry guarantees this is non-null when retry=true.
    return {
      success: false,
      error: "Retry requested without a category",
      errorCode: "FINALIZE_ERROR",
    };
  }

  const adjustedPlan = adjustPlanForRetry(args.plan, args.evaluation);

  const retryOf: RetryOfRecord = {
    originalJobId: args.originalJob.id,
    originalAttempts: args.originalJob.attempts,
    retryCategory,
    evaluation: args.evaluation,
  };

  // 1) Create the retry child first. If this fails we haven't mutated the
  //    parent yet, so the caller can safely retry the whole finalize call.
  const childRow = await insertGenerationJob(supabase, {
    user_id: args.originalJob.userId,
    provider: args.originalJob.provider,
    model: args.originalJob.model,
    prompt: args.originalJob.prompt,
    params: {
      ...(args.originalJob.params ?? {}),
      plan: adjustedPlan,
      retry_of: retryOf,
    },
    attempts: args.originalJob.attempts + 1,
  });

  // 2) Mark the original as failed with a 'retrying' error_code so dashboards
  //    can distinguish retried failures from terminal ones.
  const parentRow = await dbFinalizeGenerationJob(supabase, args.jobId, {
    status: "failed",
    error_code: RETRY_ERROR_CODE,
    error_message: `Rejected by evaluator; retried as job ${childRow.id}`,
    finished_at: args.nowIso,
    params_patch: {
      evaluation: args.evaluation,
      retry_child_id: childRow.id,
    },
  });

  return {
    success: true,
    data: {
      evaluation: args.evaluation,
      job: mapDbGenerationJob(parentRow),
      retriedJob: mapDbGenerationJob(childRow),
    },
  };
}

async function handleAccept(args: {
  jobId: string;
  job: GenerationJob;
  output: GenerationOutput;
  evaluation: EvaluationResult;
  titleOverride?: string;
  nowIso: string;
}): Promise<ServiceResult<FinalizeGenerationJobOutput>> {
  const supabase = createServiceRoleClient();

  // Evaluator accepts -> imageUrl is present and plausible. Defensive check.
  if (!args.output.imageUrl) {
    return {
      success: false,
      error: "Accepted output must include imageUrl",
      errorCode: "FINALIZE_ERROR",
    };
  }

  // 1) Create the contents row. This satisfies the
  //    generation_jobs_succeeded_has_output CHECK and persists the asset for
  //    the feed / detail page.
  const contentRow = await insertGeneratedContent(supabase, {
    user_id: args.job.userId,
    title: deriveContentTitle(args.job.prompt, args.titleOverride),
    image_url: args.output.imageUrl,
    prompt: args.job.prompt,
    model: args.job.model,
  });

  // 2) Flip job to succeeded with the linked content id and record eval.
  const updated = await dbFinalizeGenerationJob(supabase, args.jobId, {
    status: "succeeded",
    output_content_id: contentRow.id,
    error_code: null,
    error_message: null,
    finished_at: args.nowIso,
    params_patch: { evaluation: args.evaluation },
  });

  return {
    success: true,
    data: {
      evaluation: args.evaluation,
      job: mapDbGenerationJob(updated),
    },
  };
}

async function handleReject(args: {
  jobId: string;
  evaluation: EvaluationResult;
  nowIso: string;
}): Promise<ServiceResult<FinalizeGenerationJobOutput>> {
  const supabase = createServiceRoleClient();

  const primary = args.evaluation.reasons[0];
  const errorCode = primary?.code ?? "low_quality_result";
  const errorMessage =
    primary?.detail ??
    `Evaluator rejected output: ${primary?.code ?? "unknown"}`;

  const updated = await dbFinalizeGenerationJob(supabase, args.jobId, {
    status: "failed",
    error_code: errorCode,
    error_message: errorMessage,
    finished_at: args.nowIso,
    params_patch: { evaluation: args.evaluation },
  });

  return {
    success: true,
    data: {
      evaluation: args.evaluation,
      job: mapDbGenerationJob(updated),
    },
  };
}
