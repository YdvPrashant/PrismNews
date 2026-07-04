// Pull a video's transcript out of a URL, server-side — the video counterpart
// to lib/extract.ts. Phase 1 supports YouTube only (keyless): caption tracks via
// YouTube's InnerTube "player" endpoint, then the transcript from the chosen
// track. The result is the SAME `ExtractedArticle` shape an article produces, so
// everything downstream (analyze, provenance, fact-check, full picture, report)
// is agnostic to whether `text` is prose or a transcript.
//
// The URL helpers (`detectVideoUrl`, `parseYouTubeId`) are pure and import
// nothing server-only, so the client imports them too (the same trick
// AnalyzeApp uses for `looksLikeUrl`).
//
// Why InnerTube and not the watch page: YouTube's HTML-embedded `timedtext`
// caption URLs are now proof-of-origin gated — from a datacenter IP they return
// 200 with an EMPTY body. The InnerTube ANDROID client still returns caption
// tracks whose URLs actually serve. The InnerTube key + client version below are
// the fragile constants to watch if captions ever break in production; the next
// hardening step would be rotating the client (iOS/WEB) or a keyed caption API.

import type { ExtractedArticle } from "./types";

// YouTube Android app identity + the long-standing public InnerTube API key.
const ANDROID_UA =
  "com.google.android.youtube/20.10.38 (Linux; U; Android 11) gzip";
const INNERTUBE_KEY = "AIzaSyA8eiZmM1FaDVjRy-df2KTyQ_vz_yYM39w";
const ANDROID_CLIENT = {
  clientName: "ANDROID",
  clientVersion: "20.10.38",
  androidSdkVersion: 30,
  hl: "en",
  gl: "US",
};

// ---- URL detection (pure, client-safe) -------------------------------------

function isYouTubeId(id: string | undefined | null): id is string {
  return !!id && /^[A-Za-z0-9_-]{11}$/.test(id);
}

// The 11-char video id from any YouTube URL shape, or null if it isn't one.
export function parseYouTubeId(url: string): string | null {
  let u: URL;
  try {
    u = new URL(url.trim());
  } catch {
    return null;
  }
  const host = u.hostname.replace(/^www\./, "").toLowerCase();

  if (host === "youtu.be") {
    const id = u.pathname.split("/").filter(Boolean)[0];
    return isYouTubeId(id) ? id : null;
  }

  if (host === "youtube.com" || host === "m.youtube.com" || host === "music.youtube.com") {
    const v = u.searchParams.get("v");
    if (isYouTubeId(v)) return v;
    const parts = u.pathname.split("/").filter(Boolean);
    if (parts.length >= 2 && ["shorts", "live", "embed", "v"].includes(parts[0])) {
      return isYouTubeId(parts[1]) ? parts[1] : null;
    }
  }

  return null;
}

// Video-first hosts where article extraction is meaningless — recognized so the
// UI can show a "Video" affordance and the route can reject with a clear note
// instead of a confusing extraction failure. Deliberately conservative: mixed
// text/video hosts (x.com, general facebook.com) are left to the article path.
const VIDEO_FIRST_HOSTS = [
  "instagram.com",
  "tiktok.com",
  "vimeo.com",
  "dailymotion.com",
  "twitch.tv",
  "fb.watch",
];

// Classify a URL for the extract route: a YouTube video, a recognized-but-not-
// yet-supported video, or neither (→ treat as an article).
export function detectVideoUrl(url: string): "youtube" | "unsupported-video" | null {
  if (parseYouTubeId(url)) return "youtube";

  let u: URL;
  try {
    u = new URL(url.trim());
  } catch {
    return null;
  }
  const host = u.hostname.replace(/^www\./, "").toLowerCase();

  if (VIDEO_FIRST_HOSTS.some((h) => host === h || host.endsWith("." + h))) {
    return "unsupported-video";
  }
  if (host === "facebook.com" && /^\/watch/.test(u.pathname)) {
    return "unsupported-video";
  }
  if (/\.(mp4|webm|mov|m4v|mkv)(\?|$)/i.test(u.pathname)) {
    return "unsupported-video";
  }

  return null;
}

// ---- YouTube caption fetch (server-side) -----------------------------------

interface CaptionTrack {
  baseUrl?: string;
  languageCode?: string;
  kind?: string; // "asr" for auto-generated captions
}

interface PlayerResponse {
  playabilityStatus?: { status?: string; reason?: string };
  captions?: {
    playerCaptionsTracklistRenderer?: { captionTracks?: CaptionTrack[] };
  };
  videoDetails?: { title?: string; author?: string };
  microformat?: {
    playerMicroformatRenderer?: { publishDate?: string; ownerChannelName?: string };
  };
}

// Ask YouTube's InnerTube player endpoint (ANDROID client) for the video's
// metadata + caption track list.
async function fetchPlayer(videoId: string): Promise<PlayerResponse> {
  const res = await fetch(
    `https://www.youtube.com/youtubei/v1/player?key=${INNERTUBE_KEY}&prettyPrint=false`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": ANDROID_UA,
        "Accept-Language": "en-US,en;q=0.9",
      },
      body: JSON.stringify({ context: { client: ANDROID_CLIENT }, videoId }),
    },
  );
  if (!res.ok) {
    throw new Error("Couldn't reach YouTube for that video. Try again in a moment.");
  }
  const text = await res.text();
  try {
    return JSON.parse(text) as PlayerResponse;
  } catch {
    throw new Error(
      "Couldn't read that video from our server — YouTube may be limiting automated access. Try again, or paste the transcript.",
    );
  }
}

