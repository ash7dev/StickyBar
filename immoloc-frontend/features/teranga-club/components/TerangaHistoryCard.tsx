'use client';

import { Clock, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import type { TerangaTransaction } from '@/lib/nestjs';
import { cn } from '@/lib/utils/cn';

interface Props {
  transactions: TerangaTransaction[];
}

export function TerangaHistoryCard({ transactions }: Props) {
  if (transactions.length === 0) {
    return (
      <section className="card p-6 text-center space-y-2">
        <Clock className="w-8 h-8 text-foreground-muted mx-auto" />
        <p className="font-semibold text-sm text-foreground">Aucune transaction pour le moment</p>
        <p className="text-xs text-foreground-muted">Vos futurs gains de Klef Coins apparaîtront ici.</p>
      </section>
    );
  }

  return (
    <section className="card p-6 sm:p-8 space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h2 className="font-display text-lg font-semibold text-foreground">
            Historique des Klef Coins
          </h2>
          <p className="text-xs text-foreground-muted mt-0.5">
            Suivi détaillé des crédits et déductions enregistrés.
          </p>
        </div>
      </div>

      <div className="divide-y divide-border">
        {transactions.map((tx) => {
          const isCredit = tx.montantCoins > 0;
          return (
            <div key={tx.id} className="py-3.5 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'marker-box shrink-0',
                    isCredit
                      ? 'border border-forest-100 bg-forest-50 text-forest-700 dark:border-forest-800 dark:bg-forest-900/60 dark:text-forest-300'
                      : 'border border-warning-500/25 bg-warning-50 text-warning-700'
                  )}
                >
                  {isCredit ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />}
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">{tx.description}</p>
                  <p className="text-[11px] text-foreground-muted">
                    {new Date(tx.creeLe).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span
                  className={cn(
                    'font-display text-sm font-semibold tabular-nums',
                    isCredit ? 'text-forest-700 dark:text-lime-300' : 'text-warning-700'
                  )}
                >
                  {isCredit ? '+' : ''}{tx.montantCoins.toLocaleString('fr-FR')} Coins
                </span>
                <p className="text-[10px] text-foreground-muted">
                  Solde : {tx.soldeApres.toLocaleString('fr-FR')}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
