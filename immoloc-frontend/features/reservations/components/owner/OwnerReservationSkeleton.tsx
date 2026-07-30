'use client';

export function OwnerReservationSkeleton({ viewMode = 'list' }: { viewMode?: 'grid' | 'list' }) {
  if (viewMode === 'list') {
    return (
      <div className="bg-background-card rounded-card border border-border/80 p-4 sm:p-5 animate-pulse flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1 w-full sm:w-auto">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-inner bg-background-alt shrink-0" />
          <div className="space-y-2 flex-1">
            <div className="h-4 bg-background-alt rounded-pill w-24" />
            <div className="h-5 bg-background-alt rounded-inner w-3/4" />
            <div className="h-4 bg-background-alt rounded-pill w-1/2" />
          </div>
        </div>
        <div className="h-12 w-36 bg-background-alt rounded-inner shrink-0" />
      </div>
    );
  }

  return (
    <div className="bg-background-card rounded-card border border-border/80 overflow-hidden animate-pulse space-y-4">
      <div className="h-44 bg-background-alt w-full" />
      <div className="p-4 space-y-3">
        <div className="h-5 bg-background-alt rounded-inner w-3/4" />
        <div className="h-4 bg-background-alt rounded-pill w-1/2" />
        <div className="h-9 bg-background-alt rounded-pill w-full mt-4" />
      </div>
    </div>
  );
}
