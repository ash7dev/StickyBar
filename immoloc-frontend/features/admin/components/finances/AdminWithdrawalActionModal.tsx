'use client';

import { useState } from 'react';
import { X, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { RetraitPendingItem } from './AdminPendingWithdrawalsTable';

interface AdminWithdrawalActionModalProps {
  item: RetraitPendingItem | null;
  isOpen: boolean;
  isRejection: boolean;
  onClose: () => void;
  onConfirmValidate: (item: RetraitPendingItem) => void;
  onConfirmReject: (item: RetraitPendingItem, raisonRejet: string) => void;
}

function formatPrice(amount?: number | null) {
  if (amount == null) return "0 FCFA";
  return new Intl.NumberFormat("fr-SN", { style: "currency", currency: "XOF", maximumFractionDigits: 0 }).format(amount);
}

export function AdminWithdrawalActionModal({
  item,
  isOpen,
  isRejection,
  onClose,
  onConfirmValidate,
  onConfirmReject,
}: AdminWithdrawalActionModalProps) {
  const [raisonRejet, setRaisonRejet] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !item) return null;

  const user = item.wallet?.utilisateur;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isRejection && !raisonRejet.trim()) {
      setErrorMsg("Veuillez indiquer un motif de rejet.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      if (isRejection) {
        await onConfirmReject(item, raisonRejet.trim());
      } else {
        await onConfirmValidate(item);
      }
      onClose();
      setRaisonRejet('');
    } catch (err: any) {
      setErrorMsg(err?.message ?? "Erreur lors de l'exécution de l'action.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-forest-950/60 backdrop-blur-xs">
      <div className="relative w-full max-w-md rounded-card border border-border bg-background-card p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <span className={`flex h-9 w-9 items-center justify-center rounded-inner border ${
              isRejection ? 'bg-error-50 border-error-200 text-error-700' : 'bg-forest-50 border-forest-200 text-forest-700'
            }`}>
              {isRejection ? <XCircle className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
            </span>
            <h3 className="font-display text-base font-bold text-foreground">
              {isRejection ? "Rejeter la demande de virement" : "Valider le virement bancaire"}
            </h3>
          </div>
          <button type="button" onClick={onClose} className="rounded-inner p-1.5 text-foreground-muted hover:bg-background-alt">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Détails du virement */}
        <div className="rounded-inner border border-border bg-background-alt/50 p-3.5 space-y-1.5 text-xs">
          <p className="text-foreground-muted">Demandeur : <strong className="text-foreground">{user?.prenom} {user?.nom}</strong></p>
          <p className="text-foreground-muted">Montant : <strong className="text-foreground text-sm font-display font-bold">{formatPrice(item.montant)}</strong></p>
          <p className="text-foreground-muted">Mode & Destination : <strong className="text-forest-800 font-mono">{item.methode} ({item.destinataire})</strong></p>
        </div>

        {isRejection && (
          <div className="rounded-inner border border-warning-200 bg-warning-50 p-3 text-xs text-warning-800 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-warning-600 mt-0.5" />
            <span>En rejetant cette demande, le montant de {formatPrice(item.montant)} sera automatiquement recrédité sur le portefeuille de l'hôte.</span>
          </div>
        )}

        {errorMsg && (
          <div className="rounded-inner border border-error-200 bg-error-50 p-3 text-xs text-error-700 font-semibold">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {isRejection && (
            <div className="space-y-1">
              <label className="font-bold text-foreground uppercase tracking-wider text-[0.6875rem]">Motif du rejet (obligatoire) :</label>
              <textarea
                value={raisonRejet}
                onChange={(e) => setRaisonRejet(e.target.value)}
                rows={3}
                placeholder="Ex: Coordonnées Wave ou IBAN erronées..."
                className="w-full rounded-inner border border-border bg-background-card p-3 text-xs text-foreground focus:border-forest-600 focus:outline-hidden"
                required
              />
            </div>
          )}

          <div className="flex items-center justify-end gap-2 border-t border-border pt-3">
            <button type="button" onClick={onClose} className="h-9 rounded-inner border border-border bg-background-card px-4 font-semibold text-foreground hover:bg-background-alt">
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`h-9 rounded-inner px-4 font-semibold text-neutral-0 transition-colors ${
                isRejection ? 'bg-error-700 hover:bg-error-800' : 'bg-forest-700 hover:bg-forest-800'
              } disabled:opacity-50`}
            >
              {isSubmitting ? "Traitement..." : isRejection ? "Confirmer le Rejet" : "Valider & Exécuter"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
