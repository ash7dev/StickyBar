'use client';

import { Eye, Check, X, Pause, Play, Star, Clock, CheckCircle2, XCircle, AlertTriangle, MapPin, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface ListingItem {
  id: string;
  titre: string;
  type?: string;
  ville?: string;
  prixBase?: number;
  statut: 'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED' | 'REJECTED' | 'SUSPENDED';
  rejectionReason?: string | null;
  creeLe?: string;
  isFeatured?: boolean;
  photos?: Array<{ id: string; url: string; estPrincipale?: boolean }>;
  proprietaire?: {
    id: string;
    prenom?: string;
    nom?: string;
    email?: string;
    statutKyc?: string;
  };
}

interface AdminListingsTableProps {
  listings: ListingItem[];
  isLoading?: boolean;
  onInspect: (listing: ListingItem) => void;
  onPublish: (listing: ListingItem) => void;
  onReject: (listing: ListingItem) => void;
  onSuspend: (listing: ListingItem) => void;
  onUnsuspend: (listing: ListingItem) => void;
  onToggleFeatured: (listing: ListingItem) => void;
}

const STATUS_CONFIG: Record<string, { label: string; Icon: typeof Clock; badgeClass: string }> = {
  PENDING_REVIEW: { label: 'En Attente', Icon: Clock, badgeClass: 'bg-warning-50 border-warning-200 text-warning-800' },
  PUBLISHED: { label: 'Publiée', Icon: CheckCircle2, badgeClass: 'bg-forest-50 border-forest-200 text-forest-800' },
  REJECTED: { label: 'Rejetée', Icon: XCircle, badgeClass: 'bg-error-50 border-error-200 text-error-800' },
  SUSPENDED: { label: 'Suspendue', Icon: AlertTriangle, badgeClass: 'bg-warning-50 border-warning-200 text-warning-800' },
  DRAFT: { label: 'Brouillon', Icon: Building2, badgeClass: 'bg-background-alt border-border text-foreground-muted' },
};

function formatPrice(price?: number) {
  if (price == null) return '—';
  return new Intl.NumberFormat('fr-SN', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(price);
}

export function AdminListingsTable({
  listings,
  isLoading = false,
  onInspect,
  onPublish,
  onReject,
  onSuspend,
  onUnsuspend,
  onToggleFeatured,
}: AdminListingsTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-3 rounded-card border border-border bg-background-card p-6">
        {[1, 2, 3, 4].map((n) => (
          <div key={n} className="h-20 animate-pulse rounded-inner bg-background-alt" />
        ))}
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-card border border-dashed border-border bg-background-card p-12 text-center space-y-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-pill bg-forest-50 border border-forest-200 text-forest-700">
          <Building2 className="h-6 w-6" />
        </span>
        <div>
          <p className="font-display text-base font-semibold text-foreground">Aucune annonce trouvée</p>
          <p className="text-xs text-foreground-muted">Aucune annonce ne correspond au filtre ou à la recherche sélectionnée.</p>
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
              <th className="py-3.5 px-4 sm:px-6">Annonce</th>
              <th className="py-3.5 px-4">Propriétaire</th>
              <th className="py-3.5 px-4">Localisation</th>
              <th className="py-3.5 px-4">Prix / Nuit</th>
              <th className="py-3.5 px-4">Statut</th>
              <th className="py-3.5 px-4 text-right sm:px-6">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-border">
            {listings.map((item) => {
              const mainPhoto = item.photos?.find((p) => p.estPrincipale) ?? item.photos?.[0];
              const ownerName = item.proprietaire
                ? `${item.proprietaire.prenom ?? ''} ${item.proprietaire.nom ?? ''}`.trim()
                : '—';
              const cfg = STATUS_CONFIG[item.statut] ?? STATUS_CONFIG.DRAFT;

              return (
                <tr key={item.id} className="transition-colors hover:bg-background-alt/40">
                  {/* Annonce */}
                  <td className="py-4 px-4 sm:px-6">
                    <div className="flex items-center gap-3">
                      <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-inner border border-border bg-background-alt">
                        {mainPhoto ? (
                          <img src={mainPhoto.url} alt={item.titre} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-foreground-muted">
                            <Building2 className="h-5 w-5" />
                          </div>
                        )}
                        {item.isFeatured && (
                          <span className="absolute top-0.5 right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-warning-500 text-neutral-0">
                            <Star className="h-3 w-3" />
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground truncate max-w-[200px]">{item.titre}</p>
                        <p className="text-[0.6875rem] text-foreground-muted">{item.type ?? 'Logement'}</p>
                        {item.creeLe && (
                          <p className="text-[0.6875rem] text-foreground-muted">
                            Soumise le {new Date(item.creeLe).toLocaleDateString('fr-FR')}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Propriétaire */}
                  <td className="py-4 px-4">
                    <div className="space-y-0.5">
                      <p className="font-semibold text-foreground text-xs">{ownerName}</p>
                      <p className="text-[0.6875rem] text-foreground-muted truncate max-w-[160px]">{item.proprietaire?.email}</p>
                      {item.proprietaire?.statutKyc && (
                        <span className={cn(
                          'inline-flex items-center rounded-pill px-1.5 py-0.5 text-[0.625rem] font-semibold border',
                          item.proprietaire.statutKyc === 'VERIFIE'
                            ? 'bg-forest-50 border-forest-200 text-forest-800'
                            : 'bg-warning-50 border-warning-200 text-warning-800',
                        )}>
                          {item.proprietaire.statutKyc === 'VERIFIE' ? 'KYC Vérifié' : 'KYC En attente'}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Localisation */}
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-1.5 text-xs text-foreground">
                      <MapPin className="h-3.5 w-3.5 text-foreground-muted shrink-0" />
                      <span>{item.ville ?? '—'}</span>
                    </div>
                  </td>

                  {/* Prix */}
                  <td className="py-4 px-4">
                    <span className="font-display text-sm font-bold text-foreground tabular-nums">
                      {formatPrice(item.prixBase)}
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
                  </td>

                  {/* Actions */}
                  <td className="py-4 px-4 text-right sm:px-6">
                    <div className="flex items-center justify-end gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => onInspect(item)}
                        className="inline-flex h-8 items-center gap-1 rounded-inner border border-border bg-background-card px-2.5 text-xs font-semibold text-foreground hover:bg-background-alt"
                        title="Inspecter l'annonce"
                      >
                        <Eye className="h-3.5 w-3.5 text-foreground-muted" />
                        <span className="hidden sm:inline">Détails</span>
                      </button>

                      {item.statut === 'PENDING_REVIEW' && (
                        <>
                          <button
                            type="button"
                            onClick={() => onPublish(item)}
                            className="inline-flex h-8 items-center gap-1 rounded-inner bg-forest-700 px-2.5 text-xs font-semibold text-neutral-0 hover:bg-forest-800"
                            title="Publier l'annonce"
                          >
                            <Check className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Publier</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onReject(item)}
                            className="inline-flex h-8 items-center gap-1 rounded-inner border border-error-200 bg-error-50 px-2.5 text-xs font-semibold text-error-700 hover:bg-error-100"
                            title="Rejeter l'annonce"
                          >
                            <X className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Rejeter</span>
                          </button>
                        </>
                      )}

                      {item.statut === 'PUBLISHED' && (
                        <>
                          <button
                            type="button"
                            onClick={() => onSuspend(item)}
                            className="inline-flex h-8 items-center gap-1 rounded-inner border border-warning-200 bg-warning-50 px-2.5 text-xs font-semibold text-warning-800 hover:bg-warning-100"
                            title="Suspendre l'annonce"
                          >
                            <Pause className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Suspendre</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onToggleFeatured(item)}
                            className={cn(
                              'inline-flex h-8 items-center gap-1 rounded-inner border px-2.5 text-xs font-semibold',
                              item.isFeatured
                                ? 'border-warning-300 bg-warning-100 text-warning-900'
                                : 'border-border bg-background-card text-foreground hover:bg-background-alt',
                            )}
                            title={item.isFeatured ? 'Retirer de la vedette' : 'Mettre en vedette'}
                          >
                            <Star className={cn('h-3.5 w-3.5', item.isFeatured && 'fill-warning-500 text-warning-500')} />
                          </button>
                        </>
                      )}

                      {item.statut === 'SUSPENDED' && (
                        <button
                          type="button"
                          onClick={() => onUnsuspend(item)}
                          className="inline-flex h-8 items-center gap-1 rounded-inner bg-forest-700 px-2.5 text-xs font-semibold text-neutral-0 hover:bg-forest-800"
                          title="Lever la suspension"
                        >
                          <Play className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">Réactiver</span>
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
