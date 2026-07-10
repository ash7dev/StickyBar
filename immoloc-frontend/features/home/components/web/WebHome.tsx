import { HeroSection } from './HeroSection';
import { FilterBar } from './FilterBar';
import { CategoriesSection } from './CategoriesSection';
import { FeaturedListingsSection } from './FeaturedListingsSection';
import { StatsSection } from './StatsSection';
import { TrustSection } from './TrustSection';
import { HowItWorks } from './HowItWorks';
import { ImmoLocChiffres } from './ImmoLocChiffres';
import { TestimonialsSection } from './TestimonialsSection';
import { FaqSection } from './FaqSection';
import { BecomeHostCTA } from './BecomeHostCTA';

export function WebHome() {
  return (
    <main className="bg-background min-h-screen">
      {/* 1. Hero immersif — fond noir */}
      <HeroSection />

      {/* 2. Filtre flottant — ancré sous le hero */}
      <div className="relative z-30 -mt-24">
        <FilterBar />
      </div>

      {/* 3. Profils — Locataire / Propriétaire */}
      <CategoriesSection />

      {/* 4. Catalogue — cards logements */}
      <FeaturedListingsSection />

      {/* 6. Pourquoi faire confiance à ImmoLoc — bento grid */}
      <TrustSection />

      {/* 7. Comment ça marche — 3 étapes */}
      <HowItWorks />

      {/* 8. ImmoLoc en chiffres — dark card premium */}
      <ImmoLocChiffres />

      {/* 9. Témoignages clients */}
      <TestimonialsSection />

      {/* 10. FAQ — split layout */}
      <FaqSection />

      {/* 11. CTA final — devenir hôte */}
      <BecomeHostCTA />
    </main>
  );
}
