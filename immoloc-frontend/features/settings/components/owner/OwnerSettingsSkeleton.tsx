export function OwnerSettingsSkeleton() {
  return (
    <div className="space-y-6 pb-12 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex items-center gap-3.5 pb-4 border-b border-border/70">
        <div className="w-10 h-10 rounded-inner bg-background-alt" />
        <div className="space-y-2">
          <div className="h-6 w-48 bg-background-alt rounded-pill" />
          <div className="h-3.5 w-80 bg-background-alt rounded-pill" />
        </div>
      </div>

      {/* Hero Skeleton */}
      <div className="section-inverse p-8 space-y-4 opacity-80">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-inner bg-forest-800/80" />
          <div className="space-y-2.5">
            <div className="h-7 w-48 bg-forest-800/80 rounded-pill" />
            <div className="h-4 w-32 bg-forest-800/80 rounded-pill" />
          </div>
        </div>
      </div>

      {/* Cards Skeletons */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-64 bg-background-card rounded-card border border-border" />
        <div className="h-64 bg-background-card rounded-card border border-border" />
        <div className="lg:col-span-2 h-56 bg-background-card rounded-card border border-border" />
      </div>
    </div>
  );
}
