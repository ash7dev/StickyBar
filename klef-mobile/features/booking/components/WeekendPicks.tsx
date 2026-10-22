import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Heart, Play, Star, Zap } from 'lucide-react-native';
import { colors, typography } from '../../../shared/theme/tokens';
import { apiClient } from '../../../shared/api/api-client';
import type { ListingItem } from '../../../shared/components/ui/TenantListingCard';
import { useFavorite } from '../../favorites/useFavorites';
import { formatAmount } from '../../owner-home/lib/format';
import { INK, tap } from '../../reservations/tenant/components/ui';
import { datesFor } from '../../home/lib/home';

export const coverOf = (l: ListingItem) => {
  const p = l.photos?.[0] as unknown;
  return typeof p === 'string' ? p : (p as { url?: string } | undefined)?.url;
};

/** Logements libres ce week-end (vrais prix du séjour) : de quoi donner envie quand rien n'est prévu. */
export function useWeekendPicks(enabled = true, ville?: string | null) {
  const d = datesFor('weekend')!;
  return useQuery<ListingItem[]>({
    queryKey: ['trips', 'weekend-picks', d.start, ville ?? null],
    queryFn: async () => {
      const res = await apiClient.get('/listings/search', { params: { dateDebut: d.start, dateFin: d.end, nbPersonnes: 2, limit: 6, ...(ville ? { ville } : {}) } });
      const list = res.data?.data ?? res.data?.items ?? [];
      return Array.isArray(list) ? list : [];
    },
    enabled,
    staleTime: 5 * 60_000,
  });
}

/** Logements libres ce week-end, avec le prix total. */
export function WeekendStrip({ items, title, sub = 'prix total du week-end' }: { items: ListingItem[]; title: string; sub?: string }) {
  if (!items.length) return null;
  return (
    <View style={{ gap: 10 }}>
      <View style={styles.stripHead}>
        <Text style={styles.stripTitle}>{title}</Text>
        <Text style={styles.stripSub}>{sub}</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
        {items.map((l) => (
          <WeekendCard key={l.id} l={l} />
        ))}
      </ScrollView>
    </View>
  );
}

/** Carte « libre ce week-end » : photo pleine, infos posées dessus, prix total en pastille, cœur pour garder. */
function WeekendCard({ l }: { l: ListingItem }) {
  const [kept, toggle] = useFavorite(l.id);
  const place = [l.quartier, l.ville].filter(Boolean)[0];
  return (
    <TouchableOpacity activeOpacity={0.9} onPress={() => { tap(); router.push(`/listing/${l.id}` as never); }} style={styles.pick} accessibilityRole="button" accessibilityLabel={`${l.titre}, libre ce week-end`}>
      {coverOf(l) ? <Image source={{ uri: coverOf(l) }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} /> : <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.forest[800] }]} />}
      <LinearGradient colors={['rgba(4,25,18,0.35)', 'rgba(4,25,18,0)', 'rgba(4,25,18,0.88)']} locations={[0, 0.35, 0.78]} style={StyleSheet.absoluteFill} />

      <View style={styles.pickTop}>
        {l.derniereMinuteActive ? (
          <View style={styles.pickDeal}>
            <Zap size={10} color={INK} fill={INK} />
            <Text style={styles.pickDealText}>−15 %</Text>
          </View>
        ) : l.videoUrl ? (
          <View style={styles.pickVideo}>
            <Play size={9} color={colors.lime[400]} fill={colors.lime[400]} />
            <Text style={styles.pickVideoText}>Vidéo</Text>
          </View>
        ) : (
          <View />
        )}
        <TouchableOpacity onPress={toggle} hitSlop={8} style={styles.pickHeart} accessibilityRole="button" accessibilityLabel={kept ? 'Ne plus garder' : 'Garder'}>
          <Heart size={15} color={kept ? INK : '#FFFFFF'} fill={kept ? INK : 'transparent'} strokeWidth={2.2} />
        </TouchableOpacity>
      </View>

      <View style={styles.pickBottom}>
        {place ? <Text style={styles.pickPlace} numberOfLines={1}>{place.toUpperCase()}</Text> : null}
        <Text style={styles.pickTitle} numberOfLines={2}>{l.titre}</Text>
        <View style={styles.pickMetaRow}>
          {l.note ? (
            <View style={styles.pickRating}>
              <Star size={11} color={colors.gold[400]} fill={colors.gold[400]} />
              <Text style={styles.pickRatingText}>{Number(l.note).toFixed(1).replace('.', ',')}</Text>
            </View>
          ) : null}
          {l.capaciteMax ? <Text style={styles.pickGuests}>{l.capaciteMax} voyageurs</Text> : null}
        </View>
        {l.prixSejour ? (
          <View style={styles.pickPrice}>
            <Text style={styles.pickPriceValue}>{formatAmount(l.prixSejour)}</Text>
            <Text style={styles.pickPriceUnit}>FCFA · {l.nbNuits ?? 2} nuit{(l.nbNuits ?? 2) > 1 ? 's' : ''}</Text>
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  stripHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  stripTitle: { fontFamily: typography.fontDisplaySemiBold, fontSize: 20, color: INK },
  stripSub: { fontFamily: typography.fontBody, fontSize: 12, color: colors.neutral[600] },
  pick: { width: 196, height: 252, borderRadius: 26, overflow: 'hidden', backgroundColor: INK, justifyContent: 'space-between' },
  pickTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 10 },
  pickDeal: { flexDirection: 'row', alignItems: 'center', gap: 4, height: 24, paddingHorizontal: 9, borderRadius: 999, backgroundColor: colors.lime[400] },
  pickDealText: { fontFamily: typography.fontBodyBold, fontSize: 11, color: INK },
  pickVideo: { flexDirection: 'row', alignItems: 'center', gap: 4, height: 24, paddingHorizontal: 9, borderRadius: 999, backgroundColor: 'rgba(4,25,18,0.6)' },
  pickVideoText: { fontFamily: typography.fontBodyBold, fontSize: 11, color: '#FFFFFF' },
  pickHeart: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.9)', alignItems: 'center', justifyContent: 'center' },
  pickBottom: { padding: 12, gap: 4 },
  pickPlace: { fontFamily: typography.fontBodyBold, fontSize: 10, letterSpacing: 1.2, color: colors.lime[400] },
  pickTitle: { fontFamily: typography.fontDisplaySemiBold, fontSize: 17, lineHeight: 20, color: '#FFFFFF' },
  pickMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pickRating: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  pickRatingText: { fontFamily: typography.fontBodyBold, fontSize: 11, color: '#FFFFFF' },
  pickGuests: { fontFamily: typography.fontBody, fontSize: 11, color: '#C9DBD1' },
  pickPrice: { flexDirection: 'row', alignItems: 'baseline', alignSelf: 'flex-start', gap: 5, marginTop: 6, paddingHorizontal: 11, paddingVertical: 6, borderRadius: 999, backgroundColor: 'rgba(248,251,244,0.96)' },
  pickPriceValue: { fontFamily: typography.fontDisplaySemiBold, fontSize: 15, color: INK },
  pickPriceUnit: { fontFamily: typography.fontBodySemiBold, fontSize: 10, color: colors.neutral[600] },

});
