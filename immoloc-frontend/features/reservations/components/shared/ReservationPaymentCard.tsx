'use client';

import { CreditCard, ShieldCheck, Wallet, ArrowDownRight, Tag, Info, CheckCircle2, Clock } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { fcfa } from '@/features/reservations/utils';
import type { ReservationDetail } from '@/lib/nestjs/types';

const FOURNISSEUR_LABEL: Record<string, string> = {
  WAVE: 'Wave Mobile Money',
  ORANGE_MONEY: 'Orange Money',
  CARD: 'Carte Bancaire',
  ESPECES: 'Espèces (Sur place)',
};

const STATUT_PAIEMENT: Record<string, { label: string; tone: 'success' | 'warning' | 'error' }> = {
  CONFIRME: { label: 'Séquestré & Confirmé', tone: 'success' },
  EN_ATTENTE: { label: 'En cours de traitement', tone: 'warning' },
  ECHOUE: { label: 'Paiement échoué', tone: 'error' },
  REMBOURSE: { label: 'Remboursé', tone: 'success' },
};

const STATUT_TONE = {
  success: 'text-success-700 bg-success-50 border-success-500/20',
  warning: 'text-warning-700 bg-warning-50 border-warning-500/20',
  error: 'text-error-700 bg-error-50 border-error-500/20',
} as const;

interface Props {
  paiement?: ReservationDetail['paiement'];
  reservation?: Partial<ReservationDetail>;
  isOwnerView?: boolean;
}

