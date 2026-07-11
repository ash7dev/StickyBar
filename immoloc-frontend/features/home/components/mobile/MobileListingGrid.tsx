'use client';

import Link from 'next/link';
import { ChevronRight, SearchX } from 'lucide-react';
import type { LucideProps } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { listingsApi } from '@/lib/nestjs/listings.api';
import type { SearchListingsParams } from '@/lib/nestjs/types';
import { MobileListingGridCard } from './MobileListingGridCard';

function SkeletonCard() {
  return (
    <div
      className="animate-pulse rounded-2xl bg-background-alt"
      style={{ aspectRatio: '3/4' }}
    />
  );
}

interface Props {
  params?:    SearchListingsParams;
  title?:     string;
  eyebrow?:   string;
  icon?:      React.ComponentType<LucideProps>;
  iconColor?: string;
  iconBg?:    string;
}

export function MobileListingGrid({
  params = {},
  title = 'Logements disponibles',
  eyebrow = 'Annonces',
  icon: Icon,
  iconColor = 'text-emerald-600',
  iconBg = 'bg-emerald-50',
}: Props) {
  const { data: listings = [], isLoading } = useQuery({
    queryKey: ['listings', 'grid', params],
    queryFn: () => listingsApi.search({ limit: 20, ...params }).then((res) => res.data),
  });

  return (
    <section className="px-4">
      {/* En-tête */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
              <Icon className={`h-5 w-5 ${iconColor}`} />
            </div>
          )}
          <div>
            <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-600">
              {eyebrow}
            </p>
            <h2 className="text-[18px] leading-tight text-foreground">{title}</h2>
          </div>
        </div>

        {!isLoading && listings.length > 0 && (
          <Link
            href="/logements"
            className="flex shrink-0 items-center gap-0.5 rounded-full bg-emerald-50 px-3 py-1.5 text-[12px] font-semibold text-emerald-700"
          >
            Tout voir <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>

      {/* Grille ou état vide */}
      {!isLoading && listings.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-background-card px-6 py-10 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-background-alt">
            <SearchX className="h-5 w-5 text-foreground-muted" />
          </div>
          <div>
            <p className="mb-1 text-[14px] font-semibold text-foreground">
              Aucun logement disponible
            </p>
            <p className="text-[12px] leading-relaxed text-foreground-muted">
              Aucun résultat pour cette catégorie. Essayez-en une autre ou
              consultez tous nos logements.
            </p>
          </div>
          <Link
            href="/logements"
            className="mt-1 rounded-lg bg-emerald-600 px-5 py-2.5 text-[13px] font-semibold text-white transition-colors active:bg-emerald-800 hover:bg-emerald-700"
          >
            Voir tous les logements
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
            : listings.map((listing) => (
                <MobileListingGridCard key={listing.id} listing={listing} />
              ))}
        </div>
      )}
    </section>
  );
}