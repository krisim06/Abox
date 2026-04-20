import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { mapDbKnowledgeDocument } from "@/lib/mappers";
import { chunkText } from "@/lib/ai/chunking";
import {
  getEmbeddingProvider,
  MissingEmbeddingApiKeyError,
} from "@/lib/ai/embeddings";
import { insertKnowledgeDocument } from "@/lib/db/knowledge-documents";
import { insertKnowledgeChunks } from "@/lib/db/knowledge-chunks";
import type {
  CreateKnowledgeDocumentResponse,
  KnowledgeDocType,
  KnowledgeVisibility,
  ServiceResult,
} from "@/types";

// Orchestrator for POST /api/knowledge/documents.
//
// Responsibilities:
// 1. Resolve the authenticated user.
// 2. Validate + normalize input (doc type, visibility, length).
// 3. Persist the document (DB layer).
// 4. Chunk the body (AI layer).
// 5. Embed chunks in batches (AI layer).
// 6. Persist chunks + embeddings (DB layer).
// 7. Return a typed summary.
//
// What it intentionally does NOT do:
// - Create 'system' documents. Platform-owned reference material is seeded
//   out-of-band with the service-role key. Clients cannot forge system docs.
// - Run embedding in a background job. For MVP-sized docs (<200 KB) inline
//   is acceptable. Moving to a background worker is a known follow-up.

const SUPPORTED_DOC_TYPES: ReadonlyArray<KnowledgeDocType> = [
  "style_guide",
  "policy",
  "prompt_template",
];

// Mirrors DB CHECK bounds so we return a clean error before Postgres does.
const TITLE_MAX = 200;
const BODY_MAX = 200_000;
const EMBED_BATCH_SIZE = 64;

export interface CreateKnowledgeDocumentInput {
  docType: KnowledgeDocType;
  title: string;
  body: string;
  visibility: Exclude<KnowledgeVisibility, "system">;
  metadata?: Record<string, unknown>;
}

export async function createKnowledgeDocument(
  input: CreateKnowledgeDocumentInput
): Promise<ServiceResult<CreateKnowledgeDocumentResponse>> {
  const user = await getCurrentUser();
  if (!user) {
    return {
      success: false,
      error: "You must be signed in to add knowledge",
      errorCode: "UNAUTHENTICATED",
    };
  }

  const title = (input.title ?? "").trim();
  const body = (input.body ?? "").trim();
  const metadata = input.metadata ?? {};

  if (!SUPPORTED_DOC_TYPES.includes(input.docType)) {
    return {
      success: false,
      error: "Unsupported doc_type",
      errorCode: "INVALID_DOC_TYPE",
    };
  }

  if (input.visibility !== "public" && input.visibility !== "private") {
    return {
      success: false,
      error: "Visibility must be 'public' or 'private'",
      errorCode: "INVALID_VISIBILITY",
    };
  }

  if (!title || title.length > TITLE_MAX) {
    return {
      success: false,
      error: `Title is required and must be under ${TITLE_MAX} characters`,
      errorCode: "INVALID_TITLE",
    };
  }

  if (!body || body.length > BODY_MAX) {
    return {
      success: false,
      error: `Body is required and must be under ${BODY_MAX} characters`,
      errorCode: "INVALID_BODY",
    };
  }

  const supabase = await createClient();

  // Step 1) Persist the document under the current user.
  let documentRow;
  try {
    documentRow = await insertKnowledgeDocument(supabase, {
      owner_user_id: user.id,
      doc_type: input.docType,
      title,
      body,
      visibility: input.visibility,
      metadata,
    });
  } catch (err) {
    console.error("Failed to insert knowledge document:", err);
    return {
      success: false,
      error: "Failed to create knowledge document",
      errorCode: "DB_ERROR",
    };
  }

  // Step 2) Chunk the body. No DB involvement.
  const chunks = chunkText(body);
  if (chunks.length === 0) {
    // Should not happen given body non-empty check, but keep invariants tight.
    return {
      success: true,
      data: {
        document: mapDbKnowledgeDocument(documentRow),
        chunkCount: 0,
      },
    };
  }

  // Step 3) Embed in batches so a large document does not exceed provider
  // request limits. Order is preserved per batch.
  const provider = getEmbeddingProvider();
  const allEmbeddings: number[][] = [];
  try {
    for (let i = 0; i < chunks.length; i += EMBED_BATCH_SIZE) {
      const batch = chunks.slice(i, i + EMBED_BATCH_SIZE).map((c) => c.text);
      const vectors = await provider.embed(batch);
      if (vectors.length !== batch.length) {
        throw new Error("Embedding provider returned wrong count");
      }
      allEmbeddings.push(...vectors);
    }
  } catch (err) {
    if (err instanceof MissingEmbeddingApiKeyError) {
      return {
        success: false,
        error: "Embedding provider is not configured",
        errorCode: "EMBEDDING_UNAVAILABLE",
      };
    }
    console.error("Failed to embed chunks:", err);
    return {
      success: false,
      error: "Failed to embed document chunks",
      errorCode: "EMBEDDING_ERROR",
    };
  }

  // Step 4) Persist chunks with embeddings. ON DELETE CASCADE makes this safe
  // to retry after a failed embedding batch: the caller can delete the doc
  // and re-submit.
  try {
    await insertKnowledgeChunks(
      supabase,
      chunks.map((chunk, i) => ({
        document_id: documentRow.id,
        chunk_index: chunk.index,
        chunk_text: chunk.text,
        embedding: allEmbeddings[i] ?? null,
        metadata: {
          start_char: chunk.startChar,
          end_char: chunk.endChar,
        },
      }))
    );
  } catch (err) {
    console.error("Failed to insert knowledge chunks:", err);
    return {
      success: false,
      error: "Failed to persist document chunks",
      errorCode: "DB_ERROR",
    };
  }

  return {
    success: true,
    data: {
      document: mapDbKnowledgeDocument(documentRow),
      chunkCount: chunks.length,
    },
  };
}
