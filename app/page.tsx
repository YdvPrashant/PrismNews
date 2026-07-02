import Hero from "@/components/Hero";
import HowItWorks from "@/components/HowItWorks";
import AboutSection from "@/components/AboutSection";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="relative">
      <Hero />
      <HowItWorks />
      <AboutSection />
      <Footer />
    </main>
  );
}
