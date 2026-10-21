import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { apiClient } from '../../../shared/api/api-client';
import type { CreateOwnerBlockPayload, OwnerCalendarBlockEvent, OwnerCalendarResponse } from '../types';

export const ownerCalendarKeys = {
  all: ['dashboard', 'owner', 'calendar'] as const,
  range: (from: string, to: string) => [...ownerCalendarKeys.all, from, to] as const,
};

/** Message lisible depuis une erreur axios / NestJS (message string ou tableau). */
export function apiErrorMessage(error: unknown, fallback: string): string {
  const message = (error as { response?: { data?: { message?: unknown } } })?.response?.data?.message;
  if (Array.isArray(message)) return message.join(' · ');
  if (typeof message === 'string' && message) return message;
  return fallback;
}

/** Réservations + blocages de tous les logements sur [from, to) — 93 jours max. */
export function useOwnerCalendar(from: string, to: string) {
  return useQuery({
    queryKey: ownerCalendarKeys.range(from, to),
    queryFn: async () => {
      const { data } = await apiClient.get<OwnerCalendarResponse>('/dashboard/owner/calendar', {
        params: { from, to },
      });
      return data;
    },
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });
}

/**
 * Un blocage change aussi la fiche du logement (['calendrier', id]) et les écrans
 * du tableau de bord : on invalide tout ce qui affiche des disponibilités.
 */
function useInvalidateAvailability() {
  const qc = useQueryClient();
  return () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: ['dashboard'] }),
      qc.invalidateQueries({ queryKey: ['calendrier'] }),
    ]);
}

export function useCreateCalendarBlocks() {
  const invalidate = useInvalidateAvailability();
  return useMutation({
    mutationFn: async (payload: CreateOwnerBlockPayload) => {
      const { data } = await apiClient.post<OwnerCalendarBlockEvent[]>(
        '/dashboard/owner/calendar/blocks',
        payload,
      );
      return data;
    },
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      return invalidate();
    },
    onError: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    },
  });
}

export function useDeleteCalendarBlock() {
  const invalidate = useInvalidateAvailability();
  return useMutation({
    mutationFn: async (blockId: string) => {
      const { data } = await apiClient.delete<{ id: string }>(
        `/dashboard/owner/calendar/blocks/${blockId}`,
      );
      return data;
    },
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      return invalidate();
    },
    onError: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    },
  });
}
