"use client";

import { motion, useReducedMotion } from "framer-motion";
import { EASE_OUT } from "@/components/brand";
import SpectrumRule from "@/components/SpectrumRule";
import CornerMarks from "@/components/CornerMarks";
import SectionHead from "./SectionHead";
import {
  effectiveSelection,
  REPORT_SECTIONS,
  type ReportSectionKey,
  type ReportSectionState,
} from "./report";

// 06 · The Report — take the analysis with you. A checklist of everything the
// report can carry: sections already revealed above are checkable, the rest
// sit grayed out with an honest hint. Download renders the print-only document
// (PrintReport) via window.print() — the browser's "Save as PDF" completes the
// download, so there are zero dependencies and the PDF has real, selectable text.

function downloadReport() {
  // The tab title becomes the print dialog's suggested PDF filename. Local
  // date, not toISOString(): UTC can lag a day behind the reader's calendar
  // (and behind the report's own "Generated" line).
  const d = new Date();
  const stamp = [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
  const prev = document.title;
  document.title = `prism-report-${stamp}`;
  const restore = () => {
    document.title = prev;
  };
  window.addEventListener("afterprint", restore, { once: true });
  try {
    // Chrome/Firefox block until the dialog closes; Safari returns immediately.
    window.print();
  } finally {
    // Idempotent fallback for browsers where afterprint never fires.
    window.setTimeout(restore, 1000);
  }
}

export default function ReportBuilder({
  states,
  checked,
  onToggle,
}: {
  states: Record<ReportSectionKey, ReportSectionState>;
  checked: Record<ReportSectionKey, boolean>;
  onToggle: (key: ReportSectionKey) => void;
}) {
  const reduce = useReducedMotion();
  const included = effectiveSelection(checked, states);
  const selectedCount = REPORT_SECTIONS.filter((m) => included[m.key]).length;

  return (
    <section className="mx-auto w-full max-w-grid px-6 py-16">
      <SectionHead
        index="06"
        eyebrow="The Report"
        title="Take it with you"
        sub={
          <>
            Everything above, set as one clean document your browser saves as a
            PDF. Pick which findings make the cut —{" "}
            <span className="text-ink">grayed sections haven&apos;t been
            revealed above yet</span>.
          </>
        }
      />

      <motion.div
        initial={reduce ? false : { opacity: 0, y: 12 }}
        whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, ease: EASE_OUT }}
        className="relative mt-10"
      >
        <CornerMarks />
        <div className="overflow-hidden border border-ink/15 bg-paper">
          <SpectrumRule className="h-[3px]" />

          <ul
            role="group"
            aria-label="Sections to include in the report"
            className="divide-y divide-ink/[0.06]"
          >
            {REPORT_SECTIONS.map((meta) => {
              const state = states[meta.key];
              const isOn = included[meta.key];
              return (
                <li key={meta.key}>
                  {/* aria-disabled (not disabled): grayed rows stay focusable so
                      keyboard/AT users can reach the "run it above" hint. */}
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={isOn}
                    aria-disabled={!state.available || undefined}
                    onClick={() => state.available && onToggle(meta.key)}
                    className={`flex w-full items-start gap-4 px-4 py-4 text-left transition-colors sm:px-6 ${
                      state.available
                        ? "hover:bg-ink/[0.03]"
                        : "cursor-not-allowed opacity-40"
                    }`}
                  >
                    {/* Drawn Swiss checkbox — filled ink square, paper check. */}
                    <span
                      aria-hidden
                      className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center border transition-colors ${
                        isOn ? "border-ink bg-ink" : "border-ink/30 bg-paper"
                      }`}
                    >
                      {isOn && (
                        <span className="text-[10px] font-bold leading-none text-paper">
                          ✓
                        </span>
                      )}
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                        <span className="text-xs tabular-nums text-ink/35">
                          {meta.ref}
                        </span>
                        <span className="text-sm font-semibold uppercase tracking-[0.14em]">
                          {meta.label}
                        </span>
                      </span>
                      <span className="mt-0.5 block text-xs text-ink/50">
                        {meta.blurb}
                      </span>
                      {!state.available && state.hint && (
                        // Full-ink so it survives the row's 40% opacity.
                        <span className="mt-1 block text-[11px] font-medium text-ink">
                          {state.hint}
                        </span>
                      )}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          {/* Footer — count + the download CTA (sanctioned accent use). */}
          <div className="flex flex-col items-start gap-4 border-t border-ink/10 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div>
              <p className="text-sm text-ink/60">
                <span className="tabular-nums">{selectedCount}</span> of{" "}
                {REPORT_SECTIONS.length} sections selected
              </p>
              <p className="mt-1 text-xs text-ink/40">
                Opens your browser&apos;s print dialog — choose &ldquo;Save as
                PDF&rdquo; as the destination.
              </p>
            </div>
            <button
              type="button"
              onClick={downloadReport}
              disabled={selectedCount === 0}
              className="group inline-flex shrink-0 items-center gap-2 bg-accent px-8 py-4 text-base font-medium text-paper transition-colors duration-200 hover:bg-ink disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-accent"
            >
              Download the report
              <span
                aria-hidden
                className="transition-transform duration-200 group-hover:translate-y-0.5"
              >
                ↓
              </span>
            </button>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
