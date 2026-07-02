import { NextResponse } from "next/server";
import { extractArticle, isValidUrl } from "@/lib/extract";

export const runtime = "nodejs";
export const maxDuration = 30;

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

  try {
    const article = await extractArticle(url.trim());
    return NextResponse.json(article);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Couldn't read that link.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
