// Server-side allowlist of supported (provider, model) pairs.
//
// This is the trust boundary for user-submitted generation requests:
// we never let a client dictate which provider/model we will call.
// The runtime adapters that actually dispatch to external providers will
// consult this same registry so the two stay in sync.
//
// Adding a new model is intentionally a code change — not a config/DB change —
// so every supported model passes through code review.

export interface GenerationModelSpec {
  provider: string;
  model: string;
  // Human-readable label for future UI surfaces (model picker, logs).
  label: string;
  // Future: per-model param validators, cost hints, rate-limit budgets.
}

const SUPPORTED_MODELS: ReadonlyArray<GenerationModelSpec> = [
  {
    provider: "replicate",
    model: "black-forest-labs/flux-schnell",
    label: "FLUX.1 [schnell]",
  },
  {
    provider: "openai",
    model: "gpt-image-1",
    label: "GPT Image 1",
  },
];

export function findSupportedModel(
  provider: string,
  model: string
): GenerationModelSpec | null {
  const p = provider.trim().toLowerCase();
  const m = model.trim();
  return (
    SUPPORTED_MODELS.find((s) => s.provider === p && s.model === m) ?? null
  );
}

export function listSupportedModels(): ReadonlyArray<GenerationModelSpec> {
  return SUPPORTED_MODELS;
}
