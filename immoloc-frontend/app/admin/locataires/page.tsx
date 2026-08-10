'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { AdminShell } from '@/components/admin/admin-shell';
import { Users, Search, RefreshCw, CheckCircle2, UserX, Clock, Download, Eye, Lock, Unlock, Home, Calendar } from 'lucide-react';
import { AdminUserDetailModal } from '@/features/admin/components/users/AdminUserDetailModal';
import { AdminUserBlockModal } from '@/features/admin/components/users/AdminUserBlockModal';
import { AdminUsersPagination } from '@/features/admin/components/users/AdminUsersPagination';
import { UserItem } from '@/features/admin/components/users/AdminUsersTable';
import { adminApi } from '@/lib/nestjs';
import { cn } from '@/lib/utils/cn';

type TenantTabFilter = 'ALL' | 'KYC_VERIFIE' | 'KYC_ATTENTE' | 'BLOQUE';

const KYC_CONFIG: Record<string, { label: string; badgeClass: string }> = {
  VERIFIE: { label: "KYC Vérifié", badgeClass: "bg-forest-50 border-forest-200 text-forest-800" },
  EN_ATTENTE: { label: "KYC En Attente", badgeClass: "bg-warning-50 border-warning-200 text-warning-800" },
  REJETE: { label: "KYC Rejeté", badgeClass: "bg-error-50 border-error-200 text-error-800" },
  NON_VERIFIE: { label: "Non Vérifié", badgeClass: "bg-background-alt border-border text-foreground-muted" },
  A_RENOUVELER: { label: "À Renouveler", badgeClass: "bg-warning-50 border-warning-200 text-warning-800" },
};

