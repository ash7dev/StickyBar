import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ArrowUp, ChevronRight, LogIn, LogOut } from 'lucide-react-native';
import { colors, radius, typography } from '../../../shared/theme/tokens';
import type { PendingDecision } from '../../calendar/hooks/usePendingDecisions';
import type { OwnerCalendarEvent, OwnerCalendarReservationEvent } from '../../calendar/types';
import { formatExpiry } from '../../calendar/lib/agenda';
import { addDays, formatShort, type Day } from '../../calendar/lib/days';
import { apiErrorMessage } from '../../calendar/hooks/useOwnerCalendar';
import { DEFAULT_CHECKIN_LABEL, useAcceptReservation } from '../hooks/useOwnerOverview';
import type { OwnerOverviewResponse } from '../types';
import { formatAmount, formatFCFA, initials, monthLong } from '../lib/format';

// Accueil hôte (direction H1 sur fond clair + « À faire maintenant » de H4) :
// une carte sombre pour l'argent, une demande à la fois, puis la journée.

const INK = colors.forest[950];
const PAPER = colors.neutral[50];
const URGENT_MS = 6 * 3_600_000;
const STAY_STATUSES = new Set(['CONFIRMED', 'CHECKED_IN']);

const tap = () => Haptics.selectionAsync().catch(() => {});

// ── Argent : solde + revenus des six derniers mois ───────────────────────────

export function MoneyCard({
  wallet,
  revenue,
  today,
}: {
  wallet: OwnerOverviewResponse['wallet'];
  revenue: OwnerOverviewResponse['revenue'];
  today: Day;
}) {
  const router = useRouter();
  const go = (href: string) => {
    tap();
    router.navigate(href as never);
  };

  const next = wallet.upcomingPayouts[0];
  const nextLabel = next
    ? next.date.slice(0, 10) === today
      ? `+ ${formatFCFA(next.amount)} libérés aujourd’hui`
      : `+ ${formatFCFA(next.amount)} le ${formatShort(next.date.slice(0, 10))}`
    : null;

  const max = Math.max(...revenue.monthly.map((m) => m.revenue), 1);
  const last = revenue.monthly.length - 1;
  const month = monthLong(revenue.monthly[last].month);
  const change = revenue.changePct;

  return (
    <View style={styles.money}>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => go('/(owner)/wallet')}
        accessibilityRole="button"
        accessibilityLabel={`Solde disponible ${formatFCFA(wallet.available)}. Ouvrir le wallet`}
        style={styles.balance}
      >
        <Text style={styles.moneyLabel}>Solde disponible</Text>
        <View style={styles.amountRow}>
          <Text style={styles.amount} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
            {formatAmount(wallet.available)}
          </Text>
          <Text style={styles.currency}>FCFA</Text>
        </View>
        {nextLabel && (
          <View style={styles.payoutChip}>
            <ArrowUp size={13} color={colors.lime[400]} strokeWidth={2.6} />
            <Text style={styles.payoutText} numberOfLines={1}>
              {nextLabel}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => go('/(owner)/stats')}
        accessibilityRole="button"
        accessibilityLabel={`Revenus nets de ${month} : ${formatFCFA(revenue.currentMonth)}. Voir les statistiques`}
        style={styles.revenue}
      >
        <View style={styles.revenueTop}>
          <Text style={styles.revenueLabel} numberOfLines={1}>
            {month.charAt(0).toUpperCase() + month.slice(1)} ·{' '}
            <Text style={styles.revenueValue}>{formatAmount(revenue.currentMonth)}</Text> FCFA
          </Text>
          {change !== null && (
            <Text style={[styles.change, change < 0 && styles.changeDown]}>
              {change >= 0 ? '+' : ''}
              {change} %
            </Text>
          )}
        </View>
        <View style={styles.bars}>
          {revenue.monthly.map((m, i) => (
            <View
              key={m.month}
              style={[
                styles.bar,
                { height: `${Math.max((m.revenue / max) * 100, 6)}%` },
                i === last ? styles.barCurrent : i === last - 1 ? styles.barPrevious : null,
              ]}
            />
          ))}
        </View>
      </TouchableOpacity>

      <View style={styles.moneyActions}>
        <TouchableOpacity onPress={() => go('/(owner)/wallet')} style={[styles.moneyBtn, styles.moneyBtnLime]} accessibilityRole="button">
          <Text style={styles.moneyBtnLimeText}>Retirer</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => go('/(owner)/stats')} style={[styles.moneyBtn, styles.moneyBtnGhost]} accessibilityRole="button">
          <Text style={styles.moneyBtnGhostText}>Mes revenus</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── À faire maintenant : une demande à la fois ───────────────────────────────

interface FocusQueueProps {
  decisions: PendingDecision[];
  /** Phrase « Ensuite » : prochain mouvement de la journée, s'il y en a un. */
  nextUp: string | null;
}

export function FocusQueue({ decisions, nextUp }: FocusQueueProps) {
  const [index, setIndex] = useState(0);
  const count = decisions.length;
  const current = count > 0 ? decisions[index % count] : null;

  const showNext = () => {
    tap();
    setIndex((i) => (i + 1) % count);
  };

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle} accessibilityRole="header">
          À faire maintenant
        </Text>
        <View style={styles.flex} />
        {count > 1 ? (
          <TouchableOpacity onPress={showNext} style={styles.counter} accessibilityRole="button" accessibilityLabel="Demande suivante">
            <Text style={styles.counterText}>
              {(index % count) + 1} sur {count}
            </Text>
            <ChevronRight size={15} color={colors.neutral[600]} />
          </TouchableOpacity>
        ) : count === 1 ? (
          <Text style={styles.counterText}>1 sur 1</Text>
        ) : null}
      </View>

      {current ? (
        <View style={[styles.stack, { paddingBottom: count > 2 ? 24 : count > 1 ? 12 : 0 }]}>
          {count > 2 && <View style={[styles.layer, styles.layerBack]} />}
          {count > 1 && <View style={[styles.layer, styles.layerMid, { bottom: count > 2 ? 12 : 0 }]} />}
          <FocusCard key={current.id} decision={current} />
        </View>
      ) : (
        <View style={styles.calm}>
          <Text style={styles.calmTitle}>Tout est à jour</Text>
          <Text style={styles.calmText}>Aucune demande en attente. Vous serez prévenu dès qu’un voyageur réserve.</Text>
        </View>
      )}

      {nextUp && (
        <View style={styles.nextUp}>
          <Text style={styles.nextUpLabel}>Ensuite</Text>
          <View style={styles.dot} />
          <Text style={styles.nextUpText} numberOfLines={1}>
            {nextUp}
          </Text>
        </View>
      )}
    </View>
  );
}

