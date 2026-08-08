/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/lib/nestjs';
import { HostWelcomeBanner } from '@/features/dashboard/components/owner/HostWelcomeBanner';
import { KpiSection } from '@/features/dashboard/components/owner/KpiSection';
import { RevenueChart } from '@/features/dashboard/components/owner/RevenueChart';
import { WalletSnapshot } from '@/features/dashboard/components/owner/WalletSnapshot';
import { PendingActions } from '@/features/dashboard/components/owner/PendingActions';
import { RecentBookings } from '@/features/dashboard/components/owner/RecentBookings';
import { ActivitySidebar } from '@/features/dashboard/components/owner/ActivitySidebar';
import { DashboardCalendar } from '@/features/dashboard/components/owner/DashboardCalendar';
import { MobileKpiGrid } from '@/features/dashboard/components/owner/MobileKpiGrid';
import { MobileQuickActionsMenu } from '@/features/dashboard/components/owner/MobileQuickActionsMenu';
import DashboardLoading from './loading';

// ── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { data, isLoading, isPending } = useQuery({
    queryKey: ['dashboard', 'full-data'],
    queryFn: async () => {
      const [stats, pending, recent, upcoming] = await Promise.all([
        dashboardApi.getOwnerStats(),
        dashboardApi.getPendingActions(),
        dashboardApi.getRecentActivity(),
        dashboardApi.getUpcomingEvents(),
      ]);
      return { stats, pending, recent, upcoming };
    },
    staleTime: 5 * 60 * 1000, // Caches data for 5 minutes
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
    placeholderData: (previousData) => previousData,
  });

  if ((isLoading || isPending) && !data) return <DashboardLoading />;
  if (!data) return <DashboardLoading />;

  const { stats, pending, recent, upcoming } = data;

  return (
    <div className="space-y-6 sm:space-y-8 pb-12">

      {/* ── Vue Mobile : Synthèse KPIs 2x2 & Actions Rapides Menu ── */}
      <div className="block sm:hidden space-y-6">
        <MobileKpiGrid
          stats={{
            revenue: Number(stats.bookings.revenue ?? 0),
            totalBookings: stats.bookings.total ?? 0,
            activeListings: stats.listings.active ?? 0,
            pendingConfirmations: pending.pendingConfirmations ?? 0,
            activeDisputes: pending.activeDisputes ?? 0,
            noteMoyenne: stats.bookings.averageRating ?? 4.9,
          }}
        />

        <MobileQuickActionsMenu />
      </div>

      {/* ── Vue Desktop ──────────────────────────────────────────── */}
      <div className="hidden sm:block space-y-8">
        {/* ── Section 0 : Bandeau de bienvenue & Synthèse Hôte ─────── */}
        <HostWelcomeBanner
          pendingConfirmations={pending.pendingConfirmations ?? 0}
          activeListings={stats.listings.active ?? 0}
          availableBalance={Number(stats.wallet?.balance ?? 0)}
        />

        {/* ── Section 1 : KPIs de Synthèse ──────────────────────────── */}
        <section className="space-y-3">
          <KpiSection
            stats={{
              revenue: Number(stats.bookings.revenue ?? 0),
              totalBookings: stats.bookings.total ?? 0,
              activeDisputes: pending.activeDisputes ?? 0,
              activeListings: stats.listings.active ?? 0,
            }}
            pendingConfirmations={pending.pendingConfirmations ?? 0}
          />
        </section>

        {/* ── Section 2 : Financement & Performance ─────────────────── */}
        <section className="space-y-3">
          <div className="grid lg:grid-cols-[1fr_380px] gap-6 items-stretch">
            <RevenueChart
              revenue={Number(stats.bookings.revenue ?? 0)}
              totalBookings={stats.bookings.total ?? 0}
            />
            <WalletSnapshot
              available={Number(stats.wallet?.balance ?? 0)}
              pending={Number(stats.wallet?.pending ?? 0)}
              processing={Number(stats.wallet?.processing ?? 0)}
            />
          </div>
        </section>

        {/* ── Section 3 : Opérations & Hub d'Activité ──────────────── */}
        <section className="space-y-3">
          <div className="grid lg:grid-cols-[1fr_380px] gap-6 items-stretch">
            <div className="flex flex-col gap-6">
              <PendingActions
                confirmations={pending.pendingConfirmations ?? 0}
                disputes={pending.activeDisputes ?? 0}
                recentBookings={recent}
              />
              <RecentBookings bookings={recent} />
            </div>

            <ActivitySidebar
              bookings={recent}
              conversionRate={stats.bookings.conversionRate ?? 0}
              activeListings={stats.listings.active ?? 0}
            />
          </div>
        </section>

        {/* ── Section 4 : Agenda Logistique ─────────────────────────── */}
        <section className="space-y-3">
          <DashboardCalendar
            checkins={upcoming.checkins}
            checkouts={upcoming.checkouts}
          />
        </section>
      </div>

    </div>
  );
}
