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

function buildMonthlyRevenueFromReservations(
  reservations: any[],
  monthsBack = 6
): Array<{ month: string; revenue: number; bookingsCount: number }> {
  const COUNTED = ['COMPLETED', 'CHECKED_IN', 'CONFIRMED', 'PAID'];
  const now = new Date();
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

  const { data, isLoading, isRefetching, refetch, error } = useQuery({
    queryKey: ['owner', 'stats-page-full', timeframe],
    queryFn: async (): Promise<OwnerStatsFullData> => {
      try {
        const [statsRes, pendingRes, activityRes, reservationsRes] = await Promise.all([
          apiClient.get('/dashboard/owner/stats').catch(() => null),
          apiClient.get('/dashboard/owner/pending-actions').catch(() => null),
          apiClient.get('/dashboard/owner/recent-activity').catch(() => null),
          apiClient.get('/reservations/me').catch(() => null),
        ]);

        const statsRaw = statsRes?.data?.data || statsRes?.data || {};
        const pendingRaw = pendingRes?.data?.data || pendingRes?.data || {};
        const activityRaw = activityRes?.data?.data || activityRes?.data || [];
        const reservationsRaw = reservationsRes?.data?.data || reservationsRes?.data || [];

        const allReservations = Array.isArray(reservationsRaw) ? reservationsRaw : [];

        // Compute total calculated revenue from all host reservations
        const calculatedTotalRevenue = allReservations
          .filter((r: any) =>
            ['COMPLETED', 'CHECKED_IN', 'CONFIRMED', 'PAID'].includes(
              String(r.statut || r.status || '').toUpperCase()
            )
          )
          .reduce(
            (sum: number, r: any) =>
              sum + Number(r.netProprietaire ?? r.totalLocataire ?? r.montantTotal ?? r.prixTotal ?? 0),
            0
          );

        // Map backend monthlyRevenue items ({ label, value, isCurrent })
        const apiMonthlyRevenue =
          Array.isArray(statsRaw.monthlyRevenue) && statsRaw.monthlyRevenue.length > 0
            ? statsRaw.monthlyRevenue.map((m: any) => ({
                month: String(m.label || m.month || m.mois || m.name || 'Mois'),
                revenue: Number(m.value ?? m.revenue ?? m.montant ?? m.total ?? 0),
                bookingsCount: Number(m.bookingsCount ?? m.count ?? m.reservations ?? 0),
              }))
            : null;

        const fallbackMonthlyRevenue = buildMonthlyRevenueFromReservations(allReservations, 6);

        const monthlyRevenue =
          apiMonthlyRevenue && apiMonthlyRevenue.some((m: { revenue: number }) => m.revenue > 0)
            ? apiMonthlyRevenue
            : fallbackMonthlyRevenue;

        const totalRevenue = Math.max(
          Number(statsRaw.bookings?.revenue ?? 0),
          calculatedTotalRevenue
        );

        const totalBookingsCount = Math.max(
          Number(statsRaw.bookings?.total ?? 0),
          allReservations.length
        );

        const activeListings = Number(statsRaw.listings?.active ?? 0);
        const draftListings = Number(statsRaw.listings?.drafts ?? statsRaw.listings?.draft ?? 0);
        const pendingListings = Number(statsRaw.listings?.pending ?? statsRaw.listings?.paused ?? 0);
        const totalListings = activeListings + draftListings + pendingListings;

        const averageRating = Number(
          statsRaw.reputation?.rating ?? statsRaw.bookings?.averageRating ?? 0
        );

        const stats: OwnerStatsData = {
          listings: {
            active: activeListings,
            total: totalListings,
            draft: draftListings,
            paused: pendingListings,
          },
          bookings: {
            total: totalBookingsCount,
            revenue: totalRevenue,
            averageRating: averageRating,
            conversionRate: Number(statsRaw.bookings?.conversionRate ?? 0),
          },
          wallet: {
            balance: Number(statsRaw.wallet?.balance ?? 0),
            pending: Number(statsRaw.wallet?.pending ?? 0),
            processing: Number(statsRaw.wallet?.processing ?? 0),
          },
          monthlyRevenue,
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

        return { stats, pending, recentActivity };
      } catch (err) {
        console.warn('[useOwnerStats] Erreur chargement stats API :', err);
        return {
          stats: EMPTY_STATS,
          pending: EMPTY_PENDING,
          recentActivity: [],
        };
      }
    },
    staleTime: 5 * 60 * 1000,
  });

  return {
    stats: data?.stats || EMPTY_STATS,
    pending: data?.pending || EMPTY_PENDING,
    recentActivity: data?.recentActivity || [],
    timeframe,
    setTimeframe,
    isLoading,
    isRefetching,
    refetch,
    error,
  };
}
