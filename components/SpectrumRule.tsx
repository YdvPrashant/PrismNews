"use client";

import { motion } from "framer-motion";
import { SPECTRUM, EASE_OUT } from "./brand";

/**
 * A thin spectrum bar that wipes in from the left. Reused as a brand divider.
 * Width is controlled by the parent (this fills its container). A one-time
 * wipe, so it plays under reduced motion too (entrance policy, Step 12).
 */
export default function SpectrumRule({
  className = "",
  delay = 0,
  animate = true,
}: {
  className?: string;
  delay?: number;
  animate?: boolean;
}) {
  return (
    <motion.div
      aria-hidden
      className={`flex h-[3px] w-full overflow-hidden ${className}`}
      style={{ transformOrigin: "left" }}
      initial={animate ? { scaleX: 0, opacity: 0 } : false}
      whileInView={animate ? { scaleX: 1, opacity: 1 } : undefined}
      viewport={{ once: true }}
      transition={{ duration: 0.8, delay, ease: EASE_OUT }}
    >
      {SPECTRUM.map((c) => (
        <span key={c} className="h-full flex-1" style={{ backgroundColor: c }} />
      ))}
    </motion.div>
  );
}
