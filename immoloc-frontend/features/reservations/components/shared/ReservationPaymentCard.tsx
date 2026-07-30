'use client';

import { CreditCard, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { fcfa } from '@/features/reservations/utils';
import type { ReservationDetail } from '@/lib/nestjs/types';

type Paiement = ReservationDetail['paiement'];

const FOURNISSEUR_LABEL: Record<string, string> = {
  WAVE:         'Wave Mobile Money',
  ORANGE_MONEY: 'Orange Money',
  PAYDUNYA:     'PayDunya',
  STRIPE:       'Carte bancaire (Stripe)',
};

export function ReservationPaymentCard({ paiement }: { paiement: Paiement }) {
  if (!paiement) return null;

  return (
    <div className="bg-background-card rounded-card border border-border/80 p-5 space-y-4 shadow-2xs">
      <div className="flex items-center gap-2.5 pb-3 border-b border-border/60">
        <div className="w-8 h-8 rounded-inner bg-forest-950 text-lime-400 border border-lime-400/20 flex items-center justify-center shrink-0">
          <CreditCard className="w-4 h-4 text-lime-400" />
        </div>
        <h4 className="font-display text-base font-bold text-forest-950">Détails du Paiement</h4>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <div className="bg-background-alt p-3.5 rounded-inner border border-border/80 space-y-1">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-foreground-muted">Moyen de paiement</p>
          <p className="text-xs font-bold text-forest-950">{FOURNISSEUR_LABEL[paiement.fournisseur] || paiement.fournisseur}</p>
        </div>

        <div className="bg-background-alt p-3.5 rounded-inner border border-border/80 space-y-1">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-foreground-muted">Statut du paiement</p>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-pill text-[11px] font-extrabold bg-forest-50 text-forest-800 border border-forest-100">
            <ShieldCheck className="w-3.5 h-3.5 text-forest-600" />
            <span>{paiement.statut === 'CONFIRME' ? 'Séquestré & Confirmé' : paiement.statut}</span>
          </span>
        </div>

        <div className="bg-background-alt p-3.5 rounded-inner border border-border/80 space-y-1">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-foreground-muted">Montant réglé</p>
          <p className="font-display text-lg font-extrabold text-forest-950">
            {fcfa(paiement.montant)} <span className="text-xs font-sans font-bold text-foreground-muted">FCFA</span>
          </p>
        </div>
      </div>
    </div>
  );
}
