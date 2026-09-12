import React, { useState, useCallback } from 'react';
import { StyleSheet, ScrollView, View, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { colors } from '../../shared/theme/tokens';
import { TenantSearchBarPill } from '../../shared/components/layout/TenantSearchBarPill';
import { TenantSearchModal, SearchParams } from '../../shared/components/layout/TenantSearchModal';
import { ExplorerCategoryRail, CategoryItem } from '../../shared/components/layout/ExplorerCategoryRail';
import { HomeDealsBanner } from '../../shared/components/layout/HomeDealsBanner';
import { TenantFeedSections } from '../../shared/components/layout/TenantFeedSections';

export default function HomeScreen() {
  const queryClient = useQueryClient();
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [searchParams, setSearchParams] = useState<SearchParams>({});
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setIsRefreshing(true);
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['tenant', 'feed'] }),
        queryClient.invalidateQueries({ queryKey: ['tenant', 'deals'] }),
      ]);
    } catch (err) {
      console.warn('[HomeScreen] Refresh error:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, [queryClient]);

  const handleSearch = (params: SearchParams) => {
    setSearchParams(params);
    setSearchModalVisible(false);
    // Redirige directement vers la page Explorer avec les critères de recherche
    router.push({
      pathname: '/(tenant)/explorer',
      params: {
        ...(params.ville && { ville: params.ville }),
        ...(params.arrivee && { arrivee: params.arrivee }),
        ...(params.depart && { depart: params.depart }),
        ...(params.nbNuits && { nbNuits: params.nbNuits.toString() }),
      },
    });
  };

  const handleCategorySelect = useCallback((cat: CategoryItem) => {
    Haptics.selectionAsync().catch(() => {});
    // Redirige directement vers la page Explorer avec la catégorie sélectionnée
    router.push({
      pathname: '/(tenant)/explorer',
      params: {
        category: cat.key,
        ...(cat.filterType && { filterType: cat.filterType }),
        ...(cat.filterSousType && { filterSousType: cat.filterSousType }),
        ...(cat.filterDerniereMinute && { filterDerniereMinute: 'true' }),
      },
    });
  }, []);

  return (
    <View style={styles.mainWrapper}>
      {/* Header Mirroir identique à la page Explorer */}
      <View style={styles.stickyHeader}>
        <View style={styles.paddingHorizontal}>
          <TenantSearchBarPill
            destination={searchParams.ville}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              router.push({
                pathname: '/(tenant)/explorer',
                params: { openSearch: 'true' },
              });
            }}
            onFilterPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              router.push({
                pathname: '/(tenant)/explorer',
                params: { openSearch: 'true' },
              });
            }}
            subtitle={
              searchParams.nbNuits
                ? `${searchParams.nbNuits} nuits • Sénégal`
                : 'Destination • Dates • Tout Sénégal'
            }
          />
        </View>

        {/* Category Rail Premium */}
        <ExplorerCategoryRail
          activeCategory="all"
          onSelect={handleCategorySelect}
        />
      </View>

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.lime[400]}
            colors={[colors.forest[800]]}
          />
        }
      >
        {/* 🔥 Smart Weekend Deals Banner */}
        <HomeDealsBanner
          onSelectListing={(listing) => router.push(`/listing/${listing.id}` as any)}
        />

        {/* Feed Sections */}
        <TenantFeedSections
          onSelectListing={(listing) => router.push(`/listing/${listing.id}` as any)}
        />
      </ScrollView>

      {/* Modale de Recherche Bottom Sheet */}
      <TenantSearchModal
        initialVille={searchParams.ville || ''}
        onClose={() => setSearchModalVisible(false)}
        onSearch={handleSearch}
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
  paddingHorizontal: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  container: {
    paddingTop: 14,
    paddingBottom: 140,
    gap: 12,
  },
});
