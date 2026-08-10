'use client';

import { useState } from 'react';
import { X, Scale, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { DisputeItem } from './AdminDisputesTable';

interface AdminDisputeResolveModalProps {
  dispute: DisputeItem | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmResolve: (dispute: DisputeItem, statut: 'FONDE' | 'NON_FONDE', decisionAdmin: string) => void;
}

const TEMPLATE_DECISIONS_FONDE = [
  "Litige FONDÉ : Non-conformité avérée du logement par rapport à la description. Remboursement intégral du locataire et avertissement au propriétaire.",
  "Litige FONDÉ : Absence du propriétaire au moment du check-in sans préavis. Annulation sans frais avec remboursement 100%.",
  "Litige FONDÉ : Équipements essentiels absents (eau chaude/électricité) empêchant le séjour normal. Remboursement accordé.",
  "Litige FONDÉ : Dépassement manifeste de la capacité d'accueil sans autorisation. Pénalité appliquée.",
];

const TEMPLATE_DECISIONS_NON_FONDE = [
  "Litige NON FONDÉ : Les preuves fournies ne démontrent aucun manquement ou non-conformité majeure du logement.",
  "Litige NON FONDÉ : La contestation intervient en dehors de la fenêtre autorisée ou sans justificatif probant.",
  "Litige NON FONDÉ : Le propriétaire a respecté l'intégralité des termes du contrat de réservation.",
];

export function AdminDisputeResolveModal({
  dispute,
  isOpen,
  onClose,
  onConfirmResolve,
}: AdminDisputeResolveModalProps) {
  const [resolutionStatus, setResolutionStatus] = useState<'FONDE' | 'NON_FONDE'>('FONDE');
  const [decisionText, setDecisionText] = useState('');

  if (!isOpen || !dispute) return null;

  const templates = resolutionStatus === 'FONDE' ? TEMPLATE_DECISIONS_FONDE : TEMPLATE_DECISIONS_NON_FONDE;
  const isLocataireAuteur = dispute.declarePar === 'LOCATAIRE';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!decisionText.trim()) return;
    onConfirmResolve(dispute, resolutionStatus, decisionText.trim());
    setDecisionText('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-forest-950/60 backdrop-blur-xs">
      <div className="relative w-full max-w-xl rounded-card border border-border bg-background-card p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-inner bg-forest-50 border border-forest-200 text-forest-700">
              <Scale className="h-4.5 w-4.5" />
            </span>
            <div>
              <h2 className="font-display text-base font-bold text-foreground">Arbitrage du Litige</h2>
              <p className="text-xs text-foreground-muted">
                Déclaré par le {isLocataireAuteur ? "locataire" : "propriétaire"}
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-inner p-1.5 text-foreground-muted hover:bg-background-alt hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Choix de la décision */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-foreground">
              Verdict de l'administrateur :
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => { setResolutionStatus('FONDE'); setDecisionText(''); }}
                className={`flex items-center gap-2 rounded-inner border p-3 text-left transition-colors ${
                  resolutionStatus === 'FONDE'
                    ? 'border-forest-300 bg-forest-50/60 text-forest-900 shadow-2xs font-bold'
                    : 'border-border bg-background-card text-foreground hover:bg-background-alt'
                }`}
              >
                <CheckCircle2 className="h-4 w-4 text-forest-600 shrink-0" />
                <div>
                  <p className="text-xs font-bold">Litige FONDÉ</p>
                  <p className="text-[0.625rem] text-foreground-muted">
                    {isLocataireAuteur ? "Remboursement locataire + faute proprio" : "Faute locataire"}
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => { setResolutionStatus('NON_FONDE'); setDecisionText(''); }}
                className={`flex items-center gap-2 rounded-inner border p-3 text-left transition-colors ${
                  resolutionStatus === 'NON_FONDE'
                    ? 'border-error-300 bg-error-50/60 text-error-900 shadow-2xs font-bold'
                    : 'border-border bg-background-card text-foreground hover:bg-background-alt'
                }`}
              >
                <XCircle className="h-4 w-4 text-error-600 shrink-0" />
                <div>
                  <p className="text-xs font-bold">Litige NON FONDÉ</p>
                  <p className="text-[0.625rem] text-foreground-muted">Rejet du litige & déblocage</p>
                </div>
              </button>
            </div>
          </div>

          {/* Avertissement d'impact */}
          <div className="rounded-inner border border-border bg-background-alt/50 p-3 flex items-start gap-2.5">
            <AlertTriangle className="h-4 w-4 text-warning-600 shrink-0 mt-0.5" />
            <p className="text-[0.6875rem] text-foreground-muted leading-snug">
              {resolutionStatus === 'FONDE' && isLocataireAuteur && (
                "Conséquence : La réservation sera annulée, le locataire sera remboursé à 100% et un point de faute sera inscrit au dossier du propriétaire."
              )}
              {resolutionStatus === 'FONDE' && !isLocataireAuteur && (
                "Conséquence : La réservation sera finalisée et un point de faute sera inscrit au dossier du locataire."
              )}
              {resolutionStatus === 'NON_FONDE' && (
                "Conséquence : Le litige sera rejeté et la réservation reprendra son cours normal (terminée sans sanction)."
              )}
            </p>
          </div>

          {/* Modèles de réponse */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-foreground">
              Modèles de décision rapides :
            </label>
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {templates.map((tpl, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setDecisionText(tpl)}
                  className="w-full text-left rounded-inner border border-border bg-background-alt/40 p-2 text-xs text-foreground hover:bg-background-alt transition-colors"
                >
                  {tpl}
                </button>
              ))}
            </div>
          </div>

          {/* Texte explicatif officiel */}
          <div className="space-y-1.5">
            <label htmlFor="dispute-decision-text" className="block text-xs font-semibold text-foreground">
              Motivation officielle de la décision (transmise aux 2 parties) :
            </label>
            <textarea
              id="dispute-decision-text"
              value={decisionText}
              onChange={(e) => setDecisionText(e.target.value)}
              placeholder="Rédigez la justification claire de l'arbitrage..."
              rows={4}
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
              disabled={!decisionText.trim()}
              className="h-9 rounded-inner bg-forest-700 px-5 text-xs font-semibold text-neutral-0 hover:bg-forest-800 disabled:opacity-50"
            >
              Rendre la décision officielle
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
