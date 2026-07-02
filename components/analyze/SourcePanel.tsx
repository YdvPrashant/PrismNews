"use client";

import type { ExtractedArticle } from "@/lib/types";

// The editable "source" pane of the unified workspace card (left half). The
// editor stretches to fill the pane; a compact "read receipt" sits pinned to
// the bottom so the pane always balances the preview on the right.
export default function SourcePanel({
  value,
  onChange,
  onSubmit,
  detected,
  busy,
  status,
  article,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  detected: "url" | "text";
  busy: boolean;
  status: string;
  article: ExtractedArticle | null;
}) {
  const canSubmit = value.trim().length > 0 && !busy;

  const words = (article?.text ?? value).trim().match(/\S+/g)?.length ?? 0;
  const state =
    status === "extracting"
      ? { label: "Reading…", dot: "#FF3B00", pulse: true }
      : status === "analyzing"
        ? { label: "Refracting…", dot: "#FF3B00", pulse: true }
        : status === "error"
          ? { label: "Failed", dot: "#B02525", pulse: false }
          : { label: "Ready", dot: "#2F9E44", pulse: false };

  const meta: { k: string; v: string }[] = [
    { k: "Detected", v: detected === "url" ? "Link" : "Text" },
    {
      k: "Length",
      v: article ? `~${words.toLocaleString()} words` : `${words} words`,
    },
  ];

  return (
    <div className="flex h-full flex-col p-5 sm:p-6">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-[0.25em] text-accent">
          Source
        </p>
        <span className="inline-flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.18em] text-ink/45">
          <span
            aria-hidden
            className={`h-1.5 w-1.5 rounded-full ${state.pulse ? "animate-pulse" : ""}`}
            style={{ backgroundColor: state.dot }}
          />
          {state.label}
        </span>
      </div>

      <label htmlFor="prism-source" className="sr-only">
        Article link or text
      </label>
      <textarea
        id="prism-source"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && canSubmit) {
            onSubmit();
          }
        }}
        className="u-scroll mt-4 min-h-[7rem] w-full flex-1 resize-none overflow-y-auto border border-ink/10 bg-ink/[0.015] px-4 py-3 text-sm leading-relaxed text-ink outline-none transition-colors placeholder:text-ink/30 focus:border-ink/50 focus:bg-paper"
      />

      <div className="mt-4 flex shrink-0 flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onSubmit}
          disabled={!canSubmit}
          className="inline-flex items-center gap-2 bg-ink px-6 py-3 text-sm font-medium text-paper transition-colors duration-200 hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-ink"
        >
          {busy ? "Refracting…" : "Re-run"}
        </button>
        <kbd className="rounded-[3px] border border-ink/20 px-1.5 py-0.5 font-sans text-[10px] text-ink/45">
          ⌘/Ctrl ⏎
        </kbd>
      </div>

      {/* Read receipt, pinned to the bottom of the pane. */}
      <dl className="mt-auto shrink-0 divide-y divide-ink/[0.06] border-t border-ink/10 pt-0">
        {meta.map((m) => (
          <div
            key={m.k}
            className="flex items-baseline justify-between gap-3 py-2.5"
          >
            <dt className="text-xs uppercase tracking-[0.18em] text-ink/40">
              {m.k}
            </dt>
            <dd className="text-sm font-medium tabular-nums">{m.v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
