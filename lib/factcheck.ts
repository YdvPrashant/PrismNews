// Prism Phase 1 fact-checking — CLAIMS ONLY.
//
// Opinions and rhetoric aren't falsifiable, so we only check `claim` sentences.
// For each claim we do retrieval-augmented verification:
//   1. Tavily web search  -> real sources (title, url, snippet)
//   2. Groq (llama-3.3-70b) weighs the claim against ONLY those sources and
//      returns a verdict + short rationale + citations (>=2 where possible).
// Every proof shown to the user is a real search result, never model-invented.

import Groq from "groq-sdk";
import {
  VERDICTS,
  type ClaimCheck,
  type Confidence,
  type Evidence,
  type FactCheckResult,
  type Verdict,
} from "./types";

const MODEL = "llama-3.3-70b-versatile";
const MAX_CLAIMS = 6; // bound cost/latency — check the most substantial claims
const RESULTS_PER_CLAIM = 5;
const CONCURRENCY = 3;
const MIN_CLAIM_CHARS = 25; // skip trivially short "claims"

const JUDGE_SYSTEM = `You are Prism's fact-checker. You assess a SINGLE factual claim against a numbered list of SOURCES (real web search results).

Hard rules:
- Rely ONLY on the provided sources. Do NOT use outside knowledge and NEVER invent sources or URLs.
- Cite sources by their integer index. Cite AT LEAST TWO sources when the evidence allows.
- For each cited source give a stance: "supports", "contradicts", or "context" (relevant background).
- If the sources are irrelevant or too thin to judge, use verdict "unverified".

Verdicts:
- "supported": the sources corroborate the claim.
- "disputed": the sources contradict or refute the claim.
- "misleading": the claim has some basis but omits key context or is cherry-picked.
- "unverified": not enough reliable evidence in the sources to judge.

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

function isVerdict(v: unknown): v is Verdict {
  return typeof v === "string" && (VERDICTS as string[]).includes(v);
}

function asConfidence(v: unknown): Confidence {
  return v === "high" || v === "medium" || v === "low" ? v : "low";
}

// Pick the claims we'll actually check: dedupe, drop trivially short ones, cap.
export function selectClaims(claims: string[]): string[] {
  const seen = new Set<string>();
  const picked: string[] = [];
  for (const raw of claims) {
    const claim = raw.replace(/\s+/g, " ").trim();
    const key = claim.toLowerCase();
    if (claim.length < MIN_CLAIM_CHARS || seen.has(key)) continue;
    seen.add(key);
    picked.push(claim);
    if (picked.length >= MAX_CLAIMS) break;
  }
  return picked;
}

async function tavilySearch(query: string): Promise<TavilyResult[]> {
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
      max_results: RESULTS_PER_CLAIM,
      include_answer: false,
      include_raw_content: false,
    }),
  });

  if (!res.ok) {
    // Surface auth errors clearly; treat other failures as "no evidence".
    if (res.status === 401 || res.status === 403) {
      throw new Error("Tavily rejected the API key. Check TAVILY_API_KEY.");
    }
    return [];
  }

  const data = (await res.json()) as { results?: unknown };
  if (!Array.isArray(data.results)) return [];

  return data.results
    .map((r) => r as Record<string, unknown>)
    .filter(
      (r) => typeof r.url === "string" && typeof r.title === "string",
    )
    .map((r) => ({
      title: String(r.title),
      url: String(r.url),
      content: typeof r.content === "string" ? r.content : "",
    }));
}

async function judgeClaim(
  client: Groq,
  claim: string,
  sources: TavilyResult[],
): Promise<{
  verdict: Verdict;
  confidence: Confidence;
  explanation: string;
  citations: { index: number; stance: Evidence["stance"] }[];
}> {
  const numbered = sources.map((s, i) => ({
    index: i,
    title: s.title,
    url: s.url,
    snippet: s.content.slice(0, 500),
  }));

  const userContent =
    `CLAIM:\n"${claim}"\n\n` +
    `SOURCES:\n${JSON.stringify(numbered)}\n\n` +
    `Return JSON of the exact shape:\n` +
    `{"verdict":"supported|disputed|misleading|unverified","confidence":"low|medium|high","explanation":"<max 40 words, grounded in the sources>","citations":[{"index":<int>,"stance":"supports|contradicts|context"}]}`;

  const completion = await client.chat.completions.create({
    model: MODEL,
    temperature: 0,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: JUDGE_SYSTEM },
      { role: "user", content: userContent },
    ],
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";
  let parsed: Record<string, unknown> = {};
  try {
    parsed = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    /* fall through to unverified */
  }

  const citationsRaw = Array.isArray(parsed.citations) ? parsed.citations : [];
  const citations = citationsRaw
    .map((c) => c as Record<string, unknown>)
    .filter((c) => typeof c.index === "number")
    .map((c) => ({
      index: c.index as number,
      stance:
        c.stance === "supports" ||
        c.stance === "contradicts" ||
        c.stance === "context"
          ? (c.stance as Evidence["stance"])
          : ("context" as const),
    }));

  return {
    verdict: isVerdict(parsed.verdict) ? parsed.verdict : "unverified",
    confidence: asConfidence(parsed.confidence),
    explanation:
      typeof parsed.explanation === "string" && parsed.explanation.trim()
        ? parsed.explanation.trim()
        : "No decisive evidence was found in the sources.",
    citations,
  };
}

// Turn cited indices into Evidence, then backfill so users always see >=2 proofs
// when we actually have sources to show.
function buildEvidence(
  sources: TavilyResult[],
  citations: { index: number; stance: Evidence["stance"] }[],
): Evidence[] {
  const evidence: Evidence[] = [];
  const used = new Set<number>();

  for (const c of citations) {
    const src = sources[c.index];
    if (!src || used.has(c.index)) continue;
    used.add(c.index);
    evidence.push({
      title: src.title,
      publisher: publisherOf(src.url),
      url: src.url,
      snippet: src.content.slice(0, 240).trim(),
      stance: c.stance,
    });
  }

  for (let i = 0; i < sources.length && evidence.length < 2; i++) {
    if (used.has(i)) continue;
    used.add(i);
    const src = sources[i];
    evidence.push({
      title: src.title,
      publisher: publisherOf(src.url),
      url: src.url,
      snippet: src.content.slice(0, 240).trim(),
      stance: "context",
    });
  }

  return evidence;
}

async function checkOne(client: Groq, claim: string): Promise<ClaimCheck> {
  const sources = await tavilySearch(claim);
  if (sources.length === 0) {
    return {
      claim,
      verdict: "unverified",
      confidence: "low",
      explanation: "No web sources were found for this claim.",
      evidence: [],
    };
  }

  const judged = await judgeClaim(client, claim, sources);
  return {
    claim,
    verdict: judged.verdict,
    confidence: judged.confidence,
    explanation: judged.explanation,
    evidence: buildEvidence(sources, judged.citations),
  };
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

export async function factCheckClaims(
  claims: string[],
): Promise<FactCheckResult> {
  const selected = selectClaims(claims);
  const client = getGroqClient();

  const checks = await mapWithConcurrency(selected, CONCURRENCY, (claim) =>
    checkOne(client, claim),
  );

  return {
    checks,
    totalClaims: claims.length,
    checkedCount: selected.length,
  };
}
