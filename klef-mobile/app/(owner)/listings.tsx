import React, { useState, useMemo, useCallback } from 'react';
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
import { Plus, LayoutGrid, List, AlertCircle } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { apiClient } from '../../shared/api/api-client';
import { colors, radius, shadows, typography } from '../../shared/theme/tokens';
import { MobileOwnerListingCard, MobileOwnerListingItem } from '../../features/listings/components/owner/MobileOwnerListingCard';
import { MobileOwnerListingsFilterRail, ListingFilterTab } from '../../features/listings/components/owner/MobileOwnerListingsFilterRail';
import { MobileOwnerListingsEmptyState } from '../../features/listings/components/owner/MobileOwnerListingsEmptyState';
import { MobileOwnerListingSkeleton } from '../../features/listings/components/owner/MobileOwnerListingSkeleton';

const FILTERS = [
  { id: 'ALL', label: 'Toutes' },
  { id: 'PUBLISHED', label: 'Publiées' },
  { id: 'PENDING_REVIEW', label: 'En révision' },
  { id: 'DRAFT', label: 'Brouillons' },
  { id: 'PAUSED', label: 'En pause' },
  { id: 'REJECTED', label: 'Rejetées' },
] as const;

// ── Mock data pour démonstration fluide lorsque déconnecté de l'API ──
const MOCK_FALLBACK_LISTINGS: MobileOwnerListingItem[] = [
  {
    id: '1',
    titre: 'Villa Ngor Vue Mer & Piscine Privée',
    ville: 'Dakar',
    commune: 'Ngor',
    prixBase: 65000,
    statut: 'PUBLISHED',
    typeLogement: 'Villa',
    capaciteMax: 8,
    derniereMinuteActive: true,
    photos: [
      { url: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?q=80&w=800&auto=format&fit=crop' },
    ],
  },
  {
    id: '2',
    titre: 'Duplex Almadies Premium Design',
    ville: 'Dakar',
    commune: 'Almadies',
    prixBase: 85000,
    statut: 'PUBLISHED',
    typeLogement: 'Duplex',
    capaciteMax: 6,
    derniereMinuteActive: false,
    photos: [
      { url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=800&auto=format&fit=crop' },
    ],
  },
  {
    id: '3',
    titre: 'Appartement Cozy Plateau Centre',
    ville: 'Dakar',
    commune: 'Plateau',
    prixBase: 35000,
    statut: 'PENDING_REVIEW',
    typeLogement: 'Appartement',
    capaciteMax: 3,
    derniereMinuteActive: false,
    photos: [
      { url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=800&auto=format&fit=crop' },
    ],
  },
  {
    id: '4',
    titre: 'Penthouse Fann Résidence Vue Océan',
    ville: 'Dakar',
    commune: 'Fann',
    prixBase: 120000,
    statut: 'DRAFT',
    typeLogement: 'Penthouse',
    capaciteMax: 10,
    derniereMinuteActive: false,
    photos: [],
  },
];

export default function OwnerListingsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [activeFilter, setActiveFilter] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [actionError, setActionError] = useState<string | null>(null);

  // ── Query listings ──────────────────────────────────────────
  const { data: listings = [], isLoading, isRefetching, refetch, error } = useQuery<MobileOwnerListingItem[]>({
    queryKey: ['listings', 'mine'],
    queryFn: async () => {
      const response = await apiClient.get<MobileOwnerListingItem[]>('/listings/me');
      return Array.isArray(response.data) ? response.data : [];
    },
  });

  const invalidate = useCallback(() => {
    setActionError(null);
    queryClient.invalidateQueries({ queryKey: ['listings', 'mine'] });
  }, [queryClient]);

  // ── Mutations ───────────────────────────────────────────────
  const toggleStatus = useMutation({
    mutationFn: async ({ id, currentStatus }: { id: string; currentStatus: string }) => {
      const endpoint = currentStatus === 'PUBLISHED' ? `/listings/${id}/pause` : `/listings/${id}/republier`;
      return apiClient.patch(endpoint);
    },
    onSuccess: invalidate,
    onError: (e: any) => {
      setActionError(e?.response?.data?.message || e?.message || 'Le changement de statut a échoué.');
    },
  });

  const toggleDerniereMinute = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      return apiClient.patch(`/listings/${id}`, { derniereMinuteActive: active });
    },
    onSuccess: invalidate,
    onError: (e: any) => {
      setActionError(e?.response?.data?.message || e?.message || 'La modification de la dernière minute a échoué.');
    },
  });

  const deleteListing = useMutation({
    mutationFn: async (id: string) => {
      return apiClient.delete(`/listings/${id}`);
    },
    onSuccess: invalidate,
    onError: (e: any) => {
      setActionError(e?.response?.data?.message || e?.message || 'La suppression du bien a échoué.');
    },
  });

  // ── Stats & Filtering ───────────────────────────────────────
  const { filteredListings, filterTabs } = useMemo(() => {
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

    return { filteredListings: filtered, filterTabs: tabs };
  }, [listings, activeFilter]);

  const handleAddPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    router.push('/(owner)/add-listing' as any);
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

        {isLoading ? (
          <View style={styles.cardsStack}>
            {Array.from({ length: 4 }).map((_, i) => (
              <MobileOwnerListingSkeleton key={i} viewMode={viewMode} />
            ))}
          </View>
        ) : filteredListings.length === 0 ? (
          <MobileOwnerListingsEmptyState hasFilter={activeFilter !== 'ALL'} />
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
