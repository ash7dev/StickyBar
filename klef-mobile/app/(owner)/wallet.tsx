import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { colors } from '../../shared/theme/tokens';
import { WalletData } from '../../features/wallet/types/wallet.types';
import { getMyWallet } from '../../features/wallet/services/wallet.service';
import { MobileWalletBalanceCard } from '../../features/wallet/components/MobileWalletBalanceCard';
import { MobileWalletTransactionsCard } from '../../features/wallet/components/MobileWalletTransactionsCard';
import { MobileWithdrawModal } from '../../features/wallet/components/MobileWithdrawModal';
import { OwnerWalletSkeleton } from '../../shared/components/layout/OwnerWalletSkeleton';

const WALLET_CACHE_KEY = 'klef_owner_wallet_cache_v1';

export default function OwnerWalletScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const [showWithdrawModal, setShowWithdrawModal] = useState<boolean>(false);
  const [cachedWallet, setCachedWallet] = useState<WalletData | null>(null);
  const [isCacheLoaded, setIsCacheLoaded] = useState(false);

  // ── 1. Hydratation Persistante Instantanée (0ms au démarrage à froid) ──
  useEffect(() => {
    AsyncStorage.getItem(WALLET_CACHE_KEY)
      .then((raw) => {
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed === 'object') {
              setCachedWallet(parsed);
            }
          } catch (e) {
            console.warn('[OwnerWalletScreen] Erreur de lecture du cache JSON:', e);
          }
        }
      })
      .catch((err) => console.warn('[OwnerWalletScreen] Erreur de cache:', err))
      .finally(() => setIsCacheLoaded(true));
  }, []);

  // ── 2. Query avec SWR et Cache Persistant sur disque ─────────
  const {
    data: walletData,
    isLoading,
    isFetching,
    isRefetching,
    refetch,
    error,
  } = useQuery<WalletData>({
    queryKey: ['wallet', 'mine'],
    queryFn: async () => {
      try {
        const data = await getMyWallet();
        if (data) {
          AsyncStorage.setItem(WALLET_CACHE_KEY, JSON.stringify(data)).catch(() => {});
        }
        return data;
      } catch (err) {
        if (cachedWallet) {
          return cachedWallet;
        }
        throw err;
      }
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    initialData: cachedWallet || undefined,
  });

  const wallet = walletData || cachedWallet;
  const showSkeleton = (isLoading || isFetching || !isCacheLoaded) && !wallet;

  const handleWithdrawSuccess = useCallback(() => {
    refetch();
    queryClient.invalidateQueries({ queryKey: ['owner', 'dashboard-full'] });
    queryClient.invalidateQueries({ queryKey: ['owner', 'stats-page-full'] });
    queryClient.invalidateQueries({ queryKey: ['wallet', 'mine'] });
  }, [refetch, queryClient]);

  return (
    <View style={styles.screenContainer}>
      {/* Content ScrollView */}
      {showSkeleton ? (
        <OwnerWalletSkeleton />
      ) : (
        <ScrollView
          style={styles.scrollBody}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 20) + 110 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={colors.lime[400]}
              colors={[colors.lime[400]]}
            />
          }
        >
          {/* 1. Carte principale Solde Revenus Hôte (Retirable) 1:1 Web */}
          {wallet && (
            <MobileWalletBalanceCard
              wallet={wallet}
              onOpenWithdrawalModal={() => setShowWithdrawModal(true)}
            />
          )}

          {/* 2. Historique des transactions */}
          {wallet && <MobileWalletTransactionsCard transactions={wallet.transactions || []} />}
        </ScrollView>
      )}

      {/* Modal de demande de Retrait */}
      {wallet && (
        <MobileWithdrawModal
          visible={showWithdrawModal}
          onClose={() => setShowWithdrawModal(false)}
          soldeDisponible={wallet.soldeProprietaire ?? wallet.soldeDisponible ?? 0}
          onSuccess={handleWithdrawSuccess}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
  scrollBody: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 14,
  },
});
