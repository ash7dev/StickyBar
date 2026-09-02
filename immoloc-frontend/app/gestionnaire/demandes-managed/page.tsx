'use client';

import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, Building2, Sparkles, UserPlus } from 'lucide-react';
import { nestFetch } from '@/lib/nestjs/api-client';
import { GestionnaireDemandesManagedStatsHeader } from '@/features/gestionnaire/components/GestionnaireDemandesManagedStatsHeader';
import {
  GestionnaireDemandesManagedFilterBar,
  type LeadStatusFilter,
} from '@/features/gestionnaire/components/GestionnaireDemandesManagedFilterBar';
import { GestionnaireDemandesManagedTable } from '@/features/gestionnaire/components/GestionnaireDemandesManagedTable';
import {
  GestionnaireDemandeManagedDetailModal,
  type LeadItem,
} from '@/features/gestionnaire/components/GestionnaireDemandeManagedDetailModal';

export default function GestionnaireDemandesManagedPage() {
  const [selectedLead, setSelectedLead] = useState<LeadItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeStatusFilter, setActiveStatusFilter] = useState<LeadStatusFilter>('ALL');

  const queryClient = useQueryClient();

  // Données réelles depuis l'API NestJS
  const { data: leads = [], isLoading, error } = useQuery<LeadItem[]>({
    queryKey: ['gestionnaire', 'demandes-managed'],
    queryFn: () => nestFetch<LeadItem[]>('/api/v1/gestionnaire/demandes-managed'),
  });

  // Mise à jour du statut ou des notes d'un lead
  const handleUpdateStatus = async (id: string, statut: LeadItem['statut'], notes?: string) => {
    try {
      await nestFetch(`/api/v1/gestionnaire/demandes-managed/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ statut, notesGestionnaire: notes }),
      });
      queryClient.invalidateQueries({ queryKey: ['gestionnaire', 'demandes-managed'] });
    } catch (err: any) {
      console.error('Erreur mise à jour statut lead:', err);
    }
  };

  // Conversion d'un lead en bailleur partenaire sous mandat
  const handleConvertLead = async (id: string) => {
    try {
      await nestFetch(`/api/v1/gestionnaire/demandes-managed/${id}/convertir`, {
        method: 'POST',
      });
      queryClient.invalidateQueries({ queryKey: ['gestionnaire', 'demandes-managed'] });
      queryClient.invalidateQueries({ queryKey: ['gestionnaire', 'proprietaires'] });
    } catch (err: any) {
      console.error('Erreur conversion lead:', err);
    }
  };

  // Filtrage combiné (Recherche + Statut)
  const filteredLeads = useMemo(() => {
    return leads.filter((l) => {
      // 1. Recherche texte
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesSearch =
          l.prenom.toLowerCase().includes(q) ||
          l.nom.toLowerCase().includes(q) ||
          l.telephone.toLowerCase().includes(q) ||
          (l.email && l.email.toLowerCase().includes(q)) ||
          (l.ville && l.ville.toLowerCase().includes(q));
        if (!matchesSearch) return false;
      }

      // 2. Filtre statut
      if (activeStatusFilter !== 'ALL') {
        if (l.statut !== activeStatusFilter) return false;
      }

      return true;
    });
  }, [leads, searchQuery, activeStatusFilter]);

  // Comptages KPI
  const newLeadsCount = leads.filter((l) => l.statut === 'NOUVEAU').length;
  const contactedLeadsCount = leads.filter((l) => l.statut === 'CONTACTE').length;
  const convertedLeadsCount = leads.filter((l) => l.statut === 'CONVERTI').length;

  const handleOpenDetail = (lead: LeadItem) => {
    setSelectedLead(lead);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* ── 1. En-tête de la page ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-foreground flex items-center gap-3">
              <UserPlus className="h-7 w-7 text-forest-600" aria-hidden="true" />
              <span>Demandes Klef Managed</span>
            </h1>
            <span className="badge-brand">Offre Sérénité</span>
          </div>
          <p className="text-xs sm:text-sm text-foreground-muted mt-1 font-medium">
            Prospects bailleurs ayant demandé une prise en charge conciergerie 100% déléguée.
          </p>
        </div>
      </div>

      {/* ── Erreur ──────────────────────────────────────────────────────── */}
      {error && (
        <div
          role="alert"
          className="flex items-center gap-3 rounded-card border border-error-500/20 bg-error-50 p-4 text-xs text-error-700 font-medium"
        >
          <AlertCircle className="h-5 w-5 shrink-0 text-error-600" aria-hidden="true" />
          <span>Impossible de charger les demandes Klef Managed. Vérifiez votre connexion.</span>
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
          {/* 2. Synthèse KPI des Demandes */}
          <GestionnaireDemandesManagedStatsHeader
            totalLeads={leads.length}
            newLeadsCount={newLeadsCount}
            contactedLeadsCount={contactedLeadsCount}
            convertedLeadsCount={convertedLeadsCount}
          />

          {/* 3. Barre de Recherche & Filtres */}
          <GestionnaireDemandesManagedFilterBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            activeStatus={activeStatusFilter}
            onStatusChange={setActiveStatusFilter}
          />

          {/* 4. Tableau Interactif des Demandes */}
          <GestionnaireDemandesManagedTable
            leads={filteredLeads}
            onOpenDetail={handleOpenDetail}
            onUpdateStatus={handleUpdateStatus}
            onConvertLead={handleConvertLead}
          />
        </>
      )}

      {/* ── Modal de Détail & Suivi Prospect ──────────────────────────────── */}
      <GestionnaireDemandeManagedDetailModal
        lead={selectedLead}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onUpdateStatus={handleUpdateStatus}
        onConvertLead={handleConvertLead}
      />
    </div>
  );
}
