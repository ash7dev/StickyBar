'use client';

import { useState } from 'react';
import { X, AlertTriangle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { nestFetch } from '@/lib/nestjs/api-client';
import { NEST_API } from '@/lib/nestjs/endpoints';

/* ─── Types ───────────────────────────────────────────────────────────────── */

interface Props {
  reservationId: string;
  onSuccess: () => void;
  onClose: () => void;
}

type RefusalMotif = 'NON_CONFORMITE' | 'DEGATS' | 'ACCES_IMPOSSIBLE' | 'AUTRE';

const MOTIFS: { value: RefusalMotif; label: string; description: string }[] = [
  {
    value: 'NON_CONFORMITE',
    label: 'Logement non conforme',
    description: 'Le logement ne correspond pas aux photos ou à la description',
  },
  {
    value: 'DEGATS',
    label: 'Dégâts constatés',
    description: 'Des dégâts importants non mentionnés sont présents',
  },
  {
    value: 'ACCES_IMPOSSIBLE',
    label: 'Accès impossible',
    description: 'Impossible d\'accéder au logement (clés absentes, code incorrect, etc.)',
  },
  {
    value: 'AUTRE',
    label: 'Autre motif',
    description: 'Un autre problème empêche le check-in',
  },
];

/* ─── Feedback Component ──────────────────────────────────────────────────── */

function Feedback({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2.5 bg-rose-500/15 border border-rose-500/30 text-rose-300 rounded-inner p-3.5">
      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
      <p className="text-xs font-semibold leading-relaxed">{message}</p>
    </div>
  );
}

/* ─── Main Component ──────────────────────────────────────────────────────── */

export function RefuseCheckInModal({ reservationId, onSuccess, onClose }: Props) {
  const [motif, setMotif] = useState<RefusalMotif>('NON_CONFORMITE');
  const [commentaire, setCommentaire] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const selectedMotif = MOTIFS.find((m) => m.value === motif);

  const handleSubmit = async () => {
    // Validation
    if (!commentaire.trim()) {
      setErrorMsg('Veuillez fournir une description détaillée du problème.');
      return;
    }

    if (commentaire.trim().length < 20) {
      setErrorMsg('La description doit contenir au moins 20 caractères.');
      return;
    }

    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      await nestFetch(NEST_API.RESERVATIONS.REFUSE_CHECKIN(reservationId), {
        method: 'POST',
        body: JSON.stringify({ motif, commentaire: commentaire.trim() }),
      });

      onSuccess();
      onClose();
    } catch (error: any) {
      setErrorMsg(
        error?.message || 'Une erreur est survenue lors du signalement. Veuillez réessayer.'
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
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-lg bg-forest-950 text-white border border-forest-800/90 rounded-t-card sm:rounded-card shadow-2xl shadow-black/80 overflow-hidden flex flex-col max-h-[92dvh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-forest-800/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-inner bg-rose-500/15 border border-rose-500/30 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4.5 h-4.5 text-rose-400" />
            </div>
            <h3 className="font-display text-base font-bold text-white">Déclarer un problème ou litige</h3>
          </div>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="w-8 h-8 rounded-inner bg-forest-900 hover:bg-forest-800 border border-forest-800 text-forest-300 disabled:opacity-40 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-forest-200" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Warning Banner */}
          <div className="flex items-start gap-3 bg-rose-500/10 border border-rose-500/20 rounded-inner p-4">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-xs font-bold text-rose-300">
                Signaler un problème bloquant
              </p>
              <p className="text-[11px] text-rose-300/80 leading-relaxed">
                Ce signalement informera immédiatement notre équipe et votre hôte. Les fonds
                resteront en séquestre jusqu&apos;à résolution du problème. Assurez-vous d&apos;avoir
                bien tenté de contacter votre hôte avant de continuer.
              </p>
            </div>
          </div>

          {/* Motif Selection */}
          <div className="space-y-2.5">
            <label className="block text-xs font-bold text-forest-200">
              Nature du problème <span className="text-rose-400">*</span>
            </label>
            <div className="space-y-2">
              {MOTIFS.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setMotif(m.value)}
                  disabled={isSubmitting}
                  className={cn(
                    'w-full text-left p-4 rounded-inner border transition-all',
                    motif === m.value
                      ? 'bg-rose-500/15 border-rose-500/40 shadow-md shadow-rose-500/10'
                      : 'bg-forest-900/60 border-forest-800/80 hover:bg-forest-900 hover:border-forest-700',
                    'disabled:opacity-40',
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        'w-4 h-4 rounded-pill border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all',
                        motif === m.value
                          ? 'border-rose-400 bg-rose-500'
                          : 'border-forest-700 bg-forest-950',
                      )}
                    >
                      {motif === m.value && (
                        <div className="w-1.5 h-1.5 rounded-pill bg-white" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={cn(
                          'text-xs font-bold leading-tight',
                          motif === m.value ? 'text-rose-300' : 'text-white',
                        )}
                      >
                        {m.label}
                      </p>
                      <p className="text-[11px] text-forest-300 mt-0.5 leading-relaxed">
                        {m.description}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Commentaire */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-forest-200">
              Description détaillée <span className="text-rose-400">*</span>
            </label>
            <p className="text-[11px] text-forest-300 leading-relaxed">
              Décrivez précisément le problème constaté. Plus vous serez précis, plus nous
              pourrons vous aider rapidement.
            </p>
            <textarea
              rows={4}
              className="w-full text-xs bg-forest-900/80 border border-forest-800 text-white placeholder:text-forest-400/60 rounded-inner px-4 py-3 focus:outline-none focus:ring-2 focus:ring-rose-400/40 focus:border-rose-400 resize-none disabled:opacity-40"
              placeholder={
                selectedMotif?.value === 'NON_CONFORMITE'
                  ? 'Ex : Les photos montraient une cuisine moderne équipée, mais la réalité est une kitchenette vétuste avec électroménager défaillant...'
                  : selectedMotif?.value === 'DEGATS'
                  ? 'Ex : Moisissures importantes dans la salle de bain, fissures au plafond du salon, fenêtres cassées dans la chambre...'
                  : selectedMotif?.value === 'ACCES_IMPOSSIBLE'
                  ? 'Ex : Le code d\'accès communiqué ne fonctionne pas, l\'hôte ne répond pas au téléphone depuis 2h...'
                  : 'Décrivez en détail le problème rencontré...'
              }
              value={commentaire}
              onChange={(e) => setCommentaire(e.target.value)}
              disabled={isSubmitting}
            />
            <div className="flex items-center justify-between pt-0.5">
              <p className="text-[10px] text-forest-400">Minimum 20 caractères</p>
              <p
                className={cn(
                  'text-[10px] font-extrabold',
                  commentaire.length >= 20 ? 'text-lime-400' : 'text-forest-400',
                )}
              >
                {commentaire.length} caractères
              </p>
            </div>
          </div>

          {/* Error Feedback */}
          {errorMsg && <Feedback message={errorMsg} />}

          {/* Info Footer */}
          <div className="bg-forest-900/50 border border-forest-800/80 rounded-inner p-3.5">
            <p className="text-[11px] text-forest-300 leading-relaxed">
              <span className="font-bold text-white">Ce qui se passe ensuite :</span> Notre
              équipe sera notifiée immédiatement et contactera l&apos;hôte. Votre paiement reste
              sécurisé en séquestre. Si le problème n&apos;est pas résolu dans les 24h, vous
              serez remboursé intégralement.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex gap-3 px-6 py-4 bg-forest-900/80 border-t border-forest-800/80 shrink-0">
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="flex-1 py-3 text-xs font-bold text-forest-200 bg-forest-900 hover:bg-forest-800 border border-forest-800 rounded-pill transition-all disabled:opacity-40 cursor-pointer"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={!commentaire.trim() || commentaire.trim().length < 20 || isSubmitting}
            className="flex-1 flex items-center justify-center gap-2 py-3 text-xs font-extrabold text-white bg-rose-600 hover:bg-rose-500 disabled:opacity-50 rounded-pill transition-all shadow-md shadow-rose-600/25 disabled:shadow-none cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Envoi en cours...
              </>
            ) : (
              <>
                <AlertTriangle className="w-4 h-4 text-white" />
                Confirmer le signalement
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
