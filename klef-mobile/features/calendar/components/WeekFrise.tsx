import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, type LayoutChangeEvent } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { colors, radius, typography } from '../../../shared/theme/tokens';
import type { OwnerCalendarEvent, OwnerCalendarLogement } from '../types';
import { diffDays, type Day } from '../lib/days';
import { STATUS_STYLES, eventLabel, eventStatus } from '../lib/event-styles';
import { logementColor } from '../lib/planning';

/** Mêmes marges et écart que les pastilles de WeekCard : les colonnes tombent pile sous les jours. */
export const FRISE_INSET = 14;
const GAP = 4;
const DAYS = 7;

interface WeekFriseProps {
  weekStart: Day;
  today: Day;
  logements: OwnerCalendarLogement[];
  events: OwnerCalendarEvent[];
  onEventPress: (event: OwnerCalendarEvent) => void;
  onLogementPress: (logementId: string) => void;
}

/**
 * Frise de la semaine, un logement par ligne. Chaque séjour va de midi (arrivée)
 * à midi (départ), comme un planning d'hôtel ; un trait marque « maintenant ».
 */
export function WeekFrise({ weekStart, today, logements, events, onEventPress, onLogementPress }: WeekFriseProps) {
  const [inner, setInner] = useState(0);
  const col = (inner - GAP * (DAYS - 1)) / DAYS;
  const midday = (index: number) => index * (col + GAP) + col / 2;

  const todayIndex = diffDays(weekStart, today);
  const showToday = inner > 0 && todayIndex >= 0 && todayIndex < DAYS;
  const now = new Date();
  const nowX = todayIndex * (col + GAP) + col * ((now.getHours() * 60 + now.getMinutes()) / 1440);

  const onLayout = (e: LayoutChangeEvent) => setInner(e.nativeEvent.layout.width - FRISE_INSET * 2);

  return (
    <View onLayout={onLayout} style={styles.frise}>
      {showToday && (
        <>
          <View style={[styles.todayCol, { left: FRISE_INSET + todayIndex * (col + GAP), width: col }]} />
          <View style={[styles.nowLine, { left: FRISE_INSET + nowX - 1 }]} />
        </>
      )}

      {inner > 0 &&
        logements.map((logement) => {
          const rowEvents = events.filter(
            (e) =>
              e.logementId === logement.id &&
              e.end > weekStart &&
              diffDays(weekStart, e.start) < DAYS &&
              (e.kind === 'BLOCK' || (e.statut !== 'CANCELLED' && e.statut !== 'EXPIRED')),
          );
          return (
            <View key={logement.id} style={styles.row}>
              <TouchableOpacity
                onPress={() => onLogementPress(logement.id)}
                style={styles.rowTitle}
                accessibilityRole="button"
                accessibilityLabel={`${logement.titre} : prix et disponibilités`}
              >
                <View style={[styles.dot, { backgroundColor: logementColor(logements, logement.id) }]} />
                <Text style={styles.rowTitleText} numberOfLines={1}>
                  {logement.titre}
                </Text>
                <ChevronRight size={13} color={colors.neutral[500]} strokeWidth={2.4} />
              </TouchableOpacity>

              <View style={styles.lane}>
                {rowEvents.map((event) => {
                  const startIdx = diffDays(weekStart, event.start);
                  const endIdx = diffDays(weekStart, event.end);
                  const clippedStart = startIdx < 0;
                  const clippedEnd = endIdx > DAYS - 1;
                  const left = clippedStart ? -FRISE_INSET : midday(startIdx);
                  const right = clippedEnd ? inner + FRISE_INSET : midday(endIdx);
                  const status = eventStatus(event);
                  const style = STATUS_STYLES[status];
                  const inStay = status === 'CHECKED_IN';
                  const pending = status === 'PAID';
                  return (
                    <TouchableOpacity
                      key={event.id}
                      activeOpacity={0.85}
                      onPress={() => onEventPress(event)}
                      accessibilityRole="button"
                      accessibilityLabel={`${style.label} · ${eventLabel(event)}`}
                      style={[
                        styles.bar,
                        {
                          left: FRISE_INSET + left,
                          width: Math.max(right - left, 18),
                          backgroundColor: inStay ? colors.forest[950] : pending ? colors.lime[400] : style.background,
                          borderTopLeftRadius: clippedStart ? 0 : 13,
                          borderBottomLeftRadius: clippedStart ? 0 : 13,
                          borderTopRightRadius: clippedEnd ? 0 : 13,
                          borderBottomRightRadius: clippedEnd ? 0 : 13,
                        },
                        pending && styles.barPending,
                        style.dashed && { borderWidth: 1.5, borderStyle: 'dashed', borderColor: style.border },
                      ]}
                    >
                      {inStay && event.kind === 'RESERVATION' && (
                        <View style={styles.avatar}>
                          <Text style={styles.avatarText}>{event.locataire.prenom.charAt(0).toUpperCase()}</Text>
                        </View>
                      )}
                      <Text
                        numberOfLines={1}
                        style={[styles.barText, { color: inStay ? colors.neutral[50] : pending ? colors.forest[950] : style.text }]}
                      >
                        {eventLabel(event)}
                        {pending ? ' · à décider' : ''}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          );
        })}
    </View>
  );
}

const styles = StyleSheet.create({
  frise: { overflow: 'hidden' },
  todayCol: { position: 'absolute', top: 0, bottom: 0, backgroundColor: 'rgba(211,242,110,0.24)', borderRadius: 10 },
  nowLine: { position: 'absolute', top: 0, bottom: 0, width: 2, backgroundColor: colors.forest[950] },
  row: { paddingVertical: 6, gap: 6 },
  rowTitle: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingVertical: 2, paddingLeft: 4 },
  dot: { width: 8, height: 8, borderRadius: radius.pill },
  rowTitleText: { maxWidth: 260, fontFamily: typography.fontBodyBold, fontSize: 12, color: colors.neutral[900] },
  lane: { height: 40 },
  bar: {
    position: 'absolute',
    top: 0,
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 9,
    overflow: 'hidden',
  },
  barPending: { borderWidth: 1.5, borderColor: colors.lime[600] },
  barText: { flexShrink: 1, fontFamily: typography.fontBodySemiBold, fontSize: 11 },
  avatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.lime[400],
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: typography.fontBodyBold, fontSize: 10, color: colors.forest[950] },
});
