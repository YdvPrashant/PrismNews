// Prism "Provenance" — who is telling you this story?
//
// Two independent legs, run in parallel:
//   1. FORENSICS (free, keyless): RDAP registration data, DNS-over-HTTPS, and
//      IP geolocation — where the domain is actually registered and hosted.
//   2. RESEARCH (Tavily + Groq): ownership, funding/revenue model, political
//      leaning, reliability, and the author's profile — synthesized from real
//      web sources ONLY, with per-field citations into one numbered pool.
// Every field is allowed to be "unknown"; nothing is model-invented.

import Groq from "groq-sdk";
import {
  LEANINGS,
  RELIABILITIES,
  REVENUE_TYPES,
  type AuthorIntel,
  type DomainForensics,
  type IntelSource,
  type Leaning,
  type OutletIntel,
  type Reliability,
  type RevenueType,
  type SourcedNote,
  type SourceIntelResult,
} from "./types";

const MODEL = "llama-3.3-70b-versatile";
const RESULTS_PER_QUERY = 4;
const CONCURRENCY = 3;
const MAX_SOURCES = 18; // cap the numbered citation pool
const LOOKUP_TIMEOUT_MS = 4000;

// Networks that front other people's sites — when the IP resolves to one of
// these, the "hosting" location is the CDN's edge, not the outlet's origin.
const CDN_RE =
  /cloudflare|fastly|akamai|amazon|aws|google|azure|microsoft|edgecast|cdn|imperva|incapsula/i;

const SYNTH_SYSTEM = `You are Prism's source-intelligence analyst. You build a dossier on a news OUTLET (and optionally the article's AUTHOR) from a numbered list of SOURCES (real web search results).

Hard rules:
- Rely ONLY on the provided sources. Do NOT use outside knowledge and NEVER invent facts, names, or ratings.
- Every field's "citations" array holds the integer indices of the sources that support its text. Any field whose text is not "Unknown" MUST cite at least one source.
- If the sources don't establish a field, set its text to a short honest "Unknown" phrasing and citations to [].
- Keep every "text" under 35 words, plain and concrete.
- For "leaning" and "reliability", prefer what established raters say in the sources (Media Bias/Fact Check, AllSides, Ad Fontes, Wikipedia). Use EXACTLY one of the allowed enum values.
- "revenue.type" is the outlet's DOMINANT funding archetype, one of the allowed enum values.
- For the author's "controversies": report only disputes/criticism DOCUMENTED in the sources; otherwise use "None found in the sources checked."

Return STRICT JSON only, no prose.`;

interface TavilyResult {
  title: string;
  url: string;
  content: string;
}

function getGroqClient(): Groq {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GROQ_API_KEY is not set. Add it to .env.local (see .env.local.example).",
    );
  }
  return new Groq({ apiKey });
}

function publisherOf(url: string): string | undefined {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return undefined;
  }
}

async function tavilySearch(query: string): Promise<TavilyResult[]> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    throw new Error(
      "TAVILY_API_KEY is not set. Add it to .env.local (see .env.local.example).",
    );
  }

  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: apiKey,
      query,
      search_depth: "basic",
      max_results: RESULTS_PER_QUERY,
      include_answer: false,
      include_raw_content: false,
    }),
  });

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      throw new Error("Tavily rejected the API key. Check TAVILY_API_KEY.");
    }
    return [];
  }

  const data = (await res.json()) as { results?: unknown };
  if (!Array.isArray(data.results)) return [];

  return data.results
    .map((r) => r as Record<string, unknown>)
    .filter((r) => typeof r.url === "string" && typeof r.title === "string")
    .map((r) => ({
      title: String(r.title),
      url: String(r.url),
      content: typeof r.content === "string" ? r.content : "",
    }));
}

// Run an async mapper over items with a bounded concurrency.
async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, () =>
    (async () => {
      while (cursor < items.length) {
        const i = cursor++;
        out[i] = await fn(items[i]);
      }
    })(),
  );
  await Promise.all(workers);
  return out;
}

// ---------------------------------------------------------------- forensics

async function fetchJson(
  url: string,
  headers?: Record<string, string>,
): Promise<unknown> {
  const res = await fetch(url, {
    headers,
    signal: AbortSignal.timeout(LOOKUP_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

function looksRedacted(value: string): boolean {
  return /redacted|privacy|not disclosed|withheld|gdpr/i.test(value);
}

// Pull registrar name / registration date / registrant country out of an RDAP
// response. RDAP is a public standard but registries fill it unevenly, so every
// path is best-effort.
function parseRdap(data: unknown): {
  registrar?: string;
  createdDate?: string;
  registrantCountry?: string;
} {
  const out: {
    registrar?: string;
    createdDate?: string;
    registrantCountry?: string;
  } = {};
  if (!data || typeof data !== "object") return out;
  const rdap = data as Record<string, unknown>;

  if (Array.isArray(rdap.events)) {
    for (const ev of rdap.events) {
      const e = ev as Record<string, unknown>;
      if (e.eventAction === "registration" && typeof e.eventDate === "string") {
        out.createdDate = e.eventDate;
        break;
      }
    }
  }

  const vcardFn = (entity: Record<string, unknown>): string | undefined => {
    const vcard = entity.vcardArray;
    if (!Array.isArray(vcard) || !Array.isArray(vcard[1])) return undefined;
    for (const entry of vcard[1]) {
      if (Array.isArray(entry) && entry[0] === "fn" && typeof entry[3] === "string") {
        return entry[3];
      }
    }
    return undefined;
  };

  const vcardCountry = (entity: Record<string, unknown>): string | undefined => {
    const vcard = entity.vcardArray;
    if (!Array.isArray(vcard) || !Array.isArray(vcard[1])) return undefined;
    for (const entry of vcard[1]) {
      if (Array.isArray(entry) && entry[0] === "adr" && Array.isArray(entry[3])) {
        const parts = (entry[3] as unknown[]).filter(
          (p): p is string => typeof p === "string" && p.trim().length > 0,
        );
        const country = parts[parts.length - 1];
        if (country && !looksRedacted(country)) return country;
      }
    }
    return undefined;
  };

  if (Array.isArray(rdap.entities)) {
    for (const ent of rdap.entities) {
      const e = ent as Record<string, unknown>;
      const roles = Array.isArray(e.roles) ? (e.roles as unknown[]) : [];
      if (roles.includes("registrar") && !out.registrar) {
        const fn = vcardFn(e);
        if (fn && !looksRedacted(fn)) out.registrar = fn;
      }
      if (roles.includes("registrant") && !out.registrantCountry) {
        out.registrantCountry = vcardCountry(e);
      }
    }
  }

  return out;
}

async function runForensics(domain: string): Promise<DomainForensics | null> {
  let registrar: string | undefined;
  let createdDate: string | undefined;
  let registrantCountry: string | undefined;
  let hostingOrg: string | undefined;
  let hostingCountry: string | undefined;

  // 1. Registration data (RDAP — the modern WHOIS).
  try {
    const rdap = await fetchJson(`https://rdap.org/domain/${domain}`, {
      accept: "application/rdap+json",
    });
    const parsed = parseRdap(rdap);
    registrar = parsed.registrar;
    createdDate = parsed.createdDate;
    registrantCountry = parsed.registrantCountry;
  } catch {
    /* registration data unavailable */
  }

  // 2. Where the site actually resolves: DNS-over-HTTPS → IP → geolocation.
  try {
    const dns = (await fetchJson(
      `https://cloudflare-dns.com/dns-query?name=${domain}&type=A`,
      { accept: "application/dns-json" },
    )) as { Answer?: unknown };
    const answers = Array.isArray(dns.Answer) ? dns.Answer : [];
    const a = answers
      .map((r) => r as Record<string, unknown>)
      .find((r) => r.type === 1 && typeof r.data === "string");
    const ip = a ? String(a.data) : undefined;

    if (ip) {
      const geo = (await fetchJson(`https://ipwho.is/${ip}`)) as Record<
        string,
        unknown
      >;
      if (geo.success !== false) {
        if (typeof geo.country === "string") hostingCountry = geo.country;
        const conn = geo.connection as Record<string, unknown> | undefined;
        const org = conn?.org ?? conn?.isp;
        if (typeof org === "string" && org.trim()) hostingOrg = org.trim();
      }
    }
  } catch {
    /* hosting data unavailable */
  }

  if (!registrar && !createdDate && !hostingOrg && !hostingCountry) return null;

  let ageYears: number | undefined;
  if (createdDate) {
    const created = Date.parse(createdDate);
    if (!Number.isNaN(created)) {
      ageYears = Math.max(
        0,
        Math.floor((Date.now() - created) / (365.25 * 24 * 3600 * 1000)),
      );
    }
  }

  const cdnMasked = hostingOrg ? CDN_RE.test(hostingOrg) : false;

  const flags: string[] = [];
  if (ageYears !== undefined && ageYears < 1) {
    flags.push("Domain registered less than a year ago — very young for a news outlet.");
  }
  if (
    registrantCountry &&
    hostingCountry &&
    !cdnMasked &&
    registrantCountry.toLowerCase() !== hostingCountry.toLowerCase()
  ) {
    flags.push(
      `Registered in ${registrantCountry} but hosted in ${hostingCountry}.`,
    );
  }

  return {
    domain,
    registrar,
    createdDate,
    ageYears,
    registrantCountry,
    hostingOrg,
    hostingCountry,
    cdnMasked,
    flags,
  };
}

// ----------------------------------------------------------------- research

// Extract a usable person name from a byline; null if it isn't one person.
export function cleanAuthor(
  raw: string | undefined,
  outletName: string,
): string | null {
  if (!raw) return null;
  let name = raw.replace(/^by\s+/i, "").trim();
  name = name.split(/,|;|\band\b|&|\|/i)[0].trim();
  if (name.length < 4 || name.length > 60) return null;
  if (!/\s/.test(name)) return null; // a lone word is a handle, not a byline
  if (/staff|desk|newsroom|editor|correspondent team|agencies|reuters|associated press/i.test(name))
    return null;
  if (name.toLowerCase() === outletName.toLowerCase()) return null;
  return name;
}

const UNKNOWN_NOTE: SourcedNote = {
  text: "Unknown — not established by the sources checked.",
  citations: [],
};

function isLeaning(v: unknown): v is Leaning {
  return typeof v === "string" && (LEANINGS as string[]).includes(v);
}
function isReliability(v: unknown): v is Reliability {
  return typeof v === "string" && (RELIABILITIES as string[]).includes(v);
}
function isRevenueType(v: unknown): v is RevenueType {
  return typeof v === "string" && (REVENUE_TYPES as string[]).includes(v);
}

// Coerce a model-returned field into a safe SourcedNote (clamped citations).
function asNote(v: unknown, maxIndex: number): SourcedNote {
  if (!v || typeof v !== "object") return UNKNOWN_NOTE;
  const o = v as Record<string, unknown>;
  const text =
    typeof o.text === "string" && o.text.trim() ? o.text.trim() : UNKNOWN_NOTE.text;
  const citations = Array.isArray(o.citations)
    ? o.citations
        .filter(
          (c): c is number =>
            typeof c === "number" && Number.isInteger(c) && c >= 0 && c < maxIndex,
        )
        .slice(0, 4)
    : [];
  return { text, citations };
}

async function synthesizeDossier(
  client: Groq,
  outletName: string,
  domain: string,
  author: string | null,
  sources: IntelSource[],
): Promise<{ outlet: OutletIntel; author: AuthorIntel | null }> {
  const unknownOutlet: OutletIntel = {
    ownership: UNKNOWN_NOTE,
    funding: UNKNOWN_NOTE,
    revenue: { type: "unknown", note: UNKNOWN_NOTE },
    leaning: { value: "unknown", note: UNKNOWN_NOTE },
    reliability: { value: "unknown", note: UNKNOWN_NOTE },
  };
  const unknownAuthor: AuthorIntel | null = author
    ? {
        name: author,
        expertise: UNKNOWN_NOTE,
        trackRecord: UNKNOWN_NOTE,
        controversies: UNKNOWN_NOTE,
      }
    : null;

  if (sources.length === 0) return { outlet: unknownOutlet, author: unknownAuthor };

  const numbered = sources.map((s, i) => ({
    index: i,
    title: s.title,
    url: s.url,
    snippet: s.snippet.slice(0, 400),
  }));

  const noteShape = `{"text":"<max 35 words>","citations":[<int>]}`;
  const userContent =
    `OUTLET: "${outletName}" (domain: ${domain})\n` +
    `AUTHOR: ${author ? `"${author}"` : "none identified"}\n\n` +
    `SOURCES:\n${JSON.stringify(numbered)}\n\n` +
    `Return JSON of the exact shape:\n` +
    `{"outlet":{"ownership":${noteShape},"funding":${noteShape},` +
    `"revenue":{"type":"ad-driven|subscription|billionaire-owned|state-affiliated|nonprofit|mixed|unknown","note":${noteShape}},` +
    `"leaning":{"value":"left|lean-left|center|lean-right|right|unknown","note":${noteShape}},` +
    `"reliability":{"value":"high|mixed|low|unknown","note":${noteShape}}},` +
    `"author":${author ? `{"expertise":${noteShape},"trackRecord":${noteShape},"controversies":${noteShape}}` : "null"}}`;

  const completion = await client.chat.completions.create({
    model: MODEL,
    temperature: 0,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYNTH_SYSTEM },
      { role: "user", content: userContent },
    ],
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";
  let parsed: Record<string, unknown> = {};
  try {
    parsed = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return { outlet: unknownOutlet, author: unknownAuthor };
  }

  const n = sources.length;
  const o = (parsed.outlet ?? {}) as Record<string, unknown>;
  const revenue = (o.revenue ?? {}) as Record<string, unknown>;
  const leaning = (o.leaning ?? {}) as Record<string, unknown>;
  const reliability = (o.reliability ?? {}) as Record<string, unknown>;

  const outlet: OutletIntel = {
    ownership: asNote(o.ownership, n),
    funding: asNote(o.funding, n),
    revenue: {
      type: isRevenueType(revenue.type) ? revenue.type : "unknown",
      note: asNote(revenue.note, n),
    },
    leaning: {
      value: isLeaning(leaning.value) ? leaning.value : "unknown",
      note: asNote(leaning.note, n),
    },
    reliability: {
      value: isReliability(reliability.value) ? reliability.value : "unknown",
      note: asNote(reliability.note, n),
    },
  };

  let authorIntel: AuthorIntel | null = unknownAuthor;
  if (author && parsed.author && typeof parsed.author === "object") {
    const a = parsed.author as Record<string, unknown>;
    authorIntel = {
      name: author,
      expertise: asNote(a.expertise, n),
      trackRecord: asNote(a.trackRecord, n),
      controversies: asNote(a.controversies, n),
    };
  }

  return { outlet, author: authorIntel };
}

// ---------------------------------------------------------------- top level

export async function investigateSource(
  url: string,
  rawAuthor?: string,
  rawOutletName?: string,
): Promise<SourceIntelResult> {
  const domain = new URL(url).hostname.replace(/^www\./, "");
  const outletName = rawOutletName?.trim() || domain;
  const author = cleanAuthor(rawAuthor, outletName);
  const client = getGroqClient();

  const queries = [
    `"${outletName}" who owns ownership parent company`,
    `"${outletName}" funding revenue model advertising subscription state-funded`,
    `"${outletName}" political bias reliability rating media bias fact check`,
  ];
  if (author) {
    queries.push(`"${author}" ${outletName} journalist career`);
    queries.push(`"${author}" journalist controversy criticism`);
  }

  const [forensics, searchBatches] = await Promise.all([
    runForensics(domain),
    mapWithConcurrency(queries, CONCURRENCY, tavilySearch),
  ]);

  // One shared, deduped citation pool across all queries.
  const seen = new Set<string>();
  const sources: IntelSource[] = [];
  for (const batch of searchBatches) {
    for (const r of batch) {
      if (seen.has(r.url) || sources.length >= MAX_SOURCES) continue;
      seen.add(r.url);
      sources.push({
        title: r.title,
        url: r.url,
        publisher: publisherOf(r.url),
        snippet: r.content.slice(0, 400).trim(),
      });
    }
  }

  const dossier = await synthesizeDossier(
    client,
    outletName,
    domain,
    author,
    sources,
  );

  return {
    domain,
    outletName,
    outlet: dossier.outlet,
    author: dossier.author,
    forensics,
    sources,
  };
}
