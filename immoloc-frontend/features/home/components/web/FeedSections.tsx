'use client';

import { useEffect, useState } from 'react';
import { ListingsSection } from './ListingsSection';
import { ListingCardSkeleton } from './ListingCardSkeleton';
import { PersonalizationTrigger } from './PersonalizationTrigger';
import { useHomePreferences, type HomePreferences } from '@/lib/hooks/useHomePreferences';

interface Listing {
  id: string;
  titre: string;
  type: string;
  sousType?: string;
  ville: string;
  quartier?: string;
  prixBase: number;
  note: number | null;
  totalSejours: number;
  photos: { url: string }[];
  derniereMinuteActive?: boolean;
}

interface FeedSection {
  id: string;
  listings: Listing[];
}

interface FeedResponse {
  sections: FeedSection[];
}

// Configuration des sections à afficher avec leurs titres et liens
const SECTION_CONFIG: Record<string, { title: string; subtitle?: string; link?: string; variant?: 'standard' | 'premium' }> = {
  'popular': {
    title: 'Les plus populaires',
    subtitle: 'Plébiscités par nos voyageurs',
    link: '/explorer?sort=popular',
  },
  'newest': {
    title: 'Nouveautés',
    subtitle: 'Derniers biens ajoutés',
    link: '/explorer?sort=newest',
  },
  'rated': {
    title: 'Les mieux notés',
    subtitle: 'Excellence et qualité garanties',
    link: '/explorer?sort=rated',
    variant: 'premium',
  },
  'villa-pool': {
    title: 'Villas avec piscine',
    subtitle: 'Pour des vacances de rêve',
    link: '/explorer?type=VILLA&sousType=Villa+avec+piscine',
  },
  'villa-luxe': {
    title: 'Villas de luxe',
    subtitle: 'Le summum du confort',
    link: '/explorer?type=VILLA&sousType=Villa+de+luxe',
    variant: 'premium',
  },
  'villa-sea': {
    title: 'Villas bord de mer',
    subtitle: 'Vue imprenable sur l\'océan',
    link: '/explorer?type=VILLA&sousType=Villa+bord+de+mer',
  },
  'penthouse': {
    title: 'Penthouses',
    subtitle: 'Au sommet de la ville',
    link: '/explorer?type=APPARTEMENT&sousType=Penthouse',
    variant: 'premium',
  },
  'loft': {
    title: 'Lofts',
    subtitle: 'Espaces modernes et design',
    link: '/explorer?type=APPARTEMENT&sousType=Loft',
  },
  'suite': {
    title: 'Suites meublées',
    subtitle: 'Confort hôtelier et autonomie',
    link: '/explorer?type=CHAMBRE&sousType=Suite+meublée',
  },
  'maison': {
    title: 'Maisons entières',
    subtitle: 'Idéal pour les groupes et grandes familles',
    link: '/explorer?type=AUTRES',
  },
  'zone-almadies': {
    title: 'Almadies',
    subtitle: 'Le quartier chic de Dakar',
    link: '/explorer?ville=Almadies',
  },
  'zone-saly': {
    title: 'Saly',
    subtitle: 'Station balnéaire prisée',
    link: '/explorer?ville=Saly',
  },
  'zone-ngor': {
    title: 'Ngor',
    subtitle: 'Charme et authenticité',
    link: '/explorer?ville=Ngor',
  },
  'zone-mermoz': {
    title: 'Mermoz',
    subtitle: 'Quartier résidentiel calme et central',
    link: '/explorer?ville=Mermoz',
  },
  'zone-plateau': {
    title: 'Plateau',
    subtitle: 'Centre historique de Dakar',
    link: '/explorer?ville=Plateau',
  },
  'zone-somone': {
    title: 'Somone',
    subtitle: 'Calme et lagune préservée',
    link: '/explorer?ville=Somone',
  },
  'zone-cap-skirring': {
    title: 'Cap Skirring',
    subtitle: 'Plages paradisiaques de Casamance',
    link: '/explorer?ville=Cap+Skirring',
  },
  'zone-saint-louis': {
    title: 'Saint-Louis',
    subtitle: 'Ville d\'art et d\'histoire',
    link: '/explorer?ville=Saint-Louis',
  },
  'zone-yoff': {
    title: 'Yoff',
    subtitle: 'Vague et tradition bord de mer',
    link: '/explorer?ville=Yoff',
  },
  'zone-ngaparou': {
    title: 'Ngaparou',
    subtitle: 'Tranquillité et plages de la Petite Côte',
    link: '/explorer?ville=Ngaparou',
  },
};

const SOUS_TYPE_SECTION_MAP: Record<string, string> = {
  'Villa avec piscine': 'villa-pool',
  'Penthouse': 'penthouse',
  'Loft': 'loft',
  'Villa bord de mer': 'villa-sea',
  'Villa de luxe': 'villa-luxe',
  'Suite meublée': 'suite',
  'Maison entière': 'maison',
};

