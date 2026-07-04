// Shared types for the Prism analysis pipeline (Phase 1).

// The four buckets every sentence of an article is sorted into.
//  - claim   : a checkable, falsifiable statement of fact
//  - opinion : a subjective judgment, interpretation, prediction, or value statement
//  - bs      : loaded/manipulative/empty rhetoric that pushes a feeling, not a fact
//  - neutral : connective tissue / plain context that is none of the above
export type Category = "claim" | "opinion" | "bs" | "neutral";

export const CATEGORIES: Category[] = ["claim", "opinion", "bs", "neutral"];

// Fact-check cost bound — how many of the most substantial claims get verified
// per article. Shared with the UI (components/analyze/FactCheck.tsx) so the
// idle-state copy can't drift from the engine (lib/factcheck.ts).
export const MAX_CLAIMS = 6;

// One classified sentence. `text` is the exact original text (incl. its trailing
// whitespace) so the transcript reproduces the article verbatim.
export interface Segment {
  text: string;
  category: Category;
  reason?: string;
  // How central-AND-checkable this claim is, 0–3 (only meaningful for `claim`
  // segments; absent/0 elsewhere). Fact Check verifies the highest-salience
  // claims first (ranking happens in AnalyzeApp before the claims are sent).
  //  3 = load-bearing to the story and concretely verifiable
  //  2 = checkable and relevant · 1 = checkable but peripheral · 0 = not really
  salience?: number;
}

// Per-category weight, measured in characters so the proportion bar and the
// transcript agree by construction.
export interface CategoryScore {
  category: Category;
  chars: number;
  percent: number; // 0–100, rounded for display
}

export interface AnalysisResult {
  segments: Segment[];
  scores: CategoryScore[];
  totalChars: number;
  truncated?: boolean; // set when a very long article was capped before analysis
}

// ---- Fact-checking (Phase 1, claims only) ----

// The verdict Prism assigns a single claim after weighing web evidence.
//  - supported   : the sources corroborate the claim
//  - disputed    : the sources contradict / refute the claim
//  - misleading  : has some basis but is missing context or cherry-picked
//  - unverified  : not enough reliable evidence to judge
export type Verdict = "supported" | "disputed" | "misleading" | "unverified";

export const VERDICTS: Verdict[] = [
  "supported",
  "disputed",
  "misleading",
  "unverified",
];

export type Confidence = "low" | "medium" | "high";

// One cited source backing a verdict. `stance` is how it relates to the claim.
export interface Evidence {
  title: string;
  publisher?: string; // domain, e.g. "reuters.com"
  url: string;
  snippet: string;
  stance: "supports" | "contradicts" | "context";
}

// The fact-check of one claim, with ≥2 pieces of evidence where sources allow.
export interface ClaimCheck {
  claim: string;
  verdict: Verdict;
  confidence: Confidence;
  explanation: string; // short rationale, grounded in the cited sources
  evidence: Evidence[];
}

export interface FactCheckResult {
  checks: ClaimCheck[];
  totalClaims: number; // claims found in the article
  checkedCount: number; // how many we actually checked (capped)
}

// Result of pulling readable content out of a URL — an article's body, or a
// video's transcript. Both converge on this one shape so the whole downstream
// pipeline (analyze, provenance, fact-check, full picture, report) is agnostic
// to where `text` came from.
export interface ExtractedArticle {
  url: string;
  title?: string;
  author?: string;
  source?: string;
  publishedDate?: string;
  text: string;
  // Where `text` came from. Absent ≡ "article" (keeps existing callers valid).
  kind?: "article" | "video";
  // For videos: the host platform, used for labeling and the host-vs-creator
  // framing in Provenance. YouTube is the only supported platform in Phase 1.
  platform?: "youtube";
}

// ---- Provenance (source & author intelligence) ----

// Political leaning of the outlet, per third-party ratings found in sources.
export type Leaning =
  | "left"
  | "lean-left"
  | "center"
  | "lean-right"
  | "right"
  | "unknown";

