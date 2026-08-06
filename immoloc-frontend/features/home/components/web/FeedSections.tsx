'use client';

import { useEffect, useState } from 'react';
import { ListingsSection } from './ListingsSection';
import { ListingCardSkeleton } from './ListingCardSkeleton';

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
  'zone-plateau': {
    title: 'Plateau',
    subtitle: 'Centre historique de Dakar',
    link: '/explorer?ville=Plateau',
  },
  /* 
    -- SECTIONS EN ATTENTE D'ACTIVATION (A décommenter ultérieurement avec plus de données) --
    
    // 1. Offres Dernière Minute (-15%)
    'last-minute': {
      title: 'Offres Dernière Minute (-15%)',
      subtitle: 'Profitez de -15% de réduction sur les séjours imminents',
      link: '/explorer?derniereMinute=true',
    },
    // 2. Studios & F2 Business & Workation
    'business-studios': {
      title: 'Studios & F2 Business',
      subtitle: 'Espaces autonomes avec Wifi haut débit et climatisation',
      link: '/explorer?type=APPARTEMENT&sousType=Studio',
    },
    // 3. Échappées Balnéaires (Petite Côte)
    'coastal-escape': {
      title: 'Échappées Balnéaires',
      subtitle: 'Séjours détente à Saly, Somone et Ngaparou',
      link: '/explorer?ville=Saly',
    },
    // 5. Villas pour Événements & Familles
    'villa-events': {
      title: 'Villas Familles & Événements',
      subtitle: 'Grands espaces avec jardin et piscine pour vos réceptions',
      link: '/explorer?type=VILLA&sousType=Villa+pour+événement',
    },
  */
};

// Cache clé pour sessionStorage
const FEED_CACHE_KEY = 'listings_feed_cache';
const FEED_CACHE_TIMESTAMP_KEY = 'listings_feed_cache_timestamp';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes en millisecondes

export function FeedSections() {
  const [feed, setFeed] = useState<FeedResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeed = async () => {
      try {
        // Vérifier le cache d'abord
        const cachedData = sessionStorage.getItem(FEED_CACHE_KEY);
        const cachedTimestamp = sessionStorage.getItem(FEED_CACHE_TIMESTAMP_KEY);

        if (cachedData && cachedTimestamp) {
          const age = Date.now() - parseInt(cachedTimestamp, 10);

          // Si le cache a moins de 5 minutes, l'utiliser
          if (age < CACHE_DURATION) {
            setFeed(JSON.parse(cachedData));
            setLoading(false);
            return;
          }
        }

        // Sinon, fetch depuis le serveur
        const response = await fetch('/api/v1/listings/feed');
        if (!response.ok) throw new Error('Failed to fetch feed');
        const data = await response.json();

        // Mettre en cache
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

  if (loading) {
    return (
      <div className="space-y-2">
        {/* Afficher 3 sections skeleton */}
        {[1, 2, 3].map((sectionIndex) => (
          <section key={sectionIndex} className="py-4">
            <div className="max-w-7xl mx-auto px-6">
              {/* Header skeleton */}
              <div className="flex items-end justify-between mb-4">
                <div className="space-y-2">
                  <div className="h-8 bg-neutral-200 rounded animate-pulse w-48" />
                  <div className="h-4 bg-neutral-200 rounded animate-pulse w-32" />
                </div>
                <div className="h-10 bg-neutral-200 rounded-[var(--radius-pill)] animate-pulse w-24" />
              </div>

              {/* Cards skeleton */}
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

  // Filtrer les sections configurées et non vides
  const displayedSections = feed.sections
    .filter((section) => SECTION_CONFIG[section.id] && section.listings.length > 0)
    .map((section) => ({
      ...section,
      config: SECTION_CONFIG[section.id],
    }));

  if (displayedSections.length === 0) {
    return (
      <div className="py-20 text-center">
        <p className="text-foreground-muted">Aucune annonce disponible pour le moment</p>
      </div>
    );
  }

  return (
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
  );
}
