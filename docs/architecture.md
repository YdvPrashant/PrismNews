# Prism — Architecture (annotated file tree)

Moved verbatim from CLAUDE.md on 2026-07-02. Keep annotations current when files change;
CLAUDE.md holds only a compressed map.

```
app/
  layout.tsx          Root layout — Inter, global <Header />, site metadata (metadataBase +
                      title template + OG/Twitter cards), base body
  globals.css         Tailwind directives + palette CSS variables + base resets
  page.tsx            Landing page — <Hero /> + <HowItWorks /> + <AboutSection /> + <Footer />
  error.tsx           Route crash screen (never shows error.message; reset + Home)
  not-found.tsx       Swiss 404 — "Lost beam", blueprint backdrop, both CTAs
  icon.svg            Favicon — prism triangle on a paper square
  opengraph-image.tsx OG/Twitter share image (ImageResponse; SPECTRUM hardcoded — keep in sync)
  get-started/
    page.tsx          Phase 1 tool entry — renders <AnalyzeApp /> (server wrapper + metadata)
  api/
    extract/route.ts  POST { url } → pull readable article text + metadata (Node runtime)
    analyze/route.ts  POST { text } → Groq sentence classification → AnalysisResult (Node runtime)
    factcheck/route.ts POST { claims[] } → Tavily search + Groq judge → FactCheckResult (Node runtime)
    sourceintel/route.ts POST { url, author?, outletName? } → Provenance dossier (Node runtime)
    fullstory/route.ts POST { text, title?, url? } → coverage-gap analysis (Node runtime)
lib/
  types.ts            Category / Segment / AnalysisResult / ExtractedArticle + fact-check types
                      (Verdict / Evidence / ClaimCheck / FactCheckResult) + provenance types
                      (Leaning / Reliability / RevenueType / SourcedNote / OutletIntel /
                      AuthorIntel / DomainForensics / IntelSource / SourceIntelResult)
  sentences.ts        Deterministic, lossless sentence splitter (server-side)
  analyze.ts          Groq classifier (llama-3.3-70b-versatile), batched, JSON-mode
  factcheck.ts        Claims-only fact-checker: Tavily search + Groq verdict, ≥2-proof backfill
  sourceintel.ts      Provenance engine: RDAP + DoH + ipwho.is forensics ∥ Tavily research →
                      one Groq dossier synthesis (per-field citations, "unknown" allowed)
  fullstory.ts        Coverage-gap engine: distill event query → Tavily (own brand excluded) →
                      Groq judges covered/partial/missing points + framing vs other outlets
  errors.ts           friendlyError() — maps raw Groq 429 blobs → human rate-limit message
  extract.ts          @extractus/article-extractor + HTML→text + isValidUrl
components/
  analyze/
    AnalyzeApp.tsx    'use client' orchestrator — input→extract→analyze→spectrum→factcheck
    SectionHead.tsx   Shared numbered section header (index + eyebrow + title + rule + sub)
    InputPanel.tsx    Full-screen opening input (auto-detects link vs text, live chip + counts)
    SourcePanel.tsx   Editable source pane of the unified workspace card (+ read-receipt meta)
    ArticlePreview.tsx Preview pane of the unified workspace card
    SpectrumView.tsx  Composes composition + transcript; owns the shared category filter
    SourceIntel.tsx   Provenance screen — CTA → dossier (identity strip, leaning dial,
                      reliability meter, ownership/money/author/paper-trail cells)
    provenance.ts     MUTED leaning/reliability/revenue tokens (NOT the accent)
    FullStory.tsx     The Full Picture screen — CTA → summary + coverage checklist + framing
    coverage.ts       MUTED covered/partial/missing + completeness tokens (NOT the accent)
    Favicon.tsx       Shared favicon-with-fallback (claim source tabs + citation chips)
    CiteChips.tsx     Shared citation favicon links into a numbered source pool
    ScanOverlay.tsx   Shared loading overlay: spectrum scan line + status label
    ProportionBar.tsx Composition: grouped bar (BS→Neutral→Claim→Opinion) + legend + "At a glance"
    Transcript.tsx    Color-coded transcript (tint + underline, hover reason caption, filter dim)
    categories.ts     MUTED red/blue/green + grey tokens per Category (NOT the accent)
    FactCheck.tsx     Fact Check screen — CTA → dashboard (summary strip + claim explorer)
    ClaimExplorer.tsx Master–detail: verdict-colored numbered claim rail + detail w/ source logo tabs
    verdicts.ts       MUTED verdict + stance color tokens (NOT the accent)
  brand.ts            Shared constants: SPECTRUM (red→violet) + EASE_OUT easing
  PrismLogo.tsx       Animated SVG prism — upward triangle, beam → refracted spectrum, 'use client'
  SpectrumRule.tsx    Thin spectrum divider bar that wipes in (reduced-motion aware), 'use client'
  CornerMarks.tsx     Swiss registration-mark crosses for framed cards (server component)
  Header.tsx          Sticky hairline top bar — brand + meta + nav (Manifesto / Refract), 'use client'
  Hero.tsx            Logo + PRISM wordmark + spectrum rule + tagline + dual CTA + scroll cue
  HowItWorks.tsx      "One story, five instruments." — the five tool screens, numbered 01–05,
                      each with the question it answers + honesty chips, 'use client'
  AboutSection.tsx    "The project" manifesto + 3 unnumbered principles, scroll-reveal, 'use client'
  Footer.tsx          Spectrum hairline + build/version note (server component)
tailwind.config.ts    Brand tokens (paper/ink/accent + danger/warn/ok state aliases), Inter font
                      var, grid width
```
