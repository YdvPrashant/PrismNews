import { NextResponse } from "next/server";
import { friendlyError } from "@/lib/errors";
import { factCheckClaims } from "@/lib/factcheck";
import { cacheKey, getCached, setCached } from "@/lib/cache";
import type { FactCheckResult } from "@/lib/types";

// Web search + several Groq calls — needs the Node runtime and headroom.
export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const claims = (body as { claims?: unknown }).claims;
  if (
    !Array.isArray(claims) ||
    claims.some((c) => typeof c !== "string") ||
    claims.length === 0
  ) {
    return NextResponse.json(
      { error: "Provide a non-empty array of claim strings to fact-check." },
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
          "The server is missing TAVILY_API_KEY (used to find sources). Add it to .env.local.",
      },
      { status: 500 },
    );
  }

  // Cache on the claim SET (order-independent) so re-checks of the same article
  // don't re-run web searches. factCheckClaims still caps inside via selectClaims.
  const keyInput = JSON.stringify(
    (claims as string[]).map((c) => c.replace(/\s+/g, " ").trim()).sort(),
  );
  const key = cacheKey("factcheck", keyInput);
  const cached = await getCached<FactCheckResult>(key);
  if (cached) return NextResponse.json(cached);

  try {
    const result = await factCheckClaims(claims as string[]);
    await setCached(key, result, 60 * 60 * 12); // 12h — web sources age
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: friendlyError(err, "Fact-check failed.") },
      { status: 500 },
    );
  }
}
