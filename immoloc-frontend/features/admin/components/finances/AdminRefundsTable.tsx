'use client';

import { RotateCcw, CheckCircle2, XCircle, Clock, RefreshCw, User, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface RefundItem {
  id: string;
  reservationId: string;
  montant: number;
  statut: 'PENDING' | 'SUCCESS' | 'FAILED' | string;
  motif?: string | null;
  creeLe: string;
  reservation?: {
    id: string;
    totalLocataire: number;
    locataire?: { prenom: string; nom: string; telephone?: string };
    proprietaire?: { prenom: string; nom: string; telephone?: string };
  };
  paiement?: {
    fournisseur?: string;
    idTransactionFournisseur?: string;
  };
}

interface AdminRefundsTableProps {
  refunds: RefundItem[];
  isLoading: boolean;
  onRetryRefund: (refundId: string) => void;
}

function formatPrice(amount?: number | null) {
  if (amount == null) return "0 FCFA";
  return new Intl.NumberFormat("fr-SN", { style: "currency", currency: "XOF", maximumFractionDigits: 0 }).format(amount);
}

function formatDate(d?: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function AdminRefundsTable({ refunds, isLoading, onRetryRefund }: AdminRefundsTableProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-forest-700" />
      </div>
    );
  }

  if (refunds.length === 0) {
    return (
      <div className="rounded-card border border-dashed border-border bg-background-card p-12 text-center space-y-2">
        <RotateCcw className="h-10 w-10 text-foreground-muted mx-auto" />
        <h3 className="font-display text-base font-bold text-foreground">Aucun remboursement enregistré</h3>
        <p className="text-xs text-foreground-muted">Le registre des remboursements locataires/hôtes apparaîtra ici.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-card border border-border bg-background-card shadow-2xs">
      <table className="w-full text-left text-xs">
        <thead className="border-b border-border bg-background-alt/50 font-display text-[0.6875rem] font-bold uppercase tracking-wider text-foreground-muted">
          <tr>
            <th className="py-3 px-4">Date & Réf.</th>
            <th className="py-3 px-4">Réservation & Parties</th>
            <th className="py-3 px-4">Fournisseur Paiement</th>
            <th className="py-3 px-4">Montant Remboursé</th>
            <th className="py-3 px-4">Statut</th>
            <th className="py-3 px-4 text-right">Action Relance</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {refunds.map((ref) => {
            const isSuccess = ref.statut === 'SUCCESS';
            const isFailed = ref.statut === 'FAILED';

            return (
              <tr key={ref.id} className="transition-colors hover:bg-background-alt/30">
                {/* Date */}
                <td className="py-4 px-4">
                  <div className="space-y-0.5">
                    <p className="font-bold text-foreground">{formatDate(ref.creeLe)}</p>
                    <p className="text-[0.6875rem] font-mono text-foreground-muted">{ref.id.slice(0, 8)}...</p>
                  </div>
                </td>

                {/* Réservation & Parties */}
                <td className="py-4 px-4">
                  <div className="space-y-0.5">
                    <p className="font-bold text-foreground flex items-center gap-1">
                      <User className="h-3.5 w-3.5 text-forest-700" />
                      Locataire : {ref.reservation?.locataire ? `${ref.reservation.locataire.prenom} ${ref.reservation.locataire.nom}` : "—"}
                    </p>
                    <p className="text-[0.6875rem] text-foreground-muted">
                      Hôte : {ref.reservation?.proprietaire ? `${ref.reservation.proprietaire.prenom} ${ref.reservation.proprietaire.nom}` : "—"}
                    </p>
                  </div>
                </td>

                {/* Fournisseur */}
                <td className="py-4 px-4">
                  <div className="space-y-0.5">
                    <p className="font-semibold text-foreground uppercase tracking-wide">
                      {ref.paiement?.fournisseur ?? "Paiement en ligne"}
                    </p>
                    {ref.paiement?.idTransactionFournisseur && (
                      <p className="text-[0.6875rem] font-mono text-foreground-muted truncate max-w-xs">
                        Ref: {ref.paiement.idTransactionFournisseur}
                      </p>
                    )}
                  </div>
                </td>

                {/* Montant */}
                <td className="py-4 px-4">
                  <p className="font-display font-bold text-sm text-foreground">
                    {formatPrice(ref.montant)}
                  </p>
                </td>

                {/* Statut */}
                <td className="py-4 px-4">
                  <span className={cn(
                    "inline-flex items-center gap-1 rounded-pill border px-2.5 py-0.5 text-[0.6875rem] font-bold",
                    isSuccess && "border-forest-300 bg-forest-50 text-forest-800",
                    isFailed && "border-error-300 bg-error-50 text-error-800",
                    !isSuccess && !isFailed && "border-warning-300 bg-warning-50 text-warning-800"
                  )}>
                    {isSuccess && <CheckCircle2 className="h-3 w-3 text-forest-600" />}
                    {isFailed && <XCircle className="h-3 w-3 text-error-600" />}
                    {!isSuccess && !isFailed && <Clock className="h-3 w-3 text-warning-600" />}
                    {ref.statut}
                  </span>
                </td>

                {/* Action */}
                <td className="py-4 px-4 text-right">
                  {isFailed && (
                    <button
                      type="button"
                      onClick={() => onRetryRefund(ref.id)}
                      className="inline-flex h-8 items-center gap-1.5 rounded-inner bg-forest-700 px-3 text-xs font-semibold text-neutral-0 hover:bg-forest-800 transition-colors"
                    >
                      <RefreshCw className="h-3.5 w-3.5" /> Relancer Remboursement
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
