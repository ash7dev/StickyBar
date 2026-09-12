import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '../../api/api-client';
import { TenantListingsSection } from './TenantListingsSection';
import { TenantFeedSkeleton } from './TenantFeedSkeleton';
import { ListingItem } from '../ui/TenantListingCard';
import { colors } from '../../theme/tokens';
import { useListingCacheStore } from '../../stores/listing-cache.store';

interface FeedSectionData {
  id: string;
  listings: ListingItem[];
}

interface FeedApiResponse {
  sections: FeedSectionData[];
}

interface TenantFeedSectionsProps {
  selectedType?: string;
  selectedSousType?: string;
  onSelectListing?: (listing: ListingItem) => void;
}

const FEED_CACHE_KEY = 'klef_tenant_feed_cache_v1';

const SECTION_CONFIG: Record<
  string,
  { title: string; subtitle?: string }
> = {
  popular: {
    title: 'Les plus populaires',
    subtitle: 'Plébiscités par nos voyageurs',
  },
  newest: {
    title: 'Nouveautés',
    subtitle: 'Derniers biens d’exception ajoutés',
  },
  rated: {
    title: 'Les mieux notés',
    subtitle: 'Excellence et qualité garanties',
  },
  'villa-pool': {
    title: 'Villas avec piscine',
    subtitle: 'Pour des vacances inoubliables au soleil',
  },
  'villa-luxe': {
    title: 'Villas de luxe',
    subtitle: 'Le summum du confort & prestige',
  },
  'villa-sea': {
    title: 'Villas bord de mer',
    subtitle: 'Accès direct et vue imprenable sur l’océan',
  },
  penthouse: {
    title: 'Penthouses',
    subtitle: 'Au sommet des plus beaux quartiers',
  },
  loft: {
    title: 'Lofts & Espaces modernes',
    subtitle: 'Design contemporain et hauts plafonds',
  },
  suite: {
    title: 'Suites meublées',
    subtitle: 'Confort hôtelier et totale autonomie',
  },
  maison: {
    title: 'Maisons entières',
    subtitle: 'Idéal pour familles et grands groupes',
  },
  'zone-almadies': {
    title: 'Almadies, Dakar',
    subtitle: 'Le quartier résidentiel prisé',
  },
  'zone-saly': {
    title: 'Saly Portudal',
    subtitle: 'La station balnéaire incontournable',
  },
  'zone-ngor': {
    title: 'Ngor',
    subtitle: 'Charme traditionnel et bord de mer',
  },
  'zone-somone': {
    title: 'Lagune de la Somone',
    subtitle: 'Calme et nature préservée',
  },
  'zone-ngaparou': {
    title: 'Ngaparou',
    subtitle: 'Tranquillité sur la Petite Côte',
  },
  'zone-mermoz': {
    title: 'Mermoz',
    subtitle: 'Quartier central et élégant',
  },
};

const getSectionConfig = (sectionId: string) => {
  if (SECTION_CONFIG[sectionId]) {
    return SECTION_CONFIG[sectionId];
  }
  if (sectionId.startsWith('zone-')) {
    const rawName = sectionId.replace('zone-', '').replace(/-/g, ' ');
    const title = rawName.charAt(0).toUpperCase() + rawName.slice(1);
    return {
      title,
      subtitle: `Logements d'exception à ${title}`,
    };
  }
  return {
    title: 'Hébergements sélectionnés',
    subtitle: 'Découvrez nos meilleurs logements vérifiés',
  };
};

