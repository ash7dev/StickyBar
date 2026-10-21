'use client';

import { keepPreviousData, useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/lib/nestjs';
import type { RevenuePeriod, TransactionType } from '@/lib/nestjs';

export const revenueKeys = {
  all: ['dashboard', 'owner', 'revenue'] as const,
  period: (period: RevenuePeriod) => [...revenueKeys.all, 'period', period] as const,
  statement: (month: string) => [...revenueKeys.all, 'statement', month] as const,
  transactions: (type: TransactionType | null) => [...revenueKeys.all, 'transactions', type ?? 'all'] as const,
};

export function useOwnerRevenue(period: RevenuePeriod) {
  return useQuery({
    queryKey: revenueKeys.period(period),
    queryFn: () => dashboardApi.getOwnerRevenue(period),
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  });
}

export function useOwnerStatement(month: string | null) {
  return useQuery({
    queryKey: revenueKeys.statement(month ?? ''),
    queryFn: () => dashboardApi.getOwnerStatement(month!),
    enabled: Boolean(month),
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  });
}

export function useOwnerTransactions(type: TransactionType | null) {
  return useInfiniteQuery({
    queryKey: revenueKeys.transactions(type),
    queryFn: ({ pageParam }) => dashboardApi.getOwnerTransactions({ cursor: pageParam, type }),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
    staleTime: 60_000,
  });
}
