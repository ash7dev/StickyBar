'use client';

import { Search, User, Clock, AlertTriangle, CheckCircle2, MessageSquare, Filter } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface AdminSupportTicketsListProps {
  tickets: any[];
  selectedTicketId: string | null;
  onSelectTicket: (ticket: any) => void;
  search: string;
  onSearchChange: (val: string) => void;
  statusFilter: string;
  onStatusFilterChange: (val: string) => void;
  categoryFilter: string;
  onCategoryFilterChange: (val: string) => void;
  isLoading: boolean;
}

export function AdminSupportTicketsList({
  tickets,
  selectedTicketId,
  onSelectTicket,
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  categoryFilter,
  onCategoryFilterChange,
  isLoading,
}: AdminSupportTicketsListProps) {
  return (
    <div className="rounded-card border border-border bg-background-card p-4 shadow-2xs space-y-3 flex flex-col h-[720px]">
      {/* Header Search & Filters */}
      <div className="space-y-2 pb-2 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-foreground-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Rechercher par code TCK-..., nom, sujet..."
            className="h-9 w-full rounded-inner border border-border bg-background-alt pl-9 pr-3 text-xs text-foreground placeholder:text-foreground-muted focus:border-forest-600 focus:outline-hidden"
          />
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-2 gap-2">
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            className="h-8 w-full rounded-inner border border-border bg-background-alt px-2 text-[0.75rem] font-semibold text-foreground focus:border-forest-600 focus:outline-hidden"
          >
            <option value="ALL">Tous les statuts</option>
            <option value="OUVERT">🔴 Ouvert</option>
            <option value="EN_COURS">🟡 En cours</option>
            <option value="EN_ATTENTE_UTILISATEUR">🔵 Attente Client</option>
            <option value="RESOLU">🟢 Résolu</option>
            <option value="FERME">⚪ Fermé</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => onCategoryFilterChange(e.target.value)}
            className="h-8 w-full rounded-inner border border-border bg-background-alt px-2 text-[0.75rem] font-semibold text-foreground focus:border-forest-600 focus:outline-hidden"
          >
            <option value="ALL">Toutes catégories</option>
            <option value="RESERVATION">Réservation</option>
            <option value="PAIEMENT">Paiement / Wallet</option>
            <option value="KYC">Vérification KYC</option>
            <option value="LOGEMENT">Logement</option>
            <option value="LITIGE">Litige</option>
            <option value="AUTRE">Autre</option>
          </select>
        </div>
      </div>

      {/* Tickets Scrollable Stream */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 no-scrollbar">
        {isLoading ? (
          <div className="py-12 text-center text-xs text-foreground-muted">Chargement des tickets...</div>
        ) : tickets.length === 0 ? (
          <div className="py-12 text-center text-xs text-foreground-muted space-y-1">
            <MessageSquare className="h-8 w-8 text-foreground-muted mx-auto opacity-30" />
            <p className="font-bold text-foreground">Aucun ticket trouvé</p>
            <p>Modifiez vos filtres pour afficher des demandes.</p>
          </div>
        ) : (
          tickets.map((t) => {
            const isSelected = selectedTicketId === t.id;
            const userName = `${t.utilisateur?.prenom ?? ''} ${t.utilisateur?.nom ?? ''}`.trim() || 'Utilisateur';

            return (
              <div
                key={t.id}
                onClick={() => onSelectTicket(t)}
                className={cn(
                  'cursor-pointer rounded-inner border p-3 transition-all space-y-1.5',
                  isSelected
                    ? 'border-forest-600 bg-forest-50/60 shadow-2xs'
                    : 'border-border bg-background-alt/30 hover:bg-background-alt hover:border-border/80'
                )}
              >
                {/* Code & Statut */}
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono font-bold text-forest-800 text-[0.75rem]">{t.code}</span>
                  <span
                    className={cn(
                      'rounded-pill px-2 py-0.5 text-[0.625rem] font-bold uppercase border',
                      t.statut === 'OUVERT' ? 'bg-error-50 border-error-200 text-error-700' :
                      t.statut === 'EN_COURS' ? 'bg-sand-100 border-sand-300 text-sand-900' :
                      t.statut === 'RESOLU' ? 'bg-forest-100 border-forest-300 text-forest-800' :
                      'bg-background-card border-border text-foreground-muted'
                    )}
                  >
                    {t.statut}
                  </span>
                </div>

                {/* Sujet */}
                <p className="font-bold text-xs text-foreground truncate">{t.sujet}</p>

                {/* User & Date */}
                <div className="flex items-center justify-between text-[0.6875rem] text-foreground-muted pt-1 border-t border-border/50">
                  <span className="truncate font-medium">{userName}</span>
                  <span className="font-mono">{new Date(t.misAJourLe || t.creeLe).toLocaleDateString('fr-FR')}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
