import type {
  FactCheckResult,
  FullStoryResult,
  SourceIntelResult,
} from "@/lib/types";
import { MIN_TEXT_CHARS } from "./FullStory";

// The report's section registry — the ONE place that says what can go into the
// downloadable report and when it's available. Both the section-06 checklist
// (ReportBuilder) and the printed document (PrintReport) consume this, so the
// two can't drift: a section grayed out here is a section absent there.
//
// Availability mirrors each screen's own guards: 01/02 always exist once an
// analysis succeeded; 03/04/05 must have been run (their lifted result is the
// proof) — until then they're listed but grayed, with an honest hint why.

export type ReportSectionKey =
  | "source"
  | "spectrum"
  | "transcript"
  | "provenance"
  | "factcheck"
  | "fullstory";

export interface ReportSectionMeta {
  key: ReportSectionKey;
  ref: string; // the tool screen this comes from, "01".."05"
  label: string;
  blurb: string; // what this contributes to the report
}

export const REPORT_SECTIONS: ReportSectionMeta[] = [
  {
    key: "source",
    ref: "01",
    label: "Source",
    blurb: "Title, outlet, author, date, link, length.",
  },
  {
    key: "spectrum",
    ref: "02",
    label: "The Spectrum",
    blurb: "Composition by category + at-a-glance signals.",
  },
  {
    key: "transcript",
    ref: "02",
    label: "Transcript",
    blurb: "Every sentence, labeled claim / opinion / BS / neutral.",
  },
  {
    key: "provenance",
    ref: "03",
    label: "Provenance",
    blurb: "Outlet ownership, money, leaning, author, paper trail.",
  },
  {
    key: "factcheck",
    ref: "04",
    label: "Fact Check",
    blurb: "Each checked claim, its verdict, and the evidence.",
  },
  {
    key: "fullstory",
    ref: "05",
    label: "The Full Picture",
    blurb: "Coverage gaps and framing vs other outlets.",
  },
];

export interface ReportSectionState {
  available: boolean;
  hint: string | null; // why it's grayed out — null when available
}

const ALWAYS: ReportSectionState = { available: true, hint: null };

export function getReportSectionStates(args: {
  hasArticle: boolean;
  claimCount: number;
  textLength: number;
  intel: SourceIntelResult | null;
  factCheck: FactCheckResult | null;
  fullStory: FullStoryResult | null;
}): Record<ReportSectionKey, ReportSectionState> {
  return {
    source: ALWAYS,
    spectrum: ALWAYS,
    transcript: ALWAYS,
    provenance: args.intel
      ? ALWAYS
      : {
          available: false,
          hint: args.hasArticle
            ? "Not yet revealed — run 03 · Provenance above."
            : "Link-only — pasted text has no source to trace.",
        },
    factcheck: args.factCheck
      ? ALWAYS
      : {
          available: false,
          hint:
            args.claimCount === 0
              ? "No checkable claims were found in this piece."
              : "Not yet revealed — run 04 · Fact Check above.",
        },
    fullstory: args.fullStory
      ? ALWAYS
      : {
          available: false,
          hint:
            args.textLength < MIN_TEXT_CHARS
              ? "Too short to compare against other coverage."
              : "Not yet revealed — run 05 · The Full Picture above.",
        },
  };
}

// What actually goes into the report: checked AND available. Defined once so
// the checklist's count and the printed document agree by construction.
export function effectiveSelection(
  checked: Record<ReportSectionKey, boolean>,
  states: Record<ReportSectionKey, ReportSectionState>,
): Record<ReportSectionKey, boolean> {
  const out = {} as Record<ReportSectionKey, boolean>;
  for (const meta of REPORT_SECTIONS) {
    out[meta.key] = checked[meta.key] && states[meta.key].available;
  }
  return out;
}

// Everything starts checked; effective inclusion is `checked && available`,
// so a section revealed later joins the report pre-checked with no effects.
export function defaultReportSelection(): Record<ReportSectionKey, boolean> {
  return {
    source: true,
    spectrum: true,
    transcript: true,
    provenance: true,
    factcheck: true,
    fullstory: true,
  };
}
