import { NextResponse } from "next/server";
import { createGenerationJob } from "@/services/generation-service";
import type {
  CreateGenerationJobRequest,
  CreateGenerationJobResponse,
} from "@/types";

// Thin HTTP adapter:
// - parse JSON
// - delegate every decision to the service layer
// - map ServiceResult.errorCode to an HTTP status code
//
// No validation, auth, retrieval, or planning happens here (docs/rules.md §4).
// Route stays thin so the service is reusable from server actions, workers,
// or tests without copying HTTP plumbing.

export async function POST(request: Request) {
  let body: CreateGenerationJobRequest;
  try {
    body = (await request.json()) as CreateGenerationJobRequest;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body", errorCode: "INVALID_JSON" },
      { status: 400 }
    );
  }

  const result = await createGenerationJob({
    prompt: body.prompt,
    assetType: body.assetType,
    provider: body.provider,
    model: body.model,
    params: body.params,
  });

  if (!result.success) {
    return NextResponse.json(
      { error: result.error, errorCode: result.errorCode },
      { status: httpStatusForErrorCode(result.errorCode) }
    );
  }

  const { job, plan } = result.data;
  const response: CreateGenerationJobResponse = {
    jobId: job.id,
    status: job.status,
    provider: job.provider,
    model: job.model,
    createdAt: job.createdAt,
    plan,
  };

  // 202 Accepted: the request is queued for async processing; the client
  // should poll / subscribe to the job to observe progress.
  return NextResponse.json(response, { status: 202 });
}

function httpStatusForErrorCode(code: string | undefined): number {
  switch (code) {
    case "UNAUTHENTICATED":
      return 401;
    case "UNSUPPORTED_MODEL":
    case "INVALID_PROMPT":
    case "INVALID_PARAMS":
    case "PARAMS_TOO_LARGE":
    case "INVALID_JSON":
      return 400;
    case "DB_ERROR":
      return 500;
    default:
      return 400;
  }
}
