"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { EASE_OUT } from "@/components/brand";
import type { AnalysisResult, Category } from "@/lib/types";
import ProportionBar from "./ProportionBar";
import Transcript from "./Transcript";

// The analysis view ("The Spectrum"): composition on the left, transcript on the
// right, wired together by a shared category filter. Clicking a category in the
// composition isolates it in the transcript (and vice-versa via "Clear").
export default function SpectrumView({ result }: { result: AnalysisResult }) {
  const [active, setActive] = useState<Category | null>(null);
  const toggle = (c: Category) => setActive((prev) => (prev === c ? null : c));

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: EASE_OUT }}
      className="mt-10 grid items-start gap-10 md:grid-cols-12 md:gap-12"
    >
      <div className="min-w-0 md:col-span-5">
        <ProportionBar
          segments={result.segments}
          scores={result.scores}
          active={active}
          onSelect={toggle}
        />
        {result.truncated && (
          <p className="mt-6 text-xs text-ink/45">
            This piece was long — only the first portion was analyzed.
          </p>
        )}
      </div>
      <div className="min-w-0 md:col-span-7">
        <Transcript segments={result.segments} active={active} />
      </div>

      {/* Closing honesty note — every screen ends on one, in the same voice. */}
      <p className="max-w-xl text-xs leading-relaxed text-ink/40 md:col-span-12">
        Colors are Prism&apos;s read of each sentence — hover or tap any line
        for its reasoning, and judge the piece for yourself.
      </p>
    </motion.div>
  );
}
