/**
 * Loading UI pour /explorer/[slug]
 * Ce skeleton s'affiche pour :
 * - Les pages de détail de listing (UUID)
 * - Les pages de ville (ex: /explorer/dakar)
 *
 * Note: On utilise le layout de détail de listing car c'est le plus fréquent
 */
export default function ListingDetailLoading() {
  return (
    <div className="min-h-screen bg-canvas py-8 px-4 sm:px-6 lg:px-10">
      <div className="max-w-6xl mx-auto space-y-10">

        {/* Header Mosaïque de Photos Skeleton */}
        <div className="grid grid-cols-4 gap-2 h-[420px] rounded-[2rem] overflow-hidden animate-pulse">
          {/* Grande image gauche */}
          <div className="col-span-4 md:col-span-2 row-span-2 bg-neutral-200 dark:bg-neutral-800" />

          {/* 4 petites images droite (desktop uniquement) */}
          <div className="hidden md:block bg-neutral-200 dark:bg-neutral-800" />
          <div className="hidden md:block bg-neutral-200 dark:bg-neutral-800" />
          <div className="hidden md:block bg-neutral-200 dark:bg-neutral-800" />
          <div className="hidden md:block bg-neutral-200 dark:bg-neutral-800" />
        </div>

        {/* Layout 2 Colonnes */}
        <div className="grid lg:grid-cols-[1fr_380px] gap-8 items-start">

          {/* Colonne gauche - Spécifications */}
          <div className="space-y-8 animate-pulse">
            {/* Titre */}
            <div className="space-y-3">
              <div className="h-8 bg-neutral-200 dark:bg-neutral-800 rounded w-3/4" />
              <div className="h-5 bg-neutral-200 dark:bg-neutral-800 rounded w-1/2" />
            </div>

            {/* Chips caractéristiques */}
            <div className="flex gap-2">
              <div className="h-8 w-24 bg-neutral-200 dark:bg-neutral-800 rounded-pill" />
              <div className="h-8 w-28 bg-neutral-200 dark:bg-neutral-800 rounded-pill" />
              <div className="h-8 w-20 bg-neutral-200 dark:bg-neutral-800 rounded-pill" />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <div className="h-6 bg-neutral-200 dark:bg-neutral-800 rounded w-32" />
              <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-full" />
              <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-full" />
              <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-5/6" />
            </div>

            {/* Équipements */}
            <div className="space-y-3">
              <div className="h-6 bg-neutral-200 dark:bg-neutral-800 rounded w-32" />
              <div className="grid grid-cols-2 gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-10 bg-neutral-200 dark:bg-neutral-800 rounded" />
                ))}
              </div>
            </div>
          </div>

          {/* Colonne droite - Widget de réservation */}
          <div className="sticky top-24">
            <div className="bg-white dark:bg-neutral-900 rounded-[2rem] p-6 shadow-[0_16px_50px_rgba(0,0,0,0.12)] animate-pulse space-y-4">
              {/* Prix */}
              <div className="h-8 bg-neutral-200 dark:bg-neutral-800 rounded w-40" />

              {/* Calendrier */}
              <div className="h-64 bg-neutral-200 dark:bg-neutral-800 rounded-xl" />

              {/* Voyageurs */}
              <div className="h-12 bg-neutral-200 dark:bg-neutral-800 rounded-pill" />

              {/* Bouton réserver */}
              <div className="h-12 bg-neutral-200 dark:bg-neutral-800 rounded-pill" />

              {/* Récapitulatif prix */}
              <div className="space-y-2 pt-4 border-t border-border">
                <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-full" />
                <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-5/6" />
                <div className="h-5 bg-neutral-200 dark:bg-neutral-800 rounded w-3/4 mt-3" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
