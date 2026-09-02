'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { ListingCard } from './ListingCard';

export interface ListingItem {
  id: string;
  titre: string;
  type: string;
  sousType?: string | null;
  ville: string;
  quartier?: string | null;
  prixBase: number | any;
  note?: number | null;
  totalSejours?: number;
  photos: { url: string }[];
  capaciteMax?: number;
  nombreChambres?: number | null;
  nombreSallesBain?: number | null;
  nuitesMinimum?: number | null;
  isInstantBooking?: boolean;
  derniereMinuteActive?: boolean;
  videoUrl?: string | null;
}

interface ListingsSectionProps {
  title: string;
  subtitle?: string;
  listings: ListingItem[];
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
            <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-1 h-12 bg-gradient-to-b from-forest-500 to-forest-800 transform -skew-y-12 opacity-40" />

            <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-1 relative">
              {title}
              {/* Accent sous le titre */}
              <span className="absolute -bottom-1 left-0 w-12 h-0.5 bg-forest-600/40" />
            </h2>
            {subtitle && (
              <p className="text-sm text-foreground-muted italic">{subtitle}</p>
            )}
          </div>

          {viewAllLink && (
            <Link
              href={viewAllLink}
              className="flex items-center gap-1 text-sm font-semibold text-forest-700 hover:text-forest-900 transition-colors group px-4 py-2 rounded-[var(--radius-pill)] border border-border hover:border-forest-300 hover:bg-forest-50"
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
                <ListingCard
                  id={listing.id}
                  titre={listing.titre}
                  type={listing.type}
                  sousType={listing.sousType}
                  ville={listing.ville}
                  quartier={listing.quartier}
                  prixBase={Number(listing.prixBase)}
                  note={listing.note ? Number(listing.note) : null}
                  totalSejours={listing.totalSejours ?? 0}
                  photos={listing.photos}
                  capaciteMax={listing.capaciteMax}
                  nombreChambres={listing.nombreChambres}
                  nombreSallesBain={listing.nombreSallesBain}
                  nuitesMinimum={listing.nuitesMinimum}
                  isInstantBooking={listing.isInstantBooking}
                  derniereMinuteActive={listing.derniereMinuteActive}
                  videoUrl={listing.videoUrl}
                  variant={variant}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
