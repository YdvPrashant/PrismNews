"use client";

import { motion, useReducedMotion } from "framer-motion";
import { EASE_OUT } from "./brand";
import { CATEGORY_META, CATEGORY_ORDER } from "./analyze/categories";
import { VERDICT_META } from "./analyze/verdicts";
import { deriveGlance } from "./analyze/glance";
import { CATEGORIES, type CategoryScore, type Segment } from "@/lib/types";

// The landing page's product demonstration: one hand-composed news excerpt,
// rendered exactly the way the tool renders a real analysis — Transcript's
// tint + underline treatment on the left, ProportionBar's composition readout
// on the right. Deliberately static (no hover/pin): the interactivity belongs
// to the tool; the landing only proves what the lens sees. Since Step 17 this
// renders the demo CARD only — <HowItWorks /> hosts it as its opening exhibit.
//
// The story is fabricated and apolitical on purpose (a city transit vote) —
// no real outlets, no charged topics on the marketing page.
const SEGMENTS: Segment[] = [
  {
    text: "The city council approved the harbor rail extension on Tuesday by a vote of 9–3.",
    category: "claim",
    reason: "A recorded vote with a number attached — directly checkable.",
    salience: 3,
  },
  {
    text: "The decision caps a debate that began with the corridor study three years ago.",
    category: "neutral",
    reason: "Connective context — sets up the story without asserting or judging.",
  },
  {
    text: "The project adds four stations along the eastern waterfront.",
    category: "claim",
    reason: "A concrete, falsifiable spec of the project.",
    salience: 2,
  },
  {
    text: "Planning documents put the cost at $2.1 billion over nine years.",
    category: "claim",
    reason: "A figure with a named source — checkable against the documents.",
    salience: 2,
  },
  {
    text: "It is the boldest bet this city has made on transit in a generation.",
    category: "opinion",
    reason: "“Boldest” is a value judgment, not a measurable fact.",
  },
  {
    text: "Anyone who has watched city hall knows exactly how this story ends.",
    category: "bs",
    reason: "Insinuates failure while saying nothing checkable.",
  },
  {
    text: "The line could reshape how the east side commutes.",
    category: "opinion",
    reason: "A prediction — plausible, but not verifiable today.",
  },
  {
    text: "A betrayal of every taxpayer, wrapped in a ribbon.",
    category: "bs",
    reason: "“Betrayal” pushes a feeling, not a fact.",
  },
  {
    text: "Service on the first segment is scheduled to begin in 2031.",
    category: "claim",
    reason: "A published schedule — checkable, and worth revisiting.",
    salience: 1,
  },
];

// Scored exactly like the engine (lib/analyze.ts scoreSegments): per-category
// character weight, Math.round to percent. The readout can never drift from
// the sentences above — edit the sentences, never these numbers.
const TOTAL_CHARS =
  SEGMENTS.reduce((n, s) => n + s.text.length, 0) || 1;
const SCORES: CategoryScore[] = CATEGORIES.map((category) => {
  const chars = SEGMENTS.filter((s) => s.category === category).reduce(
    (n, s) => n + s.text.length,
    0,
  );
  return { category, chars, percent: Math.round((chars / TOTAL_CHARS) * 100) };
});
const GLANCE = deriveGlance(SEGMENTS, SCORES);

// The sentence the sample fact-check verifies (the tool checks the
// highest-salience claims first — same here).
const CHECKED = SEGMENTS[0];
// The one classified line whose reasoning the caption bar surfaces.
const CAPTIONED_INDEX = 7;

const count = (c: Segment["category"]) =>
  SEGMENTS.reduce((n, s) => n + (s.category === c ? 1 : 0), 0);
const pct = (c: Segment["category"]) =>
  SCORES.find((s) => s.category === c)?.percent ?? 0;

