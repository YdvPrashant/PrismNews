import { NextResponse } from "next/server";
import { friendlyError } from "@/lib/errors";
import { isValidUrl } from "@/lib/extract";
import { investigateSource } from "@/lib/sourceintel";

// Registry lookups + web search + a Groq call — Node runtime with headroom.
export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { url, author, outletName } = body as {
    url?: unknown;
    author?: unknown;
    outletName?: unknown;
  };

  if (typeof url !== "string" || !isValidUrl(url)) {
    return NextResponse.json(
      { error: "Provide the article's URL to trace its source." },
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
          "The server is missing TAVILY_API_KEY (used to research the source). Add it to .env.local.",
      },
      { status: 500 },
    );
  }

  try {
    const result = await investigateSource(
      url,
      typeof author === "string" ? author : undefined,
      typeof outletName === "string" ? outletName : undefined,
    );
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: friendlyError(err, "Source trace failed.") },
      { status: 500 },
    );
  }
}
