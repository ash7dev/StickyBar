import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { colors, radius, typography } from '../../theme/tokens';

export interface DateRange {
  from: Date | null;
  to: Date | null;
}

export interface AppDateRangeCalendarProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  minNights?: number;
  minDate?: Date;
}

const WEEKDAYS = ['LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM', 'DIM'];
const MONTH_NAMES = [
  'Janvier',
  'Février',
  'Mars',
  'Avril',
  'Mai',
  'Juin',
  'Juillet',
  'Août',
  'Septembre',
  'Octobre',
  'Novembre',
  'Décembre',
];

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const addMonths = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth() + n, 1);
const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();
const isBeforeDay = (a: Date, b: Date) => startOfDay(a).getTime() < startOfDay(b).getTime();
const isAfterDay = (a: Date, b: Date) => startOfDay(a).getTime() > startOfDay(b).getTime();
const diffDays = (a: Date, b: Date) =>
  Math.round((startOfDay(b).getTime() - startOfDay(a).getTime()) / 86400000);

function buildMonthGrid(month: Date): Date[] {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const offset = (first.getDay() + 6) % 7;
  const start = addDays(first, -offset);
  return Array.from({ length: 42 }, (_, i) => addDays(start, i));
}

export function AppDateRangeCalendar({
  value = { from: null, to: null },
  onChange,
  minNights = 1,
  minDate,
}: AppDateRangeCalendarProps) {
  const safeValue = value || { from: null, to: null };
  const today = useMemo(() => startOfDay(new Date()), []);
  const floorDate = useMemo(() => startOfDay(minDate ?? today), [minDate, today]);

  const [viewMonth, setViewMonth] = useState<Date>(
    () => new Date(floorDate.getFullYear(), floorDate.getMonth(), 1)
  );

  const canGoPrev = isAfterDay(
    viewMonth,
    new Date(floorDate.getFullYear(), floorDate.getMonth(), 1)
  );

  const handlePrevMonth = () => {
    if (!canGoPrev) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setViewMonth((prev) => addMonths(prev, -1));
  };

  const handleNextMonth = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setViewMonth((prev) => addMonths(prev, 1));
  };

  const handleSelectDay = (day: Date) => {
    if (isBeforeDay(day, floorDate)) return;
    Haptics.selectionAsync().catch(() => {});

    // Premier clic ou réinitialisation si déjà une plage complète choisie
    if (!safeValue.from || (safeValue.from && safeValue.to)) {
      onChange({ from: day, to: null });
      return;
    }

    // Deuxième clic pour la date de départ
    if (isBeforeDay(day, safeValue.from) || isSameDay(day, safeValue.from)) {
      onChange({ from: day, to: null });
      return;
    }

    if (diffDays(safeValue.from, day) < minNights) {
      onChange({ from: day, to: null });
      return;
    }

    onChange({ from: safeValue.from, to: day });
  };

  const monthGrid = useMemo(() => buildMonthGrid(viewMonth), [viewMonth]);
  const monthTitle = `${MONTH_NAMES[viewMonth.getMonth()]} ${viewMonth.getFullYear()}`;

  const nightsCount =
    safeValue.from && safeValue.to ? diffDays(safeValue.from, safeValue.to) : 0;

  return (
    <View style={styles.calendarContainer}>
      {/* En-tête mois & navigation */}
      <View style={styles.navRow}>
        <TouchableOpacity
          activeOpacity={0.7}
          disabled={!canGoPrev}
          onPress={handlePrevMonth}
          style={[styles.navBtn, !canGoPrev && styles.navBtnDisabled]}
        >
          <ChevronLeft
            size={18}
            color={canGoPrev ? colors.neutral[800] : colors.neutral[300]}
          />
        </TouchableOpacity>

        <View style={styles.monthTitleBox}>
          <Text style={styles.monthTitleText}>{monthTitle}</Text>
          {nightsCount > 0 ? (
            <Text style={styles.nightsBadge}>{nightsCount} {nightsCount === 1 ? 'nuit' : 'nuits'}</Text>
          ) : (
            <Text style={styles.subInstruction}>
              {safeValue.from ? 'Sélectionnez la date de départ' : 'Sélectionnez la date d’arrivée'}
            </Text>
          )}
        </View>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleNextMonth}
          style={styles.navBtn}
        >
          <ChevronRight size={18} color={colors.neutral[800]} />
        </TouchableOpacity>
      </View>

      {/* En-tête des jours de la semaine */}
      <View style={styles.weekdaysRow}>
        {WEEKDAYS.map((w) => (
          <Text key={w} style={styles.weekdayText}>
            {w}
          </Text>
        ))}
      </View>

      {/* Grille du calendrier */}
      <View style={styles.gridContainer}>
        {Array.from({ length: 6 }, (_, weekIdx) => (
          <View key={weekIdx} style={styles.weekRow}>
            {monthGrid
              .slice(weekIdx * 7, weekIdx * 7 + 7)
              .map((day) => {
                const isOutsideMonth = day.getMonth() !== viewMonth.getMonth();
                const isDisabled = isBeforeDay(day, floorDate) || isOutsideMonth;

                const isFrom = safeValue.from && isSameDay(day, safeValue.from);
                const isTo = safeValue.to && isSameDay(day, safeValue.to);
                const inRange =
                  safeValue.from &&
                  safeValue.to &&
                  isAfterDay(day, safeValue.from) &&
                  isBeforeDay(day, safeValue.to);

                return (
                  <TouchableOpacity
                    activeOpacity={0.8}
                    disabled={isDisabled}
                    key={day.toISOString()}
                    onPress={() => handleSelectDay(day)}
                    style={[
                      styles.dayCell,
                      inRange && styles.dayCellInRange,
                      isFrom && value.to && styles.dayCellStartRange,
                      isTo && styles.dayCellEndRange,
                    ]}
                  >
                    <View
                      style={[
                        styles.dayPill,
                        (isFrom || isTo) && styles.dayPillSelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.dayText,
                          isOutsideMonth && styles.dayTextOutside,
                          isDisabled && styles.dayTextDisabled,
                          (isFrom || isTo) && styles.dayTextSelected,
                        ]}
                      >
                        {day.getDate()}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  calendarContainer: {
    backgroundColor: colors.neutral[0],
    borderRadius: radius.card,
    padding: 14,
    gap: 12,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBtnDisabled: {
    opacity: 0.3,
  },
  monthTitleBox: {
    alignItems: 'center',
  },
  monthTitleText: {
    fontSize: typography.sizes.sm,
    fontWeight: '800',
    color: colors.neutral[950],
  },
  subInstruction: {
    fontSize: 11,
    color: colors.neutral[500],
    fontWeight: '500',
    marginTop: 2,
  },
  nightsBadge: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.neutral[900],
    backgroundColor: colors.lime[200],
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
    marginTop: 2,
  },
  weekdaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderColor: colors.neutral[100],
  },
  weekdayText: {
    width: 38,
    textAlign: 'center',
    fontSize: 10,
    fontWeight: '800',
    color: colors.neutral[400],
  },
  gridContainer: {
    gap: 4,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  dayCell: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCellInRange: {
    backgroundColor: colors.lime[100],
  },
  dayCellStartRange: {
    borderTopLeftRadius: 21,
    borderBottomLeftRadius: 21,
    backgroundColor: colors.lime[100],
  },
  dayCellEndRange: {
    borderTopRightRadius: 21,
    borderBottomRightRadius: 21,
    backgroundColor: colors.lime[100],
  },
  dayPill: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayPillSelected: {
    backgroundColor: colors.lime[400],
  },
  dayText: {
    fontSize: typography.sizes.xs,
    fontWeight: '600',
    color: colors.neutral[900],
  },
  dayTextOutside: {
    opacity: 0,
  },
  dayTextDisabled: {
    color: colors.neutral[300],
    textDecorationLine: 'line-through',
  },
  dayTextSelected: {
    color: colors.forest[950],
    fontWeight: '900',
  },
});
