'use client';

import { useWallet } from '@/features/wallet/hooks/use-wallet';
import { WalletHeader } from '@/features/wallet/components/WalletHeader';
import { WalletBalanceCard, WalletBalanceCardSkeleton } from '@/features/wallet/components/WalletBalanceCard';
import { DebtWarningBanner } from '@/features/wallet/components/DebtWarningBanner';
import { WalletHistoryCard } from '@/features/wallet/components/WalletHistoryCard';
import { WalletWithdrawalCard } from '@/features/wallet/components/WalletWithdrawalCard';

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

        <div className="order-1 lg:order-2 min-w-0">
          <WalletWithdrawalCard
            soldeDisponible={data ? Number(data.soldeDisponible) : 0}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
}
