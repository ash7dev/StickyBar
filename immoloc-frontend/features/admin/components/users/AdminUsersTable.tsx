'use client';

import { Eye, ShieldAlert, Lock, Unlock, RotateCcw, User, Home, CheckCircle2, Clock, XCircle, AlertTriangle, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface UserItem {
  id: string;
  userId?: string;
  prenom?: string;
  nom?: string;
  email?: string;
  telephone?: string;
  avatarUrl?: string;
  statutKyc: string;
  actif: boolean;
  bloqueJusqua?: string | null;
  estProprietaire: boolean;
  nbAnnulations?: number;
  nbAbsencesJourJ?: number;
  nbNonConformites?: number;
  creeLe?: string;
  _count?: {
    logements?: number;
    reservationsLocataire?: number;
    reservationsProprietaire?: number;
  };
}

interface AdminUsersTableProps {
  users: UserItem[];
  isLoading?: boolean;
  onInspect: (user: UserItem) => void;
  onBlockToggle: (user: UserItem) => void;
  onResetFaults: (user: UserItem) => void;
  onToggleRole: (user: UserItem) => void;
}

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

export function AdminUsersTable({
  users,
  isLoading = false,
  onInspect,
  onBlockToggle,
  onResetFaults,
  onToggleRole,
}: AdminUsersTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-3 rounded-card border border-border bg-background-card p-6">
        {[1, 2, 3, 4, 5].map((n) => (
          <div key={n} className="h-16 animate-pulse rounded-inner bg-background-alt" />
        ))}
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-card border border-dashed border-border bg-background-card p-12 text-center space-y-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-pill bg-forest-50 border border-forest-200 text-forest-700">
          <User className="h-6 w-6" />
        </span>
        <div>
          <p className="font-display text-base font-semibold text-foreground">Aucun utilisateur trouvé</p>
          <p className="text-xs text-foreground-muted">Aucun utilisateur ne correspond à la recherche ou aux filtres sélectionnés.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-card border border-border bg-background-card shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-border bg-background-alt/60 text-[0.6875rem] uppercase font-semibold text-foreground-muted tracking-wider">
            <tr>
              <th className="py-3.5 px-4 sm:px-6">Utilisateur</th>
              <th className="py-3.5 px-4">Rôle & KYC</th>
              <th className="py-3.5 px-4">Statut Compte</th>
              <th className="py-3.5 px-4">Activité</th>
              <th className="py-3.5 px-4">Fautes / Pénalités</th>
              <th className="py-3.5 px-4 text-right sm:px-6">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-border">
            {users.map((u) => {
              const kycCfg = KYC_CONFIG[u.statutKyc] ?? KYC_CONFIG.NON_VERIFIE;
              const totalFautes = (u.nbAnnulations ?? 0) + (u.nbAbsencesJourJ ?? 0) + (u.nbNonConformites ?? 0);

              return (
                <tr key={u.id} className="transition-colors hover:bg-background-alt/40">
                  {/* Utilisateur Identity */}
                  <td className="py-4 px-4 sm:px-6">
                    <div className="flex items-center gap-3">
                      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-pill border border-border bg-forest-100 flex items-center justify-center font-bold text-forest-800 text-sm">
                        {u.avatarUrl ? (
                          <img src={u.avatarUrl} alt={`${u.prenom} ${u.nom}`} className="h-full w-full object-cover" />
                        ) : (
                          getInitials(u.prenom, u.nom)
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground truncate">{u.prenom} {u.nom}</p>
                        <p className="text-[0.6875rem] text-foreground-muted truncate max-w-[180px]">{u.email}</p>
                        {u.telephone && (
                          <p className="text-[0.6875rem] text-foreground-muted">{u.telephone}</p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Rôle & KYC */}
                  <td className="py-4 px-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={cn(
                          "inline-flex items-center gap-1 rounded-pill border px-2 py-0.5 text-[0.625rem] font-semibold",
                          u.estProprietaire
                            ? "bg-purple-50 border-purple-200 text-purple-800"
                            : "bg-blue-50 border-blue-200 text-blue-800",
                        )}>
                          {u.estProprietaire ? <Home className="h-3 w-3" /> : <User className="h-3 w-3" />}
                          {u.estProprietaire ? "Hôte & Proprio" : "Locataire"}
                        </span>
                      </div>
                      <div>
                        <span className={cn(
                          "inline-flex items-center rounded-pill border px-2 py-0.5 text-[0.625rem] font-semibold",
                          kycCfg.badgeClass,
                        )}>
                          {kycCfg.label}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Statut Compte */}
                  <td className="py-4 px-4">
                    <div className="space-y-0.5">
                      <span className={cn(
                        "inline-flex items-center gap-1 rounded-pill border px-2.5 py-1 text-xs font-semibold",
                        u.actif
                          ? "bg-forest-50 border-forest-200 text-forest-800"
                          : "bg-error-50 border-error-200 text-error-800",
                      )}>
                        {u.actif ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                        {u.actif ? "Compte Actif" : "Compte Bloqué"}
                      </span>
                      {u.creeLe && (
                        <p className="text-[0.6875rem] text-foreground-muted flex items-center gap-1 mt-0.5">
                          <Calendar className="h-3 w-3" /> Inscrit le {formatDate(u.creeLe)}
                        </p>
                      )}
                    </div>
                  </td>

                  {/* Activité */}
                  <td className="py-4 px-4">
                    <div className="space-y-0.5 text-xs text-foreground">
                      {u.estProprietaire ? (
                        <>
                          <p className="font-bold text-foreground">
                            {u._count?.logements ?? 0} logement{(u._count?.logements ?? 0) > 1 ? "s" : ""}
                          </p>
                          <p className="text-[0.6875rem] text-foreground-muted">
                            Résas reçues : <span className="font-semibold text-foreground">{u._count?.reservationsProprietaire ?? 0}</span>
                            {(u._count?.reservationsLocataire ?? 0) > 0 && (
                              <span> | Loc : <span className="font-semibold text-foreground">{u._count?.reservationsLocataire}</span></span>
                            )}
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="font-bold text-foreground">
                            {u._count?.reservationsLocataire ?? 0} réservation{(u._count?.reservationsLocataire ?? 0) > 1 ? "s" : ""}
                          </p>
                          <p className="text-[0.6875rem] text-foreground-muted">Compte Locataire</p>
                        </>
                      )}
                    </div>
                  </td>

                  {/* Fautes / Pénalités */}
                  <td className="py-4 px-4">
                    {totalFautes > 0 ? (
                      <div className="space-y-0.5">
                        <span className="inline-flex items-center gap-1 rounded-pill border border-warning-300 bg-warning-50 px-2 py-0.5 text-[0.6875rem] font-bold text-warning-900">
                          <AlertTriangle className="h-3 w-3 text-warning-700" />
                          {totalFautes} faute{totalFautes > 1 ? "s" : ""}
                        </span>
                        <p className="text-[0.625rem] text-foreground-muted">
                          Annul: {u.nbAnnulations ?? 0} | Abs: {u.nbAbsencesJourJ ?? 0} | Conf: {u.nbNonConformites ?? 0}
                        </p>
                      </div>
                    ) : (
                      <span className="text-xs text-foreground-muted italic">Aucune faute</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-4 px-4 text-right sm:px-6">
                    <div className="flex items-center justify-end gap-1.5 flex-wrap">
                      {/* Profil & Détails */}
                      <button
                        type="button"
                        onClick={() => onInspect(u)}
                        className="inline-flex h-8 items-center gap-1 rounded-inner border border-border bg-background-card px-2.5 text-xs font-semibold text-foreground hover:bg-background-alt"
                        title="Consulter la fiche détaillée"
                      >
                        <Eye className="h-3.5 w-3.5 text-foreground-muted" />
                        <span className="hidden sm:inline">Profil</span>
                      </button>

                      {/* Changer rôle hôte */}
                      <button
                        type="button"
                        onClick={() => onToggleRole(u)}
                        className="inline-flex h-8 items-center gap-1 rounded-inner border border-border bg-background-card px-2.5 text-xs font-semibold text-foreground hover:bg-background-alt"
                        title={u.estProprietaire ? "Rétrograder en Locataire" : "Promouvoir en Hôte/Propriétaire"}
                      >
                        <Home className="h-3.5 w-3.5 text-purple-600" />
                        <span className="hidden sm:inline">{u.estProprietaire ? "- Hôte" : "+ Hôte"}</span>
                      </button>

                      {/* Réinitialiser fautes si présent */}
                      {totalFautes > 0 && (
                        <button
                          type="button"
                          onClick={() => onResetFaults(u)}
                          className="inline-flex h-8 items-center gap-1 rounded-inner border border-warning-300 bg-warning-50 px-2 text-xs font-semibold text-warning-900 hover:bg-warning-100"
                          title="Réinitialiser les fautes et réactiver les logements suspendus"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                        </button>
                      )}

                      {/* Bloquer / Débloquer */}
                      <button
                        type="button"
                        onClick={() => onBlockToggle(u)}
                        className={cn(
                          "inline-flex h-8 items-center gap-1 rounded-inner border px-2.5 text-xs font-semibold",
                          u.actif
                            ? "border-error-200 bg-error-50 text-error-700 hover:bg-error-100"
                            : "border-forest-200 bg-forest-50 text-forest-800 hover:bg-forest-100",
                        )}
                        title={u.actif ? "Bloquer le compte" : "Débloquer le compte"}
                      >
                        {u.actif ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
                        <span className="hidden sm:inline">{u.actif ? "Bloquer" : "Débloquer"}</span>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
