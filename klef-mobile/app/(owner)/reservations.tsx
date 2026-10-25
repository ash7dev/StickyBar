import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AlertCircle, ArrowRight, BellRing, CalendarDays, ChevronDown, Handshake, SearchX, ShieldCheck } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors, radius, typography } from '../../shared/theme/tokens';
import { OWNER_RESERVATIONS_CACHE_KEY, fetchOwnerReservations, ownerReservationsKey } from '../../features/warmup/queries';
import {
  MobileOwnerReservationHeaderBar,
  OwnerStatusTabId,
} from '../../features/reservations/components/owner/MobileOwnerReservationHeaderBar';
import {
  MobileOwnerReservationCard,
  OwnerReservationItem,
  payoutOf,
} from '../../features/reservations/components/owner/MobileOwnerReservationCard';

const INK = colors.forest[950];
const ACTIVE_STATUSES = ['PENDING', 'PAID', 'CONFIRMED', 'CHECKED_IN', 'DISPUTED'];
const RESERVATIONS_CACHE_KEY = OWNER_RESERVATIONS_CACHE_KEY;
const tap = () => Haptics.selectionAsync().catch(() => {});
const fcfa = (n: number) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
const plural = (n: number, word: string) => `${n} ${word}${n > 1 ? 's' : ''}`;

const time = (r: OwnerReservationItem) => new Date(r.dateDebut).getTime();

function SkeletonCard() {
  return (
    <View style={skeletonStyles.card}>
      <View style={skeletonStyles.row}>
        <View style={skeletonStyles.tile} />
        <View style={skeletonStyles.lines}>
          <View style={[skeletonStyles.line, { width: '70%' }]} />
          <View style={[skeletonStyles.line, { width: '50%' }]} />
          <View style={[skeletonStyles.line, { width: '60%' }]} />
        </View>
      </View>
      <View style={skeletonStyles.foot} />
    </View>
  );
}

function SectionLabel({ children, count }: { children: string; count: number }) {
  return (
    <View style={styles.sectionLabel}>
      <Text style={styles.sectionLabelText}>{children.toUpperCase()}</Text>
      <Text style={styles.sectionLabelCount}>{count}</Text>
    </View>
  );
}

