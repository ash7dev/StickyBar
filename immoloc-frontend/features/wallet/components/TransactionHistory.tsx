import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import type { WalletTransaction } from '@/lib/nestjs';
import { getTransactionMeta, formatFCFA } from '../lib/transaction-labels';

interface Props {
  transactions: WalletTransaction[];
}

function TransactionRow({ tx }: { tx: WalletTransaction }) {
  const meta = getTransactionMeta(tx.type, tx.sens);
  const isCredit = tx.sens === 'CREDIT';

  // Déterminer le mode de paiement (Acompte vs Totalité)
  const rawType = tx.reservation?.typePaiement?.toUpperCase() ?? '';
  const desc = tx.description ?? '';
  const isDeposit = rawType === 'DEPOSIT' || desc.toLowerCase().includes('acompte');
  const isFull = rawType === 'FULL' || desc.toLowerCase().includes('totalité') || desc.toLowerCase().includes('totalite');
  const isRentalCredit = tx.type === 'CREDIT_LOCATION';

  return (
    <div className="flex items-start gap-3 py-3.5 border-b border-border last:border-0 hover:bg-background-alt/60 -mx-2 px-3 rounded-inner transition-colors">
      {/* Icône sens */}
      <div className={`w-9 h-9 rounded-inner flex items-center justify-center shrink-0 border ${
        isCredit ? 'bg-success-50 border-success-500/30 dark:bg-success-700/20' : 'bg-error-50 border-error-500/30 dark:bg-error-700/20'
      }`}>
        {isCredit
          ? <ArrowDownLeft className="w-4 h-4 text-success-600 dark:text-success-500" />
          : <ArrowUpRight className="w-4 h-4 text-error-600 dark:text-error-500" />
        }
      </div>

      {/* Infos + Montant */}
      <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        {/* Infos */}
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <span className="text-sm font-semibold text-foreground">{meta.label}</span>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-pill border bg-background-alt border-border text-foreground-muted">
              {tx.type.replace('_', ' ')}
            </span>
            {isRentalCredit && isDeposit && (
              <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-pill border bg-warning-500/15 border-warning-500/30 text-warning-700 dark:text-warning-400">
                Acompte (DEPOSIT)
              </span>
            )}
            {isRentalCredit && isFull && (
              <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-pill border bg-success-500/15 border-success-500/30 text-success-700 dark:text-success-400">
                Totalité (FULL)
              </span>
            )}
          </div>
          {tx.description && (
            <p className="text-xs text-foreground-muted truncate">{tx.description}</p>
          )}
          {isRentalCredit && isDeposit && tx.reservation?.montantSoldeRestant ? (
            <p className="text-[11px] font-medium text-warning-700 dark:text-warning-400 mt-0.5">
              💡 Reste à percevoir sur place : {formatFCFA(Number(tx.reservation.montantSoldeRestant))} FCFA (espèces)
            </p>
          ) : null}
          <p className="text-[11px] text-foreground-faint mt-0.5">
            {new Date(tx.creeLe).toLocaleDateString('fr-FR', {
              day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
            })}
          </p>
        </div>

        {/* Montant */}
        <div className="text-left sm:text-right shrink-0">
          <p className={`text-sm sm:text-base font-bold tabular-nums ${isCredit ? 'text-success-600 dark:text-success-500' : 'text-error-600 dark:text-error-500'}`}>
            {meta.sign}{formatFCFA(tx.montant)}
          </p>
          <p className="text-[11px] text-foreground-muted mt-0.5 tabular-nums">
            Solde : {formatFCFA(tx.soldeApres)}
          </p>
        </div>
      </div>
    </div>
  );
}

function TransactionRowSkeleton() {
  return (
    <div className="flex items-center gap-3 py-3.5 border-b border-border animate-pulse">
      <div className="w-9 h-9 rounded-inner bg-background-alt shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-background-alt rounded-pill w-1/3" />
        <div className="h-3 bg-background-alt rounded-pill w-1/2" />
      </div>
      <div className="h-5 bg-background-alt rounded-pill w-24" />
    </div>
  );
}

export function TransactionHistory({ transactions }: Props) {
  if (transactions.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-sm font-semibold text-foreground-muted">Aucune transaction pour l'instant</p>
        <p className="text-xs text-foreground-faint mt-1">
          Les revenus de vos locations et vos retraits apparaîtront ici.
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border">
      {transactions.map((tx) => (
        <TransactionRow key={tx.id} tx={tx} />
      ))}
    </div>
  );
}

export function TransactionHistorySkeleton() {
  return (
    <div>
      {Array.from({ length: 4 }).map((_, i) => (
        <TransactionRowSkeleton key={i} />
      ))}
    </div>
  );
}
