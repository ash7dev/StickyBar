import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  StyleSheet,
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { History, ChevronDown, Calendar, ArrowRight, AlertCircle } from 'lucide-react-native';
import { colors, radius, shadows, typography } from '../../shared/theme/tokens';
import { apiClient } from '../../shared/api/api-client';
import { useAuthStore } from '../../features/auth/stores/auth.store';
import { useRoleStore } from '../../shared/stores/role.store';
import { AuthRequiredCard } from '../../features/auth/components/AuthRequiredCard';
import {
  TenantReservationCard,
  TenantReservation,
} from '../../shared/components/ui/TenantReservationCard';
import {
  TenantReservationHeaderBar,
  ReservationTabId,
  TabCounts,
} from '../../shared/components/layout/TenantReservationHeaderBar';
import { MobileEmptyReservationCard } from '../../features/reservations/components/list/MobileEmptyReservationCard';

const ACTIVE_STATUSES = ['PENDING', 'PAID', 'CONFIRMED', 'CHECKED_IN', 'DISPUTED'];

const TAB_STATUSES: Record<Exclude<ReservationTabId, 'ALL'>, string[]> = {
  CONFIRMED: ['CONFIRMED', 'PAID', 'PENDING', 'DISPUTED'],
  CHECKED_IN: ['CHECKED_IN'],
  COMPLETED: ['COMPLETED'],
  CANCELLED: ['CANCELLED', 'EXPIRED'],
};

// ── Skeleton Loader ──────────────────────────────────────────────────
function ReservationCardSkeleton() {
  return (
    <View style={styles.skeletonCard}>
      <View style={styles.skeletonHeaderRow} />
      <View style={styles.skeletonBodyRow}>
        <View style={styles.skeletonImage} />
        <View style={styles.skeletonInfo}>
          <View style={styles.skeletonLineLong} />
          <View style={styles.skeletonLineShort} />
          <View style={styles.skeletonLineShort} />
        </View>
      </View>
    </View>
  );
}

