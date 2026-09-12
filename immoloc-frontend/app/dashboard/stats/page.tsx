/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { ArrowLeft, BarChart3, Calendar, RefreshCw } from 'lucide-react';
import { dashboardApi } from '@/lib/nestjs';
import { KpiSection } from '@/features/dashboard/components/owner/KpiSection';
import { RevenueChart } from '@/features/dashboard/components/owner/RevenueChart';
import { ReservationStats } from '@/features/dashboard/components/owner/ReservationStats';
import { PerformanceCard } from '@/features/dashboard/components/owner/PerformanceCard';
import DashboardLoading from '../loading';
import { cn } from '@/lib/utils/cn';

const TIMEFRAMES = ['Ce mois', '30 jours', '6 mois', 'Cette année'] as const;
type TimeframeFilter = typeof TIMEFRAMES[number];

export default function StatsPage() {
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<TimeframeFilter>('30 jours');
  const [data, setData] = useState<any>(null);
  const [isPending, startTransition] = useTransition();

  async function loadData(tf: TimeframeFilter = timeframe) {
    setLoading(true);
    try {
      const [stats, pending, recent] = await Promise.all([
        dashboardApi.getOwnerStats(tf),
        dashboardApi.getPendingActions(),
        dashboardApi.getRecentActivity(),
      ]);
      setData({ stats, pending, recent });
    } catch (err) {
      console.error('Erreur chargement statistiques:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData(timeframe);
  }, [timeframe]);

  const handleTimeframeChange = (tf: TimeframeFilter) => {
    setTimeframe(tf);
    startTransition(() => {
      loadData(tf);
    });
  };

  if (loading && !data) return <DashboardLoading />;
  if (!data) return null;

  const { stats, pending, recent } = data;

  // Conversion du statusBreakdown backend en liste de réservations pour ReservationStats
  const bookingsFromBreakdown = Object.entries(stats.statusBreakdown || {}).flatMap(
    ([statut, count]) => Array.from({ length: Number(count) || 0 }, () => ({ statut }))
  );

  // Conversion de topListings backend pour PerformanceCard
  const bookingsForPerformance = (stats.topListings || []).map((t: any) => ({
    netProprietaire: t.revenue,
    totalLocataire: t.revenue,
    statut: 'COMPLETED',
    logement: { id: t.id, titre: t.titre, ville: t.ville },
  }));

  // Points mensuels formatés pour RevenueChart
  const monthlyPoints = stats.monthlyRevenue?.map((m: any) => ({
    label: m.label || m.month,
    value: Number(m.value || m.revenue || 0),
    isCurrent: Boolean(m.isCurrent),
  })) || [];

  return (
    <div className="space-y-6 sm:space-y-8 pb-12">

      {/* ── Top Bar Navigation & Titre ────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-border/60">
        <div className="space-y-1">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-forest-700 hover:text-forest-950 transition-colors mb-1 group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span>Tableau de bord</span>
          </Link>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-inner bg-forest-950 text-on-inverse-marker border border-forest-800 flex items-center justify-center shrink-0 shadow-2xs">
              <BarChart3 className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-on-inverse-marker" />
            </div>
            <h1 className="font-display text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
              Statistiques & Performance
            </h1>
          </div>
          <p className="text-xs text-foreground-muted font-medium">
            Analyse détaillée des revenus locatifs, des taux de conversion et du classement des logements.
          </p>
        </div>

        <button
          onClick={() => loadData(timeframe)}
          className="self-start sm:self-center inline-flex items-center gap-2 px-3.5 py-2 rounded-pill bg-background-card border border-border/80 text-xs font-bold text-foreground hover:border-forest-600/40 transition-all shadow-2xs active:scale-95"
        >
          <RefreshCw className={cn("w-3.5 h-3.5 text-forest-600", (loading || isPending) && "animate-spin")} />
          <span>Actualiser</span>
        </button>
      </div>

      {/* ── Barre de Filtres Temporels (Période) ───────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3 p-1.5 rounded-card bg-neutral-100/80 border border-border/60">
        <div className="flex items-center gap-2 px-3 text-xs font-bold text-forest-900">
          <Calendar className="w-4 h-4 text-forest-600" />
          <span>Période d'analyse :</span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
          {TIMEFRAMES.map((tf) => {
            const active = timeframe === tf;
            return (
              <button
                key={tf}
                onClick={() => handleTimeframeChange(tf)}
                className={cn(
                  'px-3.5 py-1.5 text-xs font-semibold rounded-pill transition-all whitespace-nowrap',
                  active
                    ? 'bg-forest-950 text-white shadow-2xs'
                    : 'bg-background-card text-foreground-muted hover:text-foreground hover:bg-neutral-200/60'
                )}
              >
                {tf}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Section 1 : KPIs de Synthèse Globaux (4 Cartes) ───────── */}
      <section className="space-y-3">
        <KpiSection
          stats={{
            revenue: Number(stats.bookings.revenue ?? 0),
            totalBookings: stats.bookings.total ?? 0,
            activeDisputes: pending.activeDisputes ?? 0,
            activeListings: stats.listings.active ?? 0,
          }}
          pendingConfirmations={pending.pendingConfirmations ?? 0}
          isLoading={loading && !data}
        />
      </section>

      {/* ── Section 2 : Graphique d'Évolution des Revenus ─────────── */}
      <section className="space-y-3">
        <RevenueChart
          points={monthlyPoints}
          revenue={Number(stats.bookings.revenue ?? 0)}
          totalBookings={stats.bookings.total ?? 0}
          isLoading={loading && !data}
        />
      </section>

      {/* ── Section 3 : Répartition des Séjours & Performance ──────── */}
      <section className="grid lg:grid-cols-2 gap-6 items-start">
        {/* Répartition des Réservations */}
        <ReservationStats
          bookings={bookingsFromBreakdown.length > 0 ? bookingsFromBreakdown : recent}
          isLoading={loading && !data}
        />

        {/* Classement des Logements */}
        <PerformanceCard
          bookings={bookingsForPerformance.length > 0 ? bookingsForPerformance : recent}
          conversionRate={stats.bookings.conversionRate ?? 0}
          activeListings={stats.listings.active ?? 0}
          isLoading={loading && !data}
        />
      </section>

    </div>
  );
}