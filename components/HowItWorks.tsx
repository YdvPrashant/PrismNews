"use client";

import { motion, useReducedMotion } from "framer-motion";
import SpectrumRule from "./SpectrumRule";
import { EASE_OUT } from "./brand";

// The five instruments — one row per tool screen, in the order they appear down
// the /get-started page. These 01–05 numerals are the only ones on the landing
// page (About's cells deliberately carry none), so they read as the tool's own.
type Step = {
  no: string;
  name: string; // exact tool screen name
  promise: string; // the question that screen answers
  body: string;
  chips?: string[]; // honesty chips — cost/requirement caveats, stated up front
};

const STEPS: Step[] = [
  {
    no: "01",
    name: "The Workspace",
    promise: "What exactly am I reading?",
    body: "Paste a link, a YouTube video, or the raw text. Prism fetches the article — or pulls the video's transcript — strips the clutter, and lays the readable text beside your source, so you can see exactly what's being analyzed, correct it, and re-run.",
  },
  {
    no: "02",
    name: "The Spectrum",
    promise: "How much is fact, take, or noise?",
    body: "Every sentence is classified — checkable claim, honest opinion, loaded rhetoric, or neutral connective tissue — into a color-coded transcript with the reasoning behind every line, plus a composition readout of the whole piece.",
  },
  {
    no: "03",
    name: "Provenance",
    promise: "Who's telling me this?",
    body: "Prism researches the outlet — ownership, funding, political lean, reliability record — profiles the byline, and runs registry forensics on the domain itself: where it's registered, where it's hosted, how old it is. Every finding cites its source.",
    chips: ["On demand", "Link only"],
  },
  {
    no: "04",
    name: "Fact Check",
    promise: "Do the claims hold up?",
    body: "Opinions can't be verified; claims can. Each checkable claim is searched against the live web, weighed only against the sources found, and returned with a verdict, a confidence read, and citations you can follow.",
    chips: ["On demand"],
  },
  {
    no: "05",
    name: "The Full Picture",
    promise: "Was it the full story?",
    body: "Prism finds how other outlets reported the same event and shows what this article covered, softened, or left out — and how its framing differs from everyone else's.",
    chips: ["On demand"],
  },
];

export default function HowItWorks() {
  const reduce = useReducedMotion();

  const reveal = {
    initial: reduce ? false : { opacity: 0, y: 16 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-60px" },
  };

  return (
    <section
      id="how-it-works"
      className="mx-auto w-full max-w-grid scroll-mt-24 px-6 py-20 md:py-24"
    >
      <div className="grid gap-12 md:grid-cols-12">
        <motion.div
          {...reveal}
          transition={{ duration: 0.7, ease: EASE_OUT }}
          className="md:col-span-4"
        >
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-accent">
            How it works
          </p>
          <h2 className="mt-4 text-4xl font-bold leading-[0.95] tracking-tightest sm:text-5xl">
            One story,
            <br />
            five instruments.
          </h2>
          <div className="mt-6 w-24">
            <SpectrumRule />
          </div>
        </motion.div>

        <motion.div
          {...reveal}
          transition={{ duration: 0.7, delay: 0.1, ease: EASE_OUT }}
          className="md:col-span-6 md:col-start-7"
        >
          <p className="text-balance text-xl leading-relaxed text-ink/80 sm:text-2xl">
            Paste a single article — or a video link. Prism runs it through five
            readings, each answering one question you should be able to ask of
            any news story.
          </p>
        </motion.div>
      </div>

      <div className="mt-24 border-t border-ink/10">
        {STEPS.map((s, i) => (
          <motion.div
            key={s.no}
            {...reveal}
            transition={{ duration: 0.6, delay: i * 0.08, ease: EASE_OUT }}
            className="group relative grid gap-4 border-b border-ink/10 py-10 md:grid-cols-12 md:gap-6"
          >
            <span
              aria-hidden
              className="absolute left-0 top-[-1px] h-px w-0 bg-accent transition-all duration-300 group-hover:w-full"
            />
            {/* Ghost numeral — same editorial treatment as About's cells. */}
            <span
              aria-hidden
              className="block text-5xl font-light leading-none tracking-tightest text-ink/[0.16] transition-colors duration-300 group-hover:text-accent sm:text-6xl md:col-span-2"
            >
              {s.no}
            </span>

            <div className="md:col-span-4">
              <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-ink/40">
                {s.name}
              </p>
              <h3 className="mt-2 text-xl font-semibold tracking-tight">
                {s.promise}
              </h3>
            </div>

            <div className="md:col-span-6">
              <p className="text-sm leading-relaxed text-ink/60">{s.body}</p>
              {s.chips && (
                <p className="mt-4 flex flex-wrap gap-2">
                  {s.chips.map((c) => (
                    <span
                      key={c}
                      className="border border-ink/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.2em] text-ink/45"
                    >
                      {c}
                    </span>
                  ))}
                </p>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      <motion.p
        {...reveal}
        transition={{ duration: 0.6, ease: EASE_OUT }}
        className="mt-8 max-w-xl text-xs leading-relaxed text-ink/40"
      >
        03–05 run live web searches, so they run on demand — one click each.
        Nothing is checked behind your back.
      </motion.p>
    </section>
  );
}
