'use client';

import { CheckCircle2, ClipboardCheck, LogIn, LogOut, ShieldAlert } from 'lucide-react';

interface Props {
  totalInspections: number;
  totalCheckins: number;
  totalCheckouts: number;
  totalLitiges: number;
}

export function GestionnaireEtatsDesLieuxStatsHeader({
  totalInspections,
  totalCheckins,
  totalCheckouts,
  totalLitiges,
}: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total Inspections */}
      <div
        className="rounded-card border shadow-2xs p-5 space-y-3"
        style={{ borderColor: 'var(--border)', background: 'var(--background-card)' }}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold" style={{ color: 'var(--foreground-muted)' }}>
            Inspections Totales
          </span>
          <div
            className="w-9 h-9 rounded-pill flex items-center justify-center"
            style={{ background: 'var(--forest-50)', color: 'var(--forest-700)' }}
          >
            <ClipboardCheck className="w-5 h-5" aria-hidden="true" />
          </div>
        </div>
        <div>
          <p
            className="font-display text-2xl sm:text-3xl font-extrabold tabular-nums"
            style={{ color: 'var(--forest-900)' }}
          >
            {totalInspections} <span className="text-xs font-semibold" style={{ color: 'var(--foreground-muted)' }}>rapports</span>
          </p>
          <p className="text-[0.7rem] font-medium mt-1" style={{ color: 'var(--foreground-muted)' }}>
            États des lieux d'entrée et de sortie numérisés
          </p>
        </div>
      </div>

      {/* 2. Check-ins Entrée */}
      <div
        className="rounded-card border shadow-2xs p-5 space-y-3"
        style={{ borderColor: 'var(--border)', background: 'var(--background-card)' }}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold" style={{ color: 'var(--foreground-muted)' }}>
            États des Lieux d'Entrée (Check-in)
          </span>
          <div
            className="w-9 h-9 rounded-pill flex items-center justify-center"
            style={{ background: 'var(--success-50)', color: 'var(--success-700)', border: '1px solid var(--success-500)' }}
          >
            <LogIn className="w-5 h-5" aria-hidden="true" />
          </div>
        </div>
        <div>
          <p
            className="font-display text-2xl sm:text-3xl font-extrabold tabular-nums"
            style={{ color: 'var(--forest-900)' }}
          >
            {totalCheckins} <span className="text-xs font-semibold" style={{ color: 'var(--foreground-muted)' }}>Check-ins</span>
          </p>
          <p className="text-[0.7rem] font-medium mt-1 flex items-center gap-1" style={{ color: 'var(--success-700)' }}>
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Remises de clés certifiées</span>
          </p>
        </div>
      </div>

      {/* 3. Check-outs Sortie */}
      <div
        className="rounded-card border shadow-2xs p-5 space-y-3"
        style={{ borderColor: 'var(--border)', background: 'var(--background-card)' }}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold" style={{ color: 'var(--foreground-muted)' }}>
            États des Lieux de Sortie (Check-out)
          </span>
          <div
            className="w-9 h-9 rounded-pill flex items-center justify-center shadow-2xs"
            style={{ background: 'var(--forest-950)', color: 'var(--lime-400)' }}
          >
            <LogOut className="w-5 h-5" aria-hidden="true" />
          </div>
        </div>
        <div>
          <p
            className="font-display text-2xl sm:text-3xl font-extrabold tabular-nums"
            style={{ color: 'var(--forest-900)' }}
          >
            {totalCheckouts} <span className="text-xs font-semibold" style={{ color: 'var(--foreground-muted)' }}>Check-outs</span>
          </p>
          <p className="text-[0.7rem] font-medium mt-1" style={{ color: 'var(--foreground-muted)' }}>
            Restitutions et relevés des compteurs
          </p>
        </div>
      </div>

      {/* 4. Non-conformités & Litiges */}
      <div
        className="rounded-card border shadow-2xs p-5 space-y-3"
        style={{ borderColor: 'var(--border)', background: 'var(--background-card)' }}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold" style={{ color: 'var(--foreground-muted)' }}>
            Signalements &amp; Non-Conformités
          </span>
          <div
            className="w-9 h-9 rounded-pill flex items-center justify-center"
            style={{
              background: totalLitiges > 0 ? 'var(--warning-50)' : 'var(--forest-50)',
              color: totalLitiges > 0 ? 'var(--warning-700)' : 'var(--forest-700)',
              border: `1px solid ${totalLitiges > 0 ? 'var(--warning-500)' : 'var(--forest-200)'}`,
            }}
          >
            <ShieldAlert className="w-5 h-5" aria-hidden="true" />
          </div>
        </div>
        <div>
          <p
            className="font-display text-2xl sm:text-3xl font-extrabold tabular-nums"
            style={{ color: totalLitiges > 0 ? 'var(--warning-700)' : 'var(--forest-900)' }}
          >
            {totalLitiges} <span className="text-xs font-semibold" style={{ color: 'var(--foreground-muted)' }}>signalement{totalLitiges > 1 ? 's' : ''}</span>
          </p>
          <p className="text-[0.7rem] font-medium mt-1" style={{ color: 'var(--foreground-muted)' }}>
            {totalLitiges === 0 ? 'Aucun dégât ni réserve en cours' : 'Désaccords ou dégâts à traiter'}
          </p>
        </div>
      </div>
    </div>
  );
}
