import { FeaturesSection } from "../components/home/FeaturesSection";
import { FinalQuote } from "../components/home/FinalQuote";
import { SiteFooter } from "../components/home/Footer";
import { SiteHeader } from "../components/home/Header";
import { HeroSection } from "../components/HeroSection";


export default function Home() {
  return (
      <main className="flex flex-col lg:text-left items-center justify-center text-center">
        <SiteHeader />
        <HeroSection />
        <FeaturesSection />
        <FinalQuote/>
        <SiteFooter />
      </main>
  )
}

