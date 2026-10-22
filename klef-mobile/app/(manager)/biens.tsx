import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { Building2, Plus, Search, SlidersHorizontal, X } from 'lucide-react-native';
import { colors, radius, typography } from '../../shared/theme/tokens';
import { apiClient } from '../../shared/api/api-client';
import { useAuthStore } from '../../features/auth/stores/auth.store';
import {
  managerKeys,
  useManagedListings,
  useManagedOwners,
  useManagerOverview,
  useManagerReservations,
  type ManagedListing,
} from '../../features/manager/hooks/useManagerToday';
import { listingDay, type ListingDay, type TonightState } from '../../features/manager/lib/park';
import { fmt, ownerNameOf, todayKey } from '../../features/manager/lib/today';
import { ParkListingCard } from '../../features/manager/components/park/ParkListingCard';
import { ListingActionsSheet } from '../../features/manager/components/park/ListingActionsSheet';
import { OwnerFilterSheet, type OwnerOption } from '../../features/manager/components/today/OwnerFilterSheet';
import { INK, LIME, LINE, MUTED } from '../../features/manager/components/today/ui';

type Filter = 'ALL' | 'FREE' | 'BUSY' | 'OFFLINE' | 'FIX';
const tap = () => Haptics.selectionAsync().catch(() => {});

const FILTERS: Array<{ id: Filter; label: string; test: (l: ManagedListing, d: ListingDay) => boolean }> = [
  { id: 'ALL', label: 'Tous', test: () => true },
  { id: 'FREE', label: 'Libres ce soir', test: (_l, d) => d.state === 'FREE' || d.state === 'DEPARTURE' },
  { id: 'BUSY', label: 'Occupés', test: (_l, d) => d.state === 'OCCUPIED' || d.state === 'ARRIVAL' },
  { id: 'OFFLINE', label: 'En pause', test: (l) => l.statut === 'PAUSED' },
  { id: 'FIX', label: 'À corriger', test: (l) => l.statut === 'REJECTED' || l.statut === 'DRAFT' },
];

