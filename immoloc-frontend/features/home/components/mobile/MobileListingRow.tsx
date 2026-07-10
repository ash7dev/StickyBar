'use client';

import { useMemo } from 'react';
import type { CardListing } from '@/lib/nestjs/types';
import { MobileListingGridCard } from './MobileListingGridCard';
import type { FeedSection } from './feed.config';

function applySort(listings: CardListing[], sortBy?: FeedSection['sortBy']): CardListing[] {
  const arr = [...listings];
  switch (sortBy) {
    case 'popular': return arr.sort((a, b) => (b.totalSejours ?? 0) - (a.totalSejours ?? 0));
    case 'rated':   return arr.sort((a, b) => (b.note ?? 0) - (a.note ?? 0));
    case 'newest':  return arr.sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime());
    default:        return arr;
  }
}

function SkeletonCard() {
  return (
    <div
      className="shrink-0 rounded-[1.6rem] overflow-hidden bg-background-alt animate-pulse"
      style={{ width: 'calc(50vw - 22px)', aspectRatio: '3/4' }}
    />
  );
}

interface Props {
  section:  FeedSection;
  data:     CardListing[];
  loading:  boolean;
}

export function MobileListingRow({ section, data, loading }: Props) {
  const listings = useMemo(() => {
    let result = data;
    if (section.minNote) result = result.filter((l) => (l.note ?? 0) >= section.minNote!);
    return applySort(result, section.sortBy).slice(0, 12);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, section.id]);

  if (!loading && listings.length === 0) return null;

  const { Icon, iconColor, iconBg, label } = section;

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-3 px-4">
        <div
          className="w-9 h-9 rounded-2xl flex items-center justify-center shrink-0"
          style={{ background: iconBg }}
        >
          <Icon className="w-[18px] h-[18px]" style={{ color: iconColor }} />
        </div>
        <h2 className="text-[15px] font-black text-foreground tracking-tight">{label}</h2>
      </div>

      <div
        className="flex gap-3 overflow-x-auto px-4 pb-1 snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
      >
        {loading
          ? Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
          : listings.map((listing) => (
              <div key={listing.id} className="shrink-0 snap-start" style={{ width: 'calc(50vw - 22px)' }}>
                <MobileListingGridCard listing={listing as any} />
              </div>
            ))}
      </div>
    </section>
  );
}
