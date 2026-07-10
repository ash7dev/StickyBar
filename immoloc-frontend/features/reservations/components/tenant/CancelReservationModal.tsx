'use client';

import { useState, useMemo } from 'react';
import { X, AlertTriangle, Loader2, XCircle, DollarSign } from 'lucide-react';
import { nestFetch } from '@/lib/nestjs/api-client';
import { NEST_API } from '@/lib/nestjs/endpoints';
import { cn } from '@/lib/utils/cn';

/* ─── Types ───────────────────────────────────────────────────────────────── */

interface Props {
  reservationId: string;
  dateDebut: string;
  onSuccess: () => void;
  onClose: () => void;
}

/* ─── Feedback Component ──────────────────────────────────────────────────── */

function Feedback({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl p-3.5">
      <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
      <p className="text-xs font-semibold leading-relaxed">{message}</p>
    </div>
  );
}

/* ─── Main Component ──────────────────────────────────────────────────────── */

export function CancelReservationModal({ reservationId, dateDebut, onSuccess, onClose }: Props) {
  const [raison, setRaison] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const now = Date.now();
  const checkinDate = new Date(dateDebut).getTime();
  const diffMsToCheckin = checkinDate - now;
  const diffDaysToCheckin = diffMsToCheckin / (1000 * 60 * 60 * 24);
  const diffHoursToCheckin = diffMsToCheckin / 3_600_000;

  // Politique de remboursement
  const refundPolicy = useMemo(() => {
    if (diffDaysToCheckin > 7) {
      return {
        percentage: 100,
        label: 'Remboursement intégral',
        color: 'emerald',
        description: 'Plus de 7 jours avant le check-in',
      };
    } else if (diffDaysToCheckin >= 3) {
      return {
        percentage: 50,
        label: 'Remboursement partiel',
        color: 'amber',
        description: '3 à 7 jours avant le check-in',
      };
    } else if (diffHoursToCheckin >= 24) {
      return {
        percentage: 25,
        label: 'Remboursement minimal',
        color: 'rose',
        description: '24h à 3 jours avant le check-in',
      };
    } else {
      return {
        percentage: 0,
        label: 'Pas de remboursement',
        color: 'red',
        description: 'Moins de 24h avant le check-in',
      };
    }
  }, [diffDaysToCheckin, diffHoursToCheckin]);

  const handleSubmit = async () => {
    // Validation
    if (!raison.trim()) {
      setErrorMsg('Veuillez indiquer un motif d\'annulation.');
      return;
    }

    if (raison.trim().length < 15) {
      setErrorMsg('Le motif doit contenir au moins 15 caractères.');
      return;
    }

    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      await nestFetch(NEST_API.RESERVATIONS.CANCEL(reservationId), {
        method: 'PATCH',
        body: JSON.stringify({ raison: raison.trim() }),
      });

      onSuccess();
      onClose();
    } catch (error: any) {
      setErrorMsg(
        error?.message || 'Une erreur est survenue lors de l\'annulation. Veuillez réessayer.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-lg bg-surface-dark border border-white/10 rounded-t-3xl sm:rounded-2xl shadow-2xl shadow-black/60 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/8">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0">
              <XCircle className="w-4.5 h-4.5 text-rose-400" />
            </div>
            <h3 className="text-sm font-bold text-white">Annuler la réservation</h3>
          </div>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="w-8 h-8 rounded-xl bg-white/8 hover:bg-white/12 disabled:opacity-40 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-neutral-400" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Warning Banner */}
          <div className="flex items-start gap-3 bg-rose-500/10 border border-rose-500/20 rounded-xl p-3.5">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-xs font-bold text-rose-300">
                Cette action est irréversible
              </p>
              <p className="text-[11px] text-rose-300/80 leading-relaxed">
                Une fois confirmée, votre réservation sera définitivement annulée. Le
                remboursement sera effectué selon la politique ci-dessous.
              </p>
            </div>
          </div>

          {/* Refund Policy */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-neutral-300">Politique de remboursement</p>
              <div className="flex items-center gap-1.5">
                <DollarSign className={`w-3.5 h-3.5 text-${refundPolicy.color}-400`} />
                <span className={`text-xs font-black text-${refundPolicy.color}-300`}>
                  {refundPolicy.percentage}%
                </span>
              </div>
            </div>

            {/* Grid refund percentages */}
            <div className="grid grid-cols-3 gap-2">
              <div className={cn(
                'rounded-xl p-3 text-center border transition-all',
                diffDaysToCheckin > 7
                  ? 'bg-emerald-500/15 border-emerald-500/30 ring-2 ring-emerald-500/20'
                  : 'bg-white/5 border-white/8 opacity-40',
              )}>
                <p className="text-xs font-black text-emerald-400">100%</p>
                <p className="text-[10px] text-neutral-500 mt-0.5">&gt; 7 jours</p>
              </div>
              <div className={cn(
                'rounded-xl p-3 text-center border transition-all',
                diffDaysToCheckin >= 3 && diffDaysToCheckin <= 7
                  ? 'bg-amber-500/15 border-amber-500/30 ring-2 ring-amber-500/20'
                  : 'bg-white/5 border-white/8 opacity-40',
              )}>
                <p className="text-xs font-black text-amber-400">50%</p>
                <p className="text-[10px] text-neutral-500 mt-0.5">3–7 jours</p>
              </div>
              <div className={cn(
                'rounded-xl p-3 text-center border transition-all',
                diffHoursToCheckin >= 24 && diffDaysToCheckin < 3
                  ? 'bg-rose-500/15 border-rose-500/30 ring-2 ring-rose-500/20'
                  : 'bg-white/5 border-white/8 opacity-40',
              )}>
                <p className="text-xs font-black text-rose-400">25%</p>
                <p className="text-[10px] text-neutral-500 mt-0.5">24h–3j</p>
              </div>
            </div>

            <div className={`flex items-start gap-2.5 rounded-xl p-3 bg-${refundPolicy.color}-500/10 border border-${refundPolicy.color}-500/20`}>
              <DollarSign className={`w-4 h-4 text-${refundPolicy.color}-400 shrink-0 mt-0.5`} />
              <div>
                <p className={`text-xs font-bold text-${refundPolicy.color}-300`}>
                  {refundPolicy.label}
                </p>
                <p className={`text-[11px] text-${refundPolicy.color}-400/80 mt-0.5 leading-relaxed`}>
                  Vous serez remboursé à hauteur de{' '}
                  <span className="font-black text-white">{refundPolicy.percentage}%</span>{' '}
                  du montant payé. {refundPolicy.description}.
                </p>
              </div>
            </div>
          </div>

          {/* Raison */}
          <div>
            <label className="block text-xs font-bold text-neutral-300 mb-1.5">
              Motif d&apos;annulation <span className="text-rose-400">*</span>
            </label>
            <p className="text-[11px] text-neutral-500 mb-2.5 leading-relaxed">
              Aidez-nous à comprendre pourquoi vous annulez cette réservation.
            </p>
            <textarea
              rows={4}
              className="w-full text-xs bg-white/5 border border-white/10 text-white placeholder:text-neutral-600 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-rose-400/40 resize-none disabled:opacity-40"
              placeholder="Ex : Un imprévu professionnel m'empêche de voyager à ces dates..."
              value={raison}
              onChange={(e) => setRaison(e.target.value)}
              disabled={isSubmitting}
            />
            <div className="flex items-center justify-between mt-1.5">
              <p className="text-[10px] text-neutral-600">Minimum 15 caractères</p>
              <p
                className={`text-[10px] font-bold ${
                  raison.length >= 15 ? 'text-emerald-400' : 'text-neutral-600'
                }`}
              >
                {raison.length} caractères
              </p>
            </div>
          </div>

          {/* Error Feedback */}
          {errorMsg && <Feedback message={errorMsg} />}

          {/* Info Footer */}
          <div className="bg-white/5 border border-white/8 rounded-xl p-3.5">
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              <span className="font-bold text-neutral-300">Délai de remboursement :</span> Le
              remboursement sera traité sous 3 à 5 jours ouvrés après annulation. Vous recevrez
              une confirmation par email.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex gap-3 px-6 py-4 bg-white/5 border-t border-white/8">
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="flex-1 py-3 text-xs font-bold text-neutral-400 bg-white/5 hover:bg-white/8 border border-white/8 rounded-xl transition-all disabled:opacity-40"
          >
            Retour
          </button>
          <button
            onClick={handleSubmit}
            disabled={!raison.trim() || raison.trim().length < 15 || isSubmitting}
            className="flex-1 flex items-center justify-center gap-2 py-3 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:bg-neutral-800 disabled:text-neutral-500 rounded-xl transition-all shadow-md shadow-rose-600/20 disabled:shadow-none"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Annulation en cours...
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4" />
                Confirmer l&apos;annulation
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
