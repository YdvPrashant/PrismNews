# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **Read "CURRENT STATE" + "NEXT" below first.** This project is built **iteratively, one step at
> a time**, and the user drives each step — do not build ahead. After every step: append the full
> DONE entry to `docs/progress-log.md` and refresh CURRENT STATE / NEXT / Landmines here.

Deep-dive docs (read when relevant, not by default):
- `docs/progress-log.md` — full Step 1–11 history, incl. per-step verification gaps
- `docs/architecture.md` — the annotated file tree
- `docs/design-notes.md` — PrismLogo contract, palette-validation history, chart discipline

## Project: Prism

A **news-transparency product** — a "news lens" in the spirit of Ground News: take one story and
**refract it into the full spectrum** of how it's reported, so bias, framing, and sourcing are
visible instead of guessed at.

- The folder is named `TranspaarentFacts` for historical reasons; the **product is Prism**.
- Tagline: "See every angle of the story." · Deploy target: **Vercel**.

## Design system (Swiss / International Typographic Style)

Deliberate brand choice — keep everything faithful to it:

- **Palette = pure black & white + one accent.** Tokens `paper`/`ink`/`accent` live in
  `tailwind.config.ts` + CSS vars in `app/globals.css`; reuse them, never hardcode hex values in
  components.
- **Accent discipline is a rule, not a suggestion:** accent only for the Get Started CTA, the
  prism's refracted spectrum, and small section labels/marks. When in doubt, leave it black/white.
- **The spectrum** (red→violet, `SPECTRUM` in `components/brand.ts`; `SPECTRUM[0]` = accent) is
  the ONE sanctioned use of full color — only in the prism's rays and thin `SpectrumRule`
  dividers. Shared signature easing: `EASE_OUT` (also in `brand.ts`).
- **Typography:** Inter (neo-grotesque). Big tight-tracked headings (`tracking-tightest`),
  generous whitespace, strong grid (`maxWidth.grid = 72rem`).
- **All motion respects `prefers-reduced-motion`** — keep that contract in any new animation.
- **Data palettes are validated, not eyeballed** (CVD + contrast; history in
  `docs/design-notes.md`) — never invent new data colors. Verdict color never appears without a
  non-color channel: **`onFill`** token for text on solid fills + **`mark` glyph** (✓✕!?). For UI
  chrome (error labels, forensics flags, status dots) use the Tailwind state aliases
  **`danger`/`warn`/`ok`** — they alias validated palette values; don't reintroduce raw hexes.
