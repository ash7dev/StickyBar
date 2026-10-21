'use client';

import { useState } from 'react';
import type { TransactionType } from '@/lib/nestjs';
import { formatFCFA, getTransactionMeta } from '@/features/wallet/lib/transaction-labels';
import { cn } from '@/lib/utils/cn';
import { useOwnerTransactions } from '../hooks/use-owner-revenue';

const FILTERS: Array<{ label: string; type: TransactionType | null }> = [
  { label: 'Toutes', type: null },
  { label: 'Revenus', type: 'CREDIT_LOCATION' },
  { label: 'Retraits', type: 'DEBIT_RETRAIT' },
  { label: 'Pénalités', type: 'DEBIT_PENALITE' },
  { label: 'Remboursements', type: 'REMBOURSEMENT' },
];

const dateFormatter = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });

/** Historique complet du wallet, filtrable, chargé page par page. */
export function TransactionsCard() {
  const [type, setType] = useState<TransactionType | null>(null);
  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage } = useOwnerTransactions(type);
  const items = data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <section
      id="transactions"
      aria-labelledby="revenue-transactions"
      className="flex scroll-mt-28 flex-col gap-4 rounded-[28px] border border-border/70 bg-background-card p-6"
    >
      <div className="flex flex-wrap items-center gap-3">
        <h2 id="revenue-transactions" className="mr-2 text-[15px] font-bold text-foreground">
          Transactions
        </h2>
        <div role="group" aria-label="Filtrer par type" className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => {
            const active = f.type === type;
            return (
              <button
                key={f.label}
                type="button"
                aria-pressed={active}
                onClick={() => setType(f.type)}
                className={cn(
                  'rounded-pill border px-3 py-1.5 text-xs font-semibold transition-colors',
                  active ? 'border-forest-600 bg-forest-600 text-white' : 'border-border text-foreground hover:border-border-hover',
                )}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {isLoading ? (
        <div className="h-40 animate-pulse rounded-2xl bg-background-alt" aria-busy="true" />
      ) : isError ? (
        <p role="alert" className="text-sm text-error-700">Impossible de charger les transactions.</p>
      ) : items.length === 0 ? (
        <p className="py-6 text-center text-sm text-foreground-muted">Aucune transaction pour ce filtre.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="text-left text-[11px] text-foreground-muted">
                <th scope="col" className="pb-2.5 font-semibold">DATE</th>
                <th scope="col" className="pb-2.5 font-semibold">OPÉRATION</th>
                <th scope="col" className="pb-2.5 text-right font-semibold">MONTANT</th>
                <th scope="col" className="pb-2.5 text-right font-semibold">SOLDE</th>
              </tr>
            </thead>
            <tbody>
              {items.map((t) => {
                const meta = getTransactionMeta(t.type, t.sens);
                return (
                  <tr key={t.id} className={cn('border-t border-border', t.isTrace && 'text-foreground-muted')}>
                    <td className="whitespace-nowrap py-3.5 pr-3 text-foreground-muted">{dateFormatter.format(new Date(t.creeLe))}</td>
                    <td className="py-3.5 pr-3">
                      <span className="font-semibold">{t.isTrace ? 'Retrait confirmé' : meta.label}</span>
                      {t.description && <span className="block max-w-md truncate text-xs text-foreground-muted">{t.description}</span>}
                    </td>
                    <td className="whitespace-nowrap py-3.5 text-right font-bold tabular-nums">
                      {t.isTrace ? (
                        // Trace de validation : le montant a déjà été débité à la demande
                        <span className="text-xs font-semibold text-foreground-muted">déjà débité</span>
                      ) : (
                        <span className={meta.sign === '+' ? 'text-success-700' : 'text-foreground'}>
                          {meta.sign} {formatFCFA(t.montant)}
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap py-3.5 text-right tabular-nums text-foreground-muted">{formatFCFA(t.soldeApres)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {hasNextPage && (
        <button
          type="button"
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
          className="self-center rounded-pill border border-border px-5 py-2.5 text-[13px] font-semibold text-foreground transition-colors hover:bg-background-alt disabled:opacity-50"
        >
          {isFetchingNextPage ? 'Chargement…' : 'Voir plus'}
        </button>
      )}
    </section>
  );
}
