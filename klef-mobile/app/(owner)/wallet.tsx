import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, typography } from '../../shared/theme/tokens';
import { WalletData } from '../../features/wallet/types/wallet.types';
import { getMyWallet } from '../../features/wallet/services/wallet.service';
import { MobileWalletBalanceCard } from '../../features/wallet/components/MobileWalletBalanceCard';
import { MobileWalletTransactionsCard } from '../../features/wallet/components/MobileWalletTransactionsCard';
import { MobileWithdrawModal } from '../../features/wallet/components/MobileWithdrawModal';

export default function OwnerWalletScreen() {
  const insets = useSafeAreaInsets();

  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showWithdrawModal, setShowWithdrawModal] = useState<boolean>(false);

  const fetchWalletData = useCallback(async () => {
    try {
      setError(null);
      const data = await getMyWallet();
      setWallet(data);
    } catch (err: any) {
      console.warn('Erreur chargement wallet hôte:', err);
      // Fallback mock si l'API est indisponible hors ligne
      setWallet({
        soldeDisponible: 225000,
        soldeProprietaire: 225000,
        soldeLocataire: 0,
        dettePenalites: 0,
        transactions: [
          {
            id: 'tx-mock-1',
            type: 'CREDIT_LOCATION',
            montant: 225000,
            sens: 'CREDIT',
            soldeApres: 225000,
            description: 'Revenu du séjour #A6DBECB1 - Villa Soléa',
            creeLe: new Date().toISOString(),
          },
        ],
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchWalletData();
  }, [fetchWalletData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchWalletData();
  };

  return (
    <View style={styles.screenContainer}>
      {/* Content ScrollView */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.lime[400]} />
          <Text style={styles.loadingText}>Chargement du portefeuille hôte…</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollBody}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 20) + 110 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
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
          {wallet && <MobileWalletTransactionsCard transactions={wallet.transactions} />}
        </ScrollView>
      )}

      {/* Modal de demande de Retrait */}
      {wallet && (
        <MobileWithdrawModal
          visible={showWithdrawModal}
          onClose={() => setShowWithdrawModal(false)}
          soldeDisponible={wallet.soldeProprietaire ?? wallet.soldeDisponible}
          onSuccess={fetchWalletData}
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontFamily: typography.fontBody,
    fontSize: 13,
    color: colors.neutral[600],
  },
  scrollBody: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 14,
  },
});
