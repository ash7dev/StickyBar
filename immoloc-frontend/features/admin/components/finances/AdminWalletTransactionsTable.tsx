'use client';

import { ArrowDownLeft, ArrowUpRight, Wallet, User, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface WalletTransactionItem {
  id: string;
  walletId: string;
  type: string;
  montant: number;
  sens: 'CREDIT' | 'DEBIT' | string;
  soldeApres: number;
  description: string;
  reservationId?: string | null;
  creeLe: string;
  wallet?: {
    utilisateur?: {
      id: string;
      prenom: string;
      nom: string;
      email?: string;
      telephone?: string;
    };
  };
}

interface AdminWalletTransactionsTableProps {
  transactions: WalletTransactionItem[];
  isLoading: boolean;
}

function formatPrice(amount?: number | null) {
  if (amount == null) return "0 FCFA";
  return new Intl.NumberFormat("fr-SN", { style: "currency", currency: "XOF", maximumFractionDigits: 0 }).format(amount);
}

function formatDate(d?: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function AdminWalletTransactionsTable({ transactions, isLoading }: AdminWalletTransactionsTableProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-forest-700" />
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="rounded-card border border-dashed border-border bg-background-card p-12 text-center space-y-2">
        <Wallet className="h-10 w-10 text-foreground-muted mx-auto" />
        <h3 className="font-display text-base font-bold text-foreground">Aucune transaction enregistrée</h3>
        <p className="text-xs text-foreground-muted">Le journal des mouvements de solde apparaîtra dès la première opération.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-card border border-border bg-background-card shadow-2xs">
      <table className="w-full text-left text-xs">
        <thead className="border-b border-border bg-background-alt/50 font-display text-[0.6875rem] font-bold uppercase tracking-wider text-foreground-muted">
          <tr>
            <th className="py-3 px-4">Date & Réf.</th>
            <th className="py-3 px-4">Utilisateur / Portefeuille</th>
            <th className="py-3 px-4">Type & Description</th>
            <th className="py-3 px-4">Mouvement</th>
            <th className="py-3 px-4">Solde Après</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {transactions.map((tx) => {
            const user = tx.wallet?.utilisateur;
            const isCredit = tx.sens === 'CREDIT';

            return (
              <tr key={tx.id} className="transition-colors hover:bg-background-alt/30">
                {/* Date */}
                <td className="py-4 px-4">
                  <div className="space-y-0.5">
                    <p className="font-bold text-foreground">{formatDate(tx.creeLe)}</p>
                    <p className="text-[0.6875rem] font-mono text-foreground-muted">{tx.id.slice(0, 8)}...</p>
                  </div>
                </td>

                {/* Utilisateur */}
                <td className="py-4 px-4">
                  <div className="space-y-0.5">
                    <p className="font-bold text-foreground flex items-center gap-1">
                      <User className="h-3.5 w-3.5 text-forest-700" />
                      {user ? `${user.prenom} ${user.nom}` : "Portefeuille système"}
                    </p>
                    {user?.email && <p className="text-[0.6875rem] text-foreground-muted">{user.email}</p>}
                  </div>
                </td>

                {/* Type & Description */}
                <td className="py-4 px-4">
                  <div className="space-y-1">
                    <span className="font-semibold text-foreground bg-background-alt px-2 py-0.5 rounded-inner inline-block border border-border text-[0.6875rem]">
                      {tx.type}
                    </span>
                    <p className="text-xs text-foreground-muted max-w-xs truncate">{tx.description}</p>
                  </div>
                </td>

                {/* Mouvement */}
                <td className="py-4 px-4">
                  <div className="flex items-center gap-1">
                    {isCredit ? (
                      <ArrowDownLeft className="h-4 w-4 text-forest-600" />
                    ) : (
                      <ArrowUpRight className="h-4 w-4 text-error-600" />
                    )}
                    <span className={cn(
                      "font-display font-bold text-sm",
                      isCredit ? "text-forest-700" : "text-error-700"
                    )}>
                      {isCredit ? '+' : '-'}{formatPrice(tx.montant)}
                    </span>
                  </div>
                </td>

                {/* Solde après */}
                <td className="py-4 px-4">
                  <p className="font-display font-bold text-xs text-foreground">
                    {formatPrice(tx.soldeApres)}
                  </p>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
