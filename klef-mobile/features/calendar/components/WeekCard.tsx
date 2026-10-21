import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { colors, radius, typography } from '../../../shared/theme/tokens';
import type { OwnerCalendarEvent, OwnerCalendarLogement } from '../types';
import { addDays, dayOfMonth, eachDay, formatShort, formatWeekdayShort, type Day } from '../lib/days';
import { movesOn, occupancyRate } from '../lib/planning';

interface WeekCardProps {
  weekStart: Day;
  selectedDay: Day;
  today: Day;
  events: OwnerCalendarEvent[];
  logements: OwnerCalendarLogement[];
  onSelectDay: (day: Day) => void;
  onShiftWeek: (delta: number) => void;
}

/** Carte sombre : la semaine en 7 pastilles (points = arrivées / départs) et son taux d'occupation. */
export function WeekCard({ weekStart, selectedDay, today, events, logements, onSelectDay, onShiftWeek }: WeekCardProps) {
  const days = eachDay(weekStart, 7);
  const rate = occupancyRate(events, logements, weekStart, 7);

  return (
    <View style={styles.card}>
      <View style={styles.top}>
        <TouchableOpacity onPress={() => onShiftWeek(-7)} style={styles.nav} accessibilityRole="button" accessibilityLabel="Semaine précédente">
          <ChevronLeft size={16} color={colors.neutral[50]} strokeWidth={2.4} />
        </TouchableOpacity>
        <Text style={styles.range} numberOfLines={1}>
          {formatShort(weekStart)} – {formatShort(addDays(weekStart, 6))}
        </Text>
        <TouchableOpacity onPress={() => onShiftWeek(7)} style={styles.nav} accessibilityRole="button" accessibilityLabel="Semaine suivante">
          <ChevronRight size={16} color={colors.neutral[50]} strokeWidth={2.4} />
        </TouchableOpacity>
        <View style={styles.flex} />
        <Text style={styles.rate}>
          <Text style={styles.rateValue}>{Math.round(rate * 100)} %</Text> occupé
        </Text>
      </View>

      <View style={styles.days}>
        {days.map((day) => {
          const selected = day === selectedDay;
          const moves = movesOn(events, day);
          const hasArrival = moves.some((m) => m.kind === 'ARRIVAL');
          const hasDeparture = moves.some((m) => m.kind === 'DEPARTURE');
          return (
            <TouchableOpacity
              key={day}
              onPress={() => onSelectDay(day)}
              style={[styles.pill, selected && styles.pillSelected]}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={`${formatWeekdayShort(day)} ${dayOfMonth(day)}`}
            >
              <Text style={[styles.weekday, selected && styles.weekdaySelected]}>
                {formatWeekdayShort(day).charAt(0).toUpperCase()}
              </Text>
              <Text style={[styles.num, selected && styles.numSelected, day === today && !selected && styles.numToday]}>
                {dayOfMonth(day)}
              </Text>
              <View style={styles.dots}>
                {hasDeparture && <View style={[styles.dot, { backgroundColor: selected ? colors.forest[950] : colors.gold[400] }]} />}
                {hasArrival && <View style={[styles.dot, { backgroundColor: selected ? colors.forest[950] : colors.lime[400] }]} />}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: 12, padding: 14, borderRadius: 28, backgroundColor: colors.forest[950] },
  top: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  flex: { flex: 1 },
  nav: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(248,251,244,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  range: { fontFamily: typography.fontDisplaySemiBold, fontSize: 17, color: colors.neutral[50], paddingHorizontal: 4 },
  rate: { fontFamily: typography.fontBody, fontSize: 12, color: colors.forest[200] },
  rateValue: { fontFamily: typography.fontBodyBold, color: colors.lime[400] },
  days: { flexDirection: 'row', gap: 4 },
  pill: {
    flex: 1,
    height: 64,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    backgroundColor: 'rgba(248,251,244,0.05)',
  },
  pillSelected: { backgroundColor: colors.lime[400] },
  weekday: { fontFamily: typography.fontBodySemiBold, fontSize: 11, color: colors.forest[200] },
  weekdaySelected: { color: colors.forest[600] },
  num: { fontFamily: typography.fontDisplaySemiBold, fontSize: 18, color: colors.neutral[50] },
  numSelected: { color: colors.forest[950] },
  numToday: { color: colors.lime[400] },
  dots: { flexDirection: 'row', gap: 2, height: 5 },
  dot: { width: 5, height: 5, borderRadius: radius.pill },
});
