'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { AdminShell } from '@/components/admin/admin-shell';
import { Home, Search, RefreshCw, CheckCircle2, ShieldAlert, UserX, Clock, Download, Eye, Lock, Unlock, RotateCcw, Building2, Wallet, Calendar } from 'lucide-react';
import { AdminUserDetailModal } from '@/features/admin/components/users/AdminUserDetailModal';
import { AdminUserBlockModal } from '@/features/admin/components/users/AdminUserBlockModal';
import { AdminUsersPagination } from '@/features/admin/components/users/AdminUsersPagination';
import { UserItem } from '@/features/admin/components/users/AdminUsersTable';
import { adminApi } from '@/lib/nestjs';
import { cn } from '@/lib/utils/cn';

type HostTabFilter = 'ALL' | 'WITH_LISTINGS' | 'WITH_FAULTS' | 'KYC_ATTENTE' | 'BLOQUE';

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
  return `${p}${n}` || "H";
}

export default function AdminHotesPage() {
  const [hosts, setHosts] = useState<UserItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<HostTabFilter>('ALL');
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

  // Chargement des hôtes uniquement
  const loadHosts = useCallback(async (page = 1) => {
    setIsLoading(true);
    try {
      const params: Parameters<typeof adminApi.listUsers>[0] = {
        page,
        limit: 20,
        estProprietaire: true,
        ...(searchQuery.trim() && { search: searchQuery.trim() }),
      };

      if (activeTab === 'BLOQUE') params.actif = false;
      if (activeTab === 'KYC_ATTENTE') params.statutKyc = 'EN_ATTENTE';

      const result = await adminApi.listUsers(params);
      if (result?.data) {
        setHosts(result.data);
        setMeta(result.meta);
      } else if (Array.isArray(result)) {
        setHosts(result);
        setMeta({ total: result.length, page: 1, limit: 20, totalPages: 1 });
      }
    } catch {
      showToast("Erreur lors du chargement des hôtes");
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, searchQuery]);

  useEffect(() => {
    setCurrentPage(1);
    loadHosts(1);
  }, [loadHosts]);

  // Compteurs globaux pour les hôtes
  const [counts, setCounts] = useState({ total: 0, avecLogements: 0, kycAttente: 0, avecFautes: 0, bloques: 0 });

  const loadGlobalCounts = useCallback(async () => {
    try {
      const [allRes, kycRes, bloqRes] = await Promise.allSettled([
        adminApi.listUsers({ estProprietaire: true, limit: 100 }),
        adminApi.listUsers({ estProprietaire: true, statutKyc: 'EN_ATTENTE', limit: 1 }),
        adminApi.listUsers({ estProprietaire: true, actif: false, limit: 1 }),
      ]);

      const allList = allRes.status === 'fulfilled' && Array.isArray(allRes.value.data) ? allRes.value.data : [];
      const total = allRes.status === 'fulfilled' ? allRes.value.meta?.total ?? allList.length : 0;
      const avecLogements = allList.filter(h => (h._count?.logements ?? 0) > 0).length;
      const avecFautes = allList.filter(h => ((h.nbAnnulations ?? 0) + (h.nbAbsencesJourJ ?? 0) + (h.nbNonConformites ?? 0)) > 0).length;

      setCounts({
        total,
        avecLogements,
        kycAttente: kycRes.status === 'fulfilled' ? kycRes.value.meta?.total ?? 0 : 0,
        avecFautes,
        bloques: bloqRes.status === 'fulfilled' ? bloqRes.value.meta?.total ?? 0 : 0,
      });
    } catch {
      // Silently fail
    }
  }, []);

  useEffect(() => {
    loadGlobalCounts();
  }, [loadGlobalCounts]);

  // Filtrage local selon l'onglet
  const filteredHosts = useMemo(() => {
    if (activeTab === 'WITH_LISTINGS') {
      return hosts.filter(h => (h._count?.logements ?? 0) > 0);
    }
    if (activeTab === 'WITH_FAULTS') {
      return hosts.filter(h => ((h.nbAnnulations ?? 0) + (h.nbAbsencesJourJ ?? 0) + (h.nbNonConformites ?? 0)) > 0);
    }
    return hosts;
  }, [hosts, activeTab]);

  // Actions
  const handleConfirmBlockToggle = async (user: UserItem, bloquer: boolean, raison?: string) => {
    try {
      await adminApi.blockUser(user.id, bloquer, raison);
      showToast(bloquer ? `Le compte de l'hôte ${user.prenom} ${user.nom} a été bloqué.` : `Le compte de l'hôte ${user.prenom} ${user.nom} a été débloqué.`);
      loadHosts(currentPage);
      loadGlobalCounts();
    } catch {
      showToast("Erreur lors du blocage de l'hôte");
    }
  };

  const handleResetFaults = async (user: UserItem) => {
    try {
      await adminApi.resetUserFaults(user.id);
      showToast(`Compteur de fautes réinitialisé et logements réactivés pour ${user.prenom} ${user.nom}`);
      loadHosts(currentPage);
    } catch {
      showToast("Erreur lors de la réinitialisation des fautes");
    }
  };

  const handleExportCsv = () => {
    if (filteredHosts.length === 0) return;
    const headers = ["ID", "Prénom", "Nom", "Email", "Téléphone", "Statut KYC", "Statut Compte", "Logements gérés", "Résas reçues", "Inscrit le"];
    const rows = filteredHosts.map((h) => [
      h.id,
      `"${h.prenom ?? ""}"`,
      `"${h.nom ?? ""}"`,
      `"${h.email ?? ""}"`,
      `"${h.telephone ?? ""}"`,
      h.statutKyc,
      h.actif ? "Actif" : "Bloqué",
      h._count?.logements ?? 0,
      h._count?.reservationsProprietaire ?? 0,
      h.creeLe ? new Date(h.creeLe).toLocaleDateString("fr-FR") : "",
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `klef_hotes_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Exportation des hôtes téléchargée en CSV !");
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
                <Home className="h-5 w-5" />
              </span>
              <div>
                <h1 className="font-display text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                  Gestion des Hôtes & Propriétaires
                </h1>
                <p className="text-xs text-foreground-muted">
                  Supervision du parc d'hôtes, contrôle des logements gérés, gestion des portefeuilles et pénalités
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
                onClick={() => { loadHosts(currentPage); loadGlobalCounts(); }}
                disabled={isLoading}
                className="inline-flex h-9 items-center gap-2 rounded-pill border border-border bg-background-card px-3.5 text-xs font-semibold text-foreground hover:bg-background-alt disabled:opacity-50"
              >
                <RefreshCw className={cn('h-3.5 w-3.5 text-foreground-muted', isLoading && 'animate-spin')} />
                <span>Actualiser</span>
              </button>
            </div>
          </div>

          {/* Cartes KPI Hôtes */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {[
              { key: 'ALL' as HostTabFilter, label: 'Tous les Hôtes', count: counts.total, Icon: Home, activeClasses: 'border-purple-300 bg-purple-50/40 shadow-2xs' },
              { key: 'WITH_LISTINGS' as HostTabFilter, label: 'Avec Logements', count: counts.avecLogements, Icon: Building2, activeClasses: 'border-forest-300 bg-forest-50/40 shadow-2xs' },
              { key: 'KYC_ATTENTE' as HostTabFilter, label: 'KYC En Attente', count: counts.kycAttente, Icon: Clock, activeClasses: 'border-warning-300 bg-warning-50/40 shadow-2xs' },
              { key: 'WITH_FAULTS' as HostTabFilter, label: 'Avec Fautes', count: counts.avecFautes, Icon: ShieldAlert, activeClasses: 'border-warning-300 bg-warning-50/40 shadow-2xs' },
              { key: 'BLOQUE' as HostTabFilter, label: 'Hôtes Bloqués', count: counts.bloques, Icon: UserX, activeClasses: 'border-error-300 bg-error-50/40 shadow-2xs' },
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
              placeholder="Rechercher un hôte par nom, prénom, email ou téléphone..."
              className="h-10 w-full rounded-pill border border-border bg-background-card pr-4 pl-10 text-xs text-foreground placeholder:text-foreground-muted focus:border-forest-500 focus:outline-none"
            />
          </div>
        </div>

        {/* 2. Table spécifique Hôtes */}
        <div className="overflow-hidden rounded-card border border-border bg-background-card shadow-xs">
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-background-alt/60 text-[0.6875rem] uppercase font-semibold text-foreground-muted tracking-wider">
                <tr>
                  <th className="py-3.5 px-4 sm:px-6">Hôte / Propriétaire</th>
                  <th className="py-3.5 px-4">Statut KYC</th>
                  <th className="py-3.5 px-4">Parc Immobilier</th>
                  <th className="py-3.5 px-4">Réservations Reçues</th>
                  <th className="py-3.5 px-4">Fautes / Pénalités</th>
                  <th className="py-3.5 px-4">Statut Compte</th>
                  <th className="py-3.5 px-4 text-right sm:px-6">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-foreground-muted">Chargement du répertoire des hôtes...</td>
                  </tr>
                ) : filteredHosts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-foreground-muted">Aucun hôte trouvé dans cette catégorie.</td>
                  </tr>
                ) : (
                  filteredHosts.map((h) => {
                    const kycCfg = KYC_CONFIG[h.statutKyc] ?? KYC_CONFIG.NON_VERIFIE;
                    const totalFautes = (h.nbAnnulations ?? 0) + (h.nbAbsencesJourJ ?? 0) + (h.nbNonConformites ?? 0);

                    return (
                      <tr key={h.id} className="transition-colors hover:bg-background-alt/40">
                        {/* Hôte Identity */}
                        <td className="py-4 px-4 sm:px-6">
                          <div className="flex items-center gap-3">
                            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-pill border border-border bg-forest-100 flex items-center justify-center font-bold text-forest-800 text-sm">
                              {h.avatarUrl ? (
                                <img src={h.avatarUrl} alt={`${h.prenom} ${h.nom}`} className="h-full w-full object-cover" />
                              ) : (
                                getInitials(h.prenom, h.nom)
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-foreground truncate">{h.prenom} {h.nom}</p>
                              <p className="text-[0.6875rem] text-foreground-muted truncate max-w-[180px]">{h.email}</p>
                              {h.telephone && <p className="text-[0.6875rem] text-foreground-muted">{h.telephone}</p>}
                            </div>
                          </div>
                        </td>

                        {/* KYC */}
                        <td className="py-4 px-4">
                          <span className={cn('inline-flex items-center rounded-pill border px-2.5 py-0.5 text-[0.6875rem] font-semibold', kycCfg.badgeClass)}>
                            {kycCfg.label}
                          </span>
                        </td>

                        {/* Parc */}
                        <td className="py-4 px-4">
                          <p className="font-bold text-foreground flex items-center gap-1.5">
                            <Building2 className="h-3.5 w-3.5 text-forest-600" />
                            {h._count?.logements ?? 0} logement{(h._count?.logements ?? 0) > 1 ? 's' : ''}
                          </p>
                        </td>

                        {/* Résas reçues */}
                        <td className="py-4 px-4">
                          <p className="font-bold text-foreground">
                            {h._count?.reservationsProprietaire ?? 0} réservation{(h._count?.reservationsProprietaire ?? 0) > 1 ? 's' : ''}
                          </p>
                        </td>

                        {/* Fautes */}
                        <td className="py-4 px-4">
                          {totalFautes > 0 ? (
                            <div className="space-y-0.5">
                              <span className="inline-flex items-center gap-1 rounded-pill border border-warning-300 bg-warning-50 px-2 py-0.5 text-[0.6875rem] font-bold text-warning-900">
                                <ShieldAlert className="h-3 w-3 text-warning-700" />
                                {totalFautes} faute{totalFautes > 1 ? 's' : ''}
                              </span>
                              <p className="text-[0.625rem] text-foreground-muted">
                                Annul: {h.nbAnnulations ?? 0} | Abs: {h.nbAbsencesJourJ ?? 0} | Conf: {h.nbNonConformites ?? 0}
                              </p>
                            </div>
                          ) : (
                            <span className="text-xs text-foreground-muted italic">Aucune pénalité</span>
                          )}
                        </td>

                        {/* Statut Compte */}
                        <td className="py-4 px-4">
                          <span className={cn('inline-flex items-center gap-1 rounded-pill border px-2.5 py-1 text-xs font-semibold', h.actif ? 'bg-forest-50 border-forest-200 text-forest-800' : 'bg-error-50 border-error-200 text-error-800')}>
                            {h.actif ? 'Compte Actif' : 'Compte Bloqué'}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-4 text-right sm:px-6">
                          <div className="flex items-center justify-end gap-1.5 flex-wrap">
                            <button
                              type="button"
                              onClick={() => setInspectUser(h)}
                              className="inline-flex h-8 items-center gap-1 rounded-inner border border-border bg-background-card px-2.5 text-xs font-semibold text-foreground hover:bg-background-alt"
                              title="Inspecter l'hôte"
                            >
                              <Eye className="h-3.5 w-3.5 text-foreground-muted" />
                              <span className="hidden sm:inline">Dossier</span>
                            </button>

                            {totalFautes > 0 && (
                              <button
                                type="button"
                                onClick={() => handleResetFaults(h)}
                                className="inline-flex h-8 items-center gap-1 rounded-inner border border-warning-300 bg-warning-50 px-2 text-xs font-semibold text-warning-900 hover:bg-warning-100"
                                title="Réinitialiser les fautes et réactiver les logements"
                              >
                                <RotateCcw className="h-3.5 w-3.5" />
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => setBlockUserItem(h)}
                              className={cn('inline-flex h-8 items-center gap-1 rounded-inner border px-2.5 text-xs font-semibold', h.actif ? 'border-error-200 bg-error-50 text-error-700 hover:bg-error-100' : 'border-forest-200 bg-forest-50 text-forest-800 hover:bg-forest-100')}
                              title={h.actif ? 'Bloquer l\'hôte' : 'Débloquer l\'hôte'}
                            >
                              {h.actif ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
                              <span className="hidden sm:inline">{h.actif ? 'Bloquer' : 'Débloquer'}</span>
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
          onPageChange={(page) => { setCurrentPage(page); loadHosts(page); }}
        />

        {/* Modal de détail Hôte */}
        <AdminUserDetailModal
          user={inspectUser}
          isOpen={Boolean(inspectUser)}
          onClose={() => setInspectUser(null)}
          onBlockToggle={setBlockUserItem}
          onResetFaults={handleResetFaults}
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
