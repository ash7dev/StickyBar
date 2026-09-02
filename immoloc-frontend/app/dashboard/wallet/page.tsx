'use client';

import { useWallet } from '@/features/wallet/hooks/use-wallet';
import { WalletHeader } from '@/features/wallet/components/WalletHeader';
import { WalletBalanceCard, WalletBalanceCardSkeleton } from '@/features/wallet/components/WalletBalanceCard';
import { DebtWarningBanner } from '@/features/wallet/components/DebtWarningBanner';
import { WalletHistoryCard } from '@/features/wallet/components/WalletHistoryCard';
import { WalletWithdrawalCard } from '@/features/wallet/components/WalletWithdrawalCard';
import { AskAssistantButton } from '@/components/assistant/AskAssistantButton';

export default function WalletPage() {
  const { data, isLoading } = useWallet();

  return (
    <div className="space-y-6 pb-12">
      {/* Header de la page */}
      <WalletHeader />

      {/* Carte de solde du portefeuille */}
      <div>
        {isLoading || !data ? (
          <WalletBalanceCardSkeleton />
        ) : (
          <WalletBalanceCard
            soldeDisponible={Number(data.soldeDisponible)}
            soldeProprietaire={data.soldeProprietaire !== undefined ? Number(data.soldeProprietaire) : Number(data.soldeDisponible)}
            soldeLocataire={Number(data.soldeLocataire || 0)}
            dettePenalites={Number(data.dettePenalites)}
          />
        )}
      </div>

      {/* Bannière d'avertissement si dette présente */}
      {!isLoading && data && Number(data.dettePenalites) > 0 && (
        <DebtWarningBanner dettePenalites={Number(data.dettePenalites)} />
      )}

      {/* Disposition principale : Formulaire de retrait + Historique */}
      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[1fr_400px]">
        <div className="order-2 lg:order-1 min-w-0">
          <WalletHistoryCard transactions={data?.transactions} isLoading={isLoading} />
        </div>

        <div className="order-1 lg:order-2 min-w-0 space-y-4">
          <WalletWithdrawalCard
            soldeDisponible={data ? (data.soldeProprietaire !== undefined ? Number(data.soldeProprietaire) : Number(data.soldeDisponible)) : 0}
            isLoading={isLoading}
          />

          <div className="rounded-card border border-border bg-background-card p-4 space-y-2 text-center">
            <p className="text-xs text-foreground-muted">
              Une question sur les retraits Wave / Orange Money ou un virement ?
            </p>
            <AskAssistantButton
              label="Question sur mon portefeuille"
              subject="Question sur les retraits & paiements mobile"
              category="PAIEMENT"
              variant="outline"
              size="sm"
              className="w-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
