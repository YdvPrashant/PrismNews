"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import SpectrumRule from "./SpectrumRule";
import { EASE_OUT } from "./brand";

// The closing beat — the page's one full-bleed ink slab. The affordance is a
// link dressed as the tool's input field: it promises exactly what the next
// screen asks for. Accent-on-ink here is CTA use (the sanctioned slot); the
// paper arrow on the accent block is the same pairing as the hero's button.
export default function CtaBand() {
  const reduce = useReducedMotion();

  const reveal = {
    initial: reduce ? false : { opacity: 0, y: 16 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-60px" },
  };

  return (
    <section className="bg-ink text-paper">
      {/* The page refracts here — spectrum hairline as the paper→ink seam. */}
      <SpectrumRule />

      <div className="mx-auto w-full max-w-grid px-6 py-20 md:py-24">
        <motion.p
          {...reveal}
          transition={{ duration: 0.7, ease: EASE_OUT }}
          className="text-xs font-medium uppercase tracking-[0.25em] text-accent"
        >
          Try it
        </motion.p>

        <motion.h2
          {...reveal}
          transition={{ duration: 0.7, delay: 0.08, ease: EASE_OUT }}
          className="mt-4 max-w-3xl text-4xl font-bold leading-[0.95] tracking-tightest sm:text-5xl md:text-6xl"
        >
          Refract your first story.
        </motion.h2>

        <motion.p
          {...reveal}
          transition={{ duration: 0.7, delay: 0.16, ease: EASE_OUT }}
          className="mt-6 max-w-xl text-base leading-relaxed text-paper/60 sm:text-lg"
        >
          No account needed. Works on articles and YouTube links. Every verdict
          shows its receipts.
        </motion.p>

        <motion.div
          {...reveal}
          transition={{ duration: 0.7, delay: 0.24, ease: EASE_OUT }}
          className="mt-10 max-w-xl"
        >
          <Link
            href="/get-started"
            aria-label="Open the tool — paste your link there"
            // The global focus ring is ink — invisible on this band, so it
            // flips to paper here.
            className="group flex items-center justify-between gap-4 border border-paper/25 py-2 pl-5 pr-2 transition-colors duration-200 ease-swiss hover:border-paper/70 focus-visible:outline-paper"
          >
            <span className="truncate text-sm text-paper/45">
              Paste an article or YouTube link…
            </span>
            <span
              aria-hidden
              className="flex h-10 w-10 shrink-0 items-center justify-center bg-accent text-paper transition-colors duration-200 ease-swiss group-hover:bg-paper group-hover:text-ink"
            >
              <span className="transition-transform duration-200 group-hover:translate-x-0.5">
                →
              </span>
            </span>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
