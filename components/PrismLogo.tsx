"use client";

import { motion, useReducedMotion } from "framer-motion";
import { SPECTRUM } from "./brand";

type PrismLogoProps = {
  /** Rendered size in px (square viewport). */
  size?: number;
  className?: string;
};

/**
 * Animated Prism mark (viewBox 0 0 200 200).
 *
 * An UPWARD-pointing prism (the classic dispersion orientation). A horizontal ink
 * beam enters the left face, bends through the glass, and leaves the right face
 * fanned into a red→violet spectrum. On load each element draws itself in sequence;
 * once settled the spectrum breathes gently and a light pulse periodically travels
 * into the prism.
 *
 * Reliability notes (previous version's rays never showed):
 *  - Ray geometry is STATIC; we animate only `pathLength` (draw-on) + a quick
 *    `opacity` snap. We never animate x2/y2, and never bind the entrance opacity to
 *    the looping shimmer — those conflicts are what hid the rays before.
 *
 * Motion policy (Step 12, user decision): the one-time entrance draw plays for
 * everyone; only the LOOPING motion (idle shimmer, traveling pulse) respects
 * prefers-reduced-motion.
 */

// Upward triangle: apex at top, base at the bottom.
const TRIANGLE = "M 100 52 L 58 132 L 142 132 Z";
const ENTRY = { x: 77, y: 96 }; //  beam meets the left face here
const EXIT = { x: 126, y: 102 }; // refracted light leaves the right face here
const BEAM_START_X = 6;
const RAY_END_X = 196;
const RAY_TOP_Y = 82; // red bends least (highest)
const RAY_BOTTOM_Y = 146; // violet bends most (lowest)

export default function PrismLogo({ size = 180, className }: PrismLogoProps) {
  const reduce = useReducedMotion();

  const rays = SPECTRUM.map((color, i) => {
    const t = SPECTRUM.length === 1 ? 0.5 : i / (SPECTRUM.length - 1);
    return {
      color,
      x2: RAY_END_X,
      y2: RAY_TOP_Y + t * (RAY_BOTTOM_Y - RAY_TOP_Y),
      delay: 1.15 + i * 0.07,
    };
  });

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      role="img"
      aria-label="Prism logo: a beam of white light entering a prism and refracting into a full color spectrum"
      className={className}
    >
      {/* Refracted spectrum — behind the prism so rays emerge from its right face.
          The group carries the idle shimmer so per-ray opacity stays conflict-free. */}
      <motion.g
        animate={reduce ? undefined : { opacity: [1, 0.72, 1] }}
        transition={
          reduce
            ? undefined
            : { duration: 4.5, delay: 2.4, repeat: Infinity, ease: "easeInOut" }
        }
      >
        {rays.map((ray) => (
          <motion.line
            key={ray.color}
            x1={EXIT.x}
            y1={EXIT.y}
            x2={ray.x2}
            y2={ray.y2}
            stroke={ray.color}
            strokeWidth={3.4}
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{
              pathLength: { duration: 0.6, delay: ray.delay, ease: "easeOut" },
              opacity: { duration: 0.2, delay: ray.delay },
            }}
          />
        ))}
      </motion.g>

      {/* Internal refracted segment (subtle) */}
      <motion.line
        x1={ENTRY.x}
        y1={ENTRY.y}
        x2={EXIT.x}
        y2={EXIT.y}
        stroke="#0A0A0A"
        strokeWidth={2}
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 0.45 }}
        transition={{ duration: 0.35, delay: 0.95, ease: "easeOut" }}
      />

      {/* Prism outline, on top */}
      <motion.path
        d={TRIANGLE}
        stroke="#0A0A0A"
        strokeWidth={3}
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{
          pathLength: { duration: 0.8, delay: 0.1, ease: "easeInOut" },
          opacity: { duration: 0.3, delay: 0.1 },
        }}
      />

      {/* Incoming ink beam */}
      <motion.line
        x1={BEAM_START_X}
        y1={ENTRY.y}
        x2={ENTRY.x}
        y2={ENTRY.y}
        stroke="#0A0A0A"
        strokeWidth={3}
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.65, ease: "easeOut" }}
      />

      {/* Light pulse traveling into the prism. Always in the tree — the server
          renders it, so a reduced-motion client must too (conditional rendering
          on useReducedMotion caused a hydration mismatch); only the looping
          animation is gated, leaving the dot parked at opacity 0. */}
      <motion.circle
        cy={ENTRY.y}
        r={2.4}
        fill="#0A0A0A"
        initial={{ cx: BEAM_START_X, opacity: 0 }}
        animate={reduce ? undefined : { cx: ENTRY.x, opacity: [0, 1, 0] }}
        transition={
          reduce
            ? undefined
            : {
                duration: 1.8,
                delay: 2.6,
                repeat: Infinity,
                repeatDelay: 1.4,
                ease: "easeIn",
              }
        }
      />
    </svg>
  );
}
