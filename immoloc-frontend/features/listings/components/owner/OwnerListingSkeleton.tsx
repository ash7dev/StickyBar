import { cn } from '@/lib/utils/cn';

interface OwnerListingSkeletonProps {
  viewMode?: 'list' | 'grid';
}

function Skeleton({ className }: { className?: string }) {
  return <div className={cn('bg-background-alt border border-border/60 animate-pulse rounded-card', className)} />;
}

export function OwnerListingSkeleton({ viewMode = 'grid' }: OwnerListingSkeletonProps) {
  if (viewMode === 'list') {
    return (
      <div className="bg-background-card rounded-card border border-border/80 p-4 shadow-2xs space-y-3">
        <div className="flex items-center gap-4">
          <Skeleton className="w-20 h-20 sm:w-24 sm:h-24 rounded-inner shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-24 rounded-pill" />
            <Skeleton className="h-5 w-48 rounded-inner" />
            <Skeleton className="h-3 w-32 rounded-inner" />
          </div>
          <Skeleton className="h-8 w-24 rounded-pill shrink-0 hidden sm:block" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background-card rounded-card border border-border/80 overflow-hidden shadow-2xs space-y-3">
      <Skeleton className="aspect-[16/10] w-full rounded-none" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-3 w-28 rounded-inner" />
        <Skeleton className="h-5 w-full rounded-inner" />
        <div className="pt-3 border-t border-border/60 flex items-center justify-between">
          <Skeleton className="h-6 w-24 rounded-inner" />
          <Skeleton className="h-8 w-20 rounded-pill" />
        </div>
      </div>
    </div>
  );
}
