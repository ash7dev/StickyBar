'use client';

import { useEffect, useState, useCallback } from 'react';
import { AdminShell } from '@/components/admin/admin-shell';
import { AdminReservationsHeaderBar, ReservationStatusTab } from '@/features/admin/components/reservations/AdminReservationsHeaderBar';
import { AdminReservationsTable, ReservationItem } from '@/features/admin/components/reservations/AdminReservationsTable';
import { AdminReservationDetailModal } from '@/features/admin/components/reservations/AdminReservationDetailModal';
import { AdminReservationForceCancelModal } from '@/features/admin/components/reservations/AdminReservationForceCancelModal';
import { AdminReservationsPagination } from '@/features/admin/components/reservations/AdminReservationsPagination';
import { adminApi } from '@/lib/nestjs';

export default function AdminReservationsPage() {
  const [reservations, setReservations] = useState<ReservationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ReservationStatusTab>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 });

  // Modals state
  const [inspectReservation, setInspectReservation] = useState<ReservationItem | null>(null);
  const [forceCancelItem, setForceCancelItem] = useState<ReservationItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Chargement principal des réservations
  const loadReservations = useCallback(async (page = 1) => {
    setIsLoading(true);
    try {
      const params: Parameters<typeof adminApi.listReservations>[0] = {
        page,
        limit: 20,
        ...(activeTab !== 'ALL' && { statut: activeTab }),
        ...(searchQuery.trim() && { search: searchQuery.trim() }),
      };

      const result = await adminApi.listReservations(params);
      if (result?.data) {
        setReservations(result.data);
        setMeta(result.meta);
      } else if (Array.isArray(result)) {
        setReservations(result);
        setMeta({ total: result.length, page: 1, limit: 20, totalPages: 1 });
      }
    } catch {
      showToast("Erreur lors du chargement des réservations");
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, searchQuery]);

  useEffect(() => {
    setCurrentPage(1);
    loadReservations(1);
  }, [loadReservations]);

  // Compteurs globaux pour les onglets
  const [globalCounts, setGlobalCounts] = useState({
    all: 0,
    pending: 0,
    confirmed: 0,
    checkedIn: 0,
    completed: 0,
    cancelled: 0,
  });

  const loadGlobalCounts = useCallback(async () => {
    try {
      const [all, pending, confirmed, checkedIn, completed, cancelled] = await Promise.allSettled([
        adminApi.listReservations({ limit: 1 }),
        adminApi.listReservations({ statut: 'PENDING', limit: 1 }),
        adminApi.listReservations({ statut: 'CONFIRMED', limit: 1 }),
        adminApi.listReservations({ statut: 'CHECKED_IN', limit: 1 }),
        adminApi.listReservations({ statut: 'COMPLETED', limit: 1 }),
        adminApi.listReservations({ statut: 'CANCELLED', limit: 1 }),
      ]);

      setGlobalCounts({
        all: all.status === 'fulfilled' ? all.value.meta?.total ?? 0 : 0,
        pending: pending.status === 'fulfilled' ? pending.value.meta?.total ?? 0 : 0,
        confirmed: confirmed.status === 'fulfilled' ? confirmed.value.meta?.total ?? 0 : 0,
        checkedIn: checkedIn.status === 'fulfilled' ? checkedIn.value.meta?.total ?? 0 : 0,
        completed: completed.status === 'fulfilled' ? completed.value.meta?.total ?? 0 : 0,
        cancelled: cancelled.status === 'fulfilled' ? cancelled.value.meta?.total ?? 0 : 0,
      });
    } catch {
      // Silently fail
    }
  }, []);

  useEffect(() => {
    loadGlobalCounts();
  }, [loadGlobalCounts]);

  // Action d'annulation forcée
  const handleConfirmCancel = async (reservation: ReservationItem, raison: string, tauxRemboursement: number) => {
    try {
      await adminApi.forceCancelReservation(reservation.id, raison, tauxRemboursement);
      showToast(`Réservation pour "${reservation.logement?.titre ?? "le logement"}" annulée avec succès. Remboursement à ${tauxRemboursement}%.`);
      loadReservations(currentPage);
      loadGlobalCounts();
    } catch {
      showToast("Erreur lors de l'annulation administrative de la réservation");
    }
  };

  return (
    <AdminShell urgentCount={globalCounts.pending}>
      <div className="space-y-6">
        {/* Toast */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 rounded-card border border-forest-300 bg-forest-900 px-4 py-3 text-xs font-semibold text-neutral-0 shadow-xl animate-fade-in">
            {toastMessage}
          </div>
        )}

        {/* 1. Header Bar with Status Counters & Search */}
        <AdminReservationsHeaderBar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onRefresh={() => { loadReservations(currentPage); loadGlobalCounts(); }}
          isRefreshing={isLoading}
          counts={globalCounts}
        />

        {/* 2. Reservations Table */}
        <AdminReservationsTable
          reservations={reservations}
          isLoading={isLoading}
          activeTab={activeTab}
          onInspect={setInspectReservation}
          onForceCancel={setForceCancelItem}
        />

        {/* 3. Server Pagination */}
        <AdminReservationsPagination
          page={currentPage}
          totalPages={meta.totalPages}
          total={meta.total}
          onPageChange={(page) => { setCurrentPage(page); loadReservations(page); }}
        />

        {/* 4. Detail Modal */}
        <AdminReservationDetailModal
          reservation={inspectReservation}
          isOpen={Boolean(inspectReservation)}
          onClose={() => setInspectReservation(null)}
          onForceCancel={setForceCancelItem}
        />

        {/* 5. Force Cancel Modal */}
        <AdminReservationForceCancelModal
          reservation={forceCancelItem}
          isOpen={Boolean(forceCancelItem)}
          onClose={() => setForceCancelItem(null)}
          onConfirmCancel={handleConfirmCancel}
        />
      </div>
    </AdminShell>
  );
}
