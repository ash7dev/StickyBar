import React, { memo, useMemo } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Home } from 'lucide-react-native';
import { colors, radius, typography } from '../../../shared/theme/tokens';
import type { OwnerCalendarEvent, OwnerCalendarLogement } from '../types';
import {
  addDays,
  dayOfMonth,
  diffDays,
  eachDay,
  formatLong,
  formatMonth,
  formatRange,
  formatWeekdayShort,
  isWeekend,
  type Day,
} from '../lib/days';
import { STATUS_STYLES, eventLabel, eventStatus } from '../lib/event-styles';

const DAY_WIDTH = 44;
const ROW_HEIGHT = 64;
const LABEL_WIDTH = 104;
const HEADER_HEIGHT = 58;

export interface PendingSelection {
  logementId: string;
  anchor: Day;
}

interface CalendarTimelineViewProps {
  logements: OwnerCalendarLogement[];
  events: OwnerCalendarEvent[];
  start: Day;
  dayCount: number;
  today: Day;
  selection: PendingSelection | null;
  onDayPress: (logementId: string, day: Day) => void;
  onEventPress: (event: OwnerCalendarEvent) => void;
}

/**
 * Vue A — une ligne par logement, jours en défilement horizontal.
 * La colonne des logements reste fixe ; seule la grille des jours défile.
 */
