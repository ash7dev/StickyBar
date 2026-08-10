'use client';

import { useState, useMemo } from 'react';
import { Eye, CalendarDays, Clock, CheckCircle2, XCircle, User, MapPin, CreditCard, Ban, Scale, CheckCheck, History, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface ReservationItem {
  id: string;
  dateDebut: string;
  dateFin: string;
  nbNuits: number;
  nbPersonnes: number;
  totalLocataire: number;
  montantCommission: number;
  netProprietaire: number;
  typePaiement?: string;
  statut: 'PENDING' | 'CONFIRMED' | 'CHECKED_IN' | 'COMPLETED' | 'CANCELLED';
  creeLe?: string;
  locataire?: { id: string; prenom?: string; nom?: string; email?: string; telephone?: string };
  proprietaire?: { id: string; prenom?: string; nom?: string; email?: string; telephone?: string };
  logement?: { id: string; titre?: string; ville?: string; type?: string };
  paiement?: { statut?: string; fournisseur?: string; montant?: number };
  litige?: { id: string; statut?: string; motif?: string } | null;
}

interface AdminReservationsTableProps {
  reservations: ReservationItem[];
  isLoading?: boolean;
  activeTab?: string;
  onInspect: (reservation: ReservationItem) => void;
  onForceCancel: (reservation: ReservationItem) => void;
}

const STATUS_CONFIG: Record<string, { label: string; Icon: typeof Clock; badgeClass: string }> = {
  PENDING: { label: "En Attente", Icon: Clock, badgeClass: "bg-warning-50 border-warning-200 text-warning-800" },
  CONFIRMED: { label: "Confirmée", Icon: CheckCircle2, badgeClass: "bg-forest-50 border-forest-200 text-forest-800" },
  CHECKED_IN: { label: "En Séjour", Icon: CheckCheck, badgeClass: "bg-blue-50 border-blue-200 text-blue-800" },
  COMPLETED: { label: "Terminée", Icon: CheckCircle2, badgeClass: "bg-forest-50 border-forest-200 text-forest-800" },
  CANCELLED: { label: "Annulée", Icon: XCircle, badgeClass: "bg-error-50 border-error-200 text-error-800" },
};

function formatPrice(amount?: number | null) {
  if (amount == null) return "—";
  return new Intl.NumberFormat("fr-SN", { style: "currency", currency: "XOF", maximumFractionDigits: 0 }).format(amount);
}

function formatDate(d?: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

function fullName(user?: { prenom?: string; nom?: string } | null) {
  if (!user) return "—";
  return `${user.prenom ?? ""} ${user.nom ?? ""}`.trim() || "—";
}

function ReservationRows({
  items,
  onInspect,
  onForceCancel,
}: {
  items: ReservationItem[];
  onInspect: (reservation: ReservationItem) => void;
  onForceCancel: (reservation: ReservationItem) => void;
}) {
  return (
    <tbody className="divide-y divide-border">
      {items.map((item) => {
        const cfg = STATUS_CONFIG[item.statut] ?? STATUS_CONFIG.PENDING;
        const canForceCancel = item.statut !== 'CANCELLED' && item.statut !== 'COMPLETED';

        return (
          <tr key={item.id} className="transition-colors hover:bg-background-alt/40">
            {/* Réservation & Dates */}
            <td className="py-4 px-4 sm:px-6">
              <div className="space-y-1">
                <p className="text-xs font-bold text-foreground">
                  {formatDate(item.dateDebut)} → {formatDate(item.dateFin)}
                </p>
                <p className="text-[0.6875rem] text-foreground-muted">
                  {item.nbNuits} nuit{item.nbNuits > 1 ? "s" : ""} | {item.nbPersonnes} personne{item.nbPersonnes > 1 ? "s" : ""}
                </p>
              </div>
            </td>

            {/* Logement */}
            <td className="py-4 px-4">
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-foreground truncate max-w-[160px]">
                  {item.logement?.titre ?? "—"}
                </p>
                {item.logement?.ville && (
                  <p className="text-[0.6875rem] text-foreground-muted flex items-center gap-1">
                    <MapPin className="h-3 w-3 shrink-0" />
                    {item.logement.ville}
                  </p>
                )}
              </div>
            </td>

            {/* Parties */}
            <td className="py-4 px-4">
              <div className="space-y-1.5">
                <div className="space-y-0.5">
                  <p className="text-[0.625rem] font-semibold uppercase tracking-wider text-foreground-muted flex items-center gap-1">
                    <User className="h-3 w-3 text-blue-600" /> Locataire
                  </p>
                  <p className="text-xs font-semibold text-foreground">{fullName(item.locataire)}</p>
                </div>
                <div className="border-t border-border pt-1 space-y-0.5">
                  <p className="text-[0.625rem] font-semibold uppercase tracking-wider text-foreground-muted flex items-center gap-1">
                    <User className="h-3 w-3 text-purple-600" /> Propriétaire
                  </p>
                  <p className="text-xs font-semibold text-foreground">{fullName(item.proprietaire)}</p>
                </div>
              </div>
            </td>

            {/* Finances & Commission */}
            <td className="py-4 px-4">
              <div className="space-y-1 text-xs">
                <p className="font-bold text-foreground">
                  Total : {formatPrice(item.totalLocataire)}
                </p>
                <div>
                  {item.typePaiement === 'DEPOSIT' ? (
                    <span className="inline-flex items-center rounded-pill border border-purple-200 bg-purple-50 px-2 py-0.5 text-[0.625rem] font-bold text-purple-800">
                      Acompte 30% en ligne
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-pill border border-forest-200 bg-forest-50 px-2 py-0.5 text-[0.625rem] font-bold text-forest-800">
                      100% Réglé en ligne
                    </span>
                  )}
                </div>
                <div className="text-[0.6875rem] text-foreground-muted space-y-0.5 pt-0.5">
                  <p>Commission Klef : <span className="font-semibold text-forest-700">{formatPrice(item.montantCommission)}</span></p>
                  <p>Net Hôte : <span className="font-semibold text-foreground">{formatPrice(item.netProprietaire)}</span></p>
                </div>
              </div>
            </td>

            {/* Statut & Litige */}
            <td className="py-4 px-4">
              <div className="space-y-1">
                <span className={cn(
                  "inline-flex items-center gap-1 rounded-pill border px-2.5 py-1 text-xs font-semibold",
                  cfg.badgeClass,
                )}>
                  <cfg.Icon className="h-3.5 w-3.5" />
                  {cfg.label}
                </span>

                {item.litige && (
                  <div className="mt-1">
                    <span className="inline-flex items-center gap-1 rounded-pill border border-warning-300 bg-warning-50 px-2 py-0.5 text-[0.625rem] font-bold text-warning-900">
                      <Scale className="h-3 w-3 text-warning-700" /> Litige ouvert
                    </span>
                  </div>
                )}
              </div>
            </td>

            {/* Actions */}
            <td className="py-4 px-4 text-right sm:px-6">
              <div className="flex items-center justify-end gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => onInspect(item)}
                  className="inline-flex h-8 items-center gap-1 rounded-inner border border-border bg-background-card px-2.5 text-xs font-semibold text-foreground hover:bg-background-alt"
                  title="Consulter le dossier complet et la timeline"
                >
                  <Eye className="h-3.5 w-3.5 text-foreground-muted" />
                  <span className="hidden sm:inline">Détails</span>
                </button>

                {canForceCancel && (
                  <button
                    type="button"
                    onClick={() => onForceCancel(item)}
                    className="inline-flex h-8 items-center gap-1 rounded-inner border border-error-200 bg-error-50 px-2.5 text-xs font-semibold text-error-700 hover:bg-error-100"
                    title="Annuler la réservation avec remboursement paramétrable"
                  >
                    <Ban className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Annuler</span>
                  </button>
                )}
              </div>
            </td>
          </tr>
        );
      })}
    </tbody>
  );
}

export function AdminReservationsTable({
  reservations,
  isLoading = false,
  activeTab = 'ALL',
  onInspect,
  onForceCancel,
}: AdminReservationsTableProps) {
  const [showHistory, setShowHistory] = useState(false);

  const { activeReservations, historyReservations } = useMemo(() => {
    const active = reservations.filter((r) => r.statut === 'CHECKED_IN' || r.statut === 'CONFIRMED' || r.statut === 'PENDING');
    const history = reservations.filter((r) => r.statut === 'COMPLETED' || r.statut === 'CANCELLED');
    return { activeReservations: active, historyReservations: history };
  }, [reservations]);

  if (isLoading) {
    return (
      <div className="space-y-3 rounded-card border border-border bg-background-card p-6">
        {[1, 2, 3, 4, 5].map((n) => (
          <div key={n} className="h-16 animate-pulse rounded-inner bg-background-alt" />
        ))}
      </div>
    );
  }

  if (reservations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-card border border-dashed border-border bg-background-card p-12 text-center space-y-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-pill bg-forest-50 border border-forest-200 text-forest-700">
          <CalendarDays className="h-6 w-6" />
        </span>
        <div>
          <p className="font-display text-base font-semibold text-foreground">Aucune réservation trouvée</p>
          <p className="text-xs text-foreground-muted">Aucune réservation ne correspond à vos filtres ou à la recherche.</p>
        </div>
      </div>
    );
  }

  // En mode onglet spécifique (ex: En séjour, Confirmées, Annulées) -> affichage direct du tableau
  if (activeTab !== 'ALL') {
    return (
      <div className="overflow-hidden rounded-card border border-border bg-background-card shadow-xs">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border bg-background-alt/60 text-[0.6875rem] uppercase font-semibold text-foreground-muted tracking-wider">
              <tr>
                <th className="py-3.5 px-4 sm:px-6">Réservation & Dates</th>
                <th className="py-3.5 px-4">Logement</th>
                <th className="py-3.5 px-4">Parties</th>
                <th className="py-3.5 px-4">Finances & Commission</th>
                <th className="py-3.5 px-4">Statut</th>
                <th className="py-3.5 px-4 text-right sm:px-6">Actions</th>
              </tr>
            </thead>
            <ReservationRows items={reservations} onInspect={onInspect} onForceCancel={onForceCancel} />
          </table>
        </div>
      </div>
    );
  }

  // En mode "Toutes" -> Séparation Réservations Actives / Prioritaires & Section Accordéon Historique
  return (
    <div className="space-y-6">
      {/* 1. Réservations Actives (Prioritaires) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-sm font-bold text-foreground flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-pill bg-forest-500 animate-pulse" />
            Réservations Actives & En Séjour ({activeReservations.length})
          </h2>
          <span className="text-[0.6875rem] text-foreground-muted">Réservations nécessitant un suivi actif</span>
        </div>

        {activeReservations.length > 0 ? (
          <div className="overflow-hidden rounded-card border border-border bg-background-card shadow-xs">
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-border bg-background-alt/60 text-[0.6875rem] uppercase font-semibold text-foreground-muted tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4 sm:px-6">Réservation & Dates</th>
                    <th className="py-3.5 px-4">Logement</th>
                    <th className="py-3.5 px-4">Parties</th>
                    <th className="py-3.5 px-4">Finances & Commission</th>
                    <th className="py-3.5 px-4">Statut</th>
                    <th className="py-3.5 px-4 text-right sm:px-6">Actions</th>
                  </tr>
                </thead>
                <ReservationRows items={activeReservations} onInspect={onInspect} onForceCancel={onForceCancel} />
              </table>
            </div>
          </div>
        ) : (
          <div className="rounded-card border border-border bg-background-alt/50 p-6 text-center text-xs text-foreground-muted">
            Aucune réservation active ou en séjour pour le moment.
          </div>
        )}
      </div>

      {/* 2. Section Accordéon Historique (Terminées & Annulées) */}
      {historyReservations.length > 0 && (
        <div className="space-y-3 border-t border-border pt-4">
          <button
            type="button"
            onClick={() => setShowHistory((prev) => !prev)}
            aria-expanded={showHistory}
            className="group flex w-full items-center justify-between gap-4 rounded-card border border-border bg-background-card p-4 text-left transition-colors hover:bg-background-alt shadow-2xs"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-inner border border-border bg-background-alt text-foreground-muted">
                <History className="h-4.5 w-4.5" />
              </span>
              <div>
                <p className="flex items-center gap-2 font-display text-sm font-semibold text-foreground">
                  Historique des réservations passées
                  <span className="rounded-pill border border-border bg-background-alt px-2 py-0.5 text-xs font-semibold tabular-nums text-foreground-muted">
                    {historyReservations.length}
                  </span>
                </p>
                <p className="text-xs text-foreground-muted">
                  Séjours terminés et réservations annulées
                </p>
              </div>
            </div>

            <span className="flex items-center gap-1.5 rounded-pill border border-border px-3 py-1.5 text-xs font-semibold text-foreground-muted group-hover:text-foreground">
              {showHistory ? "Masquer" : "Afficher"}
              <ChevronDown
                className={cn("h-4 w-4 transition-transform duration-200", showHistory && "rotate-180")}
              />
            </span>
          </button>

          {showHistory && (
            <div className="overflow-hidden rounded-card border border-border bg-background-card shadow-xs animate-fade-in">
              <div className="overflow-x-auto no-scrollbar">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-border bg-background-alt/60 text-[0.6875rem] uppercase font-semibold text-foreground-muted tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4 sm:px-6">Réservation & Dates</th>
                      <th className="py-3.5 px-4">Logement</th>
                      <th className="py-3.5 px-4">Parties</th>
                      <th className="py-3.5 px-4">Finances & Commission</th>
                      <th className="py-3.5 px-4">Statut</th>
                      <th className="py-3.5 px-4 text-right sm:px-6">Actions</th>
                    </tr>
                  </thead>
                  <ReservationRows items={historyReservations} onInspect={onInspect} onForceCancel={onForceCancel} />
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
