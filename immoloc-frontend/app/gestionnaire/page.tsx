'use client';

import { Building } from 'lucide-react';

export default function GestionnaireDashboardPage() {
  return (
    <div className="space-y-6">
      {/* En-tête épuré */}
      <div>
        <span className="hidden sm:inline-flex items-center gap-1 rounded-pill border border-border bg-background-alt px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-foreground-muted mb-2">
          <Building className="h-3 w-3" aria-hidden="true" />
          Conciergerie & Mandats
        </span>
        <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
          Tableau de bord Gestionnaire
        </h1>
        <p className="text-sm text-foreground-muted mt-1">
          Bienvenue sur votre portail de gestion d’annonces et suivi des séjours.
        </p>
      </div>

      {/* Zone de contenu épurée (Page vide) */}
      <div className="rounded-card border border-dashed border-border bg-background-card p-12 text-center shadow-xs">
        <div className="mx-auto w-12 h-12 rounded-inner bg-forest-50 text-forest-700 flex items-center justify-center mb-4">
          <Building className="w-6 h-6" aria-hidden="true" />
        </div>
        <h2 className="text-base sm:text-lg font-semibold text-foreground">Portail Gestionnaire Initialisé</h2>
        <p className="text-xs sm:text-sm text-foreground-muted mt-1 max-w-md mx-auto leading-relaxed">
          Votre espace gestionnaire est prêt. Les modules de suivi des arrivées, annonces sous mandat et réservations s’afficheront ici.
        </p>
      </div>
    </div>
  );
}
