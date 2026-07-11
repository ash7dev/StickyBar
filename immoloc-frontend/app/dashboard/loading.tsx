import { cn } from '@/lib/utils/cn';

/* ═══════════════════════════════════════════════════════════════════════════
   Dashboard Loading Skeleton — Responsive Mobile + Desktop
   ═══════════════════════════════════════════════════════════════════════════ */

function Skeleton({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={cn(
        'bg-neutral-100 dark:bg-neutral-800 animate-pulse rounded-2xl',
        className
      )}
      style={style}
    />
  );
}

/* ─── KPI Cards Skeleton (4 cards) ──────────────────────────────────────── */
function KpiSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="bg-background-card border border-border rounded-2xl p-4 sm:p-5 space-y-3"
        >
          {/* Icon */}
          <Skeleton className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl" />

          {/* Value */}
          <Skeleton className="h-7 sm:h-8 w-24 sm:w-28" />

          {/* Label */}
          <Skeleton className="h-3 sm:h-4 w-20 sm:w-24" />

          {/* Trend indicator */}
          <div className="flex items-center gap-2 pt-1">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-3 w-12" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Wallet + Revenue Chart Row ───────────────────────────────────────── */
function WalletRevenueSkeleton() {
  return (
    <div className="grid lg:grid-cols-[420px_1fr] gap-4 sm:gap-6">
      {/* Wallet Card */}
      <div className="bg-background-card border border-border rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-8 w-8 rounded-lg" />
        </div>

        {/* Balance */}
        <Skeleton className="h-10 sm:h-12 w-40 sm:w-48" />

        {/* Breakdown */}
        <div className="space-y-3 pt-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>

        {/* Button */}
        <Skeleton className="h-11 w-full rounded-xl mt-4" />
      </div>

      {/* Revenue Chart */}
      <div className="bg-background-card border border-border rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-8 w-20 rounded-lg" />
        </div>

        {/* Chart bars */}
        <div className="flex items-end justify-between gap-2 h-48 sm:h-64 pt-4">
          {[60, 80, 45, 90, 70, 85, 65, 75, 50, 95, 70, 80].map((height, i) => (
            <Skeleton
              key={i}
              className="flex-1 rounded-t-lg"
              style={{ height: `${height}%` }}
            />
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 pt-4 border-t border-border">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-28" />
        </div>
      </div>
    </div>
  );
}

/* ─── Recent Bookings + Activity Sidebar ───────────────────────────────── */
function ActivitySkeleton() {
  return (
    <div className="grid lg:grid-cols-[1fr_420px] gap-4 sm:gap-6">
      {/* Left Column */}
      <div className="space-y-4 sm:space-y-6">
        {/* Recent Bookings */}
        <div className="bg-background-card border border-border rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-9 w-24 rounded-lg" />
          </div>

          {/* Booking items */}
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex items-center gap-4 p-3 sm:p-4 bg-background-alt rounded-xl"
              >
                <Skeleton className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32 sm:w-40" />
                  <Skeleton className="h-3 w-24 sm:w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-8 w-20 rounded-lg shrink-0 hidden sm:block" />
              </div>
            ))}
          </div>
        </div>

        {/* Pending Actions */}
        <div className="bg-background-card border border-border rounded-2xl p-5 sm:p-6 space-y-4">
          <Skeleton className="h-6 w-36" />

          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="p-4 bg-background-alt rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-6 w-6 rounded-full" />
                </div>
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-9 w-28 rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="space-y-4 sm:space-y-6">
        {/* Quick Actions */}
        <div className="bg-background-card border border-border rounded-2xl p-5 sm:p-6 space-y-3">
          <Skeleton className="h-5 w-32" />

          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="p-4 bg-background-alt rounded-xl space-y-2 text-center"
              >
                <Skeleton className="w-10 h-10 mx-auto rounded-lg" />
                <Skeleton className="h-3 w-20 mx-auto" />
              </div>
            ))}
          </div>
        </div>

        {/* Stats Card */}
        <div className="bg-background-card border border-border rounded-2xl p-5 sm:p-6 space-y-4">
          <Skeleton className="h-5 w-28" />

          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-12" />
                </div>
                <Skeleton className="h-2 w-full rounded-full" />
              </div>
            ))}
          </div>
        </div>

        {/* Performance Card */}
        <div className="bg-background-card border border-border rounded-2xl p-5 sm:p-6 space-y-4">
          <Skeleton className="h-5 w-32" />

          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-8 h-8 rounded-full" />
                  <Skeleton className="h-4 w-28" />
                </div>
                <Skeleton className="h-5 w-16" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Calendar Skeleton ─────────────────────────────────────────────────── */
function CalendarSkeleton() {
  return (
    <div className="bg-background-card border border-border rounded-2xl p-5 sm:p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Skeleton className="h-6 w-48" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <Skeleton className="h-9 w-32 rounded-lg" />
          <Skeleton className="h-9 w-9 rounded-lg" />
        </div>
      </div>

      {/* Calendar Grid - Desktop */}
      <div className="hidden lg:block">
        <div className="grid grid-cols-7 gap-2 mb-2">
          {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day) => (
            <div key={day} className="text-center py-2">
              <Skeleton className="h-4 w-8 mx-auto" />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 35 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-lg" />
          ))}
        </div>
      </div>

      {/* Calendar List - Mobile */}
      <div className="lg:hidden space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-3 p-3 bg-background-alt rounded-xl">
            <Skeleton className="w-12 h-12 rounded-lg shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="w-16 h-6 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Main Loading Component
   ═══════════════════════════════════════════════════════════════════════════ */

export default function DashboardLoading() {
  return (
    <div className="space-y-5 sm:space-y-6 pb-10 sm:pb-20">
      {/* KPI Cards */}
      <KpiSkeleton />

      {/* Wallet + Revenue */}
      <WalletRevenueSkeleton />

      {/* Recent Activity + Sidebar */}
      <ActivitySkeleton />

      {/* Calendar */}
      <CalendarSkeleton />
    </div>
  );
}