export default function ReservationsScreen() {
  const { isAuthenticated } = useAuthStore();
  const { activeRole } = useRoleStore();

  const [activeTab, setActiveTab] = useState<ReservationTabId>('ALL');
  const [showHistory, setShowHistory] = useState(false);
  const [reservations, setReservations] = useState<TenantReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isGuarded = !isAuthenticated || activeRole === 'PROPRIETAIRE';

  const fetchReservations = async (isRefresh = false) => {
    if (isGuarded) {
      setLoading(false);
      return;
    }

    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const response = await apiClient.get<any>('/reservations/me');
      const data = response.data?.data || response.data?.items || response.data || [];
      if (Array.isArray(data)) {
        setReservations(data);
      } else {
        setReservations([]);
      }
    } catch (err: any) {
      console.warn('[ReservationsScreen] Erreur lors du chargement des réservations:', err);
      setError('Impossible de charger vos réservations. Veuillez réessayer.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReservations(false);
  }, [isAuthenticated, activeRole]);

  const handleRefresh = useCallback(() => {
    fetchReservations(true);
  }, [isAuthenticated, activeRole]);

  // ── Calculation of Counts & Filtered Lists ─────────────────────────
  const { counts, filtered, activeList, historyList } = useMemo(() => {
    const all = reservations ?? [];
    const countIn = (statuses: string[]) => all.filter((r) => statuses.includes(r.statut)).length;

    const list =
      activeTab === 'ALL'
        ? all
        : all.filter((r) => TAB_STATUSES[activeTab].includes(r.statut));

    const computedCounts: TabCounts = {
      total: all.length,
      confirmed: countIn(TAB_STATUSES.CONFIRMED),
      checkedIn: countIn(TAB_STATUSES.CHECKED_IN),
      completed: countIn(TAB_STATUSES.COMPLETED),
      cancelled: countIn(TAB_STATUSES.CANCELLED),
    };

    return {
      counts: computedCounts,
      filtered: list,
      activeList: list.filter((r) => ACTIVE_STATUSES.includes(r.statut)),
      historyList: list.filter((r) => !ACTIVE_STATUSES.includes(r.statut)),
    };
  }, [reservations, activeTab]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.mainWrapper}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            !isGuarded ? (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={colors.forest[800]}
                colors={[colors.forest[800]]}
              />
            ) : undefined
          }
        >
          {isGuarded ? (
            <View style={styles.guardedContainer}>
              <Text style={styles.screenTitle}>Mes Réservations</Text>
              <AuthRequiredCard
                subtitle="Accédez à l’historique complet de vos séjours, vos contrats de réservation et vos reçus sécurisés par le séquestre Klef."
                title="Connectez-vous pour voir vos réservations"
              />
            </View>
          ) : (
            <View style={styles.contentStack}>
              {/* En-tête avec titre Display + Onglets de statut (sans cartes KPI) */}
              <TenantReservationHeaderBar
                activeTab={activeTab}
                onTabChange={setActiveTab}
                counts={counts}
              />

              {/* Message d'erreur */}
              {error && (
                <View style={styles.errorAlert}>
                  <AlertCircle size={18} color="#991B1B" />
                  <Text style={styles.errorAlertText}>{error}</Text>
                </View>
              )}

              {/* État de chargement initial */}
              {loading && !refreshing && (
                <View style={styles.cardsList}>
                  <ReservationCardSkeleton />
                  <ReservationCardSkeleton />
                  <ReservationCardSkeleton />
                </View>
              )}

              {/* État vide ultra-premium */}
              {!loading && !error && filtered.length === 0 && (
                <MobileEmptyReservationCard
                  activeTab={activeTab}
                  onExplore={() => router.push('/(tenant)/explorer')}
                  onResetTab={() => setActiveTab('ALL')}
                />
              )}

              {/* Liste des réservations */}
              {!loading && !error && filtered.length > 0 && (
                <View style={styles.cardsList}>
                  {activeTab === 'ALL' ? (
                    <>
                      {/* Séjours en cours / à venir */}
                      {activeList.length > 0 ? (
                        activeList.map((r) => (
                          <TenantReservationCard key={r.id} reservation={r} />
                        ))
                      ) : (
                        <View style={styles.noActiveCard}>
                          <View style={styles.noActiveIconCircle}>
                            <Calendar size={18} color={colors.forest[700]} />
                          </View>
                          <View style={{ flex: 1, gap: 2 }}>
                            <Text style={styles.noActiveTitle}>
                              Aucun séjour actif en cours
                            </Text>
                            <Text style={styles.noActiveSubtitle}>
                              Retrouvez l'historique de vos séjours passés ci-dessous.
                            </Text>
                          </View>
                        </View>
                      )}

                      {/* Accordéon Historique (Séjours terminés et annulés) */}
                      {historyList.length > 0 && (
                        <View style={styles.historySection}>
                          <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={() => setShowHistory((prev) => !prev)}
                            style={styles.historyHeaderBtn}
                          >
                            <View style={styles.historyHeaderLeft}>
                              <View style={styles.historyIconCircle}>
                                <History size={16} color={colors.neutral[600]} />
                              </View>
                              <View style={styles.historyTextContainer}>
                                <View style={styles.historyTitleRow}>
                                  <Text style={styles.historyTitle}>Historique</Text>
                                  <View style={styles.historyCountPill}>
                                    <Text style={styles.historyCountText}>
                                      {historyList.length}
                                    </Text>
                                  </View>
                                </View>
                                <Text style={styles.historySubtitle}>
                                  Séjours terminés et réservations annulées
                                </Text>
                              </View>
                            </View>

                            <View style={styles.historyToggleBadge}>
                              <Text style={styles.historyToggleText}>
                                {showHistory ? 'Masquer' : 'Afficher'}
                              </Text>
                              <ChevronDown
                                size={14}
                                color={colors.neutral[600]}
                                style={{ transform: [{ rotate: showHistory ? '180deg' : '0deg' }] }}
                              />
                            </View>
                          </TouchableOpacity>

                          {showHistory && (
                            <View style={styles.historyList}>
                              {historyList.map((r) => (
                                <TenantReservationCard key={r.id} reservation={r} />
                              ))}
                            </View>
                          )}
                        </View>
                      )}
                    </>
                  ) : (
                    filtered.map((r) => (
                      <TenantReservationCard key={r.id} reservation={r} />
                    ))
                  )}
                </View>
              )}
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
  mainWrapper: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 14,
    paddingHorizontal: 16,
    paddingBottom: 140,
  },

  guardedContainer: {
    gap: 16,
  },
  screenTitle: {
    fontFamily: typography.fontDisplay,
    fontSize: 28,
    color: colors.forest[950],
    letterSpacing: -0.5,
  },

  contentStack: {
    gap: 16,
  },

  // Skeleton
  skeletonCard: {
    backgroundColor: colors.neutral[0],
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    padding: 14,
    gap: 12,
  },
  skeletonHeaderRow: {
    height: 20,
    width: '40%',
    backgroundColor: colors.neutral[200],
    borderRadius: 10,
  },
  skeletonBodyRow: {
    flexDirection: 'row',
    gap: 12,
  },
  skeletonImage: {
    width: 90,
    height: 90,
    borderRadius: 12,
    backgroundColor: colors.neutral[200],
  },
  skeletonInfo: {
    flex: 1,
    gap: 8,
    justifyContent: 'center',
  },
  skeletonLineLong: {
    height: 14,
    width: '85%',
    backgroundColor: colors.neutral[200],
    borderRadius: 7,
  },
  skeletonLineShort: {
    height: 12,
    width: '55%',
    backgroundColor: colors.neutral[200],
    borderRadius: 6,
  },

  // Error Alert
  errorAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    padding: 12,
    borderRadius: 12,
  },
  errorAlertText: {
    fontFamily: typography.fontBodyMedium,
    fontSize: 12,
    color: '#991B1B',
    flex: 1,
  },

  // Empty State
  emptyContainer: {
    backgroundColor: colors.neutral[0],
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: 16,
    paddingVertical: 36,
    paddingHorizontal: 24,
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
    ...shadows.sm,
  },
  emptyIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.forest[50],
    borderWidth: 1,
    borderColor: colors.forest[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 16,
    color: colors.forest[950],
    textAlign: 'center',
  },
  emptySubtitle: {
    fontFamily: typography.fontBody,
    fontSize: 12,
    color: colors.neutral[600],
    textAlign: 'center',
    lineHeight: 17,
  },
  exploreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.lime[400],
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: radius.pill,
    marginTop: 6,
    ...shadows.sm,
  },
  exploreBtnText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 12,
    color: colors.forest[950],
  },

  // Cards List
  cardsList: {
    gap: 12,
  },
  noActiveCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.neutral[0],
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: radius.card,
    padding: 16,
    ...shadows.sm,
  },
  noActiveIconCircle: {
    width: 38,
    height: 38,
    borderRadius: radius.inner,
    backgroundColor: colors.forest[50],
    borderWidth: 1,
    borderColor: colors.forest[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  noActiveTitle: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 14,
    color: colors.forest[950],
  },
  noActiveSubtitle: {
    fontFamily: typography.fontBody,
    fontSize: 11,
    color: colors.neutral[500],
  },

  // History Section
  historySection: {
    gap: 12,
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
  },
  historyHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.neutral[0],
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: 14,
    padding: 12,
  },
  historyHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  historyIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.neutral[100],
    borderWidth: 1,
    borderColor: colors.neutral[200],
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyTextContainer: {
    gap: 2,
    flex: 1,
  },
  historyTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  historyTitle: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 13,
    color: colors.forest[950],
  },
  historyCountPill: {
    backgroundColor: colors.neutral[100],
    borderWidth: 1,
    borderColor: colors.neutral[200],
    paddingVertical: 1,
    paddingHorizontal: 6,
    borderRadius: radius.pill,
  },
  historyCountText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 10,
    color: colors.neutral[600],
  },
  historySubtitle: {
    fontFamily: typography.fontBody,
    fontSize: 10,
    color: colors.neutral[500],
  },
  historyToggleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  historyToggleText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 11,
    color: colors.neutral[600],
  },
  historyList: {
    gap: 12,
  },
});
