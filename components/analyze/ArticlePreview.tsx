"use client";

import { useEffect, useRef, useState } from "react";
import type { ExtractedArticle } from "@/lib/types";

// The "preview" pane of the unified workspace card (right half) — shows what
// Prism is actually reading, set like an article. Fills the card height; the
// body scrolls within it. For a link: extracted headline + metadata + body.
export default function ArticlePreview({
  article,
  text,
}: {
  article: ExtractedArticle | null;
  text: string;
}) {
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const [overflowing, setOverflowing] = useState(false);

  // The "Scroll ↓" hint only earns its place when there's actually more to
  // read; content changes re-check via deps, container resizes via observer.
  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    const check = () => setOverflowing(el.scrollHeight > el.clientHeight + 1);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, [text, article]);

  const meta = article
    ? [article.source, article.author, article.publishedDate].filter(Boolean)
    : ["Pasted text"];

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-ink/10 p-5 sm:p-6">
        <p className="text-xs font-medium uppercase tracking-[0.25em] text-accent">
          Preview
        </p>
        <h3 className="mt-3 text-balance text-lg font-bold leading-snug tracking-tight">
          {article?.title ?? "Your text"}
        </h3>
        {meta.length > 0 && (
          <p className="mt-1.5 text-xs text-ink/50">{meta.join("  ·  ")}</p>
        )}
        {article?.url && (
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-block max-w-full truncate text-xs text-ink/40 underline underline-offset-2 hover:text-accent"
          >
            {article.url}
          </a>
        )}
      </div>

      <div className="relative min-h-0 flex-1">
        <div
          ref={bodyRef}
          className="u-scroll h-full max-h-[38vh] overflow-y-auto px-5 py-4 text-[0.95rem] leading-[1.8] text-ink/75 sm:px-6 md:max-h-none"
        >
          {text.split(/\n{2,}/).map((para, i) =>
            para.trim() ? (
              <p key={i} className="mb-4 whitespace-pre-wrap">
                {para.trim()}
              </p>
            ) : null,
          )}
        </div>
        {/* Fade + scroll hint at the bottom edge — only when it overflows. */}
        {overflowing && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center bg-gradient-to-t from-paper to-transparent pb-1.5 pt-8 text-[10px] uppercase tracking-[0.25em] text-ink/35">
            Scroll ↓
          </div>
        )}
      </div>
    </div>
  );
}
