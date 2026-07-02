"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

// Global top bar — a sticky hairline rail. Exactly h-14 (3.5rem): the tool's
// "fill the viewport below the header" math depends on that height.
export default function Header() {
  const pathname = usePathname();
  const onTool = pathname?.startsWith("/get-started") ?? false;

  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="sticky top-0 z-50 border-b border-ink/10 bg-paper/90 backdrop-blur-sm"
    >
      <div className="mx-auto flex h-14 w-full max-w-grid items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            aria-label="Prism — home"
            className="flex items-center gap-2 transition-opacity hover:opacity-70"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M12 4 L4 20 L20 20 Z"
                stroke="#0A0A0A"
                strokeWidth="2"
                strokeLinejoin="round"
              />
            </svg>
            <span className="text-sm font-bold tracking-tightest">PRISM</span>
          </Link>

          <span aria-hidden className="hidden h-4 w-px bg-ink/15 sm:block" />
          <span className="hidden text-[11px] font-medium uppercase tracking-[0.2em] text-ink/40 sm:block">
            News, refracted
          </span>
        </div>

        <nav className="flex items-center gap-5" aria-label="Primary">
          <Link
            href="/#about"
            className="text-[11px] font-medium uppercase tracking-[0.18em] text-ink/50 transition-colors hover:text-ink"
          >
            Manifesto
          </Link>
          <Link
            href="/get-started"
            aria-current={onTool ? "page" : undefined}
            className={`px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] transition-colors ${
              onTool
                ? "border border-ink/20 text-ink/60"
                : "bg-ink text-paper hover:bg-accent"
            }`}
          >
            Refract
          </Link>
        </nav>
      </div>
    </motion.header>
  );
}
