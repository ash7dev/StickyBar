import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Animated,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useLocalSearchParams } from 'expo-router';
import { SearchX, RotateCcw } from 'lucide-react-native';
import { colors, radius, typography, shadows } from '../../shared/theme/tokens';
import { apiClient } from '../../shared/api/api-client';
import { TenantSearchModal, SearchParams } from '../../shared/components/layout/TenantSearchModal';
import { ExplorerSortBottomSheet, SortOptionValue, SORT_OPTIONS } from '../../shared/components/layout/ExplorerSortBottomSheet';
import { ExplorerListingCard } from '../../shared/components/layout/ExplorerListingCard';
import { TenantSearchBarPill } from '../../shared/components/layout/TenantSearchBarPill';
import { ExplorerCategoryRail, CategoryItem } from '../../shared/components/layout/ExplorerCategoryRail';
import { ExplorerActiveFilters } from '../../shared/components/layout/ExplorerActiveFilters';
import { TenantExplorerMapView } from '../../shared/components/layout/TenantExplorerMapView';
import { useListingCacheStore } from '../../shared/stores/listing-cache.store';
import { useExplorerViewStore } from '../../shared/stores/explorer-view.store';
import { ListingItem } from '../../shared/components/ui/TenantListingCard';

function getUpcomingWeekendDates(): { start: string; end: string } {
  const now = new Date();
  const dayOfWeek = now.getDay();
  let saturdayOffset = dayOfWeek === 5 ? 1 : dayOfWeek === 6 ? 0 : dayOfWeek === 0 ? 6 : 6 - dayOfWeek;

  const saturday = new Date(now);
  saturday.setDate(now.getDate() + saturdayOffset);
  const sunday = new Date(saturday);
  sunday.setDate(saturday.getDate() + 1);

  const toISO = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
  };

  return { start: toISO(saturday), end: toISO(sunday) };
}

function ShimmerBlock({ width, height, style }: { width: string | number; height: number; style?: any }) {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.45, 0.9],
  });

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius: 10,
          backgroundColor: colors.neutral[200],
          opacity,
        },
        style,
      ]}
    />
  );
}

function ExplorerCardSkeleton() {
  return (
    <View style={styles.skeletonCard}>
      <ShimmerBlock width="100%" height={260} style={{ borderRadius: 16 }} />
      <View style={styles.skeletonInfoBlock}>
        <View style={styles.skeletonLocationRow}>
          <ShimmerBlock width={12} height={12} style={{ borderRadius: 6 }} />
          <ShimmerBlock width="50%" height={12} />
        </View>
        <ShimmerBlock width="75%" height={16} />
        <ShimmerBlock width="40%" height={11} />
        <View style={styles.skeletonSeparator} />
        <ShimmerBlock width="35%" height={16} />
      </View>
    </View>
  );
}

function ExplorerSkeletonList() {
  return (
    <View style={styles.skeletonContainer}>
      {Array.from({ length: 3 }).map((_, i) => (
        <ExplorerCardSkeleton key={i} />
      ))}
    </View>
  );
}

const EXPLORER_CACHE_KEY = 'klef_explorer_cache_v1';

