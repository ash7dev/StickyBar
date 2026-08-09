'use client';

import Link from 'next/link';
import { AlertTriangle, ArrowRight, CheckCircle2, ShieldAlert, Eye } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface PendingDisputeItem {
  id: string;
  reservationId: string;
  declarePar: string;
  motif: string;
  description: string;
  coutEstime: number | null;
  creeLe: string;
  logementTitre: string;
  locataireNom: string;
}

interface AdminDisputesOverviewCardProps {
  disputes?: PendingDisputeItem[];
  isLoading?: boolean;
}

export function AdminDisputesOverviewCard({
  disputes = [],
  isLoading = false,
}: AdminDisputesOverviewCardProps) {
  if (isLoading) {
    return (
      <div className="h-56 animate-pulse rounded-card border border-border bg-background-alt p-6" />
    );
  }

  return (
    <div className="rounded-card border border-border bg-background-card p-4 shadow-xs sm:p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-inner bg-error-50 border border-error-200 text-error-700">
            <AlertTriangle className="h-4.5 w-4.5" />
          </span>
          <div>
            <h2 className="font-display text-base font-semibold text-foreground">
              Centre de Résolution des Litiges & Réclamations
            </h2>
            <p className="text-xs text-foreground-muted">
              Arbitrages de cautions, réclamations propreté et annulations en litige
            </p>
          </div>
        </div>

        <Link
          href="/admin/litiges"
          className="inline-flex items-center gap-1 text-xs font-semibold text-forest-700 hover:text-forest-800"
        >
          <span>Voir tous les litiges</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {disputes.length > 0 ? (
        <div className="space-y-2.5">
          {disputes.map((item) => (
            <div
              key={item.id}
              className="flex flex-col gap-3 rounded-inner border border-border bg-background-alt/50 p-3.5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="rounded-pill bg-error-50 border border-error-200 px-2 py-0.5 text-[0.625rem] font-bold text-error-700 uppercase">
                    {item.motif}
                  </span>
                  <p className="truncate text-xs font-semibold text-foreground">
                    Déclaré par {item.declarePar} · {item.locataireNom}
                  </p>
                </div>
                <p className="mt-1 line-clamp-1 text-[0.75rem] text-foreground-muted">
                  Logement: {item.logementTitre} — {item.description}
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {item.coutEstime && (
                  <span className="text-xs font-bold text-error-700">
                    {item.coutEstime.toLocaleString('fr-FR')} FCFA
                  </span>
                )}
                <Link
                  href="/admin/litiges"
                  className="inline-flex h-8 items-center gap-1.5 rounded-inner border border-border bg-background-card px-3 text-[0.75rem] font-semibold text-foreground hover:bg-background-alt"
                >
                  <Eye className="h-3.5 w-3.5 text-foreground-muted" />
                  <span>Arbitrer</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-8 text-center space-y-2 rounded-inner border border-dashed border-border bg-background-alt/30">
          <span className="flex h-10 w-10 items-center justify-center rounded-pill bg-forest-50 border border-forest-200 text-forest-700">
            <CheckCircle2 className="h-5 w-5" />
          </span>
          <p className="text-xs font-semibold text-foreground">Aucun litige ouvert sur la plateforme !</p>
          <p className="text-[0.75rem] text-foreground-muted">Les relations entre locataires et hôtes se déroulent sans aucun conflit répertorié.</p>
        </div>
      )}
    </div>
  );
}