export default function OwnerReservationsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<OwnerStatusTabId>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [cachedReservations, setCachedReservations] = useState<OwnerReservationItem[] | null>(null);
  const [isCacheLoaded, setIsCacheLoaded] = useState(false);

  // ── 1. Hydratation persistante instantanée (démarrage à froid) ──
  useEffect(() => {
    AsyncStorage.getItem(RESERVATIONS_CACHE_KEY)
      .then((raw) => {
        if (!raw) return;
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) setCachedReservations(parsed);
        } catch (e) {
          console.warn('[OwnerReservationsScreen] Erreur de lecture du cache JSON:', e);
        }
      })
      .catch((err) => console.warn('[OwnerReservationsScreen] Erreur de cache:', err))
      .finally(() => setIsCacheLoaded(true));
  }, []);

  // ── 2. Query SWR + cache disque ──
  const {
    data: reservationsData = [],
    isLoading,
    isFetching,
    isRefetching,
    refetch,
    error,
  } = useQuery<OwnerReservationItem[]>({
    queryKey: ownerReservationsKey,
    queryFn: async () => {
      try {
        return await fetchOwnerReservations<OwnerReservationItem>();
      } catch (err) {
        if (cachedReservations && cachedReservations.length > 0) return cachedReservations;
        throw err;
      }
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    initialData: cachedReservations || undefined,
  });

  const reservations = reservationsData.length > 0 ? reservationsData : cachedReservations || [];

  const onRefresh = useCallback(() => {
    refetch();
    queryClient.invalidateQueries({ queryKey: ['owner', 'dashboard-full'] });
  }, [refetch, queryClient]);

  /* ── Données filtrées et groupées ─────────────────────────── */
  const { filteredList, decide, live, upcoming, others, historyList, counts, summary, showSkeleton } = useMemo(() => {
    const showSkeleton = (isLoading || isFetching || isRefetching || !isCacheLoaded) && reservations.length === 0;
    const valid = reservations.filter((r) => r.statut !== 'EXPIRED');

    const q = searchQuery.trim().toLowerCase();
    const matches = (r: OwnerReservationItem) => {
      if (!q) return true;
      const hay = [
        r.logement?.titre,
        r.locataire?.prenom,
        r.locataire?.nom,
        r.logement?.ville,
        r.logement?.quartier,
        r.id,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    };

    const list = valid.filter((r) => activeTab === 'ALL' || r.statut === activeTab).filter(matches);
    const active = list.filter((r) => ACTIVE_STATUSES.includes(r.statut));

    const byStatus = new Map<string, number>();
    valid.forEach((r) => byStatus.set(r.statut, (byStatus.get(r.statut) ?? 0) + 1));

    const toDecide = valid.filter((r) => r.statut === 'PAID');
    const inStay = valid.filter((r) => r.statut === 'CHECKED_IN');
    const coming = valid.filter((r) => r.statut === 'CONFIRMED');

    return {
      filteredList: [...list].sort((a, b) => (ACTIVE_STATUSES.includes(a.statut) ? time(a) - time(b) : time(b) - time(a))),
      decide: active.filter((r) => r.statut === 'PAID').sort((a, b) => time(a) - time(b)),
      live: active.filter((r) => r.statut === 'CHECKED_IN').sort((a, b) => time(a) - time(b)),
      upcoming: active.filter((r) => r.statut === 'CONFIRMED').sort((a, b) => time(a) - time(b)),
      others: active.filter((r) => r.statut === 'PENDING' || r.statut === 'DISPUTED'),
      historyList: list.filter((r) => !ACTIVE_STATUSES.includes(r.statut)).sort((a, b) => time(b) - time(a)),
      counts: byStatus,
      summary: {
        toDecide: toDecide.length,
        inStay: inStay.length,
        upcoming: coming.length,
        // Ce que Paixi versera encore sur les séjours confirmés ou en cours
        incoming: [...coming, ...inStay].reduce((sum, r) => sum + payoutOf(r), 0),
      },
      showSkeleton,
    };
  }, [reservations, activeTab, searchQuery, isCacheLoaded, isLoading, isFetching, isRefetching]);

  const headline =
    summary.toDecide > 0
      ? { main: plural(summary.toDecide, 'demande'), accent: 'à décider' }
      : summary.inStay > 0
      ? { main: plural(summary.inStay, 'voyageur'), accent: 'chez vous' }
      : summary.upcoming > 0
      ? { main: plural(summary.upcoming, 'séjour'), accent: 'à venir' }
      : { main: 'Tout est', accent: 'à jour' };

  const renderCards = (items: OwnerReservationItem[]) =>
    items.map((item) => <MobileOwnerReservationCard key={item.id} reservation={item} />);

  const filtering = searchQuery.length > 0 || activeTab !== 'ALL';

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={onRefresh} tintColor={colors.forest[600]} colors={[colors.forest[600]]} />}
      >
        {/* ── Résumé de l'activité ───────────────────────────── */}
        {reservations.length > 0 && (
          <View style={styles.summary}>
            <View style={[styles.ring, styles.ringOuter]} />
            <View style={[styles.ring, styles.ringInner]} />
            <Text style={styles.kicker}>VOS SÉJOURS</Text>
            <Text style={styles.headline}>
              {headline.main} <Text style={styles.headlineAccent}>{headline.accent}</Text>
            </Text>

            <View style={styles.kpis}>
              <View style={styles.kpi}>
                <Text style={[styles.kpiValue, summary.toDecide > 0 && styles.kpiGold]}>{summary.toDecide}</Text>
                <Text style={styles.kpiLabel}>à décider</Text>
              </View>
              <View style={styles.kpiSep} />
              <View style={styles.kpi}>
                <Text style={styles.kpiValue}>{summary.upcoming}</Text>
                <Text style={styles.kpiLabel}>à venir</Text>
              </View>
              <View style={styles.kpiSep} />
              <View style={styles.kpi}>
                <Text style={styles.kpiValue}>{summary.inStay}</Text>
                <Text style={styles.kpiLabel}>en séjour</Text>
              </View>
            </View>

            {summary.incoming > 0 && (
              <View style={styles.incoming}>
                <Text style={styles.incomingLabel}>À recevoir via Paixi</Text>
                <Text style={styles.incomingValue}>
                  {fcfa(summary.incoming)} <Text style={styles.incomingUnit}>FCFA</Text>
                </Text>
              </View>
            )}

            {summary.toDecide > 0 && activeTab !== 'PAID' && (
              <TouchableOpacity
                onPress={() => {
                  tap();
                  setSearchQuery('');
                  setActiveTab('PAID');
                }}
                style={styles.summaryCta}
                accessibilityRole="button"
              >
                <Text style={styles.summaryCtaText}>Répondre {summary.toDecide > 1 ? 'aux demandes' : 'à la demande'}</Text>
                <View style={styles.summaryCtaArrow}>
                  <ArrowRight size={14} color={colors.lime[400]} strokeWidth={2.6} />
                </View>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* ── Recherche + filtres ─────────────────────────────── */}
        {reservations.length > 0 && (
          <MobileOwnerReservationHeaderBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            activeTab={activeTab}
            onTabChange={(tab) => {
              tap();
              setActiveTab(tab);
            }}
            counts={counts}
            totalCount={reservations.filter((r) => r.statut !== 'EXPIRED').length}
          />
        )}

        {error && reservations.length === 0 && (
          <View style={styles.errorBox}>
            <AlertCircle size={18} color={colors.error[600]} />
            <Text style={styles.errorText}>
              {(error as any)?.response?.data?.message || (error as any)?.message || 'Impossible de charger vos réservations.'}
            </Text>
          </View>
        )}

        {showSkeleton && (
          <View style={styles.list}>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </View>
        )}

        {/* ── Aucune réservation du tout ─────────────────────── */}
        {!showSkeleton && reservations.length === 0 && !error && (
          <View style={styles.hero}>
            <View style={[styles.ring, styles.ringOuter]} />
            <View style={[styles.ring, styles.ringInner]} />
            <Text style={styles.kicker}>VOS SÉJOURS</Text>
            <Text style={styles.heroTitle}>
              Vos premiers voyageurs{'\n'}
              <Text style={styles.headlineAccent}>arrivent bientôt.</Text>
            </Text>
            <Text style={styles.heroText}>Chaque demande s’affichera ici, avec tout ce qu’il faut pour accueillir sereinement.</Text>
            <View style={styles.steps}>
              {[
                { Icon: BellRing, title: 'Une demande arrive', text: 'Vous êtes notifié, le voyageur a déjà payé.' },
                { Icon: Handshake, title: 'Vous acceptez', text: 'Vous fixez vos horaires d’arrivée et de départ.' },
                { Icon: ShieldCheck, title: 'Paiement sécurisé', text: 'Paixi garde l’argent jusqu’à l’arrivée du voyageur.' },
              ].map(({ Icon, title, text }, i, all) => (
                <View key={title} style={styles.step}>
                  <View style={styles.stepRail}>
                    <View style={styles.stepIcon}>
                      <Icon size={15} color={colors.lime[400]} />
                    </View>
                    {i < all.length - 1 && <View style={styles.stepLine} />}
                  </View>
                  <View style={styles.stepBody}>
                    <Text style={styles.stepTitle}>{title}</Text>
                    <Text style={styles.stepText}>{text}</Text>
                  </View>
                </View>
              ))}
            </View>
            <View style={styles.heroActions}>
              <TouchableOpacity
                onPress={() => router.navigate('/(owner)/listings' as any)}
                style={[styles.heroBtn, styles.heroBtnLime]}
                accessibilityRole="link"
              >
                <Text style={styles.heroBtnLimeText}>Mes biens</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.navigate('/(owner)/calendar' as any)}
                style={[styles.heroBtn, styles.heroBtnGhost]}
                accessibilityRole="link"
              >
                <CalendarDays size={15} color="#FFFFFF" />
                <Text style={styles.heroBtnGhostText}>Calendrier</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ── Aucun résultat pour la recherche ou le filtre ──── */}
        {!showSkeleton && reservations.length > 0 && filteredList.length === 0 && (
          <View style={styles.noResult}>
            <View style={styles.noResultIcon}>
              <SearchX size={20} color={colors.neutral[600]} />
            </View>
            <Text style={styles.noResultTitle}>{searchQuery ? 'Aucun résultat' : 'Rien dans ce filtre'}</Text>
            <Text style={styles.noResultText}>
              {searchQuery ? `Aucun séjour ne correspond à « ${searchQuery} ».` : 'Aucune réservation n’a ce statut pour le moment.'}
            </Text>
            {filtering && (
              <TouchableOpacity
                onPress={() => {
                  setSearchQuery('');
                  setActiveTab('ALL');
                }}
                style={styles.noResultBtn}
                accessibilityRole="button"
              >
                <Text style={styles.noResultBtnText}>Voir tous les séjours</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* ── Liste ──────────────────────────────────────────── */}
        {!showSkeleton && filteredList.length > 0 && (
          <View style={styles.list}>
            {activeTab === 'ALL' ? (
              <>
                {decide.length > 0 && (
                  <View style={styles.group}>
                    <SectionLabel count={decide.length}>À décider</SectionLabel>
                    {renderCards(decide)}
                  </View>
                )}
                {live.length > 0 && (
                  <View style={styles.group}>
                    <SectionLabel count={live.length}>En séjour</SectionLabel>
                    {renderCards(live)}
                  </View>
                )}
                {upcoming.length > 0 && (
                  <View style={styles.group}>
                    <SectionLabel count={upcoming.length}>À venir</SectionLabel>
                    {renderCards(upcoming)}
                  </View>
                )}
                {others.length > 0 && (
                  <View style={styles.group}>
                    <SectionLabel count={others.length}>À suivre</SectionLabel>
                    {renderCards(others)}
                  </View>
                )}
                {decide.length + live.length + upcoming.length + others.length === 0 && (
                  <View style={styles.calm}>
                    <Text style={styles.calmTitle}>Aucun séjour en cours</Text>
                    <Text style={styles.calmText}>Rien à préparer pour l’instant. Vos séjours passés sont juste en dessous.</Text>
                  </View>
                )}

                {historyList.length > 0 && (
                  <View style={styles.group}>
                    <TouchableOpacity
                      onPress={() => {
                        tap();
                        setShowHistory((prev) => !prev);
                      }}
                      activeOpacity={0.8}
                      style={styles.historyBtn}
                      accessibilityRole="button"
                    >
                      <View style={styles.flex}>
                        <Text style={styles.historyTitle}>Séjours passés</Text>
                        <Text style={styles.historySub}>
                          {plural(historyList.length, 'séjour')} · terminés et annulés
                        </Text>
                      </View>
                      <View style={styles.historyToggle}>
                        <Text style={styles.historyToggleText}>{showHistory ? 'Masquer' : 'Afficher'}</Text>
                        <ChevronDown size={15} color={INK} style={showHistory ? styles.rotate : undefined} />
                      </View>
                    </TouchableOpacity>
                    {showHistory && renderCards(historyList)}
                  </View>
                )}
              </>
            ) : (
              renderCards(filteredList)
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.neutral[50] },
  flex: { flex: 1, minWidth: 0 },
  container: { padding: 16, gap: 16, paddingBottom: 120 },

  // Résumé
  summary: { gap: 16, padding: 20, borderRadius: 28, overflow: 'hidden', backgroundColor: INK },
  ring: { position: 'absolute', borderWidth: 1, borderColor: 'rgba(211,242,110,0.12)' },
  ringOuter: { width: 220, height: 220, borderRadius: 110, top: -110, right: -70 },
  ringInner: { width: 130, height: 130, borderRadius: 65, top: -65, right: -25, borderColor: 'rgba(211,242,110,0.2)' },
  kicker: { fontFamily: typography.fontBodyBold, fontSize: 10.5, letterSpacing: 1.3, color: colors.lime[400] },
  headline: { fontFamily: typography.fontDisplaySemiBold, fontSize: 28, lineHeight: 32, letterSpacing: -0.7, color: '#FFFFFF', marginTop: -8 },
  headlineAccent: { fontStyle: 'italic', color: colors.lime[400] },
  kpis: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderRadius: 20, backgroundColor: 'rgba(248,251,244,0.06)' },
  kpi: { flex: 1, alignItems: 'center', gap: 2 },
  kpiValue: { fontFamily: typography.fontDisplaySemiBold, fontSize: 22, color: '#FFFFFF' },
  kpiGold: { color: colors.gold[300] },
  kpiLabel: { fontFamily: typography.fontBodyMedium, fontSize: 11.5, color: colors.forest[200] },
  kpiSep: { width: 1, height: 30, backgroundColor: 'rgba(248,251,244,0.12)' },
  incoming: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 },
  incomingLabel: { fontFamily: typography.fontBodySemiBold, fontSize: 13, color: colors.forest[200] },
  incomingValue: { fontFamily: typography.fontDisplaySemiBold, fontSize: 20, color: '#FFFFFF' },
  incomingUnit: { fontFamily: typography.fontBodySemiBold, fontSize: 11, color: colors.forest[200] },
  summaryCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 50,
    paddingLeft: 20,
    paddingRight: 5,
    borderRadius: radius.pill,
    backgroundColor: colors.lime[400],
  },
  summaryCtaText: { fontFamily: typography.fontBodyBold, fontSize: 14, color: INK },
  summaryCtaArrow: { width: 40, height: 40, borderRadius: 20, backgroundColor: INK, alignItems: 'center', justifyContent: 'center' },

  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 16,
    backgroundColor: colors.error[50],
  },
  errorText: { flex: 1, fontFamily: typography.fontBodySemiBold, fontSize: 12, color: colors.error[700] },

  // Liste
  list: { gap: 22 },
  group: { gap: 10 },
  sectionLabel: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 2 },
  sectionLabelText: { fontFamily: typography.fontBodyBold, fontSize: 11, letterSpacing: 1.2, color: colors.neutral[500] },
  sectionLabelCount: {
    fontFamily: typography.fontBodyBold,
    fontSize: 11,
    color: colors.neutral[600],
    paddingHorizontal: 7,
    paddingVertical: 1,
    borderRadius: radius.pill,
    backgroundColor: colors.neutral[100],
    overflow: 'hidden',
  },
  calm: { gap: 4, padding: 18, borderRadius: 22, backgroundColor: colors.neutral[0], borderWidth: 1, borderColor: colors.neutral[200] },
  calmTitle: { fontFamily: typography.fontDisplaySemiBold, fontSize: 17, color: colors.neutral[900] },
  calmText: { fontFamily: typography.fontBody, fontSize: 13, lineHeight: 19, color: colors.neutral[600] },
  historyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 22,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.neutral[300],
  },
  historyTitle: { fontFamily: typography.fontBodyBold, fontSize: 14, color: colors.neutral[900] },
  historySub: { fontFamily: typography.fontBody, fontSize: 12, color: colors.neutral[500], marginTop: 1 },
  historyToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 32,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    backgroundColor: colors.neutral[0],
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  historyToggleText: { fontFamily: typography.fontBodyBold, fontSize: 12, color: INK },
  rotate: { transform: [{ rotate: '180deg' }] },

  // Aucune réservation
  hero: { gap: 14, padding: 22, borderRadius: 30, overflow: 'hidden', backgroundColor: INK },
  heroTitle: { fontFamily: typography.fontDisplaySemiBold, fontSize: 30, lineHeight: 34, letterSpacing: -0.8, color: '#FFFFFF' },
  heroText: { fontFamily: typography.fontBody, fontSize: 13, lineHeight: 19, color: colors.forest[200] },
  steps: { marginTop: 4 },
  step: { flexDirection: 'row', gap: 12 },
  stepRail: { alignItems: 'center', width: 34 },
  stepIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(211,242,110,0.12)', alignItems: 'center', justifyContent: 'center' },
  stepLine: { flex: 1, width: 1, marginVertical: 4, backgroundColor: 'rgba(211,242,110,0.2)' },
  stepBody: { flex: 1, paddingBottom: 16, paddingTop: 2 },
  stepTitle: { fontFamily: typography.fontBodyBold, fontSize: 14, color: '#FFFFFF' },
  stepText: { fontFamily: typography.fontBody, fontSize: 12, lineHeight: 17, color: colors.forest[200], marginTop: 2 },
  heroActions: { flexDirection: 'row', gap: 10 },
  heroBtn: { flex: 1, flexDirection: 'row', gap: 7, height: 48, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  heroBtnLime: { backgroundColor: colors.lime[400] },
  heroBtnLimeText: { fontFamily: typography.fontBodyBold, fontSize: 14, color: INK },
  heroBtnGhost: { borderWidth: 1, borderColor: 'rgba(248,251,244,0.25)' },
  heroBtnGhostText: { fontFamily: typography.fontBodySemiBold, fontSize: 14, color: '#FFFFFF' },

  // Aucun résultat
  noResult: {
    alignItems: 'center',
    gap: 6,
    paddingVertical: 32,
    paddingHorizontal: 24,
    borderRadius: 26,
    backgroundColor: colors.neutral[0],
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  noResultIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.neutral[100], alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  noResultTitle: { fontFamily: typography.fontDisplaySemiBold, fontSize: 19, color: colors.neutral[900] },
  noResultText: { fontFamily: typography.fontBody, fontSize: 13, lineHeight: 19, color: colors.neutral[600], textAlign: 'center' },
  noResultBtn: { marginTop: 10, height: 42, paddingHorizontal: 18, borderRadius: radius.pill, backgroundColor: INK, justifyContent: 'center' },
  noResultBtnText: { fontFamily: typography.fontBodyBold, fontSize: 13, color: colors.lime[400] },
});

const skeletonStyles = StyleSheet.create({
  card: { gap: 14, padding: 14, borderRadius: 24, backgroundColor: colors.neutral[0], borderWidth: 1, borderColor: colors.neutral[200] },
  row: { flexDirection: 'row', gap: 12 },
  tile: { width: 54, height: 62, borderRadius: 16, backgroundColor: colors.neutral[100] },
  lines: { flex: 1, gap: 8, justifyContent: 'center' },
  line: { height: 11, borderRadius: 6, backgroundColor: colors.neutral[100] },
  foot: { height: 16, borderRadius: 8, backgroundColor: colors.neutral[100] },
});
