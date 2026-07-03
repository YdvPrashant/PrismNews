"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { EASE_OUT } from "@/components/brand";
import SpectrumRule from "@/components/SpectrumRule";
import CornerMarks from "@/components/CornerMarks";
import type { CoverageStatus, FullStoryResult } from "@/lib/types";
import SectionHead from "./SectionHead";
import CiteChips from "./CiteChips";
import ScanOverlay from "./ScanOverlay";
import { COMPLETENESS_META, COVERAGE_META } from "./coverage";

type Status = "idle" | "loading" | "done" | "error";

const STATUS_ORDER: CoverageStatus[] = ["covered", "partial", "missing"];
// Exported so the report registry (report.ts) mirrors this exact guard.
export const MIN_TEXT_CHARS = 200;

// 05 · The Full Picture — was it the full story? Compares this article against
// other outlets' coverage of the same event and shows what it covered, softened,
// or left out. Works for links AND pasted text (we search by the event, not the
// URL); the article's own outlet is excluded from the comparison pool.
// `onResult` reports successful loads up to the orchestrator (for the report);
// local state stays the source of truth for this section's own UI.
export default function FullStory({
  text,
  title,
  url,
  onResult,
}: {
  text: string;
  title?: string;
  url?: string;
  onResult?: (result: FullStoryResult) => void;
}) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<FullStoryResult | null>(null);

  const tooShort = text.trim().length < MIN_TEXT_CHARS;

  async function run() {
    if (status === "loading" || tooShort) return;
    setStatus("loading");
    setError(null);
    try {
      const res = await fetch("/api/fullstory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, title, url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Coverage comparison failed.");
      setResult(data as FullStoryResult);
      onResult?.(data as FullStoryResult);
      setStatus("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setStatus("error");
    }
  }

  return (
    <section className="mx-auto w-full max-w-grid px-6 py-16">
      <SectionHead
        index="05"
        eyebrow="The Full Picture"
        title="Was it the full story?"
        sub={
          <>
            One outlet&apos;s version is one angle. Prism pulls how{" "}
            <span className="text-ink">other outlets</span> reported the same
            event and shows what this article covered, softened, or left out.
          </>
        }
      />

      <AnimatePresence mode="wait">
        {tooShort ? (
          <motion.p
            key="short"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-10 border border-dashed border-ink/20 px-5 py-8 text-center text-sm text-ink/45"
          >
            This piece is too short to compare against other coverage.
          </motion.p>
        ) : status === "idle" ? (
          <IdleState key="idle" onRun={run} />
        ) : status === "loading" ? (
          <LoadingState key="loading" />
        ) : status === "error" ? (
          <ErrorState key="error" message={error} onRetry={run} />
        ) : result ? (
          <Reckoning key="done" result={result} />
        ) : null}
      </AnimatePresence>
    </section>
  );
}

function IdleState({ onRun }: { onRun: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: EASE_OUT }}
      className="mt-10 flex flex-col items-start gap-6 border border-ink/10 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8"
    >
      <div>
        <p className="text-xl font-bold tracking-tight">
          What did every other outlet see?
        </p>
        <p className="mt-2 max-w-md text-sm text-ink/60">
          Prism finds outside coverage of this same story and checks this
          article against it, point by point.
        </p>
        <p className="mt-1 text-xs text-ink/40">
          Runs a couple of live web searches — that&apos;s why it&apos;s on demand.
        </p>
      </div>
      <button
        type="button"
        onClick={onRun}
        className="group inline-flex shrink-0 items-center gap-2 bg-accent px-8 py-4 text-base font-medium text-paper transition-colors duration-200 hover:bg-ink"
      >
        Compare the coverage
        <span
          aria-hidden
          className="transition-transform duration-200 group-hover:translate-x-1"
        >
          →
        </span>
      </button>
    </motion.div>
  );
}

function LoadingState() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative mt-10"
    >
      <div className="space-y-4 opacity-40">
        <div className="border border-ink/10 p-6">
          <div className="h-6 w-64 animate-pulse rounded-sm bg-ink/10" />
          <div className="mt-4 h-2.5 w-full animate-pulse rounded-full bg-ink/[0.06]" />
        </div>
        {[0, 1, 2].map((i) => (
          <div key={i} className="border border-ink/10 p-6">
            <div className="h-4 w-20 animate-pulse rounded-sm bg-ink/10" />
            <div className="mt-3 h-4 w-4/5 animate-pulse rounded-sm bg-ink/[0.06]" />
            <div className="mt-2 h-3 w-3/5 animate-pulse rounded-sm bg-ink/[0.06]" />
          </div>
        ))}
      </div>

      <ScanOverlay label="Finding other coverage of this story…" />
    </motion.div>
  );
}

function ErrorState({
  message,
  onRetry,
}: {
  message: string | null;
  onRetry: () => void;
}) {
  return (
    <motion.div
      role="alert"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="mt-10 flex flex-col items-center gap-4 border border-ink/10 px-6 py-12 text-center"
    >
      <p className="text-xs font-medium uppercase tracking-[0.25em] text-danger">
        The comparison didn&apos;t go through
      </p>
      <p className="max-w-md text-sm text-ink/60">
        {message ?? "The coverage comparison failed."}
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="bg-ink px-6 py-3 text-sm font-medium text-paper transition-colors duration-200 ease-swiss hover:bg-accent"
      >
        Try again
      </button>
    </motion.div>
  );
}

function Reckoning({ result }: { result: FullStoryResult }) {
  const verdict = COMPLETENESS_META[result.verdict];
  const counts: Record<CoverageStatus, number> = {
    covered: 0,
    partial: 0,
    missing: 0,
  };
  for (const p of result.points) counts[p.status]++;
  const present = STATUS_ORDER.filter((s) => counts[s] > 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: EASE_OUT }}
      className="mt-10"
    >
      <div className="relative">
        <CornerMarks />
        <div className="overflow-hidden border border-ink/15 bg-paper">
          <SpectrumRule className="h-[3px]" />

          {/* Summary strip */}
          <div className="border-b border-ink/10 p-6 sm:p-8">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h3 className="text-xl font-bold tracking-tight sm:text-2xl">
                {verdict.label}
              </h3>
              {result.points.length > 0 && (
                <p className="text-sm tabular-nums text-ink/50">
                  {counts.covered} covered · {counts.partial} softened ·{" "}
                  {counts.missing} missing
                </p>
              )}
            </div>
            <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-ink/55">
              {result.verdictNote}
            </p>

            {/* Coverage distribution — thin meter, paper gaps between fills. */}
            {present.length > 0 && (
              <>
                <div
                  className="mt-5 flex h-2.5 w-full gap-[2px]"
                  role="img"
                  aria-label={present
                    .map((s) => `${COVERAGE_META[s].label} ${counts[s]}`)
                    .join(", ")}
                >
                  {present.map((s, i) => (
                    <span
                      key={s}
                      title={`${COVERAGE_META[s].label} — ${counts[s]}`}
                      className={`${i === 0 ? "rounded-l-full" : ""} ${
                        i === present.length - 1 ? "rounded-r-full" : ""
                      }`}
                      style={{
                        flexGrow: counts[s],
                        minWidth: "0.375rem",
                        backgroundColor: COVERAGE_META[s].bar,
                      }}
                    />
                  ))}
                </div>
                <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
                  {STATUS_ORDER.map((s) => {
                    const meta = COVERAGE_META[s];
                    return (
                      <li key={s} className="inline-flex items-center gap-2 text-sm">
                        <span
                          aria-hidden
                          className="flex h-4 w-4 items-center justify-center rounded-sm text-[10px] font-bold leading-none"
                          style={{ backgroundColor: meta.bar, color: meta.onFill }}
                        >
                          {meta.mark}
                        </span>
                        <span className="font-medium">{meta.label}</span>
                        <span className="tabular-nums text-ink/40">
                          {counts[s]}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}

            <p className="mt-4 text-[11px] text-ink/40">
              Searched: &ldquo;{result.storyQuery}&rdquo; ·{" "}
              <span className="tabular-nums">{result.sources.length}</span>{" "}
              outside sources
            </p>
          </div>

          {/* The checklist — the fuller picture, point by point. */}
          {result.points.length > 0 ? (
            <ul className="divide-y divide-ink/[0.06]">
              {result.points.map((point, i) => {
                const meta = COVERAGE_META[point.status];
                return (
                  <li
                    key={i}
                    className="px-5 py-4 sm:px-6"
                    style={
                      point.status !== "covered"
                        ? { boxShadow: `inset 3px 0 0 0 ${meta.bar}` }
                        : undefined
                    }
                  >
                    <span
                      className="inline-flex items-center gap-1.5 rounded-sm px-2 py-0.5 text-[11px] font-semibold"
                      style={{ backgroundColor: meta.tint, color: meta.text }}
                    >
                      <span aria-hidden>{meta.mark}</span>
                      {meta.label}
                    </span>
                    <p className="mt-2 text-sm font-medium leading-relaxed text-ink/90">
                      {point.fact}
                    </p>
                    {point.note && (
                      <p className="mt-1 text-xs leading-relaxed text-ink/50">
                        {point.note}
                      </p>
                    )}
                    <CiteChips citations={point.citations} sources={result.sources} />
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="px-6 py-8 text-sm text-ink/45">
              No comparable coverage points could be established for this story.
            </p>
          )}

          {/* Framing — the same event, two characterizations. */}
          {result.framing && (
            <div className="grid border-t border-ink/10 md:grid-cols-2">
              <div className="min-w-0 p-5 sm:p-6 md:border-r md:border-ink/10">
                <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-ink/35">
                  How this article tells it
                </p>
                <p className="mt-2 border-l-2 border-ink/15 pl-3 text-sm leading-relaxed text-ink/75">
                  {result.framing.article}
                </p>
              </div>
              <div className="min-w-0 border-t border-ink/10 p-5 sm:p-6 md:border-t-0">
                <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-ink/35">
                  How other outlets tell it
                </p>
                <p className="mt-2 border-l-2 border-ink/15 pl-3 text-sm leading-relaxed text-ink/75">
                  {result.framing.elsewhere}
                </p>
                <CiteChips
                  citations={result.framing.citations}
                  sources={result.sources}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <p className="mt-8 max-w-xl text-xs leading-relaxed text-ink/40">
        Built from the outside coverage Prism found — a thin news cycle can make
        a complete article look incomplete. Follow the citations and judge for
        yourself.
      </p>
    </motion.div>
  );
}
