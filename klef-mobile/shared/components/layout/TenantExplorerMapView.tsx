import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { Image as ExpoImage } from 'expo-image';
import { Star, ChevronRight, RefreshCw } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors, radius, typography } from '../../theme/tokens';
import { ListingItem } from '../ui/TenantListingCard';
import { TenantPriceDisplay } from '../ui/TenantPriceDisplay';
import { useListingCacheStore } from '../../stores/listing-cache.store';
import { apiClient } from '../../api/api-client';

import { useCurrencyStore } from '../../stores/currency.store';

interface ExtendedListingItem extends ListingItem {
  latitude?: number | string;
  longitude?: number | string;
}

interface TenantExplorerMapViewProps {
  listings?: ExtendedListingItem[];
  onSelectListing: (listing: ExtendedListingItem) => void;
  selectedType?: string;
  selectedSousType?: string;
}

const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  dakar: { lat: 14.7167, lng: -17.4677 },
  almadies: { lat: 14.7478, lng: -17.5256 },
  ngor: { lat: 14.7553, lng: -17.5186 },
  yoff: { lat: 14.7594, lng: -17.4647 },
  mermoz: { lat: 14.7081, lng: -17.4722 },
  plateau: { lat: 14.6678, lng: -17.4372 },
  saly: { lat: 14.4442, lng: -17.0203 },
  somone: { lat: 14.4842, lng: -17.0805 },
  mbour: { lat: 14.4225, lng: -16.9639 },
  thies: { lat: 14.7910, lng: -16.9256 },
  'saint-louis': { lat: 16.0326, lng: -16.4818 },
  'cap skirring': { lat: 12.3736, lng: -16.7442 },
};

