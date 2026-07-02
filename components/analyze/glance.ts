import type { Category, CategoryScore, Segment } from "@/lib/types";

// The "At a glance" derivations — one verdict + the derived signals about a
// piece. Pure and render-free so the composition column (ProportionBar) and
// the printable report (PrintReport) read from the same numbers.
export interface GlanceStats {
  verdict: { label: string; note: string };
  ratio: string; // opinion per unit of checkable fact, e.g. "1.4×"
  signal: number; // % of the text that is claim/opinion/bs (vs neutral filler)
  sentences: number;
  words: number;
  readMin: number;
}

export function deriveGlance(
  segments: Segment[],
  scores: CategoryScore[],
): GlanceStats {
  const byCategory = new Map(scores.map((s) => [s.category, s]));
  const pct = (c: Category) => byCategory.get(c)?.percent ?? 0;

  const claim = pct("claim");
  const opinion = pct("opinion");
  const bs = pct("bs");
  const signal = Math.min(100, claim + opinion + bs); // vs. neutral "filler"

  const verdict =
    signal === 0
      ? { label: "All neutral", note: "No claims, opinions, or rhetoric detected." }
      : bs >= 25
        ? { label: "Rhetoric-heavy", note: "A lot of loaded or empty phrasing." }
        : claim >= opinion
          ? { label: "Fact-led", note: "Mostly checkable statements." }
          : { label: "Opinion-led", note: "Interpretation outweighs fact." };

  const ratio =
    claim > 0 ? `${(opinion / claim).toFixed(1)}×` : opinion > 0 ? "∞" : "—";

  const words = segments.reduce(
    (n, s) => n + (s.text.trim().match(/\S+/g)?.length ?? 0),
    0,
  );
  const readMin = Math.max(1, Math.round(words / 200));

  return { verdict, ratio, signal, sentences: segments.length, words, readMin };
}
