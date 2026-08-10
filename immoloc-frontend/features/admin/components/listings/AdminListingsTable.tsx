'use client';

import Image from 'next/image';
import {
  Eye, Check, X, Pause, Play, Star, Clock, CheckCircle2, XCircle,
  AlertTriangle, MapPin, Building2, Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

/* Majoration appliquée au prix public. À centraliser dans `@/lib/pricing`. */
export const MARKUP = 1.07;

export interface ListingItem {
  id: string;
  titre: string;
  type?: string;
  sousType?: string;
  ville?: string;
  quartier?: string;
  prixBase?: number;
  acomptePourcentage?: number;
  surface?: number;
  nombreChambres?: number;
  nombreSallesBain?: number;
  capaciteMax?: number;
  nuitesMinimum?: number;
  isInstantBooking?: boolean;
  statut: 'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED' | 'REJECTED' | 'SUSPENDED';
  rejectionReason?: string | null;
  creeLe?: string;
  isFeatured?: boolean;
  featuredUntil?: string | null;
  nbNonConformitesAnnonce?: number;
  note?: number | null;
  totalAvis?: number;
  totalSejours?: number;
  photos?: Array<{ id: string; url: string; estPrincipale?: boolean }>;
  proprietaire?: {
    id: string;
    prenom?: string;
    nom?: string;
    email?: string;
    telephone?: string;
    statutKyc?: string;
  };
}

interface Props {
  listings: ListingItem[];
  isLoading?: boolean;
  onInspect: (l: ListingItem) => void;
  onPublish: (l: ListingItem) => void;
  onReject: (l: ListingItem) => void;
  onSuspend: (l: ListingItem) => void;
  onUnsuspend: (l: ListingItem) => void;
  onToggleFeatured: (l: ListingItem) => void;
}

/* ⚠️ `warning-100/200/300/800/900`, `error-100/200`, `forest-200/300` :
   aucune n'existe dans la palette Klef (rampes sémantiques en 50/500/600/700,
   forest en 50/100/200… mais 200 seulement côté forest). La majorité des
   badges de statut et des boutons d'action rendait sans bordure ni couleur. */
const STATUS_CONFIG: Record<string, { label: string; Icon: typeof Clock; badge: string }> = {
  PENDING_REVIEW: { label: 'À modérer', Icon: Clock, badge: 'border-warning-500/25 bg-warning-50 text-warning-700' },
  PUBLISHED: { label: 'En ligne', Icon: CheckCircle2, badge: 'border-forest-100 bg-forest-50 text-forest-700' },
  REJECTED: { label: 'Rejetée', Icon: XCircle, badge: 'border-error-500/25 bg-error-50 text-error-700' },
  /* `SUSPENDED` et `PENDING_REVIEW` partageaient la même couleur : impossible
     de distinguer une annonce en attente d'une annonce sanctionnée. */
  SUSPENDED: { label: 'Suspendue', Icon: AlertTriangle, badge: 'border-error-500/25 bg-error-50 text-error-700' },
  DRAFT: { label: 'Brouillon', Icon: Building2, badge: 'border-border bg-background-alt text-foreground-muted' },
};

const fcfa = (n?: number | null) =>
  n == null ? '—' : new Intl.NumberFormat('fr-FR').format(Math.round(Number(n) || 0));

const formatDate = (d?: string | null) => {
  if (!d) return null;
  const date = new Date(d);
  return Number.isNaN(date.getTime())
    ? null
    : date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: '2-digit' });
};

/** Jours écoulés depuis la soumission — signale les dossiers qui traînent. */
function joursDepuis(iso?: string) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const a = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  const now = new Date();
  const b = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.max(0, Math.round((b - a) / 86_400_000));
}

