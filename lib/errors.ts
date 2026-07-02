// Map raw upstream errors (Groq / Tavily) to messages a reader can act on.
// The Groq SDK's 429 message is a JSON blob — surface the human part instead.
export function friendlyError(err: unknown, fallback: string): string {
  const raw = err instanceof Error ? err.message : "";
  if (!raw) return fallback;

  if (raw.includes("rate_limit_exceeded") || raw.startsWith("429")) {
    const wait = raw.match(/try again in ([0-9hms.]+)/i)?.[1];
    return `Prism's free language-model quota is used up for now${
      wait ? ` — try again in ~${wait}` : " — try again shortly"
    }. (Groq free-tier daily limit.)`;
  }

  return raw;
}
