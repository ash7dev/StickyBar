import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { CalendarRange, ChevronDown, List, SearchX, SlidersHorizontal } from 'lucide-react-native';
import { colors, radius, typography } from '../../shared/theme/tokens';
import { useAuthStore } from '../../features/auth/stores/auth.store';
import {
  managerKeys,
  useManagedListings,
  useManagerReservations,
  type ManagedListing,
  type ManagerReservation,
} from '../../features/manager/hooks/useManagerToday';
import { fmt, ownerNameOf, todayKey } from '../../features/manager/lib/today';
import {
  MobileOwnerReservationHeaderBar,
  type OwnerStatusTabId,
} from '../../features/reservations/components/owner/MobileOwnerReservationHeaderBar';
import {
  MobileOwnerReservationCard,
  payoutOf,
  type OwnerReservationItem,
} from '../../features/reservations/components/owner/MobileOwnerReservationCard';
import { StaysPlanning } from '../../features/manager/components/stays/StaysPlanning';
import { OwnerFilterSheet, type OwnerOption } from '../../features/manager/components/today/OwnerFilterSheet';
import { INK, LIME, LINE, MUTED } from '../../features/manager/components/today/ui';

const ACTIVE = ['PENDING', 'PAID', 'CONFIRMED', 'CHECKED_IN', 'DISPUTED'];
const time = (r: ManagerReservation) => new Date(r.dateDebut).getTime();
const plural = (n: number, w: string) => `${n} ${w}${n > 1 ? 's' : ''}`;
const tap = () => Haptics.selectionAsync().catch(() => {});

type Mode = 'list' | 'planning';

function Section({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <View style={styles.group}>
      <View style={styles.sectionLabel}>
        <Text style={styles.sectionLabelText}>{title.toUpperCase()}</Text>
        <Text style={styles.sectionCount}>{count}</Text>
      </View>
      {children}
    </View>
  );
}

