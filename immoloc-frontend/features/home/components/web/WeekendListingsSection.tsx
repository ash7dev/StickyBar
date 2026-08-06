'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CalendarDays, ArrowRight, Zap } from 'lucide-react';
import { listingsApi } from '@/lib/nestjs/listings.api';
import type { Listing } from '@/lib/nestjs/types';
import { ListingsSection } from './ListingsSection';

/** Date civile locale. `toISOString()` décale d'un jour hors UTC+0. */
const toLocalISODate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

interface WeekendInfo {
  dateDebut: string;
  dateFin: string;
  formattedRange: string;
}

function getUpcomingWeekend(): WeekendInfo {
  const today = new Date();
  const day = today.getDay(); // 0 = dimanche … 6 = samedi

  /* Corrigé : samedi (6) donnait `(5-6+7)%7 = 6`, soit vendredi prochain —
     le week-end en cours était sauté. Dimanche (0) renvoyait 5 jours.
     On vise désormais le week-end en cours du vendredi au dimanche, et on
     bascule sur le suivant à partir du dimanche soir. */
  let offset: number;
  if (day === 6) offset = -1;                       // samedi → vendredi d'hier
  else if (day === 0) offset = today.getHours() >= 18 ? 5 : -2; // dimanche
  else if (day === 5) offset = today.getHours() >= 18 ? 0 : 0;  // vendredi
  else offset = 5 - day;                            // lundi à jeudi

  const friday = new Date(today);
  friday.setDate(today.getDate() + offset);
  friday.setHours(0, 0, 0, 0);

  const sunday = new Date(friday);
  sunday.setDate(friday.getDate() + 2);

  const fmt = (d: Date) => d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });

  return {
    dateDebut: toLocalISODate(friday),
    dateFin: toLocalISODate(sunday),
    formattedRange: `Du ${fmt(friday)} au ${fmt(sunday)}`,
  };
}

export function WeekendListingsSection() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [weekend, setWeekend] = useState<WeekendInfo | null>(null);

  useEffect(() => {
    let cancelled = false;
    const info = getUpcomingWeekend();
    setWeekend(info);

    (async () => {
      try {
        const response = await listingsApi.search({
          dateDebut: info.dateDebut,
          dateFin: info.dateFin,
          limit: 12,
        });
        if (!cancelled) setListings(response.data ?? []);
      } catch (error) {
        console.error('[WeekendListings] Échec du chargement', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  if (loading || listings.length === 0 || !weekend) return null;

  const viewAllLink = `/explorer?arrivee=${weekend.dateDebut}&depart=${weekend.dateFin}`;

  return (
    <section className="mx-auto my-8 max-w-7xl px-4 sm:px-6">
      <div className="section-inverse relative overflow-hidden p-6 sm:p-8">

        {/* Un seul halo, dans le vert de la marque : le lime doit rester
            concentré sur le badge et le CTA, pas diffusé en fond. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-0 right-0 h-96 w-96 rounded-pill bg-forest-700/35 blur-3xl"
        />

        <div className="relative mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="min-w-0 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              {/* ★ L'urgence, en lime plein — c'est le message du bloc. */}
              <span className="inline-flex items-center gap-1 rounded-pill bg-action px-3 py-1 text-xs font-semibold uppercase tracking-wider text-on-action">
                <Zap className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
                Dernières dispos
              </span>

              {/* Le chip de dates était lui aussi en lime-300 : une info
                  passive n'a pas à porter le signal d'urgence. */}
              <span className="inline-flex items-center gap-1.5 rounded-pill border border-border-inverse bg-white/5 px-3 py-1 text-xs font-semibold text-on-inverse">
                <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                <time dateTime={weekend.dateDebut}>{weekend.formattedRange}</time>
              </span>
            </div>

            <h2 className="pt-1 font-display text-xl font-semibold tracking-tight text-on-inverse-display sm:text-2xl">
              Disponibles ce week-end
            </h2>
            <p className="text-sm text-on-inverse-muted">
              Réservez votre escapade de quelques jours au Sénégal.
            </p>
          </div>

          <Link href={viewAllLink} className="btn-action shrink-0 self-start text-sm sm:self-auto">
            Voir les logements
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        <div className="relative -mx-2 px-2">
          <ListingsSection title="" listings={listings} />
        </div>
      </div>
    </section>
  );
}

export default WeekendListingsSection;