import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';
import { Ban, CalendarRange, ChevronRight, Compass, Pause, Pencil, Play, Zap } from 'lucide-react-native';
import { colors, radius, typography } from '../../../../shared/theme/tokens';
import { BottomSheet } from '../../../calendar/components/BottomSheet';
import type { ManagedListing } from '../../hooks/useManagerToday';
import type { ListingDay } from '../../lib/park';
import { fmt, ownerNameOf } from '../../lib/today';
import { INK, LIME, LINE, MUTED } from '../today/ui';

/** Toutes les actions sur un bien géré, avec une suggestion quand des nuits restent libres. */
export function ListingActionsSheet({
  listing,
  day,
  occupancy,
  pending,
  onClose,
  onBlock,
  onPlanning,
  onLastMinute,
  onPublic,
  onTogglePause,
  onEdit,
}: {
  listing: ManagedListing | null;
  day: ListingDay | null;
  occupancy: number | null;
  pending: 'promo' | 'pause' | null;
  onClose: () => void;
  onBlock: () => void;
  onPlanning: () => void;
  onLastMinute: () => void;
  onPublic: () => void;
  onTogglePause: () => void;
  onEdit: () => void;
}) {
  if (!listing || !day) return null;
  const promo = !!listing.derniereMinuteActive;
  const paused = listing.statut === 'PAUSED';
  const published = listing.statut === 'PUBLISHED';
  const suggest = published && !promo && day.freeNights >= 3;
  const photo = listing.photos?.[0]?.url;

  const rows: Array<{ key: string; Icon: typeof Ban; title: string; sub: string; onPress: () => void; danger?: boolean; busy?: boolean; show: boolean }> = [
    { key: 'block', Icon: Ban, title: 'Bloquer des dates', sub: 'Travaux, usage du propriétaire…', onPress: onBlock, show: true },
    {
      key: 'promo',
      Icon: Zap,
      title: promo ? 'Retirer la dernière minute' : 'Dernière minute −15 %',
      sub: promo ? 'Revenir au tarif habituel' : 'Pour remplir les nuits libres des prochains jours',
      onPress: onLastMinute,
      busy: pending === 'promo',
      show: published,
    },
    { key: 'planning', Icon: CalendarRange, title: 'Planning du bien', sub: 'Séjours et dates bloquées', onPress: onPlanning, show: true },
    { key: 'public', Icon: Compass, title: 'Voir la fiche publique', sub: 'Comme la voient les voyageurs', onPress: onPublic, show: published },
    { key: 'edit', Icon: Pencil, title: 'Modifier l’annonce', sub: 'Photos, prix, équipements, règles', onPress: onEdit, show: true },
    {
      key: 'pause',
      Icon: paused ? Play : Pause,
      title: paused ? 'Remettre en ligne' : 'Mettre en pause',
      sub: paused ? 'L’annonce redevient réservable' : 'L’annonce n’est plus réservable',
      onPress: onTogglePause,
      danger: !paused,
      busy: pending === 'pause',
      show: paused || published,
    },
  ];

  return (
    <BottomSheet visible onClose={onClose} title={listing.titre} subtitle={`${listing.quartier ?? listing.ville ?? ''} · pour ${ownerNameOf(listing)}`}>
      <View style={styles.head}>
        {photo ? <Image source={{ uri: photo }} style={styles.thumb} contentFit="cover" /> : <View style={[styles.thumb, { backgroundColor: colors.forest[800] }]} />}
        <View style={styles.stats}>
          {[
            [listing.prixBase != null ? fmt(Number(listing.prixBase)) : '—', 'par nuit'],
            [String(day.freeNights), 'nuits libres · 7 j'],
            [occupancy === null ? '—' : `${Math.round(occupancy * 100)} %`, 'occupation'],
          ].map(([v, l]) => (
            <View key={l} style={styles.stat}>
              <Text style={styles.statValue}>{v}</Text>
              <Text style={styles.statLabel}>{l}</Text>
            </View>
          ))}
        </View>
      </View>

      {suggest && (
        <View style={styles.suggest}>
          <Zap size={18} color={INK} />
          <Text style={styles.suggestText}>
            <Text style={styles.bold}>{day.freeNights} nuits libres cette semaine.</Text> Activer −15 % dernière minute ?
          </Text>
          <TouchableOpacity onPress={onLastMinute} style={styles.suggestBtn} accessibilityRole="button">
            {pending === 'promo' ? <ActivityIndicator color={LIME} size="small" /> : <Text style={styles.suggestBtnText}>Activer</Text>}
          </TouchableOpacity>
        </View>
      )}

      <View>
        {rows
          .filter((r) => r.show)
          .map(({ key, Icon, title, sub, onPress, danger, busy }) => (
            <TouchableOpacity key={key} onPress={onPress} disabled={busy} style={styles.row} accessibilityRole="button">
              <View style={[styles.rowIcon, danger && { backgroundColor: colors.error[50] }]}>
                <Icon size={16} color={danger ? colors.error[700] : INK} />
              </View>
              <View style={styles.flex}>
                <Text style={[styles.rowTitle, danger && { color: colors.error[700] }]}>{title}</Text>
                <Text style={styles.rowSub}>{sub}</Text>
              </View>
              {busy ? <ActivityIndicator color={colors.forest[600]} size="small" /> : <ChevronRight size={15} color={MUTED} />}
            </TouchableOpacity>
          ))}
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  head: { flexDirection: 'row', gap: 12, alignItems: 'center', marginBottom: 12 },
  thumb: { width: 64, height: 64, borderRadius: 18 },
  stats: { flex: 1, flexDirection: 'row', gap: 6 },
  stat: { flex: 1, padding: 9, borderRadius: 14, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: LINE },
  statValue: { fontFamily: typography.fontDisplaySemiBold, fontSize: 15, color: INK },
  statLabel: { fontFamily: typography.fontBody, fontSize: 10, color: MUTED, marginTop: 1 },
  suggest: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, paddingHorizontal: 14, borderRadius: 18, backgroundColor: LIME, marginBottom: 6 },
  suggestText: { flex: 1, fontFamily: typography.fontBody, fontSize: 12.5, lineHeight: 17, color: INK },
  bold: { fontFamily: typography.fontBodyBold },
  suggestBtn: { height: 34, paddingHorizontal: 14, borderRadius: radius.pill, backgroundColor: INK, justifyContent: 'center' },
  suggestBtnText: { fontFamily: typography.fontBodyBold, fontSize: 12, color: LIME },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: '#EEF2EA' },
  rowIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#EEF2EA', alignItems: 'center', justifyContent: 'center' },
  rowTitle: { fontFamily: typography.fontBodyBold, fontSize: 14, color: INK },
  rowSub: { fontFamily: typography.fontBody, fontSize: 11.5, color: MUTED, marginTop: 1 },
});
