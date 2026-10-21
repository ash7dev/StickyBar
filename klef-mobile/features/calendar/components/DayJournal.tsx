import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, radius, typography } from '../../../shared/theme/tokens';
import type { OwnerCalendarEvent, OwnerCalendarLogement } from '../types';
import { addDays, formatLong, type Day } from '../lib/days';
import { freeLogements, logementColor, movesOn } from '../lib/planning';

interface DayJournalProps {
  day: Day;
  today: Day;
  events: OwnerCalendarEvent[];
  logements: OwnerCalendarLogement[];
  onEventPress: (event: OwnerCalendarEvent) => void;
  onLogementPress: (logementId: string) => void;
  /** Dans une feuille, le titre est déjà affiché par la feuille. */
  hideHeader?: boolean;
}

/** Ce qui se passe le jour sélectionné : départs, arrivées, blocages — ou les biens libres. */
export function DayJournal({ day, today, events, logements, onEventPress, onLogementPress, hideHeader }: DayJournalProps) {
  const moves = movesOn(events, day);
  const free = freeLogements(events, logements, day);
  const titre = (id: string) => logements.find((l) => l.id === id)?.titre ?? '';
  const label = formatLong(day);
  const relative = day === today ? 'Aujourd’hui' : day === addDays(today, 1) ? 'Demain' : day === addDays(today, -1) ? 'Hier' : null;

  return (
    <View style={styles.section}>
      {!hideHeader && (
      <View style={styles.header}>
        <Text style={styles.title} accessibilityRole="header">
          {label.charAt(0).toUpperCase() + label.slice(1)}
        </Text>
        {relative && <Text style={styles.relative}>{relative}</Text>}
      </View>
      )}

      {moves.map((move) => {
        const { event } = move;
        const color = logementColor(logements, event.logementId);

        if (move.kind === 'BLOCK') {
          return (
            <TouchableOpacity key={`b-${event.id}`} activeOpacity={0.85} onPress={() => onEventPress(event)} style={styles.lineCard} accessibilityRole="button">
              <View style={[styles.stripe, { backgroundColor: colors.neutral[300] }]} />
              <View style={styles.flex}>
                <Text style={styles.cardTitle}>Dates bloquées{move.event.motif ? ` · ${move.event.motif}` : ''}</Text>
                <Text style={styles.cardMeta} numberOfLines={1}>{titre(event.logementId)}</Text>
              </View>
            </TouchableOpacity>
          );
        }

        const who = `${move.event.locataire.prenom} ${move.event.locataire.nomInitiale}`.trim();
        const isArrival = move.kind === 'ARRIVAL';
        const toDecide = move.event.statut === 'PAID';

        if (isArrival && toDecide) {
          return (
            <TouchableOpacity key={`a-${event.id}`} activeOpacity={0.85} onPress={() => onEventPress(event)} style={styles.pendingCard} accessibilityRole="button">
              <View style={styles.flex}>
                <Text style={styles.cardTitle}>Demande · {who}</Text>
                <Text style={[styles.cardMeta, { color: colors.gold[700] }]} numberOfLines={1}>
                  {titre(event.logementId)} · {move.event.nbNuits} nuit{move.event.nbNuits > 1 ? 's' : ''}
                </Text>
              </View>
              <Text style={styles.pendingAction}>Décider ›</Text>
            </TouchableOpacity>
          );
        }

        if (isArrival) {
          return (
            <TouchableOpacity key={`a-${event.id}`} activeOpacity={0.85} onPress={() => onEventPress(event)} style={styles.arrivalCard} accessibilityRole="button">
              <View style={styles.arrivalTop}>
                <View style={[styles.stripe, { backgroundColor: colors.lime[400] }]} />
                <View style={styles.flex}>
                  <Text style={[styles.cardTitle, { color: colors.neutral[50] }]}>Arrivée · {who}</Text>
                  <Text style={[styles.cardMeta, { color: colors.forest[200] }]} numberOfLines={1}>
                    {titre(event.logementId)} · {move.event.nbNuits} nuit{move.event.nbNuits > 1 ? 's' : ''} · {move.event.nbPersonnes} voyageur
                    {move.event.nbPersonnes > 1 ? 's' : ''}
                  </Text>
                </View>
              </View>
              <View style={styles.arrivalBtn}>
                <Text style={styles.arrivalBtnText}>Ouvrir le séjour</Text>
              </View>
            </TouchableOpacity>
          );
        }

        return (
          <TouchableOpacity key={`d-${event.id}`} activeOpacity={0.85} onPress={() => onEventPress(event)} style={styles.lineCard} accessibilityRole="button">
            <View style={[styles.stripe, { backgroundColor: color }]} />
            <View style={styles.flex}>
              <Text style={styles.cardTitle}>Départ · {who}</Text>
              <Text style={styles.cardMeta} numberOfLines={1}>{titre(event.logementId)} · avant 12h</Text>
            </View>
            {move.event.statut === 'COMPLETED' && (
              <View style={styles.doneChip}>
                <Text style={styles.doneText}>Fait</Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}

      {moves.length === 0 && (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>
            Rien de prévu{free.length > 0 ? ` · ${free.length} bien${free.length > 1 ? 's' : ''} libre${free.length > 1 ? 's' : ''}` : ''}
          </Text>
          {free.length > 0 && (
            <TouchableOpacity onPress={() => onLogementPress(free[0].id)} accessibilityRole="button">
              <Text style={styles.emptyLink}>Prix & dispo ›</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 10 },
  flex: { flex: 1, minWidth: 0 },
  header: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  title: { fontFamily: typography.fontDisplaySemiBold, fontSize: 20, color: colors.neutral[900] },
  relative: { fontFamily: typography.fontBodyBold, fontSize: 12, color: colors.forest[600] },
  stripe: { width: 4, alignSelf: 'stretch', minHeight: 30, borderRadius: 2 },
  cardTitle: { fontFamily: typography.fontBodyBold, fontSize: 14, color: colors.neutral[900] },
  cardMeta: { fontFamily: typography.fontBody, fontSize: 12, color: colors.neutral[600], marginTop: 2 },

  lineCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 18,
    backgroundColor: colors.neutral[0],
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  arrivalCard: { gap: 10, padding: 12, borderRadius: 20, backgroundColor: colors.forest[950] },
  arrivalTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  arrivalBtn: { height: 40, borderRadius: radius.pill, backgroundColor: colors.lime[400], alignItems: 'center', justifyContent: 'center' },
  arrivalBtnText: { fontFamily: typography.fontBodySemiBold, fontSize: 13, color: colors.forest[950] },
  pendingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 18,
    backgroundColor: colors.gold[50],
    borderWidth: 1,
    borderColor: colors.gold[200],
  },
  pendingAction: { fontFamily: typography.fontBodyBold, fontSize: 13, color: colors.forest[950] },
  doneChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill, backgroundColor: colors.success[50] },
  doneText: { fontFamily: typography.fontBodyBold, fontSize: 11, color: colors.success[700] },
  emptyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.neutral[300],
  },
  emptyText: { flex: 1, fontFamily: typography.fontBody, fontSize: 13, color: colors.neutral[600] },
  emptyLink: { fontFamily: typography.fontBodyBold, fontSize: 12, color: colors.link },
});
