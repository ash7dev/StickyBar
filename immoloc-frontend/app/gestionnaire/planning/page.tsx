'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, CalendarDays, Lock, Plus } from 'lucide-react';
import { nestFetch } from '@/lib/nestjs/api-client';
import { NEST_API } from '@/lib/nestjs/endpoints';
import {
  GestionnairePlanningFilterBar,
  PlanningFilterOptions,
  PlanningViewMode,
} from '@/features/gestionnaire/components/GestionnairePlanningFilterBar';
import { GestionnairePlanningStatsHeader } from '@/features/gestionnaire/components/GestionnairePlanningStatsHeader';
import { GestionnaireGanttView } from '@/features/gestionnaire/components/GestionnaireGanttView';
import { GestionnaireCheckinsList } from '@/features/gestionnaire/components/GestionnaireCheckinsList';
import { GestionnaireBlockDatesModal } from '@/features/gestionnaire/components/GestionnaireBlockDatesModal';

export default function GestionnairePlanningPage() {
  const [viewMode, setViewMode] = useState<PlanningViewMode>('gantt');
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [filters, setFilters] = useState<PlanningFilterOptions>({
    searchQuery: '',
    selectedLogementId: 'ALL',
    currentDate: new Date(),
  });

  // 1. Récupération des logements sous gestion conciergerie
  const { data: logements = [], isLoading: loadingLogements } = useQuery<any[]>({
    queryKey: ['listings', 'gestionnaire'],
    queryFn: () => nestFetch<any[]>(NEST_API.GESTIONNAIRE.LOGEMENTS),
  });

  // 2. Récupération de l'ensemble des réservations réelles de la conciergerie
  const { data: rawReservations = [], isLoading: loadingReservations, error: errorReservations } = useQuery<any[]>({
    queryKey: ['reservations', 'mine', 'gestionnaire'],
    queryFn: () => nestFetch<any[]>(NEST_API.RESERVATIONS.MINE()),
  });

  // 3. Récupération des données du dashboard conciergerie (KPIs)
  const { data: dashboardData, isLoading: loadingDashboard, error: errorDashboard } = useQuery<any>({
    queryKey: ['gestionnaire', 'dashboard'],
    queryFn: () => nestFetch<any>(NEST_API.GESTIONNAIRE.DASHBOARD),
  });

  const handleFilterChange = (updated: Partial<PlanningFilterOptions>) => {
    setFilters((prev) => ({ ...prev, ...updated }));
  };

  // Liste complète des réservations extraites du serveur
  const reservations = useMemo(() => {
    const map = new Map<string, any>();

    // A. Charger toutes les réservations réelles depuis le serveur
    if (Array.isArray(rawReservations)) {
      rawReservations.forEach((b) => {
        map.set(b.id, {
          id: b.id,
          code: b.code || b.id.substring(0, 8).toUpperCase(),
          logementId: b.logementId || b.logement?.id,
          dateDebut: b.dateDebut,
          dateFin: b.dateFin,
          statut: b.statut || 'CONFIRMED',
          prixTotal: Number(b.totalLocataire || b.prixTotal || 0),
          netProprietaire: Number(b.netProprietaire || 0),
          travelerName: b.locataire
            ? `${b.locataire.prenom} ${b.locataire.nom}`.trim()
            : b.travelerName || 'Voyageur',
          travelerPhone: b.locataire?.telephone || b.travelerPhone,
          logementTitle: b.logement?.titre || b.logementTitle,
          ownerName: b.proprietaire
            ? `${b.proprietaire.prenom} ${b.proprietaire.nom}`.trim()
            : b.logement?.proprietaire
            ? `${b.logement.proprietaire.prenom} ${b.logement.proprietaire.nom}`.trim()
            : b.ownerName,
          fournisseurPaiement: b.paiement?.fournisseur || b.fournisseurPaiement || 'Wave / OM',
          statutPaiement: b.paiement?.statut || b.statutPaiement || (b.statut === 'CONFIRMED' || b.statut === 'PAID' ? 'PAID' : 'PENDING'),
          estAcompte: b.estAcompte || false,
        });
      });
    }

    // B. Compléter avec les données du dashboard si présentes
    if (dashboardData) {
      const checkins = dashboardData.upcomingCheckins || [];
      const recent = dashboardData.recentBookings || [];
      [...checkins, ...recent].forEach((b) => {
        if (!map.has(b.id)) {
          map.set(b.id, {
            id: b.id,
            code: b.code,
            logementId: b.logementId || b.logement?.id,
            dateDebut: b.dateDebut,
            dateFin: b.dateFin,
            statut: b.statut || 'CONFIRMED',
            prixTotal: Number(b.prixTotal || b.totalLocataire || 0),
            netProprietaire: Number(b.netProprietaire || 0),
            travelerName:
              b.travelerName || (b.locataire ? `${b.locataire.prenom} ${b.locataire.nom}` : 'Voyageur'),
            travelerPhone: b.travelerPhone || b.locataire?.telephone,
            logementTitle: b.logementTitle || b.logement?.titre,
            ownerName:
              b.ownerName ||
              (b.logement?.proprietaire
                ? `${b.logement.proprietaire.prenom} ${b.logement.proprietaire.nom}`
                : undefined),
            fournisseurPaiement: b.paiement?.fournisseur || b.fournisseurPaiement || 'Wave / OM',
            statutPaiement: b.paiement?.statut || b.statutPaiement || (b.statut === 'CONFIRMED' || b.statut === 'PAID' ? 'PAID' : 'PENDING'),
            estAcompte: b.estAcompte || false,
          });
        }
      });
    }

    return Array.from(map.values());
  }, [rawReservations, dashboardData]);

  // Filtrage des logements et des réservations
  const filteredLogements = useMemo(() => {
    let result = [...logements];

    if (filters.selectedLogementId !== 'ALL') {
      result = result.filter((l) => l.id === filters.selectedLogementId);
    }

    if (filters.searchQuery.trim()) {
      const q = filters.searchQuery.toLowerCase().trim();
      result = result.filter((l) => {
        const titleMatch = (l.titre || '').toLowerCase().includes(q);
        const cityMatch = (l.ville || '').toLowerCase().includes(q);
        const ownerMatch = l.proprietaire
          ? `${l.proprietaire.prenom} ${l.proprietaire.nom}`.toLowerCase().includes(q)
          : false;
        return titleMatch || cityMatch || ownerMatch;
      });
    }

    return result;
  }, [logements, filters]);

  // Calcul des métriques KPI pour le Header
  const { checkinsTodayCount, checkoutsTodayCount, activeStaysCount, occupancyRate } = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];

    let checkins = 0;
    let checkouts = 0;
    let active = 0;

    reservations.forEach((r) => {
      const start = new Date(r.dateDebut).toISOString().split('T')[0];
      const end = new Date(r.dateFin).toISOString().split('T')[0];

      if (start === todayStr) checkins++;
      if (end === todayStr) checkouts++;
      if (todayStr >= start && todayStr <= end) active++;
    });

    const totalLogements = logements.length || 1;
    const rate = Math.min(100, (active / totalLogements) * 100);

    return {
      checkinsTodayCount: checkins,
      checkoutsTodayCount: checkouts,
      activeStaysCount: active,
      occupancyRate: rate,
    };
  }, [reservations, logements]);

  const isLoading = loadingLogements || loadingDashboard || loadingReservations;
  const error = errorDashboard || errorReservations;

  return (
    <div className="space-y-8 pb-12">
      {/* ── 1. En-tête de la page ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-foreground flex items-center gap-3">
            <CalendarDays className="h-7 w-7 text-forest-600" aria-hidden="true" />
            <span>Planning Conciergerie</span>
          </h1>
          <p className="text-xs sm:text-sm text-foreground-muted mt-1 font-medium">
            Suivi unifié de l'occupation, remises des clés (Check-in) et états des lieux de sortie (Check-out).
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsBlockModalOpen(true)}
          className="btn-action inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-semibold self-start sm:self-auto cursor-pointer"
        >
          <Lock className="h-4 w-4 text-forest-950" aria-hidden="true" />
          <span>Bloquer des dates</span>
        </button>
      </div>

      {/* ── 2. Synthèse KPI ──────────────────────────────────────────────── */}
      <GestionnairePlanningStatsHeader
        checkinsTodayCount={checkinsTodayCount}
        checkoutsTodayCount={checkoutsTodayCount}
        activeStaysCount={activeStaysCount}
        occupancyRate={occupancyRate}
      />

      {/* ── 3. Barre de filtre, recherche et navigation de mois ──────────── */}
      <GestionnairePlanningFilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        logementsList={logements}
      />

      {/* ── Erreurs ──────────────────────────────────────────────────────── */}
      {error && (
        <div
          role="alert"
          className="flex items-center gap-3 rounded-card border border-error-500/20 bg-error-50 p-4 text-xs text-error-700 font-medium"
        >
          <AlertCircle className="h-5 w-5 shrink-0 text-error-600" aria-hidden="true" />
          <span>Impossible de charger les données du planning. Vérifiez votre connexion.</span>
        </div>
      )}

      {/* ── Chargement Skeleton ────────────────────────────────────────── */}
      {isLoading && (
        <div className="rounded-card border border-border bg-background-card p-12 text-center shadow-xs space-y-3">
          <div className="animate-pulse space-y-4 max-w-lg mx-auto">
            <div className="h-6 bg-neutral-200 rounded-pill w-1/2 mx-auto" />
            <div className="h-4 bg-neutral-100 rounded-pill w-3/4 mx-auto" />
            <div className="h-32 bg-neutral-100 rounded-card w-full" />
          </div>
        </div>
      )}

      {/* ── Affichage de la Vue Active ─────────────────────────────────── */}
      {!isLoading && !error && (
        <>
          {viewMode === 'gantt' && (
            <GestionnaireGanttView
              logements={filteredLogements}
              reservations={reservations}
              currentDate={filters.currentDate}
            />
          )}

          {viewMode === 'checkins' && (
            <GestionnaireCheckinsList bookings={reservations} />
          )}

          {viewMode === 'calendar' && (
            <GestionnaireGanttView
              logements={filteredLogements}
              reservations={reservations}
              currentDate={filters.currentDate}
            />
          )}
        </>
      )}

      {/* ── Modal de blocage de dates ───────────────────────────────────── */}
      <GestionnaireBlockDatesModal
        logements={logements}
        isOpen={isBlockModalOpen}
        onClose={() => setIsBlockModalOpen(false)}
      />
    </div>
  );
}
