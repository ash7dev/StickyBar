'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { listingsApi } from '@/lib/nestjs/listings.api';
import type { SearchListingsParams } from '@/lib/nestjs/types';
import { MobileListingCard } from './MobileListingCard';

interface MobileListingsRowProps {
  title: string;
  params?: SearchListingsParams;
  /** Lien du bouton "Tout voir" — pré-filtré si possible */
  href?: string;
}

function SkeletonCard() {
  return (
    <div className="w-[180px] shrink-0 overflow-hidden rounded-2xl border border-border">
      <div className="h-[130px] animate-pulse bg-background-alt" />
      <div className="space-y-2 p-3">
        <div className="h-3 w-3/4 animate-pulse rounded-full bg-background-alt" />
        <div className="h-2.5 w-1/2 animate-pulse rounded-full bg-background-alt" />
        <div className="h-3 w-2/3 animate-pulse rounded-full bg-background-alt" />
      </div>
    </div>
  );
}

export function MobileListingsRow({
  title,
  params = {},
  href = '/logements',
}: MobileListingsRowProps) {
  const { data: listings = [], isLoading } = useQuery({
    queryKey: ['listings', 'row', params],
    queryFn: () => listingsApi.search({ limit: 10, ...params }).then((res) => res.data),
  });

  if (!isLoading && listings.length === 0) return null;

  return (
    <section className="space-y-3">
      {/* En-tête */}
      <div className="flex items-center justify-between px-5">
        <h2 className="text-[16px] leading-tight text-foreground">{title}</h2>
        <Link
          href={href}
          className="flex items-center gap-0.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[12px] font-semibold text-emerald-700"
        >
          Tout voir <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Rangée scrollable — snap pour un défilement naturel au doigt */}
      <div
        className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          : listings.map((listing) => (
              <div key={listing.id} className="snap-start">
                <MobileListingCard listing={listing} />
              </div>
            ))}
      </div>
    </section>
  );
}