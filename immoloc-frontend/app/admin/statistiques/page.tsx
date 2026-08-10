'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { AdminShell } from '@/components/admin/admin-shell';
import { AdminStatsHeaderBar, DatePreset } from '@/features/admin/components/stats/AdminStatsHeaderBar';
import { AdminStatsKpiGrid } from '@/features/admin/components/stats/AdminStatsKpiGrid';
import { AdminStatsCharts } from '@/features/admin/components/stats/AdminStatsCharts';
import { AdminStatsKlefLedgerTable, KlefLedgerEntry } from '@/features/admin/components/stats/AdminStatsKlefLedgerTable';
import { adminApi } from '@/lib/nestjs';

export default function AdminStatistiquesPage() {
  const [datePreset, setDatePreset] = useState<DatePreset>('30DAYS');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const [statsData, setStatsData] = useState<{
    summary?: any;
    timeSeries: any[];
    breakdownByCity: any[];
    breakdownByType: any[];
    recentKlefLedger: KlefLedgerEntry[];
  }>({
    summary: undefined,
    timeSeries: [],
    breakdownByCity: [],
    breakdownByType: [],
    recentKlefLedger: [],
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Calcul automatique des dates selon les presets
  const computedDateRange = useMemo(() => {
    const now = new Date();
    if (datePreset === 'TODAY') {
      const todayStr = now.toISOString().slice(0, 10);
      return { start: todayStr, end: todayStr };
    }
    if (datePreset === '7DAYS') {
      const d = new Date(now);
      d.setDate(d.getDate() - 7);
      return { start: d.toISOString().slice(0, 10), end: now.toISOString().slice(0, 10) };
    }
    if (datePreset === '30DAYS') {
      const d = new Date(now);
      d.setDate(d.getDate() - 30);
      return { start: d.toISOString().slice(0, 10), end: now.toISOString().slice(0, 10) };
    }
    if (datePreset === 'THIS_MONTH') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
      return { start, end: now.toISOString().slice(0, 10) };
    }
    if (datePreset === 'THIS_YEAR') {
      const start = new Date(now.getFullYear(), 0, 1).toISOString().slice(0, 10);
      return { start, end: now.toISOString().slice(0, 10) };
    }
    return { start: startDate, end: endDate };
  }, [datePreset, startDate, endDate]);

  const loadStats = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await adminApi.getFinancialStats({
        startDate: computedDateRange.start,
        endDate: computedDateRange.end,
        ville: selectedCity,
        type: selectedType,
      });

      if (res) {
        setStatsData({
          summary: res.summary,
          timeSeries: res.timeSeries ?? [],
          breakdownByCity: res.breakdownByCity ?? [],
          breakdownByType: res.breakdownByType ?? [],
          recentKlefLedger: res.recentKlefLedger ?? [],
        });
      }
    } catch {
      showToast("Erreur lors du chargement des statistiques de revenus");
    } finally {
      setIsLoading(false);
    }
  }, [computedDateRange, selectedCity, selectedType]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // Exportation CSV des gains Klef
  const handleExportCsv = () => {
    if (statsData.recentKlefLedger.length === 0) {
      showToast("Aucune donnée financière à exporter");
      return;
    }

    const headers = ["ID Réservation", "Date", "Logement", "Ville", "Voyageur", "Montant Brut (XOF)", "Part Hôte (90%)", "Commission Net Klef (10%)"];
    const rows = statsData.recentKlefLedger.map((item) => [
      item.id,
      item.date ? new Date(item.date).toLocaleDateString("fr-FR") : "",
      `"${(item.title ?? "").replace(/"/g, '""')}"`,
      `"${item.ville ?? ""}"`,
      `"${(item.locataire ?? "").replace(/"/g, '""')}"`,
      item.totalBrut,
      item.partHote,
      item.partKlef,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `klef_rapport_revenus_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Rapport financier CSV exporté avec succès !");
  };

  return (
    <AdminShell>
      <div className="space-y-6">
        {/* Toast */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 rounded-card border border-forest-300 bg-forest-900 px-4 py-3 text-xs font-semibold text-neutral-0 shadow-xl animate-fade-in">
            {toastMessage}
          </div>
        )}

        {/* Header Bar */}
        <AdminStatsHeaderBar
          datePreset={datePreset}
          onPresetChange={setDatePreset}
          startDate={startDate}
          endDate={endDate}
          onCustomDateChange={(start, end) => { setStartDate(start); setEndDate(end); }}
          selectedCity={selectedCity}
          onCityChange={setSelectedCity}
          selectedType={selectedType}
          onTypeChange={setSelectedType}
          onRefresh={loadStats}
          isRefreshing={isLoading}
          onExportCsv={handleExportCsv}
        />

        {/* Top Summary KPI Grid */}
        <AdminStatsKpiGrid
          summary={statsData.summary}
          isLoading={isLoading}
        />

        {/* Interactive Charts & City Breakdown */}
        <AdminStatsCharts
          timeSeries={statsData.timeSeries}
          breakdownByCity={statsData.breakdownByCity}
          breakdownByType={statsData.breakdownByType}
          isLoading={isLoading}
        />

        {/* Detailed Klef Revenue Ledger Table */}
        <AdminStatsKlefLedgerTable
          entries={statsData.recentKlefLedger}
          isLoading={isLoading}
        />
      </div>
    </AdminShell>
  );
}
