import type { AssetType } from "@/types";

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
  // Which asset type this model produces. Used by the default resolver so a
  // request with no explicit model gets a sensible pick for its asset type.
  assetType: AssetType;
  // Marks the default within an asset type. Exactly one default per type.
  isDefault?: boolean;
  // Future: per-model param validators, cost hints, rate-limit budgets.
}

const SUPPORTED_MODELS: ReadonlyArray<GenerationModelSpec> = [
  {
    provider: "replicate",
    model: "black-forest-labs/flux-schnell",
    label: "FLUX.1 [schnell]",
    assetType: "image",
    isDefault: true,
  },
  {
    provider: "openai",
    model: "gpt-image-1",
    label: "GPT Image 1",
    assetType: "image",
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

// Resolve the default (provider, model) for an asset type when the client
// does not specify one. Returns null if no model is registered for the type,
// which the service layer turns into a clean validation error rather than
// silently substituting the wrong asset type.
export function getDefaultModelFor(
  assetType: AssetType
): GenerationModelSpec | null {
  const forType = SUPPORTED_MODELS.filter((m) => m.assetType === assetType);
  if (forType.length === 0) return null;
  return forType.find((m) => m.isDefault) ?? forType[0];
}

export function listSupportedModels(): ReadonlyArray<GenerationModelSpec> {
  return SUPPORTED_MODELS;
}
