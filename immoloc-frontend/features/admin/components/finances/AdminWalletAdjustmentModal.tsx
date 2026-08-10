'use client';

import { useState } from 'react';
import { X, PlusCircle, MinusCircle, Wallet, AlertTriangle } from 'lucide-react';
import { adminApi } from '@/lib/nestjs';

interface AdminWalletAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}

export function AdminWalletAdjustmentModal({
  isOpen,
  onClose,
  onSuccess,
}: AdminWalletAdjustmentModalProps) {
  const [utilisateurId, setUtilisateurId] = useState('');
  const [montant, setMontant] = useState('');
  const [sens, setSens] = useState<'CREDIT' | 'DEBIT'>('CREDIT');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!utilisateurId.trim()) {
      setErrorMsg("Veuillez saisir l'UUID de l'utilisateur.");
      return;
    }
    const valMontant = Number(montant);
    if (isNaN(valMontant) || valMontant <= 0) {
      setErrorMsg("Le montant doit être un nombre strictement positif.");
      return;
    }
    if (!description.trim()) {
      setErrorMsg("Veuillez fournir un motif d'ajustement.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await adminApi.adjustWalletBalance({
        utilisateurId: utilisateurId.trim(),
        montant: valMontant,
        sens,
        description: description.trim(),
      });
      onSuccess(res?.message ?? `Portefeuille ${sens === 'CREDIT' ? 'crédité' : 'débité'} avec succès !`);
      onClose();
      // Reset
      setUtilisateurId('');
      setMontant('');
      setDescription('');
    } catch (err: any) {
      setErrorMsg(err?.message ?? "Erreur lors de l'ajustement du portefeuille.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-forest-950/60 backdrop-blur-xs">
      <div className="relative w-full max-w-md rounded-card border border-border bg-background-card p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-inner bg-forest-50 border border-forest-200 text-forest-700">
              <Wallet className="h-5 w-5" />
            </span>
            <h3 className="font-display text-base font-bold text-foreground">Ajustement Manuel Wallet</h3>
          </div>
          <button type="button" onClick={onClose} className="rounded-inner p-1.5 text-foreground-muted hover:bg-background-alt">
            <X className="h-5 w-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="rounded-inner border border-error-200 bg-error-50 p-3 text-xs text-error-700 font-semibold flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Sens */}
          <div className="space-y-1">
            <label className="font-bold text-foreground uppercase tracking-wider text-[0.6875rem]">Sens de l'opération :</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSens('CREDIT')}
                className={`h-9 rounded-inner border font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                  sens === 'CREDIT' ? 'border-forest-600 bg-forest-50 text-forest-900 font-bold' : 'border-border bg-background-card text-foreground-muted'
                }`}
              >
                <PlusCircle className="h-4 w-4 text-forest-600" /> Créditer (Ajout)
              </button>
              <button
                type="button"
                onClick={() => setSens('DEBIT')}
                className={`h-9 rounded-inner border font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                  sens === 'DEBIT' ? 'border-error-600 bg-error-50 text-error-900 font-bold' : 'border-border bg-background-card text-foreground-muted'
                }`}
              >
                <MinusCircle className="h-4 w-4 text-error-600" /> Débiter (Retrait)
              </button>
            </div>
          </div>

          {/* Utilisateur ID */}
          <div className="space-y-1">
            <label className="font-bold text-foreground uppercase tracking-wider text-[0.6875rem]">UUID Utilisateur :</label>
            <input
              type="text"
              value={utilisateurId}
              onChange={(e) => setUtilisateurId(e.target.value)}
              placeholder="ex: 7b888ba9-3332-4f9c-aa11-137585a101e2"
              className="h-9 w-full rounded-inner border border-border bg-background-card px-3 text-xs text-foreground font-mono focus:border-forest-600 focus:outline-hidden"
              required
            />
          </div>

          {/* Montant FCFA */}
          <div className="space-y-1">
            <label className="font-bold text-foreground uppercase tracking-wider text-[0.6875rem]">Montant (XOF / FCFA) :</label>
            <input
              type="number"
              value={montant}
              onChange={(e) => setMontant(e.target.value)}
              placeholder="ex: 50000"
              className="h-9 w-full rounded-inner border border-border bg-background-card px-3 text-xs font-bold text-foreground focus:border-forest-600 focus:outline-hidden"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="font-bold text-foreground uppercase tracking-wider text-[0.6875rem]">Motif / Explication Admin :</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Raison administrative ou compensation client..."
              className="w-full rounded-inner border border-border bg-background-card p-3 text-xs text-foreground focus:border-forest-600 focus:outline-hidden"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-border pt-3">
            <button type="button" onClick={onClose} className="h-9 rounded-inner border border-border bg-background-card px-4 font-semibold text-foreground hover:bg-background-alt">
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="h-9 rounded-inner bg-forest-700 px-4 font-semibold text-neutral-0 hover:bg-forest-800 disabled:opacity-50"
            >
              {isSubmitting ? "Traitement..." : "Confirmer l'Ajustement"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
