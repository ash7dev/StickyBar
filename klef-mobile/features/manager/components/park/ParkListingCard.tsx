import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Ban, CalendarRange, MoreHorizontal, Zap } from 'lucide-react-native';
import { colors, radius, typography } from '../../../../shared/theme/tokens';
import type { ManagedListing } from '../../hooks/useManagerToday';
import type { ListingDay, TonightState } from '../../lib/park';
import { fmt } from '../../lib/today';
import { INK, LIME, LINE, MUTED } from '../today/ui';

const tap = () => Haptics.selectionAsync().catch(() => {});

const STATE: Record<TonightState, { label: string; bg: string; fg: string; dot: string }> = {
  ARRIVAL: { label: 'Arrivée', bg: LIME, fg: INK, dot: INK },
  OCCUPIED: { label: 'Occupé', bg: INK, fg: LIME, dot: LIME },
  DEPARTURE: { label: 'Départ', bg: '#EEF2EA', fg: '#3F4A3B', dot: '#9AA894' },
  FREE: { label: 'Libre', bg: 'rgba(4,25,18,0.6)', fg: '#FFFFFF', dot: LIME },
  OFFLINE: { label: 'Hors ligne', bg: 'rgba(4,25,18,0.6)', fg: '#FFFFFF', dot: colors.neutral[400] },
};

function OccupancyBar({ rate }: { rate: number | null }) {
  if (rate === null) return null;
  const pct = Math.round(rate * 100);
  const color = pct >= 60 ? colors.forest[600] : pct >= 35 ? colors.gold[500] : colors.error[500];
  return (
    <View>
      <Text style={styles.occLabel}>Occupation · 30 jours</Text>
      <View style={styles.occRow}>
        <View style={styles.occTrack}>
          <View style={[styles.occFill, { width: `${Math.max(2, pct)}%`, backgroundColor: color }]} />
        </View>
        <Text style={[styles.occPct, { color }]}>{pct}%</Text>
      </View>
    </View>
  );
}

