// Prism "The Full Picture" — was it the full story?
//
// One outlet's article is one angle. This engine distills the article into a
// neutral event query, pulls how OTHER outlets covered the same event (the
// article's own domain is excluded), and has the model judge — against those
// sources only — which consensus facts the article covered, softened, or left
// out entirely, plus how its framing differs. Thin coverage → honest "unknown";
// nothing is ever model-invented.

import Groq from "groq-sdk";
import {
  COMPLETENESS_LEVELS,
  COVERAGE_STATUSES,
  type Completeness,
  type CoveragePoint,
  type CoverageStatus,
  type FullStoryResult,
  type IntelSource,
} from "./types";

const MODEL = "llama-3.3-70b-versatile";
const RESULTS_PER_QUERY = 6;
const CONCURRENCY = 2;
const MAX_SOURCES = 10; // the numbered pool of outside coverage
const ARTICLE_SLICE = 8000; // chars of the article fed to the comparison
const MIN_SOURCES_TO_JUDGE = 3; // fewer than this → verdict is "unknown"

const COMPARE_SYSTEM = `You are Prism's coverage analyst. You compare ONE news ARTICLE against a numbered list of SOURCES — real search results from OTHER outlets covering the same event — and identify what the article covered, softened, or omitted.

Hard rules:
- The "fuller picture" comes ONLY from the provided sources. NEVER invent events, details, or sources. Every point's "citations" array holds the integer indices of sources that establish its fact — at least one each.
- Judge each point's "status" against the ARTICLE text alone:
  - "covered": the article clearly reports it.
  - "partial": the article mentions it but softens or under-specifies it (e.g. "gunmen opened fire" when sources document a targeted terrorist attack).
  - "missing": the article does not mention it at all.
- Give 4 to 8 points, the most significant first. "fact" ≤ 30 words; "note" ≤ 25 words explaining how the article handled it.
- "framing": ONE sentence each contrasting how the article characterizes the event vs how the sources do. If there is no meaningful difference, set framing to null.
- "verdict": "complete" | "minor-gaps" | "major-gaps". If the sources are too few, off-topic, or too thin to judge fairly, use "unknown" and say so in "verdictNote" — do NOT declare gaps on weak evidence.
- "verdictNote" ≤ 30 words, plain and concrete.

Return STRICT JSON only, no prose.`;

interface TavilyResult {
  title: string;
  url: string;
  content: string;
}

function getGroqClient(): Groq {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GROQ_API_KEY is not set. Add it to .env.local (see .env.local.example).",
    );
  }
  return new Groq({ apiKey });
}

function publisherOf(url: string): string | undefined {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return undefined;
  }
}

// The outlet's "brand" label — the meaningful part of its domain (aljazeera
// from aljazeera.com). Used to drop the outlet's OTHER properties from the
// comparison pool (studies.aljazeera.net must not vouch for aljazeera.com).
const GENERIC_LABELS = new Set([
  "com",
  "net",
  "org",
  "co",
  "gov",
  "edu",
  "ac",
  "info",
  "news",
]);

function brandLabelOf(domain: string): string | undefined {
  const labels = domain.toLowerCase().split(".").filter(Boolean);
  for (let i = labels.length - 2; i >= 0; i--) {
    if (!GENERIC_LABELS.has(labels[i]) && labels[i].length >= 3) {
      return labels[i];
    }
  }
  return labels[0];
}

function sameBrand(publisher: string, brand: string): boolean {
  return publisher.toLowerCase().split(".").includes(brand);
}

async function tavilySearch(
  query: string,
  excludeDomains: string[],
): Promise<TavilyResult[]> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    throw new Error(
      "TAVILY_API_KEY is not set. Add it to .env.local (see .env.local.example).",
    );
  }

  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: apiKey,
      query,
      search_depth: "basic",
      max_results: RESULTS_PER_QUERY,
      include_answer: false,
      include_raw_content: false,
      ...(excludeDomains.length > 0 ? { exclude_domains: excludeDomains } : {}),
    }),
  });

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      throw new Error("Tavily rejected the API key. Check TAVILY_API_KEY.");
    }
    return [];
  }

  const data = (await res.json()) as { results?: unknown };
  if (!Array.isArray(data.results)) return [];

  return data.results
    .map((r) => r as Record<string, unknown>)
    .filter((r) => typeof r.url === "string" && typeof r.title === "string")
    .map((r) => ({
      title: String(r.title),
      url: String(r.url),
      content: typeof r.content === "string" ? r.content : "",
    }));
}

// Run an async mapper over items with a bounded concurrency.
async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, () =>
    (async () => {
      while (cursor < items.length) {
        const i = cursor++;
        out[i] = await fn(items[i]);
      }
    })(),
  );
  await Promise.all(workers);
  return out;
}

