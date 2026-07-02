"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { EASE_OUT, SPECTRUM } from "@/components/brand";
import SpectrumRule from "@/components/SpectrumRule";
import CornerMarks from "@/components/CornerMarks";
import type { AnalysisResult, ExtractedArticle } from "@/lib/types";
import InputPanel from "./InputPanel";
import SectionHead from "./SectionHead";
import SourcePanel from "./SourcePanel";
import ArticlePreview from "./ArticlePreview";
import SpectrumView from "./SpectrumView";
import SourceIntel from "./SourceIntel";
import FactCheck from "./FactCheck";
import FullStory from "./FullStory";

type Status = "idle" | "extracting" | "analyzing" | "done" | "error";

// Client-safe URL detection (mirrors lib/extract's isValidUrl without pulling in
// the server-only extractor). A single whitespace-free token that parses as a
// host counts as a link; everything else is treated as text.
function looksLikeUrl(value: string): boolean {
  const t = value.trim();
  if (t.length === 0 || /\s/.test(t)) return false;
  try {
    const u = new URL(/^https?:\/\//i.test(t) ? t : `https://${t}`);
    return u.hostname.includes(".");
  } catch {
    return false;
  }
}

async function postJSON<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error ?? "Request failed.");
  return data as T;
}

export default function AnalyzeApp() {
  const reduce = useReducedMotion();
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [article, setArticle] = useState<ExtractedArticle | null>(null);
  const [analyzedText, setAnalyzedText] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const detected = looksLikeUrl(input) ? "url" : "text";
  const busy = status === "extracting" || status === "analyzing";

  // The checkable claims Prism found — fed to the fact-checker on demand.
  const claimTexts =
    result?.segments
      .filter((s) => s.category === "claim")
      .map((s) => s.text.replace(/\s+/g, " ").trim()) ?? [];

  async function run() {
    if (input.trim().length === 0 || busy) return;
    setError(null);
    setResult(null);

    try {
      let textToAnalyze = input.trim();

      if (looksLikeUrl(input)) {
        setStatus("extracting");
        const normalized = /^https?:\/\//i.test(input.trim())
          ? input.trim()
          : `https://${input.trim()}`;
        const extracted = await postJSON<ExtractedArticle>("/api/extract", {
          url: normalized,
        });
        setArticle(extracted);
        textToAnalyze = extracted.text;
      } else {
        setArticle(null);
      }

      setAnalyzedText(textToAnalyze);
      setStatus("analyzing");
      const analysis = await postJSON<AnalysisResult>("/api/analyze", {
        text: textToAnalyze,
      });
      setResult(analysis);
      setStatus("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setStatus("error");
    }
  }

  // Screen 01, full screen, until the first run kicks off.
  if (status === "idle") {
    return (
      <InputPanel
        value={input}
        onChange={setInput}
        onSubmit={run}
        detected={detected}
        disabled={busy}
      />
    );
  }

  return (
    <div className="pb-32">
      {/* 01 · Workspace — editable source + live preview, side by side. Fills the
          viewport below the header so the spectrum stays below the fold. */}
      <section className="relative mx-auto flex min-h-[calc(100vh-3.5rem)] w-full max-w-grid flex-col justify-center px-6 py-16">
        <div
          aria-hidden
          className="bg-blueprint pointer-events-none absolute inset-0"
        />

        <motion.div
          initial={reduce ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE_OUT }}
          className="relative"
        >
          <p className="mb-4 flex items-baseline gap-3">
            <span className="text-xs font-medium tabular-nums text-ink/35">
              01
            </span>
            <span className="text-xs font-medium uppercase tracking-[0.25em] text-accent">
              The workspace
            </span>
          </p>

          {/* One unified card, two equal-height panes divided by a hairline —
              source (left) and preview (right) always line up. */}
          <div className="relative">
            <CornerMarks />
            <div className="overflow-hidden border border-ink/15 bg-paper">
              <SpectrumRule className="h-[3px]" />
              {/* The row height must be a DEFINITE track (grid-rows-[56vh]), not
                  h-[56vh] on the container: an auto row grows to a long article's
                  full height, the overflow-hidden card clips it, and the panes'
                  internal scrolling never engages. min-h-0 lets panes shrink. */}
              <div className="grid md:grid-cols-12 md:grid-rows-[56vh]">
                <div className="min-h-0 md:col-span-5 md:border-r md:border-ink/10">
                  <SourcePanel
                    value={input}
                    onChange={setInput}
                    onSubmit={run}
                    detected={detected}
                    busy={busy}
                    status={status}
                    article={article}
                  />
                </div>
                <div className="min-h-0 md:col-span-7">
                  <ArticlePreview article={article} text={analyzedText || input} />
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {error && (
          <p className="relative mx-auto mt-8 max-w-md text-center text-sm text-[#B02525]">
            {error}
          </p>
        )}

        {status !== "error" && (
          <div className="relative mt-16 flex flex-col items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-ink/35">
            <span>{busy ? "Refracting" : "The spectrum below"}</span>
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
          </div>
        )}
      </section>

      {/* 02 · The Spectrum — the analysis. Its own screen, below the fold. */}
      <section className="mx-auto min-h-screen w-full max-w-grid px-6 py-16">
        <SectionHead
          index="02"
          eyebrow="The Spectrum"
          title="How the story splits"
        />

        <AnimatePresence mode="wait">
          {busy && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="relative mt-10"
            >
              {/* Greyed-out skeleton of the eventual analysis layout. */}
              <div className="grid gap-10 opacity-40 md:grid-cols-12 md:gap-12">
                <div className="md:col-span-5">
                  <div className="h-6 w-full animate-pulse rounded-sm bg-ink/10" />
                  <div className="mt-6 space-y-3">
                    {[0, 1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="h-6 w-full animate-pulse rounded-sm bg-ink/[0.07]"
                      />
                    ))}
                  </div>
                  <div className="mt-8 h-28 w-full animate-pulse rounded-sm bg-ink/[0.05]" />
                </div>
                <div className="md:col-span-7">
                  <div className="space-y-3">
                    {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                      <div
                        key={i}
                        className="h-4 animate-pulse rounded-sm bg-ink/[0.07]"
                        style={{ width: `${70 + ((i * 13) % 30)}%` }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* A refracted scan line sweeps the skeleton while Prism works. */}
              {!reduce && (
                <motion.div
                  aria-hidden
                  className="pointer-events-none absolute inset-y-0 w-px"
                  style={{
                    background: `linear-gradient(to bottom, ${SPECTRUM.join(", ")})`,
                  }}
                  initial={{ left: "0%" }}
                  animate={{ left: ["0%", "100%", "0%"] }}
                  transition={{ duration: 4.4, repeat: Infinity, ease: "easeInOut" }}
                />
              )}

              {/* Centered status readout over the skeleton. */}
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 text-ink/60">
                <p className="bg-paper/80 px-3 py-1 text-sm">
                  {status === "extracting"
                    ? "Reading the article…"
                    : "Classifying every sentence…"}
                </p>
              </div>
            </motion.div>
          )}

          {status === "error" && (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-10 flex min-h-[30vh] flex-col items-center justify-center gap-4 border border-ink/10 px-6 text-center"
            >
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#B02525]">
                The beam didn&apos;t make it through
              </p>
              <p className="max-w-md text-sm text-ink/60">{error}</p>
              <button
                type="button"
                onClick={run}
                className="bg-ink px-6 py-3 text-sm font-medium text-paper transition-colors hover:bg-accent"
              >
                Try again
              </button>
            </motion.div>
          )}

          {status === "done" && result && (
            <div key="result">
              <SpectrumView result={result} />
            </div>
          )}
        </AnimatePresence>
      </section>

      {/* 03 · Provenance — who's telling you this? On-demand, link-only. */}
      {status === "done" && result && <SourceIntel article={article} />}

      {/* 04 · Fact Check — its own screen, below provenance. On-demand. */}
      {status === "done" && result && <FactCheck claims={claimTexts} />}

      {/* 05 · The Full Picture — coverage-gap analysis vs other outlets.
          On-demand; works for pasted text too (searches by event, not URL). */}
      {status === "done" && result && (
        <FullStory
          text={analyzedText || input}
          title={article?.title}
          url={article?.url}
        />
      )}
    </div>
  );
}
