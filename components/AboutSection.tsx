"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { EASE_OUT } from "./brand";

// Placeholder project-details copy — the user will refine this in a later step.
const principles = [
  {
    no: "01",
    title: "Every angle",
    body: "The same event is reported differently across the political and editorial spectrum. Prism gathers those versions side by side instead of picking one for you.",
  },
  {
    no: "02",
    title: "Visible sourcing",
    body: "Who published it, who owns them, and how many independent outlets are carrying the story — surfaced up front, not buried.",
  },
  {
    no: "03",
    title: "Bias in the open",
    body: "We label leaning and framing transparently so you can weigh a claim with its context, and make up your own mind.",
  },
];

const reveal = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
};

export default function AboutSection() {
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
            The project — 01
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
            This is an early, evolving build. What you see here is the starting
            point — we&apos;re shaping it in the open, step by step.
          </p>
        </motion.div>
      </div>

      <div className="mt-24 grid border-t border-ink/10 md:grid-cols-3">
        {principles.map((p, i) => (
          <motion.div
            key={p.no}
            {...reveal}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, delay: i * 0.1, ease: EASE_OUT }}
            className="group relative border-b border-ink/10 py-10 md:border-b-0 md:border-l md:px-8 md:first:border-l-0 md:first:pl-0"
          >
            <span
              aria-hidden
              className="absolute left-0 top-[-1px] h-px w-0 bg-accent transition-all duration-300 group-hover:w-full"
            />
            {/* Ghost numeral — editorial scale, ink until hovered. */}
            <span
              aria-hidden
              className="block text-5xl font-light leading-none tracking-tightest text-ink/[0.16] transition-colors duration-300 group-hover:text-accent"
            >
              {p.no}
            </span>
            <h3 className="mt-5 text-xl font-semibold tracking-tight">
              {p.title}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-ink/60">{p.body}</p>
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
