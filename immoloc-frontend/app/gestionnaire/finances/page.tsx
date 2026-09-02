'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, ArrowUpRight, Wallet } from 'lucide-react';
import { nestFetch } from '@/lib/nestjs/api-client';
import { NEST_API } from '@/lib/nestjs/endpoints';
import { GestionnaireFinancesStatsHeader } from '@/features/gestionnaire/components/GestionnaireFinancesStatsHeader';
import { GestionnaireFinancesFilterBar } from '@/features/gestionnaire/components/GestionnaireFinancesFilterBar';
import { GestionnaireRevenueChart } from '@/features/gestionnaire/components/GestionnaireRevenueChart';
import { GestionnaireReversementsTable } from '@/features/gestionnaire/components/GestionnaireReversementsTable';
import { GestionnaireTransactionsHistoryTable, type TransactionItem } from '@/features/gestionnaire/components/GestionnaireTransactionsHistoryTable';
import { GestionnaireDemandeVirementModal } from '@/features/gestionnaire/components/GestionnaireDemandeVirementModal';
import { GestionnaireFacturationExportModal } from '@/features/gestionnaire/components/GestionnaireFacturationExportModal';

export default function GestionnaireFinancesPage() {
  const [selectedOwnerForWithdrawal, setSelectedOwnerForWithdrawal] = useState<any | null>(null);
  const [isWithdrawalModalOpen, setIsWithdrawalModalOpen] = useState(false);
  const [isStatementModalOpen, setIsStatementModalOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('ALL');

  // Récupération des données financières du dashboard conciergerie
  const { data, isLoading, error } = useQuery<any>({
    queryKey: ['gestionnaire', 'dashboard'],
    queryFn: () => nestFetch<any>(NEST_API.GESTIONNAIRE.DASHBOARD),
  });

  const kpis = data?.kpis;
  const proprietaires = data?.proprietairesTop || [];
  const revenusMensuels = data?.revenusMensuels || [];
  const prochainsCheckins = data?.prochainsCheckins || [];
  const recentTransactionsFromBackend = data?.recentTransactions || [];

  // Transformation des réservations réelles de la base API en liste de transactions financières
  const realTransactions: TransactionItem[] = useMemo(() => {
    if (recentTransactionsFromBackend && recentTransactionsFromBackend.length > 0) {
      return recentTransactionsFromBackend;
    }

    if (prochainsCheckins && prochainsCheckins.length > 0) {
      return prochainsCheckins.map((r: any, idx: number) => ({
        id: r.id || `tx-${idx}`,
        reference: r.code || `RES-${10000 + idx}`,
        type: 'ENCAISSEMENT' as const,
        libelle: `Réservation locataire (${r.travelerName || 'Voyageur'})`,
        logementTitre: r.logementTitle || 'Bien conciergerie',
        ownerName: r.ownerName,
        montant: Number(r.prixTotal || 0),
        date: new Date(r.dateDebut || Date.now()).toLocaleDateString('fr-FR'),
        methode: 'Wave / Mobile Money',
        statut: 'COMPLETED' as const,
      }));
    }

    return [];
  }, [recentTransactionsFromBackend, prochainsCheckins]);

  // Filtrage des transactions selon la recherche
  const filteredTransactions = useMemo(() => {
    if (!searchQuery.trim()) return realTransactions;
    const q = searchQuery.toLowerCase();
    return realTransactions.filter(
      (t) =>
        t.reference.toLowerCase().includes(q) ||
        t.libelle.toLowerCase().includes(q) ||
        (t.logementTitre && t.logementTitre.toLowerCase().includes(q)) ||
        (t.ownerName && t.ownerName.toLowerCase().includes(q)),
    );
  }, [realTransactions, searchQuery]);

  // Calcul du solde total des portefeuilles des bailleurs sous mandat
  const totalSoldeWallets = useMemo(() => {
    return proprietaires.reduce((sum: number, p: any) => sum + Number(p.soldeDisponible || 0), 0);
  }, [proprietaires]);

  const handleOpenWithdrawalForOwner = (owner: any) => {
    setSelectedOwnerForWithdrawal(owner);
    setIsWithdrawalModalOpen(true);
  };

  const handleOpenGlobalWithdrawal = () => {
    if (proprietaires.length > 0) {
      setSelectedOwnerForWithdrawal(proprietaires[0]);
    } else {
      setSelectedOwnerForWithdrawal({
        id: 'concierge',
        prenom: 'Gestionnaire',
        nom: 'Conciergerie',
        telephone: '',
        email: '',
        soldeDisponible: kpis?.commissionKlefDuMois || 0,
      });
    }
    setIsWithdrawalModalOpen(true);
  };

  // Export CSV natif dans le navigateur
  const handleExportCSV = () => {
    const headers = ['Reference', 'Date', 'Type', 'Libelle', 'Logement', 'Bailleur', 'Montant FCFA', 'Methode', 'Statut'];
    const rows = filteredTransactions.map((t) => [
      t.reference,
      t.date,
      t.type,
      `"${t.libelle.replace(/"/g, '""')}"`,
      `"${(t.logementTitre || '').replace(/"/g, '""')}"`,
      `"${(t.ownerName || '').replace(/"/g, '""')}"`,
      t.montant,
      t.methode,
      t.statut,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `finances_conciergerie_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* ── 1. En-tête de la page ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-foreground flex items-center gap-3">
            <Wallet className="h-7 w-7 text-forest-600" aria-hidden="true" />
            <span>Finances & Commissions Conciergerie</span>
          </h1>
          <p className="text-xs sm:text-sm text-foreground-muted mt-1 font-medium">
            Suivi du chiffre d'affaires, reversements aux bailleurs partenaires et gestion des virements.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenGlobalWithdrawal}
          className="btn-action inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-semibold self-start sm:self-auto cursor-pointer"
        >
          <ArrowUpRight className="h-4 w-4 text-forest-950" aria-hidden="true" />
          <span>Effectuer un virement</span>
        </button>
      </div>

      {/* ── Erreur ──────────────────────────────────────────────────────── */}
      {error && (
        <div
          role="alert"
          className="flex items-center gap-3 rounded-card border border-error-500/20 bg-error-50 p-4 text-xs text-error-700 font-medium"
        >
          <AlertCircle className="h-5 w-5 shrink-0 text-error-600" aria-hidden="true" />
          <span>Impossible de charger les statistiques financières. Vérifiez votre connexion.</span>
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
          {/* 2. Synthèse KPI Financiers */}
          <GestionnaireFinancesStatsHeader
            caDuMois={kpis?.caDuMois || 0}
            netProprietairesDuMois={kpis?.netProprietairesDuMois || 0}
            commissionKlefDuMois={kpis?.commissionKlefDuMois || 0}
            totalProprietairesCount={kpis?.totalProprietaires || proprietaires.length}
            totalSoldeWallets={totalSoldeWallets}
          />

          {/* 3. Tableau des Reversements Bailleurs Partenaires (Demandes de virement Wave / OM / Banque) */}
          <GestionnaireReversementsTable
            proprietaires={proprietaires}
            onOpenWithdrawal={handleOpenWithdrawalForOwner}
          />

          {/* 4. Barre de Filtres & Recherche & Export CSV / Décompte */}
          <GestionnaireFinancesFilterBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedMonth={selectedMonth}
            onMonthChange={setSelectedMonth}
            onExportCSV={handleExportCSV}
            onOpenStatementModal={() => setIsStatementModalOpen(true)}
          />

          {/* 5. Graphique d'Évolution des Revenus */}
          <GestionnaireRevenueChart data={revenusMensuels} />

          {/* 6. Historique détaillé des transactions & flux */}
          <GestionnaireTransactionsHistoryTable transactions={filteredTransactions} />
        </>
      )}

      {/* ── Modales ─────────────────────────────────────────────────────── */}
      <GestionnaireDemandeVirementModal
        owner={selectedOwnerForWithdrawal}
        isOpen={isWithdrawalModalOpen}
        onClose={() => setIsWithdrawalModalOpen(false)}
      />

      <GestionnaireFacturationExportModal
        isOpen={isStatementModalOpen}
        onClose={() => setIsStatementModalOpen(false)}
        proprietaires={proprietaires}
      />
    </div>
  );
}
