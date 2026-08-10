'use client';

import { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { ListingItem } from './AdminListingsTable';

interface AdminListingRejectModalProps {
  listing: ListingItem | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmReject: (listing: ListingItem, raison: string) => void;
  /** If true, this is a suspension modal instead of a rejection modal */
  isSuspension?: boolean;
}

const COMMON_REJECTION_REASONS = [
  'Photos insuffisantes ou ne correspondant pas au logement',
  'Description incomplète ou trompeuse',
  'Le prix annoncé est incohérent avec le type de logement',
  'Adresse inexacte ou logement introuvable à cette localisation',
  'Équipements annoncés non vérifiables',
];

const COMMON_SUSPENSION_REASONS = [
  "Signalements multiples de locataires insatisfaits",
  "Logement ne correspondant pas aux photos après visite d'un agent",
  "Problème de sécurité ou de salubrité constaté",
  "Fraude ou usurpation d'identité du propriétaire",
  "Non-respect des conditions d'utilisation de Klef",
];

export function AdminListingRejectModal({
  listing,
  isOpen,
  onClose,
  onConfirmReject,
  isSuspension = false,
}: AdminListingRejectModalProps) {
  const [reason, setReason] = useState('');

  if (!isOpen || !listing) return null;

  const reasons = isSuspension ? COMMON_SUSPENSION_REASONS : COMMON_REJECTION_REASONS;
  const title = isSuspension ? "Suspendre l'Annonce" : "Rejeter l'Annonce";
  const subtitle = isSuspension
    ? `Suspension de « ${listing.titre} » — les réservations confirmées seront annulées avec remboursement.`
    : `Motif de rejet de « ${listing.titre} »`;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;
    onConfirmReject(listing, reason.trim());
    setReason('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-forest-950/60 backdrop-blur-xs">
      <div className="relative w-full max-w-lg rounded-card border border-border bg-background-card p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2.5">
            <span className={`flex h-9 w-9 items-center justify-center rounded-inner border ${isSuspension ? 'bg-warning-50 border-warning-200 text-warning-700' : 'bg-error-50 border-error-200 text-error-700'}`}>
              <AlertTriangle className="h-4.5 w-4.5" />
            </span>
            <div>
              <h2 className="font-display text-base font-bold text-foreground">{title}</h2>
              <p className="text-xs text-foreground-muted">{subtitle}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-inner p-1.5 text-foreground-muted hover:bg-background-alt hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-foreground">
              Motifs fréquents :
            </label>
            <div className="space-y-1.5">
              {reasons.map((r) => (
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
            <label htmlFor="listing-rejection-reason" className="block text-xs font-semibold text-foreground">
              Motif détaillé transmis au propriétaire :
            </label>
            <textarea
              id="listing-rejection-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Décrivez clairement la raison pour que le propriétaire puisse corriger son annonce…"
              rows={3}
              required
              className="w-full rounded-inner border border-border bg-background-card p-3 text-xs text-foreground placeholder:text-foreground-muted focus:border-error-500 focus:outline-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 border-t border-border pt-3">
            <button type="button" onClick={onClose} className="h-9 rounded-inner border border-border bg-background-card px-4 text-xs font-semibold text-foreground hover:bg-background-alt">
              Annuler
            </button>
            <button
              type="submit"
              disabled={!reason.trim()}
              className={`h-9 rounded-inner px-5 text-xs font-semibold text-neutral-0 disabled:opacity-50 ${isSuspension ? 'bg-warning-600 hover:bg-warning-700' : 'bg-error-600 hover:bg-error-700'}`}
            >
              {isSuspension ? 'Confirmer la suspension' : 'Confirmer le rejet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
