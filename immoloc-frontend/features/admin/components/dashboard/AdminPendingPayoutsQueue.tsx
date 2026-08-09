'use client';

import Link from 'next/link';
import { Wallet, Check, X, ArrowRight, CheckCircle2, PhoneCall } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface PendingWithdrawalItem {
  id: string;
  montant: number;
  methode: string;
  destinataire: string;
  demandeeLe: string;
  hoteNom: string;
}

interface AdminPendingPayoutsQueueProps {
  withdrawals?: PendingWithdrawalItem[];
  isLoading?: boolean;
}

export function AdminPendingPayoutsQueue({
  withdrawals = [],
  isLoading = false,
}: AdminPendingPayoutsQueueProps) {
  if (isLoading) {
    return (
      <div className="h-56 animate-pulse rounded-card border border-border bg-background-alt p-6" />
    );
  }

  return (
    <div className="rounded-card border border-border bg-background-card p-4 shadow-xs sm:p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-inner bg-purple-50 border border-purple-200 text-purple-800">
            <Wallet className="h-4.5 w-4.5" />
          </span>
          <div>
            <h2 className="font-display text-base font-semibold text-foreground">
              Demandes de Retrait & Décaissements Hôtes
            </h2>
            <p className="text-xs text-foreground-muted">
              Demandes de virement Mobile Money en attente de paiement
            </p>
          </div>
        </div>

        <Link
          href="/admin/finances"
          className="inline-flex items-center gap-1 text-xs font-semibold text-forest-700 hover:text-forest-800"
        >
          <span>Gérer tout</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {withdrawals.length > 0 ? (
        <div className="space-y-2.5">
          {withdrawals.map((item) => (
            <div
              key={item.id}
              className="flex flex-col gap-3 rounded-inner border border-border bg-background-alt/50 p-3.5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="truncate text-xs font-semibold text-foreground">{item.hoteNom}</p>
                  <span className="rounded-pill bg-purple-50 border border-purple-200 px-2 py-0.5 text-[0.625rem] font-bold text-purple-800 uppercase">
                    {item.methode}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-2 text-[0.75rem] text-foreground-muted">
                  <span className="flex items-center gap-1 font-mono font-medium text-foreground">
                    <PhoneCall className="h-3 w-3 text-foreground-muted" />
                    {item.destinataire}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="font-display text-sm font-bold text-foreground">
                  {item.montant.toLocaleString('fr-FR')} FCFA
                </span>
                <Link
                  href="/admin/finances"
                  className="inline-flex h-8 items-center gap-1 rounded-inner bg-forest-700 px-3 text-[0.75rem] font-semibold text-neutral-0 hover:bg-forest-800"
                >
                  <Check className="h-3.5 w-3.5" />
                  <span>Valider</span>
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
          <p className="text-xs font-semibold text-foreground">Tous les retraits sont à jour !</p>
          <p className="text-[0.75rem] text-foreground-muted">Aucune demande de virement en attente dans la file.</p>
        </div>
      )}
    </div>
  );
}
