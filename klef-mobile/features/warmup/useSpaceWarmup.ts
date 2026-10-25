import { useEffect } from 'react';
import { InteractionManager } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../auth/stores/auth.store';
import { favoritesListQuery } from '../favorites/useFavorites';
import { managedListingsQuery, managedOwnersQuery } from '../manager/hooks/useManagerToday';
import { fetchOwnerListings, fetchOwnerReservations, fetchTenantTrips, ownerListingsKey, ownerReservationsKey, tenantTripsKey } from './queries';

type Space = 'tenant' | 'owner' | 'manager';

/**
 * À l'entrée d'un espace, une fois le premier écran affiché, on prépare en fond
 * les onglets que l'on ouvre le plus souvent ensuite. Rien n'est rechargé s'il est encore frais.
 */
export function useSpaceWarmup(space: Space) {
  const qc = useQueryClient();
  const token = useAuthStore((s) => s.token);
  const userId = useAuthStore((s) => s.user?.id);

  useEffect(() => {
    if (!token) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const task = InteractionManager.runAfterInteractions(() => {
      timer = setTimeout(() => {
        const jobs =
          space === 'tenant'
            ? [
                qc.prefetchQuery({ queryKey: tenantTripsKey, queryFn: fetchTenantTrips, staleTime: 60_000 }),
                qc.prefetchQuery(favoritesListQuery(userId)),
              ]
            : space === 'owner'
              ? [
                  qc.prefetchQuery({ queryKey: ownerListingsKey, queryFn: fetchOwnerListings, staleTime: 5 * 60_000 }),
                  qc.prefetchQuery({ queryKey: ownerReservationsKey, queryFn: fetchOwnerReservations, staleTime: 5 * 60_000 }),
                ]
              : [qc.prefetchQuery(managedOwnersQuery), qc.prefetchQuery(managedListingsQuery)];
        Promise.allSettled(jobs);
      }, 1200);
    });
    return () => {
      task.cancel();
      if (timer) clearTimeout(timer);
    };
  }, [space, token, userId, qc]);
}
