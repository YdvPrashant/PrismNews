"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import PrismLogo from "./PrismLogo";
import SpectrumRule from "./SpectrumRule";
import { EASE_OUT } from "./brand";
import { CATEGORY_META } from "./analyze/categories";

const LETTERS = ["P", "R", "I", "S", "M"];

// The self-classifying headline (Step 17): the pitch is set the way the tool
// sets a transcript — each sentence tinted + underlined as what it actually is.
// Colors come ONLY from the analyze token file; the visible word-label is the
// non-color channel. The last line flags its own hype as BS on purpose.
const HEADLINE: { text: string; cat: "claim" | "opinion" | "bs" }[] = [
  {
    text: "Prism marks every sentence of the news — claim, opinion, or BS.",
    cat: "claim",
  },
  { text: "The clearest way to read a story.", cat: "opinion" },
  { text: "You’ll never be fooled again.", cat: "bs" },
];

export default function Hero() {
  const reduce = useReducedMotion();

  // pb-14 mirrors the sticky h-14 header: the section's band starts 3.5rem below
  // the viewport top, so equal bottom padding recenters the content on the true
  // viewport middle (same trio in error.tsx / not-found.tsx).
  return (
    <section className="relative flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center px-6 pb-14 text-center">
      <PrismLogo size={200} className="mb-8" />

      {/* Wordmark — each letter rises out of a clipping slot, left to right,
          like light leaving the prism. Screen readers get the word once. */}
      <h1
        aria-label="PRISM"
        className="text-6xl font-bold leading-none tracking-tightest sm:text-7xl md:text-[7.5rem]"
      >
        <span aria-hidden className="inline-flex">
          {LETTERS.map((letter, i) => (
            <span key={i} className="inline-block overflow-hidden">
              <motion.span
                className="inline-block"
                initial={{ y: "110%" }}
                animate={{ y: "0%" }}
                transition={{ duration: 0.7, delay: 0.12 + i * 0.06, ease: EASE_OUT }}
              >
                {letter}
              </motion.span>
            </span>
          ))}
        </span>
      </h1>

      <div className="mt-6 w-40">
        <SpectrumRule delay={0.6} />
      </div>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.5, ease: EASE_OUT }}
        className="mt-8 max-w-2xl text-balance text-xl leading-[1.9] text-ink/90 sm:text-2xl"
      >
        {HEADLINE.map((seg, i) => {
          const meta = CATEGORY_META[seg.cat];
          return (
            <span key={i}>
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{
                  duration: 0.45,
                  delay: 0.65 + i * 0.18,
                  ease: EASE_OUT,
                }}
                className="rounded-[2px]"
                style={{
                  backgroundColor: meta.tint,
                  boxShadow: `inset 0 -2px 0 0 ${meta.underline}`,
                  padding: "0.05em 0.15em",
                }}
              >
                {seg.text}
                <span
                  aria-hidden
                  className="ml-1.5 inline-block -translate-y-[0.55em] text-[9px] font-semibold uppercase tracking-[0.2em]"
                  style={{ color: meta.text }}
                >
                  {meta.label}
                </span>
              </motion.span>{" "}
            </span>
          );
        })}
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 1.1, ease: EASE_OUT }}
        className="mt-10 flex flex-col items-center gap-3 sm:flex-row"
      >
        <Link
          href="/get-started"
          className="group inline-flex items-center gap-2 bg-accent px-8 py-4 text-base font-medium text-paper transition-colors duration-200 ease-swiss hover:bg-ink"
        >
          Get Started
          <span
            aria-hidden
            className="transition-transform duration-200 group-hover:translate-x-1"
          >
            →
          </span>
        </Link>
        <a
          href="#how-it-works"
          className="group inline-flex items-center gap-2 px-4 py-4 text-base font-medium text-ink/70 transition-colors duration-200 ease-swiss hover:text-ink"
        >
          See it work
          <span
            aria-hidden
            className="transition-transform duration-200 group-hover:translate-y-0.5"
          >
            ↓
          </span>
        </a>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6, duration: 0.8, ease: EASE_OUT }}
        className="pointer-events-none absolute bottom-8 flex flex-col items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-ink/35"
      >
        <span>Scroll</span>
        <motion.span
          aria-hidden
          animate={reduce ? undefined : { y: [0, 5, 0] }}
          transition={
            reduce
              ? undefined
              : { duration: 1.6, repeat: Infinity, ease: "easeInOut" }
          }
        >
          ↓
        </motion.span>
      </motion.div>
    </section>
  );
}
