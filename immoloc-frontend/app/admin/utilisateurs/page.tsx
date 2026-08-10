'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { AdminShell } from '@/components/admin/admin-shell';
import { AdminUsersHeaderBar, UserTabFilter } from '@/features/admin/components/users/AdminUsersHeaderBar';
import { AdminUsersStatsDistribution } from '@/features/admin/components/users/AdminUsersStatsDistribution';
import { AdminUsersQuickFilters, QuickFilterPreset } from '@/features/admin/components/users/AdminUsersQuickFilters';
import { AdminUsersTable, UserItem } from '@/features/admin/components/users/AdminUsersTable';
import { AdminUserDetailModal } from '@/features/admin/components/users/AdminUserDetailModal';
import { AdminUserBlockModal } from '@/features/admin/components/users/AdminUserBlockModal';
import { AdminUserBroadcastModal } from '@/features/admin/components/users/AdminUserBroadcastModal';
import { AdminUsersPagination } from '@/features/admin/components/users/AdminUsersPagination';
import { adminApi } from '@/lib/nestjs';

export default function AdminUtilisateursPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<UserTabFilter>('ALL');
  const [activePreset, setActivePreset] = useState<QuickFilterPreset>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [statutKycFilter, setStatutKycFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 });

  // Modals state
  const [inspectUser, setInspectUser] = useState<UserItem | null>(null);
  const [blockUserItem, setBlockUserItem] = useState<UserItem | null>(null);
  const [isBroadcastOpen, setIsBroadcastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Chargement principal des utilisateurs
  const loadUsers = useCallback(async (page = 1) => {
    setIsLoading(true);
    try {
      const params: Parameters<typeof adminApi.listUsers>[0] = {
        page,
        limit: 20,
        ...(searchQuery.trim() && { search: searchQuery.trim() }),
        ...(statutKycFilter && { statutKyc: statutKycFilter }),
      };

      if (activeTab === 'PROPRIETAIRE') params.estProprietaire = true;
      if (activeTab === 'LOCATAIRE') params.estProprietaire = false;
      if (activeTab === 'BLOQUE') params.actif = false;

      const result = await adminApi.listUsers(params);
      if (result?.data) {
        setUsers(result.data);
        setMeta(result.meta);
      } else if (Array.isArray(result)) {
        setUsers(result);
        setMeta({ total: result.length, page: 1, limit: 20, totalPages: 1 });
      }
    } catch {
      showToast("Erreur lors du chargement des utilisateurs");
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, searchQuery, statutKycFilter]);

  useEffect(() => {
    setCurrentPage(1);
    loadUsers(1);
  }, [loadUsers]);

  // Compteurs globaux pour les cartes KPI
  const [globalCounts, setGlobalCounts] = useState({ total: 0, proprietaires: 0, locataires: 0, bloques: 0, kycAttente: 0 });

  const loadGlobalCounts = useCallback(async () => {
    try {
      const [allRes, propRes, locRes, bloqRes, kycRes] = await Promise.allSettled([
        adminApi.listUsers({ limit: 1 }),
        adminApi.listUsers({ estProprietaire: true, limit: 1 }),
        adminApi.listUsers({ estProprietaire: false, limit: 1 }),
        adminApi.listUsers({ actif: false, limit: 1 }),
        adminApi.listUsers({ statutKyc: 'EN_ATTENTE', limit: 1 }),
      ]);

      setGlobalCounts({
        total: allRes.status === 'fulfilled' ? allRes.value.meta?.total ?? 0 : 0,
        proprietaires: propRes.status === 'fulfilled' ? propRes.value.meta?.total ?? 0 : 0,
        locataires: locRes.status === 'fulfilled' ? locRes.value.meta?.total ?? 0 : 0,
        bloques: bloqRes.status === 'fulfilled' ? bloqRes.value.meta?.total ?? 0 : 0,
        kycAttente: kycRes.status === 'fulfilled' ? kycRes.value.meta?.total ?? 0 : 0,
      });
    } catch {
      // Silently fail
    }
  }, []);

  useEffect(() => {
    loadGlobalCounts();
  }, [loadGlobalCounts]);

  // Filtrage combiné avec les raccourcis (presets)
  const filteredUsers = useMemo(() => {
    let result = users;

    if (activePreset === 'WITH_FAULTS') {
      result = result.filter((u) => ((u.nbAnnulations ?? 0) + (u.nbAbsencesJourJ ?? 0) + (u.nbNonConformites ?? 0)) > 0);
    } else if (activePreset === 'UNVERIFIED_KYC') {
      result = result.filter((u) => u.statutKyc !== 'VERIFIE');
    } else if (activePreset === 'BLOCKED') {
      result = result.filter((u) => !u.actif);
    } else if (activePreset === 'HOSTS_WITH_LISTINGS') {
      result = result.filter((u) => u.estProprietaire && (u._count?.logements ?? 0) > 0);
    } else if (activePreset === 'NEW_USERS') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      result = result.filter((u) => u.creeLe && new Date(u.creeLe) >= thirtyDaysAgo);
    }

    return result;
  }, [users, activePreset]);

  // Exporter CSV
  const handleExportCsv = () => {
    if (filteredUsers.length === 0) {
      showToast("Aucun utilisateur à exporter");
      return;
    }

    const headers = ["ID", "Prénom", "Nom", "Email", "Téléphone", "Rôle", "Statut KYC", "Statut Compte", "Logements", "Inscrit le"];
    const rows = filteredUsers.map((u) => [
      u.id,
      `"${u.prenom ?? ""}"`,
      `"${u.nom ?? ""}"`,
      `"${u.email ?? ""}"`,
      `"${u.telephone ?? ""}"`,
      u.estProprietaire ? "Hôte/Propriétaire" : "Locataire",
      u.statutKyc,
      u.actif ? "Actif" : "Bloqué",
      u._count?.logements ?? 0,
      u.creeLe ? new Date(u.creeLe).toLocaleDateString("fr-FR") : "",
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `klef_utilisateurs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast("Exportation CSV téléchargée avec succès !");
  };

  // Actions
  const handleConfirmBlockToggle = async (user: UserItem, bloquer: boolean, raison?: string) => {
    try {
      await adminApi.blockUser(user.id, bloquer, raison);
      showToast(bloquer ? `Le compte de ${user.prenom} ${user.nom} a été bloqué.` : `Le compte de ${user.prenom} ${user.nom} a été réactivé.`);
      loadUsers(currentPage);
      loadGlobalCounts();
    } catch {
      showToast("Erreur lors de la modification du statut du compte");
    }
  };

  const handleResetFaults = async (user: UserItem) => {
    try {
      await adminApi.resetUserFaults(user.id);
      showToast(`Fautes réinitialisées et logements réactivés pour ${user.prenom} ${user.nom}`);
      loadUsers(currentPage);
    } catch {
      showToast("Erreur lors de la réinitialisation des fautes");
    }
  };

  const handleToggleRole = async (user: UserItem) => {
    try {
      const newHostState = !user.estProprietaire;
      await adminApi.updateUserRole(user.id, newHostState);
      showToast(`${user.prenom} ${user.nom} est désormais ${newHostState ? "déclaré Hôte & Propriétaire" : "Locataire simple"}`);
      loadUsers(currentPage);
      loadGlobalCounts();
    } catch {
      showToast("Erreur lors du changement de rôle");
    }
  };

  const handleClearFilters = () => {
    setActiveTab('ALL');
    setActivePreset('ALL');
    setSearchQuery('');
    setStatutKycFilter('');
  };

  const hasActiveFilters = activeTab !== 'ALL' || activePreset !== 'ALL' || Boolean(searchQuery.trim()) || Boolean(statutKycFilter);

  return (
    <AdminShell urgentCount={globalCounts.kycAttente}>
      <div className="space-y-6">
        {/* Toast */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 rounded-card border border-forest-300 bg-forest-900 px-4 py-3 text-xs font-semibold text-neutral-0 shadow-xl animate-fade-in">
            {toastMessage}
          </div>
        )}

        {/* 1. Header Bar with KPI & Search */}
        <AdminUsersHeaderBar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statutKycFilter={statutKycFilter}
          onStatutKycChange={setStatutKycFilter}
          onRefresh={() => { loadUsers(currentPage); loadGlobalCounts(); }}
          isRefreshing={isLoading}
          counts={globalCounts}
        />

        {/* 2. Visual Distribution Bars */}
        <AdminUsersStatsDistribution counts={globalCounts} />

        {/* 3. Quick Filter Chips Bar + Export CSV + Broadcast */}
        <AdminUsersQuickFilters
          activePreset={activePreset}
          onPresetSelect={setActivePreset}
          onExportCsv={handleExportCsv}
          onOpenBroadcast={() => setIsBroadcastOpen(true)}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={handleClearFilters}
        />

        {/* 4. Users Table */}
        <AdminUsersTable
          users={filteredUsers}
          isLoading={isLoading}
          onInspect={setInspectUser}
          onBlockToggle={setBlockUserItem}
          onResetFaults={handleResetFaults}
          onToggleRole={handleToggleRole}
        />

        {/* 5. Server Pagination */}
        <AdminUsersPagination
          page={currentPage}
          totalPages={meta.totalPages}
          total={meta.total}
          onPageChange={(page) => { setCurrentPage(page); loadUsers(page); }}
        />

        {/* 6. Detail Modal */}
        <AdminUserDetailModal
          user={inspectUser}
          isOpen={Boolean(inspectUser)}
          onClose={() => setInspectUser(null)}
          onBlockToggle={setBlockUserItem}
          onResetFaults={handleResetFaults}
        />

        {/* 7. Block Modal */}
        <AdminUserBlockModal
          user={blockUserItem}
          isOpen={Boolean(blockUserItem)}
          onClose={() => setBlockUserItem(null)}
          onConfirmBlockToggle={handleConfirmBlockToggle}
        />

        {/* 8. Broadcast Push Modal */}
        <AdminUserBroadcastModal
          isOpen={isBroadcastOpen}
          onClose={() => setIsBroadcastOpen(false)}
          onSuccess={showToast}
        />
      </div>
    </AdminShell>
  );
}
