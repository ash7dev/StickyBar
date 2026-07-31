'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowRight, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { netHost } from '@/lib/dashboard/owner-tokens';

const nf = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });

interface Booking {
  totalLocataire: number;
  statut: string;
  /* Le regroupement se faisait sur le TITRE : deux annonces homonymes —
     « Studio Ngor », « Villa Saly » — fusionnaient en une seule ligne.
     L'identifiant est utilisé quand il est disponible. */
  logement: { id?: string; titre: string; ville?: string };
}

interface Props {
  bookings?: Booking[] | null;
  /** Nombre d'annonces publiées. Servait à rien dans la version précédente. */
  activeListings: number;
  isLoading?: boolean;
  limit?: number;
}

/* DISPUTED comptait dans le chiffre d'affaires alors que les fonds sont
   gelés et peuvent être remboursés. */
const COUNTED = new Set(['COMPLETED', 'CHECKED_IN', 'CONFIRMED', 'PAID']);

interface Stat { key: string; titre: string; ville?: string; revenue: number; nights: number }

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <section className="klef-rise flex h-full min-h-[22rem] flex-col rounded-card border border-border bg-background-card p-5 shadow-sm lg:p-6">
      {children}
    </section>
  );
}

export function PerformanceCard({ bookings, activeListings, isLoading = false, limit = 3 }: Props) {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setShown(true); return; }
    const t = setTimeout(() => setShown(true), 120);
    return () => clearTimeout(t);
  }, []);

  if (isLoading) {
    return (
      <Shell>
        <div className="flex-1 animate-pulse space-y-3" aria-hidden="true">
          <div className="h-10 w-48 rounded-inner bg-neutral-100" />
          {[0, 1, 2].map((i) => <div key={i} className="h-16 rounded-inner bg-neutral-100" />)}
        </div>
        <span className="sr-only" role="status">Chargement du classement</span>
      </Shell>
    );
  }

  const list = bookings ?? [];
  const map = new Map<string, Stat>();

  for (const b of list) {
    if (!COUNTED.has(b.statut)) continue;
    const key = b.logement.id ?? b.logement.titre;
    const cur = map.get(key) ?? { key, titre: b.logement.titre, ville: b.logement.ville, revenue: 0, nights: 0 };
    cur.revenue += netHost(Number(b.totalLocataire) || 0);
    cur.nights += 1;
    map.set(key, cur);
  }

  const ranked = [...map.values()].sort((a, b) => b.revenue - a.revenue);
  const top = ranked.slice(0, limit);
  const max = top[0]?.revenue ?? 0;

  /* Métrique honnête, calculée à partir des données présentes, et qui utilise
     enfin activeListings : combien d'annonces ont réellement rapporté. */
  const earning = ranked.length;
  const coverage = activeListings > 0 ? Math.round((earning / activeListings) * 100) : null;

  return (
    <Shell>
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3 sm:flex-nowrap">
        <div className="flex min-w-0 items-center gap-3">
          {/* Le squircle était en forest-950 à icône lime, ici et dans l'état
              vide : deux blocs sombres sur une carte claire. */}
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-inner bg-neutral-100 text-forest-700">
            <Trophy className="h-[1.125rem] w-[1.125rem]" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-[0.6875rem] uppercase tracking-[0.12em] text-foreground-faint">Performance</p>
            {/* « Classement {mois} » alors que le calcul portait sur toutes
                les réservations transmises, sans filtre de date. */}
            <h2 className="truncate font-display text-base font-semibold tracking-[-0.015em] text-forest-900">
              Vos biens les plus rentables
            </h2>
          </div>
        </div>

        {coverage !== null && earning > 0 && (
          <span className="inline-flex shrink-0 items-center rounded-pill bg-neutral-100 px-2.5 py-1 text-xs text-foreground-muted">
            <span className="font-semibold tabular-nums text-forest-900">{earning}</span>
            <span className="mx-1">/</span>
            <span className="tabular-nums">{activeListings}</span>
            <span className="ml-1.5">ont rapporté</span>
          </span>
        )}
      </header>

      <div className="flex-1">
        {top.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2.5 py-8 text-center">
            <span className="grid h-11 w-11 place-items-center rounded-inner bg-neutral-100 text-foreground-muted">
              <Trophy className="h-5 w-5" aria-hidden="true" />
            </span>
            <p className="text-sm font-medium text-forest-900">
              {activeListings === 0 ? 'Aucune annonce publiée' : 'Aucun revenu encore'}
            </p>
            <p className="max-w-[18rem] text-xs leading-relaxed text-foreground-muted">
              {activeListings === 0
                ? 'Publiez un bien pour commencer à recevoir des réservations.'
                : 'Le classement apparaîtra dès votre première réservation confirmée.'}
            </p>
            <Link
              href={activeListings === 0 ? '/dashboard/annonces/nouvelle' : '/ressources'}
              className="mt-2 inline-flex items-center gap-1.5 rounded-pill border border-border px-4 py-2 text-xs font-semibold text-forest-800 transition-colors duration-150 hover:bg-neutral-100"
            >
              {activeListings === 0 ? 'Publier un bien' : 'Conseils pour mieux louer'}
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>
        ) : (
          <ol className="space-y-2.5">
            {top.map((item, i) => {
              const first = i === 0;
              const pct = max > 0 ? Math.round((item.revenue / max) * 100) : 0;

              return (
                <li
                  key={item.key}
                  className={cn(
                    'rounded-inner border p-3.5',
                    // Le premier était en bg-forest-950 plein : un bloc noir
                    // dans une carte claire, pour une ligne de classement.
                    // La teinte lime suffit à distinguer la tête.
                    first ? 'border-lime-400/40 bg-lime-50' : 'border-border bg-background-alt',
                  )}
                >
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <span className="flex min-w-0 items-center gap-2.5">
                      <span className={cn(
                        'grid h-6 w-6 shrink-0 place-items-center rounded-pill font-mono text-xs tabular-nums',
                        first ? 'bg-lime-400 text-forest-800' : 'bg-background-card text-foreground-muted',
                      )}>
                        {i + 1}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-forest-900">{item.titre}</span>
                        {item.ville && (
                          <span className="block truncate text-xs text-foreground-muted">{item.ville}</span>
                        )}
                      </span>
                    </span>

                    <span className="shrink-0 text-right">
                      <span className="block text-sm font-semibold tabular-nums text-forest-900">
                        {nf.format(item.revenue)}
                      </span>
                      {/* nbLocations était calculé puis jamais affiché : le
                          nombre de séjours explique le chiffre d'affaires. */}
                      <span className="block text-[0.6875rem] text-foreground-muted tabular-nums">
                        {item.nights} séjour{item.nights > 1 ? 's' : ''}
                      </span>
                    </span>
                  </div>

                  <div className="h-1.5 overflow-hidden rounded-pill bg-neutral-200">
                    <div
                      className={cn('h-full rounded-pill', first ? 'bg-lime-500' : 'bg-forest-500')}
                      style={{
                        width: shown ? `${Math.max(pct, 4)}%` : '0%',
                        // transition-all duration-1000 animait tout, sur une
                        // durée absente de l'échelle du système.
                        transition: 'width 320ms cubic-bezier(0.22,1,0.36,1)',
                      }}
                    />
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>

      <div className="mt-4 border-t border-border pt-4">
        {ranked.length > limit && (
          <p className="mb-2 text-center text-xs text-foreground-muted">
            {ranked.length - limit} autre{ranked.length - limit > 1 ? 's' : ''} bien{ranked.length - limit > 1 ? 's' : ''} avec des revenus
          </p>
        )}
        <Link
          href="/dashboard/annonces"
          className="inline-flex w-full items-center justify-center gap-2 rounded-pill border border-border py-2.5 text-sm font-semibold text-forest-800 transition-colors duration-150 hover:bg-neutral-100"
        >
          Voir toutes mes annonces
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </div>
    </Shell>
  );
}