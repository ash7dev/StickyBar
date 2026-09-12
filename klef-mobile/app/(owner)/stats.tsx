import React from 'react';
import { StyleSheet, ScrollView, RefreshControl, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../shared/theme/tokens';
import { useOwnerStats } from '../../features/dashboard/hooks/useOwnerStats';
import { MobileStatsHeader } from '../../features/dashboard/components/owner/stats/MobileStatsHeader';
import { MobileStatsKpiSection } from '../../features/dashboard/components/owner/stats/MobileStatsKpiSection';
import { MobileStatsRevenueChart } from '../../features/dashboard/components/owner/stats/MobileStatsRevenueChart';
import { MobileStatsPerformanceCard } from '../../features/dashboard/components/owner/stats/MobileStatsPerformanceCard';
import { MobileStatsRecentActivityCard } from '../../features/dashboard/components/owner/stats/MobileStatsRecentActivityCard';

import { OwnerDashboardSkeleton } from '../../shared/components/layout/OwnerDashboardSkeleton';

export default function OwnerStatsScreen() {
  const {
    stats,
    recentActivity,
    timeframe,
    setTimeframe,
    isLoading,
    isRefetching,
    refetch,
  } = useOwnerStats();

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
        {/* ── 1. En-tête personnalisé avec Bouton Retour vers l'accueil Hôte ──── */}
        <MobileStatsHeader
          timeframe={timeframe}
          onTimeframeChange={setTimeframe}
          onRefresh={refetch}
          isRefetching={isRefetching}
        />

        {/* ── 2. Synthèse des KPIs Globaux (Grille 2x2) ────────────────────────── */}
        <MobileStatsKpiSection stats={stats} />

        {/* ── 3. Évolution des Revenus & Réservations (Graphique Visuel) ──────── */}
        <MobileStatsRevenueChart stats={stats} />

        {/* ── 4. Qualité, Avis & Performance du parc ───────────────────────────── */}
        <MobileStatsPerformanceCard stats={stats} />

        {/* ── 5. Activités & Historique Récent ─────────────────────────────────── */}
        <MobileStatsRecentActivityCard activities={recentActivity} />

        {/* Espacement de sécurité en bas */}
        <View style={styles.bottomSpacer} />
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
    paddingBottom: 40,
  },
  bottomSpacer: {
    height: 30,
  },
});
