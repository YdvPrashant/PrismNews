import { NextResponse } from "next/server";
import { friendlyError } from "@/lib/errors";
import { compareCoverage } from "@/lib/fullstory";
import { cacheKey, getCached, setCached } from "@/lib/cache";
import type { FullStoryResult } from "@/lib/types";

// Two web searches + two Groq calls — Node runtime with headroom.
export const runtime = "nodejs";
export const maxDuration = 60;

const MIN_TEXT_CHARS = 200;

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { text, title, url } = body as {
    text?: unknown;
    title?: unknown;
    url?: unknown;
  };

  if (typeof text !== "string" || text.trim().length < MIN_TEXT_CHARS) {
    return NextResponse.json(
      { error: "Not enough article text to compare coverage." },
      { status: 400 },
    );
  }

  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json(
      { error: "The server is missing GROQ_API_KEY. Add it to .env.local." },
      { status: 500 },
    );
  }
  if (!process.env.TAVILY_API_KEY) {
    return NextResponse.json(
      {
        error:
          "The server is missing TAVILY_API_KEY (used to find other coverage). Add it to .env.local.",
      },
      { status: 500 },
    );
  }

  const titleHint = typeof title === "string" ? title : "";
  const urlHint = typeof url === "string" ? url : "";
  const key = cacheKey("fullstory", `${titleHint}|${urlHint}|${text}`);
  const cached = await getCached<FullStoryResult>(key);
  if (cached) return NextResponse.json(cached);

  try {
    const result = await compareCoverage(
      text,
      typeof title === "string" ? title : undefined,
      typeof url === "string" ? url : undefined,
    );
    await setCached(key, result, 60 * 60 * 24); // 24h
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: friendlyError(err, "Coverage comparison failed.") },
      { status: 500 },
    );
  }
}