/** Le parc, regroupé par propriétaire : l'état de chaque bien ce soir et les gestes du quotidien. */
export default function ManagerListingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);

  const [filter, setFilter] = useState<Filter>('ALL');
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [sheetId, setSheetId] = useState<string | null>(null);
  const [pending, setPending] = useState<'promo' | 'pause' | null>(null);

  const listingsQ = useManagedListings();
  const reservationsQ = useManagerReservations();
  const overview = useManagerOverview();
  const ownersQ = useManagedOwners();
  const today = todayKey();

  const allListings = useMemo(
    () => (listingsQ.data ?? []).filter((l) => !user?.id || !l.gestionnaireId || l.gestionnaireId === user.id),
    [listingsQ.data, user?.id],
  );
  const reservations = reservationsQ.data ?? [];
  const days = useMemo(() => new Map(allListings.map((l) => [l.id, listingDay(l, reservations, today)])), [allListings, reservations, today]);
  const occupancy = useMemo(() => new Map((overview.data?.logements ?? []).map((l) => [l.id, l.occupancy.rate])), [overview.data]);
  const soldes = useMemo(() => new Map((ownersQ.data ?? []).map((o) => [o.id, Number(o.soldeDisponible ?? 0)])), [ownersQ.data]);

  const owners: OwnerOption[] = useMemo(() => {
    const m = new Map<string, OwnerOption>();
    for (const l of allListings) {
      const o = m.get(l.proprietaireId) ?? { id: l.proprietaireId, name: ownerNameOf(l), listings: 0 };
      o.listings += 1;
      m.set(l.proprietaireId, o);
    }
    return [...m.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [allListings]);

  const scoped = useMemo(() => (ownerId ? allListings.filter((l) => l.proprietaireId === ownerId) : allListings), [allListings, ownerId]);
  const q = query.trim().toLowerCase();
  const visible = useMemo(() => {
    const f = FILTERS.find((x) => x.id === filter)!;
    return scoped.filter((l) => {
      const d = days.get(l.id)!;
      if (!f.test(l, d)) return false;
      if (!q) return true;
      return [l.titre, l.quartier, l.ville, ownerNameOf(l)].filter(Boolean).join(' ').toLowerCase().includes(q);
    });
  }, [scoped, filter, days, q]);

  const groups = useMemo(() => {
    const m = new Map<string, ManagedListing[]>();
    for (const l of visible) m.set(l.proprietaireId, [...(m.get(l.proprietaireId) ?? []), l]);
    return [...m.entries()].sort((a, b) => ownerNameOf(a[1][0]).localeCompare(ownerNameOf(b[1][0])));
  }, [visible]);

  // ── Ce soir ──
  const tonight = useMemo(() => {
    const c: Record<TonightState, number> = { ARRIVAL: 0, OCCUPIED: 0, DEPARTURE: 0, FREE: 0, OFFLINE: 0 };
    for (const l of scoped) c[days.get(l.id)!.state] += 1;
    return c;
  }, [scoped, days]);
  const occupiedTonight = tonight.ARRIVAL + tonight.OCCUPIED;
  const freeTonight = tonight.FREE + tonight.DEPARTURE;
  const strip: TonightState[] = useMemo(() => {
    const order: TonightState[] = ['ARRIVAL', 'OCCUPIED', 'DEPARTURE', 'FREE', 'OFFLINE'];
    return order.flatMap((s) => Array.from({ length: tonight[s] }, () => s));
  }, [tonight]);

  const counts = useMemo(() => {
    const c = new Map<Filter, number>();
    for (const f of FILTERS) c.set(f.id, scoped.filter((l) => f.test(l, days.get(l.id)!)).length);
    return c;
  }, [scoped, days]);

  // ── Actions ──
  const sheetListing = sheetId ? allListings.find((l) => l.id === sheetId) ?? null : null;
  const refreshListings = () => qc.invalidateQueries({ queryKey: managerKeys.listings });

  const toggleLastMinute = async (l: ManagedListing) => {
    setPending('promo');
    try {
      await apiClient.patch(`/listings/${l.id}`, { derniereMinuteActive: !l.derniereMinuteActive });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      await refreshListings();
    } catch (err: any) {
      Alert.alert('Erreur', err?.response?.data?.message ?? 'Impossible de modifier la dernière minute.');
    } finally {
      setPending(null);
    }
  };

  const togglePause = (l: ManagedListing) => {
    const paused = l.statut === 'PAUSED';
    const run = async () => {
      setPending('pause');
      try {
        await apiClient.patch(`/listings/${l.id}/${paused ? 'republier' : 'pause'}`);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        await refreshListings();
        setSheetId(null);
      } catch (err: any) {
        Alert.alert('Erreur', err?.response?.data?.message ?? 'Impossible de changer le statut de l’annonce.');
      } finally {
        setPending(null);
      }
    };
    if (paused) run();
    else
      Alert.alert('Mettre en pause ?', `${l.titre} ne sera plus réservable. Les séjours déjà confirmés sont maintenus.`, [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Mettre en pause', style: 'destructive', onPress: run },
      ]);
  };

  const openPlanning = (l: ManagedListing) => {
    setSheetId(null);
    router.push({ pathname: '/(manager)/calendrier' as never, params: { logementId: l.id } });
  };

  const addListing = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    router.push('/(manager)/nouveau-bien' as never);
  };

  const refreshing = listingsQ.isRefetching || reservationsQ.isRefetching;
  const ownerName = ownerId ? owners.find((o) => o.id === ownerId)?.name ?? null : null;

  if (listingsQ.isLoading && !listingsQ.data) {
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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => qc.invalidateQueries({ queryKey: managerKeys.all })} tintColor={colors.forest[600]} />}
      >
        {/* En-tête */}
        <View style={styles.head}>
          <View style={styles.flex}>
            <Text style={styles.kicker}>ESPACE GESTIONNAIRE</Text>
            <Text style={styles.title}>Biens</Text>
          </View>
          {allListings.length > 0 && (
            <>
              <TouchableOpacity
                onPress={() => {
                  tap();
                  setSearching((v) => !v);
                  if (searching) setQuery('');
                }}
                style={styles.iconBtn}
                accessibilityLabel="Rechercher un bien"
              >
                {searching ? <X size={18} color={INK} /> : <Search size={18} color={INK} />}
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setFilterOpen(true)}
                style={[styles.iconBtn, ownerName && styles.iconBtnOn]}
                accessibilityLabel="Filtrer par propriétaire"
              >
                <SlidersHorizontal size={18} color={ownerName ? LIME : INK} />
              </TouchableOpacity>
            </>
          )}
          <TouchableOpacity onPress={addListing} style={styles.addBtn} accessibilityRole="button" accessibilityLabel="Ajouter un bien">
            <Plus size={20} color={INK} strokeWidth={2.6} />
          </TouchableOpacity>
        </View>

        {searching && (
          <View style={styles.search}>
            <Search size={17} color={MUTED} />
            <TextInput
              autoFocus
              value={query}
              onChangeText={setQuery}
              placeholder="Bien, quartier, propriétaire…"
              placeholderTextColor={colors.neutral[400]}
              style={styles.searchInput}
            />
          </View>
        )}

        {allListings.length === 0 ? (
          <View style={styles.hero}>
            <View style={[styles.ring, styles.ringOuter]} />
            <View style={styles.heroIcon}>
              <Building2 size={24} color={INK} />
            </View>
            <Text style={styles.heroTitle}>
              Votre premier bien{'\n'}
              <Text style={styles.accent}>en quelques minutes.</Text>
            </Text>
            <Text style={styles.heroText}>Choisissez le propriétaire, décrivez le logement, ajoutez les photos : l’annonce est vérifiée par Paixi puis publiée à son nom.</Text>
            <TouchableOpacity onPress={addListing} style={styles.heroCta} accessibilityRole="button">
              <Plus size={16} color={INK} strokeWidth={2.6} />
              <Text style={styles.heroCtaText}>Ajouter un bien</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Ce soir */}
            <View style={styles.tonight}>
              <View style={[styles.ring, styles.ringOuter]} />
              <Text style={styles.tonightKicker}>
                CE SOIR · {ownerName ? ownerName.toUpperCase() : `${scoped.length} BIEN${scoped.length > 1 ? 'S' : ''}`}
              </Text>
              <Text style={styles.tonightTitle}>
                {occupiedTonight} occupé{occupiedTonight > 1 ? 's' : ''} · <Text style={styles.accent}>{freeTonight} libre{freeTonight > 1 ? 's' : ''}</Text>
              </Text>
              <View style={styles.strip}>
                {strip.map((s, i) => (
                  <View key={i} style={[styles.stripCell, { backgroundColor: STRIP[s] }]} />
                ))}
              </View>
              <View style={styles.legend}>
                {(
                  [
                    ['ARRIVAL', 'arrivée'],
                    ['OCCUPIED', 'occupé'],
                    ['FREE', 'libre'],
                    ['OFFLINE', 'hors ligne'],
                  ] as const
                )
                  .filter(([s]) => tonight[s] > 0 || (s === 'FREE' && tonight.DEPARTURE > 0))
                  .map(([s, t]) => {
                    const n = s === 'FREE' ? tonight.FREE + tonight.DEPARTURE : tonight[s];
                    return (
                      <View key={s} style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: STRIP[s] }]} />
                        <Text style={styles.legendText}>
                          {n} {t}
                          {n > 1 && t !== 'hors ligne' ? 's' : ''}
                        </Text>
                      </View>
                    );
                  })}
              </View>
            </View>

            {/* Filtres */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
              {FILTERS.filter((f) => f.id === 'ALL' || f.id === filter || (counts.get(f.id) ?? 0) > 0).map((f) => {
                const on = filter === f.id;
                return (
                  <TouchableOpacity
                    key={f.id}
                    onPress={() => {
                      tap();
                      setFilter(f.id);
                    }}
                    style={[styles.chip, on && styles.chipOn]}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: on }}
                  >
                    <Text style={[styles.chipText, on && { color: LIME }]}>{f.label}</Text>
                    <Text style={[styles.chipCount, on && styles.chipCountOn]}>{counts.get(f.id) ?? 0}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Biens par propriétaire */}
            {groups.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyTitle}>{q ? 'Aucun bien trouvé' : 'Rien dans ce filtre'}</Text>
                <Text style={styles.emptyText}>{q ? `Aucun bien ne correspond à « ${query} ».` : 'Aucun bien n’est dans cet état ce soir.'}</Text>
                <TouchableOpacity
                  onPress={() => {
                    setFilter('ALL');
                    setQuery('');
                  }}
                  style={styles.resetBtn}
                  accessibilityRole="button"
                >
                  <Text style={styles.resetText}>Voir tous les biens</Text>
                </TouchableOpacity>
              </View>
            ) : (
              groups.map(([oid, items]) => {
                const name = ownerNameOf(items[0]);
                const solde = soldes.get(oid);
                const total = allListings.filter((l) => l.proprietaireId === oid).length;
                return (
                  <View key={oid} style={styles.group}>
                    <View style={styles.ownerHead}>
                      <View style={styles.ownerAvatar}>
                        <Text style={styles.ownerAvatarText}>
                          {name
                            .split(' ')
                            .map((w) => w[0])
                            .join('')
                            .slice(0, 2)
                            .toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.flex}>
                        <Text style={styles.ownerName}>{name}</Text>
                        <Text style={styles.ownerMeta}>
                          {total} bien{total > 1 ? 's' : ''}
                          {solde !== undefined ? ` · solde ${fmt(solde)} FCFA` : ''}
                        </Text>
                      </View>
                    </View>
                    {items.map((l) => (
                      <ParkListingCard
                        key={l.id}
                        listing={l}
                        day={days.get(l.id)!}
                        occupancy={occupancy.get(l.id) ?? null}
                        onMore={() => setSheetId(l.id)}
                        onBlock={() => openPlanning(l)}
                        onLastMinute={() => toggleLastMinute(l)}
                        onPlanning={() => openPlanning(l)}
                      />
                    ))}
                  </View>
                );
              })
            )}

            <TouchableOpacity onPress={addListing} activeOpacity={0.85} style={styles.addCard} accessibilityRole="button">
              <View style={styles.addCardIcon}>
                <Plus size={18} color={LIME} strokeWidth={2.6} />
              </View>
              <View style={styles.flex}>
                <Text style={styles.addCardTitle}>Ajouter un bien</Text>
                <Text style={styles.addCardText}>Pour un propriétaire existant ou un nouveau</Text>
              </View>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      {sheetListing && (
        <ListingActionsSheet
          listing={sheetListing}
          day={days.get(sheetListing.id) ?? null}
          occupancy={occupancy.get(sheetListing.id) ?? null}
          pending={pending}
          onClose={() => setSheetId(null)}
          onBlock={() => openPlanning(sheetListing)}
          onPlanning={() => openPlanning(sheetListing)}
          onLastMinute={() => toggleLastMinute(sheetListing)}
          onPublic={() => {
            setSheetId(null);
            router.push(`/listing/${sheetListing.id}` as never);
          }}
          onTogglePause={() => togglePause(sheetListing)}
          onEdit={() => {
            setSheetId(null);
            router.push({ pathname: '/(manager)/add-listing' as never, params: { id: sheetListing.id } });
          }}
        />
      )}
      <OwnerFilterSheet visible={filterOpen} owners={owners} selected={ownerId} onSelect={setOwnerId} onClose={() => setFilterOpen(false)} />
    </View>
  );
}