export function ReservationPaymentCard({ paiement: directPaiement, reservation, isOwnerView = false }: Props) {
  const p = directPaiement ?? reservation?.paiement;
  if (!p && !reservation) return null;

  const totalLocataire = Number(reservation?.totalLocataire ?? 0);
  const reductionNuits = Number(reservation?.reductionNuits ?? 0);
  const montantAcompte = Number(reservation?.montantAcompte ?? 0);
  const rawSolde = Number(reservation?.montantSoldeRestant ?? 0);

  // Détection infaillible d'un paiement par acompte
  const isDeposit =
    reservation?.typePaiement === 'DEPOSIT' ||
    rawSolde > 0 ||
    (montantAcompte > 0 && totalLocataire > 0 && montantAcompte < totalLocataire);

  const montantRegleEnLigne = p?.montant ? Number(p.montant) : (isDeposit ? montantAcompte : totalLocataire);
  const soldeRestant = isDeposit
    ? (rawSolde > 0 ? rawSolde : Math.max(0, totalLocataire - montantRegleEnLigne))
    : 0;

  const pctAcompte = totalLocataire > 0 ? Math.min(100, Math.round((montantRegleEnLigne / totalLocataire) * 100)) : 100;
  const pctSolde = 100 - pctAcompte;

  const statut = p
    ? (STATUT_PAIEMENT[p.statut] ?? { label: p.statut, tone: 'warning' as const })
    : null;

  return (
    <section className="space-y-4 rounded-card border border-border bg-background-card p-5 shadow-sm">

      {/* ── En-tête ──────────────────────────────────────────────────────── */}

      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3.5">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-inner border border-action-edge bg-forest-950 text-on-inverse-marker shadow-2xs">
            <CreditCard className="h-4.5 w-4.5 text-on-inverse-marker" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h3 className="font-display text-base font-semibold text-foreground">
              Détails du paiement
            </h3>
            <p className="text-xs text-foreground-muted">
              {isDeposit ? 'Formule Acompte en ligne + Solde le jour J' : 'Réservation intégralement réglée en ligne'}
            </p>
          </div>
        </div>

        {isDeposit ? (
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-pill border border-warning-500/30 bg-warning-50 px-3 py-1 text-xs font-semibold text-warning-700">
            <Wallet className="h-3.5 w-3.5 text-warning-600" aria-hidden="true" />
            Acompte réglé en ligne
          </span>
        ) : (
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-pill border border-success-500/30 bg-success-50 px-3 py-1 text-xs font-semibold text-success-700">
            <ShieldCheck className="h-3.5 w-3.5 text-success-600" aria-hidden="true" />
            Paiement 100% Intégral
          </span>
        )}
      </header>

      {/* ── Barre de répartition Acompte / Solde si formule Acompte ─────── */}

      {isDeposit && (
        <div className="space-y-3 rounded-inner border border-border bg-background-alt p-3.5">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div className="flex items-center gap-2.5 rounded-inner border border-success-500/20 bg-success-50/60 p-2.5">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-success-600" />
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold text-success-700 truncate">
                  1. Acompte payé ({pctAcompte}%)
                </p>
                <p className="font-display text-xs font-bold text-success-900 tabular-nums">
                  {fcfa(montantRegleEnLigne)} FCFA
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 rounded-inner border border-warning-500/20 bg-warning-50/60 p-2.5">
              <Clock className="h-4 w-4 shrink-0 text-warning-600" />
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold text-warning-700 truncate">
                  2. Solde le jour J ({pctSolde}%)
                </p>
                <p className="font-display text-xs font-bold text-warning-900 tabular-nums">
                  {fcfa(soldeRestant)} FCFA
                </p>
              </div>
            </div>
          </div>

          <div className="flex h-2 w-full overflow-hidden rounded-pill bg-neutral-200">
            <div
              className="bg-success-500 transition-all duration-300"
              style={{ width: `${pctAcompte}%` }}
              title={`Acompte réglé : ${pctAcompte}%`}
            />
            <div
              className="bg-warning-400 transition-all duration-300"
              style={{ width: `${pctSolde}%` }}
              title={`Solde restant : ${pctSolde}%`}
            />
          </div>
        </div>
      )}

      {/* ── Grille des Montants & Détails ────────────────────────────────── */}

      <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">

        {/* Total Séjour */}
        <Tile label="Montant total séjour">
          <Amount value={totalLocataire} />
          {reductionNuits > 0 && (
            <p className="flex items-center gap-1 text-xs font-semibold text-success-700">
              <Tag className="h-3 w-3" aria-hidden="true" />
              −{fcfa(reductionNuits)} FCFA de remise
            </p>
          )}
        </Tile>

        {/* Mode de règlement */}
        {p && (
          <Tile label="Moyen de paiement">
            <p className="text-xs font-semibold text-foreground">
              {FOURNISSEUR_LABEL[p.fournisseur] ?? p.fournisseur}
            </p>
            {statut && (
              <span className={cn('inline-flex items-center gap-1 rounded-pill border px-2 py-0.5 text-[0.6875rem] font-semibold', STATUT_TONE[statut.tone])}>
                <ShieldCheck className="h-3 w-3" aria-hidden="true" />
                {statut.label}
              </span>
            )}
          </Tile>
        )}

        {/* Acompte / Montant réglé */}
        <Tile
          label={isDeposit ? '1. Acompte payé en ligne' : 'Montant réglé en ligne'}
          tone="success"
        >
          <Amount value={montantRegleEnLigne} />
          <p className="flex items-center gap-1 text-xs font-semibold text-success-700">
            <ShieldCheck className="h-3 w-3" aria-hidden="true" />
            Séquestre Klef Actif
          </p>
        </Tile>

        {/* Solde restant si Acompte */}
        {isDeposit && (
          <Tile label="2. Solde à la remise des clés" tone="warning" icon={ArrowDownRight}>
            <Amount value={soldeRestant} highlight />
            <p className="text-xs font-semibold text-warning-700">
              Sur place (Espèces ou Mobile Money)
            </p>
          </Tile>
        )}
      </dl>

      {/* ── Explication Acompte ────────────────────────────────────────────── */}

      {isDeposit && (
        <div className="flex items-start gap-2.5 rounded-inner border border-warning-500/20 bg-warning-50/60 p-3 text-xs text-warning-800">
          <Info className="h-4 w-4 shrink-0 text-warning-600 mt-0.5" />
          <p className="leading-relaxed">
            {isOwnerView ? (
              <>
                <strong className="font-semibold text-warning-900">Information Hôte : </strong>
                L’acompte de {fcfa(montantRegleEnLigne)} FCFA est sécurisé sous séquestre. Vous percevrez le solde restant de{' '}
                <strong className="font-bold text-warning-900">{fcfa(soldeRestant)} FCFA</strong> directement de la main du voyageur lors de l’arrivée.
              </>
            ) : (
              <>
                <strong className="font-semibold text-warning-900">Information Voyageur : </strong>
                Votre acompte de {fcfa(montantRegleEnLigne)} FCFA a été réglé et placé sous séquestre. Le solde de{' '}
                <strong className="font-bold text-warning-900">{fcfa(soldeRestant)} FCFA</strong> sera à remettre à l’hôte le jour de votre arrivée.
              </>
            )}
          </p>
        </div>
      )}
    </section>
  );
}

/* ─── Briques UI ──────────────────────────────────────────────────────────── */

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
      ? 'border-success-500/25 bg-success-50/50'
      : tone === 'warning'
        ? 'border-warning-500/25 bg-warning-50/50'
        : 'border-border bg-background-alt';

  const labelColor =
    tone === 'success'
      ? 'text-success-700'
      : tone === 'warning'
        ? 'text-warning-700'
        : 'text-foreground-muted';

  return (
    <div className={cn('space-y-1.5 rounded-inner border p-3.5', box)}>
      <dt className={cn('flex items-center gap-1 text-[0.6875rem] font-bold uppercase tracking-wider', labelColor)}>
        {Icon && <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
        {label}
      </dt>
      <dd className="space-y-1">{children}</dd>
    </div>
  );
}

function Amount({ value, highlight = false }: { value: number | string; highlight?: boolean }) {
  return (
    <p className={cn('font-display text-base font-bold tabular-nums whitespace-nowrap', highlight ? 'text-warning-800' : 'text-foreground')}>
      {fcfa(Number(value) || 0)}{' '}
      <span className="font-sans text-xs font-semibold text-foreground-muted">FCFA</span>
    </p>
  );
}