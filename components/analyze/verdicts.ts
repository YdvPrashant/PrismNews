import type { Evidence, Verdict } from "@/lib/types";

// Visual tokens for fact-check verdicts. Like the category colors, these are
// deliberately MUTED so they read as data, not decoration — the reserved accent
// (#FF3B00) is never used here.
//
// Palette validated (dataviz six-checks, light surface) in display order
// green→red→amber→grey: CVD worst adjacent pair ΔE 15.2 (PASS ≥12). The old
// amber (#B7791F) failed deutan separation against the red at ΔE 6.7 — the
// current lighter amber (#F08C00) separates by lightness, which colorblind
// vision keeps. Amber + grey sit under 3:1 on paper, so verdict color never
// appears without its glyph (`mark`) and label. `onFill` picks ink or white
// for text sitting ON the solid fill, by the fill's luminance.
export interface VerdictMeta {
  label: string;
  blurb: string;
  bar: string; // solid fill — badge background / summary bar
  tint: string; // faint background
  text: string; // legible text color on paper
  onFill: string; // legible text color on the solid `bar` fill
  mark: string; // short glyph — the CVD-safe identity channel
}

export const VERDICT_META: Record<Verdict, VerdictMeta> = {
  supported: {
    label: "Supported",
    blurb: "Sources corroborate this claim.",
    bar: "#2F9E44",
    tint: "rgba(47, 158, 68, 0.10)",
    text: "#1E7A34",
    onFill: "#FFFFFF",
    mark: "✓",
  },
  disputed: {
    label: "Disputed",
    blurb: "Sources contradict this claim.",
    bar: "#E03131",
    tint: "rgba(224, 49, 49, 0.10)",
    text: "#B02525",
    onFill: "#FFFFFF",
    mark: "✕",
  },
  misleading: {
    label: "Misleading",
    blurb: "Some basis, but missing key context.",
    bar: "#F08C00",
    tint: "rgba(240, 140, 0, 0.12)",
    text: "#8A5A12",
    onFill: "#0A0A0A",
    mark: "!",
  },
  unverified: {
    label: "Unverified",
    blurb: "Not enough evidence to judge.",
    bar: "#868E96",
    tint: "rgba(134, 142, 150, 0.16)",
    text: "#6B7280",
    onFill: "#0A0A0A",
    mark: "?",
  },
};

// Order for summaries/legends: strongest signal first, unknown last.
export const VERDICT_ORDER: Verdict[] = [
  "supported",
  "disputed",
  "misleading",
  "unverified",
];

// How each piece of evidence relates to the claim.
export const STANCE_META: Record<
  Evidence["stance"],
  { label: string; mark: string; color: string }
> = {
  supports: { label: "Supports", mark: "✓", color: "#2F9E44" },
  contradicts: { label: "Contradicts", mark: "✕", color: "#E03131" },
  context: { label: "Context", mark: "·", color: "#6B7280" },
};
