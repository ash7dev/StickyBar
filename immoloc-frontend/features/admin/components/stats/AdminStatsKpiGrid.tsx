'use client';

import type { ComponentType } from 'react';
import {
  AlertTriangle, Percent, Receipt, ShieldAlert, ShoppingBag, TrendingUp, Wallet,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface SummaryData {
  netKlefRevenue: number;
  commissionsTotal: number;
  penaltiesTotal: number;
  totalGmv: number;
  hostPayoutsTotal: number;
  reservationCount: number;
}

interface AdminStatsKpiGridProps {
  summary?: SummaryData;
  isLoading: boolean;
}

/* `null` → « — », jamais « 0 FCFA ». Sur un tableau de bord financier, un zéro
   affiché à la place d'une donnée absente se lit comme un résultat nul.
   `Intl` en style currency XOF rendait « 12 345 F CFA » ; ailleurs c'est
   « 12 345 FCFA ». */
const fmt = (n?: number | null) =>
  n == null || Number.isNaN(Number(n))
    ? '—'
    : `${new Intl.NumberFormat('fr-FR').format(Math.round(Number(n)))} FCFA`;

const pct = (part?: number, total?: number) => {
  const p = Number(part);
  const t = Number(total);
  if (!Number.isFinite(p) || !Number.isFinite(t) || t <= 0) return null;
  return `${((p / t) * 100).toFixed(1).replace('.', ',')} %`;
};

interface Kpi {
  cle: string;
  titre: string;
  icon: ComponentType<{ className?: string }>;
  montant?: number;
  note: string;
  accent?: boolean;
}

export function AdminStatsKpiGrid({ summary, isLoading }: AdminStatsKpiGridProps) {
  /* `summary?.x ?? 0` transformait une absence de réponse en résultat nul.
     Les valeurs restent `undefined` et l'écran affiche « — ». */
  const gmv = summary?.totalGmv;
  const nbSejours = summary?.reservationCount;
  const reverseHotes = summary?.hostPayoutsTotal;
  const commissions = summary?.commissionsTotal;
  const penalites = summary?.penaltiesTotal;
  const netKlef = summary?.netKlefRevenue;

  const panierMoyen =
    gmv != null && nbSejours != null && nbSejours > 0 ? Math.round(gmv / nbSejours) : undefined;

  /* Les libellés annonçaient « Commissions (7%) » et « Reversé Hôtes (93%) »
     en dur. Le taux varie, et le ×1,07 du prix public est une MAJORATION —
     pas la commission. Le taux affiché est celui que produisent les chiffres. */
  const tauxCommission = pct(commissions, gmv);
  const tauxHotes = pct(reverseHotes, gmv);

  /* netKlef doit valoir commissions + pénalités. Rien ne le vérifiait. */
  const ecart =
    netKlef != null && commissions != null && penalites != null
      ? Math.abs(netKlef - commissions - penalites)
      : 0;
  const incoherent = ecart > 1;

  const kpis: Kpi[] = [
    {
      cle: 'net',
      titre: 'Revenu net Klef',
      icon: TrendingUp,
      montant: netKlef,
      note: 'Commissions et pénalités',
      accent: true,
    },
    {
      cle: 'gmv',
      titre: 'Volume brut',
      icon: Receipt,
      montant: gmv,
      note:
        nbSejours != null
          ? `Sur ${nbSejours} séjour${nbSejours > 1 ? 's' : ''}`
          : 'Nombre de séjours indisponible',
    },
    {
      cle: 'hotes',
      titre: 'Reversé aux hôtes',
      icon: Wallet,
      montant: reverseHotes,
      /* « 100% garanti et versé » n'était vérifié par rien : la carte
         l'affirmait quel que soit l'état réel des versements. */
      note: tauxHotes ? `${tauxHotes} du volume brut` : 'Part du volume brut indisponible',
    },
    {
      cle: 'panier',
      titre: 'Panier moyen',
      icon: ShoppingBag,
      montant: panierMoyen,
      note: 'Par séjour',
    },
    {
      cle: 'commissions',
      titre: 'Commissions',
      icon: Percent,
      montant: commissions,
      note: tauxCommission ? `${tauxCommission} du volume brut` : 'Frais de service',
    },
    {
      cle: 'penalites',
      titre: 'Pénalités retenues',
      icon: ShieldAlert,
      montant: penalites,
      note: 'Arbitrages et annulations',
    },
  ];

  return (
    <div className="space-y-3">
      {incoherent && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-inner bg-error-50 px-3.5 py-2.5 text-xs text-error-700"
        >
          <AlertTriangle className="mt-px h-4 w-4 shrink-0" aria-hidden />
          Le revenu net ne correspond pas à la somme des commissions et des pénalités (écart de{' '}
          {fmt(ecart)}). Vérifier l’agrégation avant de communiquer ces chiffres.
        </p>
      )}

      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {kpis.map(({ cle, titre, icon: Icon, montant, note, accent }) => (
          <div
            key={cle}
            className={cn(
              'space-y-2 rounded-card border p-5 shadow-xs',
              accent ? 'border-forest-100 bg-forest-50' : 'border-border bg-background-card',
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <dt className="eyebrow text-[0.6875rem]">{titre}</dt>
              <span
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-inner',
                  accent
                    ? 'bg-forest-600 text-neutral-0'
                    : 'border border-border bg-background-alt text-foreground-muted',
                )}
              >
                <Icon className="h-4 w-4" aria-hidden />
              </span>
            </div>

            <dd>
              {/* « ... » comme état de chargement laissait la carte à sa
                  hauteur finale sans rien dire ; un fantôme le fait mieux. */}
              {isLoading ? (
                <span className="block h-7 w-24 animate-pulse rounded-pill bg-background-alt" />
              ) : (
                <p
                  className={cn(
                    'font-display text-xl font-semibold tabular-nums',
                    montant == null ? 'text-foreground-muted' : 'text-foreground',
                  )}
                >
                  {fmt(montant)}
                </p>
              )}
              <p className="mt-1 text-xs text-foreground-muted">{note}</p>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}