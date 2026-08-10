'use client';

import { Eye, MapPin, User, Star, CheckCircle2, Clock, XCircle, AlertTriangle, Ban, Sparkles, Building2, Bed, Bath, Users } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface LogementCatalogItem {
  id: string;
  titre: string;
  type: string;
  ville: string;
  quartier?: string;
  adresse?: string;
  prixBase: number;
  acomptePourcentage?: number;
  surface?: number;
  nombreChambres?: number;
  nombreSallesBain?: number;
  capaciteMax?: number;
  nuitesMinimum?: number;
  isInstantBooking?: boolean;
  nbNonConformitesAnnonce?: number;
  statut: 'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED' | 'REJECTED' | 'SUSPENDED';
  isFeatured?: boolean;
  featuredUntil?: string;
  note?: number;
  totalAvis?: number;
  totalSejours?: number;
  creeLe?: string;
  proprietaire?: { id: string; prenom?: string; nom?: string; email?: string; telephone?: string; statutKyc?: string };
  photos?: Array<{ id: string; url: string; estPrincipale?: boolean }>;
}

interface AdminLogementsTableProps {
  listings: LogementCatalogItem[];
  isLoading?: boolean;
  onInspect: (listing: LogementCatalogItem) => void;
  onPublish: (listing: LogementCatalogItem) => void;
  onReject: (listing: LogementCatalogItem) => void;
  onSuspend: (listing: LogementCatalogItem) => void;
  onUnsuspend: (listing: LogementCatalogItem) => void;
  onToggleFeatured: (listing: LogementCatalogItem) => void;
}

const STATUS_CONFIG: Record<string, { label: string; Icon: typeof Clock; badgeClass: string }> = {
  PUBLISHED: { label: "Publié & En Ligne", Icon: CheckCircle2, badgeClass: "bg-forest-50 border-forest-200 text-forest-800" },
  PENDING_REVIEW: { label: "En Modération", Icon: Clock, badgeClass: "bg-warning-50 border-warning-200 text-warning-800" },
  SUSPENDED: { label: "Suspendu", Icon: AlertTriangle, badgeClass: "bg-error-50 border-error-200 text-error-800" },
  REJECTED: { label: "Rejeté", Icon: XCircle, badgeClass: "bg-error-50 border-error-200 text-error-800" },
  DRAFT: { label: "Brouillon", Icon: Clock, badgeClass: "bg-background-alt border-border text-foreground-muted" },
};

function formatPrice(amount?: number | null) {
  if (amount == null) return "—";
  return new Intl.NumberFormat("fr-SN", { style: "currency", currency: "XOF", maximumFractionDigits: 0 }).format(amount);
}

function fullName(user?: { prenom?: string; nom?: string } | null) {
  if (!user) return "Hôte inconnu";
  return `${user.prenom ?? ""} ${user.nom ?? ""}`.trim() || "Hôte inconnu";
}

