"use client";

import type { IntelSource } from "@/lib/types";
import Favicon from "./Favicon";

// Small favicon links resolving a finding's citations against a shared
// numbered source pool. Used by the provenance dossier and the full-picture
// coverage checklist.
export default function CiteChips({
  citations,
  sources,
}: {
  citations: number[];
  sources: IntelSource[];
}) {
  const items = citations
    .map((i) => ({ i, s: sources[i] }))
    .filter((x): x is { i: number; s: IntelSource } => Boolean(x.s));
  if (items.length === 0) return null;
  return (
    <span className="mt-2.5 flex flex-wrap gap-1.5">
      {items.map(({ i, s }) => (
        <a
          key={i}
          href={s.url}
          target="_blank"
          rel="noopener noreferrer"
          title={s.publisher ?? s.title}
          className="flex h-6 w-6 items-center justify-center border border-ink/15 bg-paper transition-colors hover:border-ink"
        >
          <Favicon domain={s.publisher} fallback={i + 1} size={14} />
        </a>
      ))}
    </span>
  );
}
