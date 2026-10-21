import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { colors, radius, typography } from '../../../shared/theme/tokens';
import type { OwnerCalendarEvent, OwnerCalendarLogement } from '../types';
import { addDays, addMonths, dayOfMonth, diffDays, formatMonth, weekdayIndex, type Day } from '../lib/days';
import { logementColor, nightState } from '../lib/planning';

const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const MAX_BARS = 4;

interface MonthOverviewProps {
  month: Day;
  today: Day;
  logements: OwnerCalendarLogement[];
  events: OwnerCalendarEvent[];
  filter: string | null;
  onFilterChange: (logementId: string | null) => void;
  onMonthChange: (month: Day) => void;
  onDayPress: (day: Day) => void;
}

/** Le mois, tous biens : une fine barre par logement sous chaque jour (réservé, demande, bloqué). */
export function MonthOverview({
  month,
  today,
  logements,
  events,
  filter,
  onFilterChange,
  onMonthChange,
  onDayPress,
}: MonthOverviewProps) {
  const shown = (filter ? logements.filter((l) => l.id === filter) : logements).slice(0, MAX_BARS);
  const leading = weekdayIndex(month);
  const count = diffDays(month, addMonths(month, 1));
  const cells: (Day | null)[] = [
    ...Array.from({ length: leading }, () => null),
    ...Array.from({ length: count }, (_, i) => addDays(month, i)),
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  const label = formatMonth(month);

  return (
    <View style={styles.wrap}>
      <View style={styles.nav}>
        <TouchableOpacity onPress={() => onMonthChange(addMonths(month, -1))} style={styles.navBtn} accessibilityRole="button" accessibilityLabel="Mois précédent">
          <ChevronLeft size={16} color={colors.neutral[900]} strokeWidth={2.4} />
        </TouchableOpacity>
        <Text style={styles.month}>{label.charAt(0).toUpperCase() + label.slice(1)}</Text>
        <TouchableOpacity onPress={() => onMonthChange(addMonths(month, 1))} style={styles.navBtn} accessibilityRole="button" accessibilityLabel="Mois suivant">
          <ChevronRight size={16} color={colors.neutral[900]} strokeWidth={2.4} />
        </TouchableOpacity>
      </View>

      {logements.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          <TouchableOpacity
            onPress={() => onFilterChange(null)}
            style={[styles.chip, !filter && styles.chipActive]}
            accessibilityRole="button"
            accessibilityState={{ selected: !filter }}
          >
            <Text style={[styles.chipText, !filter && styles.chipTextActive]}>Tous · {logements.length}</Text>
          </TouchableOpacity>
          {logements.map((l) => {
            const active = filter === l.id;
            return (
              <TouchableOpacity
                key={l.id}
                onPress={() => onFilterChange(active ? null : l.id)}
                style={[styles.chip, active && styles.chipActive]}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
              >
                <View style={[styles.chipDot, { backgroundColor: logementColor(logements, l.id) }]} />
                <Text style={[styles.chipText, active && styles.chipTextActive]} numberOfLines={1}>
                  {l.titre}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

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
          const isToday = day === today;
          return (
            <TouchableOpacity
              key={day}
              onPress={() => onDayPress(day)}
              style={[styles.cell, isToday && styles.cellToday]}
              accessibilityRole="button"
              accessibilityLabel={`${dayOfMonth(day)} ${label}`}
            >
              <Text style={[styles.cellNum, isToday && styles.cellNumToday]}>{dayOfMonth(day)}</Text>
              <View style={styles.bars}>
                {shown.map((l) => {
                  const state = nightState(events, l.id, day);
                  const base = logementColor(logements, l.id);
                  return (
                    <View
                      key={l.id}
                      style={[
                        styles.bar,
                        state === 'booked' && { backgroundColor: base },
                        state === 'pending' && { backgroundColor: base, opacity: 0.45 },
                        state === 'blocked' && { backgroundColor: isToday ? colors.forest[300] : colors.neutral[300] },
                      ]}
                    />
                  );
                })}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.neutral[0],
    borderWidth: 1,
    borderColor: colors.neutral[200],
    alignItems: 'center',
    justifyContent: 'center',
  },
  month: { fontFamily: typography.fontDisplaySemiBold, fontSize: 20, color: colors.neutral[900] },
  chips: { gap: 8, paddingRight: 16 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 34,
    maxWidth: 200,
    paddingHorizontal: 13,
    borderRadius: radius.pill,
    backgroundColor: colors.neutral[0],
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  chipActive: { backgroundColor: colors.forest[950], borderColor: colors.forest[950] },
  chipDot: { width: 8, height: 8, borderRadius: 4 },
  chipText: { fontFamily: typography.fontBodySemiBold, fontSize: 12, color: colors.neutral[900] },
  chipTextActive: { color: colors.neutral[50] },
  weekdays: { flexDirection: 'row' },
  weekday: { flex: 1, textAlign: 'center', fontFamily: typography.fontBodySemiBold, fontSize: 11, color: colors.neutral[600] },
  grid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 4 },
  cellEmpty: { width: `${100 / 7}%`, height: 56 },
  cell: {
    width: `${100 / 7}%`,
    height: 56,
    padding: 6,
    paddingBottom: 7,
    justifyContent: 'space-between',
    borderRadius: 14,
    backgroundColor: colors.neutral[0],
    borderWidth: 2,
    borderColor: colors.neutral[50],
  },
  cellToday: { backgroundColor: colors.forest[950] },
  cellNum: { fontFamily: typography.fontBodySemiBold, fontSize: 13, color: colors.neutral[900] },
  cellNumToday: { fontFamily: typography.fontBodyBold, color: colors.lime[400] },
  bars: { gap: 2 },
  bar: { height: 4, borderRadius: 2, backgroundColor: 'transparent' },
});
