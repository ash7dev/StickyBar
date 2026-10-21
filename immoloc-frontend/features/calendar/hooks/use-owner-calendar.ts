'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { dashboardApi } from '@/lib/nestjs';
import type { CreateOwnerBlockPayload } from '@/lib/nestjs';

export const ownerCalendarKeys = {
  all: ['dashboard', 'owner', 'calendar'] as const,
  range: (from: string, to: string) => [...ownerCalendarKeys.all, from, to] as const,
};

export function useOwnerCalendar(from: string, to: string) {
  return useQuery({
    queryKey: ownerCalendarKeys.range(from, to),
    queryFn: () => dashboardApi.getOwnerCalendar({ from, to }),
    staleTime: 30_000,
    // Garde la période précédente affichée pendant la navigation (pas de clignotement)
    placeholderData: keepPreviousData,
  });
}

/**
 * Les blocages modifient aussi la page de chaque annonce (['calendrier', id]) et le
 * tableau de bord (['dashboard', ...], qui inclut ce calendrier).
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
    mutationFn: (payload: CreateOwnerBlockPayload) => dashboardApi.createCalendarBlocks(payload),
    onSuccess: (blocks) => {
      toast.success(
        blocks.length > 1 ? `Dates bloquées sur ${blocks.length} logements` : 'Dates bloquées',
      );
      return invalidate();
    },
  });
}

export function useDeleteCalendarBlock() {
  const invalidate = useInvalidateAvailability();
  return useMutation({
    mutationFn: (blockId: string) => dashboardApi.deleteCalendarBlock(blockId),
    onSuccess: () => {
      toast.success('Dates débloquées');
      return invalidate();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Impossible de débloquer ces dates');
    },
  });
}
