import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { ChevronLeft, ChevronRight, Repeat } from 'lucide-react-native';
import { colors, radius, typography } from '../../../shared/theme/tokens';
import type { BlockDraft, OwnerCalendarEvent, OwnerCalendarLogement } from '../types';
import { addDays, addMonths, dayOfMonth, diffDays, formatMonth, formatShort, weekdayIndex, type Day } from '../lib/days';
import { compactPrice, coversNight, isOccupying, nightState, type NightState } from '../lib/planning';
import { overlapsReservation } from '../lib/event-styles';

const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

interface LogementPricingProps {
  logements: OwnerCalendarLogement[];
  logementId: string;
  onLogementChange: (logementId: string) => void;
  month: Day;
  onMonthChange: (month: Day) => void;
  today: Day;
  events: OwnerCalendarEvent[];
  onBack: () => void;
  onBlock: (draft: BlockDraft) => void;
  onEventPress: (event: OwnerCalendarEvent) => void;
}

/**
 * Un logement, son mois nuit par nuit : prix, réservé, demande, bloqué.
 * Deux appuis sur des nuits libres sélectionnent une période à bloquer.
 */
export function LogementPricing({
  logements,
  logementId,
  onLogementChange,
  month,
  onMonthChange,
  today,
  events,
  onBack,
  onBlock,
  onEventPress,
}: LogementPricingProps) {
  const router = useRouter();
  const index = Math.max(logements.findIndex((l) => l.id === logementId), 0);
  const logement = logements[index];
  const [range, setRange] = useState<{ start: Day; end: Day | null } | null>(null);

  const own = events.filter((e) => e.logementId === logementId);
  const leading = weekdayIndex(month);
  const count = diffDays(month, addMonths(month, 1));
  const cells: (Day | null)[] = [
    ...Array.from({ length: leading }, () => null),
    ...Array.from({ length: count }, (_, i) => addDays(month, i)),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const monthEnd = addMonths(month, 1);
  const bookedNights = Array.from({ length: count }, (_, i) => addDays(month, i)).filter(
    (d) => nightState(own, logementId, d) === 'booked',
  ).length;
  const revenue = own
    .filter((e) => isOccupying(e) && e.start >= month && e.start < monthEnd)
    .reduce((sum, e) => sum + (e.kind === 'RESERVATION' ? Number(e.netProprietaire) || 0 : 0), 0);

  const selEnd = range ? (range.end ?? addDays(range.start, 1)) : null;
  const inSelection = (day: Day) => !!range && !!selEnd && day >= range.start && day < selEnd;

  const switchLogement = () => {
    Haptics.selectionAsync().catch(() => {});
    setRange(null);
    onLogementChange(logements[(index + 1) % logements.length].id);
  };

  const pressDay = (day: Day, state: NightState) => {
    if (state !== 'free') {
      const event = own.find((e) => coversNight(e, day));
      if (event) onEventPress(event);
      return;
    }
    Haptics.selectionAsync().catch(() => {});
    if (!range || range.end) {
      setRange({ start: day, end: null });
      return;
    }
    const start = day < range.start ? day : range.start;
    const end = addDays(day < range.start ? range.start : day, 1);
    if (overlapsReservation(events, logementId, start, end)) {
      Alert.alert('Nuits déjà réservées', 'Cette période contient une réservation. Choisissez des nuits libres.');
      return;
    }
    setRange({ start, end });
  };

  const nights = range && selEnd ? diffDays(range.start, selEnd) : 0;
  const label = formatMonth(month);

  if (!logement) return null;

  return (
    <View style={styles.wrap}>
      <View style={styles.topRow}>
        <TouchableOpacity onPress={onBack} style={styles.roundBtn} accessibilityRole="button" accessibilityLabel="Retour au calendrier">
          <ChevronLeft size={17} color={colors.neutral[900]} strokeWidth={2.4} />
        </TouchableOpacity>
        <Text style={styles.eyebrow}>PRIX & DISPONIBILITÉS</Text>
      </View>

      <TouchableOpacity
        activeOpacity={logements.length > 1 ? 0.85 : 1}
        onPress={logements.length > 1 ? switchLogement : undefined}
        style={styles.logementCard}
        accessibilityRole="button"
        accessibilityLabel={logements.length > 1 ? `${logement.titre}. Toucher pour changer de bien` : logement.titre}
      >
        {logement.photoUrl ? (
          <Image source={{ uri: logement.photoUrl }} style={styles.photo} contentFit="cover" />
        ) : (
          <View style={[styles.photo, styles.photoEmpty]} />
        )}
        <View style={styles.flex}>
          <Text style={styles.logementTitle} numberOfLines={1}>
            {logement.titre}
          </Text>
          <Text style={styles.logementMeta} numberOfLines={1}>
            {Number(logement.prixBase).toLocaleString('fr-FR')} FCFA / nuit · {logement.ville}
          </Text>
        </View>
        {logements.length > 1 && (
          <View style={styles.switchBadge}>
            <Repeat size={12} color={colors.neutral[600]} />
            <Text style={styles.switchText}>
              {index + 1}/{logements.length}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      <View style={styles.monthRow}>
        <TouchableOpacity onPress={() => onMonthChange(addMonths(month, -1))} style={styles.roundBtnSmall} accessibilityRole="button" accessibilityLabel="Mois précédent">
          <ChevronLeft size={15} color={colors.neutral[900]} strokeWidth={2.4} />
        </TouchableOpacity>
        <View style={styles.flex}>
          <Text style={styles.month}>{label.charAt(0).toUpperCase() + label.slice(1)}</Text>
          <Text style={styles.monthStats}>
            {Math.round((bookedNights / count) * 100)} % réservé
            {revenue > 0 ? ` · ${revenue.toLocaleString('fr-FR')} FCFA` : ''}
          </Text>
        </View>
        <TouchableOpacity onPress={() => onMonthChange(addMonths(month, 1))} style={styles.roundBtnSmall} accessibilityRole="button" accessibilityLabel="Mois suivant">
          <ChevronRight size={15} color={colors.neutral[900]} strokeWidth={2.4} />
        </TouchableOpacity>
      </View>

      <View style={styles.weekdays}>
        {WEEKDAYS.map((w, i) => (
          <Text key={i} style={styles.weekday}>
            {w}
          </Text>
        ))}
      </View>

      <View style={styles.grid}>
        {cells.map((day, i) => {
          if (!day) return <View key={`e-${i}`} style={styles.cellEmpty} />;
          const state = nightState(own, logementId, day);
          const past = day < today;
          const selected = inSelection(day);
          return (
            <TouchableOpacity
              key={day}
              disabled={past && state === 'free'}
              onPress={() => pressDay(day, state)}
              style={[
                styles.cell,
                state === 'booked' && styles.cellBooked,
                state === 'pending' && styles.cellPending,
                state === 'blocked' && styles.cellBlocked,
                selected && styles.cellSelected,
                past && state === 'free' && styles.cellPast,
                day === today && styles.cellToday,
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected, disabled: past && state === 'free' }}
              accessibilityLabel={`${dayOfMonth(day)} ${label}`}
            >
              <Text style={[styles.cellNum, state === 'booked' && styles.textOnDark]}>{dayOfMonth(day)}</Text>
              <Text
                style={[
                  styles.cellPrice,
                  state === 'booked' && styles.priceOnDark,
                  state === 'pending' && { color: colors.gold[700] },
                ]}
              >
                {state === 'booked' ? '●' : state === 'blocked' ? '—' : compactPrice(Number(logement.prixBase))}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.legend}>
        {[
          { label: 'Réservé', style: styles.cellBooked },
          { label: 'Demande', style: styles.cellPending },
          { label: 'Bloqué', style: styles.cellBlocked },
          { label: 'Sélection', style: styles.cellSelected },
        ].map((item) => (
          <View key={item.label} style={styles.legendItem}>
            <View style={[styles.legendSwatch, item.style]} />
            <Text style={styles.legendText}>{item.label}</Text>
          </View>
        ))}
      </View>

      {range && (
        <View style={styles.selection}>
          <View style={styles.selectionTop}>
            <Text style={styles.selectionTitle}>
              {nights} nuit{nights > 1 ? 's' : ''} sélectionnée{nights > 1 ? 's' : ''}
            </Text>
            <Text style={styles.selectionRange}>
              {formatShort(range.start)} → {formatShort(selEnd!)}
            </Text>
          </View>
          {!range.end && <Text style={styles.selectionHint}>Touchez la dernière nuit pour étendre la sélection.</Text>}
          <View style={styles.priceLine}>
            <Text style={styles.priceLabel}>Prix par nuit</Text>
            <Text style={styles.priceValue}>{Number(logement.prixBase).toLocaleString('fr-FR')} FCFA</Text>
          </View>
          <View style={styles.selectionActions}>
            <TouchableOpacity onPress={() => setRange(null)} style={[styles.actionBtn, styles.actionGhost]} accessibilityRole="button">
              <Text style={styles.actionGhostText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.navigate(`/(owner)/add-listing?id=${logementId}` as never)}
              style={[styles.actionBtn, styles.actionGhost]}
              accessibilityRole="button"
            >
              <Text style={styles.actionGhostText}>Prix</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                onBlock({ logementIds: [logementId], start: range.start, end: selEnd! });
                setRange(null);
              }}
              style={[styles.actionBtn, styles.actionLime]}
              accessibilityRole="button"
            >
              <Text style={styles.actionLimeText}>Bloquer</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 14 },
  flex: { flex: 1, minWidth: 0 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  roundBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.neutral[0],
    borderWidth: 1,
    borderColor: colors.neutral[200],
    alignItems: 'center',
    justifyContent: 'center',
  },
  roundBtnSmall: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.neutral[0],
    borderWidth: 1,
    borderColor: colors.neutral[200],
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyebrow: { fontFamily: typography.fontBodyBold, fontSize: 11, letterSpacing: 1.4, color: colors.neutral[600] },

  logementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 10,
    paddingRight: 14,
    borderRadius: 22,
    backgroundColor: colors.neutral[0],
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  photo: { width: 52, height: 52, borderRadius: 14 },
  photoEmpty: { backgroundColor: colors.forest[100] },
  logementTitle: { fontFamily: typography.fontDisplaySemiBold, fontSize: 18, color: colors.neutral[900] },
  logementMeta: { fontFamily: typography.fontBody, fontSize: 12, color: colors.neutral[600], marginTop: 2 },
  switchBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  switchText: { fontFamily: typography.fontBodySemiBold, fontSize: 12, color: colors.neutral[600] },

  monthRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  month: { textAlign: 'center', fontFamily: typography.fontDisplaySemiBold, fontSize: 20, color: colors.neutral[900] },
  monthStats: { textAlign: 'center', fontFamily: typography.fontBody, fontSize: 12, color: colors.neutral[600], marginTop: 2 },

  weekdays: { flexDirection: 'row' },
  weekday: { flex: 1, textAlign: 'center', fontFamily: typography.fontBodySemiBold, fontSize: 11, color: colors.neutral[600] },
  grid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 4 },
  cellEmpty: { width: `${100 / 7}%`, height: 52 },
  cell: {
    width: `${100 / 7}%`,
    height: 52,
    padding: 5,
    paddingHorizontal: 6,
    justifyContent: 'space-between',
    borderRadius: 13,
    backgroundColor: colors.neutral[0],
    borderWidth: 2,
    borderColor: colors.neutral[50],
  },
  cellBooked: { backgroundColor: colors.forest[950] },
  cellPending: { backgroundColor: colors.gold[50], borderColor: colors.gold[400] },
  cellBlocked: { backgroundColor: colors.neutral[200] },
  cellSelected: { backgroundColor: colors.lime[400], borderColor: colors.lime[600] },
  cellPast: { opacity: 0.4 },
  cellToday: { borderColor: colors.forest[950] },
  cellNum: { fontFamily: typography.fontBodySemiBold, fontSize: 11, color: colors.neutral[900] },
  cellPrice: { textAlign: 'right', fontFamily: typography.fontDisplaySemiBold, fontSize: 13, color: colors.neutral[900] },
  textOnDark: { color: colors.neutral[50] },
  priceOnDark: { color: colors.forest[300] },

  legend: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 14, rowGap: 6 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendSwatch: { width: 12, height: 12, borderRadius: 4, borderWidth: 1.5, borderColor: 'transparent' },
  legendText: { fontFamily: typography.fontBodySemiBold, fontSize: 11, color: colors.neutral[600] },

  selection: { gap: 12, padding: 16, borderRadius: 26, backgroundColor: colors.forest[950] },
  selectionTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 10 },
  selectionTitle: { fontFamily: typography.fontDisplaySemiBold, fontSize: 19, color: colors.neutral[50] },
  selectionRange: { fontFamily: typography.fontBody, fontSize: 12, color: colors.forest[200] },
  selectionHint: { fontFamily: typography.fontBody, fontSize: 12, color: colors.forest[200] },
  priceLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(248,251,244,0.06)',
  },
  priceLabel: { fontFamily: typography.fontBody, fontSize: 13, color: colors.forest[200] },
  priceValue: { fontFamily: typography.fontDisplaySemiBold, fontSize: 17, color: colors.neutral[50] },
  selectionActions: { flexDirection: 'row', gap: 8 },
  actionBtn: { height: 46, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  actionGhost: { flex: 1, borderWidth: 1, borderColor: 'rgba(248,251,244,0.25)' },
  actionGhostText: { fontFamily: typography.fontBodySemiBold, fontSize: 14, color: colors.neutral[50] },
  actionLime: { flex: 1.4, backgroundColor: colors.lime[400] },
  actionLimeText: { fontFamily: typography.fontBodyBold, fontSize: 14, color: colors.forest[950] },
});
