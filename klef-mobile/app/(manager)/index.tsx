import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Linking, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import { AlertCircle } from 'lucide-react-native';
import { colors, radius, typography } from '../../shared/theme/tokens';
import { apiClient } from '../../shared/api/api-client';
import { useAuthStore } from '../../features/auth/stores/auth.store';
import { formatExpiry } from '../../features/calendar/lib/agenda';
import {
  managerKeys,
  useManagedListings,
  useManagerDashboard,
  useManagerLeads,
  useManagerOverview,
  useManagerReservations,
  type ManagedListing,
} from '../../features/manager/hooks/useManagerToday';
import {
  addDays,
  buildMoves,
  buildTasks,
  longDay,
  nowHour,
  todayKey,
  waNumber,
  weekdayLong,
  type Move,
  type Task,
} from '../../features/manager/lib/today';
import { CockpitHero } from '../../features/manager/components/today/CockpitHero';
import { NextTiles, TaskDeck, type TaskHandlers } from '../../features/manager/components/today/TaskDeck';
import { Tour } from '../../features/manager/components/today/Tour';
import { Upcoming } from '../../features/manager/components/today/Upcoming';
import { OwnerFilterSheet, type OwnerOption } from '../../features/manager/components/today/OwnerFilterSheet';
import { EmptyPark } from '../../features/manager/components/today/EmptyPark';
import { INK, LIME } from '../../features/manager/components/today/ui';

const WEEK = 7;