/** Séjours du parc : la liste pour agir, le planning pour voir la semaine. */
export default function ManagerStaysScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);

  const [mode, setMode] = useState<Mode>('list');
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [tab, setTab] = useState<OwnerStatusTabId>('ALL');
  const [query, setQuery] = useState('');
  const [showPast, setShowPast] = useState(false);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  const listingsQ = useManagedListings();
  const reservationsQ = useManagerReservations();

  // Mêmes règles que « Aujourd'hui » : seuls les biens confiés à ce gestionnaire
  const allListings = useMemo(
    () => (listingsQ.data ?? []).filter((l) => !user?.id || !l.gestionnaireId || l.gestionnaireId === user.id),
    [listingsQ.data, user?.id],
  );
  const listings = useMemo(() => (ownerId ? allListings.filter((l) => l.proprietaireId === ownerId) : allListings), [allListings, ownerId]);
  const listingMap = useMemo(() => new Map<string, ManagedListing>(listings.map((l) => [l.id, l])), [listings]);
  const owners: OwnerOption[] = useMemo(() => {
    const m = new Map<string, OwnerOption>();
    for (const l of allListings) {
      const o = m.get(l.proprietaireId) ?? { id: l.proprietaireId, name: ownerNameOf(l), listings: 0 };
      o.listings += 1;
      m.set(l.proprietaireId, o);
    }
    return [...m.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [allListings]);
  const ownerName = ownerId ? owners.find((o) => o.id === ownerId)?.name ?? null : null;

  const reservations = useMemo(
    () => (reservationsQ.data ?? []).filter((r) => listingMap.has(r.logementId) && r.statut !== 'EXPIRED'),
    [reservationsQ.data, listingMap],
  );

  const { filtered, decide, live, upcoming, others, past, counts, summary } = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matches = (r: ManagerReservation) => {
      if (!q) return true;
      const l = listingMap.get(r.logementId);
      return [r.locataire?.prenom, r.locataire?.nom, l?.titre, l?.quartier, l?.ville, ownerNameOf(l), r.id]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q);
    };
    const byStatus = new Map<string, number>();
    reservations.forEach((r) => byStatus.set(r.statut, (byStatus.get(r.statut) ?? 0) + 1));
    const list = reservations.filter((r) => (tab === 'ALL' || r.statut === tab) && matches(r));
    const active = list.filter((r) => ACTIVE.includes(r.statut));
    const asc = (a: ManagerReservation, b: ManagerReservation) => time(a) - time(b);
    const coming = reservations.filter((r) => r.statut === 'CONFIRMED');
    const staying = reservations.filter((r) => r.statut === 'CHECKED_IN');
    return {
      filtered: [...list].sort((a, b) => (ACTIVE.includes(a.statut) ? asc(a, b) : time(b) - time(a))),
      decide: active.filter((r) => r.statut === 'PAID').sort(asc),
      live: active.filter((r) => r.statut === 'CHECKED_IN').sort(asc),
      upcoming: active.filter((r) => r.statut === 'CONFIRMED').sort(asc),
      others: active.filter((r) => r.statut === 'PENDING' || r.statut === 'DISPUTED'),
      past: list.filter((r) => !ACTIVE.includes(r.statut)).sort((a, b) => time(b) - time(a)),
      counts: byStatus,
      summary: {
        toDecide: byStatus.get('PAID') ?? 0,
        inStay: staying.length,
        upcoming: coming.length,
        // Ce que Paixi versera aux propriétaires sur les séjours confirmés ou en cours
        toOwners: [...coming, ...staying].reduce((s, r) => s + payoutOf(r as unknown as OwnerReservationItem), 0),
      },
    };
  }, [reservations, tab, query, listingMap]);

  const card = (r: ManagerReservation) => (
    <MobileOwnerReservationCard
      key={r.id}
      reservation={r as unknown as OwnerReservationItem}
      ownerName={ownerNameOf(listingMap.get(r.logementId))}
      onPress={() => router.push(`/(manager)/sejour/${r.id}` as never)}
    />
  );

  const headline =
    summary.toDecide > 0
      ? { main: plural(summary.toDecide, 'demande'), accent: 'à décider' }
      : summary.inStay > 0
      ? { main: plural(summary.inStay, 'voyageur'), accent: 'sur place' }
      : summary.upcoming > 0
      ? { main: plural(summary.upcoming, 'séjour'), accent: 'à venir' }
      : { main: 'Tout est', accent: 'à jour' };

  const refreshing = listingsQ.isRefetching || reservationsQ.isRefetching;
  const onRefresh = () => qc.invalidateQueries({ queryKey: managerKeys.all });
  const filtering = query.length > 0 || tab !== 'ALL';

  if ((listingsQ.isLoading || reservationsQ.isLoading) && !reservationsQ.data) {
    return (
      <View style={[styles.screen, styles.center]}>
        <ActivityIndicator color={colors.forest[600]} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 14 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.forest[600]} />}
      >
        {/* En-tête */}
        <View style={styles.head}>
          <View style={styles.flex}>
            <Text style={styles.kicker}>ESPACE GESTIONNAIRE</Text>
            <Text style={styles.title}>Séjours</Text>
          </View>
          <TouchableOpacity
            onPress={() => setFilterOpen(true)}
            style={[styles.filterBtn, ownerName && styles.filterBtnOn]}
            accessibilityRole="button"
            accessibilityLabel="Filtrer par propriétaire"
          >
            <SlidersHorizontal size={18} color={ownerName ? LIME : INK} />
          </TouchableOpacity>
        </View>

        {/* Résumé du parc */}
        {reservations.length > 0 && (
          <View style={styles.summary}>
            <View style={[styles.ring, styles.ringOuter]} />
            <Text style={styles.summaryKicker}>{ownerName ? `POUR ${ownerName.toUpperCase()}` : `LE PARC · ${plural(listings.length, 'BIEN').toUpperCase()}`}</Text>
            <Text style={styles.headline}>
              {headline.main} <Text style={styles.accent}>{headline.accent}</Text>
            </Text>
            <View style={styles.kpis}>
              {[
                [summary.toDecide, 'à décider', true],
                [summary.inStay, 'en séjour', false],
                [summary.upcoming, 'à venir', false],
              ].map(([v, l, gold], i) => (
                <React.Fragment key={l as string}>
                  {i > 0 && <View style={styles.kpiSep} />}
                  <View style={styles.kpi}>
                    <Text style={[styles.kpiValue, gold && (v as number) > 0 ? { color: colors.gold[300] } : null]}>{v as number}</Text>
                    <Text style={styles.kpiLabel}>{l as string}</Text>
                  </View>
                </React.Fragment>
              ))}
            </View>
            {summary.toOwners > 0 && (
              <View style={styles.owed}>
                <Text style={styles.owedLabel}>À reverser aux propriétaires</Text>
                <Text style={styles.owedValue}>
                  {fmt(summary.toOwners)} <Text style={styles.owedUnit}>FCFA</Text>
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Liste / Planning */}
        {listings.length > 0 && (
          <View style={styles.toggle}>
            {(
              [
                ['list', 'Liste', List],
                ['planning', 'Planning', CalendarRange],
              ] as const
            ).map(([k, t, Icon]) => {
              const on = mode === k;
              return (
                <TouchableOpacity
                  key={k}
                  onPress={() => {
                    tap();
                    setMode(k);
                  }}
                  style={[styles.toggleItem, on && styles.toggleOn]}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: on }}
                >
                  <Icon size={15} color={on ? LIME : MUTED} />
                  <Text style={[styles.toggleText, { color: on ? LIME : MUTED }]}>{t}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {listings.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>{ownerName ? 'Aucun bien pour ce propriétaire' : 'Aucun bien confié pour l’instant'}</Text>
            <Text style={styles.emptyText}>Les séjours des biens qu’on vous confie apparaîtront ici.</Text>
          </View>
        ) : mode === 'planning' ? (
          <StaysPlanning
            listings={listings}
            reservations={reservations}
            today={todayKey(now)}
            now={now}
            onOpen={(id) => router.push(`/(manager)/sejour/${id}` as never)}
          />
        ) : (
          <View style={styles.listWrap}>
            {reservations.length > 0 && (
              <MobileOwnerReservationHeaderBar
                searchQuery={query}
                onSearchChange={setQuery}
                activeTab={tab}
                onTabChange={(t) => {
                  tap();
                  setTab(t);
                }}
                counts={counts}
                totalCount={reservations.length}
              />
            )}

            {reservations.length === 0 ? (
              <View style={styles.hero}>
                <View style={[styles.ring, styles.ringOuter]} />
                <Text style={styles.summaryKicker}>SÉJOURS DU PARC</Text>
                <Text style={styles.heroTitle}>
                  Pas encore de séjour{'\n'}
                  <Text style={styles.accent}>sur vos biens.</Text>
                </Text>
                <Text style={styles.heroText}>
                  Dès qu’un voyageur réserve un bien que vous gérez, la demande arrive ici et dans « Aujourd’hui ». Vous l’acceptez pour le propriétaire.
                </Text>
              </View>
            ) : filtered.length === 0 ? (
              <View style={styles.noResult}>
                <SearchX size={22} color={colors.neutral[600]} />
                <Text style={styles.emptyTitle}>{query ? 'Aucun résultat' : 'Rien dans ce filtre'}</Text>
                <Text style={styles.emptyText}>{query ? `Aucun séjour ne correspond à « ${query} ».` : 'Aucun séjour n’a ce statut pour le moment.'}</Text>
                {filtering && (
                  <TouchableOpacity
                    onPress={() => {
                      setQuery('');
                      setTab('ALL');
                    }}
                    style={styles.resetBtn}
                    accessibilityRole="button"
                  >
                    <Text style={styles.resetText}>Voir tous les séjours</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : tab === 'ALL' ? (
              <>
                {decide.length > 0 && <Section title="À décider" count={decide.length}>{decide.map(card)}</Section>}
                {live.length > 0 && <Section title="En séjour" count={live.length}>{live.map(card)}</Section>}
                {upcoming.length > 0 && <Section title="À venir" count={upcoming.length}>{upcoming.map(card)}</Section>}
                {others.length > 0 && <Section title="À suivre" count={others.length}>{others.map(card)}</Section>}
                {decide.length + live.length + upcoming.length + others.length === 0 && (
                  <View style={styles.calm}>
                    <Text style={styles.calmTitle}>Aucun séjour en cours</Text>
                    <Text style={styles.emptyText}>Rien à préparer pour l’instant. Les séjours passés sont juste en dessous.</Text>
                  </View>
                )}
                {past.length > 0 && (
                  <View style={styles.group}>
                    <TouchableOpacity
                      onPress={() => {
                        tap();
                        setShowPast((v) => !v);
                      }}
                      style={styles.pastBtn}
                      accessibilityRole="button"
                    >
                      <View style={styles.flex}>
                        <Text style={styles.pastTitle}>Séjours passés</Text>
                        <Text style={styles.pastSub}>{plural(past.length, 'séjour')} · terminés et annulés</Text>
                      </View>
                      <View style={styles.pastToggle}>
                        <Text style={styles.pastToggleText}>{showPast ? 'Masquer' : 'Afficher'}</Text>
                        <ChevronDown size={15} color={INK} style={showPast ? { transform: [{ rotate: '180deg' }] } : undefined} />
                      </View>
                    </TouchableOpacity>
                    {showPast && past.map(card)}
                  </View>
                )}
              </>
            ) : (
              <View style={styles.group}>{filtered.map(card)}</View>
            )}
          </View>
        )}
      </ScrollView>

      <OwnerFilterSheet visible={filterOpen} owners={owners} selected={ownerId} onSelect={setOwnerId} onClose={() => setFilterOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.neutral[50] },
  center: { alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1, minWidth: 0 },
  content: { paddingBottom: 130, gap: 16 },
  head: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 20, gap: 12 },
  kicker: { fontFamily: typography.fontBodyBold, fontSize: 11, letterSpacing: 1.3, color: colors.forest[600] },
  title: { fontFamily: typography.fontDisplaySemiBold, fontSize: 32, letterSpacing: -1, color: INK, marginTop: 2 },
  filterBtn: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: LINE, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  filterBtnOn: { backgroundColor: INK, borderColor: INK },

  summary: { marginHorizontal: 16, gap: 12, padding: 18, borderRadius: 28, overflow: 'hidden', backgroundColor: INK },
  ring: { position: 'absolute', borderWidth: 1, borderColor: 'rgba(211,242,110,0.12)' },
  ringOuter: { width: 220, height: 220, borderRadius: 110, top: -110, right: -70 },
  summaryKicker: { fontFamily: typography.fontBodyBold, fontSize: 10.5, letterSpacing: 1.2, color: LIME },
  headline: { fontFamily: typography.fontDisplaySemiBold, fontSize: 27, lineHeight: 31, letterSpacing: -0.6, color: '#FFFFFF', marginTop: -6 },
  accent: { fontStyle: 'italic', color: LIME },
  kpis: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderRadius: 18, backgroundColor: 'rgba(248,251,244,0.06)' },
  kpi: { flex: 1, alignItems: 'center', gap: 1 },
  kpiValue: { fontFamily: typography.fontDisplaySemiBold, fontSize: 21, color: '#FFFFFF' },
  kpiLabel: { fontFamily: typography.fontBodyMedium, fontSize: 11, color: colors.forest[200] },
  kpiSep: { width: 1, height: 28, backgroundColor: 'rgba(248,251,244,0.12)' },
  owed: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 },
  owedLabel: { fontFamily: typography.fontBodySemiBold, fontSize: 12.5, color: colors.forest[200] },
  owedValue: { fontFamily: typography.fontDisplaySemiBold, fontSize: 19, color: '#FFFFFF' },
  owedUnit: { fontFamily: typography.fontBodySemiBold, fontSize: 10.5, color: colors.forest[200] },

  toggle: { flexDirection: 'row', marginHorizontal: 16, padding: 4, borderRadius: radius.pill, backgroundColor: '#EEF2EA' },
  toggleItem: { flex: 1, flexDirection: 'row', gap: 6, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  toggleOn: { backgroundColor: INK },
  toggleText: { fontFamily: typography.fontBodyBold, fontSize: 13 },

  listWrap: { paddingHorizontal: 16, gap: 18 },
  group: { gap: 10 },
  sectionLabel: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 2 },
  sectionLabelText: { fontFamily: typography.fontBodyBold, fontSize: 11, letterSpacing: 1.2, color: MUTED },
  sectionCount: {
    fontFamily: typography.fontBodyBold,
    fontSize: 11,
    color: colors.neutral[600],
    paddingHorizontal: 7,
    paddingVertical: 1,
    borderRadius: radius.pill,
    backgroundColor: colors.neutral[100],
    overflow: 'hidden',
  },
  calm: { gap: 4, padding: 18, borderRadius: 22, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: LINE },
  calmTitle: { fontFamily: typography.fontDisplaySemiBold, fontSize: 17, color: INK },
  pastBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 22, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.neutral[300] },
  pastTitle: { fontFamily: typography.fontBodyBold, fontSize: 14, color: INK },
  pastSub: { fontFamily: typography.fontBody, fontSize: 12, color: MUTED, marginTop: 1 },
  pastToggle: { flexDirection: 'row', alignItems: 'center', gap: 4, height: 32, paddingHorizontal: 12, borderRadius: radius.pill, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: LINE },
  pastToggleText: { fontFamily: typography.fontBodyBold, fontSize: 12, color: INK },

  hero: { gap: 12, padding: 22, borderRadius: 30, overflow: 'hidden', backgroundColor: INK },
  heroTitle: { fontFamily: typography.fontDisplaySemiBold, fontSize: 28, lineHeight: 32, letterSpacing: -0.7, color: '#FFFFFF' },
  heroText: { fontFamily: typography.fontBody, fontSize: 13.5, lineHeight: 20, color: colors.forest[200] },
  noResult: { alignItems: 'center', gap: 6, paddingVertical: 30, paddingHorizontal: 24, borderRadius: 26, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: LINE },
  empty: { marginHorizontal: 16, gap: 4, padding: 20, borderRadius: 24, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: LINE },
  emptyTitle: { fontFamily: typography.fontDisplaySemiBold, fontSize: 18, color: INK, textAlign: 'center' },
  emptyText: { fontFamily: typography.fontBody, fontSize: 13, lineHeight: 19, color: colors.neutral[600], textAlign: 'center' },
  resetBtn: { marginTop: 10, height: 42, paddingHorizontal: 18, borderRadius: radius.pill, backgroundColor: INK, justifyContent: 'center' },
  resetText: { fontFamily: typography.fontBodyBold, fontSize: 13, color: LIME },
});
