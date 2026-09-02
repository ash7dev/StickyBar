'use client';

import { ArrowUpRight, DollarSign, Percent, Users, Wallet } from 'lucide-react';
import { fcfa } from '@/lib/dashboard/owner-tokens';

interface Props {
  caDuMois: number;
  netProprietairesDuMois: number;
  commissionKlefDuMois: number;
  totalProprietairesCount: number;
  totalSoldeWallets: number;
}

export function GestionnaireFinancesStatsHeader({
  caDuMois,
  netProprietairesDuMois,
  commissionKlefDuMois,
  totalProprietairesCount,
  totalSoldeWallets,
}: Props) {

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Chiffre d'Affaires Brut */}
      <div className="rounded-card border border-border bg-background-card p-5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-foreground-muted">Volume d'Affaires Brut (CA)</span>
          <div className="w-9 h-9 rounded-pill bg-forest-50 text-forest-700 flex items-center justify-center">
            <DollarSign className="w-5 h-5" aria-hidden="true" />
          </div>
        </div>
        <div>
          <p className="font-display text-2xl sm:text-3xl font-extrabold text-forest-900 tabular-nums">
            {fcfa(caDuMois)} <span className="text-xs font-semibold text-foreground-muted">FCFA</span>
          </p>
          <p className="text-[0.7rem] font-medium text-foreground-muted mt-1">
            Total des séjours payés par les voyageurs
          </p>
        </div>
      </div>

      {/* 2. Revenu Net Propriétaires */}
      <div className="rounded-card border border-border bg-background-card p-5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-foreground-muted">Net Bailleurs Partenaires</span>
          <div className="w-9 h-9 rounded-pill bg-success-50 text-success-700 flex items-center justify-center">
            <Users className="w-5 h-5" aria-hidden="true" />
          </div>
        </div>
        <div>
          <p className="font-display text-2xl sm:text-3xl font-extrabold text-forest-900 tabular-nums">
            {fcfa(netProprietairesDuMois)} <span className="text-xs font-semibold text-foreground-muted">FCFA</span>
          </p>
          <p className="text-[0.7rem] font-medium text-success-700 mt-1 flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>À reverser aux {totalProprietairesCount} bailleurs</span>
          </p>
        </div>
      </div>

      {/* 3. Commission Conciergerie */}
      <div className="rounded-card border border-border bg-background-card p-5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-foreground-muted">Commission Conciergerie</span>
          <div className="w-9 h-9 rounded-pill bg-gold-50 text-gold-700 flex items-center justify-center">
            <Percent className="w-5 h-5" aria-hidden="true" />
          </div>
        </div>
        <div>
          <p className="font-display text-2xl sm:text-3xl font-extrabold text-forest-900 tabular-nums">
            {fcfa(commissionKlefDuMois)} <span className="text-xs font-semibold text-foreground-muted">FCFA</span>
          </p>
          <p className="text-[0.7rem] font-medium text-gold-800 mt-1">
            Honoraires de gestion (7% Klef)
          </p>
        </div>
      </div>

      {/* 4. Solde Portefeuilles (Wallets) */}
      <div className="rounded-card border border-border bg-background-card p-5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-foreground-muted">Solde Total Portefeuilles</span>
          <div className="w-9 h-9 rounded-pill bg-forest-950 text-white flex items-center justify-center shadow-xs">
            <Wallet className="w-5 h-5" aria-hidden="true" />
          </div>
        </div>
        <div>
          <p className="font-display text-2xl sm:text-3xl font-extrabold text-forest-900 tabular-nums">
            {fcfa(totalSoldeWallets)} <span className="text-xs font-semibold text-foreground-muted">FCFA</span>
          </p>
          <p className="text-[0.7rem] font-medium text-foreground-muted mt-1">
            Disponible pour décaissement immédiat
          </p>
        </div>
      </div>
    </div>
  );
}
