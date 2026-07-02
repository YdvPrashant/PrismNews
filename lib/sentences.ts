// Deterministic sentence splitter.
//
// We split on the SERVER (not in the model) so the classifier only has to return a
// category per index — the exact original text, including whitespace and paragraph
// breaks, is preserved here. Joining the pieces back together reproduces the input.
//
// Known limitation (fine for v1): abbreviations like "U.S." or "Dr." can over-split.

const SENTENCE_RE =
  /[^\n]*?[.!?]+["'”’)\]]*(?=\s|$)|[^\n]*\n+|[^\n]+$/gu;

export function splitSentences(text: string): string[] {
  const parts: string[] = [];
  let match: RegExpExecArray | null;

  SENTENCE_RE.lastIndex = 0;
  while ((match = SENTENCE_RE.exec(text)) !== null) {
    const chunk = match[0];
    if (chunk.length === 0) {
      SENTENCE_RE.lastIndex++; // guard against zero-length loops
      continue;
    }
    if (chunk.trim().length === 0 && parts.length > 0) {
      // Whitespace-only run (e.g. a blank line) — attach to the previous sentence
      // so it isn't lost and doesn't become an empty segment.
      parts[parts.length - 1] += chunk;
    } else {
      parts.push(chunk);
    }
  }

  return parts;
}
