import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../shared/api/api-client';

export type TimeframeFilter = 'Ce mois' | '30 jours' | '6 mois' | 'Cette année';

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
    averageDailyRate?: number;
    totalNights?: number;
    cancellationRate?: number;
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
  topListings?: Array<{
    id: string;
    titre: string;
    ville?: string;
    revenue: number;
    nights: number;
  }>;
}

export interface OwnerPendingActionsData {
  pendingConfirmations: number;
  activeDisputes: number;
}

export interface ActivityItem {
  id: string;
  type: 'BOOKING' | 'PAYOUT' | 'REVIEW' | 'DISPUTE' | string;
  title: string;
  subtitle: string;
  date: string;
  amount?: number;
  status?: string;
}

export interface OwnerStatsFullData {
  stats: OwnerStatsData;
  pending: OwnerPendingActionsData;
  recentActivity: ActivityItem[];
  allReservations: any[];
  filteredReservations: any[];
}

const EMPTY_STATS: OwnerStatsData = {
  listings: { active: 0, total: 0, draft: 0, paused: 0 },
  bookings: { total: 0, revenue: 0, averageRating: 0, conversionRate: 0 },
  wallet: { balance: 0, pending: 0, processing: 0 },
  monthlyRevenue: [],
};

const EMPTY_PENDING: OwnerPendingActionsData = {
  pendingConfirmations: 0,
  activeDisputes: 0,
};

function getMonthsBackForTimeframe(tf: TimeframeFilter): number {
  const now = new Date();
  switch (tf) {
    case 'Ce mois':
      return 1;
    case '30 jours':
      return 2;
    case '6 mois':
      return 6;
    case 'Cette année':
      return now.getMonth() + 1; // De janvier au mois en cours
    default:
      return 6;
  }
}

function filterReservationsByTimeframe(reservations: any[], tf: TimeframeFilter): any[] {
  const now = new Date();
  const COUNTED = ['COMPLETED', 'CHECKED_IN', 'CONFIRMED', 'PAID'];

  return reservations.filter((r) => {
    const status = String(r.statut || r.status || '').toUpperCase();
    if (!COUNTED.includes(status)) return false;

    const dateStr = r.dateDebut || r.created_at || r.createdAt;
    if (!dateStr) return false;
    const rd = new Date(dateStr);

    if (tf === 'Ce mois') {
      return rd.getFullYear() === now.getFullYear() && rd.getMonth() === now.getMonth();
    }
    if (tf === '30 jours') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(now.getDate() - 30);
      return rd >= thirtyDaysAgo;
    }
    if (tf === '6 mois') {
      const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
      return rd >= sixMonthsAgo;
    }
    if (tf === 'Cette année') {
      return rd.getFullYear() === now.getFullYear();
    }
    return true;
  });
}

function buildMonthlyRevenueFromReservations(
  reservations: any[],
  tf: TimeframeFilter
): Array<{ month: string; revenue: number; bookingsCount: number }> {
  const COUNTED = ['COMPLETED', 'CHECKED_IN', 'CONFIRMED', 'PAID'];
  const now = new Date();
  const monthsBack = getMonthsBackForTimeframe(tf);
  const points: Array<{ month: string; revenue: number; bookingsCount: number }> = [];

  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthLabel = new Intl.DateTimeFormat('fr-FR', { month: 'short' })
      .format(d)
      .replace('.', '');

    const matchingReservations = reservations.filter((r) => {
      const status = String(r.statut || r.status || '').toUpperCase();
      if (!COUNTED.includes(status)) return false;
      const dateStr = r.dateDebut || r.created_at || r.createdAt;
      if (!dateStr) return false;
      const rd = new Date(dateStr);
      return rd.getFullYear() === d.getFullYear() && rd.getMonth() === d.getMonth();
    });

    const revenue = matchingReservations.reduce((sum, r) => {
      const val = Number(r.netProprietaire ?? r.totalLocataire ?? r.montantTotal ?? r.prixTotal ?? 0);
      return sum + val;
    }, 0);

    points.push({
      month: monthLabel,
      revenue,
      bookingsCount: matchingReservations.length,
    });
  }

  return points;
}

