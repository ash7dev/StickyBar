import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import type { WalletTransaction } from '@/lib/nestjs';
import { getTransactionMeta, formatFCFA } from '../lib/transaction-labels';

interface Props {
  transactions: WalletTransaction[];
}

function TransactionRow({ tx }: { tx: WalletTransaction }) {
  const meta = getTransactionMeta(tx.type, tx.sens);
  const isCredit = tx.sens === 'CREDIT';

  return (
    <div className="flex items-start gap-3 py-3 border-b border-border last:border-0 group/row hover:bg-background-alt -mx-2 px-2 rounded-xl transition-colors">
      {/* Icône sens */}
      <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center flex-shrink-0 border ${
        isCredit ? 'bg-success-50 border-success-200' : 'bg-error-50 border-error-200'
      }`}>
        {isCredit
          ? <ArrowDownLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-success-600" />
          : <ArrowUpRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-error-600" />
        }
      </div>

      {/* Infos + Montant */}
      <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
        {/* Infos */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <span className="text-xs sm:text-sm font-bold text-foreground">{meta.label}</span>
            <span className={`hidden sm:inline text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${meta.bgClass}`}>
              {tx.type.replace('_', ' ')}
            </span>
          </div>
          {tx.description && (
            <p className="text-[11px] sm:text-xs font-medium text-foreground-muted truncate">{tx.description}</p>
          )}
          <p className="text-[10px] sm:text-xs font-medium text-foreground-muted/70 mt-0.5">
            {new Date(tx.creeLe).toLocaleDateString('fr-FR', {
              day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
            })}
          </p>
        </div>

        {/* Montant */}
        <div className="text-left sm:text-right flex-shrink-0">
          <p className={`text-sm sm:text-base font-black ${isCredit ? 'text-success-600' : 'text-error-600'}`}>
            {meta.sign}{formatFCFA(tx.montant)}
          </p>
          <p className="text-[10px] font-medium text-foreground-muted mt-0.5">
            Solde : {formatFCFA(tx.soldeApres)}
          </p>
        </div>
      </div>
    </div>
  );
}

function TransactionRowSkeleton() {
  return (
    <div className="flex items-center gap-4 py-4 border-b border-border animate-pulse">
      <div className="w-9 h-9 rounded-xl bg-background-alt flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 bg-background-alt rounded-full w-1/3" />
        <div className="h-3 bg-background-alt rounded-full w-1/2" />
      </div>
      <div className="h-4 bg-background-alt rounded-full w-24" />
    </div>
  );
}

export function TransactionHistory({ transactions }: Props) {
  if (transactions.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-sm font-bold text-foreground-muted">Aucune transaction pour l'instant</p>
        <p className="text-xs font-medium text-foreground-muted/70 mt-1">
          Les revenus de vos locations apparaîtront ici.
        </p>
      </div>
    );
  }

  return (
    <div>
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
