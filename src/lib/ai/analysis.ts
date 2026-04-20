import type {
  AssetType,
  PromptAnalysis,
  RetrievalTarget,
} from "@/types";

// Request analyzer.
//
// MVP posture (per docs/ai-system.md §4 and the task brief):
// - deterministic, LLM-free, dependency-free
// - single call, single allocation, O(n) scan
// - fast and predictable so it can run on every create request
//
// This module is the seam. The signature `analyzePrompt(prompt, assetType)`
// is the contract a future LLM-backed classifier will fulfill. No caller
// should reach inside the heuristic tables.

// Keep the keyword lists short and high-signal. We are not trying to capture
// every style word — we are trying to decide whether style retrieval is
// worth running. Long lists dilute precision and make the analyzer harder
// to reason about in reviews.
const STYLE_KEYWORDS: ReadonlyArray<string> = [
  "dreamy",
  "city pop",
  "city-pop",
  "citypop",
  "editorial",
  "minimal",
  "minimalist",
  "cinematic",
  "retro",
  "vaporwave",
  "noir",
  "pastel",
  "neon",
  "polaroid",
  "film grain",
  "gradient",
  "album cover",
  "poster",
  "vintage",
  "anime",
  "studio ghibli",
  "pixar",
];

// Policy-sensitive vocabulary. Hitting any of these means we retrieve policy
// docs and raise safetyMode to 'strict'. The generator layer (later) is
// expected to treat strict mode as "apply stricter filters / refuse if
// clearly disallowed".
const SENSITIVE_KEYWORDS: ReadonlyArray<string> = [
  "celebrity",
  "politician",
  "president",
  "real person",
  "likeness of",
  "nude",
  "naked",
  "nsfw",
  "violent",
  "violence",
  "gore",
  "blood",
  "weapon",
  "gun",
  "knife",
  "child",
  "minor",
];

// A prompt this short is almost certainly under-specified; prompt templates
// tend to help. Threshold is deliberately conservative so we don't retrieve
// templates for well-written prompts.
const SHORT_PROMPT_WORD_THRESHOLD = 4;

function countWords(text: string): number {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function findHits(haystack: string, needles: ReadonlyArray<string>): string[] {
  const hits: string[] = [];
  for (const n of needles) {
    if (haystack.includes(n)) hits.push(n);
  }
  return hits;
}

export interface AnalyzePromptOptions {
  assetType?: AssetType;
}

export function analyzePrompt(
  prompt: string,
  options: AnalyzePromptOptions = {}
): PromptAnalysis {
  const assetType: AssetType = options.assetType ?? "image";
  const lower = (prompt ?? "").toLowerCase();

  const styleHits = findHits(lower, STYLE_KEYWORDS);
  const sensitiveHits = findHits(lower, SENSITIVE_KEYWORDS);
  const isShort = countWords(prompt) <= SHORT_PROMPT_WORD_THRESHOLD;

  const retrievalTargets: RetrievalTarget[] = [];
  if (styleHits.length > 0) retrievalTargets.push("style_guide");
  if (sensitiveHits.length > 0) retrievalTargets.push("policy");
  if (isShort) retrievalTargets.push("prompt_template");

  return {
    assetType,
    needsRetrieval: retrievalTargets.length > 0,
    retrievalTargets,
    safetyMode: sensitiveHits.length > 0 ? "strict" : "standard",
    // Deduplicate style hits so the plan stays clean if a prompt repeats a
    // term (e.g., "dreamy dreamy city pop").
    styleHints: Array.from(new Set(styleHits)),
  };
}
