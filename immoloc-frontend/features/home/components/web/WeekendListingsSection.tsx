'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { CalendarDays, ArrowRight, Zap, ChevronLeft, ChevronRight } from 'lucide-react';
import { listingsApi } from '@/lib/nestjs/listings.api';
import type { Listing } from '@/lib/nestjs/types';
import { ListingCard } from './ListingCard';

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

const WEEKEND_CACHE_KEY = 'klef_weekend_cache_v1';
const WEEKEND_CACHE_TS_KEY = 'klef_weekend_cache_ts_v1';
const FIFTEEN_MIN_MS = 15 * 60 * 1000;

export function WeekendListingsSection() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [weekend, setWeekend] = useState<WeekendInfo | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    const info = getUpcomingWeekend();
    setWeekend(info);

    let isFresh = false;
    try {
      const cached = localStorage.getItem(WEEKEND_CACHE_KEY);
      const cachedTs = localStorage.getItem(WEEKEND_CACHE_TS_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setListings(parsed);
          setLoading(false);
          if (cachedTs && Date.now() - Number(cachedTs) < FIFTEEN_MIN_MS) {
            isFresh = true;
          }
        }
      }
    } catch {}

    if (isFresh) return;

    (async () => {
      try {
        const response = await listingsApi.search({
          dateDebut: info.dateDebut,
          dateFin: info.dateFin,
          limit: 12,
        });
        if (!cancelled && response.data) {
          setListings(response.data);
          try {
            localStorage.setItem(WEEKEND_CACHE_KEY, JSON.stringify(response.data));
            localStorage.setItem(WEEKEND_CACHE_TS_KEY, Date.now().toString());
          } catch {}
        }
      } catch (error) {
        console.error('[WeekendListings] Échec du chargement', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  const handleScrollLeft = () => {
    scrollContainerRef.current?.scrollBy({ left: -340, behavior: 'smooth' });
  };

  const handleScrollRight = () => {
    scrollContainerRef.current?.scrollBy({ left: 340, behavior: 'smooth' });
  };

  if (loading || listings.length === 0 || !weekend) return null;

  const viewAllLink = `/explorer?arrivee=${weekend.dateDebut}&depart=${weekend.dateFin}`;

  return (
    <section className="mx-auto my-3 sm:my-8 max-w-7xl px-3 sm:px-6">
      <div className="section-inverse relative overflow-hidden p-4 sm:p-8">

        {/* Halo décoratif dans le vert de la marque */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-0 right-0 h-96 w-96 rounded-pill bg-forest-700/35 blur-3xl"
        />

        <div className="relative mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="min-w-0 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-pill bg-amber-400/20 text-amber-300 border border-amber-400/30 px-3 py-1 text-xs font-bold uppercase tracking-wider">
                <Zap className="h-3.5 w-3.5 fill-current text-amber-300" aria-hidden="true" />
                Dernières dispos
              </span>

              <span className="inline-flex items-center gap-1.5 rounded-pill border border-border-inverse bg-white/5 px-3 py-1 text-xs font-semibold text-on-inverse">
                <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                <time dateTime={weekend.dateDebut}>{weekend.formattedRange}</time>
              </span>
            </div>

            <h2 className="pt-1 font-display text-xl sm:text-2xl font-semibold tracking-tight text-on-inverse-display">
              Disponibles ce week-end
            </h2>
            <p className="text-sm text-on-inverse-muted">
              Réservez votre escapade de quelques jours au Sénégal.
            </p>
          </div>

          {/* Navigation carrousel desktop + Bouton CTA */}
          <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
            <div className="hidden sm:flex items-center gap-1.5 mr-1">
              <button
                type="button"
                onClick={handleScrollLeft}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-sm transition-all hover:bg-white/20 hover:border-white/40 active:scale-95 cursor-pointer"
                title="Précédent"
                aria-label="Défiler vers la gauche"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={handleScrollRight}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-sm transition-all hover:bg-white/20 hover:border-white/40 active:scale-95 cursor-pointer"
                title="Suivant"
                aria-label="Défiler vers la droite"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            <Link href={viewAllLink} className="btn-action shrink-0 text-xs sm:text-sm whitespace-nowrap">
              <span>Voir les logements</span>
              <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
            </Link>
          </div>
        </div>

        {/* Carrousel des logements avec Cartes en Verrerie sombre d'Élite */}
        <div className="relative -mx-2 px-2">
          <div
            ref={scrollContainerRef}
            className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 snap-x snap-mandatory"
          >
            {listings.map((item) => (
              <div
                key={item.id}
                className="flex-shrink-0 w-[280px] sm:w-[320px] snap-start"
              >
                <ListingCard
                  id={item.id}
                  slug={(item as { slug?: string }).slug}
                  titre={item.titre}
                  type={item.type}
                  sousType={item.sousType}
                  ville={item.ville}
                  quartier={item.quartier}
                  prixBase={Number(item.prixBase)}
                  note={item.note ? Number(item.note) : null}
                  totalSejours={item.totalSejours ?? 0}
                  photos={item.photos || []}
                  capaciteMax={item.capaciteMax}
                  nombreChambres={item.nombreChambres}
                  nombreSallesBain={item.nombreSallesBain}
                  nuitesMinimum={item.nuitesMinimum}
                  verifie={Boolean((item as { verifie?: boolean }).verifie)}
                  isInstantBooking={item.isInstantBooking}
                  derniereMinuteActive={item.derniereMinuteActive}
                  videoUrl={item.videoUrl}
                  variant="dark"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default WeekendListingsSection;