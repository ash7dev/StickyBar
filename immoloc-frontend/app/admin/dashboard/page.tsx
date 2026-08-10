'use client';

import { useEffect, useState, useCallback } from 'react';
import { AdminShell } from '@/components/admin/admin-shell';
import { AdminDashboardHeaderBar } from '@/features/admin/components/dashboard/AdminDashboardHeaderBar';
import { AdminStatsOverview } from '@/features/admin/components/dashboard/AdminStatsOverview';
import { AdminUrgentActions } from '@/features/admin/components/dashboard/AdminUrgentActions';
import { AdminRevenueChart } from '@/features/admin/components/dashboard/AdminRevenueChart';
import { AdminRecentActivityFeed } from '@/features/admin/components/dashboard/AdminRecentActivityFeed';
import { AdminGeographicStats } from '@/features/admin/components/dashboard/AdminGeographicStats';
import { AdminTopPerformers } from '@/features/admin/components/dashboard/AdminTopPerformers';
import { AdminPendingPayoutsQueue } from '@/features/admin/components/dashboard/AdminPendingPayoutsQueue';
import { AdminDisputesOverviewCard } from '@/features/admin/components/dashboard/AdminDisputesOverviewCard';
import { AdminAuditLogWidget } from '@/features/admin/components/dashboard/AdminAuditLogWidget';
import { AdminSystemHealthCard } from '@/features/admin/components/dashboard/AdminSystemHealthCard';
import { AdminQuickActionsGrid } from '@/features/admin/components/dashboard/AdminQuickActionsGrid';
import { adminApi } from '@/lib/nestjs';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [pendingSummary, setPendingSummary] = useState<any>(null);
  const [revenueChart, setRevenueChart] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any>(null);
  const [pendingKyc, setPendingKyc] = useState<any[]>([]);
  const [pendingListings, setPendingListings] = useState<any[]>([]);
  const [geographicStats, setGeographicStats] = useState<any[]>([]);
  const [topPerformers, setTopPerformers] = useState<any[]>([]);
  const [pendingWithdrawals, setPendingWithdrawals] = useState<any[]>([]);
  const [pendingDisputes, setPendingDisputes] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [
        statsData,
        pendingData,
        chartData,
        activityData,
        kycData,
        listingsData,
        geoData,
        performersData,
        withdrawalsData,
        disputesData,
        logsData,
      ] = await Promise.all([
        adminApi.getDashboardStats().catch(() => null),
        adminApi.getPendingSummary().catch(() => null),
        adminApi.getRevenueChart().catch(() => []),
        adminApi.getRecentActivity().catch(() => null),
        adminApi.getPendingKycList().catch(() => []),
        adminApi.getPendingListingsList().catch(() => []),
        adminApi.getGeographicStats().catch(() => []),
        adminApi.getTopPerformers().catch(() => []),
        adminApi.getPendingWithdrawals().catch(() => []),
        adminApi.getPendingDisputes().catch(() => []),
        adminApi.getAuditLogs().catch(() => []),
      ]);

      if (statsData) setStats(statsData);
      if (pendingData) setPendingSummary(pendingData);
      if (Array.isArray(chartData)) setRevenueChart(chartData);
      if (activityData) setRecentActivity(activityData);
      if (Array.isArray(kycData)) setPendingKyc(kycData);
      if (Array.isArray(listingsData)) setPendingListings(listingsData);
      if (Array.isArray(geoData)) setGeographicStats(geoData);
      if (Array.isArray(performersData)) setTopPerformers(performersData);
      if (Array.isArray(withdrawalsData)) setPendingWithdrawals(withdrawalsData);
      if (Array.isArray(disputesData)) setPendingDisputes(disputesData);
      if (Array.isArray(logsData)) setAuditLogs(logsData);
    } catch {
      // Fallback gracieux avec affichage des états vides
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  return (
    <AdminShell urgentCount={pendingSummary?.totalUrgentActions ?? 0}>
      <div className="space-y-6">
        {/* 1. Barre de Contrôle & Exporter Rapport */}
        <AdminDashboardHeaderBar
          onRefresh={loadDashboardData}
          isRefreshing={isLoading}
        />

        {/* 2. Cartes KPIs Financiers & Statistiques */}
        <AdminStatsOverview stats={stats} isLoading={isLoading} />

        {/* 3. Panneau d'Actions Urgentes Requis */}
        <AdminUrgentActions summary={pendingSummary} isLoading={isLoading} />

        {/* 4. Grille 2 Colonnes : Demandes de Retraits Mobile Money & Centre de Litiges */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <AdminPendingPayoutsQueue withdrawals={pendingWithdrawals} isLoading={isLoading} />
          <AdminDisputesOverviewCard disputes={pendingDisputes} isLoading={isLoading} />
        </div>

        {/* 6. Grille 2 Colonnes : Graphique Revenus & Fil d'Activités Récentes */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <AdminRevenueChart data={revenueChart} isLoading={isLoading} />
          <AdminRecentActivityFeed activity={recentActivity} isLoading={isLoading} />
        </div>

        {/* 7. Grille 2 Colonnes : Répartition Géographique Sénégal & Top Hôtes */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <AdminGeographicStats cities={geographicStats} isLoading={isLoading} />
          <AdminTopPerformers performers={topPerformers} isLoading={isLoading} />
        </div>

        {/* 8. NOUVEAU : Journal d'Audit & Sécurité Plateforme */}
        <AdminAuditLogWidget logs={auditLogs} isLoading={isLoading} />

        {/* 9. Moniteur de Santé Système & Webhooks */}
        <AdminSystemHealthCard />

        {/* 10. Raccourcis d'Opérations Rapides Administrateur */}
        <AdminQuickActionsGrid />
      </div>
    </AdminShell>
  );
}
