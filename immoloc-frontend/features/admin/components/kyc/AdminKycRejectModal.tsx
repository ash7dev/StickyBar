'use client';

import { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { KycUserItem } from './AdminKycTable';

interface AdminKycRejectModalProps {
  user: KycUserItem | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmReject: (user: KycUserItem, reason: string) => void;
}

const COMMON_REJECTION_REASONS = [
  'Document d’identité flou, Sombre ou illisible',
  'CNI ou Passeport expiré',
  'Le selfie ne correspond pas à la photo de la pièce d’identité',
  'Informations saisies non conformes à la pièce d’identité',
  'Document incomplet (manque le verso de la CNI)',
];

export function AdminKycRejectModal({
  user,
  isOpen,
  onClose,
  onConfirmReject,
}: AdminKycRejectModalProps) {
  const [reason, setReason] = useState('');

  if (!isOpen || !user) return null;

  const fullName = `${user.prenom ?? ''} ${user.nom ?? ''}`.trim() || 'Utilisateur';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;
    onConfirmReject(user, reason.trim());
    setReason('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-forest-950/60 backdrop-blur-xs">
      <div className="relative w-full max-w-lg rounded-card border border-border bg-background-card p-6 shadow-2xl space-y-5">
        {/* Header Modal */}
        <div className="flex items-start justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-inner bg-error-50 border border-error-200 text-error-700">
              <AlertTriangle className="h-4.5 w-4.5" />
            </span>
            <div>
              <h2 className="font-display text-base font-bold text-foreground">
                Rejeter le Dossier KYC
              </h2>
              <p className="text-xs text-foreground-muted">
                Motif du refus pour {fullName}
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="rejection-reason" className="block text-xs font-semibold text-foreground">
              Motifs fréquents de rejet :
            </label>

            <div className="space-y-1.5">
              {COMMON_REJECTION_REASONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setReason(r)}
                  className="w-full text-left rounded-inner border border-border bg-background-alt/50 p-2.5 text-xs text-foreground hover:bg-background-alt transition-colors"
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="custom-reason" className="block text-xs font-semibold text-foreground">
              Motif détaillé transmis à l'utilisateur :
            </label>
            <textarea
              id="custom-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Expliquez clairement ce que l'utilisateur doit corriger lors du prochain téléversement..."
              rows={3}
              required
              className="w-full rounded-inner border border-border bg-background-card p-3 text-xs text-foreground placeholder:text-foreground-muted focus:border-error-500 focus:outline-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 border-t border-border pt-3">
            <button
              type="button"
              onClick={onClose}
              className="h-9 rounded-inner border border-border bg-background-card px-4 text-xs font-semibold text-foreground hover:bg-background-alt"
            >
              Annuler
            </button>

            <button
              type="submit"
              disabled={!reason.trim()}
              className="h-9 rounded-inner bg-error-600 px-5 text-xs font-semibold text-neutral-0 hover:bg-error-700 disabled:opacity-50"
            >
              Confirmer le refus
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