function getPrioritySectionIds(preferences: HomePreferences): string[] {
  const ids: string[] = [];

  // Match zones (ex: "Saly" -> "zone-saly")
  preferences.zones.forEach((z) => {
    const slug = z.toLowerCase().replace(/[^a-z0-9]/g, '-');
    ids.push(`zone-${slug}`);
  });

  // Match sous-types
  preferences.sousTypes.forEach((st) => {
    if (SOUS_TYPE_SECTION_MAP[st]) {
      ids.push(SOUS_TYPE_SECTION_MAP[st]);
    }
  });

  return ids;
}

// Cache clé pour sessionStorage
const FEED_CACHE_KEY = 'listings_feed_cache';
const FEED_CACHE_TIMESTAMP_KEY = 'listings_feed_cache_timestamp';
const CACHE_DURATION = 5 * 60 * 1000;

function getSectionConfig(sectionId: string) {
  if (SECTION_CONFIG[sectionId]) return SECTION_CONFIG[sectionId];
  if (sectionId.startsWith('zone-')) {
    const rawName = sectionId.replace('zone-', '').replace(/-/g, ' ');
    const title = rawName.charAt(0).toUpperCase() + rawName.slice(1);
    return {
      title,
      subtitle: `Séjours d'exception à ${title}`,
      link: `/explorer?ville=${encodeURIComponent(title)}`,
    };
  }
  return null;
}

export function FeedSections() {
  const [feed, setFeed] = useState<FeedResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const { preferences, isLoaded: prefsLoaded } = useHomePreferences();

  useEffect(() => {
    const fetchFeed = async () => {
      try {
        const cachedData = sessionStorage.getItem(FEED_CACHE_KEY);
        const cachedTimestamp = sessionStorage.getItem(FEED_CACHE_TIMESTAMP_KEY);

        if (cachedData && cachedTimestamp) {
          const age = Date.now() - parseInt(cachedTimestamp, 10);
          if (age < CACHE_DURATION) {
            setFeed(JSON.parse(cachedData));
            setLoading(false);
            return;
          }
        }

        const response = await fetch('/api/v1/listings/feed');
        if (!response.ok) throw new Error('Failed to fetch feed');
        const data = await response.json();

        sessionStorage.setItem(FEED_CACHE_KEY, JSON.stringify(data));
        sessionStorage.setItem(FEED_CACHE_TIMESTAMP_KEY, Date.now().toString());

        setFeed(data);
      } catch (error) {
        console.error('[FeedSections] Failed to fetch feed:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeed();
  }, []);

  if (loading || !prefsLoaded) {
    return (
      <div className="space-y-4">
        <div className="max-w-7xl mx-auto px-6 pt-4">
          <div className="h-20 bg-neutral-100 rounded-card animate-pulse" />
        </div>
        {[1, 2, 3].map((sectionIndex) => (
          <section key={sectionIndex} className="py-4">
            <div className="max-w-7xl mx-auto px-6">
              <div className="flex items-end justify-between mb-4">
                <div className="space-y-2">
                  <div className="h-8 bg-neutral-200 rounded animate-pulse w-48" />
                  <div className="h-4 bg-neutral-200 rounded animate-pulse w-32" />
                </div>
                <div className="h-10 bg-neutral-200 rounded-[var(--radius-pill)] animate-pulse w-24" />
              </div>
              <div className="relative -mx-6 px-6">
                <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4">
                  {[1, 2, 3, 4].map((cardIndex) => (
                    <div key={cardIndex} className="flex-shrink-0 w-[280px] sm:w-[320px]">
                      <ListingCardSkeleton />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        ))}
      </div>
    );
  }

  if (!feed) {
    return null;
  }

  const priorityIds = getPrioritySectionIds(preferences);

  // 1. Sections prioritaires selon les choix de l'utilisateur (non vides)
  const prioritySections = feed.sections.filter(
    (s) => priorityIds.includes(s.id) && getSectionConfig(s.id) && s.listings.length > 0,
  );

  // 2. Autres sections (non vides)
  const remainingSections = feed.sections.filter(
    (s) => !priorityIds.includes(s.id) && getSectionConfig(s.id) && s.listings.length > 0,
  );

  const displayedSections = [...prioritySections, ...remainingSections].map((section) => ({
    ...section,
    config: getSectionConfig(section.id)!,
  }));

  if (displayedSections.length === 0) {
    return (
      <div className="py-20 text-center">
        <p className="text-foreground-muted">Aucune annonce disponible pour le moment</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Trigger / Banner de personnalisation du fil d'accueil */}
      <div className="max-w-7xl mx-auto px-6 pt-2">
        <PersonalizationTrigger />
      </div>

      {/* Sections du feed */}
      <div className="space-y-2">
        {displayedSections.map((section) => (
          <ListingsSection
            key={section.id}
            title={section.config.title}
            subtitle={section.config.subtitle}
            listings={section.listings}
            viewAllLink={section.config.link}
            variant={section.config.variant}
          />
        ))}
      </div>
    </div>
  );
}