// Distill the article into a neutral event query (who/what/where — no framing).
async function distillQuery(
  client: Groq,
  title: string | undefined,
  text: string,
): Promise<string> {
  const fallback =
    title?.trim() || text.trim().split(/\s+/).slice(0, 12).join(" ");

  try {
    const completion = await client.chat.completions.create({
      model: MODEL,
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You turn a news article into ONE concise, neutral web-search query for the underlying event: the who/what/where, stripped of the outlet's framing and adjectives. 4–12 words. Return STRICT JSON: {\"query\":\"...\"}",
        },
        {
          role: "user",
          content: `TITLE: ${title ?? "(none)"}\n\nARTICLE START:\n${text.slice(0, 1500)}`,
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (typeof parsed.query === "string" && parsed.query.trim().length >= 4) {
      return parsed.query.trim();
    }
  } catch {
    /* fall back below */
  }
  return fallback;
}

function isStatus(v: unknown): v is CoverageStatus {
  return typeof v === "string" && (COVERAGE_STATUSES as string[]).includes(v);
}
function isCompleteness(v: unknown): v is Completeness {
  return typeof v === "string" && (COMPLETENESS_LEVELS as string[]).includes(v);
}

function clampCitations(v: unknown, maxIndex: number): number[] {
  return Array.isArray(v)
    ? v
        .filter(
          (c): c is number =>
            typeof c === "number" && Number.isInteger(c) && c >= 0 && c < maxIndex,
        )
        .slice(0, 4)
    : [];
}

async function judgeCoverage(
  client: Groq,
  title: string | undefined,
  text: string,
  sources: IntelSource[],
): Promise<Pick<FullStoryResult, "verdict" | "verdictNote" | "points" | "framing">> {
  const thin: Pick<
    FullStoryResult,
    "verdict" | "verdictNote" | "points" | "framing"
  > = {
    verdict: "unknown",
    verdictNote:
      "Not enough outside coverage of this story was found to judge completeness fairly.",
    points: [],
    framing: null,
  };

  if (sources.length < MIN_SOURCES_TO_JUDGE) return thin;

  const numbered = sources.map((s, i) => ({
    index: i,
    publisher: s.publisher,
    title: s.title,
    snippet: s.snippet,
  }));

  const sliced = text.slice(0, ARTICLE_SLICE);
  const noteShape = `{"fact":"<max 30 words>","status":"covered|partial|missing","note":"<max 25 words>","citations":[<int>]}`;
  const userContent =
    `ARTICLE TITLE: ${title ?? "(none)"}\n` +
    `ARTICLE TEXT${text.length > ARTICLE_SLICE ? " (truncated)" : ""}:\n${sliced}\n\n` +
    `SOURCES (other outlets):\n${JSON.stringify(numbered)}\n\n` +
    `Return JSON of the exact shape:\n` +
    `{"verdict":"complete|minor-gaps|major-gaps|unknown","verdictNote":"<max 30 words>",` +
    `"points":[${noteShape}],` +
    `"framing":{"article":"<one sentence>","elsewhere":"<one sentence>","citations":[<int>]} or null}`;

  const completion = await client.chat.completions.create({
    model: MODEL,
    temperature: 0,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: COMPARE_SYSTEM },
      { role: "user", content: userContent },
    ],
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";
  let parsed: Record<string, unknown> = {};
  try {
    parsed = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return thin;
  }

  const n = sources.length;

  const points: CoveragePoint[] = (Array.isArray(parsed.points) ? parsed.points : [])
    .map((p) => p as Record<string, unknown>)
    .filter((p) => typeof p.fact === "string" && p.fact.trim() && isStatus(p.status))
    .slice(0, 8)
    .map((p) => ({
      fact: String(p.fact).trim(),
      status: p.status as CoverageStatus,
      note: typeof p.note === "string" ? p.note.trim() : "",
      citations: clampCitations(p.citations, n),
    }));

  let framing: FullStoryResult["framing"] = null;
  if (parsed.framing && typeof parsed.framing === "object") {
    const f = parsed.framing as Record<string, unknown>;
    if (
      typeof f.article === "string" &&
      f.article.trim() &&
      typeof f.elsewhere === "string" &&
      f.elsewhere.trim()
    ) {
      framing = {
        article: f.article.trim(),
        elsewhere: f.elsewhere.trim(),
        citations: clampCitations(f.citations, n),
      };
    }
  }

  // A verdict with no supporting points isn't a judgment — keep it honest.
  const verdict: Completeness =
    isCompleteness(parsed.verdict) && (points.length > 0 || parsed.verdict === "unknown")
      ? parsed.verdict
      : "unknown";

  return {
    verdict,
    verdictNote:
      typeof parsed.verdictNote === "string" && parsed.verdictNote.trim()
        ? parsed.verdictNote.trim()
        : thin.verdictNote,
    points,
    framing,
  };
}

export async function compareCoverage(
  text: string,
  title?: string,
  url?: string,
): Promise<FullStoryResult> {
  const client = getGroqClient();

  // The article's own outlet must not vouch for itself.
  let ownDomain: string | undefined;
  try {
    if (url) ownDomain = new URL(url).hostname.replace(/^www\./, "");
  } catch {
    /* pasted text or bad url — nothing to exclude */
  }
  const exclude = ownDomain ? [ownDomain, `www.${ownDomain}`] : [];

  const storyQuery = await distillQuery(client, title, text);

  const queries = [storyQuery, `${storyQuery} what happened details`];
  const batches = await mapWithConcurrency(queries, CONCURRENCY, (q) =>
    tavilySearch(q, exclude),
  );

  const ownBrand = ownDomain ? brandLabelOf(ownDomain) : undefined;
  const seen = new Set<string>();
  const sources: IntelSource[] = [];
  for (const batch of batches) {
    for (const r of batch) {
      const pub = publisherOf(r.url);
      // Belt and braces: drop ALL of the outlet's own properties (any TLD or
      // subdomain sharing its brand label), even if the search provider
      // ignores exclude_domains.
      if (ownBrand && pub && sameBrand(pub, ownBrand)) continue;
      if (seen.has(r.url) || sources.length >= MAX_SOURCES) continue;
      seen.add(r.url);
      sources.push({
        title: r.title,
        url: r.url,
        publisher: pub,
        snippet: r.content.slice(0, 400).trim(),
      });
    }
  }

  const judged = await judgeCoverage(client, title, text, sources);

  return { storyQuery, ...judged, sources };
}
