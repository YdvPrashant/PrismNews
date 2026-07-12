import { SPECTRUM } from "./brand";

// Colophon — spectrum hairline, then a quiet three-column readout. Top padding
// keeps the hairline off the CtaBand's ink slab directly above it.
export default function Footer() {
  return (
    <footer className="mx-auto w-full max-w-grid px-6 pb-12 pt-12">
      <div className="flex h-[3px] w-full overflow-hidden" aria-hidden>
        {SPECTRUM.map((c) => (
          <span key={c} className="h-full flex-1" style={{ backgroundColor: c }} />
        ))}
      </div>

      <div className="mt-6 grid gap-4 text-xs text-ink/40 sm:grid-cols-3">
        <div className="flex items-center gap-2">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M12 4 L4 20 L20 20 Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinejoin="round"
            />
          </svg>
          <span className="font-semibold tracking-tight text-ink/60">PRISM</span>
          <span aria-hidden>—</span>
          <span>see every angle.</span>
        </div>

        <span className="sm:text-center">Built in the open.</span>

        <span className="uppercase tracking-[0.2em] sm:text-right">
          © 2026 · v0.2
        </span>
      </div>
    </footer>
  );
}
