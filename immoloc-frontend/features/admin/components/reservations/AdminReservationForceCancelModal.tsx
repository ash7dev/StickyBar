'use client';

import { useState } from 'react';
import { X, Ban, AlertTriangle, RefreshCw } from 'lucide-react';
import { ReservationItem } from './AdminReservationsTable';

interface AdminReservationForceCancelModalProps {
  reservation: ReservationItem | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmCancel: (reservation: ReservationItem, raison: string, tauxRemboursement: number) => void;
}

const COMMON_CANCEL_REASONS = [
  "Annulation d'urgence pour cas de force majeure avéré",
  "Litige grave irrésolvable entre les parties sur place",
  "Non-conformité critique du logement empêchant l'occupation",
  "Usurpation ou tentative d'escroquerie identifiée",
];

export function AdminReservationForceCancelModal({
  reservation,
  isOpen,
  onClose,
  onConfirmCancel,
}: AdminReservationForceCancelModalProps) {
  const [raison, setRaison] = useState('');
  const [tauxRemboursement, setTauxRemboursement] = useState(100);

  if (!isOpen || !reservation) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!raison.trim()) return;
    onConfirmCancel(reservation, raison.trim(), tauxRemboursement);
    setRaison('');
    setTauxRemboursement(100);
    onClose();
  };

  const montantTotal = Number(reservation.totalLocataire ?? 0);
  const montantRembourse = (montantTotal * tauxRemboursement) / 100;

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
              <h2 className="font-display text-base font-bold text-foreground">Annulation Administrative Forcée</h2>
              <p className="text-xs text-foreground-muted">
                Logement : {reservation.logement?.titre ?? "—"}
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
              Cette action annulera immédiatement la réservation en contournant les politiques ordinaires de l'hôte. Les dates seront libérées sur le calendrier.
            </p>
          </div>

          {/* Preset Reasons */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-foreground">
              Motifs d'annulation rapide :
            </label>
            <div className="space-y-1.5">
              {COMMON_CANCEL_REASONS.map((r) => (
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

          {/* Reason Input */}
          <div className="space-y-1.5">
            <label htmlFor="cancel-reason" className="block text-xs font-semibold text-foreground">
              Motif officiel de l'annulation (transmis au locataire et propriétaire) :
            </label>
            <textarea
              id="cancel-reason"
              value={raison}
              onChange={(e) => setRaison(e.target.value)}
              placeholder="Rédigez la raison explicite de l'annulation d'urgence..."
              rows={3}
              required
              className="w-full rounded-inner border border-border bg-background-card p-3 text-xs text-foreground placeholder:text-foreground-muted focus:border-forest-500 focus:outline-none"
            />
          </div>

          {/* Refund Slider */}
          <div className="space-y-2 rounded-inner border border-border bg-background-alt/40 p-4">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-foreground">Taux de remboursement locataire :</span>
              <span className="font-bold text-forest-800">{tauxRemboursement}% ({new Intl.NumberFormat("fr-SN", { style: "currency", currency: "XOF" }).format(montantRembourse)})</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={10}
              value={tauxRemboursement}
              onChange={(e) => setTauxRemboursement(Number(e.target.value))}
              className="w-full accent-forest-700 cursor-pointer"
            />
            <div className="flex justify-between text-[0.625rem] text-foreground-muted">
              <span>0% (Aucun remboursement)</span>
              <span>50% (Partiel)</span>
              <span>100% (Remboursement total)</span>
            </div>
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
              Exécuter l'annulation forcée
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
