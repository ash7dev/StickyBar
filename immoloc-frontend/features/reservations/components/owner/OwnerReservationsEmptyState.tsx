'use client';

import { Calendar, Search } from 'lucide-react';

export function OwnerReservationsEmptyState({ hasFilter = false }: { hasFilter?: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-background-card rounded-card border border-border/80 shadow-2xs space-y-4">
      <div className="w-16 h-16 rounded-inner bg-forest-950 text-lime-400 border border-lime-400/30 flex items-center justify-center shadow-md">
        {hasFilter ? <Search className="w-8 h-8 text-lime-400" /> : <Calendar className="w-8 h-8 text-lime-400" />}
      </div>

      <div className="space-y-1.5 max-w-sm">
        <h3 className="font-display text-lg font-extrabold text-forest-950">
          {hasFilter ? 'Aucune réservation trouvée' : 'Aucune réservation pour le moment'}
        </h3>
        <p className="text-xs text-foreground-muted font-medium leading-relaxed">
          {hasFilter
            ? 'Aucune réservation ne correspond à vos filtres. Essayez de sélectionner un autre statut ou de modifier votre recherche.'
            : 'Les séjours réservés par vos voyageurs sur vos logements publiés s\'afficheront ici automatiquement.'}
        </p>
      </div>
    </div>
  );
}
