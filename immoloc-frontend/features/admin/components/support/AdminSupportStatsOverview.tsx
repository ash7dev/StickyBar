'use client';

import { Headphones, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface AdminSupportStatsOverviewProps {
  tickets: any[];
}

export function AdminSupportStatsOverview({ tickets = [] }: AdminSupportStatsOverviewProps) {
  const totalCount = tickets.length;
  const openCount = tickets.filter((t) => t.statut === 'OUVERT' || t.statut === 'EN_COURS').length;
  const urgentCount = tickets.filter((t) => (t.priorite === 'URGENTE' || t.priorite === 'HAUTE') && t.statut !== 'RESOLU' && t.statut !== 'FERME').length;
  const resolvedCount = tickets.filter((t) => t.statut === 'RESOLU' || t.statut === 'FERME').length;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* 1. Total Tickets */}
      <div className="rounded-card border border-border bg-background-card p-4 shadow-2xs space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-foreground-muted">Total Demandes</span>
          <span className="flex h-8 w-8 items-center justify-center rounded-inner bg-forest-50 border border-forest-200 text-forest-700">
            <Headphones className="h-4 w-4" />
          </span>
        </div>
        <p className="font-display text-2xl font-bold text-foreground">{totalCount}</p>
        <p className="text-[0.6875rem] text-foreground-muted">Tickets enregistrés au support</p>
      </div>

      {/* 2. Tickets Ouverts & En Cours */}
      <div className="rounded-card border border-border bg-background-card p-4 shadow-2xs space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-foreground-muted">En Attente de Traitement</span>
          <span className="flex h-8 w-8 items-center justify-center rounded-inner bg-sand-100 border border-sand-300 text-sand-800">
            <Clock className="h-4 w-4" />
          </span>
        </div>
        <p className="font-display text-2xl font-bold text-sand-900">{openCount}</p>
        <p className="text-[0.6875rem] text-foreground-muted">Tickets nécessitant une intervention</p>
      </div>

      {/* 3. Tickets Urgents */}
      <div className="rounded-card border border-border bg-background-card p-4 shadow-2xs space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-foreground-muted">Priorité Haute & Urgentes</span>
          <span className="flex h-8 w-8 items-center justify-center rounded-inner bg-error-50 border border-error-200 text-error-700">
            <AlertTriangle className="h-4 w-4" />
          </span>
        </div>
        <p className="font-display text-2xl font-bold text-error-700">{urgentCount}</p>
        <p className="text-[0.6875rem] text-foreground-muted">Demandes critiques prioritaires</p>
      </div>

      {/* 4. Tickets Résolus */}
      <div className="rounded-card border border-border bg-background-card p-4 shadow-2xs space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-foreground-muted">Tickets Résolus</span>
          <span className="flex h-8 w-8 items-center justify-center rounded-inner bg-forest-50 border border-forest-200 text-forest-700">
            <CheckCircle2 className="h-4 w-4" />
          </span>
        </div>
        <p className="font-display text-2xl font-bold text-forest-800">{resolvedCount}</p>
        <p className="text-[0.6875rem] text-foreground-muted">Dossiers clôturés avec succès</p>
      </div>
    </div>
  );
}
