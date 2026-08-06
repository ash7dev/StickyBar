'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { walletApi } from '@/lib/nestjs';
import type { WithdrawalPayload } from '@/lib/nestjs';
import { WALLET_QUERY_KEY } from './use-wallet';
import { translateApiError } from '@/lib/errors/translate';

export function useWithdrawal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: WithdrawalPayload) => walletApi.withdraw(payload),
    onSuccess: () => {
      toast.success('Demande de retrait transmise avec succès.', {
        description: 'Votre virement sera traité sous 24 à 48 heures ouvrées.',
      });
      queryClient.invalidateQueries({ queryKey: WALLET_QUERY_KEY });
    },
    onError: (err: unknown) => {
      const translated = translateApiError(err);
      toast.error(translated.title, {
        description: translated.message,
      });
    },
  });
}
