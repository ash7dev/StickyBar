'use client';

import { useState } from 'react';
import { X, Ban, AlertTriangle } from 'lucide-react';
import { LogementCatalogItem } from './AdminLogementsTable';

interface AdminLogementSuspendModalProps {
  listing: LogementCatalogItem | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmReject: (listing: LogementCatalogItem, raison: string) => void;
  isSuspension?: boolean;
}

const COMMON_REASONS = [
  "Photos non conformes ou trompeuses par rapport à la réalité",
  "Non-respect des normes de sécurité de l'hébergement",
  "Plaintes répétées de voyageurs pour insalubrité ou dysfonctionnement",
  "Usurpation de propriété ou document de légitimité douteux",
  "Tarification abusive ou non-respect de l'engagement de réservation",
];

export function AdminLogementSuspendModal({
  listing,
  isOpen,
  onClose,
  onConfirmReject,
  isSuspension = false,
}: AdminLogementSuspendModalProps) {
  const [raison, setRaison] = useState('');

  if (!isOpen || !listing) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!raison.trim()) return;
    onConfirmReject(listing, raison.trim());
    setRaison('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-forest-950/60 backdrop-blur-xs">
      <div className="relative w-full max-w-lg rounded-card border border-border bg-background-card p-6 shadow-2xl space-y-5 no-scrollbar max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-inner bg-error-50 border border-error-200 text-error-700">
              <Ban className="h-4.5 w-4.5" />
            </span>
            <div>
              <h2 className="font-display text-base font-bold text-foreground">
                {isSuspension ? "Suspension Administrative du Logement" : "Rejet de l'Annonce"}
              </h2>
              <p className="text-xs text-foreground-muted">
                Bien : {listing.titre} ({listing.ville})
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-inner p-1.5 text-foreground-muted hover:bg-background-alt hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Warning Banner */}
          <div className="rounded-inner border border-error-200 bg-error-50 p-3 flex items-start gap-2.5">
            <AlertTriangle className="h-4 w-4 text-error-700 shrink-0 mt-0.5" />
            <p className="text-[0.6875rem] text-error-900 leading-snug">
              {isSuspension
                ? "Le logement sera immédiatement retiré de la recherche et masqué pour les voyageurs."
                : "L'annonce sera rejetée et l'hôte sera notifié du motif de refus."}
            </p>
          </div>

          {/* Presets */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-foreground">
              Sélectionner un motif fréquent :
            </label>
            <div className="space-y-1.5">
              {COMMON_REASONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRaison(r)}
                  className="w-full text-left rounded-inner border border-border bg-background-alt/50 p-2.5 text-xs text-foreground hover:bg-background-alt transition-colors"
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Textarea */}
          <div className="space-y-1.5">
            <label htmlFor="suspend-reason" className="block text-xs font-semibold text-foreground">
              Motif explicite (envoyé au propriétaire) :
            </label>
            <textarea
              id="suspend-reason"
              value={raison}
              onChange={(e) => setRaison(e.target.value)}
              placeholder="Rédigez la raison officielle de cette décision..."
              rows={3}
              required
              className="w-full rounded-inner border border-border bg-background-card p-3 text-xs text-foreground placeholder:text-foreground-muted focus:border-forest-500 focus:outline-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 border-t border-border pt-3">
            <button type="button" onClick={onClose} className="h-9 rounded-inner border border-border bg-background-card px-4 text-xs font-semibold text-foreground hover:bg-background-alt">
              Annuler
            </button>
            <button
              type="submit"
              disabled={!raison.trim()}
              className="h-9 rounded-inner bg-error-600 px-5 text-xs font-semibold text-neutral-0 hover:bg-error-700 disabled:opacity-50"
            >
              {isSuspension ? "Confirmer la suspension" : "Confirmer le rejet"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
