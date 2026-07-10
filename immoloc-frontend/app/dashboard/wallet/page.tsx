'use client';

import { useWallet } from '@/features/wallet/hooks/use-wallet';
import { WalletBalanceCard, WalletBalanceCardSkeleton } from '@/features/wallet/components/WalletBalanceCard';
import { DebtWarningBanner } from '@/features/wallet/components/DebtWarningBanner';
import { WalletHistoryCard } from '@/features/wallet/components/WalletHistoryCard';
import { WalletWithdrawalCard } from '@/features/wallet/components/WalletWithdrawalCard';

export default function WalletPage() {
  const { data, isLoading } = useWallet();

  return (
    <div className="space-y-6 pb-10">
      {/* WalletBalanceCard masqué en mobile, visible desktop */}
      <div className="hidden sm:block">
        {isLoading || !data ? (
          <WalletBalanceCardSkeleton />
        ) : (
          <WalletBalanceCard
            soldeDisponible={Number(data.soldeDisponible)}
            dettePenalites={Number(data.dettePenalites)}
          />
        )}
      </div>

      {!isLoading && data && Number(data.dettePenalites) > 0 && (
        <DebtWarningBanner dettePenalites={Number(data.dettePenalites)} />
      )}

      {/* Desktop: HistoryCard (gauche) + WithdrawalCard (droite 420px) */}
      {/* Mobile: WithdrawalCard en haut, HistoryCard en bas */}
      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[1fr_420px]">
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
