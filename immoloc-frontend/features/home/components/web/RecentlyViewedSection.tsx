'use client';

import Image from 'next/image';
import Link from 'next/link';
import { History, MapPin, Trash2, ArrowRight, Building2 } from 'lucide-react';
import { useRecentlyViewed } from '@/lib/hooks/useRecentlyViewed';
import { TenantPriceDisplay } from '@/components/ui/TenantPriceDisplay';
import { FavoriteButton } from '@/components/ui/FavoriteButton';

const money = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });

export function RecentlyViewedSection() {
  const { recentlyViewed, clearRecentlyViewed, isLoaded } = useRecentlyViewed();

  if (!isLoaded || recentlyViewed.length === 0) {
    return null;
  }

  return (
    <section className="relative py-12 bg-neutral-900/5 dark:bg-forest-950/40 border-y border-border/60 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* En-tête de section */}
        <div className="flex items-center justify-between gap-4 mb-6 sm:mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-forest-900 text-lime-300 flex items-center justify-center shrink-0 shadow-sm">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display text-lg sm:text-2xl font-bold text-foreground tracking-tight">
                Reprendre là où vous vous étiez arrêté
              </h2>
              <p className="text-xs sm:text-sm text-foreground-muted">
                Vos derniers logements consultés lors de votre visite
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={clearRecentlyViewed}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-foreground-muted hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all shrink-0"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Effacer l'historique</span>
          </button>
        </div>

        {/* Grille / Défilant mobile des annonces */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {recentlyViewed.map((item) => {
            const location = [item.quartier, item.ville].filter(Boolean).join(', ');
            return (
              <div
                key={item.id}
                className="group relative flex flex-col rounded-2xl sm:rounded-3xl bg-background-card border border-border overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                {/* Photo */}
                <div className="relative aspect-[16/10] w-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                  {item.photoUrl ? (
                    <Image
                      src={item.photoUrl}
                      alt={item.titre}
                      fill
                      sizes="(max-width: 768px) 100vw, 25vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-neutral-400">
                      <Building2 className="w-8 h-8" />
                    </div>
                  )}

                  <div className="absolute top-3 right-3 z-20">
                    <FavoriteButton listingId={item.id} size="sm" />
                  </div>

                  <div className="absolute bottom-2.5 left-2.5 z-10 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-sm text-[10px] font-black text-white uppercase tracking-wider">
                    {item.type}
                  </div>
                </div>

                {/* Info */}
                <div className="flex flex-col flex-1 p-4">
                  <div className="flex items-center gap-1 text-xs text-foreground-muted mb-1.5">
                    <MapPin className="w-3.5 h-3.5 text-forest-600 dark:text-lime-400 shrink-0" />
                    <span className="truncate font-semibold">{location || 'Sénégal'}</span>
                  </div>

                  <h3 className="text-sm font-bold text-foreground line-clamp-1 group-hover:text-forest-700 dark:group-hover:text-lime-400 transition-colors mb-3">
                    <Link href={`/explorer/${item.slug ?? item.id}`} className="after:absolute after:inset-0">
                      {item.titre}
                    </Link>
                  </h3>

                  <div className="mt-auto pt-2 border-t border-border/60 flex items-center justify-between">
                    <TenantPriceDisplay prixBase={item.prixBase} size="sm" reserveSpace={false} />
                    <span className="w-7 h-7 rounded-full bg-forest-50 dark:bg-forest-900 text-forest-700 dark:text-lime-300 flex items-center justify-center group-hover:bg-forest-900 group-hover:text-lime-300 transition-colors">
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}

export default RecentlyViewedSection;
