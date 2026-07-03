"use client";

import { motion } from "framer-motion";
import { EASE_OUT } from "@/components/brand";
import type { Category, CategoryScore, Segment } from "@/lib/types";
import { CATEGORY_META, CATEGORY_ORDER } from "./categories";
import { deriveGlance } from "./glance";

// The left-hand "composition" view: a thin grouped proportion bar (BS → Neutral
// → Claim → Opinion) with 2px paper gaps doing the separating, an interactive
// legend that carries all the numbers (count + %), and an "At a glance" block
// of derived signals. Clicking a category isolates it in the transcript.
export default function ProportionBar({
  segments,
  scores,
  active,
  onSelect,
}: {
  segments: Segment[];
  scores: CategoryScore[];
  active: Category | null;
  onSelect: (c: Category) => void;
}) {
  const byCategory = new Map(scores.map((s) => [s.category, s]));
  const pct = (c: Category) => byCategory.get(c)?.percent ?? 0;
  const count = (c: Category) =>
    segments.reduce((n, s) => n + (s.category === c ? 1 : 0), 0);

  const visible = CATEGORY_ORDER.filter((c) => pct(c) > 0);

  // ---- Derived signals (shared with the printable report via glance.ts) ----
  const { verdict, ratio, signal, words, readMin } = deriveGlance(
    segments,
    scores,
  );

  const stats: { label: string; value: string; hint: string }[] = [
    {
      label: "Opinion vs fact",
      value: ratio,
      hint: "Opinion for every unit of checkable fact.",
    },
    {
      label: "Signal vs filler",
      value: `${signal}%`,
      hint: `${100 - signal}% is connective/neutral text.`,
    },
    {
      label: "Length",
      value: `${segments.length} sentences`,
      hint: `~${words.toLocaleString()} words · ${readMin} min read`,
    },
  ];

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <p className="text-xs font-medium uppercase tracking-[0.25em] text-accent">
          Composition
        </p>
        {active && (
          <button
            type="button"
            onClick={() => onSelect(active)}
            className="text-[10px] uppercase tracking-[0.2em] text-ink/40 underline underline-offset-2 hover:text-ink"
          >
            Clear
          </button>
        )}
      </div>

      {/* The proportion bar — thin marks, paper gaps between fills (no borders,
          no inline numbers: the legend below carries every value). */}
      <motion.div
        initial={{ opacity: 0, scaleX: 0 }}
        whileInView={{ opacity: 1, scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: EASE_OUT }}
        style={{ transformOrigin: "left" }}
        className="mt-5 flex h-6 w-full gap-[2px]"
        // role="group", not "img": the segments are real buttons, and an
        // img-role element must not contain focusable descendants.
        role="group"
        aria-label={visible
          .map((c) => `${CATEGORY_META[c].label} ${pct(c)}%`)
          .join(", ")}
      >
        {visible.map((cat, i) => {
          const p = pct(cat);
          const dim = active !== null && active !== cat;
          const roundLeft = i === 0 ? "rounded-l-[4px]" : "";
          const roundRight = i === visible.length - 1 ? "rounded-r-[4px]" : "";
          return (
            <button
              key={cat}
              type="button"
              onClick={() => onSelect(cat)}
              title={`${CATEGORY_META[cat].label} — ${p}% · ${count(cat)} sentences`}
              aria-label={`${CATEGORY_META[cat].label}, ${p} percent`}
              className={`transition-opacity duration-200 hover:opacity-80 ${roundLeft} ${roundRight}`}
              style={{
                flexGrow: p,
                minWidth: "0.375rem",
                backgroundColor: CATEGORY_META[cat].bar,
                opacity: dim ? 0.25 : 1,
              }}
            />
          );
        })}
      </motion.div>

      {/* Interactive legend — the numbers live here. Click to isolate. */}
      <ul className="mt-6 border-t border-ink/[0.06]">
        {CATEGORY_ORDER.map((cat) => {
          const meta = CATEGORY_META[cat];
          const isActive = active === cat;
          const dim = active !== null && !isActive;
          return (
            <li key={cat}>
              <button
                type="button"
                onClick={() => onSelect(cat)}
                aria-pressed={isActive}
                className="flex w-full items-center justify-between gap-3 border-b border-ink/[0.06] px-2.5 py-3 text-left transition-colors duration-200 hover:bg-ink/[0.03]"
                style={{
                  opacity: dim ? 0.4 : 1,
                  boxShadow: isActive ? `inset 3px 0 0 0 ${meta.bar}` : "none",
                  backgroundColor: isActive ? "rgba(10,10,10,0.03)" : undefined,
                }}
              >
                <span className="min-w-0">
                  <span className="inline-flex items-center gap-2.5">
                    <span
                      aria-hidden
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: meta.bar }}
                    />
                    <span
                      className={`text-sm ${isActive ? "font-semibold" : "font-medium"}`}
                    >
                      {meta.label}
                    </span>
                    <span className="text-xs tabular-nums text-ink/35">
                      {count(cat)}
                    </span>
                  </span>
                  {isActive && (
                    <span className="mt-1 block pl-5 text-[11px] leading-snug text-ink/45">
                      {meta.blurb}
                    </span>
                  )}
                </span>
                <span className="text-lg font-semibold tabular-nums tracking-tight">
                  {pct(cat)}%
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <p className="mt-2 px-2.5 text-[11px] text-ink/40">
        {active
          ? `Isolating ${CATEGORY_META[active].label.toLowerCase()} in the transcript.`
          : "Click a category to isolate it in the transcript."}
      </p>

      {/* At a glance — derived, meaningful signals about the piece. */}
      <div className="mt-8">
        <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-ink/35">
          At a glance
        </p>

        <div className="mt-3 border border-ink/10">
          <div className="border-b border-ink/10 px-4 py-4">
            <p className="text-xl font-bold tracking-tight">{verdict.label}</p>
            <p className="mt-0.5 text-xs text-ink/50">{verdict.note}</p>
          </div>

          <dl className="divide-y divide-ink/[0.06]">
            {stats.map((s) => (
              <div key={s.label} className="px-4 py-3">
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="text-sm text-ink/60">{s.label}</dt>
                  <dd className="text-base font-semibold tabular-nums tracking-tight">
                    {s.value}
                  </dd>
                </div>
                <p className="mt-0.5 text-[11px] text-ink/40">{s.hint}</p>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
}
