import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { History, ChevronDown, CalendarDays, AlertCircle } from 'lucide-react-native';
import { colors, typography } from '../../shared/theme/tokens';
import { apiClient } from '../../shared/api/api-client';
import { updateReservationStatus } from '../../features/reservations/services/reservation.service';
import {
  MobileOwnerReservationHeaderBar,
  OwnerStatusTabId,
} from '../../features/reservations/components/owner/MobileOwnerReservationHeaderBar';
import {
  MobileOwnerReservationCard,
  OwnerReservationItem,
} from '../../features/reservations/components/owner/MobileOwnerReservationCard';

const ACTIVE_STATUSES = ['PENDING', 'PAID', 'CONFIRMED', 'CHECKED_IN', 'DISPUTED'];

function SkeletonCard() {
  return (
    <View style={skeletonStyles.card}>
      <View style={skeletonStyles.topRow} />
      <View style={skeletonStyles.contentRow}>
        <View style={skeletonStyles.thumb} />
        <View style={skeletonStyles.lines}>
          <View style={[skeletonStyles.line, { width: '80%' }]} />
          <View style={[skeletonStyles.line, { width: '50%' }]} />
          <View style={[skeletonStyles.line, { width: '60%' }]} />
        </View>
      </View>
      <View style={skeletonStyles.footerRow} />
    </View>
  );
}

