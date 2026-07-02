# Prism — Progress log (history)

Full step-by-step history (Steps 11 → 1, newest first), moved verbatim out of CLAUDE.md on
2026-07-02. Add each new step's full DONE entry at the top here; CLAUDE.md keeps only
CURRENT STATE / NEXT / Landmines.

### DONE — Step 11: The Report — section 06 checklist + print-to-PDF download (2026-07-03)
- **The ask:** a downloadable report of the analysis. A checklist at the end of the page picks
  which **revealed** sections make the cut; unrevealed on-demand sections are grayed out with an
  honest hint. User-locked decisions: **print-to-PDF** (print-styled DOM + `window.print()` —
  zero new deps, real selectable text) and the **transcript as its own checklist item**.
- **State lifting:** 03/04/05 results lived in child-local state, invisible to AnalyzeApp. Each
  child (`SourceIntel`/`FactCheck`/`FullStory`) gained an optional **`onResult`** callback fired
  beside its `setResult`; AnalyzeApp keeps lifted copies (`intelResult`/`factCheckResult`/
  `fullStoryResult`) + `reportChecked`, all reset in `run()` beside `setResult(null)` so a new
  run can't resurrect stale sections. Children's own render state untouched. `MIN_TEXT_CHARS`
  is now exported from FullStory so the registry mirrors its guard exactly.
- **New files:** `components/analyze/report.ts` — the single registry (section keys/labels,
  `getReportSectionStates` availability + hints, `defaultReportSelection` all-true,
  `effectiveSelection` = checked ∧ available) so checklist and printed document can't drift;
  `glance.ts` — `deriveGlance` extracted verbatim from ProportionBar's At-a-glance math
  (ProportionBar consumes it, render-identical); `ReportBuilder.tsx` — **06 · The Report**:
  Swiss checkbox rows (`role="checkbox"` buttons; grayed rows use `aria-disabled` + click guard
  so they stay focusable and their hint readable — hint is full-alpha ink inside the
  40%-opacity row), "N of 6 sections selected", accent CTA "Download the report ↓" (disabled at
  0), `downloadReport()` = local-date title swap (`prism-report-YYYY-MM-DD` becomes the PDF
  filename) + `window.print()` + afterprint/timeout restore; `PrintReport.tsx` — the print-only
  document: masthead, per-section blocks, static spectrum `Rule`, mark+label `Chip`s, plain
  `[n]` `Cites` resolving against numbered `SourcesList`s (favicon CiteChips are pointless on
  paper), per-sentence labeled transcript rows, verdict cards `break-inside-avoid`.
- **Print plumbing:** `PrintReport` renders as a **sibling** of the screen tree
  (`hidden print:block`, `aria-hidden`); the screen tree gets `print:hidden` **only when
  `reportReady`** (loading/error states still print the screen, not blank pages); `Header` is
  `print:hidden`; `@page { margin: 16mm }` + `@media print` block in `globals.css`
  (`print-color-adjust: exact` so tints/chips survive "Background graphics" off; 11pt body).
  `reportReady` requires `result.segments.length > 0` — an empty analysis gets no builder and
  no blank PDF. Organic Ctrl+P on a finished analysis prints the report too.
