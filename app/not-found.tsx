import Link from "next/link";

// Swiss 404 — a beam with nowhere to land. Server-rendered, no motion; the
// global <Header /> arrives via the root layout.
export default function NotFound() {
  return (
    <main className="relative flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center px-6 text-center">
      <div
        aria-hidden
        className="bg-blueprint pointer-events-none absolute inset-0"
      />

      <p className="relative text-xs font-medium uppercase tracking-[0.25em] text-accent">
        Lost beam
      </p>
      <p
        aria-hidden
        className="relative mt-4 text-[7rem] font-light leading-none tracking-tightest text-ink/[0.16] sm:text-[10rem]"
      >
        404
      </p>
      <h1 className="relative mt-4 text-3xl font-bold tracking-tightest sm:text-4xl">
        This angle doesn&apos;t exist.
      </h1>
      <p className="relative mt-4 max-w-md text-base text-ink/60">
        The page you&apos;re after refracted into nothing — check the address,
        or head somewhere real.
      </p>

      <div className="relative mt-10 flex flex-col items-center gap-3 sm:flex-row">
        <Link
          href="/get-started"
          className="group inline-flex items-center gap-2 bg-accent px-8 py-4 text-base font-medium text-paper transition-colors duration-200 hover:bg-ink"
        >
          Refract a story
          <span
            aria-hidden
            className="transition-transform duration-200 group-hover:translate-x-1"
          >
            →
          </span>
        </Link>
        <Link
          href="/"
          className="px-4 py-4 text-base font-medium text-ink/70 transition-colors hover:text-ink"
        >
          Back to the start
        </Link>
      </div>
    </main>
  );
}
