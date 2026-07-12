"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { EASE_OUT } from "@/components/brand";
import SpectrumRule from "@/components/SpectrumRule";
import { detectVideoUrl } from "@/lib/video";
import { claimConcreteness } from "@/lib/claims";
import type {
  AnalysisResult,
  ExtractedArticle,
  FactCheckResult,
  FullStoryResult,
  SourceIntelResult,
} from "@/lib/types";
import InputPanel from "./InputPanel";
import SectionHead from "./SectionHead";
import SourcePanel from "./SourcePanel";
import ArticlePreview from "./ArticlePreview";
import SpectrumView from "./SpectrumView";
import ScanOverlay from "./ScanOverlay";
import SourceIntel from "./SourceIntel";
import FactCheck from "./FactCheck";
import FullStory from "./FullStory";
import ReportBuilder from "./ReportBuilder";
import PrintReport from "./PrintReport";
import {
  defaultReportSelection,
  effectiveSelection,
  getReportSectionStates,
} from "./report";

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

  // Lifted copies of the on-demand sections' results (03/04/05) — the children
  // keep their own render state; these exist so the report (06) can see them.
  const [intelResult, setIntelResult] = useState<SourceIntelResult | null>(null);
  const [factCheckResult, setFactCheckResult] =
    useState<FactCheckResult | null>(null);
  const [fullStoryResult, setFullStoryResult] =
    useState<FullStoryResult | null>(null);
  const [reportChecked, setReportChecked] = useState(defaultReportSelection);

  // A recognized video link (supported or not) shows the "Video" affordance; a
  // YouTube link is transcribed server-side, anything else follows the article/
  // text paths. detectVideoUrl runs first because a video URL is also a URL.
  const detected = detectVideoUrl(input)
    ? "video"
    : looksLikeUrl(input)
      ? "url"
      : "text";
  const busy = status === "extracting" || status === "analyzing";

  // The checkable claims Prism found — fed to the fact-checker on demand, ranked
  // most-important-first so the engine's cap (selectClaims → first MAX_CLAIMS)
  // verifies the claims that matter. Primary key is the model's salience; ties
  // break on the concreteness heuristic, then document order (sort is stable).
  // NOTE: this is the ONLY claim-ranking seam — selectClaims stays first-N.
  const claimTexts =
    result?.segments
      .filter((s) => s.category === "claim")
      .sort(
        (a, b) =>
          (b.salience ?? 0) - (a.salience ?? 0) ||
          claimConcreteness(b.text) - claimConcreteness(a.text),
      )
      .map((s) => s.text.replace(/\s+/g, " ").trim()) ?? [];

  // The report exists once an analysis produced something — an empty analysis
  // gets section 02's dashed note, not a blank PDF.
  const reportReady =
    status === "done" && !!result && result.segments.length > 0;
  const sectionStates = reportReady
    ? getReportSectionStates({
        hasArticle: !!article,
        claimCount: claimTexts.length,
        textLength: (analyzedText || input).trim().length,
        intel: intelResult,
        factCheck: factCheckResult,
        fullStory: fullStoryResult,
      })
    : null;

  async function run() {
    if (input.trim().length === 0 || busy) return;
    setError(null);
    setResult(null);
    // A new run means new findings: the 03/04/05 children unmount (status
    // leaves "done"), so drop the lifted copies and reset the report picks
    // too — otherwise the next report would resurrect stale sections.
    setIntelResult(null);
    setFactCheckResult(null);
    setFullStoryResult(null);
    setReportChecked(defaultReportSelection());

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
    <>
      {/* The screen tree hides in print ONLY once a report exists — printing a
          loading/error state should print the screen, not blank pages. */}
      <div className={reportReady ? "pb-32 print:hidden" : "pb-32"}>
        {/* 01 · Workspace — editable source + live preview, side by side. Fills the
          viewport below the header so the spectrum stays below the fold. */}
        <section className="mx-auto flex min-h-[calc(100vh-3.5rem)] w-full max-w-grid flex-col justify-center px-6 py-16">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE_OUT }}
          >
            {/* SectionHead without `sub` (Step 17): title + rule now join the
                eyebrow, and the sub stays omitted so the 56vh card plus the
                scroll cue still fit one viewport on short laptops. */}
            <SectionHead
              index="01"
              eyebrow="The Workspace"
              title="What exactly are you reading?"
            />

            {/* One unified card, two equal-height panes divided by a hairline —
                source (left) and preview (right) always line up. */}
            <div className="mt-8 overflow-hidden border border-ink/15 bg-paper">
                <SpectrumRule className="h-[3px]" />
                {/* The row height must be a DEFINITE track (grid-rows-[56vh]), not
                    h-[56vh] on the container: an auto row grows to a long article's
                    full height, the overflow-hidden card clips it, and the panes'
                    internal scrolling never engages. min-h-0 lets panes shrink;
                    min-w-0 keeps the mobile single column from growing to an
                    unbroken URL's width and clipping at the card edge. */}
                <div className="grid md:grid-cols-12 md:grid-rows-[56vh]">
                  <div className="min-h-0 min-w-0 md:col-span-5 md:border-r md:border-ink/10">
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
                  <div className="min-h-0 min-w-0 md:col-span-7">
                    <ArticlePreview article={article} text={analyzedText || input} />
                  </div>
                </div>
            </div>
          </motion.div>

          {/* The one full error surface — it lives here, at eye level, because
              this section fills the viewport; section 02 below only gets a quiet
              pointer back up (no duplicate message, no second retry). */}
          {error && (
            <div
              role="alert"
              className="mx-auto mt-8 flex w-full max-w-md flex-col items-center gap-4 border border-ink/10 bg-ink/[0.02] px-6 py-6 text-center"
            >
              <p className="text-xs font-medium uppercase tracking-[0.25em] text-danger">
                The beam didn&apos;t make it through
              </p>
              <p className="text-sm text-ink/60">{error}</p>
              <button
                type="button"
                onClick={run}
                className="mt-1 bg-ink px-6 py-3 text-sm font-medium text-paper transition-colors duration-200 ease-swiss hover:bg-accent"
              >
                Try again
              </button>
            </div>
          )}

          {status !== "error" && (
            <div className="mt-16 flex flex-col items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-ink/35">
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
            sub={
              <>
                Every sentence, sorted by what it&apos;s doing:{" "}
                <span className="text-ink">claims</span> you can check,{" "}
                <span className="text-ink">opinions</span> honestly argued,{" "}
                <span className="text-ink">rhetoric</span> that only steers you —
                and the neutral tissue in between.
              </>
            }
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
                          className="h-6 w-full animate-pulse rounded-sm bg-ink/[0.06]"
                        />
                      ))}
                    </div>
                    <div className="mt-8 h-28 w-full animate-pulse rounded-sm bg-ink/[0.06]" />
                  </div>
                  <div className="md:col-span-7">
                    <div className="space-y-3">
                      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                        <div
                          key={i}
                          className="h-4 animate-pulse rounded-sm bg-ink/[0.06]"
                          style={{ width: `${70 + ((i * 13) % 30)}%` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Shared loading signature — the same ScanOverlay screens
                    03/04/05 use (scan line + announced status label). */}
                <ScanOverlay
                  label={
                    status === "extracting"
                      ? detected === "video"
                        ? "Pulling the video's transcript…"
                        : "Reading the article…"
                      : "Classifying every sentence…"
                  }
                />
              </motion.div>
            )}

            {status === "error" && (
              <motion.p
                key="error-note"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="mt-10 border border-dashed border-ink/20 px-5 py-8 text-center text-sm text-ink/45"
              >
                The analysis didn&apos;t go through — fix or retry it from the
                workspace above.
              </motion.p>
            )}

            {status === "done" && result && result.segments.length === 0 && (
              <motion.p
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="mt-10 border border-dashed border-ink/20 px-5 py-8 text-center text-sm text-ink/45"
              >
                Nothing here could be split into sentences — try a longer piece
                of text.
              </motion.p>
            )}

            {status === "done" && result && result.segments.length > 0 && (
              <div key="result">
                <SpectrumView result={result} />
              </div>
            )}
          </AnimatePresence>
        </section>

        {/* 03 · Provenance — who's telling you this? On-demand, link-only. */}
        {status === "done" && result && (
          <SourceIntel article={article} onResult={setIntelResult} />
        )}

        {/* 04 · Fact Check — its own screen, below provenance. On-demand. */}
        {status === "done" && result && (
          <FactCheck claims={claimTexts} onResult={setFactCheckResult} />
        )}

        {/* 05 · The Full Picture — coverage-gap analysis vs other outlets.
            On-demand; works for pasted text too (searches by event, not URL). */}
        {status === "done" && result && (
          <FullStory
            text={analyzedText || input}
            title={article?.title}
            url={article?.url}
            onResult={setFullStoryResult}
          />
        )}

        {/* 06 · The Report — pick the revealed findings, download as PDF. */}
        {reportReady && sectionStates && (
          <ReportBuilder
            states={sectionStates}
            checked={reportChecked}
            onToggle={(key) =>
              setReportChecked((prev) => ({ ...prev, [key]: !prev[key] }))
            }
          />
        )}
      </div>

      {/* The print-only document — a SIBLING of the screen tree (outside every
          motion/AnimatePresence wrapper), visible only under @media print. */}
      {reportReady && sectionStates && result && (
        <PrintReport
          article={article}
          result={result}
          intel={intelResult}
          factCheck={factCheckResult}
          fullStory={fullStoryResult}
          include={effectiveSelection(reportChecked, sectionStates)}
        />
      )}
    </>
  );
}
