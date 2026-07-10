'use client';

import { useQuery } from '@tanstack/react-query';
import { walletApi } from '@/lib/nestjs';

export const WALLET_QUERY_KEY = ['wallet', 'me'] as const;

export function useWallet() {
  return useQuery({
    queryKey: WALLET_QUERY_KEY,
    queryFn: () => walletApi.getMe(),
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: true,
  });
}
