'use client';

import {
  Wallet,
  Clock,
  CheckCircle2,
  XCircle,
  RotateCcw,
  RefreshCw,
  Search,
  PlusCircle,
  FileCode2,
  Download,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export type FinanceTab =
  | 'WITHDRAWALS_PENDING'
  | 'WITHDRAWALS_HISTORY'
  | 'TRANSACTIONS'
  | 'WEBHOOKS'
  | 'REFUNDS';

interface AdminFinanceHeaderBarProps {
  activeTab: FinanceTab;
  onTabChange: (tab: FinanceTab) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  onOpenAdjustmentModal: () => void;
  onExportCsv: () => void;
  pendingCount: number;
}

export function AdminFinanceHeaderBar({
  activeTab,
  onTabChange,
  searchQuery,
  onSearchChange,
  onRefresh,
  isRefreshing,
  onOpenAdjustmentModal,
  onExportCsv,
  pendingCount,
}: AdminFinanceHeaderBarProps) {
  return (
    <div className="space-y-4">
      {/* Action Header & Title */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            Ledger Financier & Retraits
          </h1>
          <p className="text-xs text-foreground-muted">
            Supervision des demandes de virement, journal comptable du wallet et logs des webhooks de paiement.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onOpenAdjustmentModal}
            className="inline-flex h-9 items-center gap-2 rounded-pill bg-forest-700 px-4 text-xs font-semibold text-neutral-0 shadow-2xs hover:bg-forest-800 transition-colors"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Ajustement Manuel Wallet</span>
          </button>

          <button
            type="button"
            onClick={onExportCsv}
            className="inline-flex h-9 items-center gap-2 rounded-pill border border-border bg-background-card px-4 text-xs font-semibold text-foreground hover:bg-background-alt transition-colors"
          >
            <Download className="h-4 w-4 text-foreground-muted" />
            <span>Exporter CSV</span>
          </button>

          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="inline-flex h-9 items-center gap-2 rounded-pill border border-border bg-background-card px-4 text-xs font-semibold text-foreground transition-colors hover:bg-background-alt disabled:opacity-50"
          >
            <RefreshCw className={cn('h-3.5 w-3.5', isRefreshing && 'animate-spin')} />
            <span>Rafraîchir</span>
          </button>
        </div>
      </div>

      {/* Onglets de Navigation Financière */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-2">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          <button
            type="button"
            onClick={() => onTabChange('WITHDRAWALS_PENDING')}
            className={cn(
              'inline-flex shrink-0 items-center gap-2 rounded-pill border px-3.5 py-1.5 text-xs font-semibold transition-all',
              activeTab === 'WITHDRAWALS_PENDING'
                ? 'border-warning-600 bg-warning-50 text-warning-900 shadow-2xs font-bold'
                : 'border-border bg-background-card text-foreground-muted hover:bg-background-alt hover:text-foreground',
            )}
          >
            <Clock className="h-3.5 w-3.5 text-warning-700" />
            <span>Retraits à Valider</span>
            {pendingCount > 0 && (
              <span className="rounded-pill bg-warning-700 px-2 py-0.5 text-[0.625rem] font-black text-neutral-0">
                {pendingCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => onTabChange('WITHDRAWALS_HISTORY')}
            className={cn(
              'inline-flex shrink-0 items-center gap-2 rounded-pill border px-3.5 py-1.5 text-xs font-semibold transition-all',
              activeTab === 'WITHDRAWALS_HISTORY'
                ? 'border-forest-600 bg-forest-50 text-forest-900 shadow-2xs font-bold'
                : 'border-border bg-background-card text-foreground-muted hover:bg-background-alt hover:text-foreground',
            )}
          >
            <CheckCircle2 className="h-3.5 w-3.5 text-forest-700" />
            <span>Historique des Retraits</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('TRANSACTIONS')}
            className={cn(
              'inline-flex shrink-0 items-center gap-2 rounded-pill border px-3.5 py-1.5 text-xs font-semibold transition-all',
              activeTab === 'TRANSACTIONS'
                ? 'border-forest-600 bg-forest-50 text-forest-900 shadow-2xs font-bold'
                : 'border-border bg-background-card text-foreground-muted hover:bg-background-alt hover:text-foreground',
            )}
          >
            <Wallet className="h-3.5 w-3.5 text-forest-700" />
            <span>Audit Mouvements Wallet</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('WEBHOOKS')}
            className={cn(
              'inline-flex shrink-0 items-center gap-2 rounded-pill border px-3.5 py-1.5 text-xs font-semibold transition-all',
              activeTab === 'WEBHOOKS'
                ? 'border-forest-600 bg-forest-50 text-forest-900 shadow-2xs font-bold'
                : 'border-border bg-background-card text-foreground-muted hover:bg-background-alt hover:text-foreground',
            )}
          >
            <FileCode2 className="h-3.5 w-3.5 text-forest-700" />
            <span>Logs Webhooks</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('REFUNDS')}
            className={cn(
              'inline-flex shrink-0 items-center gap-2 rounded-pill border px-3.5 py-1.5 text-xs font-semibold transition-all',
              activeTab === 'REFUNDS'
                ? 'border-forest-600 bg-forest-50 text-forest-900 shadow-2xs font-bold'
                : 'border-border bg-background-card text-foreground-muted hover:bg-background-alt hover:text-foreground',
            )}
          >
            <RotateCcw className="h-3.5 w-3.5 text-forest-700" />
            <span>Remboursements</span>
          </button>
        </div>

        {/* Recherche dynamique */}
        {(activeTab === 'TRANSACTIONS' || activeTab === 'WITHDRAWALS_PENDING' || activeTab === 'WITHDRAWALS_HISTORY') && (
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-foreground-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Chercher (nom, email, id)..."
              className="h-9 w-full rounded-pill border border-border bg-background-card pl-9 pr-4 text-xs text-foreground placeholder:text-foreground-muted focus:border-forest-600 focus:outline-hidden"
            />
          </div>
        )}
      </div>
    </div>
  );
}