// Prefer a manual English track (real punctuation → real sentences), then an
// English auto (ASR) track, then any manual track, then whatever exists.
function pickTrack(tracks: CaptionTrack[]): CaptionTrack {
  const isEn = (t: CaptionTrack) => (t.languageCode ?? "").toLowerCase().startsWith("en");
  return (
    tracks.find((t) => t.kind !== "asr" && isEn(t)) ??
    tracks.find((t) => isEn(t)) ??
    tracks.find((t) => t.kind !== "asr") ??
    tracks[0]
  );
}

interface Json3 {
  events?: { segs?: { utf8?: string }[] }[];
}

// Fetch one caption track as json3 and flatten it to per-cue lines. Returns [] on
// any empty/unparseable body so the caller emits a friendly "no captions" error
// rather than a raw JSON parse throw.
async function fetchCaptionCues(baseUrl: string): Promise<string[]> {
  let u: URL;
  try {
    u = new URL(baseUrl);
  } catch {
    return [];
  }
  u.searchParams.set("fmt", "json3");

  const res = await fetch(u.toString(), {
    headers: { "User-Agent": ANDROID_UA, "Accept-Language": "en-US,en;q=0.9" },
  });
  if (!res.ok) return [];

  const text = await res.text();
  if (!text.trim()) return [];
  let data: Json3;
  try {
    data = JSON.parse(text) as Json3;
  } catch {
    return [];
  }

  const events = Array.isArray(data.events) ? data.events : [];
  const cues: string[] = [];
  for (const ev of events) {
    if (!Array.isArray(ev.segs)) continue;
    const line = ev.segs
      .map((s) => s.utf8 ?? "")
      .join("")
      .replace(/\s+/g, " ")
      .trim();
    if (line) cues.push(line);
  }
  return cues;
}

interface OEmbed {
  title?: string;
  author_name?: string;
}

async function fetchOEmbed(watchUrl: string): Promise<OEmbed | null> {
  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(watchUrl)}&format=json`,
    );
    if (!res.ok) return null;
    return (await res.json()) as OEmbed;
  } catch {
    return null;
  }
}

export async function extractVideoTranscript(url: string): Promise<ExtractedArticle> {
  const videoId = parseYouTubeId(url);
  if (!videoId) {
    throw new Error("That doesn't look like a YouTube video link.");
  }
  const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;

  const player = await fetchPlayer(videoId);

  const status = player.playabilityStatus?.status;
  if (status && status !== "OK") {
    if (status === "LOGIN_REQUIRED") {
      throw new Error(
        "This video is age-restricted or private, so Prism can't read it. Try another video, or paste the transcript.",
      );
    }
    const reason = player.playabilityStatus?.reason;
    throw new Error(
      reason
        ? `Couldn't load that video: ${reason}`
        : "Couldn't load that video (it may be private or removed).",
    );
  }

  const tracks = player.captions?.playerCaptionsTracklistRenderer?.captionTracks;
  if (!Array.isArray(tracks) || tracks.length === 0) {
    throw new Error(
      "This video has no captions Prism can read yet — try a video with subtitles, or paste the transcript.",
    );
  }

  const track = pickTrack(tracks);
  const cues = track.baseUrl ? await fetchCaptionCues(track.baseUrl) : [];
  if (cues.length === 0) {
    throw new Error(
      "Couldn't read this video's captions — YouTube may be limiting automated access. Try again, or paste the transcript.",
    );
  }

  // Assembly heuristic keyed on punctuation, not track kind: real sentence marks
  // are the only thing lib/sentences can split prose on. If the captions are
  // genuinely punctuated (most manual/news captions, and the TED talk), join
  // with spaces so it splits into real sentences. If they're not — ASR captions
  // AND punctuation-free "manual" tracks like song lyrics — keep one cue per
  // line, since lib/sentences treats newlines as boundaries. Without this a
  // punctuation-free transcript collapses into a single giant segment.
  const bySpace = cues.join(" ").replace(/\s+/g, " ").trim();
  const marks = (bySpace.match(/[.!?]/g) ?? []).length;
  const punctuated = marks > 0 && marks * 400 >= bySpace.length;
  const transcript = punctuated ? bySpace : cues.join("\n").trim();

  if (transcript.length < 40) {
    throw new Error("This video's captions were empty or too short to analyze.");
  }

  const details = player.videoDetails ?? {};
  const micro = player.microformat?.playerMicroformatRenderer ?? {};
  let title = typeof details.title === "string" ? details.title : undefined;
  let channel =
    (typeof details.author === "string" ? details.author : undefined) ??
    (typeof micro.ownerChannelName === "string" ? micro.ownerChannelName : undefined);

  // Fill any gaps from oEmbed (very reliable for title + channel).
  if (!title || !channel) {
    const o = await fetchOEmbed(watchUrl);
    if (o) {
      title = title ?? o.title;
      channel = channel ?? o.author_name;
    }
  }

  return {
    url: watchUrl,
    title,
    // A channel is an entity, not a person — leave the byline empty and let
    // Provenance profile the channel as the "outlet" (source) instead.
    author: undefined,
    source: channel,
    publishedDate: typeof micro.publishDate === "string" ? micro.publishDate : undefined,
    text: transcript,
    kind: "video",
    platform: "youtube",
  };
}