export default function ExplorerScreen() {
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [sortBottomSheetVisible, setSortBottomSheetVisible] = useState(false);
  const [searchParams, setSearchParams] = useState<SearchParams>({});
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedSousType, setSelectedSousType] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [currentSort, setCurrentSort] = useState<SortOptionValue>('pertinence');
  const [filterDerniereMinute, setFilterDerniereMinute] = useState(false);

  const routeParams = useLocalSearchParams<{
    category?: string;
    filterType?: string;
    filterSousType?: string;
    filterDerniereMinute?: string;
    filterWeekend?: string;
    ville?: string;
    arrivee?: string;
    depart?: string;
    nbNuits?: string;
    openSearch?: string;
  }>();

  useEffect(() => {
    if (routeParams.openSearch === 'true') {
      setSearchModalVisible(true);
    }
    if (routeParams.category === 'weekend' || routeParams.filterWeekend === 'true') {
      const dates = getUpcomingWeekendDates();
      setActiveCategory('weekend');
      setSelectedType('');
      setSelectedSousType('');
      setFilterDerniereMinute(false);
      setSearchParams((prev) => ({
        ...prev,
        arrivee: dates.start,
        depart: dates.end,
        nbNuits: 2,
      }));
    } else if (routeParams.category) {
      setActiveCategory(routeParams.category);
      setSelectedType(routeParams.filterType || '');
      setSelectedSousType(routeParams.filterSousType || '');
      setFilterDerniereMinute(routeParams.filterDerniereMinute === 'true');
    }
    if (routeParams.ville || routeParams.arrivee || routeParams.depart) {
      setSearchParams((prev) => ({
        ...prev,
        ...(routeParams.ville && { ville: routeParams.ville }),
        ...(routeParams.arrivee && { arrivee: routeParams.arrivee }),
        ...(routeParams.depart && { depart: routeParams.depart }),
        ...(routeParams.nbNuits && { nbNuits: Number(routeParams.nbNuits) }),
      }));
    }
  }, [
    routeParams.category,
    routeParams.filterType,
    routeParams.filterSousType,
    routeParams.filterDerniereMinute,
    routeParams.filterWeekend,
    routeParams.ville,
    routeParams.arrivee,
    routeParams.depart,
    routeParams.nbNuits,
    routeParams.openSearch,
  ]);

  const { viewMode } = useExplorerViewStore();

  const [listings, setListings] = useState<ListingItem[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isFiltering, setIsFiltering] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // 1. Instant 0ms disk cache hydration
  useEffect(() => {
    AsyncStorage.getItem(EXPLORER_CACHE_KEY)
      .then((raw) => {
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setListings(parsed);
              setTotal(parsed.length);
              setLoading(false);
            }
          } catch (e) {
            console.warn('[ExplorerScreen] Erreur lecture cache disque:', e);
          }
        }
      })
      .catch((err) => console.warn('[ExplorerScreen] Erreur AsyncStorage:', err));
  }, []);

  const requestIdRef = useRef(0);
  const { prefillFromFeed } = useListingCacheStore();

  const sortLabel = currentSort !== 'pertinence'
    ? SORT_OPTIONS.find((s) => s.value === currentSort)?.label
    : undefined;

  const fetchListings = async (pageToFetch = 1, append = false, isRefresh = false) => {
    const currentRequestId = ++requestIdRef.current;

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else if (append) {
        setLoadingMore(true);
      } else if (listings.length === 0) {
        setLoading(true);
      } else {
        setIsFiltering(true);
      }

      const mapSortToBackend = (s?: SortOptionValue): string | undefined => {
        if (s === 'prix_asc') return 'price_asc';
        if (s === 'prix_desc') return 'price_desc';
        if (s === 'note_desc') return 'rated';
        if (s === 'recent') return 'newest';
        return undefined;
      };

      const sortVal = mapSortToBackend(currentSort);

      const params: Record<string, any> = {
        ...(searchParams.ville?.trim() && { ville: searchParams.ville.trim() }),
        ...(searchParams.arrivee && { dateDebut: searchParams.arrivee }),
        ...(searchParams.depart && { dateFin: searchParams.depart }),
        ...(selectedSousType && { sousType: selectedSousType }),
        ...(selectedType && { type: selectedType }),
        ...(filterDerniereMinute && { derniereMinute: true }),
        ...(sortVal && { sort: sortVal }),
        page: pageToFetch,
        limit: 20,
      };

      const response = await apiClient.get<any>('/listings/search', { params });

      if (currentRequestId !== requestIdRef.current) return;

      const fetchedData = response.data?.data || response.data?.items || response.data || [];
      const fetchedTotal = response.data?.meta?.total || response.data?.total || fetchedData.length;

      let finalData = fetchedData;
      if (filterDerniereMinute && Array.isArray(fetchedData)) {
        finalData = fetchedData.filter((item: any) => item.derniereMinuteActive);
      }

      if (append) {
        setListings((prev) => [...prev, ...finalData]);
      } else {
        setListings(finalData);
        // Persist default catalog on disk
        if (!selectedType && !selectedSousType && !searchParams.ville && finalData.length > 0) {
          AsyncStorage.setItem(EXPLORER_CACHE_KEY, JSON.stringify(finalData)).catch(() => {});
        }
      }
      setTotal(filterDerniereMinute ? finalData.length : fetchedTotal);
      setPage(pageToFetch);

      if (Array.isArray(fetchedData) && fetchedData.length > 0) {
        prefillFromFeed([{ id: 'explorer_catalog', listings: fetchedData }]);

        // Prefetch top images for smooth rendering
        fetchedData.slice(0, 4).forEach((item: any) => {
          const coverUrl = item.photos?.[0] || item.coverUrl || item.imageUrl;
          if (coverUrl && typeof coverUrl === 'string' && coverUrl.startsWith('http')) {
            Image.prefetch(coverUrl).catch(() => {});
          }
        });
      }
    } catch (err) {
      if (currentRequestId === requestIdRef.current) {
        console.warn('[ExplorerScreen] Erreur recherche catalogue:', err);
      }
    } finally {
      if (currentRequestId === requestIdRef.current) {
        setLoading(false);
        setIsFiltering(false);
        setLoadingMore(false);
        setRefreshing(false);
      }
    }
  };

  useEffect(() => {
    fetchListings(1, false);
  }, [selectedType, selectedSousType, searchParams.ville, searchParams.arrivee, searchParams.depart, currentSort, filterDerniereMinute]);

  const handleCategorySelect = useCallback((cat: CategoryItem) => {
    setActiveCategory(cat.key);
    setSelectedType(cat.filterType || '');
    setSelectedSousType(cat.filterSousType || '');
    setFilterDerniereMinute(Boolean(cat.filterDerniereMinute));

    if (cat.filterWeekend) {
      const dates = getUpcomingWeekendDates();
      setSearchParams((prev) => ({
        ...prev,
        arrivee: dates.start,
        depart: dates.end,
        nbNuits: 2,
      }));
    }
  }, []);

  const handleRefresh = useCallback(() => {
    fetchListings(1, false, true);
  }, [selectedType, selectedSousType, searchParams, currentSort, filterDerniereMinute]);

  const handleLoadMore = () => {
    if (!loading && !loadingMore && listings.length < total) {
      fetchListings(page + 1, true);
    }
  };

  const hasMore = listings.length < total;

  const handleClearVille = useCallback(() => {
    setSearchParams((prev) => ({ ...prev, ville: undefined }));
  }, []);

  const handleClearDates = useCallback(() => {
    setSearchParams((prev) => ({ ...prev, arrivee: undefined, depart: undefined, nbNuits: undefined }));
  }, []);

  const handleClearSort = useCallback(() => {
    setCurrentSort('pertinence');
  }, []);

  const formatDate = (d?: string) => {
    if (!d) return null;
    try {
      const date = new Date(d);
      return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    } catch {
      return d;
    }
  };

  const explorerSubtitle = searchParams.arrivee
    ? `${formatDate(searchParams.arrivee)}${searchParams.depart ? ` → ${formatDate(searchParams.depart)}` : ''}`
    : searchParams.nbNuits
    ? `${searchParams.nbNuits} nuits • Sénégal`
    : 'Destination • Dates • Tout Sénégal';

  const renderStickyHeader = () => (
    <View style={styles.stickyHeader}>
      <View style={styles.paddingHorizontal}>
        <TenantSearchBarPill
          destination={searchParams.ville}
          subtitle={explorerSubtitle}
          onPress={() => setSearchModalVisible(true)}
          onFilterPress={() => setSortBottomSheetVisible(true)}
        />
      </View>
      <ExplorerCategoryRail
        activeCategory={activeCategory}
        onSelect={handleCategorySelect}
      />
      <ExplorerActiveFilters
        ville={searchParams.ville}
        dateArrivee={searchParams.arrivee}
        dateDepart={searchParams.depart}
        sortLabel={sortLabel}
        total={total}
        onClearVille={handleClearVille}
        onClearDates={handleClearDates}
        onClearSort={handleClearSort}
      />
    </View>
  );

  const renderFooter = () => {
    if (loadingMore) {
      return (
        <View style={styles.footerLoader}>
          <ActivityIndicator size="small" color={colors.forest[800]} />
          <Text style={styles.footerLoaderText}>Chargement en cours...</Text>
        </View>
      );
    }

    if (!hasMore && listings.length > 0) {
      return (
        <View style={styles.footerEnd}>
          <View style={styles.endDivider} />
          <Text style={styles.endOfListText}>Vous avez tout explore</Text>
          <Text style={styles.endOfListSub}>
            {total} logement{total > 1 ? 's' : ''} affiche{total > 1 ? 's' : ''}
          </Text>
        </View>
      );
    }

    return <View style={{ height: 24 }} />;
  };

  const renderEmpty = () => {
    if (loading || isFiltering || refreshing) {
      return (
        <View style={styles.paddingHorizontal}>
          <ExplorerSkeletonList />
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconCircle}>
          <SearchX size={28} color={colors.neutral[400]} />
        </View>
        <Text style={styles.emptyTitle}>Aucun hebergement disponible</Text>
        <Text style={styles.emptySubtitle}>
          Modifiez vos criteres ou explorez d'autres categories pour trouver votre logement ideal.
        </Text>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            setSearchParams({});
            setSelectedType('');
            setSelectedSousType('');
            setActiveCategory('all');
            setCurrentSort('pertinence');
            setFilterDerniereMinute(false);
          }}
          style={styles.resetBtn}
        >
          <RotateCcw size={13} color={colors.neutral[0]} />
          <Text style={styles.resetBtnText}>Reinitialiser</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.mainWrapper}>
      {viewMode === 'list' ? (
        <FlatList
          data={listings}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.paddingHorizontal}>
              <ExplorerListingCard
                listing={item}
                onPress={() => router.push(`/listing/${item.id}` as any)}
              />
            </View>
          )}
          ListHeaderComponent={renderStickyHeader}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmpty}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.4}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.flatListContent}
          stickyHeaderIndices={[0]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.forest[800]}
              colors={[colors.forest[800]]}
            />
          }
        />
      ) : (
        <View style={{ flex: 1 }}>
          {renderStickyHeader()}
          <TenantExplorerMapView
            listings={listings}
            selectedType={selectedType}
            selectedSousType={selectedSousType}
            onSelectListing={(item) => router.push(`/listing/${item.id}` as any)}
          />
        </View>
      )}

      <ExplorerSortBottomSheet
        visible={sortBottomSheetVisible}
        currentSort={currentSort}
        onSelectSort={(s) => setCurrentSort(s)}
        onClose={() => setSortBottomSheetVisible(false)}
      />

      <TenantSearchModal
        initialVille={searchParams.ville || ''}
        onClose={() => setSearchModalVisible(false)}
        onSearch={(p) => setSearchParams(p)}
        visible={searchModalVisible}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  mainWrapper: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
  stickyHeader: {
    backgroundColor: colors.neutral[0],
    zIndex: 10,
    paddingTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 3,
  },
  flatListContent: {
    paddingBottom: 140,
  },
  paddingHorizontal: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  skeletonContainer: {
    gap: 24,
    marginTop: 12,
  },
  skeletonCard: {
    gap: 12,
  },
  skeletonInfoBlock: {
    gap: 8,
    paddingHorizontal: 2,
  },
  skeletonLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  skeletonSeparator: {
    height: 1,
    backgroundColor: colors.neutral[200],
    width: '100%',
    opacity: 0.5,
    marginVertical: 2,
  },
  emptyContainer: {
    width: '100%',
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 32,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 18,
    color: colors.forest[900],
    textAlign: 'center',
  },
  emptySubtitle: {
    fontFamily: typography.fontBody,
    fontSize: 13,
    color: colors.neutral[600],
    textAlign: 'center',
    lineHeight: 18,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.forest[950],
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: radius.pill,
    marginTop: 4,
    ...shadows.sm,
  },
  resetBtnText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 13,
    color: colors.neutral[0],
  },
  footerLoader: {
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  footerLoaderText: {
    fontFamily: typography.fontBodyMedium,
    fontSize: 12,
    color: colors.neutral[600],
  },
  footerEnd: {
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  endDivider: {
    width: 40,
    height: 2,
    borderRadius: 1,
    backgroundColor: colors.neutral[300],
    marginBottom: 12,
  },
  endOfListText: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 14,
    color: colors.forest[800],
  },
  endOfListSub: {
    fontFamily: typography.fontBody,
    fontSize: 11,
    color: colors.neutral[500],
  },
});
