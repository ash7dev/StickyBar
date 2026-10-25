import React, { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { useNavigation } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../shared/api/api-client';
import { colors, typography } from '../../shared/theme/tokens';
import { PaixiLogo } from '../../shared/components/brand/PaixiLogo';
import type { ListingItem } from '../../shared/components/ui/TenantListingCard';
import { useAuthStore } from '../../features/auth/stores/auth.store';
import { useFavoritesList } from '../../features/favorites/useFavorites';
import { buildEscales, datesFor, homeMemory, nameCase, type Answers } from '../../features/home/lib/home';
import { homeMode, type MyReservation } from '../../features/home/lib/stays';
import { HomeWindow } from '../../features/home/components/HomeWindow';
import { HomeRegular } from '../../features/home/components/HomeRegular';
import { AfterStay, StayCountdown } from '../../features/home/components/StayHome';

type Override = { view: 'home' } | { view: 'window'; escale?: string } | { view: 'stay'; res: MyReservation } | null;

const unwrapList = (res: { data?: unknown }): ListingItem[] => {
  const d = res.data as { data?: unknown; items?: unknown } | unknown[];
  const list = Array.isArray(d) ? d : ((d as { data?: unknown })?.data ?? (d as { items?: unknown })?.items ?? []);
  return Array.isArray(list) ? (list as ListingItem[]) : [];
};

/**
 * Accueil voyageur. Un seul écran qui change selon la situation :
 * première ouverture (la fenêtre + « Vous partez quand ? »), retour (ses nouvelles et les sections),
 * séjour réservé (carte compte à rebours, puis plein écran à 3 jours), après le séjour (« Comment était… ? »).
 */
export default function HomeScreen() {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const [memory, setMemory] = useState<{ lastVisit: string | null; lastEscale: string | null; answers: Answers | null } | null>(null);
  const [override, setOverride] = useState<Override>(null);

  // Mémoire de la visite précédente, puis on enregistre celle-ci (« Depuis samedi »)
  useEffect(() => {
    homeMemory.read().then((m) => {
      setMemory(m);
      homeMemory.markVisit();
    });
  }, []);

  const reservationsQ = useQuery<MyReservation[]>({
    queryKey: ['home', 'reservations', user?.id],
    queryFn: async () => {
      const res = await apiClient.get('/reservations/me');
      const d = res.data?.data ?? res.data;
      return Array.isArray(d) ? d : [];
    },
    enabled: !!token,
    staleTime: 60_000,
  });
  const catalogQ = useQuery<ListingItem[]>({
    queryKey: ['home', 'catalog'],
    queryFn: async () => unwrapList(await apiClient.get('/listings/search', { params: { limit: 50, sort: 'newest' } })),
    staleTime: 5 * 60_000,
  });
  const weekendDates = datesFor('weekend')!;
  const weekendQ = useQuery<ListingItem[]>({
    queryKey: ['home', 'weekend', weekendDates.start],
    queryFn: async () => unwrapList(await apiClient.get('/listings/search', { params: { dateDebut: weekendDates.start, dateFin: weekendDates.end, nbPersonnes: 2, limit: 12 } })),
    staleTime: 5 * 60_000,
  });
  const favoritesQ = useFavoritesList();

  const catalog = catalogQ.data ?? [];
  const favorites = favoritesQ.data ?? [];
  const escales = useMemo(() => buildEscales(catalog), [catalog]);
  const reservations = reservationsQ.data ?? [];
  const returning = !!memory?.lastVisit || favorites.length > 0 || !!memory?.answers;
  const mode = useMemo(() => homeMode(reservations, user?.id, returning), [reservations, user?.id, returning]);

  const refresh = useCallback(() => {
    reservationsQ.refetch();
    catalogQ.refetch();
    weekendQ.refetch();
    favoritesQ.refetch();
  }, [reservationsQ, catalogQ, weekendQ, favoritesQ]);

  // Écran de chargement plein écran : la barre d'onglets ne s'affiche qu'une fois l'accueil prêt
  const booting = !memory || (catalogQ.isLoading && !catalog.length);
  const navigation = useNavigation();
  useLayoutEffect(() => {
    navigation.setOptions({ tabBarStyle: booting ? { display: 'none' } : undefined });
  }, [booting, navigation]);

  if (booting) {
    return (
      <View style={styles.loading}>
        <PaixiLogo size={38} tone="inverse" />
        <ActivityIndicator color={colors.lime[400]} />
      </View>
    );
  }

  const regular = (upcoming?: MyReservation) => (
    <HomeRegular
      firstName={nameCase(user?.prenom)}
      avatarUrl={(user as { avatarUrl?: string | null } | null)?.avatarUrl}
      upcoming={upcoming}
      escales={escales}
      catalog={catalog}
      weekend={weekendQ.data ?? []}
      favorites={favorites}
      lastVisit={memory.lastVisit}
      answers={memory.answers}
      refreshing={catalogQ.isRefetching || reservationsQ.isRefetching}
      onRefresh={refresh}
      onOpenEscale={(key) => setOverride({ view: 'window', escale: key })}
      onOpenStay={() => upcoming && setOverride({ view: 'stay', res: upcoming })}
    />
  );

  // Choix explicites de l'utilisateur (bascule « Mon séjour | Accueil », escale touchée)
  if (override?.view === 'window' && escales.length) {
    return <HomeWindow escales={escales} initialKey={override.escale ?? memory.lastEscale} initialAnswers={memory.answers} onBack={() => setOverride({ view: 'home' })} />;
  }
  if (override?.view === 'stay') {
    return <StayCountdown res={override.res} inStay={override.res.statut === 'CHECKED_IN'} onHome={() => setOverride({ view: 'home' })} />;
  }
  if (override?.view === 'home') {
    return regular(mode.kind === 'stay' ? mode.res : mode.kind === 'regular' ? mode.upcoming : undefined);
  }

  switch (mode.kind) {
    case 'stay':
      return <StayCountdown res={mode.res} inStay={mode.inStay} onHome={() => setOverride({ view: 'home' })} />;
    case 'after':
      return (
        <AfterStay
          res={mode.res}
          onHome={() => setOverride({ view: 'home' })}
          onRated={() => {
            reservationsQ.refetch();
            setOverride({ view: 'home' });
          }}
        />
      );
    case 'regular':
      return regular(mode.upcoming);
    case 'first':
      return escales.length ? <HomeWindow escales={escales} initialKey={memory.lastEscale} initialAnswers={memory.answers} /> : regular();
  }
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 18, backgroundColor: colors.forest[950] },
  brand: { fontFamily: typography.fontDisplaySemiBold, fontSize: 40, letterSpacing: -1.2, color: colors.neutral[50] },
});
