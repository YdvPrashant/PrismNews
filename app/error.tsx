"use client";

import { useEffect } from "react";
import Link from "next/link";

// Route-level crash screen — same visual family as the tool's error states.
// Never shows error.message: raw exception text isn't for readers.
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-6">
      <div
        role="alert"
        className="flex w-full max-w-md flex-col items-center gap-4 border border-ink/10 px-8 py-12 text-center"
      >
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-danger">
          The beam didn&apos;t make it through
        </p>
        <p className="text-sm text-ink/60">
          Something broke on this page — it&apos;s not you. Try again, or start
          over from the landing page.
        </p>
        <div className="mt-2 flex items-center gap-4">
          <button
            type="button"
            onClick={reset}
            className="bg-ink px-6 py-3 text-sm font-medium text-paper transition-colors hover:bg-accent"
          >
            Try again
          </button>
          <Link
            href="/"
            className="text-sm font-medium text-ink/70 transition-colors hover:text-ink"
          >
            Home
          </Link>
        </div>
      </div>
    </main>
  );
}
