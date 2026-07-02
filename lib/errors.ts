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

  // Server-config problems (missing/rejected API keys) name env vars — that's
  // for the operator's terminal, not a reader's screen.
  if (raw.includes("_API_KEY")) {
    return "Prism's server isn't fully configured — this analysis service is unavailable right now.";
  }

  return raw;
}
