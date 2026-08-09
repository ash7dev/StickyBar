'use client';

import { Lock, Wallet, DollarSign, PiggyBank } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface AdminFinancialFlowWidgetProps {
  stats?: {
    gmv?: number;
    commissions?: number;
    payoutsNet?: number;
  };
  isLoading?: boolean;
}

export function AdminFinancialFlowWidget({ stats, isLoading = false }: AdminFinancialFlowWidgetProps) {
  const gmv = stats?.gmv ?? 0;
  const commissions = stats?.commissions ?? 0;
  const payoutsNet = stats?.payoutsNet ?? 0;
  const escrowAmount = Math.max(0, gmv - payoutsNet - commissions);

  const financialFlows = [
    {
      title: 'Fonds sous Séquestre (Escrow)',
      amount: `${escrowAmount.toLocaleString('fr-FR')} FCFA`,
      subtext: 'Montants réservés en attente de début de séjour',
      icon: Lock,
      colorClass: 'bg-forest-50 border-forest-200 text-forest-800',
    },
    {
      title: 'Versements Effectués aux Hôtes',
      amount: `${payoutsNet.toLocaleString('fr-FR')} FCFA`,
      subtext: 'Net versé par Wave & Orange Money au Sénégal',
      icon: Wallet,
      colorClass: 'bg-purple-50 border-purple-200 text-purple-800',
    },
    {
      title: 'Chiffre d’Affaires Klef (7%)',
      amount: `${commissions.toLocaleString('fr-FR')} FCFA`,
      subtext: 'Commissions de service plateforme cumulées',
      icon: PiggyBank,
      colorClass: 'bg-lime-100 border-lime-200 text-forest-900',
    },
  ];

  if (isLoading) {
    return (
      <div className="h-52 animate-pulse rounded-card border border-border bg-background-alt p-6" />
    );
  }

  return (
    <div className="rounded-card border border-border bg-background-card p-4 shadow-xs sm:p-6 space-y-4">
      <div className="flex items-center justify-between gap-3 border-b border-border pb-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-inner bg-forest-50 border border-forest-200 text-forest-700">
            <DollarSign className="h-4.5 w-4.5" />
          </span>
          <div>
            <h2 className="font-display text-base font-semibold text-foreground">
              Ventilation des Flux Financiers & Séquestre
            </h2>
            <p className="text-xs text-foreground-muted">
              État de la trésorerie plateforme, séquestre et versements hôtes
            </p>
          </div>
        </div>

        <span className="rounded-pill bg-forest-50 border border-forest-200 px-2.5 py-0.5 text-xs font-semibold text-forest-800">
          Sécurisé par Webhooks
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {financialFlows.map((flow) => (
          <div
            key={flow.title}
            className="flex flex-col justify-between rounded-inner border border-border bg-background-alt/40 p-4 space-y-3"
          >
            <div className="flex items-center justify-between gap-2">
              <span className={cn('flex h-8 w-8 items-center justify-center rounded-inner border', flow.colorClass)}>
                <flow.icon className="h-4 w-4" />
              </span>
            </div>

            <div>
              <p className="text-[0.6875rem] font-semibold uppercase tracking-wider text-foreground-muted">
                {flow.title}
              </p>
              <p className="mt-1 font-display text-lg font-bold text-foreground">
                {flow.amount}
              </p>
              <p className="mt-0.5 line-clamp-2 text-[0.75rem] text-foreground-muted">
                {flow.subtext}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
