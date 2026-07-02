"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import PrismLogo from "./PrismLogo";
import SpectrumRule from "./SpectrumRule";
import { EASE_OUT } from "./brand";

const LETTERS = ["P", "R", "I", "S", "M"];

export default function Hero() {
  const reduce = useReducedMotion();

  return (
    <section className="relative flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center px-6 text-center">
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
                initial={reduce ? false : { y: "110%" }}
                animate={{ y: "0%" }}
                transition={
                  reduce
                    ? { duration: 0 }
                    : { duration: 0.7, delay: 0.12 + i * 0.06, ease: EASE_OUT }
                }
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
        initial={reduce ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.55, ease: EASE_OUT }}
        className="mt-6 max-w-md text-lg text-ink/60 sm:text-xl"
      >
        See every angle of the story.
      </motion.p>

      <motion.div
        initial={reduce ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.7, ease: EASE_OUT }}
        className="mt-10 flex flex-col items-center gap-3 sm:flex-row"
      >
        <Link
          href="/get-started"
          className="group inline-flex items-center gap-2 bg-accent px-8 py-4 text-base font-medium text-paper transition-colors duration-200 hover:bg-ink"
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
          className="group inline-flex items-center gap-2 px-4 py-4 text-base font-medium text-ink/70 transition-colors hover:text-ink"
        >
          How it works
          <span
            aria-hidden
            className="transition-transform duration-200 group-hover:translate-y-0.5"
          >
            ↓
          </span>
        </a>
      </motion.div>

      <motion.div
        initial={reduce ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6, duration: 0.8 }}
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
