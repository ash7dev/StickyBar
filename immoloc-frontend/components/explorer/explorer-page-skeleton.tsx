/**
 * Skeleton de chargement complet pour la page Explorer
 * Affiche tous les composants en état de chargement :
 * - FilterBar skeleton
 * - ResultsHeader skeleton
 * - ResultsGrid skeleton (liste + carte)
 */
export function ExplorerPageSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="w-full max-w-[1920px] mx-auto pl-2 sm:pl-4 pr-4 sm:pr-6 py-6 pb-16">

        {/* FilterBar Skeleton */}
        <div className="mb-4">
          <FilterBarSkeleton />
        </div>

        {/* ResultsHeader Skeleton */}
        <ResultsHeaderSkeleton />

        {/* Layout Desktop : 2 colonnes (Liste + Carte) */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_480px] xl:grid-cols-[1fr_560px] gap-6">

          {/* Colonne gauche : Liste de résultats */}
          <div className="flex flex-col gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonCardHorizontal key={i} />
            ))}
          </div>

          {/* Colonne droite : Carte (masquée sur mobile) */}
          <aside className="hidden lg:block sticky top-[calc(var(--navbar-height,80px)+1rem)] h-[calc(100dvh-var(--navbar-height,80px)-2rem)] rounded-[24px] bg-neutral-100 dark:bg-neutral-800 border border-border overflow-hidden animate-pulse" />

        </div>
      </div>
    </div>
  );
}

/**
 * FilterBar Skeleton - Barre de filtres en état de chargement
 */
function FilterBarSkeleton() {
  return (
    <div className="sticky top-[var(--navbar-height,80px)] z-30 backdrop-blur-xl bg-background/85 border-b border-border/50 -mx-2 sm:-mx-4 px-2 sm:px-4 py-3">
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
        {/* Bouton "Tous les filtres" skeleton */}
        <div className="h-9 w-32 bg-neutral-200 dark:bg-neutral-800 rounded-pill animate-pulse shrink-0" />

        {/* Pastilles de filtres skeleton */}
        <div className="h-9 w-24 bg-neutral-200 dark:bg-neutral-800 rounded-pill animate-pulse shrink-0" />
        <div className="h-9 w-28 bg-neutral-200 dark:bg-neutral-800 rounded-pill animate-pulse shrink-0" />
        <div className="h-9 w-20 bg-neutral-200 dark:bg-neutral-800 rounded-pill animate-pulse shrink-0" />
        <div className="h-9 w-24 bg-neutral-200 dark:bg-neutral-800 rounded-pill animate-pulse shrink-0" />
      </div>
    </div>
  );
}

/**
 * ResultsHeader Skeleton - En-tête avec compteur et tri
 */
function ResultsHeaderSkeleton() {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
      {/* Compteur skeleton */}
      <div className="h-7 w-48 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse" />

      {/* Tri skeleton */}
      <div className="flex items-center gap-2">
        <div className="h-4 w-16 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse" />
        <div className="h-9 w-32 bg-neutral-200 dark:bg-neutral-800 rounded-pill animate-pulse" />
      </div>
    </div>
  );
}

/**
 * Card fantôme horizontale (même style que ResultsGridSkeleton)
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
