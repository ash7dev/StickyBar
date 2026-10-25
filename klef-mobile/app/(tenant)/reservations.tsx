import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { AlertCircle, ArrowRight, Check, ChevronRight, KeyRound, Search, Star } from 'lucide-react-native';
import { colors, typography } from '../../shared/theme/tokens';
import { useAuthStore } from '../../features/auth/stores/auth.store';
import { TENANT_TRIPS_CACHE_KEY, fetchTenantTrips, tenantTripsKey } from '../../features/warmup/queries';
import { AuthRequiredCard } from '../../features/auth/components/AuthRequiredCard';
import type { ReservationDetail } from '../../features/reservations/types/reservation-detail.types';
import { tenantStage, timeLeft, type TenantStage } from '../../features/reservations/tenant/lib/stage';
import { INK, PAPER, tap } from '../../features/reservations/tenant/components/ui';
import { formatAmount } from '../../features/owner-home/lib/format';
import { nameCase } from '../../features/home/lib/home';
import { WeekendStrip, coverOf, useWeekendPicks } from '../../features/booking/components/WeekendPicks';

const CACHE_KEY = TENANT_TRIPS_CACHE_KEY;
const MONTHS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
const MONTHS_LONG = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
const DAYS = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'];
const pad2 = (n: number) => String(n).padStart(2, '0');

/** Réservation renvoyée par GET /reservations/me (tous les champs de la réservation + logement, hôte, avis). */
type Trip = ReservationDetail & {
  avis?: Array<{ auteurId: string }>;
  logement?: ReservationDetail['logement'] & { quartier?: string | null };
};

type Segment = 'upcoming' | 'past' | 'cancelled';
const UPCOMING_STAGES: TenantStage[] = ['payment-pending', 'awaiting-host', 'confirmed', 'day-waiting', 'host-absent', 'absent-reported', 'checkin-ready', 'in-stay', 'disputed'];
const segmentOf = (s: TenantStage): Segment => (UPCOMING_STAGES.includes(s) ? 'upcoming' : s === 'completed' ? 'past' : 'cancelled');

type Tone = 'lime' | 'gold' | 'red' | 'green' | 'grey';
const TONE: Record<Tone, string> = { lime: colors.lime[600], gold: colors.gold[400], red: colors.error[500], green: colors.forest[600], grey: colors.neutral[400] };

/** Ce que le voyageur doit savoir ou faire, en une ligne, pour chaque étape du séjour. */
function stageLine(r: Trip, s: TenantStage, userId?: string, now = new Date()): { text: string; tone: Tone; action?: string } {
  const host = nameCase(r.proprietaire?.prenom) ?? 'l’hôte';
  const days = Math.ceil((new Date(r.dateDebut).getTime() - now.getTime()) / 86_400_000);
  switch (s) {
    case 'payment-pending':
      return { text: 'Paiement en cours de vérification', tone: 'gold' };
    case 'awaiting-host': {
      const left = timeLeft(r.delaiConfirmation, now);
      return { text: left ? `${host} répond sous ${left}` : `En attente de ${host}`, tone: 'gold' };
    }
    case 'confirmed':
      return Number(r.montantSoldeRestant) > 0
        ? { text: `Prévoir ${formatAmount(r.montantSoldeRestant!)} FCFA pour ${host}`, tone: 'lime' }
        : { text: days <= 1 ? 'Arrivée demain' : `Arrivée dans ${days} jours`, tone: 'green' };
    case 'day-waiting':
      return { text: `Aujourd’hui · ${host} prépare votre arrivée`, tone: 'lime' };
    case 'host-absent':
      return { text: `${host} est en retard`, tone: 'red', action: 'Agir' };
    case 'absent-reported':
      return { text: 'Absence de l’hôte signalée', tone: 'red' };
    case 'checkin-ready':
      return { text: 'Validez votre arrivée', tone: 'lime', action: 'Valider' };
    case 'in-stay':
      return { text: `En cours · départ ${DAYS[new Date(r.dateFin).getDay()]} ${new Date(r.dateFin).getDate()}`, tone: 'green' };
    case 'disputed':
      return { text: 'Litige en cours d’examen', tone: 'red' };
    case 'completed': {
      const rated = (r.avis ?? []).some((a) => a.auteurId === userId);
      const open = r.closeLe && now.getTime() - new Date(r.closeLe).getTime() < 7 * 86_400_000;
      return rated ? { text: 'Séjour terminé · avis laissé', tone: 'grey' } : open ? { text: 'Séjour terminé · votre avis compte', tone: 'gold', action: 'Noter' } : { text: 'Séjour terminé', tone: 'grey' };
    }
    case 'expired':
      return { text: `${host} n’a pas répondu · remboursé`, tone: 'grey' };
    default:
      return { text: r.annuleLe ? `Annulée le ${new Date(r.annuleLe).getDate()} ${MONTHS[new Date(r.annuleLe).getMonth()]}` : 'Annulée', tone: 'grey' };
  }
}

