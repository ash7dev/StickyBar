'use client';

import Link from 'next/link';
import { Calendar, Search, PlusCircle, Building2, RotateCcw } from 'lucide-react';

interface Props {
  hasFilter?: boolean;
  onResetFilter?: () => void;
}

export function OwnerReservationsEmptyState({ hasFilter = false, onResetFilter }: Props) {
  return (
    <div className="mx-auto my-6 max-w-lg space-y-6 rounded-2xl border border-border bg-background-card p-8 text-center shadow-sm sm:p-12">
      {/* Badge d'icône avec dégradé doux */}
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-forest-100 bg-forest-50 text-forest-700 shadow-sm sm:h-20 sm:w-20">
        {hasFilter ? (
          <Search className="h-8 w-8 text-forest-700" aria-hidden="true" />
        ) : (
          <Calendar className="h-8 w-8 text-forest-700" aria-hidden="true" />
        )}
      </div>

      {/* Titre & Description */}
      <div className="space-y-2">
        <h3 className="font-display text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          {hasFilter ? 'Aucune réservation trouvée' : 'Vos réservations apparaîtront ici'}
        </h3>
        <p className="mx-auto max-w-md text-xs leading-relaxed text-foreground-muted sm:text-sm">
          {hasFilter
            ? 'Aucune réservation ne correspond aux critères ou filtres sélectionnés. Essayez de réinitialiser la recherche.'
            : 'Dès qu’un voyageur effectue une réservation sur l’un de vos logements publiés, elle apparaîtra instantanément ici avec le détail du séjour et des fonds sous séquestre.'}
        </p>
      </div>

      {/* Boutons d'action */}
      {hasFilter ? (
        onResetFilter && (
          <div className="pt-2 flex justify-center">
            <button
              type="button"
              onClick={onResetFilter}
              className="inline-flex items-center gap-2 rounded-pill border border-border bg-background-alt px-6 py-3 text-xs font-semibold text-foreground transition-colors hover:bg-background-card"
            >
              <RotateCcw className="h-4 w-4 text-foreground-muted" />
              Réinitialiser les filtres
            </button>
          </div>
        )
      ) : (
        <div className="pt-2 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/dashboard/logements/nouveau"
            className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-pill bg-action px-6 py-3.5 text-xs font-semibold text-on-action shadow-action transition-[background-color,box-shadow,transform] hover:bg-action-hover active:scale-[0.98]"
          >
            <PlusCircle className="h-4 w-4" />
            Publier un logement
          </Link>
          <Link
            href="/dashboard/logements"
            className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-pill border border-border bg-background-card px-6 py-3.5 text-xs font-semibold text-foreground transition-colors hover:bg-background-alt"
          >
            <Building2 className="h-4 w-4 text-foreground-muted" />
            Voir mes logements
          </Link>
        </div>
      )}
    </div>
  );
}
