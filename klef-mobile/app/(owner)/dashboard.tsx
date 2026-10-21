import React, { useMemo } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, typography } from '../../shared/theme/tokens';
import { AppButton } from '../../shared/components/ui/AppButton';
import { OwnerDashboardSkeleton } from '../../shared/components/layout/OwnerDashboardSkeleton';
import { AnimatedScreenWrapper } from '../../shared/components/animation/AnimatedScreenWrapper';
import { AnimatedStaggerGroup } from '../../shared/components/animation/AnimatedStaggerGroup';
import { MobileCancellationWarningBanner } from '../../features/dashboard/components/owner/MobileCancellationWarningBanner';
import { MobileQuickActionsMenuCard } from '../../features/dashboard/components/owner/MobileQuickActionsMenuCard';
import { useOwnerOverview } from '../../features/owner-home/hooks/useOwnerOverview';
import { WalletHeroCard } from '../../features/owner-home/components/WalletHeroCard';
import { TodoSection } from '../../features/owner-home/components/TodoSection';
import { WeekSection } from '../../features/owner-home/components/WeekSection';
import { useOwnerCalendar, apiErrorMessage } from '../../features/calendar/hooks/useOwnerCalendar';
import { usePendingDecisions } from '../../features/calendar/hooks/usePendingDecisions';
import { addDays, todayDay } from '../../features/calendar/lib/days';

/**
 * Accueil hôte mobile (direction M1 « Carte solde ») :
 * l'argent d'abord, puis ce qu'il faut faire aujourd'hui, la semaine et les raccourcis.
 */
export default function OwnerDashboardScreen() {
  const today = todayDay();
  const overview = useOwnerOverview();
  const decisions = usePendingDecisions();
  const calendar = useOwnerCalendar(today, addDays(today, 8));

  const logementTitles = useMemo(
    () => new Map((calendar.data?.logements ?? []).map((l) => [l.id, l.titre])),
    [calendar.data],
  );
  const events = calendar.data?.events ?? [];

  const isRefetching = overview.isRefetching || decisions.isRefetching || calendar.isRefetching;
  const refetchAll = () => Promise.all([overview.refetch(), decisions.refetch(), calendar.refetch()]);

  if (overview.isLoading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <OwnerDashboardSkeleton />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <AnimatedScreenWrapper preset="slideUp" distance={18}>
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetchAll}
              tintColor={colors.forest[600]}
              colors={[colors.forest[600]]}
            />
          }
        >
          <MobileCancellationWarningBanner />

          {overview.isError || !overview.data ? (
            <View style={styles.errorCard}>
              <Text style={styles.errorText}>
                {apiErrorMessage(overview.error, 'Impossible de charger votre tableau de bord.')}
              </Text>
              <AppButton label="Réessayer" variant="ghost" size="sm" onPress={() => overview.refetch()} />
            </View>
          ) : (
            <AnimatedStaggerGroup staggerDelay={60} preset="slideUp" distance={16}>
              <WalletHeroCard wallet={overview.data.wallet} revenueThisMonth={overview.data.revenue.currentMonth} />
              <TodoSection
                decisions={decisions.data ?? []}
                events={events}
                logementTitles={logementTitles}
                today={today}
              />
              <WeekSection events={events} logementTitles={logementTitles} today={today} />
              <MobileQuickActionsMenuCard />
            </AnimatedStaggerGroup>
          )}
        </ScrollView>
      </AnimatedScreenWrapper>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.neutral[50] },
  container: { padding: 18, gap: 20, paddingBottom: 120 },
  errorCard: {
    alignItems: 'center',
    gap: 10,
    padding: 24,
    borderRadius: radius.card,
    backgroundColor: colors.neutral[0],
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  errorText: { fontFamily: typography.fontBody, fontSize: 13, color: colors.neutral[600], textAlign: 'center' },
});