/** « Aujourd'hui » du gestionnaire : le cockpit du mois, ce qu'il faut faire, la tournée, la semaine. */
export default function ManagerTodayScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);

  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [deckKey, setDeckKey] = useState<string | null>(null);
  const [clock, setClock] = useState(() => new Date());
  const today = todayKey(clock);
  const [selectedDay, setSelectedDay] = useState(() => addDays(todayKey(), 1));

  // L'heure fait avancer la ligne « maintenant » et les mouvements faits
  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  const dashboard = useManagerDashboard(ownerId);
  const listingsQ = useManagedListings();
  const reservationsQ = useManagerReservations();
  const overview = useManagerOverview();
  const leadsQ = useManagerLeads();

  const allListings = listingsQ.data ?? [];
  const listings = useMemo(
    () => (ownerId ? allListings.filter((l) => l.proprietaireId === ownerId) : allListings),
    [allListings, ownerId],
  );
  const listingMap = useMemo(() => new Map<string, ManagedListing>(listings.map((l) => [l.id, l])), [listings]);

  const owners: OwnerOption[] = useMemo(() => {
    const byOwner = new Map<string, OwnerOption>();
    for (const l of allListings) {
      const name = l.proprietaire ? `${l.proprietaire.prenom} ${l.proprietaire.nom}`.trim() : 'Propriétaire';
      const o = byOwner.get(l.proprietaireId) ?? { id: l.proprietaireId, name, listings: 0 };
      o.listings += 1;
      byOwner.set(l.proprietaireId, o);
    }
    return [...byOwner.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [allListings]);

  const reservations = useMemo(
    () => (reservationsQ.data ?? []).filter((r) => listingMap.has(r.logementId)),
    [reservationsQ.data, listingMap],
  );

  const todayMoves = useMemo(() => buildMoves(reservations, listingMap, today), [reservations, listingMap, today]);
  const weekDays = useMemo(() => Array.from({ length: WEEK }, (_, i) => addDays(today, i)), [today]);
  const movesByDay = useMemo(() => {
    const m = new Map<string, Move[]>();
    for (const d of weekDays) m.set(d, d === today ? todayMoves : buildMoves(reservations, listingMap, d));
    return m;
  }, [weekDays, today, todayMoves, reservations, listingMap]);

  const decisions = useMemo(
    () => reservations.filter((r) => r.statut === 'PAID').sort((a, b) => (a.delaiConfirmation ?? '').localeCompare(b.delaiConfirmation ?? '')),
    [reservations],
  );
  // Les prospects ne sont rattachés à aucun propriétaire : masqués quand on filtre
  const leads = ownerId ? [] : leadsQ.data ?? [];
  const tasks = useMemo(
    () => buildTasks(decisions, todayMoves, leads, listingMap, (iso) => formatExpiry(iso, clock.getTime())),
    [decisions, todayMoves, leads, listingMap, clock],
  );
  const deckIndex = Math.max(0, tasks.findIndex((t) => t.key === deckKey));
  const current = tasks[deckIndex];

  // ── Chiffres ──
  const kpis = dashboard.data?.kpis;
  const monthly = dashboard.data?.revenusMensuels ?? [];
  const bars = monthly.map((m) => Number(m.ca) || 0);
  const last = bars[bars.length - 1] ?? 0;
  const prev = bars[bars.length - 2] ?? 0;
  const changePct = prev > 0 ? Math.round(((last - prev) / prev) * 100) : null;
  const occupancy = useMemo(() => {
    const ov = overview.data;
    if (!ov) return null;
    if (!ownerId) return ov.occupancy.rate;
    const mine = ov.logements.filter((l) => listingMap.has(l.id));
    const booked = mine.reduce((s, l) => s + l.occupancy.bookedNights, 0);
    const available = mine.reduce((s, l) => s + l.occupancy.availableNights, 0);
    return available > 0 ? booked / available : null;
  }, [overview.data, ownerId, listingMap]);
  const online = listings.filter((l) => l.statut === 'PUBLISHED').length;
  const ownerName = ownerId ? owners.find((o) => o.id === ownerId)?.name ?? null : null;

  // ── Prochain mouvement après aujourd'hui (journée calme) ──
  const calmLine = useMemo(() => {
    for (const d of weekDays.slice(1)) {
      const first = movesByDay.get(d)?.[0];
      if (first) return `Prochain mouvement : ${weekdayLong(d)} à ${first.at}, ${first.listing?.titre ?? 'un bien'}.`;
    }
    return 'Aucun mouvement prévu cette semaine.';
  }, [weekDays, movesByDay]);

  // ── Actions ──
  const openStay = useCallback((id?: string) => id && router.push(`/(manager)/sejour/${id}` as never), [router]);
  const handlers: TaskHandlers = {
    onOpen: (t: Task) => openStay(t.reservationId),
    onCall: (t: Task) => t.lead && Linking.openURL(`tel:${t.lead.telephone}`),
    onWhatsApp: (t: Task) =>
      t.lead && Linking.openURL(`https://wa.me/${waNumber(t.lead.telephone)}`).catch(() => Alert.alert('WhatsApp indisponible')),
    onContacted: async (t: Task) => {
      if (!t.lead) return;
      try {
        await apiClient.patch(`/gestionnaire/demandes-managed/${t.lead.id}`, { statut: 'CONTACTE' });
        qc.invalidateQueries({ queryKey: managerKeys.leads });
      } catch {
        Alert.alert('Erreur', 'Impossible de mettre à jour le prospect.');
      }
    },
  };

  const openMap = () => {
    const stops = todayMoves
      .filter((m) => !m.done && m.listing?.latitude != null && m.listing?.longitude != null)
      .map((m) => `${Number(m.listing!.latitude)},${Number(m.listing!.longitude)}`);
    if (stops.length === 0) {
      Alert.alert('Carte indisponible', 'Les biens de la tournée n’ont pas encore de position GPS.');
      return;
    }
    const destination = stops[stops.length - 1];
    const waypoints = stops.slice(0, -1).join('|');
    Linking.openURL(
      `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}${waypoints ? `&waypoints=${encodeURIComponent(waypoints)}` : ''}&travelmode=driving`,
    );
  };

  const refreshing = listingsQ.isRefetching || reservationsQ.isRefetching || dashboard.isRefetching;
  const onRefresh = () => qc.invalidateQueries({ queryKey: managerKeys.all });

  const firstLoad = (listingsQ.isLoading || reservationsQ.isLoading) && !listingsQ.data;
  const loadError = (listingsQ.error || reservationsQ.error) && !listingsQ.data;
  const emptyPark = listingsQ.isSuccess && allListings.length === 0;

  if (firstLoad) {
    return (
      <View style={[styles.screen, styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator color={colors.forest[600]} />
      </View>
    );
  }

  if (loadError) {
    return (
      <View style={[styles.screen, styles.center, { paddingTop: insets.top, paddingHorizontal: 24 }]}>
        <AlertCircle size={28} color={colors.error[600]} />
        <Text style={styles.errorTitle}>Impossible de charger votre journée</Text>
        <Text style={styles.errorText}>Vérifiez votre connexion, puis réessayez.</Text>
        <TouchableOpacity onPress={onRefresh} style={styles.retry} accessibilityRole="button">
          <Text style={styles.retryText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={LIME} progressViewOffset={insets.top} />}
      >
        {emptyPark ? (
          <EmptyPark topInset={insets.top} firstName={user?.prenom} />
        ) : (
          <CockpitHero
            topInset={insets.top}
            dateLabel={longDay(today)}
            firstName={user?.prenom}
            listings={listings.length}
            owners={ownerId ? 1 : owners.length}
            revenue={Number(kpis?.caDuMois ?? 0)}
            ownersShare={Number(kpis?.netProprietairesDuMois ?? 0)}
            commission={Number(kpis?.commissionKlefDuMois ?? 0)}
            stays={Number(kpis?.reservationsDuMois ?? 0)}
            bars={bars}
            changePct={changePct}
            occupancy={occupancy}
            online={online}
            toReview={listings.length - online}
            filterLabel={ownerName}
            onFilter={() => setFilterOpen(true)}
          />
        )}

        <View style={styles.section}>
          <TaskDeck
            tasks={tasks}
            index={deckIndex}
            onNext={() => setDeckKey(tasks[(deckIndex + 1) % tasks.length]?.key ?? null)}
            handlers={handlers}
          />
        </View>

        <NextTiles tasks={tasks} currentKey={current?.key} onSelect={setDeckKey} handlers={handlers} />

        {!emptyPark && (
          <>
            <View style={styles.tour}>
              <Tour moves={todayMoves} now={nowHour(clock)} calmLine={calmLine} onOpen={(m) => openStay(m.reservation.id)} onMap={openMap} />
            </View>
            <Upcoming
              days={weekDays}
              movesByDay={movesByDay}
              today={today}
              selected={weekDays.includes(selectedDay) ? selectedDay : weekDays[1]}
              onSelect={setSelectedDay}
              onOpen={(m) => openStay(m.reservation.id)}
            />
            <Text style={styles.footer}>Exports, relevés et graphiques détaillés : espace gestionnaire web</Text>
          </>
        )}
      </ScrollView>

      <OwnerFilterSheet visible={filterOpen} owners={owners} selected={ownerId} onSelect={setOwnerId} onClose={() => setFilterOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.neutral[50] },
  center: { alignItems: 'center', justifyContent: 'center', gap: 8 },
  content: { paddingBottom: 130, gap: 22 },
  section: { paddingHorizontal: 16 },
  tour: { paddingHorizontal: 12 },
  footer: { fontFamily: typography.fontBody, fontSize: 12, color: colors.neutral[500], textAlign: 'center', paddingHorizontal: 24 },
  errorTitle: { fontFamily: typography.fontDisplaySemiBold, fontSize: 20, color: INK, textAlign: 'center', marginTop: 6 },
  errorText: { fontFamily: typography.fontBody, fontSize: 13, color: colors.neutral[600], textAlign: 'center' },
  retry: { marginTop: 10, height: 46, paddingHorizontal: 22, borderRadius: radius.pill, backgroundColor: INK, justifyContent: 'center' },
  retryText: { fontFamily: typography.fontBodyBold, fontSize: 14, color: LIME },
});
