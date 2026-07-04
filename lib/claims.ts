// Client-safe, dependency-free heuristic for ranking claims by how concrete —
// and therefore how checkable — they look. It is the tiebreaker for the model's
// salience score (lib/analyze.ts) and the sole ranker when salience is missing
// or uniform. Used by AnalyzeApp before it sends claims to /api/factcheck.
//
// Deliberately cheap and shallow: it rewards the surface markers of a verifiable
// fact (numbers, money, dates, named entities, quantity words), NOT semantic
// importance — judging importance is salience's job. No server-only imports here
// so a client component can call it.

const QUANTITY_WORDS =
  /\b(percent|million|billion|trillion|thousand|record|first|largest|highest|lowest|according to|more than|less than)\b/i;

export function claimConcreteness(text: string): number {
  let score = 0;

  // Digits — the strongest signal of a checkable fact (stats, counts, scores).
  if (/\d/.test(text)) score += 2;
  // Percentages or money.
  if (/[%$€£]/.test(text)) score += 1;
  // A 4-digit year (1900–2099) — a dated, checkable event.
  if (/\b(?:19|20)\d{2}\b/.test(text)) score += 1;
  // Quantity / superlative / attribution words.
  if (QUANTITY_WORDS.test(text)) score += 1;
  // Named entities: runs of 2+ capitalized words (people, orgs, places).
  const entities = text.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+/g);
  if (entities) score += Math.min(entities.length, 2);

  return score;
}