/** Un bien du parc : son état ce soir, son occupation, et les trois gestes du quotidien. */
export function ParkListingCard({
  listing,
  day,
  occupancy,
  onMore,
  onBlock,
  onLastMinute,
  onPlanning,
}: {
  listing: ManagedListing;
  day: ListingDay;
  occupancy: number | null;
  onMore: () => void;
  onBlock: () => void;
  onLastMinute: () => void;
  onPlanning: () => void;
}) {
  const offline = day.state === 'OFFLINE';
  const s = STATE[day.state];
  const photo = listing.photos?.[0]?.url;
  const promo = !!listing.derniereMinuteActive;

  return (
    <View style={[styles.card, offline && styles.cardOff]}>
      <TouchableOpacity activeOpacity={0.9} onPress={onMore} style={styles.hero} accessibilityRole="button" accessibilityLabel={`${listing.titre}, options`}>
        {photo ? (
          <Image source={{ uri: photo }} style={[StyleSheet.absoluteFill, offline && { opacity: 0.55 }]} contentFit="cover" transition={150} />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.forest[800] }]} />
        )}
        <LinearGradient colors={['rgba(4,25,18,0.35)', 'rgba(4,25,18,0)', 'rgba(4,25,18,0.8)']} locations={[0, 0.45, 1]} style={StyleSheet.absoluteFill} />
        <View style={styles.heroTop}>
          <View style={[styles.chip, { backgroundColor: s.bg }]}>
            <View style={[styles.dot, { backgroundColor: s.dot }]} />
            <Text style={[styles.chipText, { color: s.fg }]}>{offline ? day.line : s.label}</Text>
          </View>
          {promo && (
            <View style={[styles.chip, { backgroundColor: LIME }]}>
              <Zap size={11} color={INK} fill={INK} />
              <Text style={[styles.chipText, { color: INK }]}>−15 %</Text>
            </View>
          )}
          <View style={styles.flex} />
          <View style={styles.more}>
            <MoreHorizontal size={17} color="#FFFFFF" />
          </View>
        </View>
        <View style={styles.heroBottom}>
          <Text style={styles.heroKicker} numberOfLines={1}>
            {(listing.quartier ?? listing.ville ?? '').toUpperCase()}
          </Text>
          <Text style={styles.heroTitle} numberOfLines={1}>
            {listing.titre}
          </Text>
        </View>
      </TouchableOpacity>

      <View style={styles.body}>
        <View style={styles.lineRow}>
          <Text style={styles.line} numberOfLines={1}>
            {offline ? (listing.statut === 'REJECTED' && listing.rejectionReason ? listing.rejectionReason : 'Non réservable pour l’instant') : day.line}
          </Text>
          {listing.prixBase != null && (
            <Text style={styles.price}>
              {fmt(Number(listing.prixBase))} <Text style={styles.priceUnit}>/nuit</Text>
            </Text>
          )}
        </View>
        {!offline && <OccupancyBar rate={occupancy} />}
        {!offline && (
          <View style={styles.actions}>
            <TouchableOpacity
              onPress={() => {
                tap();
                onBlock();
              }}
              style={[styles.action, styles.actionGhost]}
              accessibilityRole="button"
            >
              <Ban size={13} color={INK} />
              <Text style={styles.actionGhostText}>Bloquer</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                tap();
                onLastMinute();
              }}
              style={[styles.action, styles.actionGhost, promo && styles.actionPromoOn]}
              accessibilityRole="button"
            >
              <Zap size={13} color={INK} fill={promo ? INK : 'none'} />
              <Text style={styles.actionGhostText}>{promo ? 'Retirer −15 %' : '−15 %'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                tap();
                onPlanning();
              }}
              style={[styles.action, styles.actionInk]}
              accessibilityRole="button"
            >
              <CalendarRange size={13} color={LIME} />
              <Text style={styles.actionInkText}>Planning</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  card: { borderRadius: 26, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: LINE, overflow: 'hidden' },
  cardOff: { backgroundColor: colors.neutral[50] },
  hero: { height: 132, justifyContent: 'space-between', backgroundColor: INK },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 12 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 5, height: 26, paddingHorizontal: 10, borderRadius: 13 },
  chipText: { fontFamily: typography.fontBodyBold, fontSize: 11 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  more: { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(4,25,18,0.6)', alignItems: 'center', justifyContent: 'center' },
  heroBottom: { paddingHorizontal: 14, paddingBottom: 10 },
  heroKicker: { fontFamily: typography.fontBodyBold, fontSize: 10.5, letterSpacing: 1, color: LIME },
  heroTitle: { fontFamily: typography.fontDisplaySemiBold, fontSize: 20, color: '#FFFFFF' },
  body: { padding: 14, paddingTop: 12, gap: 10 },
  lineRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  line: { flex: 1, fontFamily: typography.fontBodySemiBold, fontSize: 12.5, color: '#3F4A3B' },
  price: { fontFamily: typography.fontDisplaySemiBold, fontSize: 15, color: INK },
  priceUnit: { fontFamily: typography.fontBody, fontSize: 10.5, color: MUTED },
  occLabel: { fontFamily: typography.fontBodyBold, fontSize: 10.5, color: MUTED, marginBottom: 4 },
  occRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  occTrack: { flex: 1, height: 6, borderRadius: 3, backgroundColor: '#EEF2EA', overflow: 'hidden' },
  occFill: { height: '100%', borderRadius: 3 },
  occPct: { width: 36, textAlign: 'right', fontFamily: typography.fontBodyBold, fontSize: 11.5 },
  actions: { flexDirection: 'row', gap: 6 },
  action: { flex: 1, flexDirection: 'row', gap: 5, height: 38, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  actionGhost: { borderWidth: 1, borderColor: LINE },
  actionPromoOn: { backgroundColor: LIME, borderColor: LIME },
  actionGhostText: { fontFamily: typography.fontBodyBold, fontSize: 12, color: INK },
  actionInk: { backgroundColor: INK },
  actionInkText: { fontFamily: typography.fontBodyBold, fontSize: 12, color: LIME },
});
