import React, { useState } from 'react';
import { AlertTriangle, Banknote, Loader2, Users } from 'lucide-react';
import { nestFetch } from '@/lib/nestjs/api-client';
import { NEST_API } from '@/lib/nestjs/endpoints';
import { Modal } from '../tenant/reservation-ui';

export interface DemandeFraisItem {
  id: string;
  reservationId: string;
  titre: string;
  description?: string | null;
  montant: number | string;
  statut: 'EN_ATTENTE' | 'PAYE' | 'REFUSE' | 'CONTESTE';
  methodePaiement?: string | null;
  creeLe: string;
  payeLe?: string | null;
  refuseLe?: string | null;
}

interface ExtraFeesCardProps {
  reservationId: string;
  demandesFrais?: DemandeFraisItem[];
  hostName?: string;
  onRefresh?: () => void;
}

const formatMontant = (n: number | string) => `${new Intl.NumberFormat('fr-FR').format(Math.round(Number(n)))} FCFA`;

/**
 * Supplément « voyageurs en plus » côté voyageur : calculé par Paixi avec le tarif
 * par voyageur de l'annonce, réglé en espèces à l'hôte, ou contesté (litige arbitré).
 */
export function ExtraFeesCard({ reservationId, demandesFrais = [], hostName = 'votre hôte', onRefresh }: ExtraFeesCardProps) {
  const [feeToContest, setFeeToContest] = useState<DemandeFraisItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pending = demandesFrais.filter((item) => item.statut === 'EN_ATTENTE');
  if (pending.length === 0) return null;

  const contest = async (fee: DemandeFraisItem) => {
    setIsSubmitting(true);
    setError(null);
    try {
      await nestFetch(NEST_API.RESERVATIONS.DEMANDE_FRAIS_REFUSER(reservationId, fee.id), {
        method: 'POST',
        body: JSON.stringify({ raison: `Contestation du supplément ${fee.titre}` }),
      });
      setFeeToContest(null);
      onRefresh?.();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Impossible de contester ce supplément.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-3">
      {pending.map((fee) => (
        <div key={fee.id} className="space-y-4 rounded-card border border-warning-500/30 bg-warning-100/40 p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-inner bg-warning-100 text-warning-800">
                <Users className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-[0.6875rem] font-bold uppercase tracking-wider text-warning-800">Voyageurs en plus</p>
                {fee.description && <p className="mt-0.5 text-sm font-semibold text-foreground">{fee.description}</p>}
              </div>
            </div>
            <p className="shrink-0 font-display text-xl font-semibold text-foreground">{formatMontant(fee.montant)}</p>
          </div>

          <p className="flex items-start gap-2 text-sm text-foreground-muted">
            <Banknote className="mt-0.5 h-4 w-4 shrink-0 text-warning-800" aria-hidden="true" />
            Calculé avec le tarif par voyageur de l’annonce. Réglez-le en espèces à {hostName} : il confirme la réception de son côté.
          </p>

          <button
            type="button"
            onClick={() => setFeeToContest(fee)}
            className="inline-flex h-10 items-center rounded-pill border border-border bg-background-card px-4 text-sm font-semibold text-foreground transition hover:border-foreground/40"
          >
            Ce n’est pas juste ? Contester
          </button>
        </div>
      ))}

      {feeToContest && (
        <Modal title="Contester le supplément" onClose={() => setFeeToContest(null)}>
          <div className="space-y-4">
            <p className="text-sm text-foreground">
              {feeToContest.titre} · <strong>{formatMontant(feeToContest.montant)}</strong>
              {feeToContest.description ? ` (${feeToContest.description})` : ''}
            </p>
            <p className="flex items-start gap-2 rounded-inner bg-forest-50 p-3 text-sm text-forest-800">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              Vous ne payez rien en attendant : un médiateur Paixi examine la demande avec vous et {hostName}, photos d’état des lieux à l’appui.
            </p>
            {error && <p className="text-sm font-semibold text-error-700">{error}</p>}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setFeeToContest(null)}
                className="h-11 rounded-pill border border-border px-5 text-sm font-semibold text-foreground"
              >
                Retour
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => contest(feeToContest)}
                className="inline-flex h-11 items-center gap-2 rounded-pill bg-error-600 px-5 text-sm font-semibold text-white disabled:opacity-60"
              >
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                Contester
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
