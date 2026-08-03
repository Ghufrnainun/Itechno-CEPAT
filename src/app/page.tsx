import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { TrustStrip } from "@/components/landing/TrustStrip";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { CategoriesCloud } from "@/components/landing/CategoriesCloud";
import { SdgImpact } from "@/components/landing/SdgImpact";
import { ComparisonSection } from "@/components/landing/ComparisonSection";
import { FinalCTA } from "@/components/landing/FinalCTA";

export default function Home() {
  return (
    <div className="landing-page min-h-screen bg-layout-bg font-sans selection:bg-primary/20 selection:text-primary">
      {/* 
        NOTE: .landing-page wrapper is crucial. 
        It scopes the landing-specific styles in globals.css 
        so they don't leak into the dashboard.
      */}
      <LandingNavbar />
      
      <main>
        <HeroSection />
        <TrustStrip />
        <HowItWorks />
        <FeaturesSection />
        <CategoriesCloud />
        <SdgImpact />
        <ComparisonSection />
        <FinalCTA />
      </main>

      {/* Simple Footer */}
      <footer className="w-full border-t border-outline-variant bg-surface-container-lowest py-8 md:py-12">
        <div className="max-w-5xl mx-auto px-4 md:px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
             <span className="font-bold text-lg text-primary tracking-tight">CEPAT.</span>
             <span className="text-sm text-on-surface-variant">© 2026 ITechno Cup.</span>
          </div>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mt-4 md:mt-0">
            <a href="/kebijakan-privasi" className="text-sm text-on-surface-variant hover:text-primary">Kebijakan Privasi</a>
            <a href="/syarat-ketentuan" className="text-sm text-on-surface-variant hover:text-primary">Syarat &amp; Ketentuan</a>
            <a href="/bantuan" className="text-sm text-on-surface-variant hover:text-primary">Bantuan</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