export function CalendarTimelineView({
  logements,
  events,
  start,
  dayCount,
  today,
  selection,
  onDayPress,
  onEventPress,
}: CalendarTimelineViewProps) {
  const days = useMemo(() => eachDay(start, dayCount), [start, dayCount]);
  const windowEnd = addDays(start, dayCount);

  const eventsByLogement = useMemo(() => {
    const map = new Map<string, OwnerCalendarEvent[]>();
    for (const event of events) {
      const list = map.get(event.logementId) ?? [];
      list.push(event);
      map.set(event.logementId, list);
    }
    return map;
  }, [events]);

  const todayIndex = diffDays(start, today);

  return (
    <View style={styles.card}>
      <View style={styles.labels}>
        <View style={[styles.labelHeader, { height: HEADER_HEIGHT }]}>
          <Text style={styles.monthLabel}>{formatMonth(start)}</Text>
        </View>
        {logements.map((logement) => (
          <View key={logement.id} style={styles.labelCell}>
            <View style={styles.thumb}>
              {logement.photoUrl ? (
                <Image source={{ uri: logement.photoUrl }} style={styles.thumbImage} />
              ) : (
                <Home size={14} color={colors.neutral[500]} />
              )}
            </View>
            <View style={styles.labelText}>
              <Text style={styles.logementTitle} numberOfLines={2}>
                {logement.titre}
              </Text>
              <Text style={styles.logementCity} numberOfLines={1}>
                {logement.ville}
              </Text>
            </View>
          </View>
        ))}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} bounces={false}>
        <View>
          <View style={[styles.dayHeaderRow, { height: HEADER_HEIGHT }]}>
            {days.map((day) => {
              const isToday = day === today;
              return (
                <View key={day} style={[styles.dayHeader, isWeekend(day) && styles.weekend]}>
                  <Text style={[styles.weekday, isToday && styles.weekdayToday]}>
                    {formatWeekdayShort(day)}
                  </Text>
                  <View style={[styles.dayNumber, isToday && styles.dayNumberToday]}>
                    <Text style={[styles.dayNumberText, isToday && styles.dayNumberTextToday]}>
                      {dayOfMonth(day)}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>

          {logements.map((logement) => (
            <TimelineRow
              key={logement.id}
              logement={logement}
              events={eventsByLogement.get(logement.id) ?? []}
              days={days}
              windowStart={start}
              windowEnd={windowEnd}
              today={today}
              todayIndex={todayIndex}
              anchor={selection?.logementId === logement.id ? selection.anchor : null}
              onDayPress={onDayPress}
              onEventPress={onEventPress}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

interface TimelineRowProps {
  logement: OwnerCalendarLogement;
  events: OwnerCalendarEvent[];
  days: Day[];
  windowStart: Day;
  windowEnd: Day;
  today: Day;
  todayIndex: number;
  anchor: Day | null;
  onDayPress: (logementId: string, day: Day) => void;
  onEventPress: (event: OwnerCalendarEvent) => void;
}

const TimelineRow = memo(function TimelineRow({
  logement,
  events,
  days,
  windowStart,
  windowEnd,
  today,
  todayIndex,
  anchor,
  onDayPress,
  onEventPress,
}: TimelineRowProps) {
  const maxX = diffDays(windowStart, windowEnd) * DAY_WIDTH;

  return (
    <View style={[styles.row, { width: days.length * DAY_WIDTH }]}>
      {days.map((day) => {
        const isPast = day < today;
        return (
          <Pressable
            key={day}
            disabled={isPast}
            onPress={() => onDayPress(logement.id, day)}
            accessibilityRole="button"
            accessibilityLabel={`${logement.titre}, ${formatLong(day)}`}
            accessibilityState={{ disabled: isPast, selected: anchor === day }}
            style={({ pressed }) => [
              styles.cell,
              isWeekend(day) && styles.weekend,
              isPast && styles.past,
              pressed && styles.cellPressed,
              anchor === day && styles.cellAnchor,
            ]}
          />
        );
      })}

      {todayIndex >= 0 && todayIndex < days.length && (
        <View
          pointerEvents="none"
          style={[styles.todayLine, { left: (todayIndex + 0.5) * DAY_WIDTH }]}
        />
      )}

      {events.map((event) => {
        // Une barre couvre des nuits : du milieu du jour d'arrivée au milieu du jour de départ.
        const rawLeft = (diffDays(windowStart, event.start) + 0.5) * DAY_WIDTH;
        const rawRight = (diffDays(windowStart, event.end) + 0.5) * DAY_WIDTH;
        const left = Math.max(rawLeft, 0);
        const right = Math.min(rawRight, maxX);
        if (right - left <= 0) return null;

        const status = STATUS_STYLES[eventStatus(event)];
        const label = eventLabel(event);
        return (
          <Pressable
            key={`${event.kind}-${event.id}`}
            onPress={() => onEventPress(event)}
            accessibilityRole="button"
            accessibilityLabel={`${status.label} : ${label}, ${formatRange(event.start, event.end)}`}
            style={({ pressed }) => [
              styles.bar,
              {
                left,
                width: right - left,
                backgroundColor: status.background,
                borderColor: status.border ?? 'transparent',
                borderStyle: status.dashed ? 'dashed' : 'solid',
                borderTopLeftRadius: rawLeft >= 0 ? radius.inner : 0,
                borderBottomLeftRadius: rawLeft >= 0 ? radius.inner : 0,
                borderTopRightRadius: rawRight <= maxX ? radius.inner : 0,
                borderBottomRightRadius: rawRight <= maxX ? radius.inner : 0,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <Text style={[styles.barText, { color: status.text }]} numberOfLines={1}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.neutral[0],
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    overflow: 'hidden',
  },
  labels: {
    width: LABEL_WIDTH,
    borderRightWidth: 1,
    borderRightColor: colors.neutral[200],
    backgroundColor: colors.neutral[0],
  },
  labelHeader: {
    justifyContent: 'center',
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  monthLabel: {
    fontFamily: typography.fontBodyBold,
    fontSize: 11,
    color: colors.neutral[600],
    textTransform: 'capitalize',
  },
  labelCell: {
    height: ROW_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  thumb: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  thumbImage: { width: '100%', height: '100%' },
  labelText: { flex: 1 },
  logementTitle: { fontFamily: typography.fontBodyBold, fontSize: 11.5, color: colors.neutral[900] },
  logementCity: { fontFamily: typography.fontBody, fontSize: 10, color: colors.neutral[600] },

  dayHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  dayHeader: { width: DAY_WIDTH, alignItems: 'center', justifyContent: 'center', gap: 3 },
  weekday: { fontFamily: typography.fontBody, fontSize: 10, color: colors.neutral[600] },
  weekdayToday: { color: colors.forest[600], fontFamily: typography.fontBodySemiBold },
  dayNumber: { width: 24, height: 24, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  dayNumberToday: { backgroundColor: colors.forest[600] },
  dayNumberText: { fontFamily: typography.fontBodyBold, fontSize: 12, color: colors.neutral[900] },
  dayNumberTextToday: { color: colors.neutral[0] },

  row: {
    height: ROW_HEIGHT,
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  cell: {
    width: DAY_WIDTH,
    height: '100%',
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: colors.neutral[200],
  },
  weekend: { backgroundColor: colors.neutral[50] },
  past: { backgroundColor: colors.neutral[100] },
  cellPressed: { backgroundColor: colors.forest[50] },
  cellAnchor: { backgroundColor: colors.forest[100] },
  todayLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: colors.forest[500],
    opacity: 0.5,
  },
  bar: {
    position: 'absolute',
    top: 12,
    height: 40,
    borderWidth: 1,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  barText: { fontFamily: typography.fontBodyBold, fontSize: 11.5 },
});