export default function Specimen() {
  const reduce = useReducedMotion();

  const reveal = {
    initial: reduce ? false : { opacity: 0, y: 16 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-60px" },
  };

  const supported = VERDICT_META.supported;
  const captioned = SEGMENTS[CAPTIONED_INDEX];

  return (
    /* The demo card. bg-paper is load-bearing: the card sits on HowItWorks'
       whisper panel (bg-ink/[0.02]) and must stay paper-white to pop. */
    <motion.div
      {...reveal}
      transition={{ duration: 0.7, delay: 0.15, ease: EASE_OUT }}
      className="mt-16"
    >
        <div className="border border-ink/10 bg-paper">
          {/* Card rail — what this is, and the derived size of it. */}
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-ink/10 px-5 py-3 sm:px-8">
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-ink/40">
              Specimen — sample analysis
            </p>
            <p className="text-[10px] uppercase tracking-[0.2em] text-ink/35">
              <span className="tabular-nums">{GLANCE.sentences}</span> sentences
              · <span className="tabular-nums">{GLANCE.readMin}</span> min read
            </p>
          </div>

          <div className="grid md:grid-cols-12">
            {/* The classified excerpt — Transcript's exact treatment, static. */}
            <div className="flex min-w-0 flex-col md:col-span-7">
              <div className="px-5 py-6 sm:px-8 sm:py-8">
                <p className="text-lg font-semibold tracking-tight">
                  Council approves $2.1&nbsp;billion harbor rail extension
                </p>
                <p className="mt-1.5 text-[11px] uppercase tracking-[0.2em] text-ink/35">
                  citydesk.example · metro desk
                </p>

                <p className="mt-6 text-[1.02rem] leading-[1.95] text-ink/90">
                  {SEGMENTS.map((seg, i) => {
                    const meta = CATEGORY_META[seg.category];
                    return (
                      <span key={i}>
                        <motion.span
                          initial={reduce ? false : { opacity: 0 }}
                          whileInView={{ opacity: 1 }}
                          viewport={{ once: true, margin: "-80px" }}
                          transition={{
                            duration: 0.45,
                            delay: 0.25 + i * 0.07,
                            ease: EASE_OUT,
                          }}
                          className="rounded-[2px]"
                          style={{
                            backgroundColor: meta.tint,
                            boxShadow: `inset 0 -2px 0 0 ${meta.underline}`,
                            padding: "0.05em 0.1em",
                          }}
                        >
                          {seg.text}
                        </motion.span>{" "}
                      </span>
                    );
                  })}
                </p>

                {/* The key — what the four colors mean (same blurbs the tool
                    surfaces in its legend). */}
                <div className="mt-8 border-t border-ink/[0.06] pt-5">
                  <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-ink/35">
                    Key
                  </p>
                  <ul className="mt-3 space-y-2">
                    {CATEGORY_ORDER.map((cat) => (
                      <li
                        key={cat}
                        className="flex items-baseline gap-2.5 text-xs leading-relaxed"
                      >
                        <span
                          aria-hidden
                          className="h-2 w-2 shrink-0 translate-y-px rounded-full"
                          style={{ backgroundColor: CATEGORY_META[cat].bar }}
                        />
                        <span className="min-w-0">
                          <span className="font-semibold">
                            {CATEGORY_META[cat].label}
                          </span>
                          <span className="text-ink/50">
                            {" "}
                            — {CATEGORY_META[cat].blurb}
                          </span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* One surfaced reason — the tool shows this for every line. */}
              <div className="mt-auto flex items-center justify-between gap-3 border-t border-ink/10 bg-ink/[0.015] px-5 py-3 sm:px-8">
                <span className="inline-flex min-w-0 items-center gap-2.5">
                  <span
                    aria-hidden
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{
                      backgroundColor: CATEGORY_META[captioned.category].bar,
                    }}
                  />
                  <span className="text-xs">
                    <span className="font-semibold">
                      {CATEGORY_META[captioned.category].label}
                    </span>
                    <span className="text-ink/55"> — {captioned.reason}</span>
                  </span>
                </span>
                <span className="shrink-0 text-[10px] tabular-nums uppercase tracking-[0.15em] text-ink/35">
                  {CAPTIONED_INDEX + 1} / {GLANCE.sentences}
                </span>
              </div>
            </div>

            {/* The readout — ProportionBar's composition view, compacted. */}
            <aside className="min-w-0 border-t border-ink/10 md:col-span-5 md:border-l md:border-t-0">
              <div className="px-5 py-6 sm:px-8 sm:py-8">
                <p className="text-xs font-medium uppercase tracking-[0.25em] text-accent">
                  Composition
                </p>

                <motion.div
                  initial={reduce ? false : { opacity: 0, scaleX: 0 }}
                  whileInView={{ opacity: 1, scaleX: 1 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ duration: 0.8, delay: 0.3, ease: EASE_OUT }}
                  style={{ transformOrigin: "left" }}
                  className="mt-4 flex h-4 w-full gap-[2px]"
                  role="img"
                  aria-label={CATEGORY_ORDER.map(
                    (c) => `${CATEGORY_META[c].label} ${pct(c)}%`,
                  ).join(", ")}
                >
                  {CATEGORY_ORDER.map((cat, i) => (
                    <span
                      key={cat}
                      className={`${i === 0 ? "rounded-l-[4px]" : ""} ${
                        i === CATEGORY_ORDER.length - 1 ? "rounded-r-[4px]" : ""
                      }`}
                      style={{
                        flexGrow: pct(cat),
                        minWidth: "0.375rem",
                        backgroundColor: CATEGORY_META[cat].bar,
                      }}
                    />
                  ))}
                </motion.div>

                <ul className="mt-4 border-t border-ink/[0.06]">
                  {CATEGORY_ORDER.map((cat) => (
                    <li
                      key={cat}
                      className="flex items-center justify-between gap-3 border-b border-ink/[0.06] py-1.5"
                    >
                      <span className="inline-flex items-center gap-2.5">
                        <span
                          aria-hidden
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: CATEGORY_META[cat].bar }}
                        />
                        <span className="text-sm font-medium">
                          {CATEGORY_META[cat].label}
                        </span>
                        <span className="text-xs tabular-nums text-ink/35">
                          {count(cat)}
                        </span>
                      </span>
                      <span className="text-sm font-semibold tabular-nums tracking-tight">
                        {pct(cat)}%
                      </span>
                    </li>
                  ))}
                </ul>

                {/* At a glance — same derivations the tool prints. */}
                <motion.div
                  {...reveal}
                  transition={{ duration: 0.6, delay: 0.15, ease: EASE_OUT }}
                  className="mt-7"
                >
                  <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-ink/35">
                    At a glance
                  </p>
                  <div className="mt-3 border border-ink/10 bg-paper">
                    <div className="border-b border-ink/10 px-4 py-3.5">
                      <p className="text-xl font-bold tracking-tight">
                        {GLANCE.verdict.label}
                      </p>
                      <p className="mt-0.5 text-xs text-ink/50">
                        {GLANCE.verdict.note}
                      </p>
                    </div>
                    <dl className="divide-y divide-ink/[0.06]">
                      <div className="flex items-baseline justify-between gap-3 px-4 py-2.5">
                        <dt className="text-sm text-ink/60">Opinion vs fact</dt>
                        <dd className="text-base font-semibold tabular-nums tracking-tight">
                          {GLANCE.ratio}
                        </dd>
                      </div>
                      <div className="flex items-baseline justify-between gap-3 px-4 py-2.5">
                        <dt className="text-sm text-ink/60">
                          Signal vs filler
                        </dt>
                        <dd className="text-base font-semibold tabular-nums tracking-tight">
                          {GLANCE.signal}%
                        </dd>
                      </div>
                    </dl>
                  </div>
                </motion.div>

                {/* One verified claim — the tool checks the most load-bearing
                    claims against the live web; here, the vote itself. */}
                <motion.div
                  {...reveal}
                  transition={{ duration: 0.6, delay: 0.25, ease: EASE_OUT }}
                  className="mt-7"
                >
                  <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-ink/35">
                    Fact check — sample claim
                  </p>
                  <div className="mt-3 border border-ink/10 bg-paper p-4">
                    <span
                      className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-semibold"
                      style={{
                        backgroundColor: supported.bar,
                        color: supported.onFill,
                      }}
                    >
                      <span aria-hidden>{supported.mark}</span>
                      {supported.label}
                    </span>
                    <p className="mt-3 text-sm leading-relaxed text-ink/80">
                      “{CHECKED.text}”
                    </p>
                    <p className="mt-2 text-xs leading-relaxed text-ink/50">
                      Council minutes and two local reports corroborate the
                      vote and the margin.
                    </p>
                    <div className="mt-3 flex items-center gap-1.5">
                      {[1, 2].map((n) => (
                        <span
                          key={n}
                          aria-hidden
                          className="flex h-6 w-6 items-center justify-center border border-ink/15 bg-paper text-[10px] tabular-nums text-ink/45"
                        >
                          {n}
                        </span>
                      ))}
                      <span className="ml-1 text-[11px] text-ink/40">
                        2 sources cited
                      </span>
                    </div>
                  </div>
                </motion.div>
              </div>
            </aside>
          </div>
        </div>
    </motion.div>
  );
}
