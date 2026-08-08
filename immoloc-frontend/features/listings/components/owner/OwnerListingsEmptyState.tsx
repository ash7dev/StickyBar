import { Building2, Plus } from 'lucide-react';
import Link from 'next/link';

export function OwnerListingsEmptyState({ hasFilter }: { hasFilter?: boolean }) {
  return (
    <div className="bg-background-card rounded-card border border-border/80 p-8 sm:p-12 text-center shadow-2xs space-y-4 max-w-xl mx-auto my-6">
      <div className="w-14 h-14 rounded-inner bg-forest-950 text-on-inverse-marker border border-action-edge flex items-center justify-center mx-auto shadow-2xs">
        <Building2 className="w-7 h-7 text-on-inverse-marker" />
      </div>

      <div className="space-y-1.5">
        <h3 className="font-display text-lg sm:text-xl font-extrabold text-forest-950">
          {hasFilter ? 'Aucune annonce trouvée avec ce filtre' : 'Aucune annonce publiée'}
        </h3>
        <p className="text-xs sm:text-sm text-foreground-muted max-w-md mx-auto">
          {hasFilter
            ? 'Essayez de changer de filtre pour voir vos autres annonces.'
            : 'Mettez en ligne votre premier bien immobilier et commencez à recevoir des réservations sécurisées dès aujourd\'hui.'}
        </p>
      </div>

      {!hasFilter && (
        <div className="pt-2">
          <Link
            href="/dashboard/annonces/nouvelle"
            className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-pill bg-action hover:bg-action-hover text-on-action font-extrabold text-xs shadow-md transition-all active:scale-95"
          >
            <Plus className="w-4 h-4 text-forest-950" />
            <span>Publier un nouveau bien</span>
          </Link>
        </div>
      )}
    </div>
  );
}
