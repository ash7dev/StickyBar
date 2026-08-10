'use client';

import { CheckCircle2, XCircle, Clock, User, Phone, ArrowUpRight, ShieldCheck, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface RetraitPendingItem {
  id: string;
  walletId: string;
  montant: number;
  methode: string;
  destinataire: string;
  statut: string;
  demandeeLe: string;
  wallet: {
    utilisateurId: string;
    utilisateur: {
      id: string;
      prenom: string;
      nom: string;
      email?: string;
      telephone?: string;
    };
  };
}

interface AdminPendingWithdrawalsTableProps {
  withdrawals: RetraitPendingItem[];
  isLoading: boolean;
  onValidate: (item: RetraitPendingItem) => void;
  onReject: (item: RetraitPendingItem) => void;
}

function formatPrice(amount?: number | null) {
  if (amount == null) return "0 FCFA";
  return new Intl.NumberFormat("fr-SN", { style: "currency", currency: "XOF", maximumFractionDigits: 0 }).format(amount);
}

function formatDate(d?: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function AdminPendingWithdrawalsTable({
  withdrawals,
  isLoading,
  onValidate,
  onReject,
}: AdminPendingWithdrawalsTableProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-forest-700" />
      </div>
    );
  }

  if (withdrawals.length === 0) {
    return (
      <div className="rounded-card border border-dashed border-border bg-background-card p-12 text-center space-y-2">
        <Clock className="h-10 w-10 text-foreground-muted mx-auto" />
        <h3 className="font-display text-base font-bold text-foreground">Aucune demande de retrait en attente</h3>
        <p className="text-xs text-foreground-muted">Toutes les demandes de virement des hôtes ont été traitées ou validées.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-card border border-border bg-background-card shadow-2xs">
      <table className="w-full text-left text-xs">
        <thead className="border-b border-border bg-background-alt/50 font-display text-[0.6875rem] font-bold uppercase tracking-wider text-foreground-muted">
          <tr>
            <th className="py-3 px-4">Demande & Date</th>
            <th className="py-3 px-4">Hôte Demandeur</th>
            <th className="py-3 px-4">Méthode & Coordonnées</th>
            <th className="py-3 px-4">Montant Exigé</th>
            <th className="py-3 px-4">Statut</th>
            <th className="py-3 px-4 text-right">Actions d'Arbitrage</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {withdrawals.map((item) => {
            const user = item.wallet?.utilisateur;
            return (
              <tr key={item.id} className="transition-colors hover:bg-background-alt/30">
                {/* Date */}
                <td className="py-4 px-4">
                  <div className="space-y-0.5">
                    <p className="font-bold text-foreground">{formatDate(item.demandeeLe)}</p>
                    <p className="text-[0.6875rem] text-foreground-muted font-mono">{item.id.slice(0, 8)}...</p>
                  </div>
                </td>

                {/* Demandeur */}
                <td className="py-4 px-4">
                  <div className="space-y-0.5">
                    <p className="font-bold text-foreground flex items-center gap-1">
                      <User className="h-3.5 w-3.5 text-forest-700" />
                      {user?.prenom} {user?.nom}
                    </p>
                    {user?.email && <p className="text-[0.6875rem] text-foreground-muted">{user.email}</p>}
                    {user?.telephone && <p className="text-[0.6875rem] text-foreground-muted">{user.telephone}</p>}
                  </div>
                </td>

                {/* Méthode */}
                <td className="py-4 px-4">
                  <div className="space-y-0.5">
                    <p className="font-semibold text-foreground uppercase tracking-wide">
                      {item.methode}
                    </p>
                    <p className="text-[0.6875rem] font-mono font-bold text-forest-800 bg-forest-50 px-2 py-0.5 rounded-inner inline-block border border-forest-200">
                      {item.destinataire}
                    </p>
                  </div>
                </td>

                {/* Montant */}
                <td className="py-4 px-4">
                  <p className="font-display font-bold text-sm text-foreground">
                    {formatPrice(item.montant)}
                  </p>
                </td>

                {/* Statut */}
                <td className="py-4 px-4">
                  <span className="inline-flex items-center gap-1 rounded-pill border border-warning-300 bg-warning-50 px-2.5 py-0.5 text-[0.6875rem] font-bold text-warning-800">
                    <Clock className="h-3 w-3" /> En Attente
                  </span>
                </td>

                {/* Actions */}
                <td className="py-4 px-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => onReject(item)}
                      className="h-8 rounded-inner border border-error-200 bg-error-50 px-3 text-xs font-semibold text-error-700 hover:bg-error-100 transition-colors"
                    >
                      Rejeter
                    </button>
                    <button
                      type="button"
                      onClick={() => onValidate(item)}
                      className="h-8 rounded-inner bg-forest-700 px-3 text-xs font-semibold text-neutral-0 hover:bg-forest-800 transition-colors"
                    >
                      Valider Virement
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
