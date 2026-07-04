// The core of Prism Phase 1: classify every sentence of an article as
// claim / opinion / bs / neutral, using Groq (llama-3.3-70b-versatile).
//
// Flow: split -> batch sentences -> ask Groq for a category per index (JSON) ->
// stitch back into ordered segments -> compute proportional scores.

import Groq from "groq-sdk";
import { splitSentences } from "./sentences";
import {
  CATEGORIES,
  type AnalysisResult,
  type Category,
  type CategoryScore,
  type Segment,
} from "./types";

const MODEL = "llama-3.3-70b-versatile";
const BATCH_SIZE = 40; // sentences per Groq request
const MAX_SENTENCES = 300; // cap runaway articles to bound cost/latency

const SYSTEM_PROMPT = `You are a precise text classifier for a news-transparency tool called Prism. You label each sentence of an article as EXACTLY ONE of four categories:

- "claim": a checkable, falsifiable statement of fact — something that could be verified or debunked. Statistics, dated events, concrete "what happened" reporting, specific attributed facts. e.g. "Unemployment fell to 4.1% in June." "The Senate passed the bill 60-40."

- "opinion": a subjective judgment, interpretation, prediction, recommendation, or value statement — INCLUDING clearly attributed opinions. e.g. "This is a reckless policy." "Critics argue the plan will backfire." "The country must act now."

- "bs": loaded or emotionally manipulative language, hyperbole, outrage-bait, sarcasm, editorializing dressed up as fact, or empty phrasing that pushes a feeling WITHOUT making a checkable claim or an honest, substantive opinion. e.g. "In a stunning display of sheer incompetence..." "Everyone knows this is a total disaster."

- "neutral": connective tissue and plain context that is none of the above — datelines, transitions, bare "he said" attributions with no factual payload, background scaffolding.

Guidance:
- Judge each sentence in the context of the whole article.
- Pick the single best-fitting category.
- Reserve "bs" for manipulative or empty rhetoric. Do NOT mark something "bs" merely because you disagree with it or because it is an opinion — an honest opinion is "opinion".
- When a sentence states a concrete verifiable fact, prefer "claim" even if the surrounding tone is charged.

For every "claim", ALSO rate its salience — how much it is worth fact-checking — as an integer 0–3:
- 3: load-bearing to the story AND concretely checkable — a specific fact, statistic, dated event, or named-entity assertion the article's point rests on.
- 2: checkable and clearly relevant, but not the crux of the piece.
- 1: checkable but minor or peripheral — incidental detail or background.
- 0: too vague or generic to verify meaningfully.
For every sentence that is NOT a "claim", set salience to 0.

Return STRICT JSON only, no prose.`;

interface Classification {
  category: Category;
  reason?: string;
  salience?: number; // 0–3, meaningful only for `claim` (see SYSTEM_PROMPT)
}

function getClient(): Groq {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GROQ_API_KEY is not set. Add it to .env.local (see .env.local.example).",
    );
  }
  return new Groq({ apiKey });
}

function isCategory(value: unknown): value is Category {
  return typeof value === "string" && (CATEGORIES as string[]).includes(value);
}

// Coerce the model's salience to an int in [0, 3]; undefined if it's not a
// usable number (the ranking then falls back to the concreteness heuristic).
function clampSalience(value: unknown): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value)) return undefined;
  const n = Math.round(value);
  return n < 0 ? 0 : n > 3 ? 3 : n;
}

// Classify one batch. `offset` is the global index of the batch's first sentence,
// so returned indices line up with the full article.
async function classifyBatch(
  client: Groq,
  sentences: string[],
  offset: number,
): Promise<Map<number, Classification>> {
  const payload = sentences.map((text, i) => ({ index: offset + i, text }));

  const userContent =
    `Classify each sentence below. Return JSON of the exact shape:\n` +
    `{"classifications":[{"index":<int>,"category":"claim|opinion|bs|neutral","salience":<int 0-3>,"reason":"<max 12 words>"}]}\n` +
    `Include every index exactly once.\n\nSentences:\n` +
    JSON.stringify(payload);

  const completion = await client.chat.completions.create({
    model: MODEL,
    temperature: 0,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userContent },
    ],
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";
  const result = new Map<number, Classification>();

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return result; // fall back to neutral for this batch
  }

  const list = (parsed as { classifications?: unknown }).classifications;
  if (!Array.isArray(list)) return result;

  for (const item of list) {
    if (!item || typeof item !== "object") continue;
    const { index, category, reason, salience } = item as Record<
      string,
      unknown
    >;
    if (typeof index !== "number" || !isCategory(category)) continue;
    result.set(index, {
      category,
      reason: typeof reason === "string" ? reason : undefined,
      salience: clampSalience(salience),
    });
  }

  return result;
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function scoreSegments(segments: Segment[]): {
  scores: CategoryScore[];
  totalChars: number;
} {
  const totals: Record<Category, number> = {
    claim: 0,
    opinion: 0,
    bs: 0,
    neutral: 0,
  };
  for (const seg of segments) totals[seg.category] += seg.text.length;

  const totalChars = Object.values(totals).reduce((a, b) => a + b, 0) || 1;

  const scores: CategoryScore[] = CATEGORIES.map((category) => ({
    category,
    chars: totals[category],
    percent: Math.round((totals[category] / totalChars) * 100),
  }));

  return { scores, totalChars };
}

export async function classifyArticle(text: string): Promise<AnalysisResult> {
  const all = splitSentences(text);
  const truncated = all.length > MAX_SENTENCES;
  const sentences = truncated ? all.slice(0, MAX_SENTENCES) : all;

  const client = getClient();
  const batches = chunk(sentences, BATCH_SIZE);

  const batchResults = await Promise.all(
    batches.map((batch, bi) =>
      classifyBatch(client, batch, bi * BATCH_SIZE),
    ),
  );

  const classified = new Map<number, Classification>();
  for (const map of batchResults) {
    for (const [index, value] of map) classified.set(index, value);
  }

  const segments: Segment[] = sentences.map((sentence, i) => {
    const c = classified.get(i);
    const category = c?.category ?? "neutral";
    return {
      text: sentence,
      category,
      reason: c?.reason,
      // Only claims carry salience; default a claim with no score to 0 so the
      // concreteness tiebreaker (client-side) still orders it.
      salience: category === "claim" ? c?.salience ?? 0 : undefined,
    };
  });

  const { scores, totalChars } = scoreSegments(segments);

  return { segments, scores, totalChars, truncated };
}
