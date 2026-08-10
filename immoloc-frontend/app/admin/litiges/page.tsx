'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { AdminShell } from '@/components/admin/admin-shell';
import { AdminDisputesHeaderBar, DisputeStatusTab } from '@/features/admin/components/disputes/AdminDisputesHeaderBar';
import { AdminDisputesTable, DisputeItem } from '@/features/admin/components/disputes/AdminDisputesTable';
import { AdminDisputeDetailModal } from '@/features/admin/components/disputes/AdminDisputeDetailModal';
import { AdminDisputeResolveModal } from '@/features/admin/components/disputes/AdminDisputeResolveModal';
import { adminApi } from '@/lib/nestjs';

export default function AdminLitigesPage() {
  const [allDisputes, setAllDisputes] = useState<DisputeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<DisputeStatusTab>('EN_ATTENTE');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [inspectDispute, setInspectDispute] = useState<DisputeItem | null>(null);
  const [resolveDispute, setResolveDispute] = useState<DisputeItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Chargement des litiges selon le filtre actif
  const loadDisputes = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await adminApi.listDisputes(activeTab !== 'ALL' ? activeTab : undefined);
      setAllDisputes(Array.isArray(data) ? data : []);
    } catch {
      showToast("Erreur lors du chargement des litiges");
    } finally {
      setIsLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    loadDisputes();
  }, [loadDisputes]);

  // Compteurs globaux
  const [globalCounts, setGlobalCounts] = useState({ all: 0, enAttente: 0, fonde: 0, nonFonde: 0 });

  const loadGlobalCounts = useCallback(async () => {
    try {
      const [all, pending, fonde, nonFonde] = await Promise.allSettled([
        adminApi.listDisputes(),
        adminApi.listDisputes('EN_ATTENTE'),
        adminApi.listDisputes('FONDE'),
        adminApi.listDisputes('NON_FONDE'),
      ]);

      setGlobalCounts({
        all: all.status === 'fulfilled' && Array.isArray(all.value) ? all.value.length : 0,
        enAttente: pending.status === 'fulfilled' && Array.isArray(pending.value) ? pending.value.length : 0,
        fonde: fonde.status === 'fulfilled' && Array.isArray(fonde.value) ? fonde.value.length : 0,
        nonFonde: nonFonde.status === 'fulfilled' && Array.isArray(nonFonde.value) ? nonFonde.value.length : 0,
      });
    } catch {
      // Silently fail
    }
  }, []);

  useEffect(() => {
    loadGlobalCounts();
  }, [loadGlobalCounts]);

  // Filtrage recherche client-side
  const filteredDisputes = useMemo(() => {
    if (!searchQuery.trim()) return allDisputes;
    const q = searchQuery.toLowerCase();
    return allDisputes.filter((d) => {
      const motif = (d.motif ?? '').toLowerCase();
      const desc = (d.description ?? '').toLowerCase();
      const locName = `${d.reservation?.locataire?.prenom ?? ''} ${d.reservation?.locataire?.nom ?? ''}`.toLowerCase();
      const locEmail = (d.reservation?.locataire?.email ?? '').toLowerCase();
      const propName = `${d.reservation?.proprietaire?.prenom ?? ''} ${d.reservation?.proprietaire?.nom ?? ''}`.toLowerCase();
      const propEmail = (d.reservation?.proprietaire?.email ?? '').toLowerCase();
      const logement = (d.reservation?.logement?.titre ?? '').toLowerCase();

      return (
        motif.includes(q) ||
        desc.includes(q) ||
        locName.includes(q) ||
        locEmail.includes(q) ||
        propName.includes(q) ||
        propEmail.includes(q) ||
        logement.includes(q)
      );
    });
  }, [allDisputes, searchQuery]);

  // Action d'arbitrage
  const handleConfirmResolve = async (dispute: DisputeItem, statut: 'FONDE' | 'NON_FONDE', decisionAdmin: string) => {
    try {
      await adminApi.resolveDispute(dispute.id, statut, decisionAdmin);
      showToast(`Décision enregistrée avec succès : Litige ${statut === 'FONDE' ? 'Fondé' : 'Non Fondé'}`);
      loadDisputes();
      loadGlobalCounts();
    } catch {
      showToast("Erreur lors de l'enregistrement de la décision");
    }
  };

  return (
    <AdminShell urgentCount={globalCounts.enAttente}>
      <div className="space-y-6">
        {/* Toast */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 rounded-card border border-forest-300 bg-forest-900 px-4 py-3 text-xs font-semibold text-neutral-0 shadow-xl animate-fade-in">
            {toastMessage}
          </div>
        )}

        {/* 1. Header Bar */}
        <AdminDisputesHeaderBar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onRefresh={() => { loadDisputes(); loadGlobalCounts(); }}
          isRefreshing={isLoading}
          counts={globalCounts}
        />

        {/* 2. Disputes Table */}
        <AdminDisputesTable
          disputes={filteredDisputes}
          isLoading={isLoading}
          onInspect={setInspectDispute}
          onResolve={setResolveDispute}
        />

        {/* 3. Detail Modal */}
        <AdminDisputeDetailModal
          dispute={inspectDispute}
          isOpen={Boolean(inspectDispute)}
          onClose={() => setInspectDispute(null)}
          onResolve={setResolveDispute}
        />

        {/* 4. Resolve Modal */}
        <AdminDisputeResolveModal
          dispute={resolveDispute}
          isOpen={Boolean(resolveDispute)}
          onClose={() => setResolveDispute(null)}
          onConfirmResolve={handleConfirmResolve}
        />
      </div>
    </AdminShell>
  );
}
