'use client';

import Link from 'next/link';
import { Calendar, Search, PlusCircle, Building2, RotateCcw, ShieldCheck, ClipboardCheck } from 'lucide-react';

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
          <button
            type="button"
            onClick={onResetFilter}
            className="inline-flex items-center gap-2 rounded-pill border border-border bg-background-alt px-5 py-2.5 text-xs font-semibold text-foreground transition-colors hover:bg-background-card"
          >
            <RotateCcw className="h-4 w-4 text-foreground-muted" />
            Réinitialiser les filtres
          </button>
        )
      ) : (
        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/dashboard/logements/nouveau"
            className="inline-flex items-center justify-center gap-2 rounded-pill bg-action px-6 py-3 text-xs font-semibold text-on-action shadow-action transition-[background-color,box-shadow,transform] hover:bg-action-hover active:scale-[0.98]"
          >
            <PlusCircle className="h-4 w-4" />
            Publier un logement
          </Link>
          <Link
            href="/dashboard/logements"
            className="inline-flex items-center justify-center gap-2 rounded-pill border border-border bg-background-card px-5 py-3 text-xs font-semibold text-foreground transition-colors hover:bg-background-alt"
          >
            <Building2 className="h-4 w-4 text-foreground-muted" />
            Voir mes logements
          </Link>
        </div>
      )}

      {/* Badges de rassurance */}
      {!hasFilter && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-border text-left">
          <div className="flex items-start gap-2.5 p-3 rounded-xl border border-border/60 bg-background-alt/50">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-forest-50 text-forest-700">
              <ShieldCheck className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-foreground">Séquestre garanti</p>
              <p className="text-[11px] text-foreground-muted leading-tight mt-0.5">Les acomptes sont bloqués avant chaque arrivée.</p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-3 rounded-xl border border-border/60 bg-background-alt/50">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-forest-50 text-forest-700">
              <ClipboardCheck className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-foreground">États des lieux</p>
              <p className="text-[11px] text-foreground-muted leading-tight mt-0.5">Effectuez les vérifications en 1 clic sur mobile.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
