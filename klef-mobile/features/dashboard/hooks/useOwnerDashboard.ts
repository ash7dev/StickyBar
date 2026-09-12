import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../shared/api/api-client';

export interface OwnerStatsData {
  listings: {
    active: number;
    total: number;
    draft: number;
    paused: number;
  };
  bookings: {
    total: number;
    revenue: number;
    averageRating: number;
    conversionRate: number;
  };
  wallet: {
    balance: number;
    pending: number;
    processing: number;
  };
  monthlyRevenue?: Array<{
    month: string;
    revenue: number;
    bookingsCount: number;
  }>;
}

export interface OwnerPendingActionsData {
  pendingConfirmations: number;
  activeDisputes: number;
}

export interface OwnerDashboardFullData {
  stats: OwnerStatsData;
  pending: OwnerPendingActionsData;
}

const EMPTY_STATS: OwnerStatsData = {
  listings: { active: 0, total: 0, draft: 0, paused: 0 },
  bookings: { total: 0, revenue: 0, averageRating: 0, conversionRate: 0 },
  wallet: { balance: 0, pending: 0, processing: 0 },
};

const EMPTY_PENDING: OwnerPendingActionsData = {
  pendingConfirmations: 0,
  activeDisputes: 0,
};

export function useOwnerDashboard() {
  const { data, isLoading, isRefetching, refetch, error } = useQuery({
    queryKey: ['owner', 'dashboard-full'],
    queryFn: async (): Promise<OwnerDashboardFullData> => {
      try {
        const [statsRes, pendingRes] = await Promise.all([
          apiClient.get('/dashboard/owner/stats').catch(() => null),
          apiClient.get('/dashboard/owner/pending-actions').catch(() => null),
        ]);

        const statsRaw = statsRes?.data?.data || statsRes?.data || {};
        const pendingRaw = pendingRes?.data?.data || pendingRes?.data || {};

        const stats: OwnerStatsData = {
          listings: {
            active: Number(statsRaw.listings?.active ?? 0),
            total: Number(statsRaw.listings?.total ?? 0),
            draft: Number(statsRaw.listings?.draft ?? 0),
            paused: Number(statsRaw.listings?.paused ?? 0),
          },
          bookings: {
            total: Number(statsRaw.bookings?.total ?? 0),
            revenue: Number(statsRaw.bookings?.revenue ?? 0),
            averageRating: Number(statsRaw.bookings?.averageRating ?? 0),
            conversionRate: Number(statsRaw.bookings?.conversionRate ?? 0),
          },
          wallet: {
            balance: Number(statsRaw.wallet?.balance ?? 0),
            pending: Number(statsRaw.wallet?.pending ?? 0),
            processing: Number(statsRaw.wallet?.processing ?? 0),
          },
          monthlyRevenue: statsRaw.monthlyRevenue || [],
        };

        const pending: OwnerPendingActionsData = {
          pendingConfirmations: Number(pendingRaw.pendingConfirmations ?? 0),
          activeDisputes: Number(pendingRaw.activeDisputes ?? 0),
        };

        return { stats, pending };
      } catch (err) {
        console.warn('[useOwnerDashboard] Erreur de récupération API :', err);
        return { stats: EMPTY_STATS, pending: EMPTY_PENDING };
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    stats: data?.stats || EMPTY_STATS,
    pending: data?.pending || EMPTY_PENDING,
    isLoading,
    isRefetching,
    refetch,
    error,
  };
}
