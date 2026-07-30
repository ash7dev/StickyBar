export function ListingCardSkeleton() {
  return (
    <div className="block rounded-[var(--radius-card)] overflow-hidden bg-background-card border border-border">
      {/* Image skeleton */}
      <div className="relative aspect-[4/3] overflow-hidden bg-neutral-100 animate-pulse">
        <div className="w-full h-full bg-neutral-200" />
      </div>

      {/* Content skeleton */}
      <div className="p-4 space-y-3">
        {/* Title skeleton */}
        <div className="h-5 bg-neutral-200 rounded animate-pulse w-3/4" />

        {/* Location skeleton */}
        <div className="h-4 bg-neutral-200 rounded animate-pulse w-1/2" />

        {/* Rating skeleton */}
        <div className="flex items-center gap-3">
          <div className="h-4 bg-neutral-200 rounded animate-pulse w-12" />
          <div className="h-3 bg-neutral-200 rounded animate-pulse w-16" />
        </div>

        {/* Price skeleton */}
        <div className="h-6 bg-neutral-200 rounded animate-pulse w-32" />
      </div>
    </div>
  );
}
