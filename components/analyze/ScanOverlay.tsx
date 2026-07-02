"use client";

import { motion, useReducedMotion } from "framer-motion";
import { SPECTRUM } from "@/components/brand";

// The tool's loading signature: a refracted hairline sweeping the skeleton,
// with a centered status label. Render inside a `relative` container that
// already holds the greyed-out skeleton. Reduced motion → label only.
export default function ScanOverlay({ label }: { label: string }) {
  const reduce = useReducedMotion();
  return (
    <>
      {!reduce && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 w-px"
          style={{
            background: `linear-gradient(to bottom, ${SPECTRUM.join(", ")})`,
          }}
          initial={{ left: "0%" }}
          animate={{ left: ["0%", "100%", "0%"] }}
          transition={{ duration: 4.4, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-ink/60">
        {/* role="status" announces the busy state to screen readers on every
            screen that uses this overlay. */}
        <p role="status" className="bg-paper/80 px-3 py-1 text-sm">
          {label}
        </p>
      </div>
    </>
  );
}