export function TenantExplorerMapView({
  listings: propListings,
  onSelectListing,
  selectedType,
  selectedSousType,
}: TenantExplorerMapViewProps) {
  const mapRef = useRef<MapView>(null);
  const { formatPrice } = useCurrencyStore();
  const feedSections = useListingCacheStore((state) => state.feedSections);
  const setFeed = useListingCacheStore((state) => state.setFeed);

  const [loading, setLoading] = useState(false);
  const [internalListings, setInternalListings] = useState<ExtendedListingItem[]>([]);

  // 1. Déduire les listings du store si les props sont vides
  useEffect(() => {
    let list: ExtendedListingItem[] = [];
    if (propListings && propListings.length > 0) {
      list = propListings;
    } else if (feedSections && feedSections.length > 0) {
      const ids = new Set();
      feedSections.forEach((sec) => {
        if (Array.isArray(sec.listings)) {
          sec.listings.forEach((item) => {
            if (item?.id && !ids.has(item.id)) {
              ids.add(item.id);
              list.push(item);
            }
          });
        }
      });
    }
    setInternalListings(list);
  }, [propListings, feedSections]);

  // 2. Si aucune donnée dans les props ni dans le store, fetcher l'API directement
  useEffect(() => {
    if (internalListings.length === 0 && (!feedSections || feedSections.length === 0)) {
      setLoading(true);
      apiClient
        .get<any>('/listings/feed')
        .then((res) => {
          if (res.data && Array.isArray(res.data.sections)) {
            setFeed(res.data.sections);
          }
        })
        .catch((err) => {
          console.warn('[TenantExplorerMapView] Erreur chargement feed carte:', err);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, []);

  // 3. Filtrer par type / sous-type si sélectionné
  const filteredListings = React.useMemo(() => {
    let res = internalListings;
    if (selectedSousType) {
      res = res.filter(
        (l) =>
          l.sousType?.toLowerCase().includes(selectedSousType.toLowerCase()) ||
          l.type?.toLowerCase().includes(selectedSousType.toLowerCase())
      );
    } else if (selectedType) {
      res = res.filter((l) => l.type?.toLowerCase() === selectedType.toLowerCase());
    }
    return res;
  }, [internalListings, selectedType, selectedSousType]);

  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (filteredListings.length > 0 && (!selectedId || !filteredListings.some((l) => l.id === selectedId))) {
      setSelectedId(filteredListings[0].id);
    }
  }, [filteredListings]);

  const selectedListing = filteredListings.find((l) => l.id === selectedId) || filteredListings[0];

  // Résolution des coordonnées géographiques
  const mappedListings = React.useMemo(() => {
    return filteredListings.map((l, index) => {
      let lat = 14.7167;
      let lng = -17.4677;

      if (l.latitude && l.longitude) {
        lat = Number(l.latitude);
        lng = Number(l.longitude);
      } else {
        const key = (l.quartier || l.ville || '').toLowerCase().trim();
        const foundCityKey = Object.keys(CITY_COORDINATES).find((c) => key.includes(c));

        if (foundCityKey) {
          lat = CITY_COORDINATES[foundCityKey].lat;
          lng = CITY_COORDINATES[foundCityKey].lng;
        }

        const offsetLat = Math.sin(index * 2.5) * 0.014 + (index % 4) * 0.003;
        const offsetLng = Math.cos(index * 2.5) * 0.014 - (index % 3) * 0.003;
        lat += offsetLat;
        lng += offsetLng;
      }

      return { ...l, lat, lng };
    });
  }, [filteredListings]);

  const handleSelectMarker = (item: (typeof mappedListings)[0]) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setSelectedId(item.id);
    mapRef.current?.animateToRegion(
      {
        latitude: item.lat,
        longitude: item.lng,
        latitudeDelta: 0.04,
        longitudeDelta: 0.04,
      },
      350
    );
  };

  const mainPhotoUrl = (item: ExtendedListingItem) => {
    if (Array.isArray(item.photos) && item.photos.length > 0) {
      return typeof item.photos[0] === 'string' ? item.photos[0] : item.photos[0].url;
    }
    if (typeof item.photos === 'string') return item.photos;
    return 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&auto=format&fit=crop&q=80';
  };

  if (loading && mappedListings.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.forest[600]} />
        <Text style={styles.loadingText}>Chargement de la carte des logements...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_DEFAULT}
        style={styles.map}
        initialRegion={{
          latitude: mappedListings[0]?.lat || 14.7167,
          longitude: mappedListings[0]?.lng || -17.4677,
          latitudeDelta: 0.14,
          longitudeDelta: 0.14,
        }}
        showsUserLocation
        showsCompass={false}
      >
        {mappedListings.map((item) => {
          const isSelected = item.id === selectedId;
          return (
            <Marker
              key={item.id}
              coordinate={{ latitude: item.lat, longitude: item.lng }}
              onPress={() => handleSelectMarker(item)}
            >
              <View style={[styles.markerPill, isSelected && styles.markerPillSelected]}>
                <Text style={[styles.markerText, isSelected && styles.markerTextSelected]}>
                  {formatPrice(item.prixBase)}
                </Text>
              </View>
            </Marker>
          );
        })}
      </MapView>

      {/* Carte d'aperçu flottante en bas de l'écran */}
      {selectedListing ? (
        <View style={styles.previewContainer}>
          <TouchableOpacity
            activeOpacity={0.92}
            onPress={() => onSelectListing(selectedListing)}
            style={styles.previewCard}
          >
            <ExpoImage
              source={{ uri: mainPhotoUrl(selectedListing) }}
              style={styles.previewImage}
              contentFit="cover"
              transition={200}
            />

            <View style={styles.previewInfo}>
              <View style={styles.headerRow}>
                <Text style={styles.typeText}>{selectedListing.type || 'Logement'}</Text>
                <View style={styles.ratingRow}>
                  <Star size={12} color={colors.gold[500]} fill={colors.gold[500]} />
                  <Text style={styles.ratingText}>
                    {selectedListing.note ? Number(selectedListing.note).toFixed(1) : '4.8'}
                  </Text>
                </View>
              </View>

              <Text style={styles.titleText} numberOfLines={1}>
                {selectedListing.titre}
              </Text>

              <Text style={styles.locationText} numberOfLines={1}>
                {selectedListing.ville}
                {selectedListing.quartier ? ` • ${selectedListing.quartier}` : ''}
              </Text>

              <View style={styles.footerRow}>
                <TenantPriceDisplay
                  prixBase={selectedListing.prixBase}
                  derniereMinuteActive={selectedListing.derniereMinuteActive}
                  size="sm"
                  reserveSpace={false}
                />

                <View style={styles.actionBtn}>
                  <Text style={styles.actionBtnText}>Voir</Text>
                  <ChevronRight size={14} color={colors.neutral[0]} />
                </View>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.noResultsBanner}>
          <Text style={styles.noResultsText}>Aucun logement disponible pour ce filtre sur la carte</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 540,
    borderRadius: radius.card,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: colors.neutral[100],
  },
  loadingContainer: {
    width: '100%',
    height: 540,
    borderRadius: radius.card,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontFamily: typography.fontBodyMedium,
    fontSize: 13,
    color: colors.forest[800],
  },
  map: {
    width: '100%',
    height: '100%',
  },
  markerPill: {
    backgroundColor: colors.forest[950],
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.neutral[0],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 5,
  },
  markerPillSelected: {
    backgroundColor: colors.lime[400],
    borderColor: colors.forest[950],
    transform: [{ scale: 1.12 }],
  },
  markerText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 12,
    color: colors.neutral[0],
  },
  markerTextSelected: {
    color: colors.forest[950],
  },
  previewContainer: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    zIndex: 10,
  },
  previewCard: {
    flexDirection: 'row',
    backgroundColor: colors.neutral[0],
    borderRadius: radius.card,
    padding: 10,
    gap: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  previewImage: {
    width: 90,
    height: 90,
    borderRadius: radius.inner,
    backgroundColor: colors.neutral[200],
  },
  previewInfo: {
    flex: 1,
    justifyContent: 'space-between',
    gap: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  typeText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 11,
    color: colors.forest[600],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 12,
    color: colors.forest[900],
  },
  titleText: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: typography.sizes.md,
    color: colors.forest[950],
  },
  locationText: {
    fontFamily: typography.fontBody,
    fontSize: 12,
    color: colors.neutral[600],
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  priceText: {
    fontFamily: typography.fontBodyExtraBold,
    fontSize: 15,
    color: colors.forest[900],
  },
  perNightText: {
    fontFamily: typography.fontBody,
    fontSize: 11,
    color: colors.neutral[600],
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.forest[900],
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
  },
  actionBtnText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 11,
    color: colors.neutral[0],
  },
  noResultsBanner: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: colors.forest[950],
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: radius.pill,
    alignItems: 'center',
  },
  noResultsText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 12,
    color: colors.neutral[0],
  },
});
