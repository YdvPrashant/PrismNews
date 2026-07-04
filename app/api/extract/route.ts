import { NextResponse } from "next/server";
import { extractArticle, isValidUrl } from "@/lib/extract";
import { detectVideoUrl, extractVideoTranscript } from "@/lib/video";
import { cacheKey, getCached, setCached } from "@/lib/cache";
import type { ExtractedArticle } from "@/lib/types";

export const runtime = "nodejs";
// Video paths do a few sequential fetches (watch page + captions), so give the
// same headroom the other analysis routes use rather than the article-only 30.
export const maxDuration = 60;

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const url = (body as { url?: unknown }).url;
  if (typeof url !== "string" || !isValidUrl(url)) {
    return NextResponse.json(
      { error: "Please provide a valid http(s) link." },
      { status: 400 },
    );
  }

  const trimmed = url.trim();

  // Recognized video host we can't transcribe yet — reject with a clear note
  // instead of letting the article extractor fail cryptically on it.
  if (detectVideoUrl(trimmed) === "unsupported-video") {
    return NextResponse.json(
      {
        error:
          "Only YouTube videos are supported right now — support for more platforms is coming. For now, paste the transcript.",
      },
      { status: 400 },
    );
  }

  // Same link → same extraction; cache so re-tests don't re-fetch/re-parse.
  const key = cacheKey("extract", trimmed);
  const cached = await getCached<ExtractedArticle>(key);
  if (cached) return NextResponse.json(cached);

  try {
    // A YouTube link becomes a transcript; anything else stays the article path.
    // Both return the same ExtractedArticle shape. Detect BEFORE extractArticle,
    // which can "succeed" on a video page's meta description and mask the video.
    const article =
      detectVideoUrl(trimmed) === "youtube"
        ? await extractVideoTranscript(trimmed)
        : await extractArticle(trimmed);
    await setCached(key, article, 60 * 60 * 24); // 24h
    return NextResponse.json(article);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Couldn't read that link.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
