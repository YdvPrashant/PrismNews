// Shared Prism brand constants.

// The refracted spectrum — red → violet. This is the ONLY sanctioned use of a full
// color range in the brand; everywhere else stays black/white + the single accent.
// SPECTRUM[0] is the brand accent (#FF3B00), so the accent and the spectrum agree.
export const SPECTRUM: string[] = [
  "#FF3B00", // red / accent
  "#FF7A00", // orange
  "#FFC400", // yellow
  "#3DDC84", // green
  "#00C2D1", // cyan
  "#4F7DFF", // blue
  "#8B5CFF", // violet
];

// Signature easing — a smooth "expo-out" curve used across entrance animations
// for a calm, precise, Swiss feel. Typed as a cubic-bezier tuple for Framer Motion.
export const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];
