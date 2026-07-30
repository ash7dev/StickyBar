'use client';

export function ParametresSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">

      {/* En-tête de la page */}
      <div className="flex items-center gap-3.5 pb-4 border-b border-border/70">
        <div className="w-10 h-10 rounded-inner bg-neutral-200 shrink-0" />
        <div className="space-y-2 flex-1">
          <div className="h-7 w-56 rounded-pill bg-neutral-300" />
          <div className="h-3.5 w-80 max-w-full rounded-pill bg-neutral-200" />
        </div>
      </div>

      {/* 1. Hero Skeleton */}
      <div className="relative rounded-card border border-forest-900/40 bg-forest-950/90 p-6 sm:p-8 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-inner bg-forest-900 border border-lime-400/10 shrink-0" />
            <div className="space-y-2.5 flex-1">
              <div className="h-7 w-48 rounded-pill bg-forest-900" />
              <div className="h-3.5 w-64 rounded-pill bg-forest-900/60" />
              <div className="flex gap-2 pt-1">
                <div className="h-6 w-28 rounded-pill bg-forest-900" />
                <div className="h-6 w-32 rounded-pill bg-forest-900" />
              </div>
            </div>
          </div>
          <div className="h-11 w-44 rounded-pill bg-lime-400/20 shrink-0" />
        </div>
      </div>

      {/* 2. Grille de Cartes Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Info Card Skeleton */}
        <div className="bg-background-card rounded-card border border-border/80 p-5 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-border/60">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-inner bg-neutral-200 shrink-0" />
              <div className="space-y-1.5">
                <div className="h-4 w-36 rounded-pill bg-neutral-300" />
                <div className="h-3 w-24 rounded-pill bg-neutral-200" />
              </div>
            </div>
            <div className="h-8 w-24 rounded-pill bg-neutral-200" />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-16 rounded-inner bg-background-alt border border-border/60 p-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-inner bg-neutral-200 shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-2.5 w-16 rounded-pill bg-neutral-300" />
                  <div className="h-3.5 w-28 rounded-pill bg-neutral-200" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* KYC Card Skeleton */}
        <div className="bg-background-card rounded-card border border-border/80 p-5 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-border/60">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-inner bg-neutral-200 shrink-0" />
              <div className="space-y-1.5">
                <div className="h-4 w-32 rounded-pill bg-neutral-300" />
                <div className="h-3 w-28 rounded-pill bg-neutral-200" />
              </div>
            </div>
            <div className="h-7 w-20 rounded-pill bg-neutral-200" />
          </div>
          <div className="h-24 rounded-inner bg-forest-950/80 p-4 flex items-start gap-3.5 border border-forest-800" />
          <div className="h-20 rounded-inner bg-background-alt border border-border/80" />
          <div className="h-11 rounded-pill bg-neutral-200 w-full" />
        </div>

        {/* Actions Card Skeleton */}
        <div className="lg:col-span-2 bg-background-card rounded-card border border-border/80 p-5 space-y-4 shadow-2xs">
          <div className="flex items-center gap-3 pb-3 border-b border-border/60">
            <div className="w-9 h-9 rounded-inner bg-neutral-200 shrink-0" />
            <div className="space-y-1.5">
              <div className="h-4 w-44 rounded-pill bg-neutral-300" />
              <div className="h-3 w-32 rounded-pill bg-neutral-200" />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="h-16 rounded-inner bg-background-alt border border-border/60 p-3.5" />
            <div className="h-16 rounded-inner bg-background-alt border border-border/60 p-3.5" />
          </div>
          <div className="pt-3 border-t border-border/60 grid sm:grid-cols-2 gap-3">
            <div className="h-11 rounded-pill bg-neutral-200" />
            <div className="h-11 rounded-pill bg-neutral-200" />
          </div>
        </div>

      </div>

    </div>
  );
}
