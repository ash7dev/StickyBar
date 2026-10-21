import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { apiClient } from '../../../shared/api/api-client';
import type { OwnerOverviewResponse } from '../types';

export function useOwnerOverview() {
  return useQuery({
    queryKey: ['dashboard', 'owner', 'overview'],
    queryFn: async () => {
      const { data } = await apiClient.get<OwnerOverviewResponse>('/dashboard/owner/overview');
      return data;
    },
    staleTime: 60_000,
  });
}

/** Libellé de l'heure d'arrivée appliquée par le serveur quand aucune n'est envoyée. */
export const DEFAULT_CHECKIN_LABEL = '14 h';

/**
 * Accepter une demande sans saisir d'horaires : le serveur applique ses valeurs
 * par défaut (arrivée 14 h, départ 12 h), modifiables ensuite dans la réservation.
 */
export function useAcceptReservation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (reservationId: string) => {
      const { data } = await apiClient.patch(`/reservations/${reservationId}/confirm`, {});
      return data;
    },
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      return Promise.all([
        qc.invalidateQueries({ queryKey: ['dashboard'] }),
        qc.invalidateQueries({ queryKey: ['reservations'] }),
        qc.invalidateQueries({ queryKey: ['owner'] }),
      ]);
    },
    onError: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    },
  });
}
