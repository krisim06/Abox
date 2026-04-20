import { NextResponse } from "next/server";
import { finalizeGenerationJob } from "@/services/generation-finalization-service";
import { MissingServiceRoleKeyError } from "@/lib/supabase/service-role";
import type {
  FinalizeGenerationJobRequest,
  FinalizeGenerationJobResponse,
} from "@/types";

// Internal finalize endpoint.
//
// This route is server-trusted: it is called by the generation worker (or a
// manual admin tool during MVP dev, per docs/ops.md §7) after the provider
// returns a result. End-user clients must never reach it.
//
// Authentication: a shared secret in the `x-abox-worker-secret` header,
// compared to `ABOX_WORKER_SECRET`. If the env var is unset we fail closed
// in all environments — there is no silent dev bypass.

const WORKER_SECRET_HEADER = "x-abox-worker-secret";

export async function POST(
  request: Request,
  ctx: { params: Promise<{ jobId: string }> }
) {
  const expected = process.env.ABOX_WORKER_SECRET;
  if (!expected) {
    return NextResponse.json(
      {
        error: "Finalize endpoint is disabled (ABOX_WORKER_SECRET not set)",
        errorCode: "WORKER_SECRET_NOT_CONFIGURED",
      },
      { status: 503 }
    );
  }
  const provided = request.headers.get(WORKER_SECRET_HEADER);
  if (!provided || provided !== expected) {
    return NextResponse.json(
      { error: "Unauthorized", errorCode: "UNAUTHORIZED" },
      { status: 401 }
    );
  }

  const { jobId } = await ctx.params;
  if (!jobId) {
    return NextResponse.json(
      { error: "jobId is required", errorCode: "INVALID_JOB_ID" },
      { status: 400 }
    );
  }

  let body: FinalizeGenerationJobRequest;
  try {
    body = (await request.json()) as FinalizeGenerationJobRequest;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body", errorCode: "INVALID_JSON" },
      { status: 400 }
    );
  }

  if (!body || typeof body.output !== "object" || body.output === null) {
    return NextResponse.json(
      { error: "output is required", errorCode: "INVALID_OUTPUT" },
      { status: 400 }
    );
  }

  try {
    const result = await finalizeGenerationJob({
      jobId,
      output: body.output,
      title: body.title,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, errorCode: result.errorCode },
        { status: httpStatusForErrorCode(result.errorCode) }
      );
    }

    const { evaluation, job, retriedJob } = result.data;
    const response: FinalizeGenerationJobResponse = {
      evaluation,
      job: {
        jobId: job.id,
        status: job.status,
        outputContentId: job.outputContentId,
      },
      retriedJob: retriedJob
        ? {
            jobId: retriedJob.id,
            status: retriedJob.status,
            outputContentId: retriedJob.outputContentId,
          }
        : undefined,
    };
    return NextResponse.json(response, { status: 200 });
  } catch (err) {
    if (err instanceof MissingServiceRoleKeyError) {
      return NextResponse.json(
        {
          error: "Service-role credentials are not configured",
          errorCode: "SERVICE_ROLE_NOT_CONFIGURED",
        },
        { status: 503 }
      );
    }
    console.error("Finalize route failed:", err);
    return NextResponse.json(
      { error: "Internal error", errorCode: "FINALIZE_ERROR" },
      { status: 500 }
    );
  }
}

function httpStatusForErrorCode(code: string | undefined): number {
  switch (code) {
    case "JOB_NOT_FOUND":
      return 404;
    case "JOB_ALREADY_TERMINAL":
      return 409;
    case "INVALID_OUTPUT":
    case "INVALID_JOB_ID":
    case "INVALID_JSON":
      return 400;
    case "FINALIZE_ERROR":
      return 500;
    default:
      return 400;
  }
}
