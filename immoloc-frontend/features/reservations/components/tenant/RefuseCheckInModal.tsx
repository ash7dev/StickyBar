'use client';

import { useCallback, useId, useState } from 'react';
import { AlertTriangle, Check } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { nestFetch } from '@/lib/nestjs/api-client';
import { NEST_API } from '@/lib/nestjs/endpoints';
import { Modal, Notice, Feedback, GhostButton, DangerButton } from './reservation-ui';

const DESCRIPTION_MIN = 20;

type RefusalMotif = 'NON_CONFORMITE' | 'DEGATS' | 'ACCES_IMPOSSIBLE' | 'AUTRE';

const MOTIFS: {
  value: RefusalMotif;
  label: string;
  description: string;
  placeholder: string;
}[] = [
    {
      value: 'NON_CONFORMITE',
      label: 'Logement non conforme',
      description: 'Le logement ne correspond pas aux photos ou à la description',
      placeholder:
        'Ex : les photos montraient une cuisine équipée, la réalité est une kitchenette vétuste avec un électroménager hors service.',
    },
    {
      value: 'DEGATS',
      label: 'Dégâts constatés',
      description: 'Des dégâts importants non mentionnés sont présents',
      placeholder:
        'Ex : moisissures dans la salle de bain, fissures au plafond du salon, fenêtre cassée dans la chambre.',
    },
    {
      value: 'ACCES_IMPOSSIBLE',
      label: 'Accès impossible',
      description: 'Clés absentes, code incorrect, porte inaccessible',
      placeholder:
        'Ex : le code communiqué ne fonctionne pas et l’hôte ne répond pas au téléphone depuis deux heures.',
    },
    {
      value: 'AUTRE',
      label: 'Autre motif',
      description: 'Un autre problème empêche le check-in',
      placeholder: 'Décrivez précisément le problème rencontré.',
    },
  ];

interface Props {
  reservationId: string;
  onSuccess: () => void;
  onClose: () => void;
}

export function RefuseCheckInModal({ reservationId, onSuccess, onClose }: Props) {
  const [motif, setMotif] = useState<RefusalMotif>('NON_CONFORMITE');
  const [commentaire, setCommentaire] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const groupId = useId();
  const descriptionId = useId();

  const selected = MOTIFS.find((m) => m.value === motif)!;
  const trimmedLength = commentaire.trim().length;
  const isValid = trimmedLength >= DESCRIPTION_MIN;

  const handleClose = useCallback(() => {
    if (isSubmitting) return;
    onClose();
  }, [isSubmitting, onClose]);

  const handleSubmit = useCallback(async () => {
    if (!isValid) {
      setErrorMsg(`La description doit contenir au moins ${DESCRIPTION_MIN} caractères.`);
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
    } catch (error) {
      /* `setIsSubmitting(false)` était dans un `finally`, donc exécuté après
         `onClose()` en cas de succès : setState sur un composant démonté. */
      setErrorMsg(
        error instanceof Error && error.message
          ? error.message
          : 'Le signalement n’a pas pu être envoyé. Réessayez dans un instant.',
      );
      setIsSubmitting(false);
    }
  }, [isValid, reservationId, motif, commentaire, onSuccess, onClose]);

  return (
    <Modal
      title="Déclarer un problème"
      onClose={handleClose}
      dismissible={!isSubmitting}
    >
      <div className="space-y-5 p-6">

        <Notice tone="error" icon={AlertTriangle} title="Signalement bloquant">
          Votre hôte et l’équipe Klef sont informés immédiatement. Les fonds restent en séquestre
          jusqu’à résolution. Assurez-vous d’avoir tenté de joindre votre hôte avant de continuer.
        </Notice>

        {/* ── Motif ────────────────────────────────────────────────────────
            Vrai groupe de boutons radio : la version précédente était une
            liste de <button> sans rôle ni état annoncé, avec un faux point
            de sélection en <div>. */}

        <fieldset className="space-y-2.5" disabled={isSubmitting}>
          <legend id={groupId} className="mb-2.5 block text-xs font-semibold text-foreground">
            Nature du problème <span className="text-error-600">*</span>
          </legend>

          <div role="radiogroup" aria-labelledby={groupId} className="space-y-2">
            {MOTIFS.map((m) => {
              const active = motif === m.value;
              return (
                <button
                  key={m.value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setMotif(m.value)}
                  className={cn(
                    'w-full rounded-inner border p-4 text-left transition-colors disabled:opacity-50',
                    active
                      ? 'border-error-500/40 bg-error-50'
                      : 'border-border bg-background-card hover:border-border-hover hover:bg-background-alt',
                  )}
                >
                  <span className="flex items-start gap-3">
                    <span
                      aria-hidden="true"
                      className={cn(
                        'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-pill border-2 transition-colors',
                        active ? 'border-error-600 bg-error-600' : 'border-border-hover bg-background-card',
                      )}
                    >
                      {active && <span className="h-1.5 w-1.5 rounded-pill bg-neutral-0" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className={cn(
                          'block text-xs font-semibold leading-tight',
                          active ? 'text-error-700' : 'text-foreground',
                        )}
                      >
                        {m.label}
                      </span>
                      <span className="mt-0.5 block text-xs leading-relaxed text-foreground-muted">
                        {m.description}
                      </span>
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>

        {/* ── Description ──────────────────────────────────────────────── */}

        <div className="space-y-2">
          <label htmlFor={descriptionId} className="block text-xs font-semibold text-foreground">
            Description détaillée <span className="text-error-600">*</span>
          </label>
          <p className="text-xs leading-relaxed text-foreground-muted">
            Plus la description est précise, plus le dossier est traité rapidement.
          </p>

          <textarea
            id={descriptionId}
            rows={4}
            value={commentaire}
            onChange={(e) => setCommentaire(e.target.value)}
            disabled={isSubmitting}
            aria-invalid={errorMsg ? true : undefined}
            placeholder={selected.placeholder}
            className="w-full resize-none rounded-field border border-border bg-background px-4 py-3 text-foreground placeholder:text-foreground-faint focus:border-forest-500 focus:outline-none disabled:opacity-50"
          />

          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-foreground-muted">
              Minimum {DESCRIPTION_MIN} caractères
            </p>
            {/* Le compteur affichait `commentaire.length` alors que la
                validation portait sur `.trim()` : vingt espaces passaient au
                vert puis l’envoi était refusé. */}
            <p
              aria-live="polite"
              className={cn(
                'text-xs tabular-nums',
                isValid ? 'font-semibold text-success-700' : 'text-foreground-muted',
              )}
            >
              {trimmedLength} / {DESCRIPTION_MIN}
            </p>
          </div>
        </div>

        {errorMsg && <Feedback type="error" message={errorMsg} />}

        <div className="rounded-inner border border-border bg-background-alt p-3.5">
          <p className="text-xs leading-relaxed text-foreground-muted">
            <span className="font-semibold text-foreground">Ce qui se passe ensuite : </span>
            l’équipe Klef contacte votre hôte. Votre paiement reste en séquestre. Si le problème
            n’est pas résolu sous 24 h, vous êtes remboursé intégralement.
          </p>
        </div>

        <div className="flex gap-3">
          <GhostButton
            onClick={handleClose}
            disabled={isSubmitting}
            className="flex-1 py-3 text-sm"
          >
            Retour
          </GhostButton>
          <DangerButton
            onClick={handleSubmit}
            disabled={!isValid}
            loading={isSubmitting}
            loadingLabel="Envoi…"
            icon={Check}
            className="flex-1 py-3 text-sm"
          >
            Confirmer le signalement
          </DangerButton>
        </div>
      </div>
    </Modal>
  );
}