'use client';

import Image from 'next/image';
import {
  Eye, MapPin, User, Star, CheckCircle2, Clock, XCircle, AlertTriangle,
  Sparkles, Building2, Bed, Bath, Users, Check, Ban,
} from 'lucide-react';
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
  proprietaire?: {
    id: string; prenom?: string; nom?: string; email?: string;
    telephone?: string; statutKyc?: string;
  };
  photos?: Array<{ id: string; url: string; estPrincipale?: boolean }>;
}

interface Props {
  listings: LogementCatalogItem[];
  isLoading?: boolean;
  onInspect: (l: LogementCatalogItem) => void;
  onPublish: (l: LogementCatalogItem) => void;
  onReject: (l: LogementCatalogItem) => void;
  onSuspend: (l: LogementCatalogItem) => void;
  onUnsuspend: (l: LogementCatalogItem) => void;
  onToggleFeatured: (l: LogementCatalogItem) => void;
}

/* `warning-200/800`, `error-200/800`, `forest-200/300`, `gold-300/900`,
   `purple-*` : aucune n'existe dans la palette. La plupart des badges de
   statut s'affichaient sans bordure ni couleur de texte. */
const STATUS_CONFIG: Record<string, { label: string; Icon: typeof Clock; badge: string }> = {
  PUBLISHED: { label: 'En ligne', Icon: CheckCircle2, badge: 'border-forest-100 bg-forest-50 text-forest-700' },
  PENDING_REVIEW: { label: 'À modérer', Icon: Clock, badge: 'border-warning-500/25 bg-warning-50 text-warning-700' },
  SUSPENDED: { label: 'Suspendu', Icon: AlertTriangle, badge: 'border-error-500/25 bg-error-50 text-error-700' },
  REJECTED: { label: 'Rejeté', Icon: XCircle, badge: 'border-error-500/25 bg-error-50 text-error-700' },
  DRAFT: { label: 'Brouillon', Icon: Clock, badge: 'border-border bg-background-alt text-foreground-muted' },
};

const MARKUP = 1.07;

/* `style: 'currency'` avec XOF produit « 45 000 F CFA » avec une espace
   insécable qui varie selon le navigateur, et ne correspond pas au « FCFA »
   utilisé partout ailleurs. */
const fcfa = (n?: number | null) =>
  n == null ? '—' : new Intl.NumberFormat('fr-FR').format(Math.round(n));

const fullName = (u?: { prenom?: string; nom?: string } | null) =>
  [u?.prenom, u?.nom].filter(Boolean).join(' ') || 'Hôte inconnu';

