import AnalyzeApp from "@/components/analyze/AnalyzeApp";

export const metadata = {
  title: "Refract a story — Prism",
  description:
    "Paste an article link or text and Prism refracts it into claims, opinions, and rhetoric — with a color-coded transcript and a composition breakdown.",
};

// Phase 1 of the real tool: the "Refract" experience. <AnalyzeApp /> is a client
// component that manages the input → extract → analyze → visualize flow.
export default function GetStartedPage() {
  return <AnalyzeApp />;
}
