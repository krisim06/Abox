import { createClient } from "@/lib/supabase/server";
import { mapDbGenerationJob } from "@/lib/mappers";
import {
  findSupportedModel,
  getDefaultModelFor,
  type GenerationModelSpec,
} from "@/lib/ai/providers";
import { insertGenerationJob } from "@/lib/db/generation-jobs";
import { getCurrentUser } from "@/lib/auth";
import { analyzePrompt } from "@/lib/ai/analysis";
import { buildGenerationPlan } from "@/lib/ai/planning";
import { retrieveSimilarChunks } from "@/lib/ai/retrieval";
import { MissingEmbeddingApiKeyError } from "@/lib/ai/embeddings";
import type {
  AssetType,
  GenerationJob,
  GenerationParams,
  GenerationPlan,
  KnowledgeChunkMatch,
  ServiceResult,
} from "@/types";

// Mirrors the migration's CHECK constraint (1..4000). We validate here too so
// callers get a clean error instead of a Postgres constraint violation.
const PROMPT_MIN_LENGTH = 1;
const PROMPT_MAX_LENGTH = 4000;

// Cap params JSON size server-side so a client can't push a huge blob into
// jsonb. Raised from 8KB to 16KB to accommodate the persisted plan, which
// can be up to ~2KB for 5 retrieved chunks.
const MAX_PARAMS_BYTES = 16 * 1024;

// Top-k for retrieval during planning. Kept small per docs/rag.md §9.
const PLAN_RETRIEVAL_TOP_K = 5;

export interface CreateGenerationJobInput {
  prompt: string;
  assetType?: AssetType;
  provider?: string;
  model?: string;
  params?: GenerationParams;
}

export interface CreateGenerationJobOutput {
  job: GenerationJob;
  plan: GenerationPlan;
}

// Orchestrator for POST /api/generate.
//
// Flow (docs/ai-system.md §3):
//   authenticate
//     -> validate/normalize input
//     -> analyze prompt
//     -> optional retrieval
//     -> build plan
//     -> persist job (with plan attached to params)
//     -> return { job, plan }
//
// What it intentionally does NOT do (explicit scope for Phase 3):
// - Create a `contents` row. The contents table is public-readable and has
//   NOT NULL title/image_url/prompt; creating a placeholder would leak
//   half-baked rows. `generation_jobs` remains the placeholder until a
//   worker finalizes it and sets output_content_id.
// - Rewrite prompts via an LLM. The planner composes a deterministic
//   revisedPrompt for v1. An LLM rewrite belongs behind a versioned
//   planner v2.
// - Evaluate or retry. Phase 4.
export async function createGenerationJob(
  input: CreateGenerationJobInput
): Promise<ServiceResult<CreateGenerationJobOutput>> {
  // Step 1) Authorization. Treat the client as untrusted until proven otherwise.
  const user = await getCurrentUser();
  if (!user) {
    return {
      success: false,
      error: "You must be signed in to start a generation",
      errorCode: "UNAUTHENTICATED",
    };
  }

  // Step 2) Normalize inputs once so every downstream check uses the same values.
  const prompt = input.prompt?.trim() ?? "";
  const assetType: AssetType = input.assetType ?? "image";
  const userParams = input.params ?? {};

  if (prompt.length < PROMPT_MIN_LENGTH || prompt.length > PROMPT_MAX_LENGTH) {
    return {
      success: false,
      error: `Prompt must be between ${PROMPT_MIN_LENGTH} and ${PROMPT_MAX_LENGTH} characters`,
      errorCode: "INVALID_PROMPT",
    };
  }

  // Step 3) Resolve model.
  //
  // If the client specified (provider, model) we enforce the allowlist.
  // Otherwise we pick the default model for the asset type. Either way, we
  // never write a queued row without a resolvable dispatch target.
  let modelSpec: GenerationModelSpec | null;
  if (input.provider || input.model) {
    const p = input.provider?.trim().toLowerCase() ?? "";
    const m = input.model?.trim() ?? "";
    if (!p || !m) {
      return {
        success: false,
        error: "Both provider and model must be specified when pinning a model",
        errorCode: "UNSUPPORTED_MODEL",
      };
    }
    modelSpec = findSupportedModel(p, m);
  } else {
    modelSpec = getDefaultModelFor(assetType);
  }
  if (!modelSpec) {
    return {
      success: false,
      error:
        input.provider || input.model
          ? "Unsupported provider or model"
          : `No default model is configured for asset type '${assetType}'`,
      errorCode: "UNSUPPORTED_MODEL",
    };
  }

  // Step 4) Defense-in-depth on user-provided params before we merge the plan.
  if (userParams && typeof userParams !== "object") {
    return {
      success: false,
      error: "Invalid params payload",
      errorCode: "INVALID_PARAMS",
    };
  }

  // Step 5) Analyze the prompt. Deterministic, cheap, always runs.
  const analysis = analyzePrompt(prompt, { assetType });

  // Step 6) Optional retrieval. Tolerant of failures: if the embedding
  // provider is unavailable (e.g., OPENAI_API_KEY missing in dev), we log
  // and continue with an empty context. Retrieval is an enhancement, not a
  // hard dependency for creation (docs/rag.md §9).
  let retrievedChunks: KnowledgeChunkMatch[] = [];
  if (analysis.needsRetrieval) {
    try {
      retrievedChunks = await retrieveSimilarChunks({
        query: prompt,
        topK: PLAN_RETRIEVAL_TOP_K,
        docTypes: analysis.retrievalTargets,
      });
    } catch (err) {
      if (err instanceof MissingEmbeddingApiKeyError) {
        // Expected in environments without an embedding key. Keep going.
        console.warn(
          "Retrieval skipped: embedding provider is not configured"
        );
      } else {
        // Log and degrade; do not fail the job creation for a retrieval
        // hiccup. The absence of context is itself an eval signal
        // (docs/evals.md §4 Retrieval - empty retrieval frequency).
        console.error("Retrieval failed, continuing without context:", err);
      }
    }
  }

  // Step 7) Build the plan. Pure function.
  const plan = buildGenerationPlan({
    prompt,
    analysis,
    retrievedChunks,
    modelHint: { provider: modelSpec.provider, model: modelSpec.model },
  });

  // Step 8) Merge user params with the plan and size-check the final payload.
  // The plan lives under a reserved `plan` key so user-supplied params never
  // overwrite it; if a user param happens to be named `plan` we drop it
  // rather than let them spoof provenance.
  const mergedParams: Record<string, unknown> = {
    ...userParams,
    plan,
  };
  try {
    const serialized = JSON.stringify(mergedParams);
    if (serialized.length > MAX_PARAMS_BYTES) {
      return {
        success: false,
        error: "Params payload too large",
        errorCode: "PARAMS_TOO_LARGE",
      };
    }
  } catch {
    return {
      success: false,
      error: "Params must be JSON-serializable",
      errorCode: "INVALID_PARAMS",
    };
  }

  // Step 9) Persist. The DB layer owns the raw insert; we own the shape.
  const supabase = await createClient();
  try {
    const row = await insertGenerationJob(supabase, {
      user_id: user.id,
      provider: modelSpec.provider,
      model: modelSpec.model,
      prompt,
      params: mergedParams,
    });

    return {
      success: true,
      data: { job: mapDbGenerationJob(row), plan },
    };
  } catch (err) {
    console.error("Failed to create generation job:", err);
    return {
      success: false,
      error: "Failed to create generation job",
      errorCode: "DB_ERROR",
    };
  }
}
