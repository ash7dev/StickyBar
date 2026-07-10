'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { walletApi } from '@/lib/nestjs';
import type { WithdrawalPayload } from '@/lib/nestjs';
import { WALLET_QUERY_KEY } from './use-wallet';

export function useWithdrawal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: WithdrawalPayload) => walletApi.withdraw(payload),
    onSuccess: () => {
      toast.success('Demande de retrait envoyée. Traitement sous 24-48h.');
      queryClient.invalidateQueries({ queryKey: WALLET_QUERY_KEY });
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Erreur lors de la demande de retrait');
    },
  });
}
