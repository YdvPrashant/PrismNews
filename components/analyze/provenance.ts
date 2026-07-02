import type { Leaning, Reliability, RevenueType } from "@/lib/types";

// Visual tokens for the Provenance dossier. Same discipline as categories.ts /
// verdicts.ts: MUTED data colors from the already-validated set — the reserved
// accent (#FF3B00) never appears here, and no value is ever shown color-alone
// (the dial/meter always carry their text labels).
//
// The leaning scale follows the diverging rule: two opposing hues (the muted
// data blue and red already in the system) around a neutral grey midpoint —
// the lean-* steps are lighter tints of their pole. Only ONE marker is ever
// filled at a time, so adjacency separation doesn't apply.

export const LEANING_META: Record<
  Leaning,
  { label: string; color: string }
> = {
  left: { label: "Left", color: "#3B5BDB" },
  "lean-left": { label: "Lean left", color: "#7C8FE4" },
  center: { label: "Center", color: "#868E96" },
  "lean-right": { label: "Lean right", color: "#E98080" },
  right: { label: "Right", color: "#E03131" },
  unknown: { label: "Unknown", color: "#868E96" },
};

// The dial's stop order, left → right (unknown renders as "no marker").
export const LEANING_SCALE: Exclude<Leaning, "unknown">[] = [
  "left",
  "lean-left",
  "center",
  "lean-right",
  "right",
];

export const RELIABILITY_META: Record<
  Reliability,
  { label: string; color: string; onFill: string; mark: string }
> = {
  high: { label: "High", color: "#2F9E44", onFill: "#FFFFFF", mark: "✓" },
  mixed: { label: "Mixed", color: "#F08C00", onFill: "#0A0A0A", mark: "!" },
  low: { label: "Low", color: "#E03131", onFill: "#FFFFFF", mark: "✕" },
  unknown: { label: "Unknown", color: "#868E96", onFill: "#0A0A0A", mark: "?" },
};

// Meter order, weakest → strongest.
export const RELIABILITY_SCALE: Exclude<Reliability, "unknown">[] = [
  "low",
  "mixed",
  "high",
];

// "Follow the money" badge labels.
export const REVENUE_META: Record<RevenueType, { label: string }> = {
  "ad-driven": { label: "Ad-driven" },
  subscription: { label: "Subscription" },
  "billionaire-owned": { label: "Billionaire-owned" },
  "state-affiliated": { label: "State-affiliated" },
  nonprofit: { label: "Nonprofit" },
  mixed: { label: "Mixed funding" },
  unknown: { label: "Funding unknown" },
};
