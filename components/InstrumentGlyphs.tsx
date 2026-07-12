import type { ReactElement } from "react";
import { CATEGORY_META, CATEGORY_ORDER } from "./analyze/categories";
import { VERDICT_META } from "./analyze/verdicts";
import { COVERAGE_META } from "./analyze/coverage";

// Six small schematics — one per instrument row in <HowItWorks />. Quiet
// hairline linework (decorative, aria-hidden); the only color is the validated
// data palette doing exactly what it does on the real screens, always beside
// its glyph. No motion: these are marginalia, not attractions.
export type InstrumentKind =
  | "workspace"
  | "spectrum"
  | "provenance"
  | "factcheck"
  | "fullstory"
  | "report";

function Line({ className = "" }: { className?: string }) {
  return <span className={`block h-px bg-ink/25 ${className}`} />;
}

// Schematic proportions for the mini composition bar — icon geometry, not data
// (the honest numbers live in <Specimen />).
const SPECTRUM_GROWS = [2, 1.5, 4.5, 2];

const GLYPHS: Record<InstrumentKind, ReactElement> = {
  // Two panes side by side — the source next to the readable text.
  workspace: (
    <div className="flex h-full w-full gap-1.5">
      <div className="flex flex-1 flex-col justify-center gap-1.5 border border-ink/20 px-1.5">
        <Line className="w-full" />
        <Line className="w-2/3" />
        <Line className="w-full" />
      </div>
      <div className="flex flex-1 flex-col justify-center gap-1.5 border border-ink/20 px-1.5">
        <Line className="w-full" />
        <Line className="w-full" />
        <Line className="w-1/2" />
      </div>
    </div>
  ),

  // Text lines resolving into the four-category composition bar.
  spectrum: (
    <div className="flex h-full w-full flex-col justify-center gap-1.5">
      <Line className="w-full" />
      <Line className="w-3/4" />
      <div className="flex h-2.5 w-full gap-[2px]">
        {CATEGORY_ORDER.map((cat, i) => (
          <span
            key={cat}
            className={`${i === 0 ? "rounded-l-[2px]" : ""} ${
              i === CATEGORY_ORDER.length - 1 ? "rounded-r-[2px]" : ""
            }`}
            style={{
              flexGrow: SPECTRUM_GROWS[i],
              backgroundColor: CATEGORY_META[cat].bar,
            }}
          />
        ))}
      </div>
    </div>
  ),

  // A dossier: the entity, then its file.
  provenance: (
    <div className="flex h-full w-full flex-col justify-center gap-1.5">
      <div className="flex items-center gap-1.5">
        <span className="h-3 w-3 shrink-0 rounded-full border border-ink/40" />
        <Line className="flex-1" />
      </div>
      <Line className="ml-[18px] w-2/3" />
      <Line className="ml-[18px] w-1/2" />
    </div>
  ),

  // A verdict chip pinned to a claim.
  factcheck: (
    <div className="flex h-full w-full flex-col justify-center gap-1.5">
      <div className="flex items-center gap-1.5">
        <span
          className="flex h-4 w-6 shrink-0 items-center justify-center text-[9px] font-bold leading-none"
          style={{
            backgroundColor: VERDICT_META.supported.bar,
            color: VERDICT_META.supported.onFill,
          }}
        >
          {VERDICT_META.supported.mark}
        </span>
        <Line className="flex-1" />
      </div>
      <Line className="w-full" />
      <Line className="w-3/4" />
    </div>
  ),

  // The coverage checklist: covered, softened, missing.
  fullstory: (
    <div className="flex h-full w-full flex-col justify-center gap-1.5">
      {(["covered", "partial", "missing"] as const).map((status, i) => (
        <div key={status} className="flex items-center gap-1.5">
          <span
            className="w-3 shrink-0 text-center text-[9px] font-bold leading-none"
            style={{ color: COVERAGE_META[status].text }}
          >
            {COVERAGE_META[status].mark}
          </span>
          <Line className={["flex-1", "w-2/3", "w-1/2"][i]} />
        </div>
      ))}
    </div>
  ),

  // The report: a page of findings — two checked in, one left out.
  report: (
    <div className="flex h-full w-full flex-col justify-center gap-1.5 border border-ink/20 px-1.5 py-1.5">
      <div className="flex items-center gap-1.5">
        <span className="flex h-2.5 w-2.5 shrink-0 items-center justify-center bg-ink/80 text-[7px] font-bold leading-none text-paper">
          ✓
        </span>
        <Line className="flex-1" />
      </div>
      <div className="flex items-center gap-1.5">
        <span className="flex h-2.5 w-2.5 shrink-0 items-center justify-center bg-ink/80 text-[7px] font-bold leading-none text-paper">
          ✓
        </span>
        <Line className="w-2/3" />
      </div>
      <div className="flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 shrink-0 border border-ink/30" />
        <span className="block h-px w-1/2 bg-ink/15" />
      </div>
    </div>
  ),
};

export default function InstrumentGlyph({ kind }: { kind: InstrumentKind }) {
  return (
    <div aria-hidden className="h-14 w-full max-w-[7.5rem]">
      {GLYPHS[kind]}
    </div>
  );
}
