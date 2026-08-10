'use client';

import { useMemo } from 'react';
import { Clock, ArrowUpRight, ArrowDownLeft, Coins } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { TerangaTransaction } from '@/lib/nestjs';

interface Props {
  transactions: TerangaTransaction[];
}

const nombre = (n?: number) => new Intl.NumberFormat('fr-FR').format(Math.round(Number(n) || 0));

function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export function TerangaHistoryCard({ transactions }: Props) {
  /* Aucun cumul n'était affiché : l'utilisateur voyait une liste de lignes
     sans jamais savoir combien il avait gagné ou dépensé au total. */
  const { gagnes, depenses } = useMemo(() => {
    return transactions.reduce(
      (acc, tx) => {
        const m = Number(tx.montantCoins) || 0;
        if (m > 0) acc.gagnes += m;
        else acc.depenses += Math.abs(m);
        return acc;
      },
      { gagnes: 0, depenses: 0 },
    );
  }, [transactions]);

  if (transactions.length === 0) {
    return (
      <section className="card space-y-2 p-6 text-center">
        <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-pill border border-border bg-background-alt text-foreground-muted">
          <Clock className="h-5 w-5" aria-hidden="true" />
        </span>
        <p className="text-sm font-semibold text-foreground">Aucune transaction</p>
        <p className="text-xs text-foreground-muted">
          Vos gains de Klef Coins apparaîtront ici.
        </p>
      </section>
    );
  }

  return (
    <section className="card space-y-6 p-6 sm:p-8">

      <header className="space-y-4 border-b border-border pb-4">
        <div>
          <h2 className="font-display text-lg font-semibold text-foreground">
            Historique des Klef Coins
          </h2>
          <p className="mt-0.5 text-xs text-foreground-muted">
            Crédits et déductions enregistrés sur votre compte.
          </p>
        </div>

        <dl className="grid grid-cols-2 gap-3">
          <div className="rounded-inner border border-gold-200 bg-gold-50 p-3">
            <dt className="text-xs font-semibold uppercase tracking-wider text-gold-700">
              Gagnés
            </dt>
            <dd className="mt-0.5 font-display text-base font-semibold tabular-nums text-gold-700">
              +{nombre(gagnes)}
            </dd>
          </div>
          <div className="rounded-inner border border-border bg-background-alt p-3">
            <dt className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
              Dépensés
            </dt>
            <dd className="mt-0.5 font-display text-base font-semibold tabular-nums text-foreground">
              −{nombre(depenses)}
            </dd>
          </div>
        </dl>
      </header>

      {/* Sur un compte actif, la liste devenait interminable sans jamais
         être bornée. */}
      <ul className="no-scrollbar max-h-[28rem] divide-y divide-border overflow-y-auto">
        {transactions.map((tx) => {
          const montant = Number(tx.montantCoins) || 0;
          const credit = montant > 0;
          /* Flèches inversées : la convention est entrante pour ce qui
             arrive, sortante pour ce qui part. */
          const Icon = credit ? ArrowDownLeft : ArrowUpRight;

          return (
            <li
              key={tx.id}
              className="flex items-center justify-between gap-4 py-3.5 first:pt-0 last:pb-0"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className={cn(
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-inner border',
                  credit
                    ? 'border-gold-200 bg-gold-50 text-gold-700'
                    : 'border-border bg-background-alt text-foreground-muted',
                )}>
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>

                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {tx.description}
                  </p>
                  <p className="text-xs tabular-nums text-foreground-muted">
                    <time dateTime={tx.creeLe}>{formatDate(tx.creeLe)}</time>
                  </p>
                </div>
              </div>

              <div className="shrink-0 text-right">
                <p className={cn(
                  'font-display text-sm font-semibold tabular-nums',
                  credit ? 'text-gold-700' : 'text-foreground',
                )}>
                  {credit ? '+' : '−'}{nombre(Math.abs(montant))}
                </p>
                <p className="text-xs tabular-nums text-foreground-muted">
                  Solde : {nombre(tx.soldeApres)}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}