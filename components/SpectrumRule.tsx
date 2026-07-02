"use client";

import { motion, useReducedMotion } from "framer-motion";
import { SPECTRUM, EASE_OUT } from "./brand";

/**
 * A thin spectrum bar that wipes in from the left. Reused as a brand divider.
 * Width is controlled by the parent (this fills its container).
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
  const reduce = useReducedMotion();
  const animated = animate && !reduce;

  return (
    <motion.div
      aria-hidden
      className={`flex h-[3px] w-full overflow-hidden ${className}`}
      style={{ transformOrigin: "left" }}
      initial={animated ? { scaleX: 0, opacity: 0 } : false}
      whileInView={animated ? { scaleX: 1, opacity: 1 } : undefined}
      viewport={{ once: true }}
      transition={{ duration: 0.8, delay, ease: EASE_OUT }}
    >
      {SPECTRUM.map((c) => (
        <span key={c} className="h-full flex-1" style={{ backgroundColor: c }} />
      ))}
    </motion.div>
  );
}
