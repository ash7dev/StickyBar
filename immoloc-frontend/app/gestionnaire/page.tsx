'use client';

import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { nestFetch } from '@/lib/nestjs/api-client';
import { NEST_API } from '@/lib/nestjs/endpoints';
import { AuthUser } from '@/lib/nestjs/types';
import { GestionnaireHeaderBanner } from '@/features/gestionnaire/components/GestionnaireHeaderBanner';
import { GestionnaireKpiGrid } from '@/features/gestionnaire/components/GestionnaireKpiGrid';
import { GestionnaireProprietairesFilterBar } from '@/features/gestionnaire/components/GestionnaireProprietairesFilterBar';
import { GestionnaireRevenueChart } from '@/features/gestionnaire/components/GestionnaireRevenueChart';
import { GestionnaireCheckinsList } from '@/features/gestionnaire/components/GestionnaireCheckinsList';
import { GestionnaireManagedListingsPreview } from '@/features/gestionnaire/components/GestionnaireManagedListingsPreview';
import { GestionnaireRepartitionsChart } from '@/features/gestionnaire/components/GestionnaireRepartitionsChart';
import { GestionnaireProprietairesOverview } from '@/features/gestionnaire/components/GestionnaireProprietairesOverview';
import { GestionnaireStatutsAnnoncesChart } from '@/features/gestionnaire/components/GestionnaireStatutsAnnoncesChart';
import { GestionnairePerformanceParZone } from '@/features/gestionnaire/components/GestionnairePerformanceParZone';
import { GestionnaireHealthScoreCard } from '@/features/gestionnaire/components/GestionnaireHealthScoreCard';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface DashboardStatsData {
  kpis: {
    totalLogements: number;
    logementsActifs: number;
    totalProprietaires: number;
    reservationsDuMois: number;
    caDuMois: number;
    netProprietairesDuMois: number;
    commissionKlefDuMois: number;
    tauxOccupation: number;
    healthScore: number;
  };
  statutsAnnonces: Array<{
    statut: string;
    label: string;
    count: number;
    color: string;
  }>;
  repartitionZones: Array<{
    zone: string;
    count: number;
    prixMoyen: number;
  }>;
  prochainsCheckins: Array<{
    id: string;
    code: string;
    dateDebut: string;
    dateFin: string;
    statut: string;
    prixTotal: number;
    netProprietaire: number;
    logementTitle: string;
    logementVille: string;
    ownerName: string;
    travelerName: string;
    travelerPhone?: string;
  }>;
  proprietairesTop: Array<{
    id: string;
    prenom: string;
    nom: string;
    telephone: string;
    email: string | null;
    logementsCount: number;
    soldeDisponible: number;
  }>;
  topListings: Array<{
    id: string;
    titre: string;
    ville: string;
    type: string;
    prixBase: number;
    statut: string;
    photoUrl?: string | null;
    ownerName: string;
  }>;
  revenusMensuels: Array<{
    mois: string;
    ca: number;
    netProprietaire: number;
    commissionKlef: number;
  }>;
  repartitionTypes: Array<{
    type: string;
    count: number;
    label: string;
  }>;
}