export const LEANINGS: Leaning[] = [
  "left",
  "lean-left",
  "center",
  "lean-right",
  "right",
  "unknown",
];

// Historical/factual reliability of the outlet, per ratings found in sources.
export type Reliability = "high" | "mixed" | "low" | "unknown";

export const RELIABILITIES: Reliability[] = ["high", "mixed", "low", "unknown"];

// "Follow the money" — the outlet's dominant revenue/funding archetype.
export type RevenueType =
  | "ad-driven"
  | "subscription"
  | "billionaire-owned"
  | "state-affiliated"
  | "nonprofit"
  | "mixed"
  | "unknown";

export const REVENUE_TYPES: RevenueType[] = [
  "ad-driven",
  "subscription",
  "billionaire-owned",
  "state-affiliated",
  "nonprofit",
  "mixed",
  "unknown",
];

// A short grounded statement plus its receipts — indices into
// SourceIntelResult.sources. "Unknown" text with no citations is a valid,
// honest answer; invented facts are not.
export interface SourcedNote {
  text: string;
  citations: number[];
}

export interface OutletIntel {
  ownership: SourcedNote; // who owns it (chain if known)
  funding: SourcedNote; // who funds it, narratively
  revenue: { type: RevenueType; note: SourcedNote }; // Follow the Money
  leaning: { value: Leaning; note: SourcedNote };
  reliability: { value: Reliability; note: SourcedNote };
}

export interface AuthorIntel {
  name: string;
  expertise: SourcedNote; // beats / topic expertise
  trackRecord: SourcedNote; // outlets written for, notable work
  controversies: SourcedNote; // documented disputes; "none found" is valid
}

// The "shadow check": where the domain is actually registered and hosted.
// Every field is best-effort — registries redact, CDNs mask.
export interface DomainForensics {
  domain: string;
  registrar?: string;
  createdDate?: string; // ISO date from the RDAP "registration" event
  ageYears?: number;
  registrantCountry?: string; // often redacted
  hostingOrg?: string; // network org/ISP behind the site's IP
  hostingCountry?: string;
  cdnMasked: boolean; // hostingOrg is a known CDN → true origin hidden
  flags: string[]; // honest observations, e.g. "Domain registered <1 year ago"
}

// One entry in the shared numbered citation pool (Evidence minus stance).
export interface IntelSource {
  title: string;
  url: string;
  publisher?: string;
  snippet: string;
}

export interface SourceIntelResult {
  domain: string;
  outletName: string;
  outlet: OutletIntel;
  author: AuthorIntel | null; // null = couldn't identify a person
  forensics: DomainForensics | null; // null = all lookups failed
  sources: IntelSource[];
}

// ---- The Full Picture (coverage-gap analysis) ----

// How THIS article handled a fact that the wider coverage establishes.
//  - covered : clearly reported
//  - partial : mentioned but softened or incomplete
//  - missing : absent entirely
export type CoverageStatus = "covered" | "partial" | "missing";

export const COVERAGE_STATUSES: CoverageStatus[] = [
  "covered",
  "partial",
  "missing",
];

// Overall completeness of the article vs. other outlets' coverage.
export type Completeness = "complete" | "minor-gaps" | "major-gaps" | "unknown";

export const COMPLETENESS_LEVELS: Completeness[] = [
  "complete",
  "minor-gaps",
  "major-gaps",
  "unknown",
];

// One consensus fact from the wider coverage, judged against THIS article.
export interface CoveragePoint {
  fact: string; // what the wider coverage establishes
  status: CoverageStatus; // how the article handled it
  note: string; // how it was covered / softened / omitted
  citations: number[]; // indices into FullStoryResult.sources
}

export interface FullStoryResult {
  storyQuery: string; // the event query we searched — shown for transparency
  verdict: Completeness;
  verdictNote: string;
  points: CoveragePoint[];
  // The same event, two characterizations — null when no meaningful difference.
  framing: { article: string; elsewhere: string; citations: number[] } | null;
  sources: IntelSource[]; // shared numbered pool (other outlets only)
}
