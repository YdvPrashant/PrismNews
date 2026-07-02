"use client";

import { useState } from "react";
import type { Category, Segment } from "@/lib/types";
import { CATEGORY_META } from "./categories";

// The right-hand color-coded transcript: the article, verbatim, in a bordered
// reading card. Each sentence is tinted + underlined by category. Hovering (or
// keyboard-focusing) a sentence surfaces the model's reason in the caption bar;
// clicking pins it so the reason stays put while you move on. When a category
// is isolated from the composition legend, the rest dims away.
export default function Transcript({
  segments,
  active,
}: {
  segments: Segment[];
  active: Category | null;
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const [pinned, setPinned] = useState<number | null>(null);

  const focusIdx = pinned ?? hovered;
  const focusSeg = focusIdx !== null ? segments[focusIdx] : null;

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <p className="text-xs font-medium uppercase tracking-[0.25em] text-ink/40">
          Transcript
        </p>
        <p className="text-[10px] uppercase tracking-[0.18em] text-ink/35">
          <span className="tabular-nums">{segments.length}</span> sentences
        </p>
      </div>

      <div className="mt-5 flex flex-col border border-ink/10">
        {/* The reading surface. */}
        <div className="u-scroll max-h-[62vh] overflow-y-auto px-6 py-5">
          <p className="text-[1.02rem] leading-[1.95] text-ink/90">
            {segments.map((seg, i) => {
              const meta = CATEGORY_META[seg.category];
              const hasBreak = /\n\s*\n/.test(seg.text);
              const dim = active !== null && seg.category !== active;
              const isPinned = pinned === i;
              return (
                <span key={i}>
                  <span
                    tabIndex={0}
                    onMouseEnter={() => setHovered(i)}
                    onMouseLeave={() =>
                      setHovered((h) => (h === i ? null : h))
                    }
                    onFocus={() => setHovered(i)}
                    onBlur={() => setHovered((h) => (h === i ? null : h))}
                    onClick={() => setPinned((p) => (p === i ? null : i))}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setPinned((p) => (p === i ? null : i));
                      }
                    }}
                    className="cursor-pointer rounded-[2px] transition-opacity duration-200"
                    style={{
                      backgroundColor: meta.tint,
                      boxShadow: isPinned
                        ? `inset 0 -2px 0 0 ${meta.underline}, 0 0 0 1.5px rgba(10,10,10,0.35)`
                        : `inset 0 -2px 0 0 ${meta.underline}`,
                      padding: "0.05em 0.1em",
                      opacity: dim ? 0.2 : 1,
                    }}
                  >
                    {seg.text.replace(/\s+$/g, "")}
                  </span>
                  {hasBreak ? <span className="block h-4" aria-hidden /> : " "}
                </span>
              );
            })}
          </p>
        </div>

        {/* Reason caption — follows hover/focus; click a sentence to pin it. */}
        <div
          aria-live="polite"
          className="flex min-h-[3.25rem] items-center justify-between gap-3 border-t border-ink/10 bg-ink/[0.015] px-6 py-3"
        >
          {focusSeg ? (
            <>
              <span className="inline-flex min-w-0 items-center gap-2.5">
                <span
                  aria-hidden
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{
                    backgroundColor: CATEGORY_META[focusSeg.category].bar,
                  }}
                />
                <span className="text-xs">
                  <span className="font-semibold">
                    {CATEGORY_META[focusSeg.category].label}
                  </span>
                  {focusSeg.reason && (
                    <span className="text-ink/55"> — {focusSeg.reason}</span>
                  )}
                </span>
              </span>
              <span className="shrink-0 text-[10px] tabular-nums uppercase tracking-[0.15em] text-ink/35">
                {pinned !== null ? "Pinned · " : ""}
                {(focusIdx ?? 0) + 1} / {segments.length}
              </span>
            </>
          ) : (
            <span className="text-xs text-ink/40">
              Hover a sentence to see why it&apos;s classified — click to pin it.
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
