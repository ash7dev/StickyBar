import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Camera, CalendarCheck } from 'lucide-react-native';
import { colors, radius, typography } from '../../../../shared/theme/tokens';
import { dayNumber, guestName, weekdayLong, weekdayShort, type Move } from '../../lib/today';
import { INK, LIME, LINE, MUTED } from './ui';

/** « À venir » : la semaine en bande, le jour choisi déplié, ce qu'il faut préparer. */
export function Upcoming({
  days,
  movesByDay,
  today,
  selected,
  onSelect,
  onOpen,
}: {
  days: string[];
  movesByDay: Map<string, Move[]>;
  today: string;
  selected: string;
  onSelect: (day: string) => void;
  onOpen: (move: Move) => void;
}) {
  const moves = movesByDay.get(selected) ?? [];
  const firstArrival = moves.find((m) => m.kind === 'ARRIVAL' && m.needsInspection);
  const total = days.reduce((s, d) => s + (movesByDay.get(d)?.length ?? 0), 0);

  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <Text style={styles.h2}>À venir</Text>
        <Text style={styles.sub}>{total === 0 ? 'semaine calme' : `${total} mouvement${total > 1 ? 's' : ''} sur 7 jours`}</Text>
      </View>

      <View style={styles.week}>
        {days.map((d) => {
          const count = movesByDay.get(d)?.length ?? 0;
          const sel = d === selected;
          const isToday = d === today;
          return (
            <TouchableOpacity
              key={d}
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                onSelect(d);
              }}
              style={[styles.day, sel ? styles.daySel : isToday ? styles.dayToday : styles.dayIdle]}
              accessibilityRole="button"
              accessibilityState={{ selected: sel }}
              accessibilityLabel={`${weekdayLong(d)} ${dayNumber(d)}, ${count} mouvement${count > 1 ? 's' : ''}`}
            >
              <Text style={[styles.dayName, sel && { color: LIME }]}>{isToday ? 'AUJ.' : weekdayShort(d)}</Text>
              <Text style={[styles.dayNum, sel && { color: '#FFFFFF' }]}>{dayNumber(d)}</Text>
              <View style={styles.dots}>
                {Array.from({ length: Math.min(count, 3) }).map((_, i) => (
                  <View key={i} style={[styles.dot, { backgroundColor: sel ? LIME : colors.forest[600] }]} />
                ))}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {firstArrival && (
        <TouchableOpacity activeOpacity={0.88} onPress={() => onOpen(firstArrival)} style={styles.prep} accessibilityRole="button">
          <View style={styles.prepIcon}>
            <Camera size={15} color={INK} />
          </View>
          <View style={styles.flex}>
            <Text style={styles.prepKicker}>À PRÉPARER {selected === today ? 'AUJOURD’HUI' : `POUR ${weekdayLong(selected).toUpperCase()}`}</Text>
            <Text style={styles.prepText} numberOfLines={1}>
              État des lieux {firstArrival.listing?.titre ?? ''} avant {firstArrival.at}
            </Text>
          </View>
        </TouchableOpacity>
      )}

      {moves.length === 0 ? (
        <View style={styles.empty}>
          <CalendarCheck size={18} color={colors.forest[600]} />
          <Text style={styles.emptyText}>Aucun mouvement {selected === today ? 'aujourd’hui' : weekdayLong(selected)}.</Text>
        </View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tickets}>
          {moves.map((m) => {
            const arr = m.kind === 'ARRIVAL';
            return (
              <TouchableOpacity key={m.key} activeOpacity={0.85} onPress={() => onOpen(m)} style={styles.ticket} accessibilityRole="button">
                <View style={styles.ticketTop}>
                  <Text style={styles.ticketHour}>{m.at}</Text>
                  <View style={[styles.pill, { backgroundColor: arr ? INK : colors.neutral[100] }]}>
                    <Text style={[styles.pillText, { color: arr ? LIME : colors.neutral[700] }]}>{arr ? 'Arr.' : 'Dép.'}</Text>
                  </View>
                </View>
                <Text style={styles.ticketGuest} numberOfLines={1}>
                  {guestName(m.reservation)}
                </Text>
                <Text style={styles.ticketPlace} numberOfLines={2}>
                  {m.listing?.titre ?? m.reservation.logement?.titre ?? 'Logement'}
                  {'\n'}
                  {m.ownerName}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  wrap: { gap: 12 },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', paddingHorizontal: 20 },
  h2: { fontFamily: typography.fontDisplaySemiBold, fontSize: 22, color: INK },
  sub: { fontFamily: typography.fontBody, fontSize: 12, color: MUTED },
  week: { flexDirection: 'row', gap: 5, paddingHorizontal: 16 },
  day: { flex: 1, alignItems: 'center', paddingTop: 8, paddingBottom: 7, borderRadius: 16 },
  daySel: { backgroundColor: INK },
  dayToday: { backgroundColor: '#EEF2EA' },
  dayIdle: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: LINE },
  dayName: { fontFamily: typography.fontBodyBold, fontSize: 9.5, letterSpacing: 0.5, color: MUTED },
  dayNum: { fontFamily: typography.fontDisplaySemiBold, fontSize: 17, color: INK, marginTop: 1 },
  dots: { flexDirection: 'row', gap: 2, height: 5, marginTop: 4 },
  dot: { width: 5, height: 5, borderRadius: 3 },
  prep: { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 16, padding: 12, paddingHorizontal: 14, borderRadius: 20, backgroundColor: INK },
  prepIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: LIME, alignItems: 'center', justifyContent: 'center' },
  prepKicker: { fontFamily: typography.fontBodyBold, fontSize: 10, letterSpacing: 1, color: LIME },
  prepText: { fontFamily: typography.fontBodySemiBold, fontSize: 13, color: '#FFFFFF', marginTop: 1 },
  tickets: { gap: 10, paddingHorizontal: 16 },
  ticket: { width: 150, padding: 12, borderRadius: 20, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: LINE },
  ticketTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ticketHour: { fontFamily: typography.fontDisplaySemiBold, fontSize: 18, color: INK },
  pill: { height: 22, paddingHorizontal: 8, borderRadius: radius.pill, justifyContent: 'center' },
  pillText: { fontFamily: typography.fontBodyBold, fontSize: 10.5 },
  ticketGuest: { fontFamily: typography.fontBodyBold, fontSize: 13.5, color: INK, marginTop: 8 },
  ticketPlace: { fontFamily: typography.fontBody, fontSize: 11, lineHeight: 15, color: MUTED },
  empty: { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 16, padding: 14, borderRadius: 18, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: LINE },
  emptyText: { fontFamily: typography.fontBodySemiBold, fontSize: 13, color: MUTED },
});
