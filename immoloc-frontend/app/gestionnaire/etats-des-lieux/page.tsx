'use client';

import { ClipboardCheck } from 'lucide-react';

export default function GestionnaireEtatsDesLieuxPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
          États des lieux & Inspections
        </h1>
        <p className="text-sm text-foreground-muted mt-1">
          Rapports d’entrée et de sortie, relevés de compteurs et contrôle des équipements.
        </p>
      </div>

      <div className="rounded-card border border-dashed border-border bg-background-card p-12 text-center shadow-xs">
        <div className="mx-auto w-12 h-12 rounded-inner bg-forest-50 text-forest-700 flex items-center justify-center mb-4">
          <ClipboardCheck className="w-6 h-6" aria-hidden="true" />
        </div>
        <h2 className="text-base sm:text-lg font-semibold text-foreground">Aucun état des lieux enregistré</h2>
        <p className="text-xs sm:text-sm text-foreground-muted mt-1 max-w-md mx-auto leading-relaxed">
          Les rapports d’inspection numérique avant et après séjour apparaîtront ici.
        </p>
      </div>
    </div>
  );
}
