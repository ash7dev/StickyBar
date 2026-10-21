import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, typography } from '../../../shared/theme/tokens';
import type { OwnerCalendarEvent } from '../../calendar/types';
import { buildAgenda } from '../../calendar/lib/agenda';
import { addDays, dayOfMonth, formatWeekdayShort, type Day } from '../../calendar/lib/days';

const MAX_ROWS = 4;
const LABELS = { ARRIVAL: 'Arrivée', DEPARTURE: 'Départ', BLOCK: 'Bloqué' } as const;

interface WeekSectionProps {
  events: OwnerCalendarEvent[];
  logementTitles: Map<string, string>;
  today: Day;
}

/** Aperçu des 7 prochains jours (à partir de demain) ; le détail est sur l'écran Aujourd'hui. */
export function WeekSection({ events, logementTitles, today }: WeekSectionProps) {
  const router = useRouter();
  const from = addDays(today, 1);
  const rows = buildAgenda(events, from, addDays(today, 7), null)
    .flatMap(({ day, items }) => items.map((item) => ({ day, item })))
    .slice(0, MAX_ROWS);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title} accessibilityRole="header">
          Cette semaine
        </Text>
        <TouchableOpacity onPress={() => router.navigate('/(owner)/today' as never)} accessibilityRole="link">
          <Text style={styles.link}>Tout voir</Text>
        </TouchableOpacity>
      </View>

      {rows.length === 0 ? (
        <Text style={styles.empty}>Aucune arrivée ni départ prévu les 7 prochains jours.</Text>
      ) : (
        rows.map(({ day, item }) => {
          const who =
            item.kind === 'BLOCK'
              ? item.event.motif || 'Indisponible'
              : `${item.event.locataire.prenom} ${item.event.locataire.nomInitiale}`.trim();
          return (
            <View key={`${item.kind}-${item.event.id}`} style={styles.row}>
              <View style={styles.date}>
                <Text style={styles.weekday}>{formatWeekdayShort(day).toUpperCase()}</Text>
                <Text style={styles.dayNum}>{dayOfMonth(day)}</Text>
              </View>
              <Text style={styles.rowText} numberOfLines={1}>
                <Text style={styles.rowStrong}>{LABELS[item.kind]}</Text> {who} · {logementTitles.get(item.event.logementId)}
              </Text>
            </View>
          );
        })
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 12,
    padding: 18,
    borderRadius: 24,
    backgroundColor: colors.neutral[0],
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontFamily: typography.fontBodyBold, fontSize: 16, color: colors.neutral[900] },
  link: { fontFamily: typography.fontBodySemiBold, fontSize: 13, color: colors.link },
  empty: { fontFamily: typography.fontBody, fontSize: 13, color: colors.neutral[600] },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  date: { width: 44, alignItems: 'center' },
  weekday: { fontFamily: typography.fontBody, fontSize: 11, color: colors.neutral[600] },
  dayNum: { fontFamily: typography.fontDisplaySemiBold, fontSize: 20, color: colors.neutral[900] },
  rowText: { flex: 1, fontFamily: typography.fontBody, fontSize: 13, color: colors.neutral[900] },
  rowStrong: { fontFamily: typography.fontBodyBold },
});
