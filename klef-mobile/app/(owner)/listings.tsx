import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Plus, LayoutGrid, List, AlertCircle, ArrowRight, Star } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { apiClient } from '../../shared/api/api-client';
import { OWNER_LISTINGS_CACHE_KEY, fetchOwnerListings, ownerListingsKey } from '../../features/warmup/queries';
import { colors, radius, typography } from '../../shared/theme/tokens';
import { MobileOwnerListingCard, MobileOwnerListingItem } from '../../features/listings/components/owner/MobileOwnerListingCard';
import { MobileOwnerListingsFilterRail, ListingFilterTab } from '../../features/listings/components/owner/MobileOwnerListingsFilterRail';
import { MobileOwnerListingsEmptyState } from '../../features/listings/components/owner/MobileOwnerListingsEmptyState';
import { MobileOwnerListingSkeleton } from '../../features/listings/components/owner/MobileOwnerListingSkeleton';
import { useGatedAction } from '../../shared/hooks/useGatedAction';
import { TenantActionGateModal } from '../../shared/components/gate/TenantActionGateModal';

const FILTERS = [
  { id: 'ALL', label: 'Tous' },
  { id: 'PUBLISHED', label: 'En ligne' },
  { id: 'PENDING_REVIEW', label: 'En révision' },
  { id: 'REJECTED', label: 'À corriger' },
  { id: 'DRAFT', label: 'Brouillons' },
  { id: 'PAUSED', label: 'En pause' },
] as const;

const LISTINGS_CACHE_KEY = OWNER_LISTINGS_CACHE_KEY;

