"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { EASE_OUT } from "./brand";

// The manifesto — why Prism exists. The mechanics live in <HowItWorks />, so
// these cells stay thematic (and deliberately unnumbered: the landing's only
// 01–05 numerals are the five instruments above).
const principles = [
  {
    title: "Every angle",
    body: "The same event reads differently at every outlet. Prism checks a story against how everyone else reported it — what was covered, what was softened, what was left out entirely.",
  },
  {
    title: "Receipts, not rulings",
    body: "Claims are checked against live sources with the citations attached. Prism shows you the evidence and how strong it looks — the judgment stays yours.",
  },
  {
    title: "Bias in the open",
    body: "Who owns the outlet, who funds it, how it leans, and how it frames — labelled where you can see them, and cited so you can check them.",
  },
];

export default function AboutSection() {
  const reduce = useReducedMotion();

  const reveal = {
    initial: reduce ? false : { opacity: 0, y: 16 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-80px" },
  };

  return (
    <section
      id="about"
      className="mx-auto w-full max-w-grid scroll-mt-24 px-6 py-28 md:py-40"
    >
      <div className="grid gap-12 md:grid-cols-12">
        <motion.div
          {...reveal}
          transition={{ duration: 0.7, ease: EASE_OUT }}
          className="md:col-span-4"
        >
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-accent">
            The project
          </p>
          <h2 className="mt-4 text-4xl font-bold leading-[0.95] tracking-tightest sm:text-5xl">
            News,
            <br />
            refracted.
          </h2>
        </motion.div>

        <motion.div
          {...reveal}
          transition={{ duration: 0.7, delay: 0.1, ease: EASE_OUT }}
          className="md:col-span-7 md:col-start-6"
        >
          <p className="text-balance text-xl leading-relaxed text-ink/80 sm:text-2xl">
            Most news reaches you already filtered — one outlet, one framing, one
            angle. Prism is a transparency lens: it takes a single story and splits
            it into the full spectrum of how it&apos;s being told, so the bias and the
            sourcing are things you can see rather than guess at.
          </p>

          <p className="mt-6 text-base leading-relaxed text-ink/50">
            Prism doesn&apos;t tell you what to think. Every verdict is cited, every
            color is explained, and the receipts are one click away — it&apos;s a
            lens, not a referee.
          </p>
        </motion.div>
      </div>

      <div className="mt-24 grid border-t border-ink/10 md:grid-cols-3">
        {principles.map((p, i) => (
          <motion.div
            key={p.title}
            {...reveal}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, delay: i * 0.1, ease: EASE_OUT }}
            className="group relative border-b border-ink/10 py-10 md:border-b-0 md:border-l md:px-8 md:first:border-l-0 md:first:pl-0"
          >
            <span
              aria-hidden
              className="absolute left-0 top-[-1px] h-px w-0 bg-accent transition-all duration-300 group-hover:w-full"
            />
            <h3 className="text-2xl font-semibold tracking-tight">{p.title}</h3>
            <p className="mt-4 text-sm leading-relaxed text-ink/60">{p.body}</p>
          </motion.div>
        ))}
      </div>

      {/* Hand-off to the tool — the manifesto ends where the lens begins. */}
      <motion.div
        {...reveal}
        transition={{ duration: 0.6, ease: EASE_OUT }}
        className="mt-20 flex items-center justify-between gap-6 border-t border-ink/10 pt-8"
      >
        <p className="text-sm text-ink/50">
          Enough reading about it —
        </p>
        <Link
          href="/get-started"
          className="group inline-flex shrink-0 items-center gap-2 text-sm font-semibold tracking-tight text-ink transition-colors hover:text-accent"
        >
          Refract a story
          <span
            aria-hidden
            className="transition-transform duration-200 group-hover:translate-x-1"
          >
            →
          </span>
        </Link>
      </motion.div>
    </section>
  );
}