export function AdminLogementsTable({
  listings, isLoading = false,
  onInspect, onPublish, onReject, onSuspend, onUnsuspend, onToggleFeatured,
}: Props) {
  if (isLoading) {
    return (
      <div className="space-y-3 rounded-card border border-border bg-background-card p-6" aria-busy="true">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-inner bg-background-alt" />
        ))}
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center space-y-3 rounded-card border border-dashed border-border bg-background-card p-12 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-pill border border-border bg-background-alt text-foreground-muted">
          <Building2 className="h-6 w-6" aria-hidden="true" />
        </span>
        <div>
          <p className="font-display text-base font-semibold text-foreground">
            Aucun logement trouvé
          </p>
          <p className="text-xs text-foreground-muted">
            Ajustez votre recherche ou vos filtres.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-card border border-border bg-background-card shadow-sm">
      <div className="no-scrollbar overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-background-alt text-xs font-semibold uppercase tracking-wider text-foreground-muted">
            <tr>
              <th scope="col" className="px-4 py-3.5 sm:px-6">Logement</th>
              <th scope="col" className="px-4 py-3.5">Hôte</th>
              {/* Le libellé ne disait pas s'il s'agissait du prix hôte ou du
                 prix public : le locataire voit prixBase × 1,07. */}
              <th scope="col" className="px-4 py-3.5">Tarif hôte / nuit</th>
              <th scope="col" className="px-4 py-3.5">Statut</th>
              <th scope="col" className="px-4 py-3.5 text-right sm:px-6">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-border">
            {listings.map((item) => {
              const cfg = STATUS_CONFIG[item.statut] ?? STATUS_CONFIG.DRAFT;
              const photo = item.photos?.find((p) => p.estPrincipale)?.url ?? item.photos?.[0]?.url;
              const nonConformites = item.nbNonConformitesAnnonce ?? 0;
              const kycHote = item.proprietaire?.statutKyc;

              return (
                <tr key={item.id} className="transition-colors hover:bg-background-alt">

                  <td className="px-4 py-4 sm:px-6">
                    <div className="flex items-center gap-3">
                      <div className="relative h-14 w-16 shrink-0 overflow-hidden rounded-inner border border-border bg-background-alt">
                        {photo ? (
                          <Image src={photo} alt="" fill sizes="64px" unoptimized className="object-cover" />
                        ) : (
                          <span className="flex h-full w-full items-center justify-center text-foreground-muted">
                            <Building2 className="h-6 w-6" aria-hidden="true" />
                          </span>
                        )}
                      </div>

                      <div className="min-w-0 space-y-1">
                        <p className="max-w-[220px] truncate font-semibold text-foreground">
                          {item.titre}
                        </p>
                        <p className="flex items-center gap-1 text-xs text-foreground-muted">
                          <MapPin className="h-3 w-3 shrink-0" aria-hidden="true" />
                          <span className="truncate">
                            {[item.ville, item.quartier].filter(Boolean).join(', ')} · {item.type}
                          </span>
                        </p>
                        <p className="flex items-center gap-2 text-xs tabular-nums text-foreground-muted">
                          <span className="flex items-center gap-0.5">
                            <Bed className="h-3 w-3" aria-hidden="true" /> {item.nombreChambres ?? 1}
                          </span>
                          <span className="flex items-center gap-0.5">
                            <Bath className="h-3 w-3" aria-hidden="true" /> {item.nombreSallesBain ?? 1}
                          </span>
                          <span className="flex items-center gap-0.5">
                            <Users className="h-3 w-3" aria-hidden="true" /> {item.capaciteMax ?? 1}
                          </span>
                        </p>

                        {/* `nbNonConformitesAnnonce` était dans le type sans
                           jamais être affiché : c'est pourtant l'historique
                           de modération de cette annonce. */}
                        {nonConformites > 0 && (
                          <p className="inline-flex items-center gap-1 rounded-pill border border-warning-500/25 bg-warning-50 px-2 py-0.5 text-xs font-semibold text-warning-700">
                            <AlertTriangle className="h-3 w-3" aria-hidden="true" />
                            {nonConformites} non-conformité{nonConformites > 1 ? 's' : ''}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-4">
                    <p className="flex items-center gap-1 font-semibold text-foreground">
                      <User className="h-3.5 w-3.5 shrink-0 text-foreground-muted" aria-hidden="true" />
                      {fullName(item.proprietaire)}
                    </p>
                    <p className="text-xs text-foreground-muted">{item.proprietaire?.email ?? '—'}</p>
                    {item.proprietaire?.telephone && (
                      <p className="text-xs tabular-nums text-foreground-muted">
                        {item.proprietaire.telephone}
                      </p>
                    )}
                    {/* Un hôte non vérifié dont l'annonce attend validation,
                       c'est l'anomalie à repérer avant de publier. */}
                    {kycHote && kycHote !== 'VERIFIE' && (
                      <p className="mt-1 inline-flex items-center rounded-pill border border-warning-500/25 bg-warning-50 px-2 py-0.5 text-xs font-semibold text-warning-700">
                        KYC non validé
                      </p>
                    )}
                  </td>

                  <td className="px-4 py-4">
                    <p className="font-display text-sm font-semibold tabular-nums text-foreground">
                      {fcfa(item.prixBase)}
                      <span className="text-xs font-normal text-foreground-muted"> FCFA</span>
                    </p>
                    <p className="text-xs tabular-nums text-foreground-muted">
                      Public : {fcfa(item.prixBase * MARKUP)} FCFA
                    </p>
                    <p className="mt-1 flex flex-wrap gap-1">
                      <span className="inline-flex rounded-pill border border-border bg-background-alt px-2 py-0.5 text-xs font-semibold text-foreground-muted tabular-nums">
                        Acompte {item.acomptePourcentage ?? 30} %
                      </span>
                      {item.isInstantBooking && (
                        <span className="inline-flex rounded-pill border border-forest-100 bg-forest-50 px-2 py-0.5 text-xs font-semibold text-forest-700">
                          Instantané
                        </span>
                      )}
                    </p>
                  </td>

                  <td className="px-4 py-4">
                    <div className="flex flex-col items-start gap-1.5">
                      <span className={cn(
                        'inline-flex items-center gap-1 rounded-pill border px-2.5 py-1 text-xs font-semibold',
                        cfg.badge,
                      )}>
                        <cfg.Icon className="h-3.5 w-3.5" aria-hidden="true" />
                        {cfg.label}
                      </span>

                      {item.isFeatured && (
                        <span className="inline-flex items-center gap-1 rounded-pill border border-gold-200 bg-gold-50 px-2.5 py-0.5 text-xs font-semibold text-gold-700">
                          <Sparkles className="h-3 w-3" aria-hidden="true" />
                          En vedette
                          {/* `featuredUntil` n'était jamais affiché : impossible
                             de savoir si la mise en avant expire demain. */}
                          {item.featuredUntil && (
                            <span className="font-normal">
                              {' '}jusqu’au{' '}
                              {new Date(item.featuredUntil).toLocaleDateString('fr-FR', {
                                day: '2-digit', month: 'short',
                              })}
                            </span>
                          )}
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="px-4 py-4 text-right sm:px-6">
                    <div className="flex flex-wrap items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => onInspect(item)}
                        aria-label={`Inspecter ${item.titre}`}
                        className="inline-flex h-8 items-center gap-1 rounded-pill border border-border bg-background-card px-2.5 text-xs font-semibold text-foreground transition-colors hover:bg-background-alt"
                      >
                        <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                        <span className="hidden sm:inline">Inspecter</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onToggleFeatured(item)}
                        aria-label={
                          item.isFeatured
                            ? `Retirer ${item.titre} de la vedette`
                            : `Mettre ${item.titre} en vedette`
                        }
                        className={cn(
                          'inline-flex h-8 items-center gap-1 rounded-pill border px-2.5 text-xs font-semibold transition-colors',
                          item.isFeatured
                            ? 'border-gold-200 bg-gold-50 text-gold-700 hover:bg-gold-100'
                            : 'border-border bg-background-card text-foreground hover:bg-background-alt',
                        )}
                      >
                        <Star
                          className={cn('h-3.5 w-3.5', item.isFeatured && 'fill-gold-400 text-gold-500')}
                          aria-hidden="true"
                        />
                        <span className="hidden lg:inline">Vedette</span>
                      </button>

                      {item.statut === 'PENDING_REVIEW' && (
                        <>
                          <button
                            type="button"
                            onClick={() => onPublish(item)}
                            className="inline-flex h-8 items-center gap-1 rounded-pill bg-button-primary px-2.5 text-xs font-semibold text-on-button-primary transition-colors hover:bg-button-primary-hover"
                          >
                            <Check className="h-3.5 w-3.5" aria-hidden="true" />
                            <span className="hidden sm:inline">Valider</span>
                          </button>

                          {/* `onReject` était dans les props mais aucun bouton
                             ne l'appelait : impossible de rejeter une annonce
                             depuis cette table. */}
                          <button
                            type="button"
                            onClick={() => onReject(item)}
                            className="inline-flex h-8 items-center gap-1 rounded-pill border border-error-500/25 bg-background-card px-2.5 text-xs font-semibold text-error-700 transition-colors hover:bg-error-50"
                          >
                            <Ban className="h-3.5 w-3.5" aria-hidden="true" />
                            <span className="hidden sm:inline">Rejeter</span>
                          </button>
                        </>
                      )}

                      {item.statut === 'PUBLISHED' && (
                        <button
                          type="button"
                          onClick={() => onSuspend(item)}
                          className="inline-flex h-8 items-center gap-1 rounded-pill border border-error-500/25 bg-background-card px-2.5 text-xs font-semibold text-error-700 transition-colors hover:bg-error-50"
                        >
                          <span className="hidden sm:inline">Suspendre</span>
                          <AlertTriangle className="h-3.5 w-3.5 sm:hidden" aria-hidden="true" />
                        </button>
                      )}

                      {(item.statut === 'SUSPENDED' || item.statut === 'REJECTED') && (
                        <button
                          type="button"
                          onClick={() => onUnsuspend(item)}
                          className="inline-flex h-8 items-center gap-1 rounded-pill border border-forest-100 bg-forest-50 px-2.5 text-xs font-semibold text-forest-700 transition-colors hover:bg-forest-100"
                        >
                          <span className="hidden sm:inline">Réactiver</span>
                          <CheckCircle2 className="h-3.5 w-3.5 sm:hidden" aria-hidden="true" />
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