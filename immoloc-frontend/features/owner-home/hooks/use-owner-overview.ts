'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { dashboardApi, nestFetch, NEST_API } from '@/lib/nestjs';

export function useOwnerOverview() {
  return useQuery({
    queryKey: ['dashboard', 'owner', 'overview'],
    queryFn: () => dashboardApi.getOwnerOverview(),
    staleTime: 60_000,
  });
}

/**
 * Accepter une demande sans saisir d'horaires : le serveur applique ses valeurs
 * par défaut (arrivée 14 h, départ 12 h), modifiables ensuite dans la réservation.
 */
export const DEFAULT_CHECKIN_LABEL = '14 h';

export function useAcceptReservation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (reservationId: string) =>
      nestFetch(NEST_API.RESERVATIONS.CONFIRM(reservationId), {
        method: 'PATCH',
        preferredRole: 'PROPRIETAIRE',
        body: JSON.stringify({}),
      }),
    onSuccess: () => {
      toast.success('Réservation acceptée. Le voyageur est prévenu.');
      return Promise.all([
        qc.invalidateQueries({ queryKey: ['dashboard'] }),
        qc.invalidateQueries({ queryKey: ['reservations'] }),
      ]);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Impossible d’accepter cette demande.');
    },
  });
}
