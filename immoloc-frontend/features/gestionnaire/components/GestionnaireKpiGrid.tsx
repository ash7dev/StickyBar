'use client';

import { Building2, Users, CircleDollarSign, ArrowUpRight, Percent, ShieldCheck } from 'lucide-react';

const fcfa = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n || 0));

interface Props {
  kpis: {
    totalLogements: number;
    logementsActifs: number;
    totalProprietaires: number;
    reservationsDuMois: number;
    caDuMois: number;
    netProprietairesDuMois: number;
    commissionKlefDuMois: number;
    tauxOccupation: number;
  };
}

export function GestionnaireKpiGrid({ kpis }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {/* 1. Logements sous mandat */}
      <div className="rounded-card border border-border bg-background-card p-6 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:border-forest-600/30 hover:shadow-md space-y-4">
        <div className="flex items-center justify-between">
          <span className="eyebrow text-foreground-muted">Parc sous mandat</span>
          <span className="grid h-10 w-10 place-items-center rounded-inner bg-forest-50 text-forest-700">
            <Building2 className="h-5 w-5" aria-hidden="true" />
          </span>
        </div>
        <div>
          <div className="flex items-baseline gap-2">
            <span className="font-display text-3xl font-semibold tracking-[-0.02em] tabular-nums text-foreground">
              {kpis.totalLogements}
            </span>
            <span className="text-xs font-semibold text-forest-700">
              ({kpis.logementsActifs} actifs)
            </span>
          </div>
          <p className="text-xs text-foreground-muted mt-1 font-medium">
            Logements sous votre conciergerie
          </p>
        </div>
        <div className="w-full bg-neutral-100 h-1.5 rounded-pill overflow-hidden">
          <div
            className="bg-forest-600 h-full rounded-pill transition-all duration-500"
            style={{ width: `${kpis.totalLogements > 0 ? (kpis.logementsActifs / kpis.totalLogements) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* 2. Propriétaires Partenaires */}
      <div className="rounded-card border border-border bg-background-card p-6 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:border-forest-600/30 hover:shadow-md space-y-4">
        <div className="flex items-center justify-between">
          <span className="eyebrow text-foreground-muted">Propriétaires</span>
          <span className="grid h-10 w-10 place-items-center rounded-inner bg-forest-50 text-forest-700">
            <Users className="h-5 w-5" aria-hidden="true" />
          </span>
        </div>
        <div>
          <div className="flex items-baseline gap-2">
            <span className="font-display text-3xl font-semibold tracking-[-0.02em] tabular-nums text-foreground">
              {kpis.totalProprietaires}
            </span>
            <span className="text-xs font-semibold text-success-700 flex items-center">
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" /> +12%
            </span>
          </div>
          <p className="text-xs text-foreground-muted mt-1 font-medium">
            Hôtes sous contrat délégué
          </p>
        </div>
      </div>

      {/* 3. CA Généré du mois & Net Propriétaires */}
      <div className="rounded-card border border-forest-600/30 bg-forest-50/40 p-6 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:border-forest-600/50 hover:shadow-md space-y-4">
        <div className="flex items-center justify-between">
          <span className="eyebrow text-forest-800">Net Propriétaires</span>
          <span className="grid h-10 w-10 place-items-center rounded-inner bg-forest-900 text-lime-400 shadow-xs">
            <CircleDollarSign className="h-5 w-5" aria-hidden="true" />
          </span>
        </div>
        <div>
          <div className="font-display text-2xl sm:text-3xl font-semibold tracking-[-0.02em] tabular-nums text-forest-950">
            {fcfa(kpis.netProprietairesDuMois)} <span className="text-xs font-normal text-foreground-muted">FCFA</span>
          </div>
          <div className="text-[11px] text-foreground-muted mt-1 space-y-0.5 font-medium">
            <p>Volume voyageurs: <strong className="text-foreground">{fcfa(kpis.caDuMois)} FCFA</strong></p>
            <p className="text-forest-800 flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-forest-600" aria-hidden="true" /> Commission Klef: {fcfa(kpis.commissionKlefDuMois)} FCFA
            </p>
          </div>
        </div>
      </div>

      {/* 4. Taux d'Occupation */}
      <div className="rounded-card border border-border bg-background-card p-6 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:border-forest-600/30 hover:shadow-md space-y-4">
        <div className="flex items-center justify-between">
          <span className="eyebrow text-foreground-muted">Taux d&apos;Occupation</span>
          <span className="grid h-10 w-10 place-items-center rounded-inner bg-forest-50 text-forest-700">
            <Percent className="h-5 w-5" aria-hidden="true" />
          </span>
        </div>
        <div>
          <div className="flex items-baseline gap-2">
            <span className="font-display text-3xl font-semibold tracking-[-0.02em] tabular-nums text-foreground">
              {kpis.tauxOccupation}%
            </span>
            <span className="text-xs text-foreground-muted">moyen</span>
          </div>
          <p className="text-xs text-foreground-muted mt-1 font-medium">
            {kpis.reservationsDuMois} réservation{kpis.reservationsDuMois > 1 ? 's' : ''} ce mois-ci
          </p>
        </div>
      </div>
    </div>
  );
}