export function TenantFeedSections({
  selectedType,
  selectedSousType,
  onSelectListing,
}: TenantFeedSectionsProps) {
  const { setFeed, getFeed } = useListingCacheStore();
  const memoryFeed = getFeed();
  const [diskCacheFeed, setDiskCacheFeed] = useState<FeedSectionData[] | null>(memoryFeed || null);
  const [isCacheLoaded, setIsCacheLoaded] = useState(false);

  // 1. Hydratation Persistante Instantanée (0ms sur démarrage à froid)
  useEffect(() => {
    AsyncStorage.getItem(FEED_CACHE_KEY)
      .then((raw) => {
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setDiskCacheFeed(parsed);
              setFeed(parsed as any);
            }
          } catch (e) {
            console.warn('[TenantFeedSections] Erreur de lecture du cache disque:', e);
          }
        }
      })
      .catch((err) => console.warn('[TenantFeedSections] Erreur AsyncStorage:', err))
      .finally(() => setIsCacheLoaded(true));
  }, [setFeed]);

  // 2. Query avec SWR et Cache Persistant sur disque
  const {
    data: feedSectionsData = [],
    isLoading,
    isFetching,
    isRefetching,
    error: queryError,
  } = useQuery<FeedSectionData[]>({
    queryKey: ['tenant', 'feed'],
    queryFn: async () => {
      try {
        const response = await apiClient.get<FeedApiResponse>('/listings/feed');
        const sections = Array.isArray(response.data?.sections) ? response.data.sections : [];

        if (sections.length > 0) {
          AsyncStorage.setItem(FEED_CACHE_KEY, JSON.stringify(sections)).catch(() => {});
          setFeed(sections as any);

          // Prefetch top 6 cover images for smooth display
          sections.slice(0, 3).flatMap((s) => s.listings || []).slice(0, 6).forEach((item: any) => {
            const coverUrl = item.photos?.[0] || item.coverUrl || item.imageUrl;
            if (coverUrl && typeof coverUrl === 'string' && coverUrl.startsWith('http')) {
              Image.prefetch(coverUrl).catch(() => {});
            }
          });
        }
        return sections;
      } catch (err) {
        if (diskCacheFeed && diskCacheFeed.length > 0) {
          return diskCacheFeed;
        }
        throw err;
      }
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    initialData: diskCacheFeed || undefined,
  });

  const feedSections = feedSectionsData.length > 0 ? feedSectionsData : (diskCacheFeed || []);

  const isPendingFetch = isLoading || isFetching || isRefetching || !isCacheLoaded;
  const showSkeleton = isPendingFetch && feedSections.length === 0;

  if (showSkeleton) {
    return <TenantFeedSkeleton />;
  }

  if (queryError && feedSections.length === 0) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>
          {(queryError as any)?.response?.data?.message || (queryError as any)?.message || 'Impossible de charger les annonces. Veuillez réessayer.'}
        </Text>
      </View>
    );
  }

  // Filtrage par sousType ou type si sélectionné dans la barre de filtres
  const filteredSections = feedSections
    .map((sec: FeedSectionData) => {
      let listings = sec.listings;

      if (selectedSousType) {
        listings = listings.filter(
          (l: ListingItem) =>
            l.sousType?.toLowerCase() === selectedSousType.toLowerCase() ||
            l.type?.toLowerCase() === selectedSousType.toLowerCase()
        );
      } else if (selectedType) {
        listings = listings.filter(
          (l: ListingItem) => l.type?.toLowerCase() === selectedType.toLowerCase()
        );
      }

      return {
        ...sec,
        listings,
      };
    })
    .filter((sec: FeedSectionData) => sec.listings.length > 0);

  if (filteredSections.length === 0) {
    if (isPendingFetch) {
      return <TenantFeedSkeleton />;
    }
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>Aucun hébergement trouvé</Text>
        <Text style={styles.emptySubtitle}>
          Aucun logement ne correspond au filtre sélectionné pour le moment.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {filteredSections.map((sec) => {
        const config = getSectionConfig(sec.id);
        return (
          <TenantListingsSection
            key={sec.id}
            title={config.title}
            subtitle={config.subtitle}
            listings={sec.listings}
            onSelectListing={onSelectListing}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.neutral[600],
  },
  errorContainer: {
    padding: 24,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 13,
    color: colors.error[600],
    textAlign: 'center',
  },
  emptyContainer: {
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    gap: 6,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.forest[950],
  },
  emptySubtitle: {
    fontSize: 12,
    color: colors.neutral[600],
    textAlign: 'center',
  },
});
