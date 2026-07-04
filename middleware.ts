// The single choke point that keeps Prism's free API tiers alive under public
// traffic: a per-IP rate limit on the analysis routes, plus an owner-bypass key
// so the operator can always demo. Runs on the Edge (Upstash is REST-based, so
// @upstash/ratelimit works here) BEFORE any route handler.
//
// FAIL-OPEN: if the Upstash env vars aren't set (local dev, or before they're
// wired on Vercel) nothing is throttled and the app behaves exactly as before.
// Caching (the Node side) lives in lib/cache.ts, not here.

import { NextResponse, type NextRequest } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
// The Edge middleware runs on a workerd-like runtime, so use the fetch-only
// build (no Node `process.version` reference). lib/cache.ts keeps the default
// Node build for the Node-runtime API routes.
import { Redis } from "@upstash/redis/cloudflare";

const BYPASS_COOKIE = "prism_owner";

// undefined = not yet constructed; null = env unconfigured (fail open).
let limiter: Ratelimit | null | undefined;

function getLimiter(): Ratelimit | null {
  if (limiter !== undefined) return limiter;
  // Accept BOTH the Upstash-native names and Vercel KV's KV_REST_API_* names.
  const url =
    process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (!url || !token) {
    limiter = null;
    return null;
  }
  const perHour = Number(process.env.RATE_LIMIT_PER_HOUR) || 30;
  limiter = new Ratelimit({
    redis: new Redis({ url, token }),
    // ~6 full five-screen runs/hour/IP at the default of 30.
    limiter: Ratelimit.slidingWindow(perHour, "1 h"),
    prefix: "prism:rl",
    // Skip Redis for an IP already known to be blocked this window.
    ephemeralCache: new Map(),
  });
  return limiter;
}

function clientIp(req: NextRequest): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}

export async function middleware(req: NextRequest) {
  const owner = process.env.OWNER_BYPASS_KEY;
  const url = req.nextUrl;

  // --- Owner bypass: ?key=<secret> once, then a cookie carries it. -----------
  if (owner) {
    const keyParam = url.searchParams.get("key");
    const cookie = req.cookies.get(BYPASS_COOKIE)?.value;
    if (keyParam === owner || cookie === owner) {
      const res = NextResponse.next();
      if (keyParam === owner && cookie !== owner) {
        res.cookies.set(BYPASS_COOKIE, owner, {
          httpOnly: true,
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 30, // 30 days
          path: "/",
        });
      }
      return res;
    }
  }

  // Only the API routes are throttled. /get-started is matched solely so the
  // owner can unlock from the tool page; a normal page view passes through.
  if (!url.pathname.startsWith("/api/")) return NextResponse.next();

  // --- Per-IP rate limit -----------------------------------------------------
  const rl = getLimiter();
  if (!rl) return NextResponse.next(); // fail open — Upstash unconfigured

  const { success, reset } = await rl.limit(clientIp(req));
  if (success) return NextResponse.next();

  const retryAfter = Math.max(1, Math.ceil((reset - Date.now()) / 1000));
  const minutes = Math.max(1, Math.ceil(retryAfter / 60));
  return NextResponse.json(
    {
      error: `You've hit Prism's hourly demo limit — try again in ~${minutes} min. (Prism runs on free API tiers; this keeps them alive for everyone.)`,
    },
    { status: 429, headers: { "Retry-After": String(retryAfter) } },
  );
}

export const config = {
  matcher: [
    "/api/extract",
    "/api/analyze",
    "/api/factcheck",
    "/api/sourceintel",
    "/api/fullstory",
    "/get-started",
  ],
};