export default function GestionnaireDashboardPage() {
  const [selectedOwnerId, setSelectedOwnerId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Utilisateur connecté
  const { data: user } = useQuery<AuthUser>({
    queryKey: ['me'],
    queryFn: () => nestFetch<AuthUser>(NEST_API.AUTH.ME),
  });

  // Données du tableau de bord
  const {
    data: stats,
    isLoading,
    error,
    refetch,
  } = useQuery<DashboardStatsData>({
    queryKey: ['gestionnaire', 'dashboard'],
    queryFn: () => nestFetch<DashboardStatsData>(NEST_API.GESTIONNAIRE.DASHBOARD),
  });

  // Filtrage des données par propriétaire sélectionné
  const filteredBookings = useMemo(() => {
    if (!stats) return [];
    if (!selectedOwnerId) return stats.prochainsCheckins;
    const ownerObj = stats.proprietairesTop.find((o) => o.id === selectedOwnerId);
    if (!ownerObj) return stats.prochainsCheckins;
    const fullName = `${ownerObj.prenom} ${ownerObj.nom}`.toLowerCase();
    return stats.prochainsCheckins.filter((b) => b.ownerName.toLowerCase() === fullName);
  }, [stats, selectedOwnerId]);

  const filteredOwners = useMemo(() => {
    if (!stats) return [];
    if (!selectedOwnerId) return stats.proprietairesTop;
    return stats.proprietairesTop.filter((o) => o.id === selectedOwnerId);
  }, [stats, selectedOwnerId]);

  const filteredListings = useMemo(() => {
    if (!stats) return [];
    if (!selectedOwnerId) return stats.topListings;
    const ownerObj = stats.proprietairesTop.find((o) => o.id === selectedOwnerId);
    if (!ownerObj) return stats.topListings;
    const fullName = `${ownerObj.prenom} ${ownerObj.nom}`.toLowerCase();
    return stats.topListings.filter((l) => l.ownerName.toLowerCase() === fullName);
  }, [stats, selectedOwnerId]);

  return (
    <div className="space-y-8 pb-12">
      {/* ── 1. Bannière d'accueil ─────────────────────────────────────────── */}
      <GestionnaireHeaderBanner
        userPrenom={user?.prenom}
        userNom={user?.nom}
      />

      {/* ── Erreur ────────────────────────────────────────────────────────── */}
      {error && (
        <div className="rounded-card border border-error-500/20 bg-error-50 p-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-xs text-error-700 font-medium">
            <AlertCircle className="h-5 w-5 shrink-0 text-error-600" aria-hidden="true" />
            <span>Impossible de charger les données du tableau de bord conciergerie.</span>
          </div>
          <button
            type="button"
            onClick={() => refetch()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-pill bg-error-600 text-white text-xs font-semibold shadow-xs hover:bg-error-700 transition-colors cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            Réessayer
          </button>
        </div>
      )}

      {/* ── Chargement Skeleton ────────────────────────────────────────────── */}
      {isLoading && (
        <div className="space-y-6 animate-pulse" aria-busy="true">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 rounded-card bg-neutral-100" />
            ))}
          </div>
          <div className="h-64 rounded-card bg-neutral-100" />
        </div>
      )}

      {!isLoading && stats && (
        <>
          {/* ── 2. Grille KPI principales ───────────────────────────────────── */}
          <GestionnaireKpiGrid kpis={stats.kpis} />

          {/* ── 3. Barre de filtre par Propriétaire ──────────────────────────── */}
          {stats.proprietairesTop.length > 0 && (
            <GestionnaireProprietairesFilterBar
              owners={stats.proprietairesTop}
              selectedOwnerId={selectedOwnerId}
              onSelectOwner={setSelectedOwnerId}
            />
          )}

          {/* ── 4. Ligne 1 : Historique Revenus & Santé ────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
            <div className="lg:col-span-2">
              <GestionnaireRevenueChart data={stats.revenusMensuels} />
            </div>
            <div className="space-y-6 flex flex-col justify-between">
              <GestionnaireHealthScoreCard
                healthScore={stats.kpis.healthScore}
                logementsActifs={stats.kpis.logementsActifs}
                totalLogements={stats.kpis.totalLogements}
              />
              <GestionnaireStatutsAnnoncesChart
                statuts={stats.statutsAnnonces}
                totalLogements={stats.kpis.totalLogements}
              />
            </div>
          </div>

          {/* ── 5. Ligne 2 : Séjours Imminents & Zones Géographiques ────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
            <div className="lg:col-span-2">
              <GestionnaireCheckinsList bookings={filteredBookings} />
            </div>
            <div>
              <GestionnairePerformanceParZone
                zones={stats.repartitionZones}
                totalLogements={stats.kpis.totalLogements}
              />
            </div>
          </div>

          {/* ── 6. Ligne 3 : Biens sous Gestion & Répartition du Parc (Même hauteur exacte!) ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
            <div className="lg:col-span-2">
              <GestionnaireManagedListingsPreview listings={filteredListings} />
            </div>
            <div className="lg:col-span-1">
              <GestionnaireRepartitionsChart
                data={stats.repartitionTypes}
                totalLogements={stats.kpis.totalLogements}
              />
            </div>
          </div>

          {/* ── 7. Reversements & Portefeuilles des Propriétaires ─────────────── */}
          <GestionnaireProprietairesOverview
            owners={filteredOwners}
            onRefresh={() => {
              queryClient.invalidateQueries({ queryKey: ['gestionnaire', 'dashboard'] });
            }}
          />
        </>
      )}
    </div>
  );
}
