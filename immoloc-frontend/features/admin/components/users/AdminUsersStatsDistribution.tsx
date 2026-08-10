'use client';

import { Users, Home, ShieldCheck, UserX, Percent } from 'lucide-react';

interface AdminUsersStatsDistributionProps {
  counts: {
    total: number;
    proprietaires: number;
    locataires: number;
    bloques: number;
    kycAttente: number;
  };
}

export function AdminUsersStatsDistribution({ counts }: AdminUsersStatsDistributionProps) {
  const total = counts.total || 1;
  const hostPct = Math.round((counts.proprietaires / total) * 100);
  const locatairePct = Math.round((counts.locataires / total) * 100);
  const blockedPct = Math.round((counts.bloques / total) * 100);
  const activePct = 100 - blockedPct;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {/* 1. Répartition Hôtes vs Locataires */}
      <div className="rounded-card border border-border bg-background-card p-4 space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold text-foreground">
          <span className="flex items-center gap-1.5">
            <Home className="h-4 w-4 text-purple-600" />
            Répartition des Rôles
          </span>
          <span className="text-foreground-muted">{counts.proprietaires} Hôtes ({hostPct}%)</span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-pill bg-background-alt flex">
          <div style={{ width: `${hostPct}%` }} className="bg-purple-600 h-full transition-all" title={`Hôtes: ${hostPct}%`} />
          <div style={{ width: `${locatairePct}%` }} className="bg-blue-500 h-full transition-all" title={`Locataires: ${locatairePct}%`} />
        </div>
        <div className="flex items-center justify-between text-[0.6875rem] text-foreground-muted">
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-purple-600 inline-block" /> {counts.proprietaires} Hôtes</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-blue-500 inline-block" /> {counts.locataires} Locataires</span>
        </div>
      </div>

      {/* 2. Statut des Comptes (Actifs vs Bloqués) */}
      <div className="rounded-card border border-border bg-background-card p-4 space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold text-foreground">
          <span className="flex items-center gap-1.5">
            <UserX className="h-4 w-4 text-error-600" />
            Santé des Comptes
          </span>
          <span className="text-foreground-muted">{activePct}% Actifs</span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-pill bg-background-alt flex">
          <div style={{ width: `${activePct}%` }} className="bg-forest-600 h-full transition-all" title={`Actifs: ${activePct}%`} />
          <div style={{ width: `${blockedPct}%` }} className="bg-error-500 h-full transition-all" title={`Bloqués: ${blockedPct}%`} />
        </div>
        <div className="flex items-center justify-between text-[0.6875rem] text-foreground-muted">
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-forest-600 inline-block" /> {total - counts.bloques} Actifs</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-error-500 inline-block" /> {counts.bloques} Bloqués</span>
        </div>
      </div>

      {/* 3. Statut KYC En attente */}
      <div className="rounded-card border border-border bg-background-card p-4 space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold text-foreground">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-warning-600" />
            Vérification KYC Urgent
          </span>
          <span className="text-warning-800 font-bold">{counts.kycAttente} en attente</span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-pill bg-background-alt">
          <div
            style={{ width: `${Math.min(100, Math.round((counts.kycAttente / total) * 100))}%` }}
            className="bg-warning-500 h-full transition-all"
          />
        </div>
        <p className="text-[0.6875rem] text-foreground-muted">
          Dossiers KYC nécessitant une validation pour publier ou réserver.
        </p>
      </div>
    </div>
  );
}
