/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, BarChart3, RefreshCw } from 'lucide-react';
import { dashboardApi } from '@/lib/nestjs';
import { KpiSection } from '@/features/dashboard/components/owner/KpiSection';
import { RevenueChart } from '@/features/dashboard/components/owner/RevenueChart';
import { ReservationStats } from '@/features/dashboard/components/owner/ReservationStats';
import { PerformanceCard } from '@/features/dashboard/components/owner/PerformanceCard';
import DashboardLoading from '../loading';

export default function StatsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  async function loadData() {
    setLoading(true);
    try {
      const [stats, pending, recent] = await Promise.all([
        dashboardApi.getOwnerStats(),
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
    loadData();
  }, []);

  if (loading) return <DashboardLoading />;
  if (!data) return null;

  const { stats, pending, recent } = data;

  return (
    <div className="space-y-6 sm:space-y-8 pb-12">

      {/* ── Top Bar Navigation (Bouton retour & Titre) ────────────── */}
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
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-inner bg-forest-950 text-lime-400 border border-forest-800 flex items-center justify-center shrink-0 shadow-2xs">
              <BarChart3 className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-lime-400" />
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
          onClick={loadData}
          className="self-start sm:self-center inline-flex items-center gap-2 px-3.5 py-2 rounded-pill bg-background-card border border-border/80 text-xs font-bold text-foreground hover:border-forest-600/40 transition-all shadow-2xs active:scale-95"
        >
          <RefreshCw className="w-3.5 h-3.5 text-forest-600" />
          <span>Actualiser</span>
        </button>
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
        />
      </section>

      {/* ── Section 2 : Graphique d'Évolution des Revenus ─────────── */}
      <section className="space-y-3">
        <RevenueChart
          revenue={Number(stats.bookings.revenue ?? 0)}
          totalBookings={stats.bookings.total ?? 0}
        />
      </section>

      {/* ── Section 3 : Répartition des Séjours & Performance ──────── */}
      <section className="grid lg:grid-cols-2 gap-6 items-start">
        {/* Répartition des Réservations */}
        <ReservationStats bookings={recent} />

        {/* Classement des Logements */}
        <PerformanceCard
          bookings={recent}
          conversionRate={stats.bookings.conversionRate ?? 0}
          activeListings={stats.listings.active ?? 0}
        />
      </section>

    </div>
  );
}