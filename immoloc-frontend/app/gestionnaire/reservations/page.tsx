'use client';

import { KeyRound } from 'lucide-react';

export default function GestionnaireReservationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
          Réservations
        </h1>
        <p className="text-sm text-foreground-muted mt-1">
          Historique et gestion des réservations sous votre mandat.
        </p>
      </div>

      <div className="rounded-card border border-dashed border-border bg-background-card p-12 text-center shadow-xs">
        <div className="mx-auto w-12 h-12 rounded-inner bg-forest-50 text-forest-700 flex items-center justify-center mb-4">
          <KeyRound className="w-6 h-6" aria-hidden="true" />
        </div>
        <h2 className="text-base sm:text-lg font-semibold text-foreground">Aucune réservation sous gestion</h2>
        <p className="text-xs sm:text-sm text-foreground-muted mt-1 max-w-md mx-auto leading-relaxed">
          Les réservations enregistrées sur vos logements gérés s’afficheront ici.
        </p>
      </div>
    </div>
  );
}
