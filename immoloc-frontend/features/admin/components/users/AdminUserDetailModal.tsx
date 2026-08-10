'use client';

import { useEffect, useState } from 'react';
import { X, User, Home, Wallet, ShieldAlert, RotateCcw, MapPin, Calendar, CreditCard, Building2, Loader2, CheckCircle2, AlertTriangle, Lock } from 'lucide-react';
import { UserItem } from './AdminUsersTable';
import { adminApi } from '@/lib/nestjs';
import { cn } from '@/lib/utils/cn';

interface AdminUserDetailModalProps {
  user: UserItem | null;
  isOpen: boolean;
  onClose: () => void;
  onBlockToggle: (user: UserItem) => void;
  onResetFaults: (user: UserItem) => void;
}

function formatPrice(amount?: number | null) {
  if (amount == null) return "—";
  return new Intl.NumberFormat("fr-SN", { style: "currency", currency: "XOF", maximumFractionDigits: 0 }).format(amount);
}

function formatDate(d?: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function AdminUserDetailModal({
  user,
  isOpen,
  onClose,
  onBlockToggle,
  onResetFaults,
}: AdminUserDetailModalProps) {
  const [details, setDetails] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!user?.id || !isOpen) {
      setDetails(null);
      return;
    }
    setIsLoading(true);
    adminApi.getUserById(user.id)
      .then((data) => setDetails(data))
      .catch(() => setDetails(null))
      .finally(() => setIsLoading(false));
  }, [user?.id, isOpen]);

  if (!isOpen || !user) return null;

  const data = details ?? user;
  const profile = data.profile;
  const wallet = data.wallet;
  const logements: Array<{ id: string; titre: string; type?: string; ville?: string; prixBase?: number; statut: string; creeLe?: string }> = data.logements ?? [];
  const fautes: Array<{ id: string; type: string; description?: string; creeLe?: string; traitee?: boolean }> = data.compteursFautes ?? [];
  const totalFautes = (user.nbAnnulations ?? 0) + (user.nbAbsencesJourJ ?? 0) + (user.nbNonConformites ?? 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-forest-950/60 backdrop-blur-xs overflow-y-auto no-scrollbar">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto no-scrollbar rounded-card border border-border bg-background-card p-6 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-pill border border-border bg-forest-100 flex items-center justify-center font-bold text-forest-800 text-lg">
              {data.avatarUrl ? (
                <img src={data.avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                `${data.prenom?.charAt(0) ?? ""}${data.nom?.charAt(0) ?? ""}`
              )}
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-foreground">
                {data.prenom} {data.nom}
              </h2>
              <p className="text-xs text-foreground-muted">
                Dossier Utilisateur — {data.estProprietaire ? "Hôte & Propriétaire" : "Locataire"}
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-inner p-1.5 text-foreground-muted hover:bg-background-alt hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-forest-700" />
          </div>
        ) : (
          <>
            {/* Aperçu Synthétique */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Statut Compte */}
              <div className="rounded-inner border border-border bg-background-alt/40 p-4 space-y-1">
                <p className="text-[0.6875rem] font-bold uppercase tracking-wider text-foreground-muted flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" /> Statut du compte
                </p>
                <p className={cn("text-xs font-bold", data.actif ? "text-forest-700" : "text-error-700")}>
                  {data.actif ? "Compte Actif" : "Compte Bloqué"}
                </p>
                <p className="text-[0.6875rem] text-foreground-muted">Membre depuis {formatDate(data.creeLe)}</p>
              </div>

              {/* KYC Status */}
              <div className="rounded-inner border border-border bg-background-alt/40 p-4 space-y-1">
                <p className="text-[0.6875rem] font-bold uppercase tracking-wider text-foreground-muted flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Statut KYC
                </p>
                <p className="text-xs font-bold text-foreground">{data.statutKyc}</p>
                <p className="text-[0.6875rem] text-foreground-muted">
                  {data.statutKyc === "VERIFIE" ? "Pièce d'identité et selfie validés" : "Vérification complémentaire requise"}
                </p>
              </div>

              {/* Portefeuille / Wallet */}
              <div className="rounded-inner border border-border bg-background-alt/40 p-4 space-y-1">
                <p className="text-[0.6875rem] font-bold uppercase tracking-wider text-foreground-muted flex items-center gap-1.5">
                  <Wallet className="h-3.5 w-3.5" /> Portefeuille Klef
                </p>
                <p className="font-display text-sm font-bold text-foreground tabular-nums">
                  {wallet ? formatPrice(wallet.solde) : "Non initialisé"}
                </p>
                {wallet?.soldeBloque > 0 && (
                  <p className="text-[0.6875rem] text-warning-800 font-semibold">
                    Bloqué: {formatPrice(wallet.soldeBloque)}
                  </p>
                )}
              </div>
            </div>

            {/* Infos Civiles & Contact */}
            <div className="rounded-inner border border-border bg-background-card p-4 space-y-3">
              <h3 className="font-display text-xs font-bold uppercase tracking-wider text-foreground">Coordonnées et Profil</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="text-foreground-muted text-[0.6875rem]">Email :</p>
                  <p className="font-bold text-foreground">{data.email}</p>
                </div>
                <div>
                  <p className="text-foreground-muted text-[0.6875rem]">Téléphone :</p>
                  <p className="font-bold text-foreground">{data.telephone ?? "Non renseigné"}</p>
                </div>
                {profile?.adresse && (
                  <div>
                    <p className="text-foreground-muted text-[0.6875rem]">Adresse :</p>
                    <p className="font-bold text-foreground">{profile.adresse}{profile.ville ? `, ${profile.ville}` : ""}</p>
                  </div>
                )}
                {profile?.nationalite && (
                  <div>
                    <p className="text-foreground-muted text-[0.6875rem]">Nationalité :</p>
                    <p className="font-bold text-foreground">{profile.nationalite}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Catalogue de Logements (si proprio) */}
            {logements.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-display text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                  <Building2 className="h-4 w-4 text-foreground-muted" /> Catalogue de logements ({logements.length})
                </h3>
                <div className="overflow-x-auto rounded-inner border border-border bg-background-card">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-border bg-background-alt/60 text-[0.6875rem] uppercase font-semibold text-foreground-muted">
                      <tr>
                        <th className="py-2.5 px-3">Titre</th>
                        <th className="py-2.5 px-3">Type</th>
                        <th className="py-2.5 px-3">Ville</th>
                        <th className="py-2.5 px-3">Prix/Nuit</th>
                        <th className="py-2.5 px-3">Statut</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {logements.map((l) => (
                        <tr key={l.id} className="hover:bg-background-alt/40">
                          <td className="py-2.5 px-3 font-semibold text-foreground">{l.titre}</td>
                          <td className="py-2.5 px-3 text-foreground-muted">{l.type ?? "Logement"}</td>
                          <td className="py-2.5 px-3 text-foreground-muted">{l.ville ?? "—"}</td>
                          <td className="py-2.5 px-3 font-bold text-foreground">{formatPrice(l.prixBase)}</td>
                          <td className="py-2.5 px-3 font-semibold">{l.statut}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Historique des Fautes & Pénalités */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                  <ShieldAlert className="h-4 w-4 text-warning-600" /> Historique des Fautes & Pénalités ({fautes.length})
                </h3>
                {totalFautes > 0 && (
                  <button
                    type="button"
                    onClick={() => onResetFaults(user)}
                    className="inline-flex h-7 items-center gap-1 rounded-pill border border-warning-300 bg-warning-50 px-2.5 text-[0.6875rem] font-bold text-warning-900 hover:bg-warning-100"
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span>Réinitialiser les fautes</span>
                  </button>
                )}
              </div>

              {fautes.length === 0 ? (
                <p className="text-xs text-foreground-muted italic bg-background-alt/40 p-3 rounded-inner border border-border">
                  Aucun historique de faute enregistré pour cet utilisateur.
                </p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {fautes.map((f) => (
                    <div key={f.id} className="rounded-inner border border-border bg-background-alt/40 p-3 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-foreground">{f.type}</span>
                        <span className="text-[0.6875rem] text-foreground-muted">{formatDate(f.creeLe)}</span>
                      </div>
                      {f.description && <p className="text-foreground-muted">{f.description}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
          <button type="button" onClick={onClose} className="h-9 rounded-inner border border-border bg-background-card px-4 text-xs font-semibold text-foreground hover:bg-background-alt">
            Fermer
          </button>

          <button
            type="button"
            onClick={() => { onClose(); onBlockToggle(user); }}
            className={cn(
              "h-9 rounded-inner px-4 text-xs font-semibold text-neutral-0",
              user.actif ? "bg-error-600 hover:bg-error-700" : "bg-forest-700 hover:bg-forest-800"
            )}
          >
            {user.actif ? "Bloquer le compte" : "Débloquer le compte"}
          </button>
        </div>
      </div>
    </div>
  );
}
