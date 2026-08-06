'use client';

import { CreditCard, ShieldCheck, Wallet, ArrowDownRight, Tag } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { fcfa } from '@/features/reservations/utils';
import type { ReservationDetail } from '@/lib/nestjs/types';

const FOURNISSEUR_LABEL: Record<string, string> = {
  WAVE: 'Wave Mobile Money',
  ORANGE_MONEY: 'Orange Money',
};

/* Le statut brut de l'API (`EN_ATTENTE`, `ECHOUE`…) était affiché tel quel au
   locataire dès qu'il différait de `CONFIRME` : des libellés en majuscules
   avec des underscores, sur un écran de paiement. */
const STATUT_PAIEMENT: Record<string, { label: string; tone: 'success' | 'warning' | 'error' }> = {
  CONFIRME: { label: 'Séquestré et confirmé', tone: 'success' },
  EN_ATTENTE: { label: 'En cours de validation', tone: 'warning' },
  ECHOUE: { label: 'Paiement échoué', tone: 'error' },
  REMBOURSE: { label: 'Remboursé', tone: 'success' },
};

const STATUT_TONE = {
  success: 'text-success-700',
  warning: 'text-warning-700',
  error: 'text-error-700',
} as const;

interface Props {
  paiement?: ReservationDetail['paiement'];
  reservation?: Partial<ReservationDetail>;
}

export function ReservationPaymentCard({ paiement: directPaiement, reservation }: Props) {
  const p = directPaiement ?? reservation?.paiement;
  if (!p && !reservation) return null;

  const totalLocataire = Number(reservation?.totalLocataire ?? 0);
  const reductionNuits = Number(reservation?.reductionNuits ?? 0);
  const montantAcompte = Number(reservation?.montantAcompte ?? 0);
  const montantRegle = Number(p?.montant ?? (montantAcompte > 0 ? montantAcompte : totalLocataire));
  const rawSolde = Number(reservation?.montantSoldeRestant ?? 0);

  // Détection infaillible d'un paiement par acompte
  const isDeposit =
    reservation?.typePaiement === 'DEPOSIT' ||
    rawSolde > 0 ||
    (montantAcompte > 0 && totalLocataire > 0 && montantAcompte < totalLocataire) ||
    (montantRegle > 0 && totalLocataire > 0 && montantRegle < totalLocataire);

  const soldeRestant = isDeposit
    ? (rawSolde > 0 ? rawSolde : Math.max(0, totalLocataire - montantRegle))
    : 0;

  const statut = p
    ? (STATUT_PAIEMENT[p.statut] ?? { label: p.statut, tone: 'warning' as const })
    : null;

  return (
    <section className="space-y-4 rounded-card border border-border bg-background-card p-5 shadow-sm">

      {/* ── En-tête ──────────────────────────────────────────────────────── */}

      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-inner border border-lime-400/20 bg-forest-950 text-lime-400 shadow-2xs">
            <CreditCard className="h-4 w-4 text-lime-400" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h3 className="font-display text-base font-semibold text-foreground">
              Détails du paiement
            </h3>
            <p className="text-xs text-foreground-muted">
              {isDeposit ? 'Acompte en ligne, solde à l’arrivée' : 'Paiement intégral en ligne'}
            </p>
          </div>
        </div>

        {isDeposit ? (
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-pill border border-warning-500/25 bg-warning-50 px-2.5 py-1 text-xs font-semibold text-warning-700">
            <Wallet className="h-3.5 w-3.5" aria-hidden="true" />
            Acompte réglé
          </span>
        ) : (
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-pill border border-success-500/25 bg-success-50 px-2.5 py-1 text-xs font-semibold text-success-700">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            Intégralement réglé
          </span>
        )}
      </header>

      {/* ── Montants ─────────────────────────────────────────────────────── */}

      <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">

        {totalLocataire !== undefined && (
          <Tile label="Total du séjour">
            <Amount value={totalLocataire} />
            {reductionNuits > 0 && (
              <p className="flex items-center gap-1 text-xs font-semibold text-success-700">
                <Tag className="h-3 w-3" aria-hidden="true" />
                −{fcfa(reductionNuits)} FCFA de remise
              </p>
            )}
          </Tile>
        )}

        {p && (
          <Tile label="Moyen de paiement">
            <p className="text-xs font-semibold text-foreground">
              {FOURNISSEUR_LABEL[p.fournisseur] ?? p.fournisseur}
            </p>
            {statut && (
              <p className={cn('flex items-center gap-1 text-xs font-semibold', STATUT_TONE[statut.tone])}>
                <ShieldCheck className="h-3 w-3" aria-hidden="true" />
                {statut.label}
              </p>
            )}
          </Tile>
        )}

        <Tile
          label={isDeposit ? 'Acompte payé en ligne' : 'Montant réglé en ligne'}
          tone="success"
        >
          <Amount value={montantRegle} />
          <p className="flex items-center gap-1 text-xs font-semibold text-success-700">
            <ShieldCheck className="h-3 w-3" aria-hidden="true" />
            Confirmé sous séquestre
          </p>
        </Tile>

        {isDeposit && (
          <Tile label="Reste à régler à l’arrivée" tone="warning" icon={ArrowDownRight}>
            <Amount value={soldeRestant} />
            <p className="text-xs font-semibold text-warning-700">
              À la remise des clés, en espèces ou par Mobile Money
            </p>
          </Tile>
        )}
      </dl>
    </section>
  );
}

/* ─── Briques ────────────────────────────────────────────────────────────── */

function Tile({
  label, tone = 'neutral', icon: Icon, children,
}: {
  label: string;
  tone?: 'neutral' | 'success' | 'warning';
  icon?: typeof ArrowDownRight;
  children: React.ReactNode;
}) {
  const box =
    tone === 'success'
      ? 'border-success-500/25 bg-success-50'
      : tone === 'warning'
        ? 'border-warning-500/25 bg-warning-50'
        : 'border-border bg-background-alt';

  const labelColor =
    tone === 'success'
      ? 'text-success-700'
      : tone === 'warning'
        ? 'text-warning-700'
        : 'text-foreground-muted';

  return (
    <div className={cn('space-y-1 rounded-inner border p-3.5', box)}>
      <dt className={cn('flex items-center gap-1 text-xs font-semibold uppercase tracking-wider', labelColor)}>
        {Icon && <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
        {label}
      </dt>
      <dd className="space-y-1">{children}</dd>
    </div>
  );
}

function Amount({ value }: { value: number | string }) {
  return (
    <p className="font-display text-base font-semibold tabular-nums text-foreground">
      {fcfa(Number(value) || 0)}{' '}
      <span className="font-sans text-xs font-semibold text-foreground-muted">FCFA</span>
    </p>
  );
}