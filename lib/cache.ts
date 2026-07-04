// Thin, FAIL-OPEN cache over Upstash Redis. If the Upstash env vars are absent
// (local dev, or before they're wired on Vercel) or any call throws, this
// degrades to a no-op: getCached returns null (a miss) and setCached does
// nothing, so the app behaves exactly as it did before caching existed.
// Never let a cache problem break a request — that is the whole contract.
//
// Keys are hashed so arbitrary input (URLs, article text, claim lists) can't
// break Redis key syntax or leak content into the keyspace. Bump the "v1" in
// cacheKey() whenever a cached payload's SHAPE changes, to invalidate old data.
//
// Node-runtime only (uses node:crypto) — never import this from middleware or an
// Edge route. Rate limiting (the Edge side) lives in middleware.ts instead.

import { createHash } from "node:crypto";
import { Redis } from "@upstash/redis";

// undefined = not yet constructed; null = env unconfigured (stay a no-op).
let client: Redis | null | undefined;

function getClient(): Redis | null {
  if (client !== undefined) return client;
  // Accept BOTH the Upstash-native names and Vercel KV's KV_REST_API_* names, so
  // caching works no matter which Redis integration is added on Vercel.
  const url =
    process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  client = url && token ? new Redis({ url, token }) : null;
  return client;
}

export function cacheKey(prefix: string, input: string): string {
  const hash = createHash("sha256").update(input).digest("hex");
  return `prism:${prefix}:v1:${hash}`;
}

export async function getCached<T>(key: string): Promise<T | null> {
  const redis = getClient();
  if (!redis) return null;
  try {
    // @upstash/redis auto-parses JSON, so this returns the original object.
    return (await redis.get<T>(key)) ?? null;
  } catch {
    return null; // fail open — treat any cache error as a miss
  }
}

export async function setCached(
  key: string,
  value: unknown,
  ttlSeconds: number,
): Promise<void> {
  const redis = getClient();
  if (!redis) return;
  try {
    await redis.set(key, value, { ex: ttlSeconds });
  } catch {
    /* fail open — a failed write just means the next call recomputes */
  }
}
