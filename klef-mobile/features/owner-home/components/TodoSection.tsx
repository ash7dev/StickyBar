import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronRight, LogIn, LogOut } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors, radius, typography } from '../../../shared/theme/tokens';
import type { PendingDecision } from '../../calendar/hooks/usePendingDecisions';
import type { OwnerCalendarEvent, OwnerCalendarReservationEvent } from '../../calendar/types';
import { formatExpiry } from '../../calendar/lib/agenda';
import { addDays, formatShort, type Day } from '../../calendar/lib/days';
import { apiErrorMessage } from '../../calendar/hooks/useOwnerCalendar';
import { DEFAULT_CHECKIN_LABEL, useAcceptReservation } from '../hooks/useOwnerOverview';

const URGENT_MS = 6 * 3_600_000;
const STAY_STATUSES = new Set(['CONFIRMED', 'CHECKED_IN']);

interface TodoSectionProps {
  decisions: PendingDecision[];
  events: OwnerCalendarEvent[];
  logementTitles: Map<string, string>;
  today: Day;
}

type Task =
  | { kind: 'DEPARTURE'; event: OwnerCalendarReservationEvent }
  | { kind: 'ARRIVAL'; event: OwnerCalendarReservationEvent; when: 'today' | 'tomorrow' };

/** « À faire aujourd'hui » : demandes à décider, puis départs et arrivées imminents. */
export function TodoSection({ decisions, events, logementTitles, today }: TodoSectionProps) {
  const router = useRouter();
  const tomorrow = addDays(today, 1);

  const stays = events.filter(
    (e): e is OwnerCalendarReservationEvent => e.kind === 'RESERVATION' && STAY_STATUSES.has(e.statut),
  );
  const tasks: Task[] = [
    ...stays.filter((e) => e.end === today).map((event) => ({ kind: 'DEPARTURE' as const, event })),
    ...stays
      .filter((e) => e.start === today || e.start === tomorrow)
      .map((event) => ({ kind: 'ARRIVAL' as const, event, when: event.start === today ? ('today' as const) : ('tomorrow' as const) })),
  ];
  const count = decisions.length + tasks.length;

  const openReservation = (id: string) => {
    Haptics.selectionAsync().catch(() => {});
    router.push({ pathname: '/(owner)/reservations/[id]' as never, params: { id } });
  };

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.title} accessibilityRole="header">
          À faire aujourd’hui
        </Text>
        {count > 0 && (
          <View style={styles.count}>
            <Text style={styles.countText}>{count}</Text>
          </View>
        )}
      </View>

      {count === 0 && (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Rien d’urgent. Aucune demande ni mouvement aujourd’hui.</Text>
        </View>
      )}

      {decisions.map((d) => (
        <DecisionCard key={d.id} decision={d} onDetails={() => openReservation(d.id)} />
      ))}

      {tasks.map((task) => {
        const isDeparture = task.kind === 'DEPARTURE';
        const Icon = isDeparture ? LogOut : LogIn;
        const titre = logementTitles.get(task.event.logementId) ?? '';
        return (
          <TouchableOpacity
            key={`${task.kind}-${task.event.id}`}
            activeOpacity={0.85}
            onPress={() => openReservation(task.event.id)}
            style={styles.task}
            accessibilityRole="button"
          >
            <View style={[styles.taskIcon, { backgroundColor: isDeparture ? colors.success[50] : colors.forest[50] }]}>
              <Icon size={18} color={isDeparture ? colors.success[700] : colors.forest[600]} />
            </View>
            <View style={styles.taskText}>
              <Text style={styles.taskTitle} numberOfLines={1}>
                {isDeparture
                  ? `État des lieux · ${task.event.locataire.prenom}`
                  : `Arrivée ${task.when === 'today' ? 'aujourd’hui' : 'demain'} · ${task.event.locataire.prenom}`}
              </Text>
              <Text style={styles.taskMeta} numberOfLines={1}>
                {titre}
                {isDeparture ? ' · départ du jour' : ` · ${task.event.nbPersonnes} voyageur${task.event.nbPersonnes > 1 ? 's' : ''}`}
              </Text>
            </View>
            <ChevronRight size={16} color={colors.neutral[400]} />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function DecisionCard({ decision, onDetails }: { decision: PendingDecision; onDetails: () => void }) {
  const accept = useAcceptReservation();
  const urgent = new Date(decision.delaiConfirmation).getTime() - Date.now() < URGENT_MS;
  const start = decision.dateDebut.slice(0, 10);
  const end = decision.dateFin.slice(0, 10);

  const confirmAccept = () => {
    Alert.alert(
      'Accepter cette demande ?',
      `Arrivée à ${DEFAULT_CHECKIN_LABEL} par défaut, modifiable ensuite dans la réservation.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Accepter',
          onPress: () =>
            accept.mutate(decision.id, {
              onError: (error) => Alert.alert('Erreur', apiErrorMessage(error, 'Impossible d’accepter cette demande.')),
            }),
        },
      ],
    );
  };

  return (
    <View style={styles.decision}>
      <View style={styles.decisionTop}>
        <Text style={styles.decisionKicker}>DEMANDE</Text>
        <View style={[styles.expiry, urgent && styles.expiryUrgent]}>
          <Text style={[styles.expiryText, urgent && styles.expiryTextUrgent]}>
            {formatExpiry(decision.delaiConfirmation)}
          </Text>
        </View>
      </View>
      <View>
        <Text style={styles.decisionTitle} numberOfLines={1}>
          {decision.locataire?.prenom ?? 'Voyageur'} · {decision.logement?.titre ?? ''}
        </Text>
        <Text style={styles.decisionMeta} numberOfLines={1}>
          {formatShort(start)} → {formatShort(end)} · {decision.nbNuits} nuit{decision.nbNuits > 1 ? 's' : ''}
        </Text>
      </View>
      <View style={styles.decisionActions}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={confirmAccept}
          disabled={accept.isPending}
          style={[styles.btn, styles.btnAccept, accept.isPending && styles.btnDisabled]}
          accessibilityRole="button"
        >
          <Text style={styles.btnAcceptText}>{accept.isPending ? 'Acceptation…' : 'Accepter'}</Text>
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={0.85} onPress={onDetails} style={[styles.btn, styles.btnDetails]} accessibilityRole="button">
          <Text style={styles.btnDetailsText}>Détails</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 10 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontFamily: typography.fontBodyBold, fontSize: 16, color: colors.neutral[900] },
  count: { backgroundColor: colors.gold[400], paddingHorizontal: 9, paddingVertical: 3, borderRadius: radius.pill },
  countText: { fontFamily: typography.fontBodyBold, fontSize: 12, color: colors.gold[800] },
  empty: { padding: 16, borderRadius: 20, backgroundColor: colors.neutral[0], borderWidth: 1, borderColor: colors.neutral[200] },
  emptyText: { fontFamily: typography.fontBody, fontSize: 13, color: colors.neutral[600] },

  decision: {
    gap: 12,
    padding: 16,
    borderRadius: 22,
    backgroundColor: colors.gold[50],
    borderWidth: 1,
    borderColor: colors.gold[200],
  },
  decisionTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  decisionKicker: { fontFamily: typography.fontBodyBold, fontSize: 11, color: colors.gold[700] },
  expiry: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill, backgroundColor: colors.gold[100] },
  expiryUrgent: { backgroundColor: colors.error[50] },
  expiryText: { fontFamily: typography.fontBodyBold, fontSize: 11, color: colors.gold[800] },
  expiryTextUrgent: { color: colors.error[700] },
  decisionTitle: { fontFamily: typography.fontBodyBold, fontSize: 15, color: colors.neutral[900] },
  decisionMeta: { fontFamily: typography.fontBody, fontSize: 12, color: colors.neutral[700], marginTop: 2 },
  decisionActions: { flexDirection: 'row', gap: 8 },
  btn: { flex: 1, height: 44, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  btnAccept: { backgroundColor: colors.forest[600] },
  btnAcceptText: { fontFamily: typography.fontBodySemiBold, fontSize: 14, color: colors.neutral[0] },
  btnDetails: { backgroundColor: colors.neutral[0], borderWidth: 1, borderColor: colors.neutral[200] },
  btnDetailsText: { fontFamily: typography.fontBodySemiBold, fontSize: 14, color: colors.neutral[900] },
  btnDisabled: { opacity: 0.6 },

  task: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 20,
    backgroundColor: colors.neutral[0],
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  taskIcon: { width: 40, height: 40, borderRadius: radius.inner, alignItems: 'center', justifyContent: 'center' },
  taskText: { flex: 1, gap: 2 },
  taskTitle: { fontFamily: typography.fontBodySemiBold, fontSize: 14, color: colors.neutral[900] },
  taskMeta: { fontFamily: typography.fontBody, fontSize: 12, color: colors.neutral[600] },
});