export default function OwnerReservationsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<OwnerStatusTabId>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [reservations, setReservations] = useState<OwnerReservationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchReservations = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    setErrorMessage(null);

    try {
      let res: any = null;
      try {
        res = await apiClient.get<any[]>('/reservations/me');
      } catch (err) {
        res = await apiClient.get<any[]>('/reservations/owner');
      }

      const list = Array.isArray(res) ? res : res?.data ?? res?.reservations ?? [];
      setReservations(list);
    } catch (err: any) {
      console.warn('[OwnerReservationsScreen] Erreur de chargement:', err);
      setErrorMessage('Impossible de charger vos réservations.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchReservations(false);
  }, [fetchReservations]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchReservations(true);
  };

  /* ── Filtered & Grouped Data ─────────────────────────── */
  const { filteredList, activeList, historyList, counts } = useMemo(() => {
    const valid = reservations.filter((r) => r.statut !== 'EXPIRED');

    const q = searchQuery.trim().toLowerCase();
    const matches = (r: OwnerReservationItem) => {
      if (!q) return true;
      const title = (r.logement?.titre ?? '').toLowerCase();
      const guest = `${r.locataire?.prenom ?? ''} ${r.locataire?.nom ?? ''}`.toLowerCase();
      const location = `${r.logement?.ville ?? ''} ${r.logement?.quartier ?? ''}`.toLowerCase();
      const resId = (r.id ?? '').toLowerCase();

      return (
        title.includes(q) ||
        guest.includes(q) ||
        location.includes(q) ||
        resId.includes(q)
      );
    };

    const list = valid
      .filter((r) => activeTab === 'ALL' || r.statut === activeTab)
      .filter(matches);

    const byStatus = new Map<string, number>();
    valid.forEach((r) => {
      byStatus.set(r.statut, (byStatus.get(r.statut) ?? 0) + 1);
    });

    return {
      filteredList: list,
      activeList: list.filter((r) => ACTIVE_STATUSES.includes(r.statut)),
      historyList: list.filter((r) => !ACTIVE_STATUSES.includes(r.statut)),
      counts: byStatus,
    };
  }, [reservations, activeTab, searchQuery]);

  /* ── Handlers ────────────────────────────────────────── */
  const handleConfirmReservation = async (id: string) => {
    try {
      await updateReservationStatus(id, 'CONFIRM', { heureDebut: '14:00', heureFin: '12:00' });
      fetchReservations(true);
    } catch (err: any) {
      console.error('[ConfirmReservation] Erreur:', err);
    }
  };

  const handleCancelReservation = async (id: string, reason: string) => {
    try {
      await apiClient.patch(`/reservations/${id}/cancel`, { raison: reason });
      fetchReservations(true);
    } catch (err: any) {
      console.error('[CancelReservation] Erreur:', err);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.forest[800]}
            colors={[colors.forest[800]]}
          />
        }
      >
        {/* ── Filter Bar (Search + Tabs) ──────────────────────── */}
        <MobileOwnerReservationHeaderBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          counts={counts}
          totalCount={reservations.length}
        />

        {/* ── Error Banner ───────────────────────────────────── */}
        {errorMessage && (
          <View style={styles.errorBox}>
            <AlertCircle size={18} color="#DC2626" />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}

        {/* ── Skeleton Loading ───────────────────────────────── */}
        {loading && !refreshing && (
          <View style={styles.listContainer}>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </View>
        )}

        {/* ── Empty State (Aucune réservation ou aucun filtre correspondant) ───── */}
        {!loading && filteredList.length === 0 && (
          <View style={styles.emptyCard}>
            <View style={styles.glowCircle} />
            <View style={styles.emptyIconCircle}>
              <CalendarDays size={30} color={colors.lime[300]} />
            </View>
            
            <Text style={styles.emptyTitle}>
              {reservations.length === 0
                ? 'Aucune réservation pour le moment'
                : searchQuery
                ? 'Aucun résultat trouvé'
                : 'Aucune réservation dans cette catégorie'}
            </Text>

            <Text style={styles.emptySubtitle}>
              {reservations.length === 0
                ? 'Dès qu’un voyageur effectue une réservation ou une demande sur l’une de vos annonces, elle apparaîtra instantanément ici.'
                : searchQuery
                ? 'Aucune réservation ne correspond à vos critères de recherche.'
                : 'Aucune réservation ne possède actuellement ce statut.'}
            </Text>

            {/* Badges pédagogiques pour état totalement vide */}
            {reservations.length === 0 && (
              <View style={styles.emptyBadgesRow}>
                <View style={styles.emptyBadge}>
                  <Text style={styles.emptyBadgeText}>⚡ Confirmation instantanée</Text>
                </View>
                <View style={styles.emptyBadge}>
                  <Text style={styles.emptyBadgeText}>🛡️ Séquestre 100% garanti</Text>
                </View>
                <View style={styles.emptyBadge}>
                  <Text style={styles.emptyBadgeText}>📄 Contrat numérique</Text>
                </View>
              </View>
            )}

            {/* Action buttons */}
            {reservations.length === 0 ? (
              <TouchableOpacity
                onPress={() => router.push('/(owner)/listings' as any)}
                style={styles.emptyCtaBtn}
                activeOpacity={0.85}
              >
                <Text style={styles.emptyCtaText}>Gérer mes logements</Text>
              </TouchableOpacity>
            ) : (searchQuery.length > 0 || activeTab !== 'ALL') ? (
              <TouchableOpacity
                onPress={() => {
                  setSearchQuery('');
                  setActiveTab('ALL');
                }}
                style={styles.emptyCtaBtn}
                activeOpacity={0.85}
              >
                <Text style={styles.emptyCtaText}>Réinitialiser les filtres</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        )}

        {/* ── Reservations List ──────────────────────────────── */}
        {!loading && filteredList.length > 0 && (
          <View style={styles.listContainer}>
            {activeTab === 'ALL' ? (
              <>
                {/* Active Stay Section */}
                {activeList.length > 0 ? (
                  activeList.map((item) => (
                    <MobileOwnerReservationCard
                      key={item.id}
                      reservation={item}
                      onConfirm={handleConfirmReservation}
                      onCancel={handleCancelReservation}
                    />
                  ))
                ) : (
                  <View style={styles.subEmptyCard}>
                    <Text style={styles.subEmptyText}>Aucune réservation active actuellement.</Text>
                  </View>
                )}

                {/* Collapsible History Section */}
                {historyList.length > 0 && (
                  <View style={styles.historySection}>
                    <TouchableOpacity
                      onPress={() => setShowHistory((prev) => !prev)}
                      activeOpacity={0.8}
                      style={styles.historyHeaderBtn}
                    >
                      <View style={styles.historyTitleGroup}>
                        <View style={styles.historyIconBox}>
                          <History size={16} color={colors.neutral[600]} />
                        </View>
                        <View style={styles.historyTextCol}>
                          <Text style={styles.historyTitle} numberOfLines={1}>
                            Historique ({historyList.length})
                          </Text>
                          <Text style={styles.historySub} numberOfLines={1}>
                            Séjours terminés et demandes annulées
                          </Text>
                        </View>
                      </View>

                      <View style={styles.toggleChip}>
                        <Text style={styles.toggleChipText}>
                          {showHistory ? 'Masquer' : 'Afficher'}
                        </Text>
                        <ChevronDown
                          size={16}
                          color={colors.neutral[600]}
                          style={showHistory ? styles.iconRotate : undefined}
                        />
                      </View>
                    </TouchableOpacity>

                    {showHistory && (
                      <View style={styles.historyListContainer}>
                        {historyList.map((item) => (
                          <MobileOwnerReservationCard
                            key={item.id}
                            reservation={item}
                          />
                        ))}
                      </View>
                    )}
                  </View>
                )}
              </>
            ) : (
              /* Specific Tab View */
              filteredList.map((item) => (
                <MobileOwnerReservationCard
                  key={item.id}
                  reservation={item}
                  onConfirm={handleConfirmReservation}
                  onCancel={handleCancelReservation}
                />
              ))
            )}
          </View>
        )}
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
    padding: 16,
    paddingBottom: 110,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    color: colors.forest[600],
    letterSpacing: 1,
    marginBottom: 2,
  },
  pageTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: '900',
    color: colors.forest[950],
    letterSpacing: -0.5,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 14,
    gap: 8,
    marginBottom: 12,
  },
  errorText: {
    fontSize: typography.sizes.xs,
    color: '#991B1B',
    fontWeight: '600',
    flex: 1,
  },
  listContainer: {
    gap: 4,
  },
  emptyCard: {
    backgroundColor: colors.forest[950],
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  glowCircle: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(211, 242, 110, 0.08)',
  },
  emptyIconCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1.5,
    borderColor: 'rgba(211, 242, 110, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: typography.sizes.md,
    fontWeight: '800',
    color: colors.neutral[0],
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: typography.sizes.xs,
    color: colors.forest[200],
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 290,
  },
  emptyBadgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
    marginVertical: 4,
  },
  emptyBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 14,
  },
  emptyBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.lime[300],
  },
  emptyCtaBtn: {
    marginTop: 6,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 22,
    backgroundColor: colors.lime[400],
  },
  emptyCtaText: {
    fontSize: typography.sizes.xs,
    fontWeight: '800',
    color: colors.forest[950],
  },
  subEmptyCard: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    marginBottom: 12,
  },
  subEmptyText: {
    fontSize: typography.sizes.xs,
    color: colors.neutral[600],
    fontWeight: '500',
  },
  historySection: {
    marginTop: 12,
    gap: 12,
  },
  historyHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.neutral[0],
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  historyTitleGroup: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginRight: 8,
    minWidth: 0,
  },
  historyIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  historyTextCol: {
    flex: 1,
    minWidth: 0,
  },
  historyTitle: {
    fontFamily: typography.fontBodyBold,
    fontSize: typography.sizes.xs,
    color: colors.neutral[900],
  },
  historySub: {
    fontFamily: typography.fontBodyMedium,
    fontSize: 11,
    color: colors.neutral[500],
  },
  toggleChip: {
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: colors.neutral[100],
  },
  toggleChipText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 11,
    color: colors.neutral[700],
  },
  iconRotate: {
    transform: [{ rotate: '180deg' }],
  },
  historyListContainer: {
    marginTop: 4,
  },
});

const skeletonStyles = StyleSheet.create({
  card: {
    height: 140,
    backgroundColor: colors.neutral[100],
    borderRadius: 20,
    marginBottom: 12,
    padding: 16,
    justifyContent: 'space-between',
  },
  topRow: {
    height: 20,
    width: 90,
    backgroundColor: colors.neutral[200],
    borderRadius: 8,
  },
  contentRow: {
    flexDirection: 'row',
    gap: 12,
  },
  thumb: {
    width: 60,
    height: 60,
    backgroundColor: colors.neutral[200],
    borderRadius: 12,
  },
  lines: {
    flex: 1,
    gap: 8,
  },
  line: {
    height: 12,
    backgroundColor: colors.neutral[200],
    borderRadius: 6,
  },
  footerRow: {
    height: 24,
    width: '100%',
    backgroundColor: colors.neutral[200],
    borderRadius: 8,
  },
});
