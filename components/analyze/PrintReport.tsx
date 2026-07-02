import type {
  AnalysisResult,
  Category,
  CoverageStatus,
  ExtractedArticle,
  FactCheckResult,
  FullStoryResult,
  IntelSource,
  SourcedNote,
  SourceIntelResult,
  Verdict,
} from "@/lib/types";
import { SPECTRUM } from "@/components/brand";
import { CATEGORY_META, CATEGORY_ORDER } from "./categories";
import { STANCE_META, VERDICT_META } from "./verdicts";
import { COMPLETENESS_META, COVERAGE_META } from "./coverage";
import { LEANING_META, RELIABILITY_META, REVENUE_META } from "./provenance";
import { deriveGlance } from "./glance";
import type { ReportSectionKey } from "./report";

// The downloadable report — a print-only document (`hidden print:block`) that
// AnalyzeApp renders as a sibling of the screen tree; `.print-report` styles in
// globals.css do the rest. It mirrors the on-screen findings as a clean typeset
// document, not a screenshot of the app.
//
// Hard rules for this tree:
// - NO framer-motion (and never SpectrumRule: its whileInView entrance can't
//   fire inside display:none, so it would print at scaleX(0) — invisible).
// - No hooks, no Favicon/network images — pure markup that prints as-is.
// - Color never appears without a non-color channel (mark glyph or text label),
//   so the document survives grayscale printers untouched.

// Static twin of SpectrumRule.
function Rule() {
  return (
    <span className="flex h-[3px] w-full">
      {SPECTRUM.map((c) => (
        <span key={c} className="h-full flex-1" style={{ backgroundColor: c }} />
      ))}
    </span>
  );
}

// Mini section head — ghost screen numeral + tracked title over a hairline.
function Head({ refIndex, title }: { refIndex: string; title: string }) {
  return (
    <div className="break-after-avoid mt-9 flex items-baseline gap-3 border-b border-ink/20 pb-2">
      <span className="text-[9pt] tabular-nums text-ink/40">{refIndex}</span>
      <h2 className="text-[12pt] font-bold uppercase tracking-[0.14em]">
        {title}
      </h2>
    </div>
  );
}

// Verdict/coverage identity chip: colored square + glyph + literal label.
function Chip({
  bg,
  fg,
  mark,
  label,
}: {
  bg: string;
  fg: string;
  mark: string;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="inline-flex h-4 w-4 items-center justify-center rounded-sm text-[8pt] font-bold leading-none"
        style={{ backgroundColor: bg, color: fg }}
      >
        {mark}
      </span>
      <span className="text-[8.5pt] font-semibold uppercase tracking-[0.1em]">
        {label}
      </span>
    </span>
  );
}

// Plain numbered citations — [n] resolving against the section's source list
// (the on-screen favicon CiteChips are pointless on paper).
function Cites({
  citations,
  sources,
}: {
  citations: number[];
  sources: IntelSource[];
}) {
  const valid = citations.filter((i) => Boolean(sources[i]));
  if (valid.length === 0) return null;
  return (
    <sup className="text-[7.5pt] text-ink/50">
      {" "}
      {valid.map((i) => `[${i + 1}]`).join(" ")}
    </sup>
  );
}

