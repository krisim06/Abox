import { NextResponse } from "next/server";
import { createKnowledgeDocument } from "@/services/knowledge-service";
import type {
  CreateKnowledgeDocumentRequest,
  CreateKnowledgeDocumentResponse,
} from "@/types";

// Thin HTTP adapter. Parses JSON, delegates to the service, maps errorCode
// to HTTP status. Any domain/validation change happens in the service layer
// and this route keeps working unchanged.

export async function POST(request: Request) {
  let body: CreateKnowledgeDocumentRequest;
  try {
    body = (await request.json()) as CreateKnowledgeDocumentRequest;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body", errorCode: "INVALID_JSON" },
      { status: 400 }
    );
  }

  const result = await createKnowledgeDocument({
    docType: body.docType,
    title: body.title,
    body: body.body,
    visibility: body.visibility,
    metadata: body.metadata,
  });

  if (!result.success) {
    return NextResponse.json(
      { error: result.error, errorCode: result.errorCode },
      { status: httpStatusForErrorCode(result.errorCode) }
    );
  }

  const response: CreateKnowledgeDocumentResponse = result.data;
  return NextResponse.json(response, { status: 201 });
}

function httpStatusForErrorCode(code: string | undefined): number {
  switch (code) {
    case "UNAUTHENTICATED":
      return 401;
    case "INVALID_DOC_TYPE":
    case "INVALID_VISIBILITY":
    case "INVALID_TITLE":
    case "INVALID_BODY":
    case "INVALID_JSON":
      return 400;
    case "EMBEDDING_UNAVAILABLE":
      return 503;
    case "EMBEDDING_ERROR":
    case "DB_ERROR":
      return 500;
    default:
      return 400;
  }
}