export default function OwnerListingsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const goToAddListing = useCallback(() => {
    router.navigate('/(owner)/add-listing' as any);
  }, [router]);

  const {
    gateState,
    trigger: triggerGate,
    complete: completeGate,
    cancel: cancelGate,
  } = useGatedAction(goToAddListing);

  const [activeFilter, setActiveFilter] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [actionError, setActionError] = useState<string | null>(null);
  const [cachedListings, setCachedListings] = useState<MobileOwnerListingItem[] | null>(null);
  const [isCacheLoaded, setIsCacheLoaded] = useState(false);

  // ── 1. Hydratation Persistante Instantanée (0ms sur démarrage à froid) ──
  useEffect(() => {
    AsyncStorage.getItem(LISTINGS_CACHE_KEY)
      .then((raw) => {
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
              setCachedListings(parsed);
            }
          } catch (e) {
            console.warn('[OwnerListingsScreen] Erreur de lecture JSON du cache:', e);
          }
        }
      })
      .catch((err) => console.warn('[OwnerListingsScreen] Erreur de cache:', err))
      .finally(() => setIsCacheLoaded(true));
  }, []);

  // ── 2. Query avec SWR et Cache Persistant sur disque ─────────
  const { data: listingsData = [], isLoading, isFetching, isRefetching, refetch, error } = useQuery<MobileOwnerListingItem[]>({
    queryKey: ownerListingsKey,
    queryFn: async () => {
      try {
        return await fetchOwnerListings<MobileOwnerListingItem>();
      } catch (err) {
        if (cachedListings && cachedListings.length > 0) {
          return cachedListings;
        }
        throw err;
      }
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    initialData: cachedListings || undefined,
  });

  const listings = listingsData.length > 0 ? listingsData : (cachedListings || []);

  const invalidate = useCallback(() => {
    setActionError(null);
    queryClient.invalidateQueries({ queryKey: ['listings', 'mine'] });
    queryClient.invalidateQueries({ queryKey: ['owner', 'dashboard-full'] });
    queryClient.invalidateQueries({ queryKey: ['owner', 'stats-page-full'] });
  }, [queryClient]);

  // ── 3. Mutations Optimistes (Réponse Instantanée 0ms) ──────────
  const toggleStatus = useMutation({
    mutationFn: async ({ id, currentStatus }: { id: string; currentStatus: string }) => {
      const endpoint = currentStatus === 'PUBLISHED' ? `/listings/${id}/pause` : `/listings/${id}/republier`;
      return apiClient.patch(endpoint);
    },
    onMutate: async ({ id, currentStatus }) => {
      await queryClient.cancelQueries({ queryKey: ['listings', 'mine'] });
      const previousListings = queryClient.getQueryData<MobileOwnerListingItem[]>(['listings', 'mine']);

      const nextStatus = currentStatus === 'PUBLISHED' ? 'PAUSED' : 'PUBLISHED';
      queryClient.setQueryData<MobileOwnerListingItem[]>(['listings', 'mine'], (old = []) =>
        old.map((item) => (item.id === id ? { ...item, statut: nextStatus } : item))
      );

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      return { previousListings };
    },
    onError: (err: any, _, context) => {
      if (context?.previousListings) {
        queryClient.setQueryData(['listings', 'mine'], context.previousListings);
      }
      setActionError(err?.response?.data?.message || err?.message || 'Le changement de statut a échoué.');
    },
    onSettled: () => invalidate(),
  });

  const toggleDerniereMinute = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      return apiClient.patch(`/listings/${id}`, { derniereMinuteActive: active });
    },
    onMutate: async ({ id, active }) => {
      await queryClient.cancelQueries({ queryKey: ['listings', 'mine'] });
      const previousListings = queryClient.getQueryData<MobileOwnerListingItem[]>(['listings', 'mine']);

      queryClient.setQueryData<MobileOwnerListingItem[]>(['listings', 'mine'], (old = []) =>
        old.map((item) => (item.id === id ? { ...item, derniereMinuteActive: active } : item))
      );

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      return { previousListings };
    },
    onError: (err: any, _, context) => {
      if (context?.previousListings) {
        queryClient.setQueryData(['listings', 'mine'], context.previousListings);
      }
      setActionError(err?.response?.data?.message || err?.message || 'La modification de la dernière minute a échoué.');
    },
    onSettled: () => invalidate(),
  });

  const deleteListing = useMutation({
    mutationFn: async (id: string) => {
      return apiClient.delete(`/listings/${id}`);
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['listings', 'mine'] });
      const previousListings = queryClient.getQueryData<MobileOwnerListingItem[]>(['listings', 'mine']);

      queryClient.setQueryData<MobileOwnerListingItem[]>(['listings', 'mine'], (old = []) =>
        old.filter((item) => item.id !== id)
      );

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      return { previousListings };
    },
    onError: (err: any, _, context) => {
      if (context?.previousListings) {
        queryClient.setQueryData(['listings', 'mine'], context.previousListings);
      }
      setActionError(err?.response?.data?.message || err?.message || 'La suppression du bien a échoué.');
    },
    onSettled: () => invalidate(),
  });

  // ── Stats & Filtering ───────────────────────────────────────
  const { filteredListings, filterTabs, showSkeleton } = useMemo(() => {
    const showSkeleton = (isLoading || isFetching || isRefetching || !isCacheLoaded) && listings.length === 0;

    const byStatus = new Map<string, number>();
    listings.forEach((l) => {
      const st = l.statut || 'DRAFT';
      byStatus.set(st, (byStatus.get(st) ?? 0) + 1);
    });

    // Seuls les statuts présents dans le parc ont un filtre
    const tabs: ListingFilterTab[] = FILTERS.map((f) => {
      const count = f.id === 'ALL' ? listings.length : byStatus.get(f.id) ?? 0;
      return { id: f.id, label: f.label, count };
    }).filter((t) => t.id === 'ALL' || t.count > 0 || t.id === activeFilter);

    const filtered =
      activeFilter === 'ALL'
        ? listings
        : listings.filter((l) => (l.statut || 'DRAFT') === activeFilter);

    return { filteredListings: filtered, filterTabs: tabs, showSkeleton };
  }, [listings, activeFilter, isCacheLoaded, isLoading, isFetching, isRefetching]);

  const portfolio = useMemo(() => {
    const avis = listings.reduce((sum, l) => sum + (l.totalAvis ?? 0), 0);
    const weighted = listings.reduce((sum, l) => sum + Number(l.note ?? 0) * (l.totalAvis ?? 0), 0);
    return {
      total: listings.length,
      online: listings.filter((l) => l.statut === 'PUBLISHED').length,
      sejours: listings.reduce((sum, l) => sum + (l.totalSejours ?? 0), 0),
      avis,
      note: avis > 0 ? weighted / avis : null,
      todo: listings.filter((l) => l.statut === 'DRAFT' || l.statut === 'REJECTED').length,
    };
  }, [listings]);

  const handleAddPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    triggerGate();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.forest[600]} />}
      >
        {/* ── Portefeuille : l'état du parc en un coup d'œil ─────────── */}
        {listings.length > 0 && (
          <View style={styles.portfolio}>
            <View style={[styles.ring, styles.ringOuter]} />
            <View style={[styles.ring, styles.ringInner]} />
            <View style={styles.portfolioTop}>
              <View style={styles.flex}>
                <Text style={styles.portfolioKicker}>VOTRE PORTEFEUILLE</Text>
                <Text style={styles.portfolioTitle}>
                  {portfolio.total} bien{portfolio.total > 1 ? 's' : ''}
                  {portfolio.online > 0 && <Text style={styles.portfolioAccent}> · {portfolio.online} en ligne</Text>}
                </Text>
              </View>
              <TouchableOpacity onPress={handleAddPress} style={styles.addBtn} accessibilityRole="button" accessibilityLabel="Ajouter un bien">
                <Plus size={20} color={INK} strokeWidth={2.6} />
              </TouchableOpacity>
            </View>
            <View style={styles.kpis}>
              <View style={styles.kpi}>
                <Text style={styles.kpiValue}>{portfolio.sejours}</Text>
                <Text style={styles.kpiLabel}>séjours</Text>
              </View>
              <View style={styles.kpiSep} />
              <View style={styles.kpi}>
                <View style={styles.kpiRow}>
                  {portfolio.note !== null && <Star size={14} color={colors.lime[400]} fill={colors.lime[400]} />}
                  <Text style={styles.kpiValue}>{portfolio.note !== null ? portfolio.note.toFixed(1).replace('.', ',') : '—'}</Text>
                </View>
                <Text style={styles.kpiLabel}>{portfolio.avis > 0 ? `${portfolio.avis} avis` : 'pas encore d’avis'}</Text>
              </View>
              <View style={styles.kpiSep} />
              <View style={styles.kpi}>
                <Text style={[styles.kpiValue, portfolio.todo > 0 && styles.kpiWarn]}>{portfolio.todo}</Text>
                <Text style={styles.kpiLabel}>à finaliser</Text>
              </View>
            </View>
          </View>
        )}

        {/* ── Filtres + mode d'affichage ─────────────────────────────── */}
        {listings.length > 0 && (
          <View style={styles.filtersRow}>
            <View style={styles.flex}>
              <MobileOwnerListingsFilterRail tabs={filterTabs} activeFilter={activeFilter} onSelectFilter={setActiveFilter} />
            </View>
            <View style={styles.viewModeToggle}>
              {(['grid', 'list'] as const).map((mode) => {
                const Icon = mode === 'grid' ? LayoutGrid : List;
                const active = viewMode === mode;
                return (
                  <TouchableOpacity
                    key={mode}
                    onPress={() => {
                      Haptics.selectionAsync().catch(() => {});
                      setViewMode(mode);
                    }}
                    style={[styles.viewModeBtn, active && styles.viewModeBtnActive]}
                    accessibilityLabel={mode === 'grid' ? 'Affichage en cartes' : 'Affichage en liste'}
                  >
                    <Icon size={15} color={active ? colors.lime[400] : colors.neutral[500]} />
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {(actionError || error) && (
          <View style={styles.errorAlert}>
            <AlertCircle size={18} color={colors.error[600]} />
            <Text style={styles.errorAlertText}>
              {actionError || (error as any)?.response?.data?.message || (error as any)?.message || 'Impossible de charger vos annonces.'}
            </Text>
          </View>
        )}

        {showSkeleton ? (
          <View style={styles.cardsStack}>
            {Array.from({ length: 3 }).map((_, i) => (
              <MobileOwnerListingSkeleton key={i} viewMode={viewMode} />
            ))}
          </View>
        ) : filteredListings.length === 0 ? (
          <MobileOwnerListingsEmptyState
            hasFilter={activeFilter !== 'ALL'}
            onAddPress={handleAddPress}
            onResetFilter={() => setActiveFilter('ALL')}
          />
        ) : (
          <View style={viewMode === 'grid' ? styles.gridStack : styles.cardsStack}>
            {filteredListings.map((listing) => (
              <MobileOwnerListingCard
                key={listing.id}
                listing={listing}
                viewMode={viewMode}
                onToggleStatus={(id, currentStatus) => toggleStatus.mutate({ id, currentStatus })}
                onToggleDerniereMinute={(id, active) => toggleDerniereMinute.mutate({ id, active })}
                onDelete={(id) => deleteListing.mutate(id)}
              />
            ))}
          </View>
        )}

        {/* ── Ajouter un bien (quand le parc existe déjà) ───────────── */}
        {listings.length > 0 && (
          <TouchableOpacity activeOpacity={0.85} onPress={handleAddPress} style={styles.addCard} accessibilityRole="button">
            <View style={styles.addCardIcon}>
              <Plus size={18} color={colors.lime[400]} strokeWidth={2.6} />
            </View>
            <View style={styles.flex}>
              <Text style={styles.addCardTitle}>Ajouter un bien</Text>
              <Text style={styles.addCardText}>Publication gratuite, vérifiée par l’équipe Paixi.</Text>
            </View>
            <ArrowRight size={16} color={colors.neutral[500]} />
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Action Gate Modal (Profil, Téléphone, KYC) */}
      <TenantActionGateModal
        visible={gateState.open}
        steps={gateState.steps}
        block={gateState.block}
        onComplete={completeGate}
        onCancel={cancelGate}
      />
    </SafeAreaView>
  );
}

const INK = colors.forest[950];

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.neutral[50] },
  flex: { flex: 1, minWidth: 0 },
  scrollContainer: { padding: 16, gap: 16, paddingBottom: 120 },

  // Portefeuille
  portfolio: { gap: 18, padding: 20, borderRadius: 28, overflow: 'hidden', backgroundColor: INK },
  ring: { position: 'absolute', borderWidth: 1, borderColor: 'rgba(211,242,110,0.12)' },
  ringOuter: { width: 220, height: 220, borderRadius: 110, top: -110, right: -70 },
  ringInner: { width: 130, height: 130, borderRadius: 65, top: -65, right: -25, borderColor: 'rgba(211,242,110,0.2)' },
  portfolioTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  portfolioKicker: { fontFamily: typography.fontBodyBold, fontSize: 10.5, letterSpacing: 1.3, color: colors.lime[400] },
  portfolioTitle: { fontFamily: typography.fontDisplaySemiBold, fontSize: 28, letterSpacing: -0.7, color: '#FFFFFF', marginTop: 4 },
  portfolioAccent: { fontStyle: 'italic', color: colors.lime[400] },
  addBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.lime[400], alignItems: 'center', justifyContent: 'center' },
  kpis: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderRadius: 20, backgroundColor: 'rgba(248,251,244,0.06)' },
  kpi: { flex: 1, alignItems: 'center', gap: 2 },
  kpiRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  kpiValue: { fontFamily: typography.fontDisplaySemiBold, fontSize: 22, color: '#FFFFFF' },
  kpiWarn: { color: colors.gold[300] },
  kpiLabel: { fontFamily: typography.fontBodyMedium, fontSize: 11.5, color: colors.forest[200] },
  kpiSep: { width: 1, height: 30, backgroundColor: 'rgba(248,251,244,0.12)' },

  // Filtres
  filtersRow: { flexDirection: 'row', alignItems: 'center', marginHorizontal: -16 },
  viewModeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    padding: 3,
    marginRight: 16,
    marginLeft: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.neutral[0],
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  viewModeBtn: { width: 32, height: 28, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  viewModeBtnActive: { backgroundColor: INK },

  cardsStack: { gap: 10 },
  gridStack: { gap: 18 },

  errorAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.error[50],
    padding: 12,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.error[500],
  },
  errorAlertText: { fontFamily: typography.fontBody, fontSize: 12, color: colors.error[700], flex: 1 },

  // Ajouter un bien
  addCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 22,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.neutral[300],
  },
  addCardIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: INK, alignItems: 'center', justifyContent: 'center' },
  addCardTitle: { fontFamily: typography.fontBodyBold, fontSize: 14, color: colors.neutral[900] },
  addCardText: { fontFamily: typography.fontBody, fontSize: 12, color: colors.neutral[600], marginTop: 1 },
});
