import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Prism brand tokens — pure Swiss black & white with a single accent.
        paper: "#FFFFFF",
        ink: "#0A0A0A",
        accent: "#FF3B00",
        // Semantic state colors — aliases of the already-validated muted data
        // palette (bs/disputed text, misleading flag text, claim/supported bar),
        // NOT new colors. For UI chrome: error labels, forensics flags, status dots.
        danger: "#B02525",
        warn: "#8A5A12",
        ok: "#2F9E44",
      },
      fontFamily: {
        // Bound to the Inter next/font CSS variable set in app/layout.tsx.
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      letterSpacing: {
        tightest: "-0.045em",
      },
      transitionTimingFunction: {
        // CSS twin of EASE_OUT in components/brand.ts — one signature curve.
        swiss: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
      maxWidth: {
        grid: "72rem", // shared Swiss content grid width
      },
    },
  },
  plugins: [],
};

export default config;
