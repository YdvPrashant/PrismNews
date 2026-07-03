"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { EASE_OUT } from "@/components/brand";
import { MAX_CLAIMS, type FactCheckResult, type Verdict } from "@/lib/types";
import { VERDICT_META, VERDICT_ORDER } from "./verdicts";
import SectionHead from "./SectionHead";
import ScanOverlay from "./ScanOverlay";
import ClaimExplorer from "./ClaimExplorer";

type Status = "idle" | "loading" | "done" | "error";

// `onResult` reports successful loads up to the orchestrator (for the report);
// local state stays the source of truth for this section's own UI.
export default function FactCheck({
  claims,
  onResult,
}: {
  claims: string[];
  onResult?: (result: FactCheckResult) => void;
}) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<FactCheckResult | null>(null);

  async function run() {
    if (status === "loading" || claims.length === 0) return;
    setStatus("loading");
    setError(null);
    try {
      const res = await fetch("/api/factcheck", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claims }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Fact-check failed.");
      setResult(data as FactCheckResult);
      onResult?.(data as FactCheckResult);
      setStatus("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setStatus("error");
    }
  }

  return (
    <section className="mx-auto w-full max-w-grid px-6 py-16">
      <SectionHead
        index="04"
        eyebrow="Fact Check"
        title="Do the claims hold up?"
        sub={
          <>
            Opinions and rhetoric can&apos;t be verified — so Prism checks only the
            article&apos;s <span className="text-ink">checkable claims</span>, each
            against live web sources, and shows you the proof.
          </>
        }
      />

      <AnimatePresence mode="wait">
        {claims.length === 0 ? (
          <motion.p
            key="none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-10 border border-dashed border-ink/20 px-5 py-8 text-center text-sm text-ink/45"
          >
            No checkable claims were found in this piece.
          </motion.p>
        ) : status === "idle" ? (
          <IdleState key="idle" claimCount={claims.length} onRun={run} />
        ) : status === "loading" ? (
          <LoadingState key="loading" />
        ) : status === "error" ? (
          <ErrorState key="error" message={error} onRetry={run} />
        ) : result ? (
          <Dashboard key="dash" result={result} />
        ) : null}
      </AnimatePresence>
    </section>
  );
}

function IdleState({
  claimCount,
  onRun,
}: {
  claimCount: number;
  onRun: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: EASE_OUT }}
      className="mt-10 flex flex-col items-start gap-6 border border-ink/10 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8"
    >
      <div>
        {/* Hero count — proportional figures (not tabular) at display size. */}
        <p className="text-5xl font-bold tracking-tight">{claimCount}</p>
        <p className="mt-2 text-sm text-ink/60">
          checkable {claimCount === 1 ? "claim" : "claims"} found
          {claimCount > MAX_CLAIMS && ` — the ${MAX_CLAIMS} most substantial will be checked`}.
        </p>
        <p className="mt-1 text-xs text-ink/40">
          Runs one live web search per claim — that&apos;s why it&apos;s on demand.
        </p>
      </div>
      <button
        type="button"
        onClick={onRun}
        className="group inline-flex shrink-0 items-center gap-2 bg-accent px-8 py-4 text-base font-medium text-paper transition-colors duration-200 hover:bg-ink"
      >
        Run fact-check
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
        {[0, 1, 2].map((i) => (
          <div key={i} className="border border-ink/10 p-6">
            <div className="h-3 w-24 animate-pulse rounded-sm bg-ink/10" />
            <div className="mt-4 h-5 w-3/4 animate-pulse rounded-sm bg-ink/[0.06]" />
            <div className="mt-3 h-3 w-full animate-pulse rounded-sm bg-ink/[0.06]" />
          </div>
        ))}
      </div>

      <ScanOverlay label="Searching sources and weighing evidence…" />
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
        The check didn&apos;t go through
      </p>
      <p className="max-w-md text-sm text-ink/60">
        {message ?? "The fact-check failed."}
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

function Dashboard({ result }: { result: FactCheckResult }) {
  const counts = useMemo(() => {
    const c: Record<Verdict, number> = {
      supported: 0,
      disputed: 0,
      misleading: 0,
      unverified: 0,
    };
    for (const check of result.checks) c[check.verdict]++;
    return c;
  }, [result]);

  const problems = counts.disputed + counts.misleading;
  const headline =
    counts.supported > 0 && problems === 0
      ? "Largely holds up"
      : problems >= counts.supported && problems > 0
        ? "Doesn't fully hold up"
        : "A mixed picture";

  const present = VERDICT_ORDER.filter((v) => counts[v] > 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: EASE_OUT }}
      className="mt-10"
    >
      {/* Summary strip */}
      <div className="border border-ink/10 p-6 sm:p-8">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h3 className="text-xl font-bold tracking-tight sm:text-2xl">
            {headline}
          </h3>
          <p className="text-sm text-ink/50">
            <span className="tabular-nums">
              {counts.supported} of {result.checkedCount}
            </span>{" "}
            claims supported
            {result.checkedCount < result.totalClaims && (
              <>
                {" "}
                ·{" "}
                <span className="tabular-nums">
                  {result.checkedCount} of {result.totalClaims}
                </span>{" "}
                checked
              </>
            )}
          </p>
        </div>

        {/* Verdict distribution — thin meter, paper gaps between fills. */}
        <div
          className="mt-5 flex h-2.5 w-full gap-[2px]"
          role="img"
          aria-label={present
            .map((v) => `${VERDICT_META[v].label} ${counts[v]}`)
            .join(", ")}
        >
          {present.map((v, i) => (
            <span
              key={v}
              title={`${VERDICT_META[v].label} — ${counts[v]}`}
              className={`${i === 0 ? "rounded-l-full" : ""} ${
                i === present.length - 1 ? "rounded-r-full" : ""
              }`}
              style={{
                flexGrow: counts[v],
                minWidth: "0.375rem",
                backgroundColor: VERDICT_META[v].bar,
              }}
            />
          ))}
        </div>

        {/* Legend — glyph chips carry identity even without color. */}
        <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
          {VERDICT_ORDER.map((v) => {
            const meta = VERDICT_META[v];
            return (
              <li key={v} className="inline-flex items-center gap-2 text-sm">
                <span
                  aria-hidden
                  className="flex h-4 w-4 items-center justify-center rounded-sm text-[10px] font-bold leading-none"
                  style={{ backgroundColor: meta.bar, color: meta.onFill }}
                >
                  {meta.mark}
                </span>
                <span className="font-medium">{meta.label}</span>
                <span className="tabular-nums text-ink/40">{counts[v]}</span>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Claim explorer — rail of numbered claims + detail (one screen). */}
      <div className="mt-8">
        <ClaimExplorer checks={result.checks} />
      </div>

      <p className="mt-8 max-w-xl text-xs leading-relaxed text-ink/40">
        Prism&apos;s read of the sources it found — not a final ruling. For claims
        that matter, follow the citations and judge for yourself.
      </p>
    </motion.div>
  );
}
