"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { EASE_OUT } from "@/components/brand";
import SpectrumRule from "@/components/SpectrumRule";

// The opening screen — a single instrument: one framed field on clean paper,
// a live link/text detection chip, live counts, and the Refract action.
export default function InputPanel({
  value,
  onChange,
  onSubmit,
  detected,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  detected: "url" | "video" | "text";
  disabled: boolean;
}) {
  const reduce = useReducedMotion();
  const canSubmit = value.trim().length > 0 && !disabled;
  const hasValue = value.trim().length > 0;
  const words = value.trim().match(/\S+/g)?.length ?? 0;

  return (
    <section className="mx-auto flex min-h-[calc(100vh-3.5rem)] w-full max-w-grid flex-col justify-center px-6 py-16">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: EASE_OUT }}
        className="mx-auto w-full max-w-2xl"
      >
        <div className="mb-10 text-center">
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-accent">
            Refract a story
          </p>
          <h1 className="mt-4 text-balance text-4xl font-bold leading-[1.03] tracking-tightest sm:text-5xl">
            Paste a story.
          </h1>
          <p className="mt-4 text-base leading-relaxed text-ink/55">
            Drop in an article link, a YouTube video, or the text itself. Prism
            refracts it into claims, opinions, and rhetoric.
          </p>
        </div>

        {/* The instrument — one framed field. */}
        <div className="border border-ink/15 bg-paper">
            <SpectrumRule className="h-[3px]" />

            <div className="p-6 sm:p-8">
              <div className="flex items-baseline justify-between gap-4">
                <label
                  htmlFor="prism-input"
                  className="text-xs font-medium uppercase tracking-[0.25em] text-ink/45"
                >
                  Link, video, or text
                </label>

                {/* Live detection chip — flips as the field changes. */}
                <AnimatePresence mode="wait" initial={false}>
                  {hasValue && (
                    <motion.span
                      key={detected}
                      initial={reduce ? false : { opacity: 0, y: 3 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={reduce ? undefined : { opacity: 0, y: -3 }}
                      transition={{ duration: 0.18 }}
                      className="inline-flex items-center gap-1.5 border border-ink/15 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-ink/55"
                    >
                      <span
                        aria-hidden
                        className="h-1.5 w-1.5 rounded-full bg-ink/50"
                      />
                      {detected === "video"
                        ? "Video ▷"
                        : detected === "url"
                          ? "Link ↗"
                          : "Text ¶"}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>

              <textarea
                id="prism-input"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={(e) => {
                  if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && canSubmit) {
                    onSubmit();
                  }
                }}
                rows={6}
                placeholder="https://example.com/article  ·  a YouTube link  —  or paste the text itself"
                className="u-scroll mt-4 w-full resize-none border-0 border-b border-ink/15 bg-transparent px-0 py-3 text-lg leading-relaxed text-ink outline-none transition-colors placeholder:text-ink/25 focus:border-ink"
              />

              <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4 text-[11px] text-ink/40">
                  <span className="tabular-nums">
                    {hasValue
                      ? `${words.toLocaleString()} ${words === 1 ? "word" : "words"}`
                      : "Waiting for input"}
                  </span>
                  <kbd className="hidden rounded-[3px] border border-ink/20 px-1.5 py-0.5 font-sans text-[10px] text-ink/45 sm:inline">
                    ⌘/Ctrl ⏎
                  </kbd>
                </div>

                <button
                  type="button"
                  onClick={onSubmit}
                  disabled={!canSubmit}
                  className="group inline-flex items-center gap-2 bg-accent px-8 py-4 text-base font-medium text-paper transition-colors duration-200 ease-swiss hover:bg-ink disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-accent"
                >
                  Refract
                  <span
                    aria-hidden
                    className="transition-transform duration-200 group-hover:translate-x-1"
                  >
                    →
                  </span>
                </button>
              </div>
            </div>
        </div>
      </motion.div>
    </section>
  );
}
