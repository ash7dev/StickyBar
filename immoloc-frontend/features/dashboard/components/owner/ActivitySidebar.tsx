'use client';

import { QuickActionsSidebar } from './QuickActionsSidebar';
import { ReservationStats } from './ReservationStats';
import { PerformanceCard } from './PerformanceCard';

interface ActivitySidebarProps {
  bookings: any[];
  conversionRate: number;
  activeListings: number;
}

/**
 * Sidebar unifiée regroupant :
 * - Actions rapides (Quick Actions)
 * - Statistiques de réservation
 * - Performance
 *
 * Design premium avec flux vertical cohérent
 */
export function ActivitySidebar({ bookings, conversionRate, activeListings }: ActivitySidebarProps) {
  return (
    <div className="flex flex-col gap-6">
      {/* Stats de réservation */}
      <ReservationStats bookings={bookings} />

      {/* Actions rapides */}
      <QuickActionsSidebar />

      {/* Performance */}
      <PerformanceCard
        bookings={bookings}
        conversionRate={conversionRate}
        activeListings={activeListings}
      />
    </div>
  );
}