export function AdminListingsTable({
  listings, isLoading = false,
  onInspect, onPublish, onReject, onSuspend, onUnsuspend, onToggleFeatured,
}: Props) {
  if (isLoading) {
    return (
      <div className="space-y-3 rounded-card border border-border bg-background-card p-6" aria-busy="true">
        {Array.from({ length: 4 }).map((_, i) => (
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
            Aucune annonce trouvée
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
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-background-alt text-xs font-semibold uppercase tracking-wider text-foreground-muted">
            <tr>
              <th scope="col" className="px-4 py-3.5 sm:px-6">Annonce</th>
              <th scope="col" className="px-4 py-3.5">Propriétaire</th>
              <th scope="col" className="px-4 py-3.5">Localisation</th>
              {/* Le libellé « Prix / Nuit » ne disait pas s'il s'agissait du
                 tarif hôte ou du prix payé par le locataire. */}
              <th scope="col" className="px-4 py-3.5">Tarif</th>
              <th scope="col" className="px-4 py-3.5">Statut</th>
              <th scope="col" className="px-4 py-3.5 text-right sm:px-6">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-border">
            {listings.map((item) => {
              const photo = item.photos?.find((p) => p.estPrincipale) ?? item.photos?.[0];
              const cfg = STATUS_CONFIG[item.statut] ?? STATUS_CONFIG.DRAFT;
              const owner = item.proprietaire;
              const ownerName = [owner?.prenom, owner?.nom].filter(Boolean).join(' ') || '—';
              const kycOk = owner?.statutKyc === 'VERIFIE';
              const prixBase = Number(item.prixBase) || 0;
              const signalements = item.nbNonConformitesAnnonce ?? 0;
              const attente = item.statut === 'PENDING_REVIEW' ? joursDepuis(item.creeLe) : null;
              const enRetard = attente !== null && attente >= 2;

              return (
                <tr key={item.id} className="transition-colors hover:bg-background-alt">

                  {/* ── Annonce ─────────────────────────────────────────── */}
                  <td className="px-4 py-4 sm:px-6">
                    <div className="flex items-center gap-3">
                      <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-inner border border-border bg-background-alt">
                        {photo ? (
                          <Image src={photo.url} alt="" fill sizes="80px" unoptimized className="object-cover" />
                        ) : (
                          <span className="flex h-full w-full items-center justify-center text-foreground-muted">
                            <Building2 className="h-5 w-5" aria-hidden="true" />
                          </span>
                        )}
                        {item.isFeatured && (
                          /* La pastille « vedette » était en `warning-500` :
                             la mise en avant n'est pas un avertissement. */
                          <span className="absolute top-0.5 right-0.5 flex h-5 w-5 items-center justify-center rounded-pill bg-gold-400 text-forest-900">
                            <Star className="h-3 w-3 fill-current" aria-hidden="true" />
                            <span className="sr-only">En vedette</span>
                          </span>
                        )}
                      </div>

                      <div className="min-w-0 space-y-0.5">
                        <p className="max-w-[220px] truncate font-semibold text-foreground">
                          {item.titre}
                        </p>
                        <p className="text-xs text-foreground-muted">
                          {item.sousType ?? item.type ?? 'Logement'}
                          {item.surface ? ` · ${item.surface} m²` : ''}
                        </p>

                        {/* Ni chambres, ni capacité, ni durée minimale n'étaient
                           affichées alors qu'elles sont dans le type. */}
                        <p className="text-xs tabular-nums text-foreground-muted">
                          {item.nombreChambres ?? 1} ch · {item.nombreSallesBain ?? 1} sdb ·{' '}
                          {item.capaciteMax ?? 1} voy.
                          {item.nuitesMinimum && item.nuitesMinimum > 1
                            ? ` · min. ${item.nuitesMinimum} nuits`
                            : ''}
                        </p>

                        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                          {item.isInstantBooking && (
                            <span className="inline-flex items-center gap-1 rounded-pill border border-forest-100 bg-forest-50 px-1.5 py-0.5 text-xs font-semibold text-forest-700">
                              <Zap className="h-3 w-3" aria-hidden="true" /> Instantané
                            </span>
                          )}
                          {signalements > 0 && (
                            /* `nbNonConformitesAnnonce` n'était jamais affiché :
                               une annonce déjà signalée deux fois se traitait
                               comme une première soumission. */
                            <span className="inline-flex items-center gap-1 rounded-pill border border-error-500/25 bg-error-50 px-1.5 py-0.5 text-xs font-semibold text-error-700">
                              <AlertTriangle className="h-3 w-3" aria-hidden="true" />
                              <span className="tabular-nums">{signalements}</span>
                            </span>
                          )}
                        </div>

                        {formatDate(item.creeLe) && (
                          <p className={cn(
                            'text-xs tabular-nums',
                            enRetard ? 'font-semibold text-warning-700' : 'text-foreground-muted',
                          )}>
                            Soumise le {formatDate(item.creeLe)}
                            {attente !== null && attente > 0 && ` · ${attente} j d’attente`}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* ── Propriétaire ────────────────────────────────────── */}
                  <td className="px-4 py-4">
                    <p className="font-semibold text-foreground">{ownerName}</p>
                    <p className="max-w-[160px] truncate text-xs text-foreground-muted">
                      {owner?.email ?? '—'}
                    </p>
                    {owner?.telephone && (
                      <p className="text-xs tabular-nums text-foreground-muted">{owner.telephone}</p>
                    )}
                    {owner?.statutKyc && (
                      <span className={cn(
                        'mt-1 inline-flex items-center rounded-pill border px-1.5 py-0.5 text-xs font-semibold',
                        kycOk
                          ? 'border-gold-200 bg-gold-50 text-gold-700'
                          : 'border-warning-500/25 bg-warning-50 text-warning-700',
                      )}>
                        {kycOk ? 'KYC vérifié' : 'KYC non validé'}
                      </span>
                    )}
                  </td>

                  {/* ── Localisation ────────────────────────────────────── */}
                  <td className="px-4 py-4">
                    <p className="flex items-center gap-1.5 text-foreground">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-foreground-muted" aria-hidden="true" />
                      <span className="truncate">{item.ville ?? '—'}</span>
                    </p>
                    {item.quartier && (
                      <p className="text-xs text-foreground-muted">{item.quartier}</p>
                    )}
                  </td>

                  {/* ── Tarif ───────────────────────────────────────────── */}
                  <td className="px-4 py-4">
                    <p className="font-display text-sm font-semibold tabular-nums text-foreground">
                      {fcfa(prixBase)}
                      <span className="text-xs font-normal text-foreground-muted"> FCFA</span>
                    </p>
                    {/* Le prix public n'apparaissait nulle part : un modérateur
                       ne voyait pas ce que le locataire paie réellement. */}
                    <p className="text-xs tabular-nums text-foreground-muted">
                      Public : {fcfa(prixBase * MARKUP)} FCFA
                    </p>
                    <p className="mt-1 inline-flex rounded-pill border border-border bg-background-alt px-1.5 py-0.5 text-xs font-semibold tabular-nums text-foreground-muted">
                      Acompte {item.acomptePourcentage ?? 30} %
                    </p>
                  </td>

                  {/* ── Statut ──────────────────────────────────────────── */}
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
                        <span className="inline-flex items-center gap-1 rounded-pill border border-gold-200 bg-gold-50 px-2 py-0.5 text-xs font-semibold text-gold-700">
                          <Star className="h-3 w-3 fill-current" aria-hidden="true" />
                          Vedette
                          {item.featuredUntil && (
                            <span className="font-normal"> · {formatDate(item.featuredUntil)}</span>
                          )}
                        </span>
                      )}

                      {/* `rejectionReason` était dans le type sans jamais être
                         affiché : le motif du refus était invisible depuis la
                         liste, il fallait ouvrir la fiche. */}
                      {item.rejectionReason && (
                        <p className="max-w-[180px] text-xs leading-relaxed text-error-700">
                          {item.rejectionReason}
                        </p>
                      )}
                    </div>
                  </td>

                  {/* ── Actions ─────────────────────────────────────────── */}
                  <td className="px-4 py-4 text-right sm:px-6">
                    <div className="flex flex-wrap items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => onInspect(item)}
                        aria-label={`Inspecter ${item.titre}`}
                        className="inline-flex h-8 items-center gap-1 rounded-pill border border-border bg-background-card px-2.5 text-xs font-semibold text-foreground transition-colors hover:bg-background-alt"
                      >
                        <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                        <span className="hidden sm:inline">Détails</span>
                      </button>

                      {/* La mise en vedette n'était possible qu'en PUBLISHED,
                         alors qu'elle doit pouvoir être retirée quel que soit
                         le statut — une annonce suspendue restait sponsorisée. */}
                      {(item.statut === 'PUBLISHED' || item.isFeatured) && (
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
                            className={cn('h-3.5 w-3.5', item.isFeatured && 'fill-current')}
                            aria-hidden="true"
                          />
                          <span className="hidden lg:inline">Vedette</span>
                        </button>
                      )}

                      {item.statut === 'PENDING_REVIEW' && (
                        <>
                          <button
                            type="button"
                            onClick={() => onPublish(item)}
                            aria-label={`Publier ${item.titre}`}
                            className="inline-flex h-8 items-center gap-1 rounded-pill bg-button-primary px-2.5 text-xs font-semibold text-on-button-primary transition-colors hover:bg-button-primary-hover"
                          >
                            <Check className="h-3.5 w-3.5" aria-hidden="true" />
                            <span className="hidden sm:inline">Publier</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onReject(item)}
                            aria-label={`Rejeter ${item.titre}`}
                            className="inline-flex h-8 items-center gap-1 rounded-pill border border-error-500/25 bg-background-card px-2.5 text-xs font-semibold text-error-700 transition-colors hover:bg-error-50"
                          >
                            <X className="h-3.5 w-3.5" aria-hidden="true" />
                            <span className="hidden sm:inline">Rejeter</span>
                          </button>
                        </>
                      )}

                      {item.statut === 'PUBLISHED' && (
                        <button
                          type="button"
                          onClick={() => onSuspend(item)}
                          aria-label={`Suspendre ${item.titre}`}
                          className="inline-flex h-8 items-center gap-1 rounded-pill border border-error-500/25 bg-background-card px-2.5 text-xs font-semibold text-error-700 transition-colors hover:bg-error-50"
                        >
                          <Pause className="h-3.5 w-3.5" aria-hidden="true" />
                          <span className="hidden sm:inline">Suspendre</span>
                        </button>
                      )}

                      {/* `REJECTED` n'avait aucune action : une annonce rejetée
                         à tort restait bloquée sans recours depuis la table. */}
                      {(item.statut === 'SUSPENDED' || item.statut === 'REJECTED') && (
                        <button
                          type="button"
                          onClick={() => onUnsuspend(item)}
                          aria-label={`Réactiver ${item.titre}`}
                          className="inline-flex h-8 items-center gap-1 rounded-pill border border-forest-100 bg-forest-50 px-2.5 text-xs font-semibold text-forest-700 transition-colors hover:bg-forest-100"
                        >
                          <Play className="h-3.5 w-3.5" aria-hidden="true" />
                          <span className="hidden sm:inline">Réactiver</span>
                        </button>
                      )}

                      {/* Un brouillon n'a aucune action de modération : il n'a
                         jamais été soumis. Rien ne l'indiquait. */}
                      {item.statut === 'DRAFT' && (
                        <span className="text-xs text-foreground-muted">Non soumise</span>
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