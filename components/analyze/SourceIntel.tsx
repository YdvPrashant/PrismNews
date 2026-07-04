"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { EASE_OUT } from "@/components/brand";
import SpectrumRule from "@/components/SpectrumRule";
import CornerMarks from "@/components/CornerMarks";
import type {
  ExtractedArticle,
  IntelSource,
  OutletIntel,
  SourcedNote,
  SourceIntelResult,
} from "@/lib/types";
import SectionHead from "./SectionHead";
import Favicon from "./Favicon";
import CiteChips from "./CiteChips";
import ScanOverlay from "./ScanOverlay";
import {
  LEANING_META,
  LEANING_SCALE,
  RELIABILITY_META,
  RELIABILITY_SCALE,
  REVENUE_META,
} from "./provenance";

type Status = "idle" | "loading" | "done" | "error";

// 03 · Provenance — who is telling you this story? On-demand dossier on the
// outlet (ownership, money, leaning, reliability), the author, and the domain's
// paper trail (registration + hosting). Link-only: pasted text has no source.
// `onResult` reports successful loads up to the orchestrator (for the report);
// local state stays the source of truth for this section's own UI.
export default function SourceIntel({
  article,
  onResult,
}: {
  article: ExtractedArticle | null;
  onResult?: (result: SourceIntelResult) => void;
}) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SourceIntelResult | null>(null);

  const domain = (() => {
    try {
      return article ? new URL(article.url).hostname.replace(/^www\./, "") : null;
    } catch {
      return null;
    }
  })();
  const isVideo = article?.kind === "video";

  async function run() {
    if (status === "loading" || !article) return;
    setStatus("loading");
    setError(null);
    try {
      const res = await fetch("/api/sourceintel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: article.url,
          author: article.author,
          outletName: article.source,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Source trace failed.");
      setResult(data as SourceIntelResult);
      onResult?.(data as SourceIntelResult);
      setStatus("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setStatus("error");
    }
  }

  return (
    // No min-h-screen: on-demand sections size to content — the idle CTA is
    // small, and a forced viewport height leaves a huge void before 04.
    <section className="mx-auto w-full max-w-grid px-6 py-16">
      <SectionHead
        index="03"
        eyebrow="Provenance"
        title="Who's telling you this?"
        sub={
          <>
            Every story arrives from somewhere. Prism traces the outlet&apos;s{" "}
            <span className="text-ink">ownership, money, and slant</span>, profiles
            the byline, and checks where the site itself is registered and hosted.
          </>
        }
      />

      {isVideo && (
        <p className="mt-4 max-w-2xl text-xs leading-relaxed text-ink/45">
          This is a video. Prism profiles the{" "}
          <span className="text-ink/70">creator&apos;s channel</span> as the
          source; the registration &amp; hosting trail describes{" "}
          <span className="text-ink/70">YouTube</span>, the platform it&apos;s
          published on.
        </p>
      )}

      <AnimatePresence mode="wait">
        {!article || !domain ? (
          <motion.p
            key="nolink"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-10 border border-dashed border-ink/20 px-5 py-8 text-center text-sm text-ink/45"
          >
            Provenance needs a link — this text was pasted, so there&apos;s no
            source to trace. Re-run with the article&apos;s URL.
          </motion.p>
        ) : status === "idle" ? (
          <IdleState
            key="idle"
            domain={domain}
            outletName={article.source ?? domain}
            onRun={run}
          />
        ) : status === "loading" ? (
          <LoadingState key="loading" />
        ) : status === "error" ? (
          <ErrorState key="error" message={error} onRetry={run} />
        ) : result ? (
          <Dossier key="dossier" result={result} />
        ) : null}
      </AnimatePresence>
    </section>
  );
}

function IdleState({
  domain,
  outletName,
  onRun,
}: {
  domain: string;
  outletName: string;
  onRun: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: EASE_OUT }}
      className="mt-10 flex flex-col items-start gap-6 border border-ink/10 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8"
    >
      <div className="flex min-w-0 items-center gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center border border-ink/15 bg-paper">
          <Favicon domain={domain} fallback="?" size={26} />
        </span>
        <div className="min-w-0">
          <p className="truncate text-xl font-bold tracking-tight">
            {outletName}
          </p>
          <p className="mt-0.5 truncate text-xs text-ink/45">{domain}</p>
          <p className="mt-1.5 text-xs text-ink/40">
            Runs a few live web searches + registry lookups — that&apos;s why
            it&apos;s on demand.
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onRun}
        className="group inline-flex shrink-0 items-center gap-2 bg-accent px-8 py-4 text-base font-medium text-paper transition-colors duration-200 hover:bg-ink"
      >
        Trace the source
        <span
          aria-hidden
          className="transition-transform duration-200 group-hover:translate-x-1"
        >
          →
        </span>
      </button>
    </motion.div>
  );
}

function LoadingState() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative mt-10"
    >
      <div className="space-y-4 opacity-40">
        <div className="border border-ink/10 p-6">
          <div className="h-6 w-56 animate-pulse rounded-sm bg-ink/10" />
          <div className="mt-3 h-3 w-32 animate-pulse rounded-sm bg-ink/[0.07]" />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {[0, 1].map((i) => (
            <div key={i} className="border border-ink/10 p-6">
              <div className="h-3 w-28 animate-pulse rounded-sm bg-ink/10" />
              <div className="mt-4 h-5 w-full animate-pulse rounded-sm bg-ink/[0.07]" />
              <div className="mt-3 h-3 w-3/4 animate-pulse rounded-sm bg-ink/[0.06]" />
            </div>
          ))}
        </div>
      </div>

      <ScanOverlay label="Pulling registry records and researching the outlet…" />
    </motion.div>
  );
}

function ErrorState({
  message,
  onRetry,
}: {
  message: string | null;
  onRetry: () => void;
}) {
  return (
    <motion.div
      role="alert"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="mt-10 flex flex-col items-center gap-4 border border-ink/10 px-6 py-12 text-center"
    >
      <p className="text-xs font-medium uppercase tracking-[0.25em] text-danger">
        The trace didn&apos;t go through
      </p>
      <p className="max-w-md text-sm text-ink/60">
        {message ?? "The source trace failed."}
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="bg-ink px-6 py-3 text-sm font-medium text-paper transition-colors duration-200 ease-swiss hover:bg-accent"
      >
        Try again
      </button>
    </motion.div>
  );
}

// The five-stop diverging dial: Left · Lean left · Center · Lean right · Right.
// One ink-labeled marker on a hairline track; labels are always present so the
// reading never depends on the marker's color.
function LeaningDial({
  leaning,
  sources,
}: {
  leaning: OutletIntel["leaning"];
  sources: IntelSource[];
}) {
  const known = leaning.value !== "unknown";
  const idx = known
    ? LEANING_SCALE.indexOf(leaning.value as (typeof LEANING_SCALE)[number])
    : -1;

  return (
    <div className="p-5 sm:p-6">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-ink/35">
          Political leaning
        </p>
        <p className="text-sm font-bold tracking-tight">
          {LEANING_META[leaning.value].label}
        </p>
      </div>

      <div className="mt-5">
        <div className="relative h-3">
          <span
            aria-hidden
            className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-ink/15"
          />
          {LEANING_SCALE.map((stop, i) => (
            <span
              key={stop}
              aria-hidden
              className="absolute top-1/2 h-2 w-px -translate-x-1/2 -translate-y-1/2 bg-ink/25"
              style={{ left: `${(i + 0.5) * 20}%` }}
            />
          ))}
          {idx >= 0 && (
            <span
              aria-hidden
              className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{
                left: `${(idx + 0.5) * 20}%`,
                backgroundColor: LEANING_META[leaning.value].color,
              }}
            />
          )}
        </div>
        <div className="mt-2 grid grid-cols-5">
          {LEANING_SCALE.map((stop) => (
            <span
              key={stop}
              className={`text-center text-[9px] uppercase tracking-[0.08em] ${
                known && stop === leaning.value
                  ? "font-bold text-ink"
                  : "text-ink/35"
              }`}
            >
              {LEANING_META[stop].label}
            </span>
          ))}
        </div>
      </div>

      <p className="mt-4 text-xs leading-relaxed text-ink/50">
        {leaning.note.text}
      </p>
      <CiteChips citations={leaning.note.citations} sources={sources} />
    </div>
  );
}

// The three-step reliability meter: Low · Mixed · High. The detected step is
// filled (glyph + label, luminance-aware text); the others stay outlined.
function ReliabilityMeter({
  reliability,
  sources,
}: {
  reliability: OutletIntel["reliability"];
  sources: IntelSource[];
}) {
  return (
    <div className="p-5 sm:p-6">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-ink/35">
          Historical reliability
        </p>
        <p className="text-sm font-bold tracking-tight">
          {RELIABILITY_META[reliability.value].label}
        </p>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-[2px]">
        {RELIABILITY_SCALE.map((step) => {
          const meta = RELIABILITY_META[step];
          const isActive = reliability.value === step;
          return (
            <span
              key={step}
              className="flex h-9 items-center justify-center gap-1.5 text-xs font-semibold"
              style={
                isActive
                  ? { backgroundColor: meta.color, color: meta.onFill }
                  : {
                      boxShadow: "inset 0 0 0 1px rgba(10,10,10,0.1)",
                      color: "rgba(10,10,10,0.35)",
                    }
              }
            >
              {isActive && <span aria-hidden>{meta.mark}</span>}
              {meta.label}
            </span>
          );
        })}
      </div>

      <p className="mt-4 text-xs leading-relaxed text-ink/50">
        {reliability.note.text}
      </p>
      <CiteChips citations={reliability.note.citations} sources={sources} />
    </div>
  );
}

function NoteBlock({
  label,
  note,
  sources,
}: {
  label: string;
  note: SourcedNote;
  sources: IntelSource[];
}) {
  return (
    <div className="mt-4 first:mt-0">
      <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-ink/35">
        {label}
      </p>
      <p className="mt-1.5 text-sm leading-relaxed text-ink/75">{note.text}</p>
      <CiteChips citations={note.citations} sources={sources} />
    </div>
  );
}

