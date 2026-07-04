import { NextResponse } from "next/server";
import { friendlyError } from "@/lib/errors";
import { classifyArticle } from "@/lib/analyze";
import { cacheKey, getCached, setCached } from "@/lib/cache";
import type { AnalysisResult } from "@/lib/types";

// Groq call + sentence work needs the Node runtime and some headroom.
export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const text = (body as { text?: unknown }).text;
  if (typeof text !== "string" || text.trim().length < 20) {
    return NextResponse.json(
      { error: "Please provide at least a sentence or two of text to analyze." },
      { status: 400 },
    );
  }

  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json(
      { error: "The server is missing GROQ_API_KEY. Add it to .env.local." },
      { status: 500 },
    );
  }

  const trimmed = text.trim();
  const key = cacheKey("analyze", trimmed);
  const cached = await getCached<AnalysisResult>(key);
  if (cached) return NextResponse.json(cached);

  try {
    const result = await classifyArticle(trimmed);
    // 7d — classification runs at temperature 0, so it's stable per text.
    await setCached(key, result, 60 * 60 * 24 * 7);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: friendlyError(err, "Analysis failed.") },
      { status: 500 },
    );
  }
}
