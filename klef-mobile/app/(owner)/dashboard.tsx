import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { colors, typography } from '../../shared/theme/tokens';
import { useAuthStore } from '../../features/auth/stores/auth.store';
import { useOwnerDashboard } from '../../features/dashboard/hooks/useOwnerDashboard';
import { MobileCancellationWarningBanner } from '../../features/dashboard/components/owner/MobileCancellationWarningBanner';
import { MobileKpiGridCard } from '../../features/dashboard/components/owner/MobileKpiGridCard';
import { MobileRevenueWalletCard } from '../../features/dashboard/components/owner/MobileRevenueWalletCard';
import { MobileQuickActionsMenuCard } from '../../features/dashboard/components/owner/MobileQuickActionsMenuCard';
import { OwnerDashboardSkeleton } from '../../shared/components/layout/OwnerDashboardSkeleton';

export default function OwnerDashboardScreen() {
  const { user } = useAuthStore();
  const { stats, pending, isLoading, isRefetching, refetch } = useOwnerDashboard();

  const userFirstName = user?.prenom || 'Propriétaire';

  if (isLoading && !isRefetching) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <OwnerDashboardSkeleton />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.forest[600]}
            colors={[colors.forest[600]]}
          />
        }
      >
        {/* ── 1. Bandeau de Sécurité / Annulations (Si applicable) ─── */}
        <MobileCancellationWarningBanner />

        {/* ── 2. Carte Unique Revenus & Solde Retirable ────────────── */}
        <MobileRevenueWalletCard stats={stats} />

        {/* ── 3. Synthèse d'Activité KPIs (Grille 2x2) ──────────────── */}
        <MobileKpiGridCard stats={stats} pending={pending} />

        {/* ── 4. Actions Rapides Menu ──────────────────────────────── */}
        <MobileQuickActionsMenuCard />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
  container: {
    padding: 20,
    gap: 20,
    paddingBottom: 110,
  },
  headerTitleRow: {
    gap: 3,
  },
  title: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 24,
    color: colors.forest[950],
    letterSpacing: -0.3,
  },
  subtitle: {
    fontFamily: typography.fontBody,
    fontSize: 12,
    color: colors.neutral[600],
  },
});
