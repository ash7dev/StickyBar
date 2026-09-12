import React, { useEffect, useState, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Image,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, radius, typography } from '../../theme/tokens';
import { apiClient } from '../../api/api-client';
import { TenantListingCard, ListingItem } from '../ui/TenantListingCard';

interface HomeDealsBannerProps {
  onSelectListing: (listing: ListingItem) => void;
}

const DEALS_CACHE_KEY = 'klef_tenant_deals_cache_v1';

// ── Smart date helpers ────────────────────────────────────────────────
function getNextWeekendDates(): { start: string; end: string; label: string; sublabel: string } {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Sun, 6=Sat

  let saturdayOffset: number;
  let label: string;
  let sublabel: string;

  if (dayOfWeek === 5) {
    // Friday → "Ce soir & demain"
    saturdayOffset = 1;
    label = 'Disponible ce week-end';
    sublabel = 'Réservez pour ce week-end';
  } else if (dayOfWeek === 6) {
    // Saturday → "Encore dispo ce soir"
    saturdayOffset = 0;
    label = 'Encore disponible ce week-end';
    sublabel = 'Partez dès maintenant';
  } else if (dayOfWeek === 0) {
    // Sunday → next weekend
    saturdayOffset = 6;
    label = 'Week-end prochain';
    sublabel = 'Anticipez votre escapade';
  } else {
    // Mon-Thu → upcoming Saturday
    saturdayOffset = 6 - dayOfWeek;
    label = 'Disponible ce week-end';
    sublabel = 'Évadez-vous en quelques clics';
  }

  const saturday = new Date(now);
  saturday.setDate(now.getDate() + saturdayOffset);
  const sunday = new Date(saturday);
  sunday.setDate(saturday.getDate() + 1);

  const formatShort = (d: Date) =>
    d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });

  sublabel = `${formatShort(saturday)} → ${formatShort(sunday)}`;

  const toISO = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
  };

  return {
    start: toISO(saturday),
    end: toISO(sunday),
    label,
    sublabel,
  };
}

// ── Main Weekend Deals Section ─────────────────────────────────────────
export function HomeDealsBanner({ onSelectListing }: HomeDealsBannerProps) {
  const weekendInfo = useMemo(() => getNextWeekendDates(), []);
  const [cachedDeals, setCachedDeals] = useState<ListingItem[] | null>(null);

  // 1. Hydratation Persistante Instantanée (0ms sur démarrage à froid)
  useEffect(() => {
    AsyncStorage.getItem(DEALS_CACHE_KEY)
      .then((raw) => {
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setCachedDeals(parsed);
            }
          } catch (e) {
            console.warn('[HomeDealsBanner] Erreur de lecture du cache disque:', e);
          }
        }
      })
      .catch((err) => console.warn('[HomeDealsBanner] Erreur AsyncStorage:', err));
  }, []);

  // 2. Query avec SWR et Cache Persistant sur disque
  const { data: dealsData = [] } = useQuery<ListingItem[]>({
    queryKey: ['tenant', 'deals', weekendInfo.start, weekendInfo.end],
    queryFn: async () => {
      try {
        const response = await apiClient.get<any>('/listings/search', {
          params: {
            dateDebut: weekendInfo.start,
            dateFin: weekendInfo.end,
            limit: 8,
          },
        });
        const data = response.data?.data || response.data?.items || response.data || [];
        const list = Array.isArray(data) ? data : [];
        if (list.length > 0) {
          AsyncStorage.setItem(DEALS_CACHE_KEY, JSON.stringify(list)).catch(() => {});
          // Prefetch top images for smooth display
          list.slice(0, 4).forEach((item: any) => {
            const coverUrl = item.photos?.[0] || item.coverUrl || item.imageUrl;
            if (coverUrl && typeof coverUrl === 'string' && coverUrl.startsWith('http')) {
              Image.prefetch(coverUrl).catch(() => {});
            }
          });
        }
        return list;
      } catch (err) {
        if (cachedDeals && cachedDeals.length > 0) {
          return cachedDeals;
        }
        throw err;
      }
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    initialData: cachedDeals || undefined,
  });

  const listings = dealsData.length > 0 ? dealsData : (cachedDeals || []);

  if (listings.length === 0) return null;

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>{weekendInfo.label}</Text>
          <Text style={styles.headerSubtitle}>{weekendInfo.sublabel}</Text>
        </View>
      </View>

      {/* Horizontal List of standard TenantListingCard */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        decelerationRate="fast"
        snapToInterval={292} // 280 card width + 12 gap
        snapToAlignment="start"
      >
        {listings.map((listing) => (
          <TenantListingCard
            key={listing.id}
            listing={listing}
            width={280}
            onPress={() => onSelectListing(listing)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
    marginVertical: 12,
  },

  // ── Header ─────────────────────────────────────────────────────
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  headerLeft: {
    flex: 1,
    gap: 2,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  calendarBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.lime[100],
    borderWidth: 1.5,
    borderColor: colors.lime[400],
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: typography.fontDisplay,
    fontSize: typography.sizes.lg,
    color: colors.forest[950],
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontFamily: typography.fontBody,
    fontSize: typography.sizes.xs,
    color: colors.neutral[600],
    marginTop: 2,
  },

  // ── Carousel ───────────────────────────────────────────────────
  scrollContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
});
