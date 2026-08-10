'use client';

import { Lock, Wallet, PiggyBank, Landmark, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface Props {
  stats?: {
    gmv?: number;
    commissions?: number;
    payoutsNet?: number;
    /* ⚠️ À faire calculer par l'API sur les réservations PAID, CONFIRMED et
       CHECKED_IN. Le composant le déduisait par `gmv - payouts - commissions`,
       ce qui ne tient plus dès qu'une réservation est remboursée : l'argent
       sort sans être versé ni commissionné, et reste compté comme séquestré.
       Sur des fonds appartenant à des tiers, l'estimation n'est pas une
       option. */
    escrowActuel?: number;
  };
  isLoading?: boolean;
}

const fcfa = (n?: number) =>
  new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(Number(n) || 0);

export function AdminFinancialFlowWidget({ stats, isLoading = false }: Props) {
  if (isLoading) {
    return <div className="h-60 animate-pulse rounded-card border border-border bg-background-alt" />;
  }

  const gmv = Number(stats?.gmv) || 0;
  const commissions = Number(stats?.commissions) || 0;
  const payouts = Number(stats?.payoutsNet) || 0;

  const escrowFourni = stats?.escrowActuel !== undefined;
  const escrow = escrowFourni ? Number(stats.escrowActuel) || 0 : gmv - payouts - commissions;
  /* Une valeur négative signale une incohérence comptable réelle : la masquer
     avec Math.max(0) fait disparaître exactement le signal qu'un admin doit
     voir. */
  const incoherent = !escrowFourni && escrow < 0;

  const flows = [
    {
      key: 'escrow',
      title: 'Sous séquestre',
      amount: escrow,
      subtext: 'Fonds bloqués, en attente de remise des clés',
      icon: Lock,
      tone: 'border-gold-200 bg-gold-50 text-gold-700',
      accent: 'text-gold-700',
      warning: incoherent,
    },
    {
      key: 'payouts',
      title: 'Versé aux hôtes',
      amount: payouts,
      subtext: 'Wave et Orange Money, cumulé',
      icon: Wallet,
      tone: 'border-forest-100 bg-forest-50 text-forest-700',
      accent: 'text-foreground',
    },
    {
      key: 'commissions',
      title: 'Commissions Klef',
      amount: commissions,
      subtext: 'Revenus de la plateforme, cumulé',
      icon: PiggyBank,
      tone: 'border-forest-100 bg-forest-50 text-forest-700',
      accent: 'text-foreground',
    },
  ];

  /* Part de chaque flux dans le volume brut : trois montants alignés sans
     échelle ne se comparaient pas. */
  const part = (n: number) => (gmv > 0 ? Math.max(0, (n / gmv) * 100) : 0);

  return (
    <section className="space-y-4 rounded-card border border-border bg-background-card p-5 shadow-sm sm:p-6">

      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-inner border border-forest-100 bg-forest-50 text-forest-700">
            <Landmark className="h-4 w-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 className="font-display text-base font-semibold text-foreground">
              Flux financiers
            </h2>
            <p className="text-xs text-foreground-muted">
              Séquestre, versements et commissions
            </p>
          </div>
        </div>

        {/* « Sécurisé par Webhooks » : un détail d'implémentation présenté
           comme un label de confiance, sur un écran interne où il n'a aucun
           destinataire. Remplacé par le chiffre qui manquait. */}
        <p className="shrink-0 text-right">
          <span className="block text-xs uppercase tracking-wider text-foreground-muted">
            Volume brut
          </span>
          <span className="font-display text-base font-semibold tabular-nums text-foreground">
            {fcfa(gmv)} FCFA
          </span>
        </p>
      </header>

      {/* Barre de répartition : donne d'un coup d'œil ce que les trois cartes
         demandaient de calculer mentalement. */}
      {gmv > 0 && !incoherent && (
        <div className="space-y-1.5">
          <div
            role="img"
            aria-label={`Répartition du volume brut : ${Math.round(part(escrow))} % en séquestre, ${Math.round(part(payouts))} % versé, ${Math.round(part(commissions))} % de commission`}
            className="flex h-2.5 w-full overflow-hidden rounded-pill bg-background-alt"
          >
            <span className="bg-gold-400 transition-[width] duration-500" style={{ width: `${part(escrow)}%` }} />
            <span className="bg-forest-600 transition-[width] duration-500" style={{ width: `${part(payouts)}%` }} />
            <span className="bg-forest-400 transition-[width] duration-500" style={{ width: `${part(commissions)}%` }} />
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs text-foreground-muted">
            <span className="flex items-center gap-1.5">
              <span aria-hidden="true" className="h-2 w-2 rounded-[2px] bg-gold-400" />
              Séquestre
            </span>
            <span className="flex items-center gap-1.5">
              <span aria-hidden="true" className="h-2 w-2 rounded-[2px] bg-forest-600" />
              Versé
            </span>
            <span className="flex items-center gap-1.5">
              <span aria-hidden="true" className="h-2 w-2 rounded-[2px] bg-forest-400" />
              Commissions
            </span>
          </div>
        </div>
      )}

      {incoherent && (
        <div role="alert" className="flex items-start gap-2.5 rounded-inner border border-error-500/20 bg-error-50 p-3.5">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-error-600" aria-hidden="true" />
          <p className="text-xs leading-relaxed text-error-700">
            Le séquestre calculé est négatif : les versements et commissions dépassent le volume
            brut. Vérifiez les remboursements et les annulations.
          </p>
        </div>
      )}

      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {flows.map(({ key, title, amount, subtext, icon: Icon, tone, accent, warning }) => (
          <div
            key={key}
            className={cn(
              'space-y-3 rounded-inner border p-4',
              warning ? 'border-error-500/25 bg-error-50' : 'border-border bg-background-alt',
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-inner border', tone)}>
                <Icon className="h-4 w-4" aria-hidden="true" />
              </span>
              {gmv > 0 && !warning && (
                <span className="text-xs tabular-nums text-foreground-muted">
                  {part(amount).toFixed(0)} %
                </span>
              )}
            </div>

            <div className="min-w-0">
              <dt className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
                {title}
              </dt>
              <dd className={cn('mt-1 font-display text-lg font-semibold tabular-nums', accent)}>
                {fcfa(amount)} <span className="text-sm font-normal text-foreground-muted">FCFA</span>
              </dd>
              <p className="mt-1 text-xs leading-relaxed text-foreground-muted">{subtext}</p>
            </div>
          </div>
        ))}
      </dl>
    </section>
  );
}