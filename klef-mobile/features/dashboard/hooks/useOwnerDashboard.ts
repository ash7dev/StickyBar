import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
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

const DASHBOARD_CACHE_KEY = 'klef_dashboard_cache_v1';

export function useOwnerDashboard() {
  const [cachedData, setCachedData] = useState<OwnerDashboardFullData | null>(null);
  const [isCacheLoaded, setIsCacheLoaded] = useState(false);

  // ── 1. Instant Local Storage Hydration (0ms load on cold start) ───
  useEffect(() => {
    AsyncStorage.getItem(DASHBOARD_CACHE_KEY)
      .then((raw) => {
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            if (parsed && parsed.stats) {
              setCachedData(parsed);
            }
          } catch (e) {
            console.warn('[useOwnerDashboard] Error parsing cache JSON:', e);
          }
        }
      })
      .catch((err) => console.warn('[useOwnerDashboard] Cache read error:', err))
      .finally(() => setIsCacheLoaded(true));
  }, []);

  // ── 2. Background Revalidation Query with SWR ────────────────────
  const { data, isLoading, isFetching, isRefetching, refetch, error } = useQuery({
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
            draft: Number(statsRaw.listings?.drafts ?? statsRaw.listings?.draft ?? 0),
            paused: Number(statsRaw.listings?.pending ?? statsRaw.listings?.paused ?? 0),
          },
          bookings: {
            total: Number(statsRaw.bookings?.total ?? 0),
            revenue: Number(statsRaw.bookings?.revenue ?? 0),
            averageRating: Number(statsRaw.bookings?.averageRating ?? statsRaw.reputation?.rating ?? 0),
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

        const result: OwnerDashboardFullData = { stats, pending };

        // Save to disk cache for zero-latency initial rendering next boot
        AsyncStorage.setItem(DASHBOARD_CACHE_KEY, JSON.stringify(result)).catch(() => { });

        return result;
      } catch (err) {
        console.warn('[useOwnerDashboard] API fetch error:', err);
        return cachedData || { stats: EMPTY_STATS, pending: EMPTY_PENDING };
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes fresh
    gcTime: 24 * 60 * 60 * 1000, // Keep in memory for 24 hours
    initialData: cachedData || undefined,
  });

  const effectiveData = data || cachedData;
  const showSkeleton = (isLoading || isFetching || !isCacheLoaded) && !effectiveData;

  return {
    stats: effectiveData?.stats || EMPTY_STATS,
    pending: effectiveData?.pending || EMPTY_PENDING,
    isLoading: showSkeleton,
    isRefetching,
    refetch,
    error,
  };
}

