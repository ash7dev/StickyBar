'use client';

import { CreditCard, ShieldCheck, Wallet, ArrowDownRight, Tag } from 'lucide-react';
import { fcfa } from '@/features/reservations/utils';
import type { ReservationDetail } from '@/lib/nestjs/types';

interface ReservationPaymentCardProps {
  paiement?: ReservationDetail['paiement'];
  reservation?: Partial<ReservationDetail>;
}

const FOURNISSEUR_LABEL: Record<string, string> = {
  WAVE:         'Wave Mobile Money',
  ORANGE_MONEY: 'Orange Money',
  PAYDUNYA:     'PayDunya',
  STRIPE:       'Carte bancaire (Stripe)',
};

export function ReservationPaymentCard({
  paiement: directPaiement,
  reservation,
}: ReservationPaymentCardProps) {
  const p = directPaiement ?? reservation?.paiement;
  if (!p && !reservation) return null;

  const typePaiement = reservation?.typePaiement ?? (p ? 'FULL' : undefined);
  const totalLocataire = reservation?.totalLocataire;
  const reductionNuits = reservation?.reductionNuits ?? 0;
  const soldeRestant = reservation?.montantSoldeRestant ?? 0;
  const montantPayeur = p?.montant ?? reservation?.montantAcompte ?? totalLocataire;

  const isDeposit = typePaiement === 'DEPOSIT' || soldeRestant > 0;

  return (
    <div className="bg-background-card rounded-card border border-border/80 p-5 space-y-4 shadow-2xs">
      <div className="flex items-center justify-between pb-3 border-b border-border/60">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-inner bg-forest-950 text-lime-400 border border-lime-400/20 flex items-center justify-center shrink-0">
            <CreditCard className="w-4 h-4 text-lime-400" />
          </div>
          <div>
            <h4 className="font-display text-base font-bold text-forest-950">Détails du Paiement</h4>
            <p className="text-xs text-foreground-muted">
              {isDeposit ? 'Formule Acompte + Solde à l\'arrivée' : 'Paiement intégral en ligne'}
            </p>
          </div>
        </div>

        {isDeposit ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-pill bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold">
            <Wallet className="w-3.5 h-3.5 text-amber-600" />
            <span>Acompte réglé</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-pill bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>100% Réglé</span>
          </span>
        )}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Séjour */}
        {totalLocataire !== undefined && (
          <div className="bg-background-alt p-3.5 rounded-inner border border-border/80 space-y-1">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-foreground-muted">Total du séjour</p>
            <p className="font-display text-base font-extrabold text-forest-950">
              {fcfa(totalLocataire)} <span className="text-xs font-sans font-bold text-foreground-muted">FCFA</span>
            </p>
            {reductionNuits > 0 && (
              <p className="text-[10px] text-emerald-700 font-bold flex items-center gap-0.5">
                <Tag className="w-3 h-3" />
                <span>-{fcfa(reductionNuits)} FCFA de remise</span>
              </p>
            )}
          </div>
        )}

        {/* Moyen de paiement */}
        {p && (
          <div className="bg-background-alt p-3.5 rounded-inner border border-border/80 space-y-1">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-foreground-muted">Moyen de paiement</p>
            <p className="text-xs font-bold text-forest-950">{FOURNISSEUR_LABEL[p.fournisseur] || p.fournisseur}</p>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-forest-700">
              <ShieldCheck className="w-3 h-3 text-forest-600" />
              <span>{p.statut === 'CONFIRME' ? 'Séquestré & Confirmé' : p.statut}</span>
            </span>
          </div>
        )}

        {/* Montant Payé Aujourd'hui */}
        <div className="bg-emerald-50/60 p-3.5 rounded-inner border border-emerald-200/80 space-y-1">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-900">
            {isDeposit ? 'Acompte payé en ligne' : 'Montant réglé en ligne'}
          </p>
          <p className="font-display text-base font-extrabold text-forest-950">
            {fcfa(montantPayeur ?? 0)} <span className="text-xs font-sans font-bold text-foreground-muted">FCFA</span>
          </p>
          <p className="text-[10px] font-semibold text-emerald-800">✅ Confirmé par séquestre</p>
        </div>

        {/* Solde Restant */}
        {isDeposit && (
          <div className="bg-amber-50/70 p-3.5 rounded-inner border border-amber-200 space-y-1">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-amber-900 flex items-center gap-1">
              <ArrowDownRight className="w-3.5 h-3.5 text-amber-600" />
              Reste à régler à l&apos;arrivée
            </p>
            <p className="font-display text-base font-extrabold text-amber-950">
              {fcfa(soldeRestant)} <span className="text-xs font-sans font-bold text-amber-800">FCFA</span>
            </p>
            <p className="text-[10px] font-semibold text-amber-800">À la remise des clés (espèces / Mobile)</p>
          </div>
        )}
      </div>
    </div>
  );
}
