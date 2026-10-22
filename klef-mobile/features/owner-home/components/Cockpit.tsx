import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { ArrowRight, ArrowUp, Banknote, CalendarDays, Check, ChevronRight, Clock, Coffee, Home, LogIn, LogOut, Moon, Users } from 'lucide-react-native';
import { colors, radius, typography } from '../../../shared/theme/tokens';
import { nameCase } from '../../home/lib/home';
import type { PendingDecision } from '../../calendar/hooks/usePendingDecisions';
import type { OwnerCalendarEvent, OwnerCalendarReservationEvent } from '../../calendar/types';
import { formatExpiry } from '../../calendar/lib/agenda';
import { addDays, formatLong, formatShort, type Day } from '../../calendar/lib/days';
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
  const router = useRouter();
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
          {/* Cercles décoratifs : le calme, pas le vide */}
          <View style={[styles.calmRing, styles.calmRingOuter]} />
          <View style={[styles.calmRing, styles.calmRingInner]} />

          <View style={styles.calmBadge}>
            <Check size={18} color={INK} strokeWidth={3} />
          </View>
          <View style={styles.calmBody}>
            <Text style={styles.calmTitle}>
              Rien ne vous attend.{'\n'}
              <Text style={styles.calmAccent}>Tout est à jour.</Text>
            </Text>
            <Text style={styles.calmText}>Aucune demande en attente. Vous êtes prévenu dès qu’un voyageur réserve.</Text>
          </View>

          {nextUp && (
            <View style={styles.calmNext}>
              <Clock size={14} color={colors.lime[400]} />
              <View style={styles.flex}>
                <Text style={styles.calmNextLabel}>ENSUITE</Text>
                <Text style={styles.calmNextText} numberOfLines={2}>
                  {nextUp}
                </Text>
              </View>
            </View>
          )}

          <View style={styles.calmActions}>
            <TouchableOpacity
              onPress={() => {
                tap();
                router.navigate('/(owner)/calendar' as never);
              }}
              style={[styles.calmBtn, styles.calmBtnLime]}
              accessibilityRole="link"
            >
              <CalendarDays size={15} color={INK} />
              <Text style={styles.calmBtnLimeText}>Calendrier</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                tap();
                router.navigate('/(owner)/listings' as never);
              }}
              style={[styles.calmBtn, styles.calmBtnGhost]}
              accessibilityRole="link"
            >
              <Home size={15} color={PAPER} />
              <Text style={styles.calmBtnGhostText}>Mes annonces</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {current && nextUp && (
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
              {nameCase(decision.locataire?.prenom) ?? 'Voyageur'}
              {decision.locataire?.nom ? ` ${decision.locataire.nom.charAt(0)}.` : ''}
            </Text>
            <Text style={styles.guestMeta}>Voir le profil et la demande</Text>
          </View>
        </View>

        <Text style={styles.focusTitle}>
          {decision.logement?.titre ?? 'Votre logement'},{'\n'}
          {nights} du {start} au {end}
        </Text>

        {decision.netProprietaire !== undefined &&
          (() => {
            // Acompte : Paixi verse l'acompte moins sa commission, le solde se règle sur place (credit-wallet)
            const deposit = decision.typePaiement?.toUpperCase() === 'DEPOSIT' && Number(decision.montantSoldeRestant ?? 0) > 0;
            const viaPaixi = deposit ? Math.max(0, Number(decision.montantAcompte ?? 0) - Number(decision.montantCommission ?? 0)) : Number(decision.netProprietaire);
            return (
              <View style={{ gap: 2 }}>
                <View style={styles.focusAmountRow}>
                  <Text style={styles.focusAmount}>{formatAmount(viaPaixi)}</Text>
                  <Text style={styles.focusAmountNote}>FCFA versés par Paixi à son arrivée</Text>
                </View>
                {deposit && <Text style={styles.focusCash}>+ {formatAmount(decision.montantSoldeRestant!)} FCFA de solde à encaisser sur place</Text>}
              </View>
            );
          })()}
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

const moveTime = ({ kind, event }: Move) => (kind === 'DEPARTURE' ? event.heureDepart : event.heureArrivee);

/** Départs du jour, arrivées du jour puis de demain — chaque jour trié par heure. */
export function buildMoves(events: OwnerCalendarEvent[], today: Day): Move[] {
  const tomorrow = addDays(today, 1);
  const stays = events.filter(
    (e): e is OwnerCalendarReservationEvent => e.kind === 'RESERVATION' && STAY_STATUSES.has(e.statut),
  );
  const byTime = (a: Move, b: Move) => (moveTime(a) ?? '99').localeCompare(moveTime(b) ?? '99');
  return [
    ...[
      ...stays.filter((e) => e.end === today).map((event) => ({ kind: 'DEPARTURE' as const, event, when: 'Aujourd’hui' })),
      ...stays.filter((e) => e.start === today).map((event) => ({ kind: 'ARRIVAL' as const, event, when: 'Aujourd’hui' })),
    ].sort(byTime),
    ...stays
      .filter((e) => e.start === tomorrow)
      .map((event) => ({ kind: 'ARRIVAL' as const, event, when: 'Demain' }))
      .sort(byTime),
  ];
}

export function describeMove(move: Move, logementTitles: Map<string, string>): string {
  const who = `${nameCase(move.event.locataire.prenom)} ${move.event.locataire.nomInitiale}`.trim();
  const where = logementTitles.get(move.event.logementId);
  const what = move.kind === 'DEPARTURE' ? `départ de ${who}` : `arrivée de ${who}`;
  const at = moveTime(move);
  return `${move.when}${at ? ` à ${at.replace(':', ' h ')}` : ''} · ${what}${where ? ` · ${where}` : ''}`;
}

const plural = (n: number, word: string) => `${n} ${word}${n > 1 ? 's' : ''}`;

/**
 * La journée de l'hôte en frise : l'heure de chaque arrivée et départ, une ligne de temps,
 * et pour chaque voyageur ce qu'il faut savoir avant d'ouvrir la porte.
 */
export function TodayList({ moves, logementTitles, today }: { moves: Move[]; logementTitles: Map<string, string>; today: Day }) {
  const router = useRouter();
  const groups = (['Aujourd’hui', 'Demain'] as const)
    .map((label) => ({ label, items: moves.filter((m) => m.when === label) }))
    .filter((g) => g.items.length > 0);
  const todays = moves.filter((m) => m.when === 'Aujourd’hui');
  const arrivals = todays.filter((m) => m.kind === 'ARRIVAL').length;
  const departures = todays.length - arrivals;
  const cash = todays.reduce((sum, m) => sum + (m.kind === 'ARRIVAL' ? m.event.soldeSurPlace ?? 0 : 0), 0);
  const date = formatLong(today);

  const summary = [
    arrivals > 0 && plural(arrivals, 'arrivée'),
    departures > 0 && plural(departures, 'départ'),
  ].filter(Boolean).join(' · ');

  return (
    <View style={styles.section}>
      <View style={styles.todayHeader}>
        <View style={styles.flex}>
          <Text style={styles.todayKicker}>{date.charAt(0).toUpperCase() + date.slice(1)}</Text>
          <Text style={styles.todayTitle} accessibilityRole="header">
            Aujourd’hui
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => {
            tap();
            router.navigate('/(owner)/today' as never);
          }}
          style={styles.allPill}
          accessibilityRole="link"
          accessibilityLabel="Voir toute la journée"
        >
          <Text style={styles.allPillText}>Tout voir</Text>
          <View style={styles.allPillArrow}>
            <ArrowRight size={13} color={colors.lime[400]} strokeWidth={2.6} />
          </View>
        </TouchableOpacity>
      </View>

      {moves.length === 0 ? (
        <View style={styles.quiet}>
          <View style={styles.quietIcon}>
            <Coffee size={20} color={colors.lime[400]} />
          </View>
          <View style={styles.flex}>
            <Text style={styles.quietTitle}>Journée calme</Text>
            <Text style={styles.quietText}>Aucune arrivée ni départ aujourd’hui ou demain. Profitez-en pour ajuster vos prix.</Text>
          </View>
          <TouchableOpacity
            onPress={() => {
              tap();
              router.navigate('/(owner)/calendar' as never);
            }}
            style={styles.quietBtn}
            accessibilityRole="link"
          >
            <CalendarDays size={14} color={INK} />
            <Text style={styles.quietBtnText}>Calendrier</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {todays.length > 0 && (
            <View style={styles.summary}>
              <Text style={styles.summaryText}>{summary}</Text>
              {cash > 0 && (
                <View style={styles.summaryCash}>
                  <Banknote size={13} color={colors.gold[700]} />
                  <Text style={styles.summaryCashText}>{formatFCFA(cash)} à encaisser</Text>
                </View>
              )}
            </View>
          )}

          {groups.map((group) => (
            <View key={group.label} style={styles.dayGroup}>
              {groups.length > 1 && <Text style={styles.dayLabel}>{group.label.toUpperCase()}</Text>}
              {group.items.map((move, i) => (
                <TimelineRow
                  key={`${move.kind}-${move.event.id}`}
                  move={move}
                  logement={logementTitles.get(move.event.logementId)}
                  last={i === group.items.length - 1}
                  onPress={() => {
                    tap();
                    router.push({ pathname: '/(owner)/reservations/[id]' as never, params: { id: move.event.id } });
                  }}
                />
              ))}
            </View>
          ))}
        </>
      )}
    </View>
  );
}

function TimelineRow({ move, logement, last, onPress }: { move: Move; logement?: string; last: boolean; onPress: () => void }) {
  const { kind, event } = move;
  const isArrival = kind === 'ARRIVAL';
  const time = moveTime(move);
  const name = `${nameCase(event.locataire.prenom) ?? ''} ${event.locataire.nomInitiale}`.trim();
  const solde = isArrival ? event.soldeSurPlace ?? 0 : 0;
  const Icon = isArrival ? LogIn : LogOut;

  return (
    <View style={styles.tlRow}>
      <View style={styles.tlTime}>
        <Text style={[styles.tlHour, !time && styles.tlHourMissing]}>{time ?? '—'}</Text>
      </View>
      <View style={styles.tlRail}>
        <View style={[styles.tlDot, isArrival ? styles.tlDotArrival : styles.tlDotDeparture]} />
        {!last && <View style={styles.tlLine} />}
      </View>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onPress}
        style={styles.tlCard}
        accessibilityRole="button"
        accessibilityLabel={`${isArrival ? 'Arrivée' : 'Départ'} de ${name}${time ? ` à ${time}` : ''}`}
      >
        <View style={styles.tlTop}>
          <View style={[styles.kindChip, isArrival ? styles.kindChipArrival : styles.kindChipDeparture]}>
            <Icon size={11} color={isArrival ? colors.lime[400] : colors.neutral[700]} strokeWidth={2.6} />
            <Text style={[styles.kindChipText, isArrival && styles.kindChipTextArrival]}>{isArrival ? 'Arrivée' : 'Départ'}</Text>
          </View>
          <View style={styles.flex} />
          <ChevronRight size={16} color={colors.neutral[400]} />
        </View>

        <View style={styles.tlGuest}>
          {event.locataire.avatarUrl ? (
            <Image source={{ uri: event.locataire.avatarUrl }} style={styles.tlAvatar} contentFit="cover" />
          ) : (
            <View style={[styles.tlAvatar, styles.tlAvatarEmpty]}>
              <Text style={styles.tlAvatarText}>{initials(event.locataire.prenom, event.locataire.nomInitiale)}</Text>
            </View>
          )}
          <View style={styles.flex}>
            <Text style={styles.tlName} numberOfLines={1}>
              {name}
            </Text>
            {logement ? (
              <Text style={styles.tlPlace} numberOfLines={1}>
                {logement}
              </Text>
            ) : null}
          </View>
        </View>

        <View style={styles.tlFacts}>
          <View style={styles.fact}>
            <Users size={12} color={colors.neutral[600]} />
            <Text style={styles.factText}>{plural(event.nbPersonnes, 'voyageur')}</Text>
          </View>
          <View style={styles.fact}>
            <Moon size={12} color={colors.neutral[600]} />
            <Text style={styles.factText}>{plural(event.nbNuits, 'nuit')}</Text>
          </View>
        </View>

        {/* Arrivée en formule acompte : le solde se règle de la main à la main */}
        {solde > 0 && (
          <View style={styles.cashPill}>
            <Banknote size={13} color={colors.gold[700]} />
            <Text style={styles.cashPillText} numberOfLines={1}>
              Solde de {formatFCFA(solde)} à encaisser
            </Text>
          </View>
        )}
      </TouchableOpacity>
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
  focusCash: { fontFamily: typography.fontBodySemiBold, fontSize: 12, color: colors.gold[700] },
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
  sectionTitle: { fontFamily: typography.fontDisplaySemiBold, fontSize: 26, letterSpacing: -0.6, color: colors.neutral[900] },
  counter: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingVertical: 6, paddingLeft: 8 },
  counterText: { fontFamily: typography.fontBodySemiBold, fontSize: 13, color: colors.neutral[600] },

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
  calm: { gap: 16, padding: 20, borderRadius: 30, overflow: 'hidden', backgroundColor: INK },
  calmRing: { position: 'absolute', borderWidth: 1, borderColor: 'rgba(211,242,110,0.12)' },
  calmRingOuter: { width: 220, height: 220, borderRadius: 110, top: -110, right: -70 },
  calmRingInner: { width: 130, height: 130, borderRadius: 65, top: -65, right: -25, borderColor: 'rgba(211,242,110,0.2)' },
  calmBadge: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.lime[400], alignItems: 'center', justifyContent: 'center' },
  calmBody: { gap: 8 },
  calmTitle: { fontFamily: typography.fontDisplaySemiBold, fontSize: 26, lineHeight: 30, letterSpacing: -0.6, color: PAPER },
  calmAccent: { color: colors.lime[400], fontStyle: 'italic' },
  calmText: { fontFamily: typography.fontBody, fontSize: 13, lineHeight: 19, color: colors.forest[200] },
  calmNext: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
    borderRadius: 18,
    backgroundColor: 'rgba(248,251,244,0.06)',
  },
  calmNextLabel: { fontFamily: typography.fontBodyBold, fontSize: 10, letterSpacing: 1.2, color: colors.lime[400] },
  calmNextText: { fontFamily: typography.fontBodySemiBold, fontSize: 13, lineHeight: 18, color: PAPER, marginTop: 2 },
  calmActions: { flexDirection: 'row', gap: 10 },
  calmBtn: { flex: 1, flexDirection: 'row', gap: 7, height: 46, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  calmBtnLime: { backgroundColor: colors.lime[400] },
  calmBtnLimeText: { fontFamily: typography.fontBodyBold, fontSize: 14, color: INK },
  calmBtnGhost: { borderWidth: 1, borderColor: 'rgba(248,251,244,0.25)' },
  calmBtnGhostText: { fontFamily: typography.fontBodySemiBold, fontSize: 14, color: PAPER },
  nextUp: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 4 },
  nextUpLabel: { fontFamily: typography.fontBodyBold, fontSize: 13, color: colors.neutral[900] },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.neutral[400] },
  nextUpText: { flex: 1, fontFamily: typography.fontBody, fontSize: 13, color: colors.neutral[600] },

  // Aujourd'hui
  todayHeader: { flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
  todayKicker: { fontFamily: typography.fontBodySemiBold, fontSize: 12, color: colors.neutral[500] },
  todayTitle: { fontFamily: typography.fontDisplaySemiBold, fontSize: 26, letterSpacing: -0.6, color: colors.neutral[900], marginTop: 1 },
  allPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 36,
    paddingLeft: 14,
    paddingRight: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.neutral[0],
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  allPillText: { fontFamily: typography.fontBodyBold, fontSize: 13, color: INK },
  allPillArrow: { width: 28, height: 28, borderRadius: 14, backgroundColor: INK, alignItems: 'center', justifyContent: 'center' },
  summary: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  summaryText: { fontFamily: typography.fontBodySemiBold, fontSize: 13, color: colors.neutral[700] },
  summaryCash: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 26,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.gold[50],
  },
  summaryCashText: { fontFamily: typography.fontBodyBold, fontSize: 12, color: colors.gold[700] },
  dayGroup: { gap: 0 },
  dayLabel: { fontFamily: typography.fontBodyBold, fontSize: 11, letterSpacing: 1.2, color: colors.neutral[500], marginBottom: 8, marginTop: 4 },
  tlRow: { flexDirection: 'row', alignItems: 'stretch' },
  tlTime: { width: 46, paddingTop: 14 },
  tlHour: { fontFamily: typography.fontDisplaySemiBold, fontSize: 15, letterSpacing: -0.2, color: colors.neutral[900] },
  tlHourMissing: { color: colors.neutral[400] },
  tlRail: { width: 18, alignItems: 'center' },
  tlDot: { width: 12, height: 12, borderRadius: 6, marginTop: 18, borderWidth: 3 },
  tlDotArrival: { backgroundColor: colors.lime[400], borderColor: INK },
  tlDotDeparture: { backgroundColor: colors.neutral[0], borderColor: colors.neutral[400] },
  tlLine: { flex: 1, width: 2, marginTop: 4, marginBottom: -14, borderRadius: 1, backgroundColor: colors.neutral[200] },
  tlCard: {
    flex: 1,
    minWidth: 0,
    gap: 12,
    padding: 14,
    marginLeft: 8,
    marginBottom: 12,
    borderRadius: 22,
    backgroundColor: colors.neutral[0],
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  tlTop: { flexDirection: 'row', alignItems: 'center' },
  kindChip: { flexDirection: 'row', alignItems: 'center', gap: 5, height: 24, paddingHorizontal: 9, borderRadius: radius.pill },
  kindChipArrival: { backgroundColor: INK },
  kindChipDeparture: { backgroundColor: colors.neutral[100] },
  kindChipText: { fontFamily: typography.fontBodyBold, fontSize: 11, letterSpacing: 0.3, color: colors.neutral[700] },
  kindChipTextArrival: { color: colors.lime[400] },
  tlGuest: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  tlAvatar: { width: 42, height: 42, borderRadius: 21 },
  tlAvatarEmpty: { backgroundColor: colors.forest[100], alignItems: 'center', justifyContent: 'center' },
  tlAvatarText: { fontFamily: typography.fontBodyBold, fontSize: 14, color: INK },
  tlName: { fontFamily: typography.fontBodyBold, fontSize: 16, color: colors.neutral[900] },
  tlPlace: { fontFamily: typography.fontBody, fontSize: 12, color: colors.neutral[600], marginTop: 2 },
  tlFacts: { flexDirection: 'row', gap: 14 },
  fact: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  factText: { fontFamily: typography.fontBodySemiBold, fontSize: 12, color: colors.neutral[600] },
  cashPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 30,
    paddingHorizontal: 11,
    borderRadius: radius.pill,
    backgroundColor: colors.gold[50],
    borderWidth: 1,
    borderColor: colors.gold[100],
  },
  cashPillText: { flexShrink: 1, fontFamily: typography.fontBodyBold, fontSize: 12, color: colors.gold[700] },
  quiet: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 24,
    backgroundColor: colors.neutral[0],
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  quietIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: INK, alignItems: 'center', justifyContent: 'center' },
  quietTitle: { fontFamily: typography.fontDisplaySemiBold, fontSize: 17, color: colors.neutral[900] },
  quietText: { fontFamily: typography.fontBody, fontSize: 12, lineHeight: 17, color: colors.neutral[600], marginTop: 2 },
  quietBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 34,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    backgroundColor: colors.lime[400],
  },
  quietBtnText: { fontFamily: typography.fontBodyBold, fontSize: 12, color: INK },
});