- **Global utilities** (`globals.css`): `.bg-blueprint` (faint drafting grid — the tool's "optical
  bench"), `.u-scroll` (hairline scrollbars), ink `:focus-visible` ring, accent text caret.
  `<CornerMarks />` adds registration-mark crosses to a framed card — parent `relative`, marks
  OUTSIDE any `overflow-hidden`.

## Commands

- Dev: `npm run dev` → http://localhost:3000 (first request compiles; allow ~15s warm-up)
- Build: `npm run build` · Start (prod): `npm start` · Lint: `npm run lint`

## Architecture (compressed — full annotated tree: `docs/architecture.md`)

- **Landing** (`app/page.tsx`): `Hero` + `HowItWorks` + `AboutSection` + `Footer`; global
  `Header` and site metadata (OG/Twitter cards, title template) in `app/layout.tsx`; Swiss
  404 (`not-found.tsx`) + crash screen (`error.tsx`) + `icon.svg` + `opengraph-image.tsx`.
- **The tool** (`/get-started` → `components/analyze/AnalyzeApp.tsx`, client orchestrator): six
  screens down one page — 01 Workspace (source + preview) · 02 The Spectrum (composition +
  transcript) · 03 Provenance · 04 Fact Check · 05 The Full Picture · 06 The Report. 03–05 are
  on-demand CTAs; 06 is the download checklist (`report.ts` registry gates it and the print-only
  `PrintReport` sibling; `glance.ts` shares the At-a-glance math — see landmine 8).
- **API routes** (all Node runtime) with their `lib/` engines: `/api/extract` (`extract.ts`) ·
  `/api/analyze` (`analyze.ts` Groq classifier + `sentences.ts` deterministic splitter) ·
  `/api/sourceintel` (`sourceintel.ts`: RDAP/DoH/ipwho.is forensics + Tavily + Groq dossier) ·
  `/api/factcheck` (`factcheck.ts`: Tavily search + Groq judge) · `/api/fullstory`
  (`fullstory.ts`: coverage gaps vs other outlets). Shared: `types.ts`, `errors.ts`
  (`friendlyError()`).
- **Muted data-color token files** (`categories.ts` / `verdicts.ts` / `provenance.ts` /
  `coverage.ts` in `components/analyze/`) — muted, validated, deliberately NOT the accent.
- Landing sections are small composable components — follow that pattern when adding sections;
  reuse `SPECTRUM`/`EASE_OUT` from `brand.ts` and `SpectrumRule` rather than reinventing.

## Landmines — don't regress these

1. Header rail is exactly `h-14` — the tool's `calc(100vh-3.5rem)` sections depend on it (Step 7).
2. Workspace card grid needs `md:grid-rows-[56vh]` **+ `min-h-0` on both panes** — a
   container-height-only constraint breaks the pane-internal scroll chain (Step 7 post-fix).
3. On-demand sections (03/04/05) size to content — no `min-h-screen`; only workspace + spectrum
   get viewport-height treatment (Step 8).
4. Don't churn `PrismLogo` — it has broken twice; its orientation + animation contract are in
   `docs/design-notes.md` (Steps 2/7).
5. `app/opengraph-image.tsx` hardcodes SPECTRUM — keep it in sync with `brand.ts` (Step 10).
6. Groq free tier ≈ 100k tokens/day; one full five-screen run spends a big chunk — budget live
   tests (Step 9).
7. A running `next dev` holds `.next` and can fail `next build` with a phantom `/_document`
   error — `npx tsc --noEmit` is the reliable signal then (Steps 5/6).
8. Print contract: `Header` + the tool's screen tree carry `print:hidden` (tree only once a
   report exists); `PrintReport` is the ONLY print-visible tree — keep it motion-free (never
   `SpectrumRule` there: `whileInView` can't fire under `display:none`, it prints invisible) and
   register any new on-demand section in `components/analyze/report.ts` or the report drifts (Step 11).

## Progress

Full step history (Steps 1–11) lives in `docs/progress-log.md`; new DONE entries go there. The
two sections below are kept current in this file.

### CURRENT STATE
- Swiss-design landing page (sticky header w/ nav, staggered hero, **"How it works" five-instrument
  section**, real manifesto copy in About, colophon footer) is live and building cleanly. Site has
  a real SEO/share surface (title template, OG/Twitter cards, OG image, favicon) and Swiss
  404/error pages (Step 10).
- `/get-started` is the **Phase 1 tool**, now six screens down one page:
  1. **Workspace** — paste link/text → unified card: editable source + article preview.
  2. **The Spectrum** — claim/opinion/bs/neutral composition + interactive color-coded transcript.
  3. **Provenance** — on-demand dossier: outlet ownership/money/leaning/reliability, author
     profile, domain registration + hosting forensics (link-only).
  4. **Fact Check** — on-demand verification of the article's claims against live web sources.
  5. **The Full Picture** — on-demand coverage-gap analysis vs other outlets: what the article
     covered / softened / omitted + framing contrast (works for pasted text too).
  6. **The Report** — checklist of the revealed sections (unrevealed ones grayed with hints;
     transcript is its own item) → print-to-PDF via `window.print()`, zero deps (Step 11).
- **Backend:** `/api/extract` + `/api/analyze` + `/api/sourceintel` + `/api/factcheck` +
  `/api/fullstory` (all Node runtime); `lib/` engine (`extract`, `sentences`, `analyze`,
  `sourceintel`, `factcheck`, `fullstory`, `errors`); Groq classifier + Groq/Tavily research,
  fact-checking and coverage comparison + keyless RDAP/DoH/ipwho.is forensics.
- No auth, no persistence, no news aggregation. Landing copy is now real (Step 10).
- **Requires `GROQ_API_KEY`** (all analysis screens) and **`TAVILY_API_KEY`** (Provenance, Fact
  Check, Full Picture). Optional: `NEXT_PUBLIC_SITE_URL` for canonical OG URLs once a domain exists.

### NEXT (user will confirm/choose the next step)
- **The live pass that remains:** the fact-check *engines* (Step 6) are still untested against
  live Groq/Tavily — Step 11's headless run kept 429-ing on Groq quota (its UI/report seam was
  verified with a mocked response); Full Picture hasn't re-run since the brand filter; Step 7/10
  UI states + mobile layouts (incl. section 06) + the real print dialog + reduced-motion
  entrances still need human eyeballs in a browser.
- Tuning likely needed: the classify rubric (`lib/analyze.ts`), the fact-check judge prompt and
  claim selection/cap (`lib/factcheck.ts`), and verdict thresholds.
- Then, pending direction: caching fact-check results, per-claim re-check, clause-level granularity,
  better extraction fallbacks (paywalls), or the multi-perspective aggregation feature.
- Per-step verification gaps + full history: `docs/progress-log.md`.
- **Ask the user which step to take next; do not build ahead.**

## Working agreement (from the user)

- Build **incrementally**; finish one step, then wait for the next instruction.
- The user wants the frontend **modern, minimal, and appealing** — take design input from them and
  offer clear choices before committing to visual decisions.
- **Keep the docs current** so a fresh session can pick up exactly where we left off: after every
  step, append the full DONE entry to `docs/progress-log.md` and refresh CURRENT STATE / NEXT /
  Landmines in this file. CLAUDE.md stays ~130 lines; only the log grows.
