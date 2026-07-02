import type { Metadata } from "next";
import AnalyzeApp from "@/components/analyze/AnalyzeApp";

export const metadata: Metadata = {
  title: "Refract a story",
  description:
    "Paste an article link or text. Prism classifies every sentence as claim, opinion, or rhetoric, traces the outlet's ownership and money, fact-checks the claims against live web sources, and shows what other outlets covered that this one didn't.",
};

// Phase 1 of the real tool: the "Refract" experience. <AnalyzeApp /> is a client
// component that manages the input → extract → analyze → visualize flow.
export default function GetStartedPage() {
  return <AnalyzeApp />;
}
