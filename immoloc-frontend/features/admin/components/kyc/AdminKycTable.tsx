'use client';

import { Eye, Check, X, ShieldAlert, CheckCircle2, Clock, XCircle, RotateCcw, User } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface KycUserItem {
  id: string;
  userId?: string;
  prenom?: string;
  nom?: string;
  email?: string;
  telephone?: string;
  statutKyc: 'NON_VERIFIE' | 'EN_ATTENTE' | 'VERIFIE' | 'REJETE';
  kycDocumentUrl?: string | null;
  kycVersoUrl?: string | null;
  kycSelfieUrl?: string | null;
  kycRejectionReason?: string | null;
  selfieMatchScore?: number | null;
  creeLe?: string;
  misAJourLe?: string;
}

interface AdminKycTableProps {
  users: KycUserItem[];
  isLoading?: boolean;
  onInspect: (user: KycUserItem) => void;
  onVerify: (user: KycUserItem) => void;
  onReject: (user: KycUserItem) => void;
  onFlagRenewal: (user: KycUserItem) => void;
}

export function AdminKycTable({
  users,
  isLoading = false,
  onInspect,
  onVerify,
  onReject,
  onFlagRenewal,
}: AdminKycTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-3 rounded-card border border-border bg-background-card p-6">
        {[1, 2, 3, 4].map((n) => (
          <div key={n} className="h-16 animate-pulse rounded-inner bg-background-alt" />
        ))}
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-card border border-dashed border-border bg-background-card p-12 text-center space-y-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-pill bg-forest-50 border border-forest-200 text-forest-700">
          <CheckCircle2 className="h-6 w-6" />
        </span>
        <div>
          <p className="font-display text-base font-semibold text-foreground">Aucun dossier KYC trouvé</p>
          <p className="text-xs text-foreground-muted">Tous les dossiers soumis ont été traités ou la recherche ne retourne aucun résultat.</p>
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
              <th className="py-3.5 px-4">Pièces Jointes</th>
              <th className="py-3.5 px-4">Facial Match AI</th>
              <th className="py-3.5 px-4">Statut KYC</th>
              <th className="py-3.5 px-4 text-right sm:px-6">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-border">
            {users.map((item) => {
              const fullName = `${item.prenom ?? ''} ${item.nom ?? ''}`.trim() || 'Utilisateur Klef';
              const initials = (item.prenom?.[0] ?? item.email?.[0] ?? 'U').toUpperCase();

              return (
                <tr key={item.id} className="transition-colors hover:bg-background-alt/40">
                  {/* Identité */}
                  <td className="py-4 px-4 sm:px-6">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-inner bg-forest-800 font-display text-xs font-bold text-neutral-0 shrink-0">
                        {initials}
                      </span>
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground truncate">{fullName}</p>
                        <p className="text-[0.75rem] text-foreground-muted truncate">{item.email}</p>
                        {item.telephone && (
                          <p className="text-[0.6875rem] font-mono text-foreground-muted">{item.telephone}</p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Document & Date */}
                  <td className="py-4 px-4">
                    <div className="space-y-1">
                      <span className="inline-flex items-center gap-1 rounded-pill bg-purple-50 border border-purple-200 px-2 py-0.5 text-[0.6875rem] font-semibold text-purple-800">
                        CNI / Passeport
                      </span>
                      {item.creeLe && (
                        <p className="text-[0.6875rem] text-foreground-muted">
                          Soumis le {new Date(item.creeLe).toLocaleDateString('fr-FR')}
                        </p>
                      )}
                    </div>
                  </td>

                  {/* Score de correspondance faciale AI */}
                  <td className="py-4 px-4">
                    {item.selfieMatchScore != null ? (
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-foreground tabular-nums">
                            {Math.round(item.selfieMatchScore)}%
                          </span>
                          <span
                            className={cn(
                              'h-2 w-2 rounded-full',
                              item.selfieMatchScore >= 80 ? 'bg-forest-600' : 'bg-warning-600'
                            )}
                          />
                        </div>
                        <div className="h-1.5 w-20 rounded-pill bg-background-alt overflow-hidden">
                          <div
                            className={cn(
                              'h-full rounded-pill transition-all',
                              item.selfieMatchScore >= 80 ? 'bg-forest-600' : 'bg-warning-600'
                            )}
                            style={{ width: `${Math.min(100, item.selfieMatchScore)}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <span className="text-[0.6875rem] text-foreground-muted">Vérification manuelle</span>
                    )}
                  </td>

                  {/* Statut KYC */}
                  <td className="py-4 px-4">
                    {item.statutKyc === 'VERIFIE' && (
                      <span className="inline-flex items-center gap-1 rounded-pill bg-forest-50 border border-forest-200 px-2.5 py-1 text-xs font-semibold text-forest-800">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Vérifié
                      </span>
                    )}
                    {item.statutKyc === 'EN_ATTENTE' && (
                      <span className="inline-flex items-center gap-1 rounded-pill bg-warning-50 border border-warning-200 px-2.5 py-1 text-xs font-semibold text-warning-800">
                        <Clock className="h-3.5 w-3.5" />
                        En Attente
                      </span>
                    )}
                    {item.statutKyc === 'REJETE' && (
                      <span className="inline-flex items-center gap-1 rounded-pill bg-error-50 border border-error-200 px-2.5 py-1 text-xs font-semibold text-error-800">
                        <XCircle className="h-3.5 w-3.5" />
                        Rejeté
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-4 px-4 text-right sm:px-6">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => onInspect(item)}
                        className="inline-flex h-8 items-center gap-1 rounded-inner border border-border bg-background-card px-2.5 text-xs font-semibold text-foreground hover:bg-background-alt"
                        title="Inspecter les documents haute définition"
                      >
                        <Eye className="h-3.5 w-3.5 text-foreground-muted" />
                        <span className="hidden sm:inline">Inspecter</span>
                      </button>

                      {item.statutKyc !== 'VERIFIE' && (
                        <button
                          type="button"
                          onClick={() => onVerify(item)}
                          className="inline-flex h-8 items-center gap-1 rounded-inner bg-forest-700 px-2.5 text-xs font-semibold text-neutral-0 hover:bg-forest-800"
                          title="Valider le dossier KYC"
                        >
                          <Check className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">Valider</span>
                        </button>
                      )}

                      {item.statutKyc !== 'REJETE' && (
                        <button
                          type="button"
                          onClick={() => onReject(item)}
                          className="inline-flex h-8 items-center gap-1 rounded-inner border border-error-200 bg-error-50 px-2.5 text-xs font-semibold text-error-700 hover:bg-error-100"
                          title="Rejeter le dossier KYC"
                        >
                          <X className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">Rejeter</span>
                        </button>
                      )}
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
