'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CalendarDays, Sparkles, ArrowRight, Zap } from 'lucide-react';
import { listingsApi } from '@/lib/nestjs/listings.api';
import type { Listing } from '@/lib/nestjs/types';
import { ListingsSection } from './ListingsSection';

function getUpcomingWeekendDates(): { dateDebut: string; dateFin: string; formattedRange: string } {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0: Sun, 1: Mon, ..., 5: Fri, 6: Sat

  let daysUntilFriday = (5 - dayOfWeek + 7) % 7;
  // Si c'est déjà vendredi soir ou samedi, viser le week-end en cours
  if (dayOfWeek === 5 && today.getHours() >= 18) {
    daysUntilFriday = 7;
  }

  const friday = new Date(today);
  friday.setDate(today.getDate() + daysUntilFriday);

  const sunday = new Date(friday);
  sunday.setDate(friday.getDate() + 2);

  const dateDebut = friday.toISOString().split('T')[0];
  const dateFin = sunday.toISOString().split('T')[0];

  const fmt = (d: Date) =>
    d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });

  const formattedRange = `Du ${fmt(friday)} au ${fmt(sunday)}`;

  return { dateDebut, dateFin, formattedRange };
}

export function WeekendListingsSection() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [weekendInfo, setWeekendInfo] = useState<{ dateDebut: string; dateFin: string; formattedRange: string } | null>(null);

  useEffect(() => {
    const info = getUpcomingWeekendDates();
    setWeekendInfo(info);

    const fetchWeekendListings = async () => {
      try {
        const response = await listingsApi.search({
          dateDebut: info.dateDebut,
          dateFin: info.dateFin,
          limit: 12,
        });

        setListings(response.data || []);
      } catch (error) {
        console.error('[WeekendListingsSection] Failed to fetch weekend listings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWeekendListings();
  }, []);

  if (loading || listings.length === 0 || !weekendInfo) {
    return null;
  }

  const viewAllLink = `/explorer?arrivee=${weekendInfo.dateDebut}&depart=${weekendInfo.dateFin}`;

  return (
    <div className="my-8 max-w-7xl mx-auto px-4 sm:px-6">
      <div className="relative overflow-hidden section-inverse p-6 sm:p-8 border border-border-inverse-strong shadow-xl">
        
        {/* Lueurs d'arrière-plan avec tokens du design system */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-lime-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-forest-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header de section */}
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-pill bg-lime-400 text-forest-800 text-[11px] font-semibold uppercase tracking-wider shadow-xs">
                <Zap className="w-3.5 h-3.5 fill-forest-800" />
                Dernières dispo
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-pill bg-forest-900/90 text-lime-300 text-xs font-medium border border-forest-800">
                <CalendarDays className="w-3.5 h-3.5 text-lime-300" />
                {weekendInfo.formattedRange}
              </span>
            </div>

            <h2 className="font-display text-xl sm:text-2xl font-semibold tracking-tight text-white pt-1">
              Logements disponibles ce week-end
            </h2>
            <p className="text-xs sm:text-sm text-forest-200">
              Échappez-vous quelques jours : réservez instantanément votre escapade du week-end au Sénégal.
            </p>
          </div>

          <Link
            href={viewAllLink}
            className="btn-action text-xs px-5 py-2.5 shadow-sm active:scale-[0.98] inline-flex items-center gap-2 shrink-0 self-start sm:self-auto"
          >
            <span>Voir toutes les dispos ({listings.length})</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Grille / Défilant d'annonces */}
        <div className="relative z-10 -mx-2 px-2">
          <ListingsSection
            title=""
            listings={listings as any}
          />
        </div>

      </div>
    </div>
  );
}

export default WeekendListingsSection;
