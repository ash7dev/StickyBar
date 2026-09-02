'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, ClipboardCheck, Plus, Sparkles } from 'lucide-react';
import { nestFetch } from '@/lib/nestjs/api-client';
import { NEST_API } from '@/lib/nestjs/endpoints';
import { GestionnaireEtatsDesLieuxStatsHeader } from '@/features/gestionnaire/components/GestionnaireEtatsDesLieuxStatsHeader';
import {
  GestionnaireEtatsDesLieuxFilterBar,
  type InspectionTypeFilter,
} from '@/features/gestionnaire/components/GestionnaireEtatsDesLieuxFilterBar';
import { GestionnaireEtatsDesLieuxTable } from '@/features/gestionnaire/components/GestionnaireEtatsDesLieuxTable';
import {
  GestionnaireInspectionDetailModal,
  type InspectionReportItem,
} from '@/features/gestionnaire/components/GestionnaireInspectionDetailModal';

export default function GestionnaireEtatsDesLieuxPage() {
  const [selectedReport, setSelectedReport] = useState<InspectionReportItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTypeFilter, setActiveTypeFilter] = useState<InspectionTypeFilter>('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Récupération des rapports d'états des lieux certifiés réels depuis l'API backend
  const { data: realReports = [], isLoading, error } = useQuery<InspectionReportItem[]>({
    queryKey: ['gestionnaire', 'etats-des-lieux'],
    queryFn: () => nestFetch<InspectionReportItem[]>(NEST_API.GESTIONNAIRE.ETATS_DES_LIEUX),
  });

  // Filtrage combiné par recherche, type et catégorie
  const filteredReports = useMemo(() => {
    return realReports.filter((r) => {
      // 1. Recherche par texte
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesSearch =
          r.code.toLowerCase().includes(q) ||
          r.logementTitre.toLowerCase().includes(q) ||
          r.travelerName.toLowerCase().includes(q) ||
          r.ownerName.toLowerCase().includes(q);
        if (!matchesSearch) return false;
      }

      // 2. Filtre par type
      if (activeTypeFilter !== 'ALL') {
        if (activeTypeFilter === 'CHECKIN' && r.type !== 'CHECKIN') return false;
        if (activeTypeFilter === 'CHECKOUT' && r.type !== 'CHECKOUT') return false;
        if (activeTypeFilter === 'DISPUTED' && r.statut !== 'LITIGE') return false;
      }

      return true;
    });
  }, [realReports, searchQuery, activeTypeFilter]);

  const totalCheckins = realReports.filter((r) => r.type === 'CHECKIN').length;
  const totalCheckouts = realReports.filter((r) => r.type === 'CHECKOUT').length;
  const totalLitiges = realReports.filter((r) => r.statut === 'LITIGE').length;

  const handleOpenReport = (report: InspectionReportItem) => {
    setSelectedReport(report);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* ── 1. En-tête de la page ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-foreground flex items-center gap-3">
            <ClipboardCheck className="h-7 w-7 text-forest-600" aria-hidden="true" />
            <span>États des Lieux &amp; Inspections</span>
          </h1>
          <p className="text-xs sm:text-sm text-foreground-muted mt-1 font-medium">
            Rapports d’entrée et de sortie numérisés, contrôle des compteurs et traçabilité des clés.
          </p>
        </div>

        {realReports.length > 0 && (
          <button
            type="button"
            onClick={() => handleOpenReport(realReports[0])}
            className="btn-action inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-semibold self-start sm:self-auto cursor-pointer"
          >
            <Plus className="h-4 w-4 text-forest-950" aria-hidden="true" />
            <span>Nouvel État des Lieux</span>
          </button>
        )}
      </div>

      {/* ── Erreur ──────────────────────────────────────────────────────── */}
      {error && (
        <div
          role="alert"
          className="flex items-center gap-3 rounded-card border border-error-500/20 bg-error-50 p-4 text-xs text-error-700 font-medium"
        >
          <AlertCircle className="h-5 w-5 shrink-0 text-error-600" aria-hidden="true" />
          <span>Impossible de charger les états des lieux. Vérifiez votre connexion.</span>
        </div>
      )}

      {/* ── Skeleton ────────────────────────────────────────────────────── */}
      {isLoading && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-28 bg-neutral-100 rounded-card" />
            ))}
          </div>
          <div className="h-64 bg-neutral-100 rounded-card animate-pulse" />
        </div>
      )}

      {/* ── Contenu Principal ───────────────────────────────────────────── */}
      {!isLoading && !error && (
        <>
          {/* 2. Synthèse KPI des Inspections */}
          <GestionnaireEtatsDesLieuxStatsHeader
            totalInspections={realReports.length}
            totalCheckins={totalCheckins}
            totalCheckouts={totalCheckouts}
            totalLitiges={totalLitiges}
          />

          {/* 3. Barre de Filtres & Recherche */}
          <GestionnaireEtatsDesLieuxFilterBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            activeFilter={activeTypeFilter}
            onFilterChange={setActiveTypeFilter}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
          />

          {/* 4. Tableau interactif des États des Lieux */}
          <GestionnaireEtatsDesLieuxTable
            reports={filteredReports}
            onOpenReport={handleOpenReport}
          />
        </>
      )}

      {/* ── Modal de Détail / Rapport d'Inspection ───────────────────────── */}
      <GestionnaireInspectionDetailModal
        report={selectedReport}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