function formatDate(d?: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

function getInitials(prenom?: string, nom?: string) {
  const p = prenom?.charAt(0).toUpperCase() ?? "";
  const n = nom?.charAt(0).toUpperCase() ?? "";
  return `${p}${n}` || "U";
}

export default function AdminLocatairesPage() {
  const [tenants, setTenants] = useState<UserItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TenantTabFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 });

  // Modals
  const [inspectUser, setInspectUser] = useState<UserItem | null>(null);
  const [blockUserItem, setBlockUserItem] = useState<UserItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Chargement des locataires uniquement (estProprietaire: false)
  const loadTenants = useCallback(async (page = 1) => {
    setIsLoading(true);
    try {
      const params: Parameters<typeof adminApi.listUsers>[0] = {
        page,
        limit: 20,
        estProprietaire: false,
        ...(searchQuery.trim() && { search: searchQuery.trim() }),
      };

      if (activeTab === 'BLOQUE') params.actif = false;
      if (activeTab === 'KYC_VERIFIE') params.statutKyc = 'VERIFIE';
      if (activeTab === 'KYC_ATTENTE') params.statutKyc = 'EN_ATTENTE';

      const result = await adminApi.listUsers(params);
      if (result?.data) {
        setTenants(result.data);
        setMeta(result.meta);
      } else if (Array.isArray(result)) {
        setTenants(result);
        setMeta({ total: result.length, page: 1, limit: 20, totalPages: 1 });
      }
    } catch {
      showToast("Erreur lors du chargement des locataires");
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, searchQuery]);

  useEffect(() => {
    setCurrentPage(1);
    loadTenants(1);
  }, [loadTenants]);

  // Compteurs globaux pour les locataires
  const [counts, setCounts] = useState({ total: 0, kycVerifie: 0, kycAttente: 0, bloques: 0 });

  const loadGlobalCounts = useCallback(async () => {
    try {
      const [allRes, verifRes, attenteRes, bloqRes] = await Promise.allSettled([
        adminApi.listUsers({ estProprietaire: false, limit: 1 }),
        adminApi.listUsers({ estProprietaire: false, statutKyc: 'VERIFIE', limit: 1 }),
        adminApi.listUsers({ estProprietaire: false, statutKyc: 'EN_ATTENTE', limit: 1 }),
        adminApi.listUsers({ estProprietaire: false, actif: false, limit: 1 }),
      ]);

      setCounts({
        total: allRes.status === 'fulfilled' ? allRes.value.meta?.total ?? 0 : 0,
        kycVerifie: verifRes.status === 'fulfilled' ? verifRes.value.meta?.total ?? 0 : 0,
        kycAttente: attenteRes.status === 'fulfilled' ? attenteRes.value.meta?.total ?? 0 : 0,
        bloques: bloqRes.status === 'fulfilled' ? bloqRes.value.meta?.total ?? 0 : 0,
      });
    } catch {
      // Silently fail
    }
  }, []);

  useEffect(() => {
    loadGlobalCounts();
  }, [loadGlobalCounts]);

  // Actions
  const handleConfirmBlockToggle = async (user: UserItem, bloquer: boolean, raison?: string) => {
    try {
      await adminApi.blockUser(user.id, bloquer, raison);
      showToast(bloquer ? `Le compte locataire de ${user.prenom} ${user.nom} a été bloqué.` : `Le compte locataire de ${user.prenom} ${user.nom} a été débloqué.`);
      loadTenants(currentPage);
      loadGlobalCounts();
    } catch {
      showToast("Erreur lors de la modification du statut");
    }
  };

  const handlePromoteToHost = async (user: UserItem) => {
    try {
      await adminApi.updateUserRole(user.id, true);
      showToast(`${user.prenom} ${user.nom} a été promu Hôte & Propriétaire !`);
      loadTenants(currentPage);
      loadGlobalCounts();
    } catch {
      showToast("Erreur lors de la promotion en hôte");
    }
  };

  const handleExportCsv = () => {
    if (tenants.length === 0) return;
    const headers = ["ID", "Prénom", "Nom", "Email", "Téléphone", "Statut KYC", "Statut Compte", "Réservations effectuées", "Inscrit le"];
    const rows = tenants.map((t) => [
      t.id,
      `"${t.prenom ?? ""}"`,
      `"${t.nom ?? ""}"`,
      `"${t.email ?? ""}"`,
      `"${t.telephone ?? ""}"`,
      t.statutKyc,
      t.actif ? "Actif" : "Bloqué",
      t._count?.reservationsLocataire ?? 0,
      t.creeLe ? new Date(t.creeLe).toLocaleDateString("fr-FR") : "",
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `klef_locataires_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Exportation des locataires téléchargée en CSV !");
  };

  return (
    <AdminShell urgentCount={counts.kycAttente}>
      <div className="space-y-6">
        {/* Toast */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 rounded-card border border-forest-300 bg-forest-900 px-4 py-3 text-xs font-semibold text-neutral-0 shadow-xl animate-fade-in">
            {toastMessage}
          </div>
        )}

        {/* 1. Header Bar */}
        <div className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-inner bg-forest-50 border border-forest-200 text-forest-800 shadow-2xs">
                <Users className="h-5 w-5" />
              </span>
              <div>
                <h1 className="font-display text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                  Annuaire des Locataires & Voyageurs
                </h1>
                <p className="text-xs text-foreground-muted">
                  Supervision des comptes voyageurs, vérification de l'identité KYC et suivi des réservations
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportCsv}
                className="inline-flex h-9 items-center gap-1.5 rounded-inner border border-border bg-background-card px-3 text-xs font-semibold text-foreground hover:bg-background-alt"
              >
                <Download className="h-3.5 w-3.5 text-foreground-muted" />
                <span>Exporter CSV</span>
              </button>
              <button
                type="button"
                onClick={() => { loadTenants(currentPage); loadGlobalCounts(); }}
                disabled={isLoading}
                className="inline-flex h-9 items-center gap-2 rounded-pill border border-border bg-background-card px-3.5 text-xs font-semibold text-foreground hover:bg-background-alt disabled:opacity-50"
              >
                <RefreshCw className={cn('h-3.5 w-3.5 text-foreground-muted', isLoading && 'animate-spin')} />
                <span>Actualiser</span>
              </button>
            </div>
          </div>

          {/* Cartes KPI Locataires */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { key: 'ALL' as TenantTabFilter, label: 'Tous les Locataires', count: counts.total, Icon: Users, activeClasses: 'border-purple-300 bg-purple-50/40 shadow-2xs' },
              { key: 'KYC_VERIFIE' as TenantTabFilter, label: 'KYC Validés', count: counts.kycVerifie, Icon: CheckCircle2, activeClasses: 'border-forest-300 bg-forest-50/40 shadow-2xs' },
              { key: 'KYC_ATTENTE' as TenantTabFilter, label: 'KYC En Attente', count: counts.kycAttente, Icon: Clock, activeClasses: 'border-warning-300 bg-warning-50/40 shadow-2xs' },
              { key: 'BLOQUE' as TenantTabFilter, label: 'Comptes Bloqués', count: counts.bloques, Icon: UserX, activeClasses: 'border-error-300 bg-error-50/40 shadow-2xs' },
            ].map(({ key, label, count, Icon, activeClasses }) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveTab(key)}
                className={cn(
                  'flex items-center justify-between rounded-card border p-3 text-left transition-colors',
                  activeTab === key ? activeClasses : 'border-border bg-background-card hover:bg-background-alt',
                )}
              >
                <div>
                  <p className="text-[0.6875rem] font-semibold uppercase tracking-wider text-foreground-muted">{label}</p>
                  <p className="mt-0.5 font-display text-xl font-bold text-foreground">{count}</p>
                </div>
                <Icon className="h-5 w-5 text-foreground-muted" />
              </button>
            ))}
          </div>

          {/* Search bar */}
          <div className="relative w-full">
            <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-foreground-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un locataire par nom, prénom, email ou téléphone..."
              className="h-10 w-full rounded-pill border border-border bg-background-card pr-4 pl-10 text-xs text-foreground placeholder:text-foreground-muted focus:border-forest-500 focus:outline-none"
            />
          </div>
        </div>

        {/* 2. Table spécifique Locataires */}
        <div className="overflow-hidden rounded-card border border-border bg-background-card shadow-xs">
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-background-alt/60 text-[0.6875rem] uppercase font-semibold text-foreground-muted tracking-wider">
                <tr>
                  <th className="py-3.5 px-4 sm:px-6">Locataire / Voyageur</th>
                  <th className="py-3.5 px-4">Statut KYC</th>
                  <th className="py-3.5 px-4">Réservations Effectuées</th>
                  <th className="py-3.5 px-4">Statut Compte</th>
                  <th className="py-3.5 px-4">Date d'inscription</th>
                  <th className="py-3.5 px-4 text-right sm:px-6">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-foreground-muted">Chargement du répertoire des locataires...</td>
                  </tr>
                ) : tenants.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-foreground-muted">Aucun locataire trouvé dans cette catégorie.</td>
                  </tr>
                ) : (
                  tenants.map((t) => {
                    const kycCfg = KYC_CONFIG[t.statutKyc] ?? KYC_CONFIG.NON_VERIFIE;

                    return (
                      <tr key={t.id} className="transition-colors hover:bg-background-alt/40">
                        {/* Locataire Identity */}
                        <td className="py-4 px-4 sm:px-6">
                          <div className="flex items-center gap-3">
                            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-pill border border-border bg-blue-100 flex items-center justify-center font-bold text-blue-800 text-sm">
                              {t.avatarUrl ? (
                                <img src={t.avatarUrl} alt={`${t.prenom} ${t.nom}`} className="h-full w-full object-cover" />
                              ) : (
                                getInitials(t.prenom, t.nom)
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-foreground truncate">{t.prenom} {t.nom}</p>
                              <p className="text-[0.6875rem] text-foreground-muted truncate max-w-[180px]">{t.email}</p>
                              {t.telephone && <p className="text-[0.6875rem] text-foreground-muted">{t.telephone}</p>}
                            </div>
                          </div>
                        </td>

                        {/* KYC */}
                        <td className="py-4 px-4">
                          <span className={cn('inline-flex items-center rounded-pill border px-2.5 py-0.5 text-[0.6875rem] font-semibold', kycCfg.badgeClass)}>
                            {kycCfg.label}
                          </span>
                        </td>

                        {/* Résas effectuées */}
                        <td className="py-4 px-4">
                          <p className="font-bold text-foreground">
                            {t._count?.reservationsLocataire ?? 0} réservation{(t._count?.reservationsLocataire ?? 0) > 1 ? 's' : ''}
                          </p>
                        </td>

                        {/* Statut Compte */}
                        <td className="py-4 px-4">
                          <span className={cn('inline-flex items-center gap-1 rounded-pill border px-2.5 py-1 text-xs font-semibold', t.actif ? 'bg-forest-50 border-forest-200 text-forest-800' : 'bg-error-50 border-error-200 text-error-800')}>
                            {t.actif ? 'Compte Actif' : 'Compte Bloqué'}
                          </span>
                        </td>

                        {/* Date inscription */}
                        <td className="py-4 px-4">
                          <p className="text-xs text-foreground-muted flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(t.creeLe)}
                          </p>
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-4 text-right sm:px-6">
                          <div className="flex items-center justify-end gap-1.5 flex-wrap">
                            <button
                              type="button"
                              onClick={() => setInspectUser(t)}
                              className="inline-flex h-8 items-center gap-1 rounded-inner border border-border bg-background-card px-2.5 text-xs font-semibold text-foreground hover:bg-background-alt"
                              title="Inspecter le profil"
                            >
                              <Eye className="h-3.5 w-3.5 text-foreground-muted" />
                              <span className="hidden sm:inline">Profil</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handlePromoteToHost(t)}
                              className="inline-flex h-8 items-center gap-1 rounded-inner border border-border bg-background-card px-2.5 text-xs font-semibold text-purple-800 hover:bg-purple-50"
                              title="Promouvoir cet utilisateur en Hôte/Propriétaire"
                            >
                              <Home className="h-3.5 w-3.5 text-purple-600" />
                              <span className="hidden sm:inline">+ Hôte</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setBlockUserItem(t)}
                              className={cn('inline-flex h-8 items-center gap-1 rounded-inner border px-2.5 text-xs font-semibold', t.actif ? 'border-error-200 bg-error-50 text-error-700 hover:bg-error-100' : 'border-forest-200 bg-forest-50 text-forest-800 hover:bg-forest-100')}
                              title={t.actif ? 'Bloquer le locataire' : 'Débloquer le locataire'}
                            >
                              {t.actif ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
                              <span className="hidden sm:inline">{t.actif ? 'Bloquer' : 'Débloquer'}</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <AdminUsersPagination
          page={currentPage}
          totalPages={meta.totalPages}
          total={meta.total}
          onPageChange={(page) => { setCurrentPage(page); loadTenants(page); }}
        />

        {/* Modal de détail Locataire */}
        <AdminUserDetailModal
          user={inspectUser}
          isOpen={Boolean(inspectUser)}
          onClose={() => setInspectUser(null)}
          onBlockToggle={setBlockUserItem}
          onResetFaults={() => {}}
        />

        {/* Modal de blocage */}
        <AdminUserBlockModal
          user={blockUserItem}
          isOpen={Boolean(blockUserItem)}
          onClose={() => setBlockUserItem(null)}
          onConfirmBlockToggle={handleConfirmBlockToggle}
        />
      </div>
    </AdminShell>
  );
}
