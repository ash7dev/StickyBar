/**
 * Skeleton de chargement pour la liste horizontale de résultats
 */
export function ResultsGridSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <SkeletonCardHorizontal key={i} />
      ))}
    </div>
  );
}

/**
 * Card fantôme horizontale
 */
function SkeletonCardHorizontal() {
  return (
    <div className="flex flex-col sm:flex-row bg-background-card rounded-[24px] overflow-hidden border border-border animate-pulse">
      {/* Image fantôme */}
      <div className="w-full sm:w-[280px] md:w-[320px] lg:w-[350px] shrink-0 aspect-[4/3] sm:aspect-auto sm:min-h-[220px] bg-neutral-200 dark:bg-neutral-800" />

      {/* Contenu fantôme */}
      <div className="flex-1 p-5 sm:p-6 flex flex-col justify-between space-y-4">
        <div className="space-y-3">
          {/* Header row */}
          <div className="flex items-center justify-between">
            <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-28" />
            <div className="h-5 bg-neutral-200 dark:bg-neutral-800 rounded-full w-16" />
          </div>

          {/* Titre */}
          <div className="h-6 bg-neutral-200 dark:bg-neutral-800 rounded w-3/4" />

          {/* Sous-titre */}
          <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-1/2" />

          {/* Chips */}
          <div className="flex gap-2 pt-1">
            <div className="h-6 bg-neutral-200 dark:bg-neutral-800 rounded-full w-20" />
            <div className="h-6 bg-neutral-200 dark:bg-neutral-800 rounded-full w-24" />
            <div className="h-6 bg-neutral-200 dark:bg-neutral-800 rounded-full w-16" />
          </div>
        </div>

        {/* Footer row */}
        <div className="pt-3 border-t border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-neutral-200 dark:bg-neutral-800 rounded-full" />
            <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-16" />
          </div>
          <div className="h-7 bg-neutral-200 dark:bg-neutral-800 rounded w-24" />
        </div>
      </div>
    </div>
  );
}
