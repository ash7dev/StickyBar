'use client';

import { Eye, Scale, Clock, CheckCircle2, XCircle, User, MapPin, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface DisputeItem {
  id: string;
  reservationId: string;
  declarePar: 'LOCATAIRE' | 'PROPRIETAIRE';
  motif: string;
  description: string;
  statut: 'EN_ATTENTE' | 'FONDE' | 'NON_FONDE';
  decisionAdmin?: string | null;
  coutEstime?: number | null;
  montantCompensation?: number | null;
  creeLe?: string;
  resoluLe?: string | null;
  reservation?: {
    id: string;
    locataire?: { id: string; prenom?: string; nom?: string; email?: string; telephone?: string };
    proprietaire?: { id: string; prenom?: string; nom?: string; email?: string; telephone?: string };
    logement?: { id: string; titre?: string; ville?: string };
    photosEtatLieu?: Array<{ id: string; url: string; type?: string; categorie?: string }>;
  };
}

interface AdminDisputesTableProps {
  disputes: DisputeItem[];
  isLoading?: boolean;
  onInspect: (dispute: DisputeItem) => void;
  onResolve: (dispute: DisputeItem) => void;
}

const STATUS_CONFIG: Record<string, { label: string; Icon: typeof Clock; badgeClass: string }> = {
  EN_ATTENTE: { label: 'En Attente', Icon: Clock, badgeClass: 'bg-warning-50 border-warning-200 text-warning-800' },
  FONDE: { label: 'Fondé', Icon: CheckCircle2, badgeClass: 'bg-forest-50 border-forest-200 text-forest-800' },
  NON_FONDE: { label: 'Non Fondé', Icon: XCircle, badgeClass: 'bg-error-50 border-error-200 text-error-800' },
};

const MOTIF_LABELS: Record<string, string> = {
  LOGEMENT_NON_CONFORME: 'Logement non conforme',
  LOGEMENT_INACCESSIBLE: 'Logement inaccessible',
  DEPASSEMENT_PERSONNES: 'Dépassement de personnes',
  DOMMAGES: 'Dommages',
  AUTRE: 'Autre',
};

const ROLE_LABELS: Record<string, { label: string; badgeClass: string }> = {
  LOCATAIRE: { label: 'Locataire', badgeClass: 'bg-blue-50 border-blue-200 text-blue-800' },
  PROPRIETAIRE: { label: 'Propriétaire', badgeClass: 'bg-purple-50 border-purple-200 text-purple-800' },
};

function formatDate(d?: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function fullName(user?: { prenom?: string; nom?: string } | null) {
  if (!user) return '—';
  return `${user.prenom ?? ''} ${user.nom ?? ''}`.trim() || '—';
}

export function AdminDisputesTable({
  disputes,
  isLoading = false,
  onInspect,
  onResolve,
}: AdminDisputesTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-3 rounded-card border border-border bg-background-card p-6">
        {[1, 2, 3, 4].map((n) => (
          <div key={n} className="h-20 animate-pulse rounded-inner bg-background-alt" />
        ))}
      </div>
    );
  }

  if (disputes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-card border border-dashed border-border bg-background-card p-12 text-center space-y-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-pill bg-forest-50 border border-forest-200 text-forest-700">
          <Scale className="h-6 w-6" />
        </span>
        <div>
          <p className="font-display text-base font-semibold text-foreground">Aucun litige trouvé</p>
          <p className="text-xs text-foreground-muted">Aucun litige ne correspond au filtre ou à la recherche.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-card border border-border bg-background-card shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-border bg-background-alt/60 text-[0.6875rem] uppercase font-semibold text-foreground-muted tracking-wider">
            <tr>
              <th className="py-3.5 px-4 sm:px-6">Litige</th>
              <th className="py-3.5 px-4">Parties</th>
              <th className="py-3.5 px-4">Logement</th>
              <th className="py-3.5 px-4">Déclaré par</th>
              <th className="py-3.5 px-4">Statut</th>
              <th className="py-3.5 px-4 text-right sm:px-6">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-border">
            {disputes.map((item) => {
              const cfg = STATUS_CONFIG[item.statut] ?? STATUS_CONFIG.EN_ATTENTE;
              const roleCfg = ROLE_LABELS[item.declarePar] ?? ROLE_LABELS.LOCATAIRE;

              return (
                <tr key={item.id} className="transition-colors hover:bg-background-alt/40">
                  {/* Litige info */}
                  <td className="py-4 px-4 sm:px-6">
                    <div className="space-y-1 min-w-0">
                      <p className="font-semibold text-foreground">{MOTIF_LABELS[item.motif] ?? item.motif}</p>
                      <p className="text-[0.6875rem] text-foreground-muted truncate max-w-[240px]">{item.description}</p>
                      <p className="text-[0.6875rem] text-foreground-muted flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(item.creeLe)}
                      </p>
                    </div>
                  </td>

                  {/* Parties */}
                  <td className="py-4 px-4">
                    <div className="space-y-1.5">
                      <div className="space-y-0.5">
                        <p className="text-[0.625rem] font-semibold uppercase tracking-wider text-foreground-muted flex items-center gap-1">
                          <User className="h-3 w-3" /> Locataire
                        </p>
                        <p className="text-xs font-semibold text-foreground">{fullName(item.reservation?.locataire)}</p>
                        <p className="text-[0.6875rem] text-foreground-muted truncate max-w-[140px]">{item.reservation?.locataire?.email}</p>
                      </div>
                      <div className="border-t border-border pt-1.5 space-y-0.5">
                        <p className="text-[0.625rem] font-semibold uppercase tracking-wider text-foreground-muted flex items-center gap-1">
                          <User className="h-3 w-3" /> Propriétaire
                        </p>
                        <p className="text-xs font-semibold text-foreground">{fullName(item.reservation?.proprietaire)}</p>
                        <p className="text-[0.6875rem] text-foreground-muted truncate max-w-[140px]">{item.reservation?.proprietaire?.email}</p>
                      </div>
                    </div>
                  </td>

                  {/* Logement */}
                  <td className="py-4 px-4">
                    <div className="space-y-0.5">
                      <p className="text-xs font-semibold text-foreground truncate max-w-[160px]">
                        {item.reservation?.logement?.titre ?? '—'}
                      </p>
                      {item.reservation?.logement?.ville && (
                        <p className="text-[0.6875rem] text-foreground-muted flex items-center gap-1">
                          <MapPin className="h-3 w-3 shrink-0" />
                          {item.reservation.logement.ville}
                        </p>
                      )}
                    </div>
                  </td>

                  {/* Déclaré par */}
                  <td className="py-4 px-4">
                    <span className={cn(
                      'inline-flex items-center rounded-pill border px-2.5 py-1 text-[0.6875rem] font-semibold',
                      roleCfg.badgeClass,
                    )}>
                      {roleCfg.label}
                    </span>
                  </td>

                  {/* Statut */}
                  <td className="py-4 px-4">
                    <span className={cn(
                      'inline-flex items-center gap-1 rounded-pill border px-2.5 py-1 text-xs font-semibold',
                      cfg.badgeClass,
                    )}>
                      <cfg.Icon className="h-3.5 w-3.5" />
                      {cfg.label}
                    </span>
                    {item.resoluLe && (
                      <p className="mt-1 text-[0.6875rem] text-foreground-muted">
                        Résolu le {formatDate(item.resoluLe)}
                      </p>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-4 px-4 text-right sm:px-6">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => onInspect(item)}
                        className="inline-flex h-8 items-center gap-1 rounded-inner border border-border bg-background-card px-2.5 text-xs font-semibold text-foreground hover:bg-background-alt"
                        title="Inspecter le litige"
                      >
                        <Eye className="h-3.5 w-3.5 text-foreground-muted" />
                        <span className="hidden sm:inline">Détails</span>
                      </button>

                      {item.statut === 'EN_ATTENTE' && (
                        <button
                          type="button"
                          onClick={() => onResolve(item)}
                          className="inline-flex h-8 items-center gap-1 rounded-inner bg-forest-700 px-2.5 text-xs font-semibold text-neutral-0 hover:bg-forest-800"
                          title="Résoudre le litige"
                        >
                          <Scale className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">Arbitrer</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