function SourcesList({ sources }: { sources: IntelSource[] }) {
  if (sources.length === 0) return null;
  return (
    <div className="mt-5">
      <p className="text-[8pt] font-medium uppercase tracking-[0.2em] text-ink/40">
        Sources
      </p>
      <ol className="mt-1.5 space-y-1.5">
        {sources.map((s, i) => (
          <li
            key={i}
            className="break-inside-avoid text-[8.5pt] leading-snug text-ink/70"
          >
            <span className="tabular-nums text-ink/45">[{i + 1}]</span>{" "}
            <span className="font-medium text-ink/85">{s.title}</span>
            {s.publisher && <span> — {s.publisher}</span>}
            <span className="block break-all text-ink/50">{s.url}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

// Labeled prose note with resolved citations (provenance dossier fields).
function Note({
  label,
  note,
  sources,
}: {
  label: string;
  note: SourcedNote;
  sources: IntelSource[];
}) {
  return (
    <div className="break-inside-avoid mt-3">
      <p className="text-[8pt] font-medium uppercase tracking-[0.18em] text-ink/40">
        {label}
      </p>
      <p className="mt-0.5 text-[9.5pt] leading-relaxed text-ink/85">
        {note.text}
        <Cites citations={note.citations} sources={sources} />
      </p>
    </div>
  );
}

export default function PrintReport({
  article,
  result,
  intel,
  factCheck,
  fullStory,
  include,
}: {
  article: ExtractedArticle | null;
  result: AnalysisResult;
  intel: SourceIntelResult | null;
  factCheck: FactCheckResult | null;
  fullStory: FullStoryResult | null;
  include: Record<ReportSectionKey, boolean>;
}) {
  const glance = deriveGlance(result.segments, result.scores);
  const chars = new Map(result.scores.map((s) => [s.category, s.chars]));
  const pct = new Map(result.scores.map((s) => [s.category, s.percent]));
  const catCount = (c: Category) =>
    result.segments.reduce((n, s) => n + (s.category === c ? 1 : 0), 0);

  const metaLine = [article?.source, article?.author, article?.publishedDate]
    .filter(Boolean)
    .join(" · ");
  const generated = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div aria-hidden className="print-report hidden print:block">
      {/* Masthead */}
      <header>
        <div className="flex items-baseline justify-between">
          <p className="text-[15pt] font-bold tracking-tightest">PRISM</p>
          <p className="text-[8pt] font-medium uppercase tracking-[0.25em] text-ink/50">
            Analysis report
          </p>
        </div>
        <div className="mt-2">
          <Rule />
        </div>
        <h1 className="mt-6 text-[17pt] font-bold leading-tight tracking-tightest">
          {article?.title ?? "Pasted text"}
        </h1>
        {metaLine && (
          <p className="mt-1.5 text-[9.5pt] text-ink/60">{metaLine}</p>
        )}
        {article?.url && (
          <p className="mt-1 break-all text-[8.5pt] text-ink/45">
            {article.url}
          </p>
        )}
        <p className="mt-3 text-[8pt] uppercase tracking-[0.18em] text-ink/40">
          Generated {generated}
        </p>
      </header>

      {/* 01 · Source */}
      {include.source && (
        <section className="break-inside-avoid">
          <Head refIndex="01" title="Source" />
          <dl className="mt-3 space-y-1.5 text-[9.5pt]">
            {[
              { k: "Title", v: article?.title ?? "Pasted text (no link)" },
              { k: "Outlet", v: article?.source },
              { k: "Author", v: article?.author },
              { k: "Published", v: article?.publishedDate },
              { k: "Link", v: article?.url },
              {
                k: "Length",
                v: `${glance.sentences} sentences · ~${glance.words.toLocaleString()} words · ${glance.readMin} min read`,
              },
            ]
              .filter((row) => Boolean(row.v))
              .map((row) => (
                <div key={row.k} className="flex gap-3">
                  <dt className="w-24 shrink-0 text-[8pt] uppercase tracking-[0.14em] leading-[1.9] text-ink/40">
                    {row.k}
                  </dt>
                  <dd className="break-all font-medium text-ink/85">{row.v}</dd>
                </div>
              ))}
          </dl>
          {result.truncated && (
            <p className="mt-2 text-[8.5pt] text-ink/50">
              A very long article — the analysis covers its beginning.
            </p>
          )}
        </section>
      )}

      {/* 02 · The Spectrum — composition */}
      {include.spectrum && (
        <section className="break-inside-avoid">
          <Head refIndex="02" title="The Spectrum" />
          <p className="mt-3 text-[11pt] font-bold tracking-tight">
            {glance.verdict.label}
          </p>
          <p className="mt-0.5 text-[9pt] text-ink/60">{glance.verdict.note}</p>

          <table className="mt-3 w-full border-collapse text-[9.5pt]">
            <thead>
              <tr className="border-b border-ink/20 text-left text-[8pt] uppercase tracking-[0.14em] text-ink/40">
                <th className="py-1.5 font-medium">Category</th>
                <th className="py-1.5 text-right font-medium">Share</th>
                <th className="py-1.5 text-right font-medium">Sentences</th>
                <th className="py-1.5 text-right font-medium">Characters</th>
              </tr>
            </thead>
            <tbody>
              {CATEGORY_ORDER.map((cat) => {
                const meta = CATEGORY_META[cat];
                return (
                  <tr key={cat} className="border-b border-ink/10">
                    <td className="py-1.5">
                      <span className="inline-flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: meta.bar }}
                        />
                        <span className="font-semibold">{meta.label}</span>
                      </span>
                    </td>
                    <td className="py-1.5 text-right tabular-nums">
                      {pct.get(cat) ?? 0}%
                    </td>
                    <td className="py-1.5 text-right tabular-nums">
                      {catCount(cat)}
                    </td>
                    <td className="py-1.5 text-right tabular-nums">
                      {(chars.get(cat) ?? 0).toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <p className="mt-2.5 text-[8.5pt] text-ink/55">
            Opinion vs fact {glance.ratio} · Signal vs filler {glance.signal}%
            ({100 - glance.signal}% is connective/neutral text)
          </p>
        </section>
      )}

      {/* 02 · Transcript — every sentence with its literal label */}
      {include.transcript && (
        <section>
          <Head refIndex="02" title="Transcript" />
          <p className="mt-2 text-[8.5pt] text-ink/50">
            <span className="tabular-nums">{glance.sentences}</span> sentences,
            each labeled by what it&apos;s doing.
          </p>
          <div className="mt-3">
            {result.segments.map((seg, i) => {
              const meta = CATEGORY_META[seg.category];
              // Same paragraph-break signal the on-screen transcript uses.
              const hasBreak = /\n\s*\n/.test(seg.text);
              return (
                <div
                  key={i}
                  className={`break-inside-avoid grid grid-cols-[5.5rem_1fr] gap-x-3 py-[3px] ${
                    hasBreak ? "mb-3" : ""
                  }`}
                >
                  <span
                    className="pt-[1px] text-[7.5pt] font-semibold uppercase tracking-[0.12em]"
                    style={{ color: meta.text }}
                  >
                    {meta.label}
                  </span>
                  <span
                    className="text-[9.5pt] leading-relaxed text-ink/90"
                    style={{
                      backgroundColor: meta.tint,
                      boxShadow: `inset 0 -1px 0 0 ${meta.underline}`,
                    }}
                  >
                    {seg.text.replace(/\s+$/g, "")}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 03 · Provenance */}
      {include.provenance && intel && (
        <section>
          <Head refIndex="03" title="Provenance" />

          <div className="break-inside-avoid mt-3 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <p className="text-[11pt] font-bold tracking-tight">
              {intel.outletName}
            </p>
            <p className="text-[8.5pt] text-ink/50">
              {intel.domain} · {REVENUE_META[intel.outlet.revenue.type].label}
            </p>
          </div>

          <div className="mt-2 grid grid-cols-2 gap-x-6">
            <div className="break-inside-avoid">
              <p className="text-[8pt] font-medium uppercase tracking-[0.18em] text-ink/40">
                Political leaning
              </p>
              <p className="mt-0.5 text-[10pt] font-bold">
                {LEANING_META[intel.outlet.leaning.value].label}
              </p>
              <p className="mt-0.5 text-[8.5pt] leading-relaxed text-ink/60">
                {intel.outlet.leaning.note.text}
                <Cites
                  citations={intel.outlet.leaning.note.citations}
                  sources={intel.sources}
                />
              </p>
            </div>
            <div className="break-inside-avoid">
              <p className="text-[8pt] font-medium uppercase tracking-[0.18em] text-ink/40">
                Historical reliability
              </p>
              <p className="mt-0.5 text-[10pt] font-bold">
                {RELIABILITY_META[intel.outlet.reliability.value].mark}{" "}
                {RELIABILITY_META[intel.outlet.reliability.value].label}
              </p>
              <p className="mt-0.5 text-[8.5pt] leading-relaxed text-ink/60">
                {intel.outlet.reliability.note.text}
                <Cites
                  citations={intel.outlet.reliability.note.citations}
                  sources={intel.sources}
                />
              </p>
            </div>
          </div>

          <Note label="Ownership" note={intel.outlet.ownership} sources={intel.sources} />
          <Note label="Follow the money" note={intel.outlet.funding} sources={intel.sources} />
          <Note label="Revenue model" note={intel.outlet.revenue.note} sources={intel.sources} />

          <div className="break-inside-avoid mt-4">
            <p className="text-[8pt] font-medium uppercase tracking-[0.18em] text-ink/40">
              The author
            </p>
            {intel.author ? (
              <p className="mt-0.5 text-[10pt] font-semibold tracking-tight">
                {intel.author.name}
              </p>
            ) : (
              <p className="mt-0.5 text-[9.5pt] text-ink/60">
                No individual byline — no single author to profile.
              </p>
            )}
          </div>
          {intel.author && (
            <>
              <Note label="Topic expertise" note={intel.author.expertise} sources={intel.sources} />
              <Note label="Track record" note={intel.author.trackRecord} sources={intel.sources} />
              <Note label="Controversies" note={intel.author.controversies} sources={intel.sources} />
            </>
          )}

          <div className="break-inside-avoid mt-4">
            <p className="text-[8pt] font-medium uppercase tracking-[0.18em] text-ink/40">
              The paper trail
            </p>
            {intel.forensics ? (
              <>
                <dl className="mt-1 space-y-1 text-[9.5pt]">
                  {[
                    { k: "Registrar", v: intel.forensics.registrar ?? "—" },
                    {
                      k: "Registered",
                      v: intel.forensics.createdDate
                        ? `${intel.forensics.createdDate.slice(0, 10)}${
                            intel.forensics.ageYears !== undefined
                              ? ` · ${intel.forensics.ageYears} yrs`
                              : ""
                          }`
                        : "—",
                    },
                    {
                      k: "Registrant country",
                      v: intel.forensics.registrantCountry ?? "—",
                    },
                    {
                      k: "Hosted by",
                      v: intel.forensics.hostingOrg
                        ? `${intel.forensics.hostingOrg}${
                            intel.forensics.hostingCountry
                              ? ` · ${intel.forensics.hostingCountry}`
                              : ""
                          }`
                        : (intel.forensics.hostingCountry ?? "—"),
                    },
                  ].map((row) => (
                    <div key={row.k} className="flex gap-3">
                      <dt className="w-32 shrink-0 text-[8pt] uppercase tracking-[0.14em] leading-[1.9] text-ink/40">
                        {row.k}
                      </dt>
                      <dd className="font-medium text-ink/85">{row.v}</dd>
                    </div>
                  ))}
                </dl>
                {intel.forensics.cdnMasked && (
                  <p className="mt-1.5 text-[8.5pt] text-ink/50">
                    Served via a CDN — the true origin server is masked.
                  </p>
                )}
                {intel.forensics.flags.map((flag) => (
                  <p
                    key={flag}
                    className="mt-1.5 text-[8.5pt] font-medium text-warn"
                  >
                    ▲ {flag}
                  </p>
                ))}
              </>
            ) : (
              <p className="mt-0.5 text-[9.5pt] text-ink/60">
                Registry and hosting lookups returned nothing for this domain.
              </p>
            )}
          </div>

          <SourcesList sources={intel.sources} />
        </section>
      )}

      {/* 04 · Fact Check */}
      {include.factcheck && factCheck && (
        <section>
          <Head refIndex="04" title="Fact Check" />
          {(() => {
            const counts: Record<Verdict, number> = {
              supported: 0,
              disputed: 0,
              misleading: 0,
              unverified: 0,
            };
            for (const check of factCheck.checks) counts[check.verdict]++;
            const problems = counts.disputed + counts.misleading;
            // Same headline thresholds as the on-screen dashboard.
            const headline =
              counts.supported > 0 && problems === 0
                ? "Largely holds up"
                : problems >= counts.supported && problems > 0
                  ? "Doesn't fully hold up"
                  : "A mixed picture";
            return (
              <div className="break-inside-avoid mt-3">
                <p className="text-[11pt] font-bold tracking-tight">
                  {headline}
                </p>
                <p className="mt-0.5 text-[9pt] text-ink/60">
                  <span className="tabular-nums">
                    {counts.supported} of {factCheck.checkedCount}
                  </span>{" "}
                  claims supported
                  {factCheck.checkedCount < factCheck.totalClaims && (
                    <>
                      {" "}
                      ·{" "}
                      <span className="tabular-nums">
                        {factCheck.checkedCount} of {factCheck.totalClaims}
                      </span>{" "}
                      claims checked
                    </>
                  )}
                </p>
              </div>
            );
          })()}

          {factCheck.checks.map((check, i) => {
            const meta = VERDICT_META[check.verdict];
            return (
              <div
                key={i}
                className="break-inside-avoid mt-3 border border-ink/15 p-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                  <Chip
                    bg={meta.bar}
                    fg={meta.onFill}
                    mark={meta.mark}
                    label={meta.label}
                  />
                  <span className="text-[8pt] uppercase tracking-[0.14em] text-ink/45">
                    № {i + 1} · {check.confidence} confidence
                  </span>
                </div>
                <p className="mt-2 text-[10pt] font-semibold leading-snug">
                  &ldquo;{check.claim}&rdquo;
                </p>
                <p className="mt-1.5 text-[9pt] leading-relaxed text-ink/70">
                  {check.explanation}
                </p>
                {check.evidence.length > 0 && (
                  <ul className="mt-2 space-y-1.5">
                    {check.evidence.map((ev, j) => (
                      <li
                        key={j}
                        className="text-[8.5pt] leading-snug text-ink/70"
                      >
                        <span
                          className="font-semibold"
                          style={{ color: STANCE_META[ev.stance].color }}
                        >
                          {STANCE_META[ev.stance].mark}{" "}
                          {STANCE_META[ev.stance].label}
                        </span>{" "}
                        — {ev.title}
                        {ev.publisher && ` · ${ev.publisher}`}
                        <span className="block break-all text-ink/45">
                          {ev.url}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </section>
      )}

      {/* 05 · The Full Picture */}
      {include.fullstory && fullStory && (
        <section>
          <Head refIndex="05" title="The Full Picture" />
          {(() => {
            const counts: Record<CoverageStatus, number> = {
              covered: 0,
              partial: 0,
              missing: 0,
            };
            for (const p of fullStory.points) counts[p.status]++;
            return (
              <div className="break-inside-avoid mt-3">
                <p className="text-[11pt] font-bold tracking-tight">
                  {COMPLETENESS_META[fullStory.verdict].label}
                </p>
                <p className="mt-0.5 text-[9pt] leading-relaxed text-ink/70">
                  {fullStory.verdictNote}
                </p>
                <p className="mt-1 text-[8.5pt] tabular-nums text-ink/50">
                  {fullStory.points.length > 0 &&
                    `${counts.covered} covered · ${counts.partial} softened · ${counts.missing} missing · `}
                  Searched: &ldquo;{fullStory.storyQuery}&rdquo;
                </p>
              </div>
            );
          })()}

          {fullStory.points.map((point, i) => {
            const meta = COVERAGE_META[point.status];
            return (
              <div key={i} className="break-inside-avoid mt-3">
                <Chip
                  bg={meta.bar}
                  fg={meta.onFill}
                  mark={meta.mark}
                  label={meta.label}
                />
                <p className="mt-1 text-[9.5pt] font-medium leading-snug text-ink/90">
                  {point.fact}
                </p>
                {point.note && (
                  <p className="mt-0.5 text-[8.5pt] leading-relaxed text-ink/60">
                    {point.note}
                    <Cites
                      citations={point.citations}
                      sources={fullStory.sources}
                    />
                  </p>
                )}
              </div>
            );
          })}

          {fullStory.framing && (
            <div className="break-inside-avoid mt-4 grid grid-cols-2 gap-x-6">
              <div>
                <p className="text-[8pt] font-medium uppercase tracking-[0.18em] text-ink/40">
                  How this article tells it
                </p>
                <p className="mt-1 border-l-2 border-ink/20 pl-2.5 text-[9pt] leading-relaxed text-ink/75">
                  {fullStory.framing.article}
                </p>
              </div>
              <div>
                <p className="text-[8pt] font-medium uppercase tracking-[0.18em] text-ink/40">
                  How other outlets tell it
                </p>
                <p className="mt-1 border-l-2 border-ink/20 pl-2.5 text-[9pt] leading-relaxed text-ink/75">
                  {fullStory.framing.elsewhere}
                  <Cites
                    citations={fullStory.framing.citations}
                    sources={fullStory.sources}
                  />
                </p>
              </div>
            </div>
          )}

          <SourcesList sources={fullStory.sources} />
        </section>
      )}

      {/* Colophon */}
      <footer className="mt-10 border-t border-ink/15 pt-3">
        <p className="text-[8pt] leading-relaxed text-ink/45">
          Generated by Prism — Prism&apos;s read of the sources it found, not a
          final ruling. Follow the citations and judge for yourself.
        </p>
      </footer>
    </div>
  );
}
