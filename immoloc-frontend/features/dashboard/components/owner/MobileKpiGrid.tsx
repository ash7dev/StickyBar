'use client';

import Link from 'next/link';
import { ArrowUpRight, Building2, CalendarDays, Star, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface MobileKpiGridProps {
  stats: {
    revenue: number;
    totalBookings: number;
    activeListings: number;
    pendingConfirmations?: number;
    activeDisputes?: number;
    noteMoyenne?: number;
    totalAvis?: number;
  };
  /** Période couverte par `revenue`. Affichée telle quelle. */
  revenuePeriod?: string;
}

/*
  formatCompactFCFA maison :
    (n / 1_000).toFixed(0) arrondissait 1 500 en « 2k », soit 500 F de plus
    que la realite sur un montant d'argent.
    .toFixed(1).replace('.0','') produisait « 1.2M » avec un point decimal,
    alors que le reste de l'interface est en fr-FR.
  Intl fait les deux correctement.
*/
const compact = new Intl.NumberFormat('fr-FR', {
  notation: 'compact',
  maximumFractionDigits: 1,
});
const note1 = new Intl.NumberFormat('fr-FR', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

export function MobileKpiGrid({ stats, revenuePeriod = 'Cumul' }: MobileKpiGridProps) {
  const pending = stats.pendingConfirmations ?? 0;
  const avis = stats.totalAvis ?? 0;
  const hasNote = avis > 0 && typeof stats.noteMoyenne === 'number' && stats.noteMoyenne > 0;

  const kpis = [
    {
      id: 'bookings',
      href: pending > 0 ? '/dashboard/reservations?statut=PENDING' : '/dashboard/reservations',
      title: 'Réservations',
      value: String(stats.totalBookings),
      unit: stats.totalBookings > 1 ? 'séjours' : 'séjour',
      // « À jour ce mois-ci » etait une affirmation, pas une donnee.
      subtext: pending > 0 ? null : 'Aucune action en attente',
      icon: CalendarDays,
      // Une seule tuile porte une couleur, et seulement quand elle demande
      // une action. Le reste reste neutre.
      alert: pending > 0
        ? { label: `${pending} à confirmer`, cls: 'bg-warning-50 text-warning-700' }
        : null,
    },
    {
      id: 'listings',
      href: '/dashboard/annonces',
      title: 'Mes biens',
      value: String(stats.activeListings),
      unit: stats.activeListings > 1 ? 'publiés' : 'publié',
      subtext: 'En ligne sur Klef',
      icon: Building2,
      alert: null,
    },
    {
      id: 'revenue',
      href: '/dashboard/wallet',
      title: 'Revenus nets',
      value: compact.format(stats.revenue),
      unit: 'FCFA',
      subtext: revenuePeriod,
      icon: TrendingUp,
      alert: null,
    },
    {
      id: 'rating',
      href: '/dashboard/profil',
      title: 'Évaluation',
      // Sans avis, on n'invente pas une note : l'ancienne version affichait
      // 4,9 par defaut a un hote qui n'avait jamais recu de voyageur.
      value: hasNote ? note1.format(stats.noteMoyenne!) : '—',
      unit: hasNote ? '/ 5' : '',
      subtext: hasNote
        ? `${avis} avis`
        : 'Aucun avis pour l’instant',
      icon: Star,
      alert: null,
    },
  ] as const;

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between px-0.5">
        {/* .eyebrow definit deja les capitales et l'interlettrage : les
            classes qui suivaient ne faisaient que les reecrire, en poussant
            la graisse a 900. */}
        <h2 className="eyebrow">Synthèse d’activité</h2>
        {/* « En direct » etait une chaine statique : rien ne rafraichit ces
            chiffres en continu. */}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {kpis.map((kpi) => (
          <Link
            key={kpi.id}
            href={kpi.href}
            className={cn(
              'group flex flex-col justify-between rounded-card border bg-background-card p-4 shadow-xs',
              'transition-[box-shadow,transform] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]',
              // active:scale-98 n'existe pas dans l'echelle Tailwind (95, 100,
              // 105...). La classe ne produisait rien.
              'hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98] motion-reduce:transform-none',
              kpi.alert ? 'border-warning-500/30' : 'border-border',
            )}
          >
            <div className="mb-3 flex items-center justify-between">
              {/* Trois tuiles sur quatre portaient un carre forest-950 a icone
                  lime : dans une grille 2x2, ca fait trois blocs sombres pour
                  quatre cases. */}
              <span className={cn(
                'grid h-9 w-9 shrink-0 place-items-center rounded-inner transition-colors',
                kpi.alert
                  ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                  : 'bg-forest-950 text-lime-400 border border-forest-800 shadow-2xs group-hover:bg-forest-900',
              )}>
                <kpi.icon className={cn("h-4.5 w-4.5 stroke-[2.25px]", kpi.alert ? "text-amber-600" : "text-lime-400")} aria-hidden="true" />
              </span>
              <ArrowUpRight
                className="h-4 w-4 text-foreground-faint transition-colors group-hover:text-forest-600"
                aria-hidden="true"
              />
            </div>

            <div>
              <p className="text-[0.6875rem] uppercase tracking-[0.12em] text-foreground-faint">
                {kpi.title}
              </p>
              <p className="mt-1 flex flex-wrap items-baseline gap-1">
                <span className="text-2xl font-semibold tabular-nums tracking-[-0.02em] text-forest-900">
                  {kpi.value}
                </span>
                {kpi.unit && (
                  <span className="text-xs text-foreground-muted">{kpi.unit}</span>
                )}
              </p>
            </div>

            <div className="mt-3 border-t border-border pt-2.5">
              {kpi.alert ? (
                // Le nombre de reservations a confirmer est la seule
                // information actionnable de la grille. Elle etait noyee dans
                // le meme gris que « A jour ce mois-ci ».
                <span className={cn(
                  'inline-flex items-center gap-1.5 rounded-pill px-2 py-0.5 text-[0.6875rem] font-semibold',
                  kpi.alert.cls,
                )}>
                  <span className="h-1.5 w-1.5 rounded-pill bg-warning-500" />
                  {kpi.alert.label}
                </span>
              ) : (
                <span className="block truncate text-[0.6875rem] text-foreground-muted">
                  {kpi.subtext}
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}