'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { AdminShell } from '@/components/admin/admin-shell';
import { AdminListingsHeaderBar, ListingStatusTab } from '@/features/admin/components/listings/AdminListingsHeaderBar';
import { AdminListingsTable, ListingItem } from '@/features/admin/components/listings/AdminListingsTable';
import { AdminListingDetailModal } from '@/features/admin/components/listings/AdminListingDetailModal';
import { AdminListingRejectModal } from '@/features/admin/components/listings/AdminListingRejectModal';
import { AdminListingsPagination } from '@/features/admin/components/listings/AdminListingsPagination';
import { adminApi } from '@/lib/nestjs';

export default function AdminAnnoncesPage() {
  const [allListings, setAllListings] = useState<ListingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ListingStatusTab>('PENDING_REVIEW');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [meta, setMeta] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });

  // Modals
  const [inspectListing, setInspectListing] = useState<ListingItem | null>(null);
  const [rejectListing, setRejectListing] = useState<ListingItem | null>(null);
  const [suspendListing, setSuspendListing] = useState<ListingItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Load all listings (no server-side status filter to count all statuses)
  const loadListings = useCallback(async (page = 1) => {
    setIsLoading(true);
    try {
      // Load all statuses at once to compute global counts
      const result = await adminApi.listListings(
        activeTab !== 'ALL' ? { statut: activeTab, page } : { page }
      );
      if (result?.data) {
        setAllListings(result.data);
        setMeta(result.meta);
      }
    } catch {
      showToast('Erreur lors du chargement des annonces');
    } finally {
      setIsLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    setCurrentPage(1);
    loadListings(1);
  }, [activeTab, loadListings]);

  // Global counts — we need a separate call for each status to get accurate global counts
  const [globalCounts, setGlobalCounts] = useState({ all: 0, pendingReview: 0, published: 0, rejected: 0, suspended: 0 });

  const loadGlobalCounts = useCallback(async () => {
    try {
      const [all, pending, published, rejected, suspended] = await Promise.allSettled([
        adminApi.listListings(),
        adminApi.listListings({ statut: 'PENDING_REVIEW' }),
        adminApi.listListings({ statut: 'PUBLISHED' }),
        adminApi.listListings({ statut: 'REJECTED' }),
        adminApi.listListings({ statut: 'SUSPENDED' }),
      ]);

      setGlobalCounts({
        all: all.status === 'fulfilled' ? all.value.meta.total : 0,
        pendingReview: pending.status === 'fulfilled' ? pending.value.meta.total : 0,
        published: published.status === 'fulfilled' ? published.value.meta.total : 0,
        rejected: rejected.status === 'fulfilled' ? rejected.value.meta.total : 0,
        suspended: suspended.status === 'fulfilled' ? suspended.value.meta.total : 0,
      });
    } catch {
      // Silently fail — counts will show 0
    }
  }, []);

  useEffect(() => {
    loadGlobalCounts();
  }, [loadGlobalCounts]);

  // Search filter (client-side on current page data)
  const filteredListings = useMemo(() => {
    if (!searchQuery.trim()) return allListings;
    const q = searchQuery.toLowerCase();
    return allListings.filter((l) => {
      const titre = (l.titre ?? '').toLowerCase();
      const ville = (l.ville ?? '').toLowerCase();
      const ownerName = `${l.proprietaire?.prenom ?? ''} ${l.proprietaire?.nom ?? ''}`.toLowerCase();
      const ownerEmail = (l.proprietaire?.email ?? '').toLowerCase();
      return titre.includes(q) || ville.includes(q) || ownerName.includes(q) || ownerEmail.includes(q);
    });
  }, [allListings, searchQuery]);

  // Actions
  const handlePublish = async (listing: ListingItem) => {
    try {
      await adminApi.publishListing(listing.id);
      showToast(`« ${listing.titre} » publiée avec succès !`);
      loadListings(currentPage);
      loadGlobalCounts();
    } catch {
      showToast('Erreur lors de la publication');
    }
  };

  const handleConfirmReject = async (listing: ListingItem, raison: string) => {
    try {
      await adminApi.rejectListing(listing.id, raison);
      showToast(`« ${listing.titre} » rejetée.`);
      loadListings(currentPage);
      loadGlobalCounts();
    } catch {
      showToast('Erreur lors du rejet');
    }
  };

  const handleConfirmSuspend = async (listing: ListingItem, raison: string) => {
    try {
      await adminApi.suspendListing(listing.id, raison);
      showToast(`« ${listing.titre} » suspendue.`);
      loadListings(currentPage);
      loadGlobalCounts();
    } catch {
      showToast('Erreur lors de la suspension');
    }
  };

  const handleUnsuspend = async (listing: ListingItem) => {
    try {
      await adminApi.unsuspendListing(listing.id);
      showToast(`« ${listing.titre} » réactivée !`);
      loadListings(currentPage);
      loadGlobalCounts();
    } catch {
      showToast('Erreur lors de la réactivation');
    }
  };

  const handleToggleFeatured = async (listing: ListingItem) => {
    try {
      const newState = !listing.isFeatured;
      await adminApi.setFeaturedListing(listing.id, newState, newState ? 30 : undefined);
      showToast(newState ? `« ${listing.titre} » mise en vedette !` : `« ${listing.titre} » retirée de la vedette.`);
      loadListings(currentPage);
    } catch {
      showToast('Erreur lors de la mise en vedette');
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    loadListings(page);
  };

  return (
    <AdminShell urgentCount={globalCounts.pendingReview}>
      <div className="space-y-6">
        {/* Toast */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 rounded-card border border-forest-300 bg-forest-900 px-4 py-3 text-xs font-semibold text-neutral-0 shadow-xl animate-fade-in">
            {toastMessage}
          </div>
        )}

        {/* 1. Header Bar */}
        <AdminListingsHeaderBar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onRefresh={() => { loadListings(currentPage); loadGlobalCounts(); }}
          isRefreshing={isLoading}
          counts={globalCounts}
        />

        {/* 2. Listings Table */}
        <AdminListingsTable
          listings={filteredListings}
          isLoading={isLoading}
          onInspect={setInspectListing}
          onPublish={handlePublish}
          onReject={setRejectListing}
          onSuspend={setSuspendListing}
          onUnsuspend={handleUnsuspend}
          onToggleFeatured={handleToggleFeatured}
        />

        {/* 3. Pagination */}
        <AdminListingsPagination
          page={currentPage}
          totalPages={meta.totalPages}
          total={meta.total}
          onPageChange={handlePageChange}
        />

        {/* 4. Detail Modal */}
        <AdminListingDetailModal
          listing={inspectListing}
          isOpen={Boolean(inspectListing)}
          onClose={() => setInspectListing(null)}
          onPublish={handlePublish}
          onReject={setRejectListing}
          onSuspend={setSuspendListing}
          onUnsuspend={handleUnsuspend}
        />

        {/* 5. Reject Modal */}
        <AdminListingRejectModal
          listing={rejectListing}
          isOpen={Boolean(rejectListing)}
          onClose={() => setRejectListing(null)}
          onConfirmReject={handleConfirmReject}
          isSuspension={false}
        />

        {/* 6. Suspend Modal */}
        <AdminListingRejectModal
          listing={suspendListing}
          isOpen={Boolean(suspendListing)}
          onClose={() => setSuspendListing(null)}
          onConfirmReject={handleConfirmSuspend}
          isSuspension={true}
        />
      </div>
    </AdminShell>
  );
}
