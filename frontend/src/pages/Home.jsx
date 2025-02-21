import { FeaturesSection } from "../components/FeaturesSection";
import { FinalQuote } from "../components/FinalQuote";
import { SiteFooter } from "../components/Footer";
import { SiteHeader } from "../components/Header";
import { HeroSection } from "../components/HeroSection";


export default function Home() {
  return (
      <main className="flex-1 lg:text-left text-center">
        <HeroSection />
        <FeaturesSection />
        <FinalQuote/>
      </main>
  )
}

