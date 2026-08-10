'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { AdminShell } from '@/components/admin/admin-shell';
import { AdminLogementsHeaderBar, LogementCatalogTab } from '@/features/admin/components/logements/AdminLogementsHeaderBar';
import { AdminLogementsQuickFilters, LogementQuickFilterPreset } from '@/features/admin/components/logements/AdminLogementsQuickFilters';
import { AdminLogementsTable, LogementCatalogItem } from '@/features/admin/components/logements/AdminLogementsTable';
import { AdminLogementDetailModal } from '@/features/admin/components/logements/AdminLogementDetailModal';
import { AdminLogementSuspendModal } from '@/features/admin/components/logements/AdminLogementSuspendModal';
import { AdminLogementsPagination } from '@/features/admin/components/logements/AdminLogementsPagination';
import { adminApi } from '@/lib/nestjs';

export default function AdminLogementsCatalogPage() {
  const [allListings, setAllListings] = useState<LogementCatalogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<LogementCatalogTab>('ALL');
  const [activePreset, setActivePreset] = useState<LogementQuickFilterPreset>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [meta, setMeta] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });

  // Modals
  const [inspectListing, setInspectListing] = useState<LogementCatalogItem | null>(null);
  const [rejectListing, setRejectListing] = useState<LogementCatalogItem | null>(null);
  const [suspendListing, setSuspendListing] = useState<LogementCatalogItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Chargement des logements du parc immobilier
  const loadListings = useCallback(async (page = 1) => {
    setIsLoading(true);
    try {
      const params: Parameters<typeof adminApi.listListings>[0] = {
        page,
        limit: 20,
        ...(activeTab !== 'ALL' && activeTab !== 'FEATURED' && { statut: activeTab }),
      };

      const result = await adminApi.listListings(params);
      if (result?.data) {
        setAllListings(result.data);
        setMeta(result.meta);
      }
    } catch {
      showToast("Erreur lors du chargement des logements");
    } finally {
      setIsLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    setCurrentPage(1);
    loadListings(1);
  }, [loadListings]);

  // Statistiques globales
  const [globalCounts, setGlobalCounts] = useState({ all: 0, pendingReview: 0, published: 0, rejected: 0, suspended: 0, featured: 0 });

  const loadGlobalCounts = useCallback(async () => {
    try {
      const [all, pending, published, rejected, suspended] = await Promise.allSettled([
        adminApi.listListings(),
        adminApi.listListings({ statut: 'PENDING_REVIEW' }),
        adminApi.listListings({ statut: 'PUBLISHED' }),
        adminApi.listListings({ statut: 'REJECTED' }),
        adminApi.listListings({ statut: 'SUSPENDED' }),
      ]);

      const allData = all.status === 'fulfilled' ? all.value.data ?? [] : [];
      const featuredCount = allData.filter((l: LogementCatalogItem) => l.isFeatured).length;

      setGlobalCounts({
        all: all.status === 'fulfilled' ? all.value.meta?.total ?? allData.length : 0,
        pendingReview: pending.status === 'fulfilled' ? pending.value.meta?.total ?? 0 : 0,
        published: published.status === 'fulfilled' ? published.value.meta?.total ?? 0 : 0,
        rejected: rejected.status === 'fulfilled' ? rejected.value.meta?.total ?? 0 : 0,
        suspended: suspended.status === 'fulfilled' ? suspended.value.meta?.total ?? 0 : 0,
        featured: featuredCount,
      });
    } catch {
      // Silently fail
    }
  }, []);

  useEffect(() => {
    loadGlobalCounts();
  }, [loadGlobalCounts]);

  // Filtre recherche dynamique & raccordements presets
  const filteredListings = useMemo(() => {
    let result = allListings;

    if (activeTab === 'FEATURED') {
      result = result.filter((l) => l.isFeatured);
    }

    if (typeFilter) {
      result = result.filter((l) => l.type === typeFilter);
    }

    if (activePreset === 'INSTANT_BOOKING') {
      result = result.filter((l) => l.isInstantBooking);
    } else if (activePreset === 'WITH_DEPOSIT') {
      result = result.filter((l) => (l.acomptePourcentage ?? 30) > 0);
    } else if (activePreset === 'FEATURED') {
      result = result.filter((l) => l.isFeatured);
    } else if (activePreset === 'FLAGGED') {
      result = result.filter((l) => (l.nbNonConformitesAnnonce ?? 0) > 0);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((l) => {
        const titre = (l.titre ?? '').toLowerCase();
        const ville = (l.ville ?? '').toLowerCase();
        const quartier = (l.quartier ?? '').toLowerCase();
        const ownerName = `${l.proprietaire?.prenom ?? ''} ${l.proprietaire?.nom ?? ''}`.toLowerCase();
        const ownerEmail = (l.proprietaire?.email ?? '').toLowerCase();
        return titre.includes(q) || ville.includes(q) || quartier.includes(q) || ownerName.includes(q) || ownerEmail.includes(q);
      });
    }

    return result;
  }, [allListings, activeTab, typeFilter, activePreset, searchQuery]);

  // Exportation CSV
  const handleExportCsv = () => {
    if (filteredListings.length === 0) {
      showToast("Aucun logement à exporter");
      return;
    }

    const headers = ["ID", "Titre", "Type", "Ville", "Quartier", "Prix Nuit Base (XOF)", "Acompte (%)", "Chambres", "Sdb", "Capacité", "Propriétaire", "Statut", "Vedette", "Créé le"];
    const rows = filteredListings.map((l) => [
      l.id,
      `"${l.titre ?? ""}"`,
      l.type,
      `"${l.ville ?? ""}"`,
      `"${l.quartier ?? ""}"`,
      l.prixBase,
      l.acomptePourcentage ?? 30,
      l.nombreChambres ?? 1,
      l.nombreSallesBain ?? 1,
      l.capaciteMax ?? 1,
      `"${l.proprietaire?.prenom ?? ""} ${l.proprietaire?.nom ?? ""}"`,
      l.statut,
      l.isFeatured ? "Oui" : "Non",
      l.creeLe ? new Date(l.creeLe).toLocaleDateString("fr-FR") : "",
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `klef_parc_immobilier_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast("Catalogue immobilier exporté en CSV avec succès !");
  };

  // Reset filters
  const handleClearFilters = () => {
    setActiveTab('ALL');
    setActivePreset('ALL');
    setSearchQuery('');
    setTypeFilter('');
  };

  const hasActiveFilters = activeTab !== 'ALL' || activePreset !== 'ALL' || Boolean(searchQuery.trim()) || Boolean(typeFilter);

  // Actions d'administration
  const handlePublish = async (listing: LogementCatalogItem) => {
    try {
      await adminApi.publishListing(listing.id);
      showToast(`« ${listing.titre} » validé et publié !`);
      loadListings(currentPage);
      loadGlobalCounts();
    } catch {
      showToast("Erreur lors de la publication");
    }
  };

  const handleConfirmReject = async (listing: LogementCatalogItem, raison: string) => {
    try {
      await adminApi.rejectListing(listing.id, raison);
      showToast(`« ${listing.titre} » rejeté.`);
      loadListings(currentPage);
      loadGlobalCounts();
    } catch {
      showToast("Erreur lors du rejet");
    }
  };

  const handleConfirmSuspend = async (listing: LogementCatalogItem, raison: string) => {
    try {
      await adminApi.suspendListing(listing.id, raison);
      showToast(`« ${listing.titre} » suspendu.`);
      loadListings(currentPage);
      loadGlobalCounts();
    } catch {
      showToast("Erreur lors de la suspension");
    }
  };

  const handleUnsuspend = async (listing: LogementCatalogItem) => {
    try {
      await adminApi.unsuspendListing(listing.id);
      showToast(`« ${listing.titre} » réactivé avec succès !`);
      loadListings(currentPage);
      loadGlobalCounts();
    } catch {
      showToast("Erreur lors de la réactivation");
    }
  };

  const handleToggleFeatured = async (listing: LogementCatalogItem) => {
    try {
      const newState = !listing.isFeatured;
      await adminApi.setFeaturedListing(listing.id, newState, newState ? 30 : undefined);
      showToast(newState ? `« ${listing.titre} » mis en vedette pour 30 jours !` : `« ${listing.titre} » retiré de la vedette.`);
      loadListings(currentPage);
      loadGlobalCounts();
    } catch {
      showToast("Erreur lors de la modification de la vedette");
    }
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
        <AdminLogementsHeaderBar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          typeFilter={typeFilter}
          onTypeFilterChange={setTypeFilter}
          onRefresh={() => { loadListings(currentPage); loadGlobalCounts(); }}
          isRefreshing={isLoading}
          counts={globalCounts}
        />

        {/* 2. Quick Filters Bar + CSV Export */}
        <AdminLogementsQuickFilters
          activePreset={activePreset}
          onPresetSelect={setActivePreset}
          onExportCsv={handleExportCsv}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={handleClearFilters}
        />

        {/* 3. Catalog Table */}
        <AdminLogementsTable
          listings={filteredListings}
          isLoading={isLoading}
          onInspect={setInspectListing}
          onPublish={handlePublish}
          onReject={setRejectListing}
          onSuspend={setSuspendListing}
          onUnsuspend={handleUnsuspend}
          onToggleFeatured={handleToggleFeatured}
        />

        {/* 4. Pagination */}
        <AdminLogementsPagination
          page={currentPage}
          totalPages={meta.totalPages}
          total={meta.total}
          onPageChange={(page) => { setCurrentPage(page); loadListings(page); }}
        />

        {/* 5. Detail Modal */}
        <AdminLogementDetailModal
          listing={inspectListing}
          isOpen={Boolean(inspectListing)}
          onClose={() => setInspectListing(null)}
          onPublish={handlePublish}
          onReject={setRejectListing}
          onSuspend={setSuspendListing}
          onUnsuspend={handleUnsuspend}
        />

        {/* 6. Reject Modal */}
        <AdminLogementSuspendModal
          listing={rejectListing}
          isOpen={Boolean(rejectListing)}
          onClose={() => setRejectListing(null)}
          onConfirmReject={handleConfirmReject}
          isSuspension={false}
        />

        {/* 7. Suspend Modal */}
        <AdminLogementSuspendModal
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
