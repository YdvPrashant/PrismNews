"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { EASE_OUT } from "@/components/brand";
import CornerMarks from "@/components/CornerMarks";
import type { ClaimCheck, Confidence, Evidence } from "@/lib/types";
import { STANCE_META, VERDICT_META } from "./verdicts";
import Favicon from "./Favicon";

// Master–detail fact-check explorer: a narrow rail of numbered claim buttons
// (each tinted by its verdict, so the rail doubles as a credibility overview) and
// a detail pane for the selected claim, whose sources are switchable logo tabs.
// Keeps the whole fact-check on one screen instead of a long scroll.
export default function ClaimExplorer({ checks }: { checks: ClaimCheck[] }) {
  const [active, setActive] = useState(0);
  const current = checks[active];

  return (
    <div className="relative">
      <CornerMarks />
      <div className="flex h-[clamp(24rem,56vh,36rem)] overflow-hidden border border-ink/15">
        {/* Rail — one numbered button per claim, colored by verdict. */}
        <nav
          aria-label="Checked claims"
          className="u-scroll flex w-14 shrink-0 flex-col overflow-y-auto border-r border-ink/10 sm:w-16"
        >
          {checks.map((c, i) => {
            const v = VERDICT_META[c.verdict];
            const isActive = i === active;
            const ring =
              v.onFill === "#0A0A0A"
                ? "rgba(10,10,10,0.3)"
                : "rgba(255,255,255,0.4)";
            return (
              <button
                key={i}
                type="button"
                onClick={() => setActive(i)}
                title={`Claim ${i + 1} — ${v.label}`}
                aria-label={`Claim ${i + 1}, ${v.label}`}
                aria-current={isActive}
                className="flex h-14 shrink-0 flex-col items-center justify-center gap-0.5 border-b border-paper/70 transition-all hover:opacity-90 sm:h-16"
                style={{
                  backgroundColor: isActive ? v.bar : v.tint,
                  color: isActive ? v.onFill : v.text,
                  boxShadow: isActive ? `inset 0 0 0 2px ${ring}` : "none",
                }}
              >
                <span className="text-sm font-bold tabular-nums">{i + 1}</span>
                <span className="text-[9px] leading-none" aria-hidden>
                  {v.mark}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Detail — the selected claim. Keyed so source selection resets on switch. */}
        <div className="u-scroll min-w-0 flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.28, ease: EASE_OUT }}
              className="p-6 sm:p-8"
            >
              <ClaimDetail check={current} index={active} />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// Three ascending signal bars — how sure the judge is, without words alone.
function ConfidenceTicks({ level }: { level: Confidence }) {
  const filled = level === "high" ? 3 : level === "medium" ? 2 : 1;
  const heights = ["h-1.5", "h-2.5", "h-3.5"];
  return (
    <span
      className="inline-flex items-end gap-[3px]"
      role="img"
      aria-label={`${level} confidence`}
    >
      {heights.map((h, i) => (
        <span
          key={i}
          className={`w-[3px] rounded-[1px] ${h} ${
            i < filled ? "bg-ink/70" : "bg-ink/15"
          }`}
        />
      ))}
    </span>
  );
}

function ClaimDetail({ check, index }: { check: ClaimCheck; index: number }) {
  const v = VERDICT_META[check.verdict];
  const [src, setSrc] = useState(0);
  const source = check.evidence[src];

  return (
    <div>
      {/* Header: claim number · confidence · verdict */}
      <div className="flex items-center justify-between gap-4">
        <span className="text-xs font-medium uppercase tracking-[0.22em] text-ink/35">
          Claim {String(index + 1).padStart(2, "0")}
        </span>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-ink/40">
            <ConfidenceTicks level={check.confidence} />
            {check.confidence}
          </span>
          <span
            className="inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1 text-xs font-semibold"
            style={{ backgroundColor: v.tint, color: v.text }}
          >
            <span aria-hidden>{v.mark}</span>
            {v.label}
          </span>
        </div>
      </div>

      {/* The claim + rationale */}
      <p className="mt-4 text-balance text-xl font-semibold leading-snug tracking-tight text-ink">
        {check.claim}
      </p>
      <p className="mt-3 text-sm leading-relaxed text-ink/60">
        {check.explanation}
      </p>

      {/* Evidence — logo tabs + the selected source. */}
      {check.evidence.length > 0 ? (
        <div className="mt-6 border-t border-ink/10 pt-5">
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-ink/35">
            Evidence · {check.evidence.length}
          </p>

          {/* Source switcher (logos, with a stance dot each). */}
          <div className="mt-3 flex flex-wrap gap-2">
            {check.evidence.map((e, i) => (
              <SourceTab
                key={i}
                evidence={e}
                index={i}
                active={i === src}
                onClick={() => setSrc(i)}
              />
            ))}
          </div>

          {source && <SourcePanelView source={source} />}
        </div>
      ) : (
        <p className="mt-6 border-t border-ink/10 pt-5 text-sm text-ink/45">
          No web sources were found for this claim.
        </p>
      )}
    </div>
  );
}

function SourceTab({
  evidence,
  index,
  active,
  onClick,
}: {
  evidence: Evidence;
  index: number;
  active: boolean;
  onClick: () => void;
}) {
  const stance = STANCE_META[evidence.stance];
  return (
    <button
      type="button"
      onClick={onClick}
      title={evidence.publisher ?? `Source ${index + 1}`}
      aria-pressed={active}
      className={`relative flex h-10 w-10 items-center justify-center rounded-md border bg-paper transition-all hover:-translate-y-0.5 ${
        active ? "border-ink" : "border-ink/15"
      }`}
      style={active ? { boxShadow: "inset 0 0 0 1px #0A0A0A" } : undefined}
    >
      <Favicon domain={evidence.publisher} fallback={index + 1} />
      <span
        aria-hidden
        title={stance.label}
        className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-paper"
        style={{ backgroundColor: stance.color }}
      />
    </button>
  );
}

function SourcePanelView({ source }: { source: Evidence }) {
  const stance = STANCE_META[source.stance];
  return (
    <div className="mt-4">
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.12em]">
        <span
          className="inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold text-white"
          style={{ backgroundColor: stance.color }}
          aria-hidden
        >
          {stance.mark}
        </span>
        <span style={{ color: stance.color }}>{stance.label}</span>
        {source.publisher && (
          <>
            <span className="text-ink/25" aria-hidden>
              ·
            </span>
            <span className="normal-case tracking-normal text-ink/45">
              {source.publisher}
            </span>
          </>
        )}
      </div>

      <a
        href={source.url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 block text-balance text-base font-semibold leading-snug text-ink underline decoration-ink/20 underline-offset-2 hover:text-accent hover:decoration-accent"
      >
        {source.title}
      </a>

      {source.snippet && (
        <p
          className="mt-3 border-l-2 pl-3 text-sm leading-relaxed text-ink/60"
          style={{ borderColor: stance.color }}
        >
          {source.snippet}
        </p>
      )}

      <a
        href={source.url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-ink/50 hover:text-accent"
      >
        Open source
        <span aria-hidden>↗</span>
      </a>
    </div>
  );
}
