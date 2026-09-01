'use client';

import { Building2 } from 'lucide-react';

export default function GestionnaireAnnoncesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
          Annonces gérées
        </h1>
        <p className="text-sm text-foreground-muted mt-1">
          Liste des logements sous votre gestion conciergerie.
        </p>
      </div>

      <div className="rounded-card border border-dashed border-border bg-background-card p-12 text-center shadow-xs">
        <div className="mx-auto w-12 h-12 rounded-inner bg-forest-50 text-forest-700 flex items-center justify-center mb-4">
          <Building2 className="w-6 h-6" aria-hidden="true" />
        </div>
        <h2 className="text-base sm:text-lg font-semibold text-foreground">Aucune annonce gérée pour le moment</h2>
        <p className="text-xs sm:text-sm text-foreground-muted mt-1 max-w-md mx-auto leading-relaxed">
          Les logements délégués par des propriétaires s’afficheront ici.
        </p>
      </div>
    </div>
  );
}
