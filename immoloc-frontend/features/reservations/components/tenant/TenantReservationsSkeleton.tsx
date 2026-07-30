'use client';

export function TenantReservationItemSkeleton() {
  return (
    <>
      {/* Skeleton Rendu Mobile */}
      <div className="block sm:hidden bg-background-card rounded-card border border-border p-4 space-y-3 animate-pulse shadow-2xs relative overflow-hidden">
        <div className="flex items-center justify-between border-b border-border/60 pb-2">
          <div className="h-4 w-24 bg-neutral-200 rounded-pill" />
          <div className="h-4 w-16 bg-neutral-100 rounded-pill" />
        </div>
        <div className="flex items-start gap-3.5">
          <div className="w-24 h-24 rounded-inner bg-neutral-200 shrink-0" />
          <div className="flex-1 space-y-2 pt-1">
            <div className="h-4 bg-neutral-200 rounded-pill w-4/5" />
            <div className="h-3 bg-neutral-100 rounded-pill w-3/5" />
            <div className="h-3.5 bg-neutral-200 rounded-pill w-2/3" />
          </div>
        </div>
        <div className="h-12 bg-neutral-200 rounded-inner w-full" />
      </div>

      {/* Skeleton Rendu Desktop */}
      <div className="hidden sm:block bg-background-card rounded-card border border-border p-4 shadow-2xs animate-pulse relative overflow-hidden">
        <div className="flex gap-4 items-center">
          <div className="w-56 h-[145px] rounded-inner bg-neutral-200 shrink-0" />
          <div className="flex-1 space-y-3">
            <div className="flex justify-between items-center border-b border-border/60 pb-2">
              <div className="h-4 w-28 bg-neutral-200 rounded-pill" />
              <div className="h-3 w-20 bg-neutral-100 rounded-pill" />
            </div>
            <div className="h-5 bg-neutral-200 rounded-pill w-2/3" />
            <div className="h-10 bg-neutral-100 rounded-inner w-full" />
            <div className="h-11 bg-neutral-200 rounded-inner w-full" />
          </div>
        </div>
      </div>
    </>
  );
}

export function TenantReservationsPageSkeleton() {
  return (
    <div className="space-y-6">
      {/* Skeleton Cartes Statistiques */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-20 bg-background-card rounded-card border border-border p-4 shadow-2xs animate-pulse space-y-2">
            <div className="flex justify-between items-center">
              <div className="h-3 w-20 bg-neutral-200 rounded-pill" />
              <div className="w-7 h-7 rounded-inner bg-neutral-200" />
            </div>
            <div className="h-6 w-24 bg-neutral-200 rounded-pill" />
          </div>
        ))}
      </div>

      {/* Skeleton Barre de Filtres */}
      <div className="h-11 bg-background-alt rounded-pill border border-border p-1.5 animate-pulse" />

      {/* Skeleton Liste des Réservations */}
      <div className="flex flex-col gap-3 sm:gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <TenantReservationItemSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