/** « Vos séjours » : le prochain en billet, puis tout le reste par mois. */
export default function TripsScreen() {
  const insets = useSafeAreaInsets();
  const { isAuthenticated, user } = useAuthStore();
  const guarded = !isAuthenticated;
  const [segment, setSegment] = useState<Segment>('upcoming');
  const [cached, setCached] = useState<Trip[] | null>(null);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    if (guarded) return;
    AsyncStorage.getItem(CACHE_KEY)
      .then((raw) => {
        try {
          const parsed = raw ? JSON.parse(raw) : null;
          if (Array.isArray(parsed)) setCached(parsed);
        } catch {
          // cache illisible : on attend le réseau
        }
      })
      .catch(() => {});
  }, [guarded]);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  const { data, isLoading, isRefetching, refetch, error } = useQuery<Trip[]>({
    queryKey: tenantTripsKey,
    queryFn: () => fetchTenantTrips<Trip>(),
    enabled: !guarded,
    staleTime: 60_000,
  });
  const trips = data ?? cached ?? [];

  const { featured, groups, counts } = useMemo(() => {
    const withStage = trips.map((r) => ({ r, s: tenantStage(r, now) }));
    const by = (seg: Segment) => withStage.filter((x) => segmentOf(x.s) === seg);
    const upcoming = by('upcoming').sort((a, b) => a.r.dateDebut.localeCompare(b.r.dateDebut));
    const past = by('past').sort((a, b) => b.r.dateDebut.localeCompare(a.r.dateDebut));
    const cancelled = by('cancelled').sort((a, b) => b.r.dateDebut.localeCompare(a.r.dateDebut));
    const lists = { upcoming: upcoming.slice(1), past, cancelled };
    // Regroupement par mois d'arrivée : « Novembre 2026 »
    const list = lists[segment];
    const g: Array<{ title: string; items: typeof list }> = [];
    for (const x of list) {
      const d = new Date(x.r.dateDebut);
      const title = `${MONTHS_LONG[d.getMonth()]} ${d.getFullYear()}`;
      const last = g[g.length - 1];
      if (last?.title === title) last.items.push(x);
      else g.push({ title, items: [x] });
    }
    return { featured: upcoming[0], groups: g, counts: { upcoming: upcoming.length, past: past.length, cancelled: cancelled.length } };
  }, [trips, segment, now]);

  const open = (id: string) => {
    tap();
    router.push(`/reservation/${id}` as never);
  };
  const refresh = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    refetch();
  }, [refetch]);

  const total = trips.length;
  const loading = !guarded && isLoading && !trips.length;

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
        refreshControl={guarded ? undefined : <RefreshControl refreshing={isRefetching} onRefresh={refresh} tintColor={colors.forest[600]} />}
      >
        {/* Titre éditorial */}
        <View style={styles.head}>
          <Text style={styles.title}>
            Vos séjours<Text style={styles.titleDot}>.</Text>
          </Text>
          {!guarded && total > 0 && (
            <Text style={styles.sub}>
              {counts.upcoming ? `${counts.upcoming} à venir` : 'Rien de prévu'}
              {counts.past ? ` · ${counts.past} vécu${counts.past > 1 ? 's' : ''}` : ''}
            </Text>
          )}
        </View>

        {guarded ? (
          <View style={styles.pad}>
            <AuthRequiredCard title="Connectez-vous pour voir vos séjours" subtitle="Vos réservations, vos contrats et vos paiements protégés par Paixi, au même endroit." />
          </View>
        ) : loading ? (
          <View style={[styles.pad, { gap: 12 }]}>
            <View style={[styles.skel, { height: 300 }]} />
            <View style={[styles.skel, { height: 84 }]} />
            <View style={[styles.skel, { height: 84 }]} />
          </View>
        ) : total === 0 ? (
          <EmptyTrips />
        ) : (
          <View style={{ gap: 22 }}>
            {error && !data ? (
              <View style={[styles.pad, styles.offline]}>
                <AlertCircle size={15} color={colors.gold[700]} />
                <Text style={styles.offlineText}>Hors connexion · dernière version enregistrée</Text>
              </View>
            ) : null}

            {/* Le prochain séjour, en billet */}
            {featured ? <Ticket r={featured.r} line={stageLine(featured.r, featured.s, user?.id, now)} onPress={() => open(featured.r.id)} now={now} /> : null}

            {/* Segments */}
            <View style={[styles.pad, styles.segments]} accessibilityRole="tablist">
              {(
                [
                  { key: 'upcoming', label: 'À venir', n: Math.max(0, counts.upcoming - (featured ? 1 : 0)) },
                  { key: 'past', label: 'Vécus', n: counts.past },
                  { key: 'cancelled', label: 'Annulés', n: counts.cancelled },
                ] as const
              ).map((t) => {
                const on = segment === t.key;
                return (
                  <TouchableOpacity key={t.key} onPress={() => { tap(); setSegment(t.key); }} style={[styles.seg, on && styles.segOn]} accessibilityRole="tab" accessibilityState={{ selected: on }}>
                    <Text style={[styles.segText, on && { color: colors.lime[400] }]}>{t.label}</Text>
                    {t.n > 0 && (
                      <View style={[styles.segCount, on && { backgroundColor: colors.lime[400] }]}>
                        <Text style={[styles.segCountText, on && { color: INK }]}>{t.n}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {groups.length === 0 ? (
              <SegmentEmpty segment={segment} hasFeatured={!!featured} />
            ) : (
              groups.map((g) => (
                <View key={g.title} style={{ gap: 10 }}>
                  <Text style={[styles.pad, styles.month]}>{g.title.toUpperCase()}</Text>
                  <View style={[styles.pad, { gap: 10 }]}>
                    {g.items.map(({ r, s }) => (
                      <TripRow key={r.id} r={r} line={stageLine(r, s, user?.id, now)} faded={segment === 'cancelled'} onPress={() => open(r.id)} />
                    ))}
                  </View>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function Ticket({ r, line, onPress, now }: { r: Trip; line: ReturnType<typeof stageLine>; onPress: () => void; now: Date }) {
  const photo = r.logement?.photos?.[0]?.url;
  const a = new Date(r.dateDebut);
  const b = new Date(r.dateFin);
  const place = r.logement?.quartier || r.logement?.ville;
  const days = Math.ceil((a.getTime() - now.getTime()) / 86_400_000);
  const label = r.statut === 'CHECKED_IN' ? 'EN COURS' : days <= 0 ? 'AUJOURD’HUI' : days === 1 ? 'DEMAIN' : `DANS ${days} JOURS`;
  return (
    <TouchableOpacity activeOpacity={0.92} onPress={onPress} style={styles.ticketWrap} accessibilityRole="button" accessibilityLabel={`Prochain séjour : ${r.logement?.titre}`}>
      <View style={styles.ticket}>
        <View style={styles.ticketPhotoBox}>
          {photo ? <Image source={{ uri: photo }} style={StyleSheet.absoluteFill} contentFit="cover" /> : null}
          <View style={styles.ticketShade} />
          <View style={styles.ticketChip}>
            <Text style={styles.ticketChipText}>{label}</Text>
          </View>
          <View style={styles.ticketTitleBox}>
            <Text style={styles.ticketPlace}>{place?.toUpperCase()}</Text>
            <Text style={styles.ticketTitle} numberOfLines={1}>{r.logement?.titre}</Text>
          </View>
        </View>
        <View style={styles.times}>
          <View>
            <Text style={styles.timeLabel}>ARRIVÉE</Text>
            <Text style={styles.time}>{`${pad2(a.getHours())}:${pad2(a.getMinutes())}`}</Text>
            <Text style={styles.timeDay}>{`${DAYS[a.getDay()]} ${a.getDate()} ${MONTHS[a.getMonth()]}`}</Text>
          </View>
          <View style={styles.route}>
            {[0.25, 0.4, 0.55, 0.7].map((o) => (
              <View key={o} style={[styles.routeDash, { opacity: o }]} />
            ))}
            <KeyRound size={15} color={colors.lime[400]} />
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.timeLabel}>DÉPART</Text>
            <Text style={styles.time}>{`${pad2(b.getHours())}:${pad2(b.getMinutes())}`}</Text>
            <Text style={styles.timeDay}>{`${DAYS[b.getDay()]} ${b.getDate()} ${MONTHS[b.getMonth()]}`}</Text>
          </View>
        </View>
        {/* Perforation du billet */}
        <View style={styles.perf}>
          <View style={[styles.notch, { left: -11 }]} />
          <View style={styles.perfLine} />
          <View style={[styles.notch, { right: -11 }]} />
        </View>
        <View style={styles.todo}>
          <View style={{ flex: 1 }}>
            <Text style={styles.timeLabel}>{line.action ? 'À FAIRE' : 'OÙ EN EST-ON'}</Text>
            <Text style={styles.todoText} numberOfLines={2}>{line.text}</Text>
          </View>
          <View style={styles.todoBtn}>
            <ArrowRight size={17} color={INK} strokeWidth={2.6} />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function TripRow({ r, line, faded, onPress }: { r: Trip; line: ReturnType<typeof stageLine>; faded?: boolean; onPress: () => void }) {
  const a = new Date(r.dateDebut);
  const photo = r.logement?.photos?.[0]?.url;
  const nights = r.nbNuits ?? Math.max(1, Math.round((new Date(r.dateFin).getTime() - a.getTime()) / 86_400_000));
  return (
    <TouchableOpacity onPress={onPress} style={[styles.row, faded && { opacity: 0.6 }]} accessibilityRole="button">
      <View style={styles.dateTile}>
        <Text style={styles.dateDay}>{a.getDate()}</Text>
        <Text style={styles.dateMonth}>{MONTHS[a.getMonth()]}</Text>
      </View>
      {photo ? <Image source={{ uri: photo }} style={styles.rowPhoto} contentFit="cover" /> : <View style={[styles.rowPhoto, { backgroundColor: colors.forest[100] }]} />}
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={styles.rowTitle} numberOfLines={1}>{r.logement?.titre ?? 'Logement'}</Text>
        <Text style={styles.rowMeta} numberOfLines={1}>
          {[r.logement?.quartier || r.logement?.ville, `${nights} nuit${nights > 1 ? 's' : ''}`, `${formatAmount(r.totalLocataire)} FCFA`].filter(Boolean).join(' · ')}
        </Text>
        <View style={styles.statusRow}>
          <View style={[styles.dot, { backgroundColor: TONE[line.tone] }]} />
          <Text style={styles.status} numberOfLines={1}>{line.text}</Text>
        </View>
      </View>
      {line.action ? (
        <View style={styles.action}>
          {line.action === 'Noter' ? <Star size={12} color={INK} fill={INK} /> : null}
          <Text style={styles.actionText}>{line.action}</Text>
        </View>
      ) : (
        <ChevronRight size={18} color={colors.neutral[400]} />
      )}
    </TouchableOpacity>
  );
}


/** Aucun séjour : trois vraies photos en éventail, le principe Paixi en 3 temps, et un geste clair. */
function EmptyTrips() {
  const { data } = useWeekendPicks();
  const picks = (data ?? []).filter((l) => coverOf(l)).slice(0, 3);
  return (
    <View style={[styles.pad, { gap: 18 }]}>
      <View style={styles.emptyHero}>
        {/* Éventail de vrais logements Paixi */}
        <View style={styles.fan}>
          {picks.length ? (
            picks.map((l, i) => (
              <Image
                key={l.id}
                source={{ uri: coverOf(l) }}
                contentFit="cover"
                style={[styles.fanCard, { transform: [{ rotate: `${(i - 1) * 9}deg` }, { translateX: (i - 1) * 64 }, { translateY: i === 1 ? -10 : 6 }], zIndex: i === 1 ? 2 : 1 }]}
              />
            ))
          ) : (
            <View style={[styles.fanCard, styles.fanPlaceholder]}>
              <KeyRound size={30} color={colors.lime[400]} />
            </View>
          )}
          <View style={styles.fanKey}>
            <KeyRound size={18} color={INK} />
          </View>
        </View>
        <Text style={styles.emptyTitle}>
          Votre premier séjour{'\n'}
          <Text style={styles.emptyAccent}>commence ici.</Text>
        </Text>
        <Text style={styles.emptyText}>Réservez en quelques minutes. Votre argent reste chez Paixi jusqu’à votre arrivée.</Text>
        <View style={styles.howRow}>
          {[
            { n: '1', t: 'Vous réservez' },
            { n: '2', t: 'Paixi garde l’argent' },
            { n: '3', t: 'L’hôte est payé à votre arrivée' },
          ].map((x, i) => (
            <React.Fragment key={x.n}>
              {i > 0 && <View style={styles.howLink} />}
              <View style={styles.howStep}>
                <View style={[styles.howN, i === 1 && { backgroundColor: colors.lime[400] }]}>
                  <Text style={[styles.howNText, i === 1 && { color: INK }]}>{x.n}</Text>
                </View>
                <Text style={styles.howText}>{x.t}</Text>
              </View>
            </React.Fragment>
          ))}
        </View>
        <TouchableOpacity onPress={() => { tap(); router.navigate('/(tenant)/explorer' as never); }} style={styles.cta} accessibilityRole="button">
          <Text style={styles.ctaText}>Trouver un logement</Text>
          <View style={styles.ctaArrow}>
            <ArrowRight size={16} color={colors.lime[400]} strokeWidth={2.6} />
          </View>
        </TouchableOpacity>
      </View>
      {picks.length > 0 && <WeekendStrip items={data ?? []} title="Libres ce week-end" />}
    </View>
  );
}

/** Vide par filtre : chaque cas a son ton, et un geste quand il y en a un. */
function SegmentEmpty({ segment, hasFeatured }: { segment: Segment; hasFeatured: boolean }) {
  const { data } = useWeekendPicks(segment === 'upcoming');
  if (segment === 'upcoming') {
    return (
      <View style={[styles.pad, { gap: 16 }]}>
        <View style={styles.softCard}>
          <View style={styles.softIcon}>
            <Search size={18} color={INK} strokeWidth={2.4} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.softTitle}>{hasFeatured ? 'Et après ce séjour ?' : 'Rien de prévu… pour l’instant.'}</Text>
            <Text style={styles.softText}>{hasFeatured ? 'Préparez la prochaine escapade dès maintenant.' : 'Un week-end au bord de l’eau, ça vous dit ?'}</Text>
          </View>
          <TouchableOpacity onPress={() => { tap(); router.navigate('/(tenant)/explorer' as never); }} style={styles.softBtn} accessibilityRole="button" accessibilityLabel="Explorer">
            <ArrowRight size={16} color={colors.lime[400]} strokeWidth={2.6} />
          </TouchableOpacity>
        </View>
        <WeekendStrip items={data ?? []} title="Libres ce week-end" />
      </View>
    );
  }
  if (segment === 'past') {
    return (
      <View style={[styles.pad]}>
        <View style={styles.memories}>
          <View style={styles.polaroids}>
            {[-8, 4, -2].map((r, i) => (
              <View key={i} style={[styles.polaroid, { transform: [{ rotate: `${r}deg` }, { translateX: (i - 1) * 46 }] }]}>
                <View style={styles.polaroidPhoto} />
              </View>
            ))}
          </View>
          <Text style={styles.softTitle}>Vos souvenirs commenceront ici.</Text>
          <Text style={[styles.softText, { textAlign: 'center' }]}>Chaque séjour terminé garde son contrat, ses photos d’état des lieux et votre avis.</Text>
        </View>
      </View>
    );
  }
  return (
    <View style={styles.pad}>
      <View style={styles.goodNews}>
        <View style={styles.goodIcon}>
          <Check size={20} color={INK} strokeWidth={3} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.softTitle}>Aucune annulation.</Text>
          <Text style={styles.softText}>Si un séjour était annulé, votre remboursement serait suivi ici, étape par étape.</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: PAPER },
  pad: { paddingHorizontal: 16 },
  head: { paddingHorizontal: 16, paddingBottom: 18, gap: 4 },
  title: { fontFamily: typography.fontDisplaySemiBold, fontSize: 38, letterSpacing: -1.2, color: INK },
  titleDot: { color: colors.lime[600] },
  sub: { fontFamily: typography.fontBodySemiBold, fontSize: 13, color: colors.neutral[600] },
  skel: { borderRadius: 26, backgroundColor: colors.neutral[100] },
  offline: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  offlineText: { fontFamily: typography.fontBodySemiBold, fontSize: 12, color: colors.gold[700] },

  ticketWrap: { paddingHorizontal: 16 },
  ticket: { borderRadius: 30, backgroundColor: INK, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 20, shadowOffset: { width: 0, height: 12 }, elevation: 8 },
  ticketPhotoBox: { height: 160, justifyContent: 'flex-end' },
  ticketShade: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(4,25,18,0.35)' },
  ticketChip: { position: 'absolute', top: 14, left: 16, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: colors.lime[400] },
  ticketChipText: { fontFamily: typography.fontBodyBold, fontSize: 11, letterSpacing: 0.8, color: INK },
  ticketTitleBox: { padding: 16, paddingBottom: 12 },
  ticketPlace: { fontFamily: typography.fontBodyBold, fontSize: 11, letterSpacing: 1.4, color: colors.lime[400] },
  ticketTitle: { marginTop: 2, fontFamily: typography.fontDisplaySemiBold, fontSize: 24, letterSpacing: -0.5, color: '#FFFFFF' },
  times: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingHorizontal: 18, paddingTop: 14 },
  timeLabel: { fontFamily: typography.fontBodyBold, fontSize: 10, letterSpacing: 1, color: '#8FB3A3' },
  time: { marginTop: 2, fontFamily: typography.fontDisplaySemiBold, fontSize: 32, lineHeight: 34, color: '#FFFFFF' },
  timeDay: { fontFamily: typography.fontBody, fontSize: 12, color: '#C9DBD1' },
  route: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingBottom: 26 },
  routeDash: { flex: 1, height: 2, borderRadius: 1, backgroundColor: colors.lime[400] },
  perf: { height: 26, justifyContent: 'center' },
  notch: { position: 'absolute', width: 22, height: 22, borderRadius: 11, backgroundColor: PAPER },
  perfLine: { marginHorizontal: 22, borderTopWidth: 2, borderStyle: 'dashed', borderColor: 'rgba(248,251,244,0.18)' },
  todo: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, paddingBottom: 18 },
  todoText: { marginTop: 2, fontFamily: typography.fontBodyBold, fontSize: 15, color: '#FFFFFF' },
  todoBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.lime[400], alignItems: 'center', justifyContent: 'center' },

  segments: { flexDirection: 'row', gap: 6 },
  seg: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 38, paddingHorizontal: 14, borderRadius: 999, backgroundColor: colors.neutral[0], borderWidth: 1, borderColor: colors.neutral[200] },
  segOn: { backgroundColor: INK, borderColor: INK },
  segText: { fontFamily: typography.fontBodyBold, fontSize: 13, color: INK },
  segCount: { minWidth: 20, height: 20, paddingHorizontal: 5, borderRadius: 10, backgroundColor: colors.forest[50], alignItems: 'center', justifyContent: 'center' },
  segCountText: { fontFamily: typography.fontBodyBold, fontSize: 11, color: INK },
  month: { fontFamily: typography.fontBodyBold, fontSize: 11, letterSpacing: 1.2, color: colors.neutral[500] },

  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, borderRadius: 22, backgroundColor: colors.neutral[0], borderWidth: 1, borderColor: colors.neutral[200] },
  dateTile: { width: 46, alignItems: 'center' },
  dateDay: { fontFamily: typography.fontDisplaySemiBold, fontSize: 24, lineHeight: 26, color: INK },
  dateMonth: { fontFamily: typography.fontBodySemiBold, fontSize: 11, color: colors.neutral[600] },
  rowPhoto: { width: 58, height: 58, borderRadius: 14 },
  rowTitle: { fontFamily: typography.fontBodyBold, fontSize: 14, color: INK },
  rowMeta: { fontFamily: typography.fontBody, fontSize: 12, color: colors.neutral[600] },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  status: { flex: 1, fontFamily: typography.fontBodySemiBold, fontSize: 12, color: INK },
  action: { flexDirection: 'row', alignItems: 'center', gap: 4, height: 32, paddingHorizontal: 12, borderRadius: 999, backgroundColor: colors.lime[400] },
  actionText: { fontFamily: typography.fontBodyBold, fontSize: 12, color: INK },

  emptyHero: { alignItems: 'center', gap: 14, paddingTop: 18, paddingBottom: 22, paddingHorizontal: 18, borderRadius: 32, backgroundColor: colors.neutral[0], borderWidth: 1, borderColor: colors.neutral[200] },
  fan: { width: '100%', height: 190, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  fanCard: { position: 'absolute', width: 132, height: 168, borderRadius: 22, borderWidth: 4, borderColor: colors.neutral[0], backgroundColor: colors.forest[100] },
  fanPlaceholder: { backgroundColor: INK, alignItems: 'center', justifyContent: 'center' },
  fanKey: { position: 'absolute', bottom: -4, zIndex: 3, width: 44, height: 44, borderRadius: 22, backgroundColor: colors.lime[400], alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: colors.neutral[0] },
  emptyTitle: { textAlign: 'center', fontFamily: typography.fontDisplaySemiBold, fontSize: 30, lineHeight: 33, letterSpacing: -0.8, color: INK },
  emptyAccent: { color: colors.forest[600], fontStyle: 'italic' },
  emptyText: { textAlign: 'center', fontFamily: typography.fontBody, fontSize: 14, lineHeight: 20, color: colors.neutral[600] },
  howRow: { flexDirection: 'row', alignItems: 'flex-start', width: '100%', paddingVertical: 4 },
  howStep: { width: 86, alignItems: 'center', gap: 6 },
  howLink: { flex: 1, height: 2, marginTop: 14, backgroundColor: colors.neutral[200] },
  howN: { width: 30, height: 30, borderRadius: 15, backgroundColor: INK, alignItems: 'center', justifyContent: 'center' },
  howNText: { fontFamily: typography.fontDisplaySemiBold, fontSize: 14, color: colors.lime[400] },
  howText: { textAlign: 'center', fontFamily: typography.fontBodySemiBold, fontSize: 11, lineHeight: 14, color: INK },
  cta: { flexDirection: 'row', alignItems: 'center', gap: 10, height: 54, paddingLeft: 22, paddingRight: 6, borderRadius: 999, backgroundColor: colors.lime[400], marginTop: 4 },
  ctaText: { fontFamily: typography.fontBodyBold, fontSize: 15, color: INK },
  ctaArrow: { width: 42, height: 42, borderRadius: 21, backgroundColor: INK, alignItems: 'center', justifyContent: 'center' },

  softCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 24, backgroundColor: colors.neutral[0], borderWidth: 1, borderColor: colors.neutral[200] },
  softIcon: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.lime[400], alignItems: 'center', justifyContent: 'center' },
  softTitle: { fontFamily: typography.fontDisplaySemiBold, fontSize: 18, color: INK },
  softText: { marginTop: 2, fontFamily: typography.fontBody, fontSize: 13, lineHeight: 18, color: colors.neutral[600] },
  softBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: INK, alignItems: 'center', justifyContent: 'center' },
  memories: { alignItems: 'center', gap: 6, paddingTop: 10, paddingBottom: 20, paddingHorizontal: 20, borderRadius: 28, backgroundColor: colors.neutral[0], borderWidth: 1, borderColor: colors.neutral[200] },
  polaroids: { width: '100%', height: 130, alignItems: 'center', justifyContent: 'center' },
  polaroid: { position: 'absolute', width: 86, height: 100, padding: 7, paddingBottom: 20, borderRadius: 10, backgroundColor: colors.neutral[0], borderWidth: 1, borderColor: colors.neutral[200], shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  polaroidPhoto: { flex: 1, borderRadius: 4, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.neutral[300], backgroundColor: colors.forest[50] },
  goodNews: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 24, backgroundColor: '#F3FAD9', borderWidth: 1, borderColor: '#E3F1BE' },
  goodIcon: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.lime[400], alignItems: 'center', justifyContent: 'center' },
});