export function useOwnerStats() {
  const [timeframe, setTimeframe] = useState<TimeframeFilter>('30 jours');

  const { data, isLoading, isFetching, isRefetching, refetch, error } = useQuery({
    queryKey: ['owner', 'stats-page-full', timeframe],
    queryFn: async (): Promise<OwnerStatsFullData> => {
      try {
        const [statsRes, pendingRes, activityRes, reservationsRes] = await Promise.all([
          apiClient.get(`/dashboard/owner/stats?timeframe=${encodeURIComponent(timeframe)}`).catch(() => null),
          apiClient.get('/dashboard/owner/pending-actions').catch(() => null),
          apiClient.get('/dashboard/owner/recent-activity').catch(() => null),
          apiClient.get('/reservations/me').catch(() => null),
        ]);

        const statsRaw = statsRes?.data?.data || statsRes?.data || {};
        const pendingRaw = pendingRes?.data?.data || pendingRes?.data || {};
        const activityRaw = activityRes?.data?.data || activityRes?.data || [];
        const reservationsRaw = reservationsRes?.data?.data || reservationsRes?.data || [];

        const allReservations = Array.isArray(reservationsRaw) && reservationsRaw.length > 0
          ? reservationsRaw
          : Array.isArray(activityRaw) ? activityRaw : [];

        // Dynamic filtering per timeframe
        const filteredReservations = filterReservationsByTimeframe(allReservations, timeframe);

        // Build monthly breakdown from reservations
        let monthlyRevenue = buildMonthlyRevenueFromReservations(allReservations, timeframe);

        // Prioritize backend stats.monthlyRevenue if available
        if (
          Array.isArray(statsRaw.monthlyRevenue) &&
          statsRaw.monthlyRevenue.length > 0
        ) {
          monthlyRevenue = statsRaw.monthlyRevenue.map((m: any) => ({
            month: m.label || m.month || '',
            revenue: Number(m.value || m.revenue || 0),
            bookingsCount: Number(m.bookingsCount || 0),
          }));
        }

        // Build status breakdown reservations array if statusBreakdown is provided by backend
        let reservationsForBreakdown = filteredReservations;
        if (statsRaw.statusBreakdown && typeof statsRaw.statusBreakdown === 'object') {
          const breakdownItems = Object.entries(statsRaw.statusBreakdown).flatMap(
            ([statut, count]) => Array.from({ length: Number(count) || 0 }, () => ({ statut }))
          );
          if (breakdownItems.length > 0) {
            reservationsForBreakdown = breakdownItems;
          }
        }

        const totalBackendRevenue = Number(statsRaw.bookings?.revenue ?? 0);
        const totalBackendBookings = Number(statsRaw.bookings?.total ?? 0);

        const periodRevenue = filteredReservations.reduce((sum, r) => {
          const val = Number(r.netProprietaire ?? r.totalLocataire ?? r.montantTotal ?? r.prixTotal ?? 0);
          return sum + val;
        }, 0);

        const periodBookings = filteredReservations.length;

        const finalRevenue = totalBackendRevenue > 0 ? totalBackendRevenue : periodRevenue;
        const finalBookingsCount = totalBackendBookings > 0 ? totalBackendBookings : periodBookings;

        const activeListings = Number(statsRaw.listings?.active ?? 0);
        const draftListings = Number(statsRaw.listings?.drafts ?? statsRaw.listings?.draft ?? 0);
        const pendingListings = Number(statsRaw.listings?.pending ?? statsRaw.listings?.paused ?? 0);
        const totalListings = Number(statsRaw.listings?.total ?? (activeListings + draftListings + pendingListings));

        const averageRating = Number(
          statsRaw.bookings?.averageRating ?? statsRaw.reputation?.rating ?? 0
        );

        const stats: OwnerStatsData = {
          listings: {
            active: activeListings,
            total: totalListings,
            draft: draftListings,
            paused: pendingListings,
          },
          bookings: {
            total: finalBookingsCount,
            revenue: finalRevenue,
            averageRating: averageRating,
            conversionRate: Number(statsRaw.bookings?.conversionRate ?? 0),
            averageDailyRate: Number(statsRaw.bookings?.averageDailyRate ?? 0),
            totalNights: Number(statsRaw.bookings?.totalNights ?? 0),
            cancellationRate: Number(statsRaw.bookings?.cancellationRate ?? 0),
          },
          wallet: {
            balance: Number(statsRaw.wallet?.balance ?? 0),
            pending: Number(statsRaw.wallet?.pending ?? 0),
            processing: Number(statsRaw.wallet?.processing ?? 0),
          },
          monthlyRevenue,
          topListings: Array.isArray(statsRaw.topListings) ? statsRaw.topListings : [],
        };

        const pending: OwnerPendingActionsData = {
          pendingConfirmations: Number(pendingRaw.pendingConfirmations ?? 0),
          activeDisputes: Number(pendingRaw.activeDisputes ?? 0),
        };

        const recentActivity: ActivityItem[] = Array.isArray(activityRaw)
          ? activityRaw.map((act: any, idx: number) => ({
              id: String(act.id || `act-${idx}`),
              type: String(act.type || act.categorie || 'BOOKING'),
              title: String(act.title || act.titre || act.logement?.titre || 'Réservation'),
              subtitle: String(
                act.subtitle || act.description || act.locataire
                  ? `${act.locataire?.prenom || ''} ${act.locataire?.nom || ''}`.trim()
                  : ''
              ),
              date: String(act.date || act.createdAt || act.creeLe || 'Récemment'),
              amount: act.netProprietaire ?? act.totalLocataire ?? act.amount,
              status: act.statut || act.status,
            }))
          : [];

        return { stats, pending, recentActivity, allReservations, filteredReservations: reservationsForBreakdown };
      } catch (err) {
        console.warn('[useOwnerStats] Erreur chargement stats API :', err);
        return {
          stats: EMPTY_STATS,
          pending: EMPTY_PENDING,
          recentActivity: [],
          allReservations: [],
          filteredReservations: [],
        };
      }
    },
    staleTime: 5 * 60 * 1000,
  });

  return {
    stats: data?.stats || EMPTY_STATS,
    pending: data?.pending || EMPTY_PENDING,
    recentActivity: data?.recentActivity || [],
    allReservations: data?.allReservations || [],
    filteredReservations: data?.filteredReservations || [],
    timeframe,
    setTimeframe,
    isLoading: isLoading || isFetching || (!data && !error),
    isRefetching,
    refetch,
    error,
  };
}
