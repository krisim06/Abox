import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { retrieveSimilarChunks } from "@/lib/ai/retrieval";
import { MissingEmbeddingApiKeyError } from "@/lib/ai/embeddings";
import type {
  SearchKnowledgeRequest,
  SearchKnowledgeResponse,
} from "@/types";

// Thin retrieval endpoint. Primary callers will be server-side planners, not
// the browser, but keeping a small HTTP surface lets us exercise the layer
// end-to-end during development.

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "You must be signed in", errorCode: "UNAUTHENTICATED" },
      { status: 401 }
    );
  }

  let body: SearchKnowledgeRequest;
  try {
    body = (await request.json()) as SearchKnowledgeRequest;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body", errorCode: "INVALID_JSON" },
      { status: 400 }
    );
  }

  const query = (body.query ?? "").trim();
  if (!query) {
    return NextResponse.json(
      { error: "query is required", errorCode: "INVALID_QUERY" },
      { status: 400 }
    );
  }

  try {
    const matches = await retrieveSimilarChunks({
      query,
      topK: body.topK,
      docTypes: body.docTypes,
    });

    const response: SearchKnowledgeResponse = { query, matches };
    return NextResponse.json(response, { status: 200 });
  } catch (err) {
    if (err instanceof MissingEmbeddingApiKeyError) {
      return NextResponse.json(
        {
          error: "Embedding provider is not configured",
          errorCode: "EMBEDDING_UNAVAILABLE",
        },
        { status: 503 }
      );
    }
    console.error("Knowledge search failed:", err);
    return NextResponse.json(
      { error: "Retrieval failed", errorCode: "RETRIEVAL_ERROR" },
      { status: 500 }
    );
  }
}
