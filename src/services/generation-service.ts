import { createClient } from "@/lib/supabase/server";
import { mapDbGenerationJob } from "@/lib/mappers";
import { findSupportedModel } from "@/lib/ai/providers";
import { insertGenerationJob } from "@/lib/db/generation-jobs";
import { getCurrentUser } from "@/lib/auth";
import type {
  GenerationJob,
  GenerationParams,
  ServiceResult,
} from "@/types";

// Mirrors the migration's CHECK constraint (1..4000). We validate here too so
// callers get a clean error instead of a Postgres constraint violation.
const PROMPT_MIN_LENGTH = 1;
const PROMPT_MAX_LENGTH = 4000;

// Cap params JSON size server-side so a client can't push a huge blob into
// jsonb. 8KB is well above any legitimate parameter set we expect.
const MAX_PARAMS_BYTES = 8 * 1024;

export interface CreateGenerationJobInput {
  provider: string;
  model: string;
  prompt: string;
  params?: GenerationParams;
}

// Orchestrator for POST /api/generate.
//
// Responsibilities (and only these):
// 1. Resolve authenticated user.
// 2. Validate and normalize input against the model allowlist.
// 3. Delegate persistence to the DB layer.
// 4. Map the DB row into the domain shape and return a ServiceResult.
//
// What it intentionally does NOT do:
// - create a `contents` row. The contents table requires image_url/title/prompt
//   NOT NULL and is public-readable; creating a placeholder there would leak
//   half-baked rows into the feed. A generation_jobs row IS the placeholder
//   until a worker finalizes it and sets output_content_id.
// - call any external model. Dispatch to providers is a later step handled by
//   a worker/queue that reads queued rows.
export async function createGenerationJob(
  input: CreateGenerationJobInput
): Promise<ServiceResult<GenerationJob>> {
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
  const provider = input.provider?.trim().toLowerCase() ?? "";
  const model = input.model?.trim() ?? "";
  const prompt = input.prompt?.trim() ?? "";
  const params = input.params ?? {};

  // Step 3) Validate against the server-side allowlist.
  // Rejecting unknown (provider, model) pairs early prevents us from ever
  // writing a queued row we can't dispatch.
  const supported = findSupportedModel(provider, model);
  if (!supported) {
    return {
      success: false,
      error: "Unsupported provider or model",
      errorCode: "UNSUPPORTED_MODEL",
    };
  }

  if (prompt.length < PROMPT_MIN_LENGTH || prompt.length > PROMPT_MAX_LENGTH) {
    return {
      success: false,
      error: `Prompt must be between ${PROMPT_MIN_LENGTH} and ${PROMPT_MAX_LENGTH} characters`,
      errorCode: "INVALID_PROMPT",
    };
  }

  // Defense in depth on params. Per-model validators will plug in here later.
  if (params && typeof params !== "object") {
    return {
      success: false,
      error: "Invalid params payload",
      errorCode: "INVALID_PARAMS",
    };
  }
  try {
    const serialized = JSON.stringify(params);
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

  // Step 4) Persist. The DB layer owns the raw insert; we own the shape.
  const supabase = await createClient();
  try {
    const row = await insertGenerationJob(supabase, {
      user_id: user.id,
      provider: supported.provider,
      model: supported.model,
      prompt,
      params,
    });

    return { success: true, data: mapDbGenerationJob(row) };
  } catch (err) {
    // Log the raw error for operators; return a user-safe message.
    console.error("Failed to create generation job:", err);
    return {
      success: false,
      error: "Failed to create generation job",
      errorCode: "DB_ERROR",
    };
  }
}