const STRIP: Record<TonightState, string> = {
  ARRIVAL: LIME,
  OCCUPIED: '#2E5A47',
  DEPARTURE: 'rgba(248,251,244,0.3)',
  FREE: 'rgba(248,251,244,0.3)',
  OFFLINE: 'rgba(248,251,244,0.1)',
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.neutral[50] },
  center: { alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1, minWidth: 0 },
  content: { paddingBottom: 130, gap: 16 },
  head: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingHorizontal: 20 },
  kicker: { fontFamily: typography.fontBodyBold, fontSize: 11, letterSpacing: 1.3, color: colors.forest[600] },
  title: { fontFamily: typography.fontDisplaySemiBold, fontSize: 32, letterSpacing: -1, color: INK, marginTop: 2 },
  iconBtn: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: LINE, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  iconBtnOn: { backgroundColor: INK, borderColor: INK },
  addBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: LIME, alignItems: 'center', justifyContent: 'center' },
  search: { flexDirection: 'row', alignItems: 'center', gap: 10, height: 48, marginHorizontal: 16, paddingHorizontal: 16, borderRadius: 24, borderWidth: 1, borderColor: LINE, backgroundColor: '#FFFFFF' },
  searchInput: { flex: 1, fontFamily: typography.fontBodyMedium, fontSize: 14.5, color: INK, paddingVertical: 0 },

  ring: { position: 'absolute', borderWidth: 1, borderColor: 'rgba(211,242,110,0.12)' },
  ringOuter: { width: 220, height: 220, borderRadius: 110, top: -110, right: -70 },
  accent: { fontStyle: 'italic', color: LIME },
  tonight: { marginHorizontal: 16, padding: 16, borderRadius: 26, overflow: 'hidden', backgroundColor: INK, gap: 10 },
  tonightKicker: { fontFamily: typography.fontBodyBold, fontSize: 10.5, letterSpacing: 1.2, color: LIME },
  tonightTitle: { fontFamily: typography.fontDisplaySemiBold, fontSize: 26, letterSpacing: -0.6, color: '#FFFFFF', marginTop: -4 },
  strip: { flexDirection: 'row', gap: 4 },
  stripCell: { flex: 1, height: 26, borderRadius: 7 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 2 },
  legendText: { fontFamily: typography.fontBody, fontSize: 11, color: colors.forest[200] },

  chips: { gap: 8, paddingHorizontal: 16 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 36, paddingHorizontal: 13, borderRadius: 18, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: LINE },
  chipOn: { backgroundColor: INK, borderColor: INK },
  chipText: { fontFamily: typography.fontBodyBold, fontSize: 12.5, color: INK },
  chipCount: {
    fontFamily: typography.fontBodyBold,
    fontSize: 10.5,
    color: INK,
    paddingHorizontal: 7,
    paddingVertical: 1,
    borderRadius: 9,
    backgroundColor: '#EEF2EA',
    overflow: 'hidden',
  },
  chipCountOn: { backgroundColor: 'rgba(211,242,110,0.2)', color: LIME },

  group: { paddingHorizontal: 16, gap: 12 },
  ownerHead: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 4, marginTop: 4 },
  ownerAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: INK, alignItems: 'center', justifyContent: 'center' },
  ownerAvatarText: { fontFamily: typography.fontBodyBold, fontSize: 12, color: LIME },
  ownerName: { fontFamily: typography.fontBodyBold, fontSize: 15, color: INK },
  ownerMeta: { fontFamily: typography.fontBody, fontSize: 11.5, color: MUTED, marginTop: 1 },

  addCard: { flexDirection: 'row', alignItems: 'center', gap: 12, marginHorizontal: 16, padding: 14, borderRadius: 22, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.neutral[300] },
  addCardIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: INK, alignItems: 'center', justifyContent: 'center' },
  addCardTitle: { fontFamily: typography.fontBodyBold, fontSize: 14, color: INK },
  addCardText: { fontFamily: typography.fontBody, fontSize: 12, color: MUTED, marginTop: 1 },

  hero: { marginHorizontal: 16, gap: 12, padding: 22, borderRadius: 30, overflow: 'hidden', backgroundColor: INK },
  heroIcon: { width: 52, height: 52, borderRadius: 26, backgroundColor: LIME, alignItems: 'center', justifyContent: 'center' },
  heroTitle: { fontFamily: typography.fontDisplaySemiBold, fontSize: 28, lineHeight: 32, letterSpacing: -0.7, color: '#FFFFFF' },
  heroText: { fontFamily: typography.fontBody, fontSize: 13.5, lineHeight: 20, color: colors.forest[200] },
  heroCta: { flexDirection: 'row', gap: 8, height: 52, borderRadius: radius.pill, backgroundColor: LIME, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  heroCtaText: { fontFamily: typography.fontBodyBold, fontSize: 15, color: INK },

  empty: { marginHorizontal: 16, alignItems: 'center', gap: 6, padding: 24, borderRadius: 24, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: LINE },
  emptyTitle: { fontFamily: typography.fontDisplaySemiBold, fontSize: 18, color: INK },
  emptyText: { fontFamily: typography.fontBody, fontSize: 13, color: colors.neutral[600], textAlign: 'center' },
  resetBtn: { marginTop: 8, height: 42, paddingHorizontal: 18, borderRadius: radius.pill, backgroundColor: INK, justifyContent: 'center' },
  resetText: { fontFamily: typography.fontBodyBold, fontSize: 13, color: LIME },
});