function Dossier({ result }: { result: SourceIntelResult }) {
  const { outlet, author, forensics, sources } = result;
  const registeredSince = forensics?.createdDate?.slice(0, 10);

  const trail: { k: string; v: string }[] = forensics
    ? [
        { k: "Registrar", v: forensics.registrar ?? "—" },
        {
          k: "Registered",
          v: registeredSince
            ? `${registeredSince}${
                forensics.ageYears !== undefined
                  ? ` · ${forensics.ageYears} yrs`
                  : ""
              }`
            : "—",
        },
        { k: "Registrant country", v: forensics.registrantCountry ?? "—" },
        {
          k: "Hosted by",
          v: forensics.hostingOrg
            ? `${forensics.hostingOrg}${
                forensics.hostingCountry ? ` · ${forensics.hostingCountry}` : ""
              }`
            : (forensics.hostingCountry ?? "—"),
        },
      ]
    : [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: EASE_OUT }}
      className="mt-10"
    >
      <div className="relative">
        <CornerMarks />
        <div className="overflow-hidden border border-ink/15 bg-paper">
          <SpectrumRule className="h-[3px]" />

          {/* Identity strip */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-ink/10 p-6 sm:p-8">
            <div className="flex min-w-0 items-center gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center border border-ink/15 bg-paper">
                <Favicon domain={result.domain} fallback="?" size={26} />
              </span>
              <div className="min-w-0">
                <h3 className="truncate text-xl font-bold tracking-tight sm:text-2xl">
                  {result.outletName}
                </h3>
                <p className="mt-0.5 truncate text-xs text-ink/45">
                  {result.domain}
                  {registeredSince && ` · since ${registeredSince.slice(0, 4)}`}
                </p>
              </div>
            </div>
            <span className="shrink-0 border border-ink/20 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-ink/70">
              {REVENUE_META[outlet.revenue.type].label}
            </span>
          </div>

          {/* Instrument readouts — the dial and the meter. */}
          <div className="grid border-b border-ink/10 md:grid-cols-2">
            <div className="min-w-0 md:border-r md:border-ink/10">
              <LeaningDial leaning={outlet.leaning} sources={sources} />
            </div>
            <div className="min-w-0 border-t border-ink/10 md:border-t-0">
              <ReliabilityMeter
                reliability={outlet.reliability}
                sources={sources}
              />
            </div>
          </div>

          {/* Dossier cells */}
          <div className="grid md:grid-cols-2">
            <div className="min-w-0 p-5 sm:p-6 md:border-r md:border-ink/10">
              <NoteBlock
                label="Ownership"
                note={outlet.ownership}
                sources={sources}
              />
            </div>

            <div className="min-w-0 border-t border-ink/10 p-5 sm:p-6 md:border-t-0">
              <NoteBlock
                label="Follow the money"
                note={outlet.funding}
                sources={sources}
              />
              <div className="mt-4">
                <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-ink/35">
                  Revenue model
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-ink/75">
                  {outlet.revenue.note.text}
                </p>
                <CiteChips
                  citations={outlet.revenue.note.citations}
                  sources={sources}
                />
              </div>
            </div>

            <div className="min-w-0 border-t border-ink/10 p-5 sm:p-6 md:border-r">
              <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-ink/35">
                The author
              </p>
              {author ? (
                <>
                  <p className="mt-1.5 text-base font-semibold tracking-tight">
                    {author.name}
                  </p>
                  <NoteBlock
                    label="Topic expertise"
                    note={author.expertise}
                    sources={sources}
                  />
                  <NoteBlock
                    label="Track record"
                    note={author.trackRecord}
                    sources={sources}
                  />
                  <NoteBlock
                    label="Controversies"
                    note={author.controversies}
                    sources={sources}
                  />
                </>
              ) : (
                <p className="mt-1.5 text-sm leading-relaxed text-ink/45">
                  No individual byline — Prism couldn&apos;t identify a single
                  author to profile.
                </p>
              )}
            </div>

            <div className="min-w-0 border-t border-ink/10 p-5 sm:p-6">
              <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-ink/35">
                The paper trail
              </p>
              {forensics ? (
                <>
                  <dl className="mt-1.5 divide-y divide-ink/[0.06]">
                    {trail.map((row) => (
                      <div
                        key={row.k}
                        className="flex items-baseline justify-between gap-3 py-2"
                      >
                        <dt className="text-xs uppercase tracking-[0.2em] text-ink/40">
                          {row.k}
                        </dt>
                        <dd className="min-w-0 break-words text-right text-sm font-medium tabular-nums">
                          {row.v}
                        </dd>
                      </div>
                    ))}
                  </dl>
                  {forensics.cdnMasked && (
                    <p className="mt-2 text-[11px] leading-snug text-ink/40">
                      Served via a CDN — the true origin server is masked.
                    </p>
                  )}
                  {forensics.flags.map((flag) => (
                    <p
                      key={flag}
                      className="mt-2 text-[11px] font-medium leading-snug text-warn"
                    >
                      ▲ {flag}
                    </p>
                  ))}
                </>
              ) : (
                <p className="mt-1.5 text-sm leading-relaxed text-ink/45">
                  Registry and hosting lookups returned nothing for this domain.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <p className="mt-8 max-w-xl text-xs leading-relaxed text-ink/40">
        Prism&apos;s read of the sources it found — registry data is often
        redacted, CDNs mask hosting, and bias ratings are third-party opinions.
        Follow the citations and judge for yourself.
      </p>
    </motion.div>
  );
}