export function AdminLogementsTable({
  listings,
  isLoading = false,
  onInspect,
  onPublish,
  onReject,
  onSuspend,
  onUnsuspend,
  onToggleFeatured,
}: AdminLogementsTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-3 rounded-card border border-border bg-background-card p-6">
        {[1, 2, 3, 4, 5].map((n) => (
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
          <p className="font-display text-base font-semibold text-foreground">Aucun logement trouvé</p>
          <p className="text-xs text-foreground-muted">Aucun hébergement ne correspond à vos filtres ou à la recherche.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-card border border-border bg-background-card shadow-xs">
      <div className="overflow-x-auto no-scrollbar">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-border bg-background-alt/60 text-[0.6875rem] uppercase font-semibold text-foreground-muted tracking-wider">
            <tr>
              <th className="py-3.5 px-4 sm:px-6">Logement & Description</th>
              <th className="py-3.5 px-4">Hôte Propriétaire</th>
              <th className="py-3.5 px-4">Tarification / Nuit</th>
              <th className="py-3.5 px-4">Statut & Sponsor</th>
              <th className="py-3.5 px-4 text-right sm:px-6">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-border">
            {listings.map((item) => {
              const cfg = STATUS_CONFIG[item.statut] ?? STATUS_CONFIG.DRAFT;
              const photoPrincipale = item.photos?.find((p) => p.estPrincipale)?.url ?? item.photos?.[0]?.url;

              return (
                <tr key={item.id} className="transition-colors hover:bg-background-alt/40">
                  {/* Logement & Specs */}
                  <td className="py-4 px-4 sm:px-6">
                    <div className="flex items-center gap-3">
                      <div className="relative h-14 w-16 shrink-0 overflow-hidden rounded-inner border border-border bg-background-alt">
                        {photoPrincipale ? (
                          <img src={photoPrincipale} alt={item.titre} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-foreground-muted">
                            <Building2 className="h-6 w-6" />
                          </div>
                        )}
                      </div>

                      <div className="space-y-1 min-w-0">
                        <p className="text-xs font-bold text-foreground truncate max-w-[220px]">
                          {item.titre}
                        </p>
                        <p className="text-[0.6875rem] text-foreground-muted flex items-center gap-1">
                          <MapPin className="h-3 w-3 shrink-0 text-forest-600" />
                          {item.ville} {item.quartier ? `(${item.quartier})` : ""} — <span className="font-semibold">{item.type}</span>
                        </p>
                        <div className="flex items-center gap-2 text-[0.625rem] text-foreground-muted">
                          <span className="flex items-center gap-0.5"><Bed className="h-3 w-3" /> {item.nombreChambres ?? 1} ch.</span>
                          <span className="flex items-center gap-0.5"><Bath className="h-3 w-3" /> {item.nombreSallesBain ?? 1} sdb</span>
                          <span className="flex items-center gap-0.5"><Users className="h-3 w-3" /> max {item.capaciteMax ?? 1} voy.</span>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Propriétaire */}
                  <td className="py-4 px-4">
                    <div className="space-y-0.5 text-xs">
                      <p className="font-bold text-foreground flex items-center gap-1">
                        <User className="h-3.5 w-3.5 text-purple-600" />
                        {fullName(item.proprietaire)}
                      </p>
                      <p className="text-[0.6875rem] text-foreground-muted">{item.proprietaire?.email ?? "—"}</p>
                      {item.proprietaire?.telephone && (
                        <p className="text-[0.6875rem] text-foreground-muted">{item.proprietaire.telephone}</p>
                      )}
                    </div>
                  </td>

                  {/* Tarification */}
                  <td className="py-4 px-4">
                    <div className="space-y-0.5 text-xs">
                      <p className="font-display font-bold text-foreground text-sm">
                        {formatPrice(item.prixBase)} <span className="text-[0.6875rem] font-normal text-foreground-muted">/ nuit</span>
                      </p>
                      <p className="text-[0.6875rem] font-semibold text-purple-800 bg-purple-50 px-2 py-0.5 rounded-pill inline-block border border-purple-200">
                        Acompte : {item.acomptePourcentage ?? 30}%
                      </p>
                      {item.isInstantBooking && (
                        <p className="text-[0.625rem] font-bold text-forest-800 bg-forest-50 px-2 py-0.5 rounded-pill inline-block border border-forest-200 mt-0.5">
                          Réservation instantanée
                        </p>
                      )}
                    </div>
                  </td>

                  {/* Statut & Vedette */}
                  <td className="py-4 px-4">
                    <div className="space-y-1.5">
                      <span className={cn(
                        "inline-flex items-center gap-1 rounded-pill border px-2.5 py-1 text-xs font-semibold",
                        cfg.badgeClass,
                      )}>
                        <cfg.Icon className="h-3.5 w-3.5" />
                        {cfg.label}
                      </span>

                      {item.isFeatured && (
                        <div>
                          <span className="inline-flex items-center gap-1 rounded-pill border border-gold-300 bg-gold-50 px-2.5 py-0.5 text-[0.625rem] font-bold text-gold-900">
                            <Sparkles className="h-3 w-3 text-gold-700" /> En Vedette
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
                        title="Consulter les détails du bien et ses photos"
                      >
                        <Eye className="h-3.5 w-3.5 text-foreground-muted" />
                        <span className="hidden sm:inline">Inspecter</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onToggleFeatured(item)}
                        className={cn(
                          "inline-flex h-8 items-center gap-1 rounded-inner border px-2.5 text-xs font-semibold transition-colors",
                          item.isFeatured
                            ? "border-gold-300 bg-gold-50 text-gold-800 hover:bg-gold-100"
                            : "border-border bg-background-card text-foreground hover:bg-background-alt",
                        )}
                        title={item.isFeatured ? "Retirer la mise en vedette" : "Mettre en vedette pour 30 jours"}
                      >
                        <Star className={cn("h-3.5 w-3.5", item.isFeatured && "fill-gold-500 text-gold-600")} />
                        <span className="hidden sm:inline">{item.isFeatured ? "Sponsorisé" : "Vedette"}</span>
                      </button>

                      {item.statut === 'PENDING_REVIEW' && (
                        <button
                          type="button"
                          onClick={() => onPublish(item)}
                          className="inline-flex h-8 items-center gap-1 rounded-inner bg-forest-700 px-2.5 text-xs font-semibold text-neutral-0 hover:bg-forest-800"
                        >
                          Valider
                        </button>
                      )}

                      {item.statut === 'PUBLISHED' && (
                        <button
                          type="button"
                          onClick={() => onSuspend(item)}
                          className="inline-flex h-8 items-center gap-1 rounded-inner border border-error-200 bg-error-50 px-2.5 text-xs font-semibold text-error-700 hover:bg-error-100"
                        >
                          Suspendre
                        </button>
                      )}

                      {item.statut === 'SUSPENDED' && (
                        <button
                          type="button"
                          onClick={() => onUnsuspend(item)}
                          className="inline-flex h-8 items-center gap-1 rounded-inner border border-forest-300 bg-forest-50 px-2.5 text-xs font-semibold text-forest-800 hover:bg-forest-100"
                        >
                          Réactiver
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