- **Verified (this session — prod build driven headlessly via CDP Chrome; screenshots + real
  `Page.printToPDF` output read back):** `tsc` + lint + build clean. Pasted-text run → 06 rows
  Source/Spectrum/Transcript pre-checked; Provenance grayed "Link-only…"; 04/05 grayed "Not yet
  revealed…". Clicking a grayed row doesn't toggle. Unchecking Transcript drops it from the PDF;
  0 selected disables the CTA. Print-media probe: header + screen tree `display:none`, report
  `block`. **PDF with backgrounds OFF keeps every category/verdict color** (print-color-adjust)
  and each color carries its mark/label. Fact-check row-flip verified with a **mocked
  `/api/factcheck`** (CDP Fetch fulfill; live Groq 429'd repeatedly — see gaps): row 04 flipped
  to enabled + pre-checked (3→4 of 6) and the PDF's Fact Check section rendered the headline
  ("Doesn't fully hold up", 1 of 4 supported) + all four verdict chips + stance-marked evidence
  with URLs, no card split across pages. Title swap restores after print — and caught a real
  bug, **fixed**: filename used UTC (`toISOString`) and lagged a day behind the masthead's
  local "Generated" date; now built from local date parts.
- **Gaps:** the live fact-check/full-picture engines remain untested (pre-existing Groq-quota
  blocker, unchanged by this step); real print-dialog UX, mobile 06 layout, and reduced-motion
  entrance not eyeballed (headless run); footer can land alone on a trailing PDF page (cosmetic).

### DONE — Step 10: Pre-launch polish — landing "How it works", SEO surface, error pages, a11y (2026-07-02)
- **Landing:** new **`HowItWorks.tsx`** between Hero and About — "One story, five instruments.",
  one row per tool screen (ghost numeral 01–05 + exact screen name + the question it answers +
  honesty chips `On demand` / `Link only`). Header gains a "How it works" nav link (hidden below
  `sm` — three links overflow the h-14 rail on a 375px phone); the hero's "How it works ↓" now
  targets `#how-it-works`. **`AboutSection` placeholder copy replaced with the real manifesto**
  (Every angle / Receipts, not rulings / Bias in the open; "a lens, not a referee") and its ghost
  numerals removed — the landing's only 01–05 numerals are the five instruments. Footer →
  "Built in the open." · **v0.2**.
- **SEO/share surface:** `layout.tsx` metadata now has `metadataBase` (`NEXT_PUBLIC_SITE_URL` →
  `VERCEL_URL` → localhost fallback — set the env var once a real domain exists), a `%s — Prism`
  **title template**, and OpenGraph + Twitter cards. New **`app/opengraph-image.tsx`**
  (ImageResponse: PRISM wordmark + spectrum rule + tagline on ink; SPECTRUM hardcoded — keep in
  sync with `brand.ts`; satori's default font, deliberately not fetching Inter at build) and
  **`app/icon.svg`** favicon (triangle on a paper square). `/get-started` gets its own
  title/description.
- **Error surfaces:** new **`app/not-found.tsx`** (Swiss 404 — "Lost beam / This angle doesn't
  exist.", blueprint backdrop, both CTAs) + **`app/error.tsx`** (route crash screen — never shows
  `error.message`, offers reset + Home). In the tool, the **workspace owns the single error card**
  (`role="alert"` + retry at eye level); section 02 shows only a quiet pointer back up; new
  dashed **empty state** when analysis returns zero segments.
- **Semantic tokens:** `danger #B02525` / `warn #8A5A12` / `ok #2F9E44` in `tailwind.config.ts` —
  aliases of already-validated data-palette values (NOT new colors), replacing scattered hardcoded
  hexes in error labels, forensics flags, and status dots.
- **A11y/UX sweep:** `role="alert"` on all error states, `role="status"` on `ScanOverlay` (which
  the workspace skeleton now reuses instead of its own duplicate scan line), `aria-label` on
  icon-only cite chips/source tabs, ProportionBar `role` img→**group** (an img must not contain
  focusable buttons), reduced-motion honored in Header/About/HowItWorks reveals. `ClaimExplorer`
  **stacks on phones** (rail becomes a horizontal strip; `min-h-0` keeps the detail pane's scroll
  alive in column flex). `ArticlePreview`'s "Scroll ↓" hint only renders when the pane actually
  overflows (ResizeObserver). ProportionBar gains an "All neutral" verdict for signal = 0.
  `friendlyError()` masks server-config messages naming `_API_KEY` env vars.
- **Verified (this session, prod build on :3199):** `tsc` + `next lint` + `next build` clean —
  lint first caught `app/error.tsx` using `<a href="/">`; fixed to `<Link>` (a route error
  boundary keeps the layout/router alive, so client nav is fine). Smoke: `/` has the section, nav
  link, all five instrument names, new About copy, v0.2 (old placeholder copy gone); title
  template renders "Refract a story — Prism"; a bogus route returns HTTP 404 with the new page;
  `/icon.svg` 200 `image/svg+xml`; `/opengraph-image` 200 `image/png` (downloaded + eyeballed —
  renders correctly); full OG/Twitter meta + icon link in SSR HTML. Probes: analyze/extract keep
  friendly 400s on empty/garbage bodies, wrong method → 405. **Not exercised:** `error.tsx`
  (needs a real crash), the `_API_KEY` masking (keys are set), and the in-tool client states —
  the live browser pass is still pending. **Step 10 sits uncommitted** on top of the initial
  commit (`71f341f` = end of Step 9).

### DONE — Step 9: Final screen "05 · The Full Picture" — "Was it the full story?" (2026-07-02)
- **The coverage-gap section** (user's Pahalgam example: an outlet writing "gunmen opened fire"
  while omitting that it was a targeted terrorist attack — misleading by omission/framing, which
  no earlier screen catches). Renders **after Fact Check as 05**; eyebrow "The Full Picture",
  title "Was it the full story?". **On-demand CTA** ("Compare the coverage", ~2 Tavily searches +
  2 Groq calls). **Works for pasted text too** — searches by a distilled event query, not the URL.
- **Engine (`lib/fullstory.ts`):** ① Groq distills a neutral who/what/where event query (fallback:
  title / first 12 words); ② Tavily ×2 (`exclude_domains` + a local **brand-label filter** —
  `studies.aljazeera.net` must not vouch for `aljazeera.com`; filter verified against
  aljazeera.net/.co.uk, cnn/bbc/wikipedia negatives); ③ one Groq judgment: 4–8 **CoveragePoints**
  (fact + status `covered`/`partial`/`missing` + note + citations), a **framing contrast**
  (article vs elsewhere, nullable), and a **Completeness verdict** — `unknown` whenever sources
  < 3 or the model can't judge fairly (breaking-news honesty; also forced when points are empty).
  Defensive parsing throughout, same house style as factcheck/sourceintel.
- **UI (`FullStory.tsx` + `coverage.ts`):** idle CTA ("What did every other outlet see?") →
  scan-line loading → spectrum-topped corner-marked card: **summary strip** (completeness
  headline + counts + thin gapped meter + glyph legend + transparency line `Searched: "…" · n
  outside sources`) → **the checklist** (status chip, consensus fact, how-the-article-handled-it
  note, citation chips; partial/missing rows get an amber/red inset left rule) → **framing panel**
  (two panes: "How this article tells it" vs "How other outlets tell it"). Thin-cycle footnote.
- **Shared extractions:** `CiteChips.tsx` (out of SourceIntel) + `ScanOverlay.tsx` (the duplicated
  scan-line loader out of FactCheck/SourceIntel); `coverage.ts` reuses the validated muted hexes.
- **Also: `lib/errors.ts` `friendlyError()`** wired into all four Groq routes — a Groq free-tier
  429 now reads "Prism's free language-model quota is used up… try again in ~Xm" instead of a raw
  JSON blob (hit for real during testing: **100k tokens/day cap**; a full 5-section run spends a
  chunk of it).
- **Verified:** `tsc` + `next build` + `next lint` clean (`/api/fullstory` registered). **Live
  test** on the real Al Jazeera US-Iran article: neutral query "US Iran negotiations", 10 outside
  sources (Wikipedia/ABC/CBS/CNN/NYT/BBC/CNBC…), 8 sane cited points (5 covered / 1 partial /
  2 missing), framing contrast produced, verdict `minor-gaps`. First run leaked
  `studies.aljazeera.net` → brand filter added and its logic verified offline; the **full
  pipeline re-run with the filter is unverified** because the Groq daily quota ran out mid-test —
  re-verify in the browser once quota resets. 400 path verified ("Not enough article text…").

### DONE — Step 8: New screen "03 · Provenance" — source & author intelligence (2026-07-02)
- **New section between the Spectrum and Fact Check** (Fact Check renumbered 03 → **04**):
  eyebrow **Provenance**, title "Who's telling you this?" — outlet ownership, funding,
  **Follow the Money** revenue archetype, political leaning, historical reliability, an author
  profile (expertise / track record / controversies), and a **"paper trail"** (where the domain is
  actually registered and hosted — the user's "shadow check").
- **Trigger (user's choice): on-demand CTA** ("Trace the source"), like Fact Check. Costs ~3–5
  Tavily searches + 1 Groq call per trace. **Link-only**: pasted text renders an honest dashed
  empty state.
- **Engine (`lib/sourceintel.ts`)** — two legs in parallel:
  1. **Forensics, free + keyless:** RDAP (`rdap.org/domain/{domain}`) → registrar / registration
     date / (rarely) registrant country; Cloudflare DoH → A record; `ipwho.is` → hosting org +
     country. Every lookup best-effort with 4s timeouts. **`cdnMasked`** (org matches
     cloudflare/fastly/akamai/amazon/… regex) suppresses the geo-mismatch flag — a CDN edge is not
     the origin. Flags: domain <1 yr old; registered-vs-hosted country mismatch (only when both
     known and not CDN-masked).
  2. **Research:** 3 outlet queries (+2 author queries when a real byline exists) via Tavily,
     deduped into ONE numbered source pool (≤18), then **one Groq JSON synthesis** with
     fact-check-style hard rules: sources only, never invent, every non-unknown field cites ≥1
     index, exact enums for leaning/reliability/revenue, prefer MBFC/AllSides/Ad Fontes/Wikipedia.
     Defensive parsing → "unknown" fallbacks (`SourcedNote`, enum guards, clamped citations).
  - `cleanAuthor()` rejects staff/desk/agency bylines and multi-author lists → author `null`.
- **UI (`SourceIntel.tsx` + `provenance.ts`):** idle CTA row (favicon + outlet + domain) →
  scan-line loading → **the dossier**: spectrum-topped, corner-marked card with an identity strip
  (favicon, name, "since YYYY", revenue badge chip), two instrument readouts (**five-stop diverging
  leaning dial** — muted blue↔red poles, grey center, labels always visible; **three-step
  reliability meter** — filled step w/ glyph + luminance-aware text), and four hairline cells:
  Ownership · Follow the money (+ revenue model note) · The author · The paper trail (dl +
  CDN caveat + amber ▲ flags). Every researched field shows **citation chips** (favicon links into
  the shared pool). Honest-limits footnote. `Favicon` extracted to a shared component (explorer +
  provenance).
- **Verified LIVE end-to-end:** `tsc` + `next build` clean (new `/api/sourceintel` route, 4
  screens); prod server test against the real Al Jazeera article → author "Al Jazeera Staff"
  correctly rejected; ownership/funding = Qatari government (cited: InfluenceWatch, network FAQ);
  revenue = **state-affiliated**; leaning lean-left + reliability mixed (cited: MBFC, AllSides);
  forensics: MarkMonitor, registered 1996 (30 yrs), hosted by Amazon with `cdnMasked: true` and no
  bogus geo flag. 400-validation path also verified. NOT yet eyeballed in the browser — worth a
  visual pass + a low-profile-outlet test (unknowns should render honestly).
- **Layout fix (browser review):** removed `min-h-screen` from the two ON-DEMAND sections
  (Provenance + Fact Check) — their idle CTAs are small, so a forced viewport height left a huge
  void between 03 and 04. On-demand sections size to content; only always-full sections
  (workspace, spectrum) keep viewport-height treatment.

### DONE — Step 7: Whole-project design & UI revamp (Fable, 2026-07-02)
- **Design-only pass across every screen** (user's ask: review + upgrade logo/name/animation/UI,
  landing through fact-checker). No backend/logic changes; all copy kept except tiny additive
  micro-labels. Swiss system deliberately KEPT and sharpened, not replaced.
- **Foundations** (`globals.css`, `tailwind.config.ts`): ink `:focus-visible` ring (keyboard a11y),
  accent text caret, `.u-scroll` hairline scrollbars, `.bg-blueprint` faint masked drafting grid,
  reduced-motion guard for smooth scroll, `ease-swiss` CSS twin of `EASE_OUT`. New
  `components/CornerMarks.tsx` (registration-mark crosses on major frames: input card, workspace
  card, claim explorer).
- **Landing:** `Header` is now a sticky hairline rail (h-14 exactly — the tool's
  `calc(100vh-3.5rem)` depends on it) with nav (Manifesto → /#about, Refract → ink button that
  flips style via `usePathname` on the tool page). `Hero` wordmark letters rise out of clipping
  slots left→right (reduced-motion → static; SR reads "PRISM" once via aria-label); CTAs now do a
  color flip (accent→ink) instead of translate. `AboutSection`: ghost numerals (big, ink/16 →
  accent on hover), `text-balance`, and a closing "Refract a story →" hand-off row. `Footer`:
  three-column colophon with the glyph. `SpectrumRule` respects reduced motion. **`PrismLogo` was
  reviewed and intentionally left untouched** — it follows its animation contract and has broken
  twice before; don't churn it.
- **Tool:** new `SectionHead` gives the three screens numbered Swiss headers (01 workspace ·
  02 spectrum · 03 fact check). `InputPanel` is an "instrument": drafting-grid backdrop, corner
  marks, animated LINK↗/TEXT¶ detection chip, live word count, kbd hint, borderless underline
  field. Busy states swap the rotating glyph for a **refracted scan line** (spectrum gradient
  hairline sweeping the skeleton; skipped under reduced motion). `SourcePanel`: live status dot in
  the eyebrow, editor fills the pane (flex-1), receipt pinned to the bottom. `ArticlePreview`:
  reader typography (0.95rem/1.8, balanced headline).
- **Data-viz pass (ran the dataviz skill's validator — don't regress these):** proportion bar is
  now 24px with **2px paper gaps** (no borders, no inline %; the legend carries count + % and shows
  the category blurb when active; active row gets a colored inset edge). Verdict meter same
  treatment; legend chips = glyph-on-fill (✓✕!?) using new `onFill` token. **Palette fixes:**
  misleading amber #B7791F→**#F08C00** (old one was ΔE 6.7 from the red under deutan — invisible
  difference), greys #ADB5BD→**#868E96** (3:1 contrast). `Transcript`: sentences are now
  keyboard-focusable and **click-to-pin** (caption bar holds the reason; shows "Pinned · n/N"),
  aria-live caption, sentence counter in the header. `FactCheck` idle: hero count in proportional
  figures (tabular-nums on display numbers is an anti-pattern) + "one search per claim" cost note.
  `ClaimExplorer`: corner marks, rail text uses `onFill` (ink on amber/grey), **confidence as three
  ascending ticks**, evidence snippet quoted with a stance-colored left rule.
- **Verified:** `npx tsc --noEmit` clean; **`npm run build` fully clean** (8 routes); prod server
  smoke-tested on :3199 — `/` and `/get-started` 200 with new header nav, wordmark, blueprint grid
  and input card present in SSR HTML. Spectrum/fact-check screens still not visually verified (need
  a live run). **`.env.local` now exists with both `GROQ_API_KEY` and `TAVILY_API_KEY` defined** —
  end-to-end verification is finally unblocked.
- **Post-Step-7 live-run fixes (same day; user ran a real article — extract + analyze WORK live):**
  the workspace card's two-pane grid used `md:h-[56vh]` on the container, but the implicit row was
  **auto-sized**, so a long article stretched both panes to the article's full height and the
  card's `overflow-hidden` clipped everything past 56vh — preview couldn't scroll, and the source
  pane's Re-run button + read-receipt were pushed out of view. Fix: **definite row track
  (`md:grid-rows-[56vh]`) + `min-h-0` on both pane divs** (grid items' automatic min-size otherwise
  defeats the track), which restores the pane-internal scroll chain. Don't reintroduce a
  container-height-only constraint there. Also: "Ready" status dot is now green (#2F9E44).

### DONE — Step 6: Phase 1 fact-checking — claims verified against live web sources (2026-07-02)
- **New capability + a third screen** after the workspace and the spectrum: **Fact Check**.
- **What we check & why:** **claims only.** Opinions are subjective and rhetoric ("bs") isn't
  falsifiable, so only `claim` segments are fact-checkable. The UI states this explicitly.
- **How (retrieval-augmented, real citations):** for each claim →
  1. **Tavily** web search (`https://api.tavily.com/search`, plain `fetch`, no SDK) returns real
     sources (title/url/snippet);
  2. **Groq** (`llama-3.3-70b-versatile`, JSON mode, temp 0) weighs the claim against ONLY those
     sources and returns a **verdict** (supported / disputed / misleading / unverified) +
     **confidence** + short grounded **explanation** + **citations** (index + stance).
  - We **backfill to ≥2 evidence items** when sources exist, so the user always sees more than one
    proof. URLs are never model-invented — every proof is a real search result.
  - Claims are deduped, min-length-filtered, and **capped at 6** (`selectClaims`); searches/judges
    run with **concurrency 3**.
- **On-demand:** the section shows the claim count + a **"Run fact-check"** CTA (it costs a search +
  LLM call per claim), then a dashboard.
- **Dashboard (Swiss, muted verdict colors, accent reserved for the CTA):** a **summary strip**
  (headline read + "supported of checked" + verdict distribution bar + legend) above a
  **master–detail claim explorer** (`ClaimExplorer.tsx`) so every claim fits one screen — no
  scrolling through N cards. Left = a narrow rail of **numbered claim buttons, each tinted by its
  verdict** (the rail doubles as a credibility overview; active gets an inset ring; a ✓/✕/!/? glyph
  covers color-blindness). Right = the selected claim's verdict · confidence · claim · rationale, with
  its **sources as switchable logo tabs** (favicons via Google s2, numbered-circle fallback, a stance
  dot per tab; the open source shows title / publisher / snippet / outbound link). Fixed height
  `clamp(24rem,56vh,36rem)`; rail/detail scroll only if needed. Honest-limits footnote included.
  (It was first built as a scrolling per-claim `ClaimCard` list, then replaced by the explorer and
  `ClaimCard.tsx` was deleted.)
- **New files:** `lib/factcheck.ts`, `app/api/factcheck/route.ts`, `components/analyze/FactCheck.tsx`,
  `components/analyze/ClaimExplorer.tsx`, `components/analyze/verdicts.ts`; types added to
  `lib/types.ts` (`Verdict`, `Evidence`, `ClaimCheck`, `FactCheckResult`, …).
- **Config:** needs a new **`TAVILY_API_KEY`** in `.env.local` (free at app.tavily.com, 1k/mo) in
  addition to `GROQ_API_KEY`. `.env.local.example` updated. Missing either → clean 500, nothing crashes.
- **Verified:** type-safe via `npx tsc --noEmit` (clean); the fact-check backend also built clean via
  `next build` earlier (added the `/api/factcheck` route). The final explorer wasn't re-built through
  `next build` because the user's running `next dev` holds `.next` (the intermittent `/_document`
  page-data error) — `tsc` is the reliable signal there. **NOT run end-to-end** — needs live GROQ +
  TAVILY keys (none this session): search quality, verdict quality, the ≥2-proof backfill, and the
  dashboard render are all **untested against live services**.

### DONE — Step 5: Phase 1 UI advancement — unified workspace + interactive spectrum (2026-07-02)
- **Aesthetic/UX upgrade pass (Opus), still frontend-only.** No backend/logic changes.
- **Workspace alignment fixed (the main complaint).** Source + Preview were two separate cards of
  very different heights → lopsided. Now they're **one spectrum-topped card, two equal-height panes
  divided by a hairline** (`md:h-[56vh]`, `md:grid-cols-12`, source `col-span-5` / preview
  `col-span-7`). The source pane distributes content top (editor + Re-run) and bottom (a compact
  **read-receipt `<dl>`**: Detected / Length / Status) via a flex spacer, so it fills its half
  instead of floating. `SourcePanel` now takes `status` + `article` props for that receipt.
- **New `SpectrumView.tsx`** composes composition + transcript and owns a shared **category filter**
  (`active: Category | null`, click-to-toggle). This links the two panes — the whole point of the tool.
- **Composition (`ProportionBar`) is now interactive + richer:** grouped bar has **inline %** on
  segments ≥9%; legend rows are **buttons** showing **count + %**; clicking a category (bar or
  legend) **isolates it in the transcript** and dims the rest; a "Clear" control + helper line.
- **Transcript (`Transcript`) upgraded:** bordered reading card with a **live reason caption bar**
  (updates on sentence hover — replaces the weak native tooltip) and **dimming** of non-active
  categories when a filter is on. Takes an `active` prop.
- **"At a glance" kept + refined** (verdict / opinion-vs-fact ratio / signal-vs-filler / length) —
  it's genuinely additive vs the legend, so I kept it rather than replacing it.
- `InputPanel` (pre-paste) left essentially as-is per the user ("it's good").
- **Verified:** `npm run build` clean (had to clear a stale `.next` `/_document` cache error once).
  **Not visually verified** — the composition/transcript/at-a-glance only render with a real result,
  which needs a `GROQ_API_KEY` (still not set). Next: add a key (or a temporary mock) to eyeball the
  spectrum, then tune.

### DONE — Step 4: Phase 1 frontend refactor to match the user's sketch (2026-07-02)
- **Frontend-only pass** (user is fixing Phase 1 bugs "one by one", frontend first). Reworked the
  `/get-started` UI to follow the user's hand-drawn reference:
  - **InputPanel** — now a clean centered "full page" card: label → single link/text field →
    Refract button beneath, with a spectrum rule across the top. (Was a left-aligned hero.)
  - **ProportionBar** — composition bar flipped from **vertical → horizontal** (reading order,
    left→right), with a **dot legend + %** beneath, and a dashed **"Additional signals"
    placeholder** panel (the sketch's "any other data you want to display yourself").
  - **Transcript** — moved into a **bordered, scrollable box** (max-h-[70vh]).
  - **ArticlePreview** — added a bottom fade + **"Scroll ↓"** hint over the scroll area.
  - **AnalyzeApp** — result grid is now composition `col-span-5` + transcript `col-span-7`; the
    busy state renders a **greyed-out skeleton** of the two-column layout (matches the sketch note
    "whole page greyed out when there is no link") instead of a bare spinner.
- **Verified:** `npm run build` clean. Layout/logic only — no backend changes; the classify path
  is still untested against a live Groq key (next up per Step 3).
- **Follow-up fixes (same day, from UI review):**
  - **SourcePanel** no longer stretches to the preview's height (was a tall empty box with the URL
    floating at the top). It's now a compact fixed-height box (`h-36`) and the workspace grid is
    `items-start`, so the page height stays stable across the refract transition.
  - **Composition bar** is now **grouped by category** (all of one color together), not a
    reading-order minimap. Fixed order **BS(red) → Neutral(grey) → Claim(green) → Opinion(blue)**,
    driven by `CATEGORY_ORDER` in `categories.ts` (legend matches). `ProportionBar` now takes only
    `scores` (segments prop dropped).
  - **Removed the `md:sticky` on `ProportionBar`** — it was detaching from the transcript and
    shifting alignment on scroll.
  - **Meaningful section names** instead of phase numbers: input eyebrow "Refract a story"; analysis
    section "The Spectrum" / "How the story splits"; scroll cue "The spectrum below".
- **Second UI-review pass (2026-07-02):**
  - **Workspace fills the viewport** (`min-h-[calc(100vh-3.5rem)]`, header is ~3.5rem) so "The
    Spectrum" section no longer peeks in at the bottom edge — it's revealed on scroll.
  - **Card design unified:** `SourcePanel` and `ArticlePreview` now use the same framed,
    spectrum-rule-topped card as the opening input (each with an accent eyebrow above the card), so
    the input screen and the workspace read as one product.
  - **"Additional signals" placeholder replaced with real metrics** — `ProportionBar` now shows an
    **"At a glance"** block computed from the result: a **verdict** (Fact-led / Opinion-led /
    Rhetoric-heavy), **opinion-vs-fact ratio**, **signal-vs-filler %**, and **length** (sentences /
    words / reading time). `ProportionBar` takes `segments` again (needed for the length stats).

### DONE — Step 3: Phase 1 tool — "Refract" (BS / Opinion / Claim analysis) (2026-07-01)
- **First real functionality behind Get Started.** `/get-started` is now the tool, not a placeholder.
- **What it does:** user pastes an article **link** OR **text** (auto-detected). A link is fetched
  server-side and its readable text extracted; text is used directly. The article is split into
  sentences and each sentence is classified as **claim / opinion / bs / neutral**, then scored by
  proportion (by character length).
- **Parsing engine = Groq** (user's choice), model **`llama-3.3-70b-versatile`**, via `groq-sdk`,
  JSON-mode (`response_format: json_object`), `temperature: 0`. Sentences are split **deterministically
  on the server** (`lib/sentences.ts`, verified lossless) and sent **indexed**; the model returns a
  category per index (never re-emits text), so coverage is guaranteed and text is never mangled.
  Batched 40 sentences/call in parallel; capped at 300 sentences (`truncated` flag).
- **Category definitions** live in the system prompt in `lib/analyze.ts` — claim = checkable fact,
  opinion = honest subjective take (incl. attributed), **bs = loaded/manipulative/empty rhetoric**
  (NOT "an opinion I dislike"), neutral = connective context. **4th neutral bucket** was the user's
  choice so filler doesn't inflate the three signals.
- **UI (Swiss-faithful, phases stacked one screen each):** Phase 01 full-screen input → after submit,
  a workspace: editable **SourcePanel** + **ArticlePreview** side-by-side on top; scroll down to
  **Phase 02** = left **ProportionBar** (vertical minimap + % legend) + right color-coded
  **Transcript** (hover a sentence for the model's one-line reason). Category colors are **muted**
  red/blue/green + grey (`components/analyze/categories.ts`) — deliberately NOT the reserved accent.
- **Config:** needs `GROQ_API_KEY` in `.env.local` (git-ignored; see `.env.local.example`). Free key
  at console.groq.com/keys. Missing key → clean 500 error, nothing crashes.
- **Verified:** `npm run build` clean (adds `/api/analyze`, `/api/extract`); splitter lossless +
  loop-safe on 5 samples; endpoint guardrails return correct 400/500; **live extraction confirmed**
  against a real URL. **NOT yet verified end-to-end with a real Groq key** (none available in this
  session) — the classify path is untested against the live model; that's the first thing to confirm.

### DONE — Step 2: Logo rebuild + design upgrade (2026-07-01)
- **Fixed the logo (main ask):** the prism pointed sideways (looked rotated 90°) — rebuilt it as
  an **upward-pointing** prism. The **refracted rays now render reliably** (previous version never
  showed them: it animated `pathLength` + `x2/y2` from a zero-length line and bound entrance
  opacity to the infinite shimmer). Now: static ray geometry, `pathLength`-only draw-in, group-level
  shimmer, and a light pulse that periodically travels into the prism. Confirmed all 7 ray strokes
  are present in the server-rendered HTML.
- **Design upgrade (Swiss-faithful):** added a global `Header` (prism glyph + wordmark + meta),
  a `Footer` (spectrum hairline + version), a reusable `SpectrumRule` divider, and `brand.ts`
  (shared `SPECTRUM` + `EASE_OUT`). Refined the `Hero` (bigger wordmark, spectrum rule, dual CTA
  "Get Started" + "How it works ↓", animated scroll cue) and `AboutSection` (scroll-reveal +
  accent hover on the principle cells).
- Verified: `npm run build` clean; dev server serves `/` and `/get-started` (200), all new
  elements present in HTML.

### DONE — Step 1: Landing page (2026-07-01)
- Scaffolded Next.js + TS + Tailwind + Framer Motion project (manually, no `create-next-app`).
- Built the animated **Prism** logo (`PrismLogo.tsx`): white beam refracts into a red→violet
  spectrum on load, idle shimmer, honours reduced-motion.
- Built the **Hero** (logo, PRISM wordmark, tagline, Get Started CTA) and **AboutSection**
  (mission + 3 principles, **placeholder copy the user will refine**).
- **Get Started** routes to `/get-started`, an intentional **placeholder page** (empty-ish).
- Verified: `npm run build` passes clean (3 static routes); dev server serves `/` and
  `/get-started` with 200s.
