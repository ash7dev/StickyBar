'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { ListingCard } from './ListingCard';

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
}

interface ListingsSectionProps {
  title: string;
  subtitle?: string;
  listings: Listing[];
  viewAllLink?: string;
  variant?: 'standard' | 'premium';
}

export function ListingsSection({
  title,
  subtitle,
  listings,
  viewAllLink,
  variant = 'standard',
}: ListingsSectionProps) {
  // Ne pas afficher la section si elle est vide
  if (!listings || listings.length === 0) {
    return null;
  }

  return (
    <section className="py-4">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="flex items-end justify-between mb-4">
          <div className="relative">
            {/* Trait oblique décoratif */}
            <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-1 h-12 bg-gradient-to-b from-lime-400 to-forest-600 transform -skew-y-12 opacity-60" />

            <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-1 relative">
              {title}
              {/* Petit accent lime sous le titre */}
              <span className="absolute -bottom-1 left-0 w-16 h-0.5 bg-lime-400" />
            </h2>
            {subtitle && (
              <p className="text-sm text-foreground-muted italic">{subtitle}</p>
            )}
          </div>

          {viewAllLink && (
            <Link
              href={viewAllLink}
              className="flex items-center gap-1 text-sm font-semibold text-forest-600 hover:text-lime-600 transition-colors group px-4 py-2 rounded-[var(--radius-pill)] border border-border hover:border-lime-400 hover:bg-lime-50"
            >
              Voir tout
              <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          )}
        </div>

        {/* Horizontal scroll container */}
        <div className="relative -mx-6 px-6">
          <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 snap-x snap-mandatory">
            {listings.map((listing) => (
              <div
                key={listing.id}
                className="flex-shrink-0 w-[280px] sm:w-[320px] snap-start"
              >
                <ListingCard {...listing} variant={variant} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
