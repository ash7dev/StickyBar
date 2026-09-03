'use client';

import React from 'react';
import { Clock, CheckCircle2, XCircle, Gavel } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { ReservationDetail } from '@/lib/nestjs/types';
import { Notice, TONE, type Tone } from '../tenant/reservation-ui';

const MOTIFS_LITIGE: Record<string, string> = {
  DEPASSEMENT_PERSONNES: 'Dépassement du nombre de personnes',
  DEGRADATION: 'Dégradation du logement',
  LOGEMENT_NON_CONFORME: 'Logement non conforme à l’annonce',
  NON_PAIEMENT: 'Non-paiement de frais supplémentaires',
  NUISANCES: 'Nuisances ou comportement inapproprié',
  AUTRE: 'Autre motif',
};

function formatDateTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-foreground-muted">
        {label}
      </p>
      {children}
    </div>
  );
}

export function LitigePanel({
  litige,
  isOwner = true,
}: {
  litige: NonNullable<ReservationDetail['litige']>;
  isOwner?: boolean;
}) {
  const statutTone: Record<string, Tone> = {
    EN_ATTENTE: 'warning',
    FONDE: 'error',
    NON_FONDE: 'success',
  };
  const tone = TONE[statutTone[litige.statut] ?? 'neutral'];

  const StatutIcon =
    litige.statut === 'EN_ATTENTE' ? Clock : litige.statut === 'FONDE' ? CheckCircle2 : XCircle;
  const statutLabel =
    litige.statut === 'EN_ATTENTE'
      ? 'En cours d’examen'
      : litige.statut === 'FONDE'
      ? 'Litige fondé'
      : 'Litige non fondé';

  const motifLabel = MOTIFS_LITIGE[litige.motif] || litige.motif.replace(/_/g, ' ');

  return (
    <div className="space-y-3">
      <Notice tone="error" icon={Gavel} title="Litige ouvert">
        Les fonds restent gelés jusqu’à résolution par l’équipe support de Klef.
      </Notice>

      <div className="space-y-4 rounded-card border border-border bg-background-card p-4">
        <Field label="Motif">
          <p className="text-xs font-semibold text-foreground">{motifLabel}</p>
        </Field>

        <Field label="Description">
          <p className="rounded-inner border border-border bg-background-alt p-2.5 text-xs leading-relaxed text-foreground">
            {litige.description}
          </p>
        </Field>

        <Field label="Statut actuel">
          <span
            className={cn(
              'inline-flex items-center gap-1.5 rounded-pill border px-3 py-1.5 text-xs font-semibold',
              tone.box,
              tone.title,
            )}
          >
            <StatutIcon className="h-3 w-3" aria-hidden="true" />
            {statutLabel}
          </span>
        </Field>

        <Field label="Ouvert le">
          <p className="text-xs text-foreground-muted">{formatDateTime(litige.creeLe)}</p>
        </Field>

        {litige.statut === 'EN_ATTENTE' && (
          <>
            <Notice tone="warning" icon={Clock} title="Délai de traitement : 48 à 72 h">
              L’équipe support examine le dossier et vous contacte par e-mail ou téléphone.
            </Notice>

            <Field label="Issues possibles">
              <ul className="space-y-1.5">
                {[
                  ['Litige fondé', 'pénalité appliquée ou ajustement du versement selon le dossier'],
                  ['Litige non fondé', 'fonds débloqués normalement, aucune pénalité'],
                  ['Arrangement à l’amiable', 'médiation entre les parties'],
                ].map(([titre, detail]) => (
                  <li key={titre} className="flex items-start gap-2 text-xs text-foreground-muted">
                    <span aria-hidden="true" className="mt-1.5 h-1 w-1 shrink-0 rounded-pill bg-border-hover" />
                    <span className="leading-relaxed">
                      <span className="font-semibold text-foreground">{titre}</span> : {detail}
                    </span>
                  </li>
                ))}
              </ul>
            </Field>
          </>
        )}

        {litige.statut === 'FONDE' && (
          <Notice tone="error" icon={CheckCircle2} title="Litige fondé">
            {isOwner
              ? 'Une pénalité a été appliquée au locataire. Une compensation peut vous être versée selon l’évaluation des dommages.'
              : 'Le litige a été jugé fondé par l’équipe support. Les décisions financières d’arbitrage sont appliquées au dossier.'}
          </Notice>
        )}

        {litige.statut === 'NON_FONDE' && (
          <Notice tone="success" icon={XCircle} title="Litige non fondé">
            {isOwner
              ? 'Les fonds seront débloqués normalement après le check-out. Aucune pénalité n’est appliquée.'
              : 'Le litige a été classé non fondé. La réservation reprend son cours normal.'}
          </Notice>
        )}
      </div>
    </div>
  );
}
