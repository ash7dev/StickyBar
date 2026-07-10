'use client';

import { useEffect, useState, useMemo } from 'react';
import { LayoutGrid, Building2, TreePine, BedDouble, Home } from 'lucide-react';
import type { LucideProps } from 'lucide-react';
import { listingsApi } from '@/lib/nestjs/listings.api';
import type { CardListing, FeedResponse } from '@/lib/nestjs/types';
import type { ListingType } from '@/lib/nestjs/types';
import { MobileListingGrid } from './MobileListingGrid';
import { MobileHotZones } from './MobileHotZones';
import { MobileListingRow } from './MobileListingRow';
import { BecomeHostCTA } from '../web/BecomeHostCTA';
import { Footer } from '../web/Footer';
import {
  ALL_FEED_SECTIONS,
  RANKED_SECTIONS,
  SUBTYPE_SECTIONS,
  FEED_ID_BY_TYPE,
  GRID_TITLE,
} from './feed.config';
import type { FeedSection } from './feed.config';

const TYPE_MAP: Record<string, ListingType | undefined> = {
  all:         undefined,
  APPARTEMENT: 'APPARTEMENT',
  VILLA:       'VILLA',
  CHAMBRE:     'CHAMBRE',
  AUTRES:      'AUTRES',
};

interface GridMeta {
  icon:      React.ComponentType<LucideProps>;
  iconColor: string;
  iconBg:    string;
  eyebrow:   string;
}

const GRID_META: Record<string, GridMeta> = {
  all:         { icon: LayoutGrid, iconColor: '#146532', iconBg: '#dcfce7', eyebrow: 'Toutes catégories' },
  APPARTEMENT: { icon: Building2,  iconColor: '#0284c7', iconBg: '#e0f2fe', eyebrow: 'Appartements'      },
  VILLA:       { icon: TreePine,   iconColor: '#146532', iconBg: '#dcfce7', eyebrow: 'Villas'             },
  CHAMBRE:     { icon: BedDouble,  iconColor: '#d97706', iconBg: '#fef3c7', eyebrow: 'Chambres'           },
  AUTRES:      { icon: Home,       iconColor: '#7c3aed', iconBg: '#f3e8ff', eyebrow: 'Autres logements'   },
};

function useFeed() {
  const [pool, setPool]       = useState<Record<string, CardListing[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    listingsApi.feed()
      .then((res: FeedResponse) => {
        if (cancelled) return;
        const map: Record<string, CardListing[]> = {};
        for (const s of res.sections) map[s.id] = s.listings;
        setPool(map);
      })
      .catch((err) => console.error('[MobileDynamicFeed] feed error:', err))
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return { pool, loading };
}

interface Props {
  activeCategory: string;
}

export function MobileDynamicFeed({ activeCategory }: Props) {
  const activeType = TYPE_MAP[activeCategory];
  const { pool, loading } = useFeed();

  // Sections à afficher selon la catégorie
  const feedSections = useMemo((): FeedSection[] => {
    if (!activeType) return ALL_FEED_SECTIONS;

    // Vue catégorie : ranked (avec feedId pointant vers le pool du type) + sous-types du type
    const typeFeedId = FEED_ID_BY_TYPE[activeType] ?? 'popular';
    const ranked: FeedSection[] = RANKED_SECTIONS.map((s) => ({
      ...s,
      feedId: typeFeedId,
      id: `${s.id}_${activeType}`,
    }));
    const subtypes = SUBTYPE_SECTIONS.filter((s) => feedSectionBelongsToType(s.feedId, activeType));
    return [...ranked, ...subtypes];
  }, [activeType]);

  const gridParams = activeType ? { type: activeType } : {};
  const gridTitle  = GRID_TITLE[activeCategory] ?? 'Logements disponibles';
  const gridMeta   = GRID_META[activeCategory] ?? GRID_META.all;

  return (
    <div className="space-y-8">
      <MobileListingGrid
        params={gridParams}
        title={gridTitle}
        eyebrow={gridMeta.eyebrow}
        icon={gridMeta.icon}
        iconColor={gridMeta.iconColor}
        iconBg={gridMeta.iconBg}
      />

      {feedSections.slice(0, 3).map((section) => (
        <MobileListingRow
          key={section.id}
          section={section}
          data={pool[section.feedId] ?? []}
          loading={loading}
        />
      ))}

      <MobileHotZones />

      {feedSections.slice(3).map((section) => (
        <MobileListingRow
          key={section.id}
          section={section}
          data={pool[section.feedId] ?? []}
          loading={loading}
        />
      ))}

      <BecomeHostCTA />

      <Footer />
    </div>
  );
}

/** Détermine si un feedId appartient à un type donné */
function feedSectionBelongsToType(feedId: string, type: ListingType): boolean {
  const map: Record<ListingType, string[]> = {
    VILLA:       ['villas', 'villa-pool', 'villa-sea', 'villa-luxe', 'villa-fam', 'villa-event'],
    APPARTEMENT: ['appartements', 'penthouse', 'loft'],
    CHAMBRE:     ['chambres', 'suite'],
    AUTRES:      ['maison'],
  };
  return map[type]?.includes(feedId) ?? false;
}
