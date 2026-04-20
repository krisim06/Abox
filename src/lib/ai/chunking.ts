// Text chunking for retrieval.
//
// Design:
// - Character-window based with overlap. Simple, deterministic, dependency-free.
// - Prefers paragraph / sentence boundaries within the window to avoid cutting
//   mid-thought; falls back to a hard cut if no boundary is found.
// - Token-accurate chunking can replace this later; callers should not
//   depend on the exact boundary algorithm, only on the returned shape.

export interface TextChunk {
  index: number;
  text: string;
  startChar: number;
  endChar: number;
}

export interface ChunkOptions {
  maxChars?: number;
  overlap?: number;
}

const DEFAULTS = {
  maxChars: 1200,
  overlap: 150,
} as const;

// Boundary preference order (higher-quality breaks first).
const BOUNDARY_PATTERNS: RegExp[] = [
  /\n\n/g,
  /\. /g,
  /[?!]\s/g,
  /\n/g,
  /\s/g,
];

function findBestBreak(
  text: string,
  windowStart: number,
  windowEnd: number
): number {
  // Only look in the tail portion of the window so we don't emit tiny chunks.
  const searchStart = windowStart + Math.floor((windowEnd - windowStart) * 0.5);
  const slice = text.slice(searchStart, windowEnd);

  for (const pattern of BOUNDARY_PATTERNS) {
    pattern.lastIndex = 0;
    let lastMatch = -1;
    let m: RegExpExecArray | null;
    while ((m = pattern.exec(slice)) !== null) {
      lastMatch = m.index + m[0].length;
      if (pattern.lastIndex === m.index) pattern.lastIndex++;
    }
    if (lastMatch !== -1) return searchStart + lastMatch;
  }
  return windowEnd;
}

export function chunkText(text: string, options: ChunkOptions = {}): TextChunk[] {
  const maxChars = options.maxChars ?? DEFAULTS.maxChars;
  const overlap = Math.min(options.overlap ?? DEFAULTS.overlap, maxChars - 1);

  const normalized = text.replace(/\r\n/g, "\n").trim();
  if (!normalized) return [];

  if (normalized.length <= maxChars) {
    return [{ index: 0, text: normalized, startChar: 0, endChar: normalized.length }];
  }

  const chunks: TextChunk[] = [];
  let cursor = 0;
  let index = 0;

  while (cursor < normalized.length) {
    const windowEnd = Math.min(cursor + maxChars, normalized.length);
    const breakAt =
      windowEnd < normalized.length
        ? findBestBreak(normalized, cursor, windowEnd)
        : windowEnd;

    const piece = normalized.slice(cursor, breakAt).trim();
    if (piece) {
      chunks.push({
        index,
        text: piece,
        startChar: cursor,
        endChar: breakAt,
      });
      index++;
    }

    if (breakAt >= normalized.length) break;
    // Step forward with overlap so adjacent chunks share context. Guarantee
    // forward progress so we never loop on a pathological input.
    const nextCursor = Math.max(breakAt - overlap, cursor + 1);
    cursor = nextCursor;
  }

  return chunks;
}
