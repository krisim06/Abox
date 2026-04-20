// Embedding provider abstraction.
//
// We keep the interface narrow on purpose: a single `embed(texts)` returning
// vectors in the same order. Callers never see provider-specific request
// shape, headers, or auth. This is the seam future providers (Cohere, local
// models, a cached proxy) will plug into.
//
// Dimension is a constant of the deployment, not a per-call parameter:
// a document's chunks must all share one embedding space for retrieval to
// make sense. Changing models is a migration, not a runtime choice.

export const EMBEDDING_DIMENSIONS = 1536;

export interface EmbeddingProvider {
  readonly model: string;
  readonly dimensions: number;
  embed(texts: string[]): Promise<number[][]>;
}

export class MissingEmbeddingApiKeyError extends Error {
  constructor() {
    super(
      "OPENAI_API_KEY is not set; embedding provider cannot make network calls."
    );
    this.name = "MissingEmbeddingApiKeyError";
  }
}

class OpenAIEmbeddingProvider implements EmbeddingProvider {
  readonly model = "text-embedding-3-small";
  readonly dimensions = EMBEDDING_DIMENSIONS;

  async embed(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new MissingEmbeddingApiKeyError();

    // OpenAI's embeddings endpoint accepts batched inputs and returns vectors
    // in the same order. We rely on that contract rather than reordering.
    const res = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        input: texts,
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(
        `Embedding request failed (${res.status}): ${body.slice(0, 500)}`
      );
    }

    const json = (await res.json()) as {
      data: { embedding: number[]; index: number }[];
    };

    // Defensive: sort by index so we're not at the mercy of server ordering.
    return json.data
      .slice()
      .sort((a, b) => a.index - b.index)
      .map((d) => d.embedding);
  }
}

let cachedProvider: EmbeddingProvider | null = null;

// Lazy singleton. We do not construct the provider at import time so the app
// can boot without OPENAI_API_KEY and only fail when embeddings are actually
// needed.
export function getEmbeddingProvider(): EmbeddingProvider {
  if (!cachedProvider) cachedProvider = new OpenAIEmbeddingProvider();
  return cachedProvider;
}

// Test/DI seam. Kept unexported from the public surface of the module barrel
// so production code reaches for getEmbeddingProvider() only.
export function __setEmbeddingProviderForTesting(
  provider: EmbeddingProvider | null
): void {
  cachedProvider = provider;
}
