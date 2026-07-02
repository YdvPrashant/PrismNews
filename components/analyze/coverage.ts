import type { Completeness, CoverageStatus } from "@/lib/types";

// Visual tokens for "The Full Picture" coverage checklist. Same discipline as
// verdicts.ts: MUTED data colors from the already-validated set, glyph + label
// always beside the color, and the reserved accent (#FF3B00) never used here.
export interface CoverageMeta {
  label: string;
  blurb: string;
  bar: string; // solid fill — meter segments / legend chips
  tint: string; // faint background — status chips
  text: string; // legible text color on paper
  onFill: string; // legible text color ON the solid fill
  mark: string; // glyph — the CVD-safe identity channel
}

export const COVERAGE_META: Record<CoverageStatus, CoverageMeta> = {
  covered: {
    label: "Covered",
    blurb: "The article clearly reports this.",
    bar: "#2F9E44",
    tint: "rgba(47, 158, 68, 0.10)",
    text: "#1E7A34",
    onFill: "#FFFFFF",
    mark: "✓",
  },
  partial: {
    label: "Softened",
    blurb: "Mentioned, but under-specified or watered down.",
    bar: "#F08C00",
    tint: "rgba(240, 140, 0, 0.12)",
    text: "#8A5A12",
    onFill: "#0A0A0A",
    mark: "!",
  },
  missing: {
    label: "Missing",
    blurb: "Absent from the article entirely.",
    bar: "#E03131",
    tint: "rgba(224, 49, 49, 0.10)",
    text: "#B02525",
    onFill: "#FFFFFF",
    mark: "✕",
  },
};

export const COMPLETENESS_META: Record<
  Completeness,
  { label: string; blurb: string; color: string }
> = {
  complete: {
    label: "Tells the full story",
    blurb: "The article carries the facts other outlets report.",
    color: "#2F9E44",
  },
  "minor-gaps": {
    label: "Mostly complete",
    blurb: "The core is there, with a few details left out.",
    color: "#F08C00",
  },
  "major-gaps": {
    label: "Significant gaps",
    blurb: "Key parts of the story are softened or missing.",
    color: "#E03131",
  },
  unknown: {
    label: "Not enough coverage to judge",
    blurb: "Too little outside reporting was found to compare fairly.",
    color: "#868E96",
  },
};
