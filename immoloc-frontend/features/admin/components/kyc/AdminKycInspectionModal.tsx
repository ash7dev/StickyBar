'use client';

import { X, Check, ShieldAlert, Eye, UserCheck, Image as ImageIcon, Calendar, Phone, Mail } from 'lucide-react';
import { KycUserItem } from './AdminKycTable';
import { cn } from '@/lib/utils/cn';

interface AdminKycInspectionModalProps {
  user: KycUserItem | null;
  isOpen: boolean;
  onClose: () => void;
  onVerify: (user: KycUserItem) => void;
  onReject: (user: KycUserItem) => void;
}

export function AdminKycInspectionModal({
  user,
  isOpen,
  onClose,
  onVerify,
  onReject,
}: AdminKycInspectionModalProps) {
  if (!isOpen || !user) return null;

  const fullName = `${user.prenom ?? ''} ${user.nom ?? ''}`.trim() || 'Utilisateur';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-forest-950/60 backdrop-blur-xs overflow-y-auto no-scrollbar">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto no-scrollbar rounded-card border border-border bg-background-card p-6 shadow-2xl space-y-6">
        {/* Header Modal */}
        <div className="flex items-start justify-between border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-inner bg-purple-50 border border-purple-200 text-purple-800">
              <Eye className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-display text-lg font-bold text-foreground">
                Inspection du Dossier KYC — {fullName}
              </h2>
              <p className="text-xs text-foreground-muted">
                Vérification des pièces officielles d'identité (CNI / Passeport) et du selfie
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-inner p-1.5 text-foreground-muted hover:bg-background-alt hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Informations utilisateur & Fiche comparative */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 rounded-inner border border-border bg-background-alt/40 p-4">
          <div className="space-y-1">
            <p className="text-[0.6875rem] font-semibold uppercase tracking-wider text-foreground-muted">Nom Complet</p>
            <p className="text-xs font-bold text-foreground">{fullName}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[0.6875rem] font-semibold uppercase tracking-wider text-foreground-muted">Email Utilisateur</p>
            <p className="text-xs font-medium text-foreground truncate">{user.email}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[0.6875rem] font-semibold uppercase tracking-wider text-foreground-muted">Téléphone</p>
            <p className="text-xs font-mono font-medium text-foreground">{user.telephone || 'Non renseigné'}</p>
          </div>
        </div>

        {/* Documents d'identité (CNI Recto, Verso, Selfie) */}
        <div className="space-y-3">
          <h3 className="font-display text-xs font-bold uppercase tracking-wider text-foreground">
            Pièces Justificatives Déposées
          </h3>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {/* CNI Recto */}
            <div className="space-y-2">
              <p className="text-[0.6875rem] font-semibold text-foreground-muted flex items-center gap-1.5">
                <ImageIcon className="h-3.5 w-3.5 text-purple-700" />
                CNI / Passeport (Recto)
              </p>
              <div className="group relative h-48 w-full overflow-hidden rounded-inner border border-border bg-background-alt">
                {user.kycDocumentUrl ? (
                  <img
                    src={user.kycDocumentUrl}
                    alt="CNI Recto"
                    className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center p-4 text-center text-xs text-foreground-muted">
                    Aucun document Recto téléversé
                  </div>
                )}
              </div>
            </div>

            {/* CNI Verso */}
            <div className="space-y-2">
              <p className="text-[0.6875rem] font-semibold text-foreground-muted flex items-center gap-1.5">
                <ImageIcon className="h-3.5 w-3.5 text-purple-700" />
                CNI / Passeport (Verso)
              </p>
              <div className="group relative h-48 w-full overflow-hidden rounded-inner border border-border bg-background-alt">
                {user.kycVersoUrl ? (
                  <img
                    src={user.kycVersoUrl}
                    alt="CNI Verso"
                    className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center p-4 text-center text-xs text-foreground-muted">
                    Aucun document Verso téléversé
                  </div>
                )}
              </div>
            </div>

            {/* Selfie Facial */}
            <div className="space-y-2">
              <p className="text-[0.6875rem] font-semibold text-foreground-muted flex items-center gap-1.5">
                <UserCheck className="h-3.5 w-3.5 text-forest-700" />
                Selfie de Vérification
              </p>
              <div className="group relative h-48 w-full overflow-hidden rounded-inner border border-border bg-background-alt">
                {user.kycSelfieUrl ? (
                  <img
                    src={user.kycSelfieUrl}
                    alt="Selfie Facial"
                    className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center p-4 text-center text-xs text-foreground-muted">
                    Aucun selfie téléversé
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Raison du rejet en cas de refus antérieur */}
        {user.kycRejectionReason && (
          <div className="rounded-inner border border-error-200 bg-error-50 p-3.5 space-y-1">
            <p className="text-[0.6875rem] font-bold uppercase tracking-wider text-error-800">
              Motif du précédent rejet :
            </p>
            <p className="text-xs text-error-900">{user.kycRejectionReason}</p>
          </div>
        )}

        {/* Pied de Modal : Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
          <button
            type="button"
            onClick={onClose}
            className="h-9 rounded-inner border border-border bg-background-card px-4 text-xs font-semibold text-foreground hover:bg-background-alt"
          >
            Fermer
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onReject(user);
            }}
            className="h-9 rounded-inner border border-error-200 bg-error-50 px-4 text-xs font-semibold text-error-700 hover:bg-error-100"
          >
            Rejeter le dossier
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onVerify(user);
            }}
            className="inline-flex h-9 items-center gap-1.5 rounded-inner bg-forest-700 px-5 text-xs font-semibold text-neutral-0 hover:bg-forest-800"
          >
            <Check className="h-4 w-4" />
            <span>Valider et Approber</span>
          </button>
        </div>
      </div>
    </div>
  );
}
