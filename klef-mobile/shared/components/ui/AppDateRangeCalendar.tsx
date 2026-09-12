import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Check,
  AlertCircle,
  RotateCcw,
} from 'lucide-react-native';
import { colors, radius, typography } from '../../theme/tokens';

export interface DateRange {
  from: Date | null;
  to: Date | null;
}

export type DisabledDateRange = { start: string | Date; end: string | Date };
export type DisabledDateItem = Date | string | DisabledDateRange;

export interface AppDateRangeCalendarProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  minNights?: number;
  minDate?: Date;
  disabledDates?: DisabledDateItem[];
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

function fmtShort(d: Date | null) {
  if (!d) return '—';
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

function buildMonthGrid(month: Date): Date[] {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const offset = (first.getDay() + 6) % 7;
  const start = addDays(first, -offset);
  return Array.from({ length: 42 }, (_, i) => addDays(start, i));
}

function parseToLocalDay(val: Date | string | number | null | undefined): Date | null {
  if (!val) return null;
  if (val instanceof Date) {
    return new Date(val.getFullYear(), val.getMonth(), val.getDate());
  }
  const str = String(val).trim();
  if (!str) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(str);
  if (match) {
    const y = parseInt(match[1], 10);
    const m = parseInt(match[2], 10) - 1;
    const d = parseInt(match[3], 10);
    return new Date(y, m, d);
  }
  const date = new Date(str);
  if (isNaN(date.getTime())) return null;
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function AppDateRangeCalendar({
  value = { from: null, to: null },
  onChange,
  minNights = 1,
  minDate,
  disabledDates = [],
}: AppDateRangeCalendarProps) {
  const safeValue = value || { from: null, to: null };
  const today = useMemo(() => startOfDay(new Date()), []);
  const floorDate = useMemo(() => startOfDay(minDate ?? today), [minDate, today]);

  const [viewMonth, setViewMonth] = useState<Date>(
    () => new Date((safeValue.from || floorDate).getFullYear(), (safeValue.from || floorDate).getMonth(), 1)
  );

  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  // Normalisation robuste des dates handicapées (bloquées/réservées)
  const isBlockedDate = (d: Date): boolean => {
    if (!disabledDates || disabledDates.length === 0) return false;

    const targetDay = startOfDay(d);
    const targetTime = targetDay.getTime();

    for (const item of disabledDates) {
      if (!item) continue;
      if (item instanceof Date) {
        if (isSameDay(d, item)) return true;
      } else if (typeof item === 'string') {
        const parsed = parseToLocalDay(item);
        if (parsed && isSameDay(d, parsed)) return true;
      } else if (typeof item === 'object' && item !== null) {
        const rawStart = (item as any).start || (item as any).dateDebut || (item as any).debut;
        const rawEnd = (item as any).end || (item as any).dateFin || (item as any).fin;

        if (rawStart && rawEnd) {
          const startObj = parseToLocalDay(rawStart);
          const endObj = parseToLocalDay(rawEnd);
          if (startObj && endObj) {
            const startTime = startObj.getTime();
            const endTime = endObj.getTime();
            if (startTime === endTime) {
              if (targetTime === startTime) return true;
            } else if (targetTime >= startTime && targetTime < endTime) {
              return true;
            }
          }
        } else if (rawStart) {
          const startObj = parseToLocalDay(rawStart);
          if (startObj && isSameDay(d, startObj)) return true;
        }
      }
    }
    return false;
  };

  const isDateDisabled = (d: Date): boolean => {
    return isBeforeDay(d, floorDate) || isBlockedDate(d);
  };

  // Trouver la prochaine date bloquée après from
  const getNextBlockedDate = (from: Date): Date | null => {
    const cur = addDays(from, 1);
    const horizon = addDays(from, 365);
    for (let d = new Date(cur); d <= horizon; d = addDays(d, 1)) {
      if (isBlockedDate(d)) {
        return d;
      }
    }
    return null;
  };

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
    setWarningMessage(null);

    if (isDateDisabled(day)) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      if (isBlockedDate(day)) {
        setWarningMessage('Cette date est déjà réservée ou bloquée.');
      }
      return;
    }

    // 1. Premier clic ou réinitialisation si déjà une plage complète choisie
    if (!safeValue.from || (safeValue.from && safeValue.to)) {
      Haptics.selectionAsync().catch(() => {});
      onChange({ from: day, to: null });
      return;
    }

    // 2. Clic antérieur à l'arrivée ou identique -> devient la nouvelle date d'arrivée
    if (isBeforeDay(day, safeValue.from) || isSameDay(day, safeValue.from)) {
      Haptics.selectionAsync().catch(() => {});
      onChange({ from: day, to: null });
      return;
    }

    // 3. Vérification des dates bloquées intermédiaires (Protection de plage)
    const nextBlocked = getNextBlockedDate(safeValue.from);
    if (nextBlocked && !isBeforeDay(day, nextBlocked)) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      setWarningMessage('Une période est déjà réservée sur ce créneau.');
      // Redéfinir comme nouvelle date de départ
      onChange({ from: day, to: null });
      return;
    }

    // 4. Vérification séjour minimum
    const nights = diffDays(safeValue.from, day);
    if (nights < minNights) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      setWarningMessage(`Séjour minimum de ${minNights} nuit${minNights > 1 ? 's' : ''} requis.`);
      return;
    }

    // Valide !
    Haptics.selectionAsync().catch(() => {});
    onChange({ from: safeValue.from, to: day });
  };

  const handleReset = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setWarningMessage(null);
    onChange({ from: null, to: null });
  };

  const monthGrid = useMemo(() => buildMonthGrid(viewMonth), [viewMonth]);
  const monthTitle = `${MONTH_NAMES[viewMonth.getMonth()]} ${viewMonth.getFullYear()}`;

  const nightsCount =
    safeValue.from && safeValue.to ? diffDays(safeValue.from, safeValue.to) : 0;
  const hasRange = safeValue.from && safeValue.to && nightsCount > 0;
  const isMinSatisfied = !hasRange || nightsCount >= minNights;

  return (
    <View style={styles.calendarContainer}>
      {/* ── 1. Pills DÉPART / RETOUR (Miroir Web 1:1) ───────────────── */}
      <View style={styles.pillsRow}>
        <View
          style={[
            styles.pillCard,
            safeValue.from ? styles.pillCardActive : styles.pillCardInactive,
          ]}
        >
          <CalendarDays
            size={16}
            color={safeValue.from ? colors.forest[600] : colors.neutral[400]}
          />
          <View>
            <Text style={styles.pillLabel}>DÉPART</Text>
            <Text
              style={[
                styles.pillValue,
                safeValue.from ? styles.pillValueActive : styles.pillValueInactive,
              ]}
            >
              {fmtShort(safeValue.from)}
            </Text>
          </View>
        </View>

        <ChevronRight size={16} color={colors.neutral[300]} />

        <View
          style={[
            styles.pillCard,
            safeValue.to ? styles.pillCardActive : styles.pillCardInactive,
          ]}
        >
          <CalendarDays
            size={16}
            color={safeValue.to ? colors.forest[600] : colors.neutral[400]}
          />
          <View>
            <Text style={styles.pillLabel}>RETOUR</Text>
            <Text
              style={[
                styles.pillValue,
                safeValue.to ? styles.pillValueActive : styles.pillValueInactive,
              ]}
            >
              {fmtShort(safeValue.to)}
            </Text>
          </View>
        </View>
      </View>

      {/* ── 2. Bannière de Feedback & Séjour Min ───────────────────── */}
      {warningMessage ? (
        <View style={styles.warningBanner}>
          <AlertCircle size={15} color={colors.error[600]} />
          <Text style={styles.warningBannerText}>{warningMessage}</Text>
        </View>
      ) : hasRange ? (
        !isMinSatisfied ? (
          <View style={styles.warningBanner}>
            <AlertCircle size={15} color={colors.error[600]} />
            <Text style={styles.warningBannerText}>
              ⚠️ Séjour min. : {minNights} nuits ({nightsCount} nuits sélectionnées)
            </Text>
          </View>
        ) : (
          <View style={styles.successBanner}>
            <Check size={15} color={colors.forest[600]} />
            <Text style={styles.successBannerText}>
              {nightsCount} nuit{nightsCount > 1 ? 's' : ''} sélectionnée{nightsCount > 1 ? 's' : ''} — modifiez si besoin
            </Text>
          </View>
        )
      ) : (
        <Text style={styles.infoInstruction}>
          {safeValue.from
            ? `Sélectionnez la date de retour ${minNights > 1 ? `(Min. ${minNights} nuits)` : ''}`
            : `Sélectionnez vos dates d'arrivée et de départ ${minNights > 1 ? `(Min. ${minNights} nuits)` : ''}`}
        </Text>
      )}

      {/* ── 3. En-tête mois & navigation ───────────────────────────── */}
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

        <Text style={styles.monthTitleText}>{monthTitle}</Text>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleNextMonth}
          style={styles.navBtn}
        >
          <ChevronRight size={18} color={colors.neutral[800]} />
        </TouchableOpacity>
      </View>

      {/* ── 4. En-tête des jours de la semaine ────────────────────── */}
      <View style={styles.weekdaysRow}>
        {WEEKDAYS.map((w) => (
          <Text key={w} style={styles.weekdayText}>
            {w}
          </Text>
        ))}
      </View>

      {/* ── 5. Grille du calendrier ────────────────────────────────── */}
      <View style={styles.gridContainer}>
        {Array.from({ length: 6 }, (_, weekIdx) => (
          <View key={weekIdx} style={styles.weekRow}>
            {monthGrid
              .slice(weekIdx * 7, weekIdx * 7 + 7)
              .map((day) => {
                const isOutsideMonth = day.getMonth() !== viewMonth.getMonth();
                const isPast = isBeforeDay(day, floorDate);
                const isBlocked = isBlockedDate(day);
                const isDisabled = isPast || isBlocked || isOutsideMonth;
                const isToday = isSameDay(day, today);

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
                      isFrom && safeValue.to && styles.dayCellStartRange,
                      isTo && styles.dayCellEndRange,
                    ]}
                  >
                    <View
                      style={[
                        styles.dayPill,
                        isToday && !(isFrom || isTo) && styles.dayPillToday,
                        (isFrom || isTo) && styles.dayPillSelected,
                        isBlocked && styles.dayPillBlocked,
                      ]}
                    >
                      <Text
                        style={[
                          styles.dayText,
                          isOutsideMonth && styles.dayTextOutside,
                          isDisabled && styles.dayTextDisabled,
                          isBlocked && styles.dayTextBlocked,
                          isToday && !(isFrom || isTo) && styles.dayTextToday,
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

      {/* ── 6. Légende & Action Effacer ────────────────────────────── */}
      <View style={styles.footerRow}>
        <View style={styles.legendGrid}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, styles.legendDotBlocked]} />
            <Text style={styles.legendText}>Indisponible</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, styles.legendDotSelected]} />
            <Text style={styles.legendText}>Départ/Retour</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, styles.legendDotRange]} />
            <Text style={styles.legendText}>Plage réservée</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, styles.legendDotToday]} />
            <Text style={styles.legendText}>Aujourd'hui</Text>
          </View>
        </View>

        {safeValue.from ? (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleReset}
            style={styles.resetBtn}
          >
            <RotateCcw size={12} color={colors.forest[600]} />
            <Text style={styles.resetBtnText}>Effacer les dates</Text>
          </TouchableOpacity>
        ) : null}
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

  // Pills DÉPART / RETOUR
  pillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pillCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: radius.inner,
    borderWidth: 1.5,
  },
  pillCardActive: {
    backgroundColor: colors.forest[50],
    borderColor: colors.forest[600],
  },
  pillCardInactive: {
    backgroundColor: colors.neutral[50],
    borderColor: colors.neutral[200],
  },
  pillLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: colors.neutral[400],
    letterSpacing: 1,
  },
  pillValue: {
    fontSize: typography.sizes.xs,
    fontWeight: '800',
    marginTop: 1,
  },
  pillValueActive: {
    color: colors.forest[950],
  },
  pillValueInactive: {
    color: colors.neutral[400],
  },

  // Bannières & Feedback
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.error[50],
    borderWidth: 1,
    borderColor: colors.error[200],
    borderRadius: radius.inner,
  },
  warningBannerText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.error[700],
    flex: 1,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.forest[50],
    borderWidth: 1,
    borderColor: colors.forest[200],
    borderRadius: radius.inner,
  },
  successBannerText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.forest[700],
    flex: 1,
  },
  infoInstruction: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.neutral[500],
    paddingHorizontal: 4,
  },

  // Navigation Mois
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navBtn: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBtnDisabled: {
    opacity: 0.3,
  },
  monthTitleText: {
    fontSize: typography.sizes.sm,
    fontWeight: '800',
    color: colors.forest[950],
    textTransform: 'capitalize',
  },

  // Weekdays
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

  // Grid
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

  // Day Pill
  dayPill: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayPillToday: {
    borderWidth: 1.5,
    borderColor: colors.forest[600],
  },
  dayPillSelected: {
    backgroundColor: colors.forest[950],
    shadowColor: colors.forest[950],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  dayPillBlocked: {
    backgroundColor: colors.neutral[100],
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
    color: colors.neutral[400],
    opacity: 0.4,
  },
  dayTextBlocked: {
    color: colors.neutral[400],
    textDecorationLine: 'line-through',
    fontWeight: '400',
  },
  dayTextToday: {
    color: colors.forest[700],
    fontWeight: '800',
  },
  dayTextSelected: {
    color: colors.neutral[0],
    fontWeight: '900',
  },

  // Footer & Legend
  footerRow: {
    marginTop: 4,
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: colors.neutral[100],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  legendGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendDotBlocked: {
    backgroundColor: colors.neutral[300],
  },
  legendDotSelected: {
    backgroundColor: colors.forest[950],
  },
  legendDotRange: {
    backgroundColor: colors.lime[200],
  },
  legendDotToday: {
    borderWidth: 1.5,
    borderColor: colors.forest[600],
    backgroundColor: colors.neutral[0],
  },
  legendText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.neutral[600],
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  resetBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.forest[600],
    textDecorationLine: 'underline',
  },
});
