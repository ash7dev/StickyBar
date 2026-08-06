import { cn } from '@/lib/utils/cn';

function Skeleton({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={cn(
        'bg-background-alt border border-border/60 animate-pulse rounded-card',
        className
      )}
      style={style}
    />
  );
}

export default function DashboardLoading() {
  return (
    <div className="space-y-6 sm:space-y-8 pb-12">

      {/* ── Skeleton Mobile (2x2 KPIs + 6 Actions Rapides) ── */}
      <div className="block sm:hidden space-y-6">
        {/* Squelette MobileKpiGrid */}
        <div className="grid grid-cols-2 gap-3.5">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>

        {/* Squelette MobileQuickActionsMenu */}
        <div className="space-y-3 pt-2">
          <Skeleton className="h-4 w-32 rounded-pill" />
          <div className="space-y-2.5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </div>
      </div>

      {/* ── Skeleton Desktop ── */}
      <div className="hidden sm:block space-y-8">
        {/* HostWelcomeBanner Skeleton */}
        <Skeleton className="h-44 w-full" />

        {/* KPIs Skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-36 w-full" />
          ))}
        </div>

        {/* RevenueChart & WalletSnapshot Skeleton */}
        <div className="grid lg:grid-cols-[1fr_380px] gap-6">
          <Skeleton className="h-96 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>

        {/* Operations & Sidebar Skeleton */}
        <div className="grid lg:grid-cols-[1fr_380px] gap-6">
          <div className="space-y-6">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-80 w-full" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-80 w-full" />
          </div>
        </div>

        {/* Calendar Skeleton */}
        <Skeleton className="h-80 w-full" />
      </div>

    </div>
  );
}
