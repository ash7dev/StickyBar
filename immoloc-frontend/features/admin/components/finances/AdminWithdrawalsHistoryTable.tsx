'use client';

import { CheckCircle2, XCircle, Clock, User, ShieldCheck, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface RetraitHistoryItem {
  id: string;
  walletId: string;
  montant: number;
  methode: string;
  destinataire: string;
  statut: 'EN_ATTENTE' | 'VALIDE' | 'REJETE' | string;
  raisonRejet?: string | null;
  traiteeLe?: string | null;
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

interface AdminWithdrawalsHistoryTableProps {
  history: RetraitHistoryItem[];
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

export function AdminWithdrawalsHistoryTable({ history, isLoading }: AdminWithdrawalsHistoryTableProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-forest-700" />
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="rounded-card border border-dashed border-border bg-background-card p-12 text-center space-y-2">
        <Clock className="h-10 w-10 text-foreground-muted mx-auto" />
        <h3 className="font-display text-base font-bold text-foreground">Aucun historique de retrait</h3>
        <p className="text-xs text-foreground-muted">L'historique des virements exécutés et des annulations apparaîtra ici.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-card border border-border bg-background-card shadow-2xs">
      <table className="w-full text-left text-xs">
        <thead className="border-b border-border bg-background-alt/50 font-display text-[0.6875rem] font-bold uppercase tracking-wider text-foreground-muted">
          <tr>
            <th className="py-3 px-4">Demande & Traitement</th>
            <th className="py-3 px-4">Bénéficiaire</th>
            <th className="py-3 px-4">Méthode & Référence</th>
            <th className="py-3 px-4">Montant</th>
            <th className="py-3 px-4">Statut & Motif</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {history.map((item) => {
            const user = item.wallet?.utilisateur;
            const isValidated = item.statut === 'VALIDE';
            const isRejected = item.statut === 'REJETE';

            return (
              <tr key={item.id} className="transition-colors hover:bg-background-alt/30">
                {/* Date */}
                <td className="py-4 px-4">
                  <div className="space-y-0.5">
                    <p className="font-bold text-foreground">{formatDate(item.demandeeLe)}</p>
                    {item.traiteeLe && (
                      <p className="text-[0.6875rem] text-foreground-muted">Traité le : {formatDate(item.traiteeLe)}</p>
                    )}
                  </div>
                </td>

                {/* Bénéficiaire */}
                <td className="py-4 px-4">
                  <div className="space-y-0.5">
                    <p className="font-bold text-foreground flex items-center gap-1">
                      <User className="h-3.5 w-3.5 text-forest-700" />
                      {user?.prenom} {user?.nom}
                    </p>
                    {user?.email && <p className="text-[0.6875rem] text-foreground-muted">{user.email}</p>}
                  </div>
                </td>

                {/* Méthode */}
                <td className="py-4 px-4">
                  <div className="space-y-0.5">
                    <p className="font-semibold text-foreground uppercase tracking-wide">
                      {item.methode}
                    </p>
                    <p className="text-[0.6875rem] font-mono font-bold text-foreground-muted">
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

                {/* Statut & Motif */}
                <td className="py-4 px-4">
                  <div className="space-y-1">
                    <span className={cn(
                      "inline-flex items-center gap-1 rounded-pill border px-2.5 py-0.5 text-[0.6875rem] font-bold",
                      isValidated && "border-forest-300 bg-forest-50 text-forest-800",
                      isRejected && "border-error-300 bg-error-50 text-error-800",
                      !isValidated && !isRejected && "border-warning-300 bg-warning-50 text-warning-800"
                    )}>
                      {isValidated && <CheckCircle2 className="h-3 w-3 text-forest-600" />}
                      {isRejected && <XCircle className="h-3 w-3 text-error-600" />}
                      {!isValidated && !isRejected && <Clock className="h-3 w-3 text-warning-600" />}
                      {item.statut}
                    </span>

                    {item.raisonRejet && (
                      <p className="text-[0.6875rem] text-error-700 font-medium">
                        Motif : {item.raisonRejet}
                      </p>
                    )}
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