function FocusCard({ decision }: { decision: PendingDecision }) {
  const router = useRouter();
  const accept = useAcceptReservation();
  const urgent = new Date(decision.delaiConfirmation).getTime() - Date.now() < URGENT_MS;
  const nights = `${decision.nbNuits} nuit${decision.nbNuits > 1 ? 's' : ''}`;
  const start = formatShort(decision.dateDebut.slice(0, 10));
  const end = formatShort(decision.dateFin.slice(0, 10));

  const openDetails = () => {
    tap();
    router.push({ pathname: '/(owner)/reservations/[id]' as never, params: { id: decision.id } });
  };

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
    <View style={styles.focus}>
      <View style={styles.focusTop}>
        <View style={styles.focusBadge}>
          <Text style={styles.focusBadgeText}>DEMANDE DE RÉSERVATION</Text>
        </View>
        <Text style={[styles.focusExpiry, urgent && styles.focusExpiryUrgent]}>{formatExpiry(decision.delaiConfirmation)}</Text>
      </View>

      <TouchableOpacity activeOpacity={0.8} onPress={openDetails} accessibilityRole="button" style={styles.focusBody}>
        <View style={styles.guest}>
          <View style={styles.guestAvatar}>
            <Text style={styles.guestAvatarText}>{initials(decision.locataire?.prenom, decision.locataire?.nom)}</Text>
          </View>
          <View style={styles.flex}>
            <Text style={styles.guestName} numberOfLines={1}>
              {decision.locataire?.prenom ?? 'Voyageur'}
              {decision.locataire?.nom ? ` ${decision.locataire.nom.charAt(0)}.` : ''}
            </Text>
            <Text style={styles.guestMeta}>Voir le profil et la demande</Text>
          </View>
        </View>

        <Text style={styles.focusTitle}>
          {decision.logement?.titre ?? 'Votre logement'},{'\n'}
          {nights} du {start} au {end}
        </Text>

        {decision.netProprietaire !== undefined && (
          <View style={styles.focusAmountRow}>
            <Text style={styles.focusAmount}>{formatAmount(decision.netProprietaire)}</Text>
            <Text style={styles.focusAmountNote}>FCFA, versés à son arrivée</Text>
          </View>
        )}
      </TouchableOpacity>

      <View style={styles.focusActions}>
        <TouchableOpacity onPress={openDetails} style={[styles.focusBtn, styles.focusBtnGhost]} accessibilityRole="button">
          <Text style={styles.focusBtnGhostText}>Refuser</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={confirmAccept}
          disabled={accept.isPending}
          style={[styles.focusBtn, styles.focusBtnInk, accept.isPending && styles.disabled]}
          accessibilityRole="button"
        >
          <Text style={styles.focusBtnInkText}>{accept.isPending ? 'Acceptation…' : 'Accepter'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Aujourd'hui ──────────────────────────────────────────────────────────────

type Move = { kind: 'DEPARTURE' | 'ARRIVAL'; event: OwnerCalendarReservationEvent; when: string };

/** Départs du jour, arrivées du jour puis de demain. */
export function buildMoves(events: OwnerCalendarEvent[], today: Day): Move[] {
  const tomorrow = addDays(today, 1);
  const stays = events.filter(
    (e): e is OwnerCalendarReservationEvent => e.kind === 'RESERVATION' && STAY_STATUSES.has(e.statut),
  );
  return [
    ...stays.filter((e) => e.end === today).map((event) => ({ kind: 'DEPARTURE' as const, event, when: 'Aujourd’hui' })),
    ...stays.filter((e) => e.start === today).map((event) => ({ kind: 'ARRIVAL' as const, event, when: 'Aujourd’hui' })),
    ...stays.filter((e) => e.start === tomorrow).map((event) => ({ kind: 'ARRIVAL' as const, event, when: 'Demain' })),
  ];
}

export function describeMove(move: Move, logementTitles: Map<string, string>): string {
  const who = `${move.event.locataire.prenom} ${move.event.locataire.nomInitiale}`.trim();
  const where = logementTitles.get(move.event.logementId);
  const what = move.kind === 'DEPARTURE' ? `départ de ${who}` : `arrivée de ${who}`;
  return `${move.when} · ${what}${where ? ` · ${where}` : ''}`;
}

export function TodayList({ moves, logementTitles }: { moves: Move[]; logementTitles: Map<string, string> }) {
  const router = useRouter();

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle} accessibilityRole="header">
          Aujourd’hui
        </Text>
        <View style={styles.flex} />
        <TouchableOpacity onPress={() => router.navigate('/(owner)/today' as never)} accessibilityRole="link">
          <Text style={styles.link}>Tout voir</Text>
        </TouchableOpacity>
      </View>

      {moves.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.empty}>Aucune arrivée ni départ aujourd’hui ou demain.</Text>
        </View>
      ) : (
        moves.map(({ kind, event, when }) => {
          const isDeparture = kind === 'DEPARTURE';
          const Icon = isDeparture ? LogOut : LogIn;
          return (
            <TouchableOpacity
              key={`${kind}-${event.id}`}
              activeOpacity={0.8}
              onPress={() => {
                tap();
                router.push({ pathname: '/(owner)/reservations/[id]' as never, params: { id: event.id } });
              }}
              style={styles.row}
              accessibilityRole="button"
            >
              <View style={[styles.rowIcon, !isDeparture && styles.rowIconArrival]}>
                <Icon size={17} color={isDeparture ? colors.neutral[700] : colors.lime[400]} />
              </View>
              <View style={styles.flex}>
                <Text style={styles.rowTitle} numberOfLines={1}>
                  {isDeparture ? 'Départ' : 'Arrivée'} · {event.locataire.prenom} {event.locataire.nomInitiale}
                </Text>
                <Text style={styles.rowMeta} numberOfLines={1}>
                  {when} · {logementTitles.get(event.logementId) ?? ''}
                </Text>
              </View>
              <ChevronRight size={16} color={colors.neutral[400]} />
            </TouchableOpacity>
          );
        })
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  disabled: { opacity: 0.6 },

  // Carte argent (sombre)
  money: { gap: 18, padding: 20, borderRadius: 28, backgroundColor: INK },
  balance: { gap: 8 },
  moneyLabel: { fontFamily: typography.fontBodySemiBold, fontSize: 12, color: colors.forest[200] },
  amountRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  amount: { flexShrink: 1, fontFamily: typography.fontDisplaySemiBold, fontSize: 46, letterSpacing: -1.4, color: PAPER },
  currency: { fontFamily: typography.fontBodySemiBold, fontSize: 15, color: colors.forest[200] },
  payoutChip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 30,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(211,242,110,0.12)',
  },
  payoutText: { fontFamily: typography.fontBodySemiBold, fontSize: 12, color: colors.lime[400] },
  revenue: { gap: 12, padding: 14, borderRadius: 20, backgroundColor: 'rgba(248,251,244,0.05)' },
  revenueTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 },
  revenueLabel: { flex: 1, fontFamily: typography.fontBodySemiBold, fontSize: 13, color: PAPER },
  revenueValue: { fontFamily: typography.fontDisplaySemiBold },
  change: { fontFamily: typography.fontBodyBold, fontSize: 12, color: colors.lime[400] },
  changeDown: { color: colors.error[500] },
  bars: { height: 56, flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  bar: { flex: 1, borderRadius: 7, backgroundColor: 'rgba(248,251,244,0.12)' },
  barPrevious: { backgroundColor: 'rgba(248,251,244,0.24)' },
  barCurrent: { backgroundColor: colors.lime[400] },
  moneyActions: { flexDirection: 'row', gap: 10 },
  moneyBtn: { flex: 1, height: 46, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  moneyBtnLime: { backgroundColor: colors.lime[400] },
  moneyBtnLimeText: { fontFamily: typography.fontBodyBold, fontSize: 14, color: INK },
  moneyBtnGhost: { borderWidth: 1, borderColor: 'rgba(248,251,244,0.25)' },
  moneyBtnGhostText: { fontFamily: typography.fontBodySemiBold, fontSize: 14, color: PAPER },

  // Sections
  section: { gap: 12 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontFamily: typography.fontBodyBold, fontSize: 17, color: colors.neutral[900] },
  counter: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingVertical: 6, paddingLeft: 8 },
  counterText: { fontFamily: typography.fontBodySemiBold, fontSize: 13, color: colors.neutral[600] },
  link: { fontFamily: typography.fontBodySemiBold, fontSize: 13, color: colors.link },

  // À faire maintenant (H4)
  stack: { position: 'relative' },
  layer: { position: 'absolute', borderRadius: 30 },
  layerBack: { left: 24, right: 24, top: 24, bottom: 0, backgroundColor: colors.neutral[200] },
  layerMid: { left: 12, right: 12, top: 12, backgroundColor: colors.forest[600] },
  focus: {
    gap: 18,
    padding: 20,
    borderRadius: 30,
    backgroundColor: colors.lime[400],
    shadowColor: INK,
    shadowOpacity: 0.16,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 14 },
    elevation: 6,
  },
  focusTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  focusBadge: { height: 28, paddingHorizontal: 12, borderRadius: radius.pill, backgroundColor: INK, justifyContent: 'center' },
  focusBadgeText: { fontFamily: typography.fontBodyBold, fontSize: 10.5, letterSpacing: 0.6, color: colors.lime[400] },
  focusExpiry: { fontFamily: typography.fontBodyBold, fontSize: 12, color: colors.forest[800] },
  focusExpiryUrgent: { color: colors.error[700] },
  focusBody: { gap: 16 },
  guest: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  guestAvatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: INK, alignItems: 'center', justifyContent: 'center' },
  guestAvatarText: { fontFamily: typography.fontBodyBold, fontSize: 16, color: colors.lime[400] },
  guestName: { fontFamily: typography.fontBodyBold, fontSize: 17, color: INK },
  guestMeta: { fontFamily: typography.fontBody, fontSize: 12, color: colors.forest[800], marginTop: 2 },
  focusTitle: { fontFamily: typography.fontDisplaySemiBold, fontSize: 26, lineHeight: 30, letterSpacing: -0.6, color: INK },
  focusAmountRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' },
  focusAmount: { fontFamily: typography.fontDisplaySemiBold, fontSize: 24, color: INK },
  focusAmountNote: { fontFamily: typography.fontBodySemiBold, fontSize: 13, color: colors.forest[800] },
  focusActions: { flexDirection: 'row', gap: 8 },
  focusBtn: { height: 52, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  focusBtnGhost: { flex: 1, borderWidth: 1.5, borderColor: 'rgba(4,25,18,0.25)' },
  focusBtnGhostText: { fontFamily: typography.fontBodySemiBold, fontSize: 15, color: INK },
  focusBtnInk: { flex: 2, backgroundColor: INK },
  focusBtnInkText: { fontFamily: typography.fontBodySemiBold, fontSize: 15, color: colors.lime[400] },
  calm: {
    gap: 4,
    padding: 18,
    borderRadius: 24,
    backgroundColor: colors.neutral[0],
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  calmTitle: { fontFamily: typography.fontDisplaySemiBold, fontSize: 18, color: colors.neutral[900] },
  calmText: { fontFamily: typography.fontBody, fontSize: 13, lineHeight: 19, color: colors.neutral[600] },
  nextUp: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 4 },
  nextUpLabel: { fontFamily: typography.fontBodyBold, fontSize: 13, color: colors.neutral[900] },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.neutral[400] },
  nextUpText: { flex: 1, fontFamily: typography.fontBody, fontSize: 13, color: colors.neutral[600] },

  // Aujourd'hui
  emptyCard: { padding: 16, borderRadius: 20, backgroundColor: colors.neutral[0], borderWidth: 1, borderColor: colors.neutral[200] },
  empty: { fontFamily: typography.fontBody, fontSize: 13, color: colors.neutral[600] },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 20,
    backgroundColor: colors.neutral[0],
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  rowIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowIconArrival: { backgroundColor: INK },
  rowTitle: { fontFamily: typography.fontBodySemiBold, fontSize: 14, color: colors.neutral[900] },
  rowMeta: { fontFamily: typography.fontBody, fontSize: 12, color: colors.neutral[600], marginTop: 2 },
});
