/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
import { dashboardApi } from '@/lib/nestjs';
import { KpiSection } from '@/features/dashboard/components/owner/KpiSection';
import { RevenueChart } from '@/features/dashboard/components/owner/RevenueChart';
import { WalletSnapshot } from '@/features/dashboard/components/owner/WalletSnapshot';
import { PendingActions } from '@/features/dashboard/components/owner/PendingActions';
import { RecentBookings } from '@/features/dashboard/components/owner/RecentBookings';
import { ActivitySidebar } from '@/features/dashboard/components/owner/ActivitySidebar';
import { DashboardCalendar } from '@/features/dashboard/components/owner/DashboardCalendar';

// ── Skeleton ────────────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return <div className={`bg-neutral-100 animate-pulse rounded-2xl ${className}`} />;
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 pb-10">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28" />)}
      </div>
      <div className="grid lg:grid-cols-[1fr_420px] gap-6">
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
      <div className="grid lg:grid-cols-[1fr_420px] gap-6">
        <Skeleton className="h-72" />
        <Skeleton className="h-72" />
      </div>
      <div className="grid lg:grid-cols-[1fr_420px] gap-6">
        <div className="space-y-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-80" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-64" />
        </div>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    async function load() {
      try {
        const [stats, pending, recent, upcoming] = await Promise.all([
          dashboardApi.getOwnerStats(),
          dashboardApi.getPendingActions(),
          dashboardApi.getRecentActivity(),
          dashboardApi.getUpcomingEvents(),
        ]);
        setData({ stats, pending, recent, upcoming });
      } catch (err) {
        console.error('Erreur chargement dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <DashboardSkeleton />;
  if (!data) return null;

  const { stats, pending, recent, upcoming } = data;

  return (
    <div className="space-y-6 pb-10">

      {/* ── KPIs ──────────────────────────────────────────────────── */}
      <KpiSection
        stats={{
          revenue: Number(stats.bookings.revenue ?? 0),
          totalBookings: stats.bookings.total ?? 0,
          activeDisputes: pending.activeDisputes ?? 0,
          activeListings: stats.listings.active ?? 0,
        }}
        pendingConfirmations={pending.pendingConfirmations ?? 0}
      />

      {/* ── Wallet + Revenus (même ligne, même hauteur) ─────────── */}
      <div className="grid lg:grid-cols-[420px_1fr] gap-6 items-stretch min-h-[380px]">
        <WalletSnapshot
          available={Number(stats.wallet?.balance ?? 0)}
          pending={Number(stats.wallet?.pending ?? 0)}
          processing={Number(stats.wallet?.processing ?? 0)}
        />
        <RevenueChart
          revenue={Number(stats.bookings.revenue ?? 0)}
          totalBookings={stats.bookings.total ?? 0}
        />
      </div>

      {/* ── Activité Hub — Layout Premium avec Sidebar Unifiée ──────── */}
      <div className="grid lg:grid-cols-[1fr_420px] gap-6 items-stretch">
        {/* Colonne principale gauche : Activité récente + Actions requises */}
        <div className="flex flex-col gap-6">
          <RecentBookings bookings={recent} />
          <PendingActions
            confirmations={pending.pendingConfirmations ?? 0}
            disputes={pending.activeDisputes ?? 0}
            recentBookings={recent}
          />
        </div>

        {/* Sidebar droite unifiée : Quick Actions + Stats + Performance */}
        <ActivitySidebar
          bookings={recent}
          conversionRate={stats.bookings.conversionRate ?? 0}
          activeListings={stats.listings.active ?? 0}
        />
      </div>

      {/* ── Calendrier — pleine largeur ───────────────────────────── */}
      <DashboardCalendar
        checkins={upcoming.checkins}
        checkouts={upcoming.checkouts}
      />
    </div>
  );
}
