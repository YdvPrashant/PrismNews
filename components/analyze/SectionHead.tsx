import type { ReactNode } from "react";
import SpectrumRule from "@/components/SpectrumRule";

// Shared header for the tool's numbered screens (01 workspace · 02 spectrum ·
// 03 fact check): index + accent eyebrow, title, spectrum rule, optional sub.
export default function SectionHead({
  index,
  eyebrow,
  title,
  sub,
}: {
  index: string;
  eyebrow: string;
  title: string;
  sub?: ReactNode;
}) {
  return (
    <div>
      <p className="flex items-baseline gap-3">
        <span className="text-xs font-medium tabular-nums text-ink/35">
          {index}
        </span>
        <span className="text-xs font-medium uppercase tracking-[0.25em] text-accent">
          {eyebrow}
        </span>
      </p>
      <h2 className="mt-2 text-balance text-2xl font-bold tracking-tightest sm:text-3xl">
        {title}
      </h2>
      <div className="mt-4 w-40">
        <SpectrumRule />
      </div>
      {sub && (
        <p className="mt-5 max-w-xl text-sm leading-relaxed text-ink/60">{sub}</p>
      )}
    </div>
  );
}
