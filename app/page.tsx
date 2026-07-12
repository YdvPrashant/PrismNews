import Hero from "@/components/Hero";
import HowItWorks from "@/components/HowItWorks";
import AboutSection from "@/components/AboutSection";
import CtaBand from "@/components/CtaBand";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="relative">
      <Hero />
      {/* HowItWorks hosts the Specimen demo card since Step 17. */}
      <HowItWorks />
      <AboutSection />
      <CtaBand />
      <Footer />
    </main>
  );
}
