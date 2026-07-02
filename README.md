# Prism

**See every angle of the story.**

Prism is a news-transparency tool — a "news lens" in the spirit of Ground News. Give it one
article and it **refracts the story into its full spectrum**, making bias, framing, and sourcing
*visible* instead of guessed at.

Paste a link or raw text, and Prism will:

- **Break down the composition** — classify every sentence as a factual claim, opinion, spin/BS, or
  neutral, and render an interactive color-coded transcript.
- **Trace provenance** — an on-demand dossier on the outlet (ownership, funding, leaning,
  reliability), the author, and the domain itself (registration + hosting forensics).
- **Fact-check the claims** — verify the article's factual claims against live web sources.
- **Show the full picture** — coverage-gap analysis vs. other outlets: what the article covered,
  softened, or omitted, plus framing contrast.
- **Generate a report** — a print-to-PDF summary of everything that was revealed.

> The repository folder is named `TranspaarentFacts` for historical reasons — **the product is
> Prism.**

---

## Tech stack

- **[Next.js 15](https://nextjs.org/)** (App Router) · **React 19** · **TypeScript**
- **[Tailwind CSS](https://tailwindcss.com/)** with a strict Swiss / International Typographic
  Style design system (pure black & white + one accent)
- **[Framer Motion](https://www.framer.com/motion/)** for motion (all of it respects
  `prefers-reduced-motion`)
- **[Groq](https://groq.com/)** (`llama-3.3-70b-versatile`) — sentence classifier, fact-check
  judge, and research dossiers
- **[Tavily](https://tavily.com/)** — live web search for fact-checking, provenance, and coverage
  comparison
- **[@extractus/article-extractor](https://github.com/extractus/article-extractor)** — article
  extraction from URLs
- Keyless **RDAP / DoH / ipwho.is** lookups for domain + hosting forensics
- **Deploy target: [Vercel](https://vercel.com/)**

---

## Getting started

### Prerequisites

- **Node.js 18.18+** (Next.js 15 requirement)
- A **Groq API key** — free at [console.groq.com/keys](https://console.groq.com/keys)
- A **Tavily API key** — free at [app.tavily.com](https://app.tavily.com) (1,000 searches/month)

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment variables
cp .env.local.example .env.local
#    then open .env.local and fill in your keys

# 3. Run the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The first request compiles — allow ~15s
warm-up.

### Environment variables

| Variable               | Required     | Used for                                                        |
| ---------------------- | ------------ | --------------------------------------------------------------- |
| `GROQ_API_KEY`         | **Yes**      | All analysis screens (classifier, fact-check judge, dossiers)   |
| `TAVILY_API_KEY`       | Recommended  | Provenance, Fact Check, and Full Picture (web search)           |
| `NEXT_PUBLIC_SITE_URL` | Optional     | Canonical OG/share URLs once a domain is attached               |

See `.env.local.example` for the full annotated template. Without `TAVILY_API_KEY` the core
composition analysis still works; the research-heavy sections are disabled.

---

## Scripts

| Command         | Description                                  |
| --------------- | -------------------------------------------- |
| `npm run dev`   | Start the dev server on `localhost:3000`     |
| `npm run build` | Production build                             |
| `npm start`     | Serve the production build                   |
| `npm run lint`  | Run ESLint (`next lint`)                      |

---

## Project structure

```
app/
  page.tsx              Landing page (Hero + How It Works + About + Footer)
  layout.tsx            Global header, metadata, OG/Twitter cards
  get-started/          The tool (six screens down one page)
  api/                  Node-runtime API routes:
    extract/            URL → article text
    analyze/            Sentence classification (Groq)
    sourceintel/        Outlet + author + domain forensics
    factcheck/          Claim verification (Tavily + Groq)
    fullstory/          Coverage-gap analysis
components/
  analyze/              The tool's client orchestrator + screens
  brand.ts              SPECTRUM colors + signature easing
  ...                   Landing sections + shared brand pieces
lib/                    API engines (extract, analyze, sentences,
                        sourceintel, factcheck, fullstory, errors, types)
docs/                   Architecture, design notes, full build log
```

The tool itself is six screens on one page:

1. **Workspace** — paste a link or text → editable source + article preview
2. **The Spectrum** — claim / opinion / BS / neutral composition + interactive transcript
3. **Provenance** — on-demand outlet, author, and domain dossier
4. **Fact Check** — on-demand claim verification against live sources
5. **The Full Picture** — on-demand coverage-gap analysis vs. other outlets
6. **The Report** — print-to-PDF summary of the revealed sections

---

## Design system

Prism follows a deliberate **Swiss / International Typographic Style** brand:

- **Palette:** pure black & white plus a single accent (`#FF3B00`). Accent is reserved for the
  primary CTA, the prism's refracted spectrum, and small section marks.
- **The spectrum** (red → violet) is the one sanctioned use of full color.
- **Typography:** Inter, tight-tracked headings, generous whitespace, a strong 72rem grid.
- **Data colors are validated** (CVD + contrast), never eyeballed. Verdict color never appears
  without a non-color channel (a glyph or label).

Full rationale lives in `docs/design-notes.md`.

---

## Deploying to Vercel

1. Push this repo to GitHub.
2. Import the repo at [vercel.com/new](https://vercel.com/new).
3. Add `GROQ_API_KEY` and `TAVILY_API_KEY` (and optionally `NEXT_PUBLIC_SITE_URL`) as environment
   variables in the Vercel project settings.
4. Deploy. Next.js is auto-detected — no extra configuration needed.

---

## Notes & limitations

- **No auth, no persistence, no news aggregation** — Prism analyzes one article at a time.
- **Groq free tier** is ≈ 100k tokens/day; a full six-screen run spends a meaningful chunk, so
  budget live testing accordingly.
- Extraction can struggle with **paywalled** articles — pasting the text directly always works.
