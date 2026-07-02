// Pull the readable article text out of a URL, server-side.
//
// Uses @extractus/article-extractor, which returns cleaned HTML + metadata for
// most news sites. Paywalled or heavily JS-rendered pages may fail or come back
// partial — callers should surface a "paste the text instead" fallback.

import { extract } from "@extractus/article-extractor";
import type { ExtractedArticle } from "./types";

// Turn the extractor's HTML content into readable plain text with paragraph breaks.
function htmlToText(html: string): string {
  return html
    .replace(/<\s*(script|style)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, "")
    // Block-level tags become paragraph breaks so sentences don't run together.
    .replace(/<\/(p|div|h[1-6]|li|blockquote|section|article)\s*>/gi, "\n\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "") // strip remaining tags
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&rsquo;|&apos;/gi, "'")
    .replace(/[ \t]+/g, " ")
    .split("\n")
    .map((line) => line.trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n") // collapse blank-line runs after trimming
    .trim();
}

export function isValidUrl(value: string): boolean {
  try {
    const u = new URL(value.trim());
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export async function extractArticle(url: string): Promise<ExtractedArticle> {
  const data = await extract(url);
  if (!data || !data.content) {
    throw new Error(
      "Couldn't extract readable text from that link. Try pasting the article text instead.",
    );
  }

  const text = htmlToText(data.content);
  if (text.length < 40) {
    throw new Error(
      "That link didn't yield enough readable text (it may be paywalled). Try pasting the article text instead.",
    );
  }

  let source = data.source;
  try {
    if (!source) source = new URL(url).hostname.replace(/^www\./, "");
  } catch {
    /* ignore */
  }

  return {
    url,
    title: data.title ?? undefined,
    author: data.author ?? undefined,
    source: source ?? undefined,
    publishedDate: data.published ?? undefined,
    text,
  };
}
