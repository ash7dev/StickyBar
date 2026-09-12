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
import { Plus, LayoutGrid, List, AlertCircle } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { apiClient } from '../../shared/api/api-client';
import { colors, radius, shadows, typography } from '../../shared/theme/tokens';
import { MobileOwnerListingCard, MobileOwnerListingItem } from '../../features/listings/components/owner/MobileOwnerListingCard';
import { MobileOwnerListingsFilterRail, ListingFilterTab } from '../../features/listings/components/owner/MobileOwnerListingsFilterRail';
import { MobileOwnerListingsEmptyState } from '../../features/listings/components/owner/MobileOwnerListingsEmptyState';
import { MobileOwnerListingSkeleton } from '../../features/listings/components/owner/MobileOwnerListingSkeleton';
import { useGatedAction } from '../../shared/hooks/useGatedAction';
import { TenantActionGateModal } from '../../shared/components/gate/TenantActionGateModal';

const FILTERS = [
  { id: 'ALL', label: 'Toutes' },
  { id: 'PUBLISHED', label: 'Publiées' },
  { id: 'PENDING_REVIEW', label: 'En révision' },
  { id: 'DRAFT', label: 'Brouillons' },
  { id: 'PAUSED', label: 'En pause' },
  { id: 'REJECTED', label: 'Rejetées' },
] as const;

const LISTINGS_CACHE_KEY = 'klef_owner_listings_cache_v1';

export default function OwnerListingsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const goToAddListing = useCallback(() => {
    router.push('/(owner)/add-listing' as any);
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
    queryKey: ['listings', 'mine'],
    queryFn: async () => {
      try {
        const response = await apiClient.get<MobileOwnerListingItem[]>('/listings/me');
        const list = Array.isArray(response.data) ? response.data : [];
        if (list.length > 0) {
          AsyncStorage.setItem(LISTINGS_CACHE_KEY, JSON.stringify(list)).catch(() => {});
        }
        return list;
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

    const tabs: ListingFilterTab[] = FILTERS.map((f) => {
      const count = f.id === 'ALL' ? listings.length : byStatus.get(f.id) ?? 0;
      return { id: f.id, label: f.label, count };
    });

    const filtered =
      activeFilter === 'ALL'
        ? listings
        : listings.filter((l) => (l.statut || 'DRAFT') === activeFilter);

    return { filteredListings: filtered, filterTabs: tabs, showSkeleton };
  }, [listings, activeFilter, isCacheLoaded, isLoading, isFetching, isRefetching]);

  const handleAddPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    triggerGate();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* ── Barre de Filtres et Mode d'Affichage ─────────────────── */}
      <View style={styles.filtersBar}>
        <View style={{ flex: 1 }}>
          <MobileOwnerListingsFilterRail
            tabs={filterTabs}
            activeFilter={activeFilter}
            onSelectFilter={setActiveFilter}
          />
        </View>

        {/* View Mode Switcher (List / Grid) */}
        <View style={styles.viewModeToggle}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              setViewMode('list');
            }}
            style={[
              styles.viewModeBtn,
              viewMode === 'list' && styles.viewModeBtnActive,
            ]}
          >
            <List
              size={15}
              color={
                viewMode === 'list' ? colors.forest[950] : colors.neutral[500]
              }
            />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              setViewMode('grid');
            }}
            style={[
              styles.viewModeBtn,
              viewMode === 'grid' && styles.viewModeBtnActive,
            ]}
          >
            <LayoutGrid
              size={15}
              color={
                viewMode === 'grid' ? colors.forest[950] : colors.neutral[500]
              }
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Liste de Logements avec Pull to Refresh ─────────────── */}
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.lime[400]}
          />
        }
      >
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
            {Array.from({ length: 4 }).map((_, i) => (
              <MobileOwnerListingSkeleton key={i} viewMode={viewMode} />
            ))}
          </View>
        ) : filteredListings.length === 0 ? (
          <MobileOwnerListingsEmptyState hasFilter={activeFilter !== 'ALL'} onAddPress={handleAddPress} />
        ) : (
          <View
            style={
              viewMode === 'grid' ? styles.gridStack : styles.cardsStack
            }
          >
            {filteredListings.map((listing) => (
              <MobileOwnerListingCard
                key={listing.id}
                listing={listing}
                viewMode={viewMode}
                onToggleStatus={(id, currentStatus) =>
                  toggleStatus.mutate({ id, currentStatus })
                }
                onToggleDerniereMinute={(id, active) =>
                  toggleDerniereMinute.mutate({ id, active })
                }
                onDelete={(id) => deleteListing.mutate(id)}
              />
            ))}
          </View>
        )}

        {/* ── CTA Bas de Page pour Ajouter un bien ───────────── */}
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={handleAddPress}
          style={styles.bottomAddCTA}
        >
          <View style={styles.bottomAddIconCircle}>
            <Plus size={20} color={colors.lime[400]} strokeWidth={2.5} />
          </View>

          <View style={styles.bottomAddTextStack}>
            <Text style={styles.bottomAddTitle}>Ajouter un nouveau bien</Text>
            <Text style={styles.bottomAddDesc}>
              Publication 100% gratuite, vérification terrain et photos professionnelles.
            </Text>
          </View>
        </TouchableOpacity>
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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
    backgroundColor: colors.neutral[0],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  headerTitleStack: {
    flex: 1,
    paddingRight: 12,
  },
  eyebrow: {
    fontFamily: typography.fontBodyBold,
    fontSize: 10,
    color: colors.neutral[500],
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  title: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 24,
    color: colors.forest[950],
    letterSpacing: -0.3,
  },
  subtitle: {
    fontFamily: typography.fontBody,
    fontSize: 11.5,
    color: colors.neutral[500],
    marginTop: 3,
    lineHeight: 16,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.lime[400],
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    marginTop: 4,
    ...shadows.action,
  },
  addBtnText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 12.5,
    color: colors.forest[950],
  },

  // Filters Bar
  filtersBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral[0],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
    paddingVertical: 10,
  },
  viewModeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral[100],
    borderRadius: radius.pill,
    padding: 3,
    marginRight: 16,
    marginLeft: 4,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  viewModeBtn: {
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: radius.pill,
  },
  viewModeBtnActive: {
    backgroundColor: colors.lime[400],
  },

  // Main Scroll Container
  scrollContainer: {
    padding: 16,
    gap: 16,
    paddingBottom: 100,
  },
  cardsStack: {
    gap: 14,
  },
  gridStack: {
    gap: 16,
  },

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
  errorAlertText: {
    fontFamily: typography.fontBody,
    fontSize: 12,
    color: colors.error[700],
    flex: 1,
  },

  // Bottom CTA
  bottomAddCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.forest[950],
    borderRadius: radius.card,
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: colors.forest[800],
    ...shadows.xs,
  },
  bottomAddIconCircle: {
    width: 42,
    height: 42,
    borderRadius: radius.inner,
    backgroundColor: 'rgba(211, 242, 110, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(211, 242, 110, 0.30)',
  },
  bottomAddTextStack: {
    flex: 1,
    gap: 2,
  },
  bottomAddTitle: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 14,
    color: colors.neutral[0],
  },
  bottomAddDesc: {
    fontFamily: typography.fontBody,
    fontSize: 11,
    color: colors.forest[200],
    lineHeight: 15,
  },
});
