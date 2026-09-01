'use client';

import { Sparkles, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface Props {
  healthScore: number; // 0-100
  logementsActifs: number;
  totalLogements: number;
}

export function GestionnaireHealthScoreCard({ healthScore, logementsActifs, totalLogements }: Props) {
  const getStatusText = (score: number) => {
    if (score >= 80) return { label: 'Excellente Santé', color: 'text-success-700 bg-success-50 border-success-200' };
    if (score >= 50) return { label: 'Santé Optimale', color: 'text-warning-700 bg-warning-50 border-warning-200' };
    return { label: 'Configuration en cours', color: 'text-info-700 bg-info-50 border-info-200' };
  };

  const status = getStatusText(healthScore);

  return (
    <div className="rounded-card border border-forest-600/30 bg-forest-900 text-neutral-50 p-6 shadow-md space-y-4 relative overflow-hidden">
      {/* Glow de fond */}
      <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-lime-400/20 blur-2xl pointer-events-none" />

      <div className="flex items-center justify-between border-b border-white/10 pb-4 relative z-10">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-lime-400" aria-hidden="true" />
          <span className="eyebrow text-forest-200">Indice de Santé Conciergerie</span>
        </div>

        <span className={`inline-flex items-center px-3 py-1 rounded-pill text-xs font-semibold border ${status.color}`}>
          {status.label}
        </span>
      </div>

      <div className="flex items-end justify-between relative z-10 pt-1">
        <div>
          <div className="font-display text-4xl font-semibold tracking-[-0.02em] tabular-nums text-lime-400">
            {healthScore}<span className="text-lg font-normal text-forest-200">/100</span>
          </div>
          <p className="text-xs text-forest-200 mt-1 font-medium">
            Score global d&apos;efficacité du parc délégué
          </p>
        </div>

        <div className="text-right space-y-1 text-xs text-forest-200 font-medium">
          <p className="flex items-center justify-end gap-1.5 text-neutral-50">
            <CheckCircle2 className="h-4 w-4 text-lime-400" aria-hidden="true" />
            <span>{logementsActifs}/{totalLogements} biens publiés</span>
          </p>
          <p className="flex items-center justify-end gap-1.5">
            <ShieldCheck className="h-4 w-4 text-forest-300" aria-hidden="true" />
            <span>Mandat 100% sécurisé</span>
          </p>
        </div>
      </div>
    </div>
  );
}
