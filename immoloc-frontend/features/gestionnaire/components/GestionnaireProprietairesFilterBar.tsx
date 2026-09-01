'use client';

import { Users, Filter } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface Owner {
  id: string;
  prenom: string;
  nom: string;
  logementsCount: number;
  soldeDisponible: number;
}

interface Props {
  owners: Owner[];
  selectedOwnerId: string | null;
  onSelectOwner: (id: string | null) => void;
}

export function GestionnaireProprietairesFilterBar({ owners, selectedOwnerId, onSelectOwner }: Props) {
  return (
    <div className="rounded-card border border-border bg-background-card p-4 sm:p-5 shadow-2xs space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
          <Filter className="h-4 w-4 text-forest-600" aria-hidden="true" />
          <span>Filtrer la Vue par Propriétaire Partenaire</span>
        </div>

        {selectedOwnerId && (
          <button
            type="button"
            onClick={() => onSelectOwner(null)}
            className="text-xs font-semibold text-forest-600 hover:text-forest-700 hover:underline cursor-pointer"
          >
            Réinitialiser le filtre
          </button>
        )}
      </div>

      <div className="no-scrollbar flex items-center gap-2 overflow-x-auto pt-1">
        <button
          type="button"
          onClick={() => onSelectOwner(null)}
          className={cn(
            'inline-flex shrink-0 items-center gap-2 rounded-pill border px-3.5 py-1.5 text-xs font-semibold transition-all duration-150 cursor-pointer',
            selectedOwnerId === null
              ? 'border-forest-700 bg-forest-900 text-neutral-0 shadow-xs'
              : 'border-border bg-background-alt text-foreground-muted hover:bg-neutral-100 hover:text-foreground',
          )}
        >
          <Users className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Tous les propriétaires ({owners.length})</span>
        </button>

        {owners.map((owner) => {
          const isSelected = selectedOwnerId === owner.id;

          return (
            <button
              key={owner.id}
              type="button"
              onClick={() => onSelectOwner(owner.id)}
              className={cn(
                'inline-flex shrink-0 items-center gap-2 rounded-pill border px-3.5 py-1.5 text-xs font-semibold transition-all duration-150 cursor-pointer',
                isSelected
                  ? 'border-forest-700 bg-forest-900 text-neutral-0 shadow-xs'
                  : 'border-border bg-background-alt text-foreground-muted hover:bg-neutral-100 hover:text-foreground',
              )}
            >
              <span>{owner.prenom} {owner.nom}</span>
              <span
                className={cn(
                  'rounded-pill px-2 py-0.5 text-[0.6875rem] font-bold tabular-nums',
                  isSelected ? 'bg-white/20 text-white' : 'bg-background-card text-foreground',
                )}
              >
                {owner.logementsCount} bien{owner.logementsCount > 1 ? 's' : ''}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
