import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ChevronLeft, ChevronRight, Lock } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors, radius, typography } from '../../../shared/theme/tokens';
import type { OwnerCalendarEvent, OwnerCalendarLogement } from '../types';
import {
  addDays,
  addMonths,
  dayOfMonth,
  diffDays,
  eachDay,
  formatLong,
  formatMonth,
  formatRange,
  startOfMonth,
  weekdayIndex,
  type Day,
} from '../lib/days';
import { STATUS_STYLES, eventLabel, eventStatus } from '../lib/event-styles';
import type { PendingSelection } from './CalendarTimelineView';

const WEEKDAYS = ['LU', 'MA', 'ME', 'JE', 'VE', 'SA', 'DI'];

interface CalendarMonthViewProps {
  logements: OwnerCalendarLogement[];
  /** Événements du mois affiché, tous logements confondus */
  events: OwnerCalendarEvent[];
  logementId: string;
  onLogementChange: (id: string) => void;
  /** Premier jour du mois affiché */
  month: Day;
  onMonthChange: (month: Day) => void;
  today: Day;
  selection: PendingSelection | null;
  onDayPress: (logementId: string, day: Day) => void;
  onEventPress: (event: OwnerCalendarEvent) => void;
}

/** Vue B — un logement à la fois, grille mensuelle et séjours du mois. */
export function CalendarMonthView({
  logements,
  events,
  logementId,
  onLogementChange,
  month,
  onMonthChange,
  today,
  selection,
  onDayPress,
  onEventPress,
}: CalendarMonthViewProps) {
  const nextMonth = addMonths(month, 1);
  const days = useMemo(() => eachDay(month, diffDays(month, nextMonth)), [month, nextMonth]);
  const leadingBlanks = weekdayIndex(month);

  const logementEvents = useMemo(
    () =>
      events
        .filter((e) => e.logementId === logementId && e.start < nextMonth && e.end > month)
        .sort((a, b) => a.start.localeCompare(b.start)),
    [events, logementId, month, nextMonth],
  );

  /** Événement qui occupe la nuit du jour donné. */
  const eventByNight = useMemo(() => {
    const map = new Map<Day, OwnerCalendarEvent>();
    for (const event of logementEvents) {
      for (let d = event.start; d < event.end; d = addDays(d, 1)) map.set(d, event);
    }
    return map;
  }, [logementEvents]);

  const anchor = selection?.logementId === logementId ? selection.anchor : null;
  // Pas de navigation avant le mois en cours
  const canGoBack = month > startOfMonth(today);

  const changeMonth = (delta: number) => {
    Haptics.selectionAsync().catch(() => {});
    onMonthChange(addMonths(month, delta));
  };

  return (
    <View style={styles.container}>
      {logements.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {logements.map((l) => {
            const active = l.id === logementId;
            return (
              <TouchableOpacity
                key={l.id}
                activeOpacity={0.8}
                onPress={() => {
                  Haptics.selectionAsync().catch(() => {});
                  onLogementChange(l.id);
                }}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]} numberOfLines={1}>
                  {l.titre}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      <View style={styles.card}>
        <View style={styles.monthNav}>
          <TouchableOpacity
            onPress={() => changeMonth(-1)}
            disabled={!canGoBack}
            style={[styles.navBtn, !canGoBack && styles.navBtnDisabled]}
            accessibilityRole="button"
            accessibilityLabel="Mois précédent"
          >
            <ChevronLeft size={16} color={colors.neutral[900]} strokeWidth={2.4} />
          </TouchableOpacity>
          <Text style={styles.monthTitle}>{formatMonth(month)}</Text>
          <TouchableOpacity
            onPress={() => changeMonth(1)}
            style={styles.navBtn}
            accessibilityRole="button"
            accessibilityLabel="Mois suivant"
          >
            <ChevronRight size={16} color={colors.neutral[900]} strokeWidth={2.4} />
          </TouchableOpacity>
        </View>

        <View style={styles.weekRow}>
          {WEEKDAYS.map((w) => (
            <Text key={w} style={styles.weekLabel}>
              {w}
            </Text>
          ))}
        </View>

        <View style={styles.grid}>
          {Array.from({ length: leadingBlanks }, (_, i) => (
            <View key={`blank-${i}`} style={styles.dayCell} />
          ))}
          {days.map((day) => {
            const event = eventByNight.get(day);
            const isPast = day < today;
            const status = event ? STATUS_STYLES[eventStatus(event)] : null;
            const isStart = event ? event.start === day || day === month : false;
            const isEnd = event ? addDays(day, 1) === event.end || addDays(day, 1) === nextMonth : false;

            return (
              <Pressable
                key={day}
                disabled={isPast && !event}
                onPress={() => (event ? onEventPress(event) : onDayPress(logementId, day))}
                accessibilityRole="button"
                accessibilityLabel={
                  event ? `${formatLong(day)}, ${status!.label} : ${eventLabel(event)}` : formatLong(day)
                }
                accessibilityState={{ disabled: isPast && !event, selected: anchor === day }}
                style={styles.dayCell}
              >
                <View
                  style={[
                    styles.dayInner,
                    status && {
                      backgroundColor: status.background,
                      borderColor: status.border ?? status.background,
                      borderStyle: status.dashed ? 'dashed' : 'solid',
                      borderTopLeftRadius: isStart ? radius.inner : 0,
                      borderBottomLeftRadius: isStart ? radius.inner : 0,
                      borderTopRightRadius: isEnd ? radius.inner : 0,
                      borderBottomRightRadius: isEnd ? radius.inner : 0,
                    },
                    !event && anchor === day && styles.dayAnchor,
                  ]}
                >
                  <View style={[styles.dayNumber, day === today && !event && styles.dayToday]}>
                    <Text
                      style={[
                        styles.dayText,
                        isPast && !event && styles.dayTextPast,
                        day === today && !event && styles.dayTextToday,
                        status && { color: status.text },
                      ]}
                    >
                      {dayOfMonth(day)}
                    </Text>
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.list}>
        <Text style={styles.listTitle}>CE MOIS-CI</Text>
        {logementEvents.length === 0 ? (
          <Text style={styles.empty}>Aucun séjour ni blocage ce mois-ci. Touchez des jours libres pour bloquer.</Text>
        ) : (
          logementEvents.map((event) => {
            const status = STATUS_STYLES[eventStatus(event)];
            const nights = diffDays(event.start, event.end);
            return (
              <TouchableOpacity
                key={`${event.kind}-${event.id}`}
                activeOpacity={0.8}
                onPress={() => onEventPress(event)}
                style={styles.listItem}
                accessibilityRole="button"
              >
                <View style={[styles.listDot, { backgroundColor: status.background, borderColor: status.border ?? status.background }]}>
                  {event.kind === 'BLOCK' && <Lock size={13} color={colors.neutral[700]} />}
                </View>
                <View style={styles.listText}>
                  <Text style={styles.listLabel} numberOfLines={1}>
                    {eventLabel(event)}
                    {event.kind === 'RESERVATION' ? ` · ${nights} nuit${nights > 1 ? 's' : ''}` : ''}
                  </Text>
                  <Text style={styles.listMeta} numberOfLines={1}>
                    {formatRange(event.start, event.end)} · {status.label}
                  </Text>
                </View>
                <ChevronRight size={16} color={colors.neutral[400]} />
              </TouchableOpacity>
            );
          })
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 14 },
  chips: { gap: 8 },
  chip: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    backgroundColor: colors.neutral[0],
    justifyContent: 'center',
    maxWidth: 200,
  },
  chipActive: { backgroundColor: colors.forest[600], borderColor: colors.forest[600] },
  chipText: { fontFamily: typography.fontBodySemiBold, fontSize: 12, color: colors.neutral[900] },
  chipTextActive: { color: colors.neutral[0] },

  card: {
    backgroundColor: colors.neutral[0],
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    padding: 12,
  },
  monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 10 },
  navBtn: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBtnDisabled: { opacity: 0.35 },
  monthTitle: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 16,
    color: colors.forest[950],
    textTransform: 'capitalize',
  },
  weekRow: { flexDirection: 'row', paddingBottom: 6 },
  weekLabel: {
    width: `${100 / 7}%`,
    textAlign: 'center',
    fontFamily: typography.fontBodyBold,
    fontSize: 10,
    color: colors.neutral[600],
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 6 },
  dayCell: { width: `${100 / 7}%`, height: 42 },
  dayInner: { flex: 1, alignItems: 'center', justifyContent: 'center', borderWidth: 0 },
  dayAnchor: { backgroundColor: colors.forest[100], borderRadius: radius.inner },
  dayNumber: { width: 32, height: 32, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  dayToday: { borderWidth: 2, borderColor: colors.forest[600] },
  dayText: { fontFamily: typography.fontBodySemiBold, fontSize: 13, color: colors.neutral[900] },
  dayTextPast: { color: colors.neutral[400] },
  dayTextToday: { color: colors.forest[600] },

  list: { gap: 8 },
  listTitle: { fontFamily: typography.fontBodyBold, fontSize: 11, letterSpacing: 0.8, color: colors.neutral[500] },
  empty: { fontFamily: typography.fontBody, fontSize: 12, color: colors.neutral[600] },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 16,
    backgroundColor: colors.neutral[0],
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  listDot: {
    width: 30,
    height: 30,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listText: { flex: 1, gap: 2 },
  listLabel: { fontFamily: typography.fontBodyBold, fontSize: 13, color: colors.neutral[900] },
  listMeta: { fontFamily: typography.fontBody, fontSize: 11, color: colors.neutral[600] },
});
