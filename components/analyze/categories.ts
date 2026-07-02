import type { Category } from "@/lib/types";

// Visual tokens for the three signal categories + the neutral bucket.
//
// Brand note: our accent (#FF3B00) stays reserved for CTAs. These are deliberately
// MUTED red / blue / green so the coloring reads as *data* (an annotation layer),
// not as decoration competing with the accent. Neutral is a plain Swiss grey.
//
// Palette validated (dataviz six-checks, light surface) in display order
// red→grey→green→blue: CVD worst adjacent pair ΔE 38.6 (PASS ≥12), all fills
// ≥3:1 contrast on paper. Neutral is intentionally low-chroma — it *means*
// "no signal" — so it always ships with its label (legend rows, caption bar),
// never as color alone.
export interface CategoryMeta {
  label: string;
  blurb: string;
  bar: string; // solid fill — proportion bar & swatches
  tint: string; // faint background behind transcript text
  underline: string; // the colored rule under each classified sentence
  text: string; // legible text color for the label
}

export const CATEGORY_META: Record<Category, CategoryMeta> = {
  claim: {
    label: "Claim",
    blurb: "Checkable, falsifiable statements of fact.",
    bar: "#2F9E44",
    tint: "rgba(47, 158, 68, 0.10)",
    underline: "rgba(47, 158, 68, 0.55)",
    text: "#1E7A34",
  },
  opinion: {
    label: "Opinion",
    blurb: "Subjective judgments, interpretation, predictions.",
    bar: "#3B5BDB",
    tint: "rgba(59, 91, 219, 0.10)",
    underline: "rgba(59, 91, 219, 0.55)",
    text: "#31479E",
  },
  bs: {
    label: "BS",
    blurb: "Loaded, manipulative, or empty rhetoric.",
    bar: "#E03131",
    tint: "rgba(224, 49, 49, 0.10)",
    underline: "rgba(224, 49, 49, 0.55)",
    text: "#B02525",
  },
  neutral: {
    label: "Neutral",
    blurb: "Connective context — none of the above.",
    bar: "#868E96",
    tint: "rgba(134, 142, 150, 0.14)",
    underline: "rgba(134, 142, 150, 0.6)",
    text: "#6B7280",
  },
};

// Order used for BOTH the grouped composition bar and the legend, per the user's
// spec: BS (red) → Neutral (grey) → Claim (green) → Opinion (blue).
export const CATEGORY_ORDER: Category[] = ["bs", "neutral", "claim", "opinion"];
