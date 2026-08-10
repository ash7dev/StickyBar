'use client';

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  X, Building2, MapPin, User, Star, Sparkles, AlertTriangle, Bed, Bath,
  Users, Calendar, Loader2, Zap, Clock, Video, Wifi, Key, Percent, Home,
  Compass, AlertCircle, Eye, EyeOff, ExternalLink, ShieldCheck, Wallet,
  CheckCircle2, XCircle, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { adminApi } from '@/lib/nestjs';
import type { LogementCatalogItem } from './AdminLogementsTable';

/* Majoration appliquée au prix public. À centraliser dans `@/lib/pricing`. */
const MARKUP = 1.07;

interface Photo { id: string; url: string; estPrincipale?: boolean; categorie?: string }
interface TarifPersonne { personnesMin: number; personnesMax: number; supplement: number | string }
interface TarifNuit { nuitsMin: number; nuitsMax?: number | null; prix: number | string }
interface Equipement { equipement: { id: string; nom: string; categorie?: string } }

interface ListingDetails extends LogementCatalogItem {
  sousType?: string;
  description?: string;
  nombrePieces?: number;
  ageMin?: number;
  latitude?: number;
  longitude?: number;
  videoUrl?: string;
  derniereMinuteActive?: boolean;
  rejectionReason?: string;
  instructionsAcces?: string;
  instructionsDigicode?: string;
  nomReseauWifi?: string;
  codeWifi?: string;
  reglesMaison?: string;
  photos?: Photo[];
  equipements?: Equipement[];
  tarifsPersonnes?: TarifPersonne[];
  tarifsNuits?: TarifNuit[];
}

interface Props {
  listing: LogementCatalogItem | null;
  isOpen: boolean;
  onClose: () => void;
  onPublish: (l: LogementCatalogItem) => void;
  onReject: (l: LogementCatalogItem) => void;
  onSuspend: (l: LogementCatalogItem) => void;
  onUnsuspend: (l: LogementCatalogItem) => void;
}

type TabId = 'apercu' | 'tarifs' | 'hote' | 'acces';

const TABS: { id: TabId; label: string }[] = [
  { id: 'apercu', label: 'Aperçu' },
  { id: 'tarifs', label: 'Tarifs' },
  { id: 'hote', label: 'Hôte' },
  { id: 'acces', label: 'Accès et règles' },
];

/* `warning-200/800`, `error-200/300/900`, `forest-200/300`, `gold-300/900`,
   `blue-*`, `purple-*`, `amber-*` : aucune n'existe dans la palette Klef.
   La majorité des badges de ce composant rendait sans bordure ni couleur. */
const STATUT: Record<string, { label: string; badge: string; Icon: typeof Clock }> = {
  PUBLISHED: { label: 'En ligne', badge: 'border-forest-100 bg-forest-50 text-forest-700', Icon: CheckCircle2 },
  PENDING_REVIEW: { label: 'À modérer', badge: 'border-warning-500/25 bg-warning-50 text-warning-700', Icon: Clock },
  SUSPENDED: { label: 'Suspendu', badge: 'border-error-500/25 bg-error-50 text-error-700', Icon: AlertTriangle },
  REJECTED: { label: 'Rejeté', badge: 'border-error-500/25 bg-error-50 text-error-700', Icon: XCircle },
  DRAFT: { label: 'Brouillon', badge: 'border-border bg-background-alt text-foreground-muted', Icon: Clock },
};

const KYC_LABELS: Record<string, { label: string; badge: string }> = {
  VERIFIE: { label: 'Vérifié', badge: 'border-gold-200 bg-gold-50 text-gold-700' },
  EN_ATTENTE: { label: 'En attente', badge: 'border-warning-500/25 bg-warning-50 text-warning-700' },
  REJETE: { label: 'Rejeté', badge: 'border-error-500/25 bg-error-50 text-error-700' },
  NON_VERIFIE: { label: 'Non vérifié', badge: 'border-border bg-background-alt text-foreground-muted' },
  A_RENOUVELER: { label: 'À renouveler', badge: 'border-warning-500/25 bg-warning-50 text-warning-700' },
};

/* `style: 'currency'` avec XOF produit « 45 000 F CFA », avec une espace
   insécable qui varie selon le navigateur et ne correspond pas au « FCFA »
   utilisé partout ailleurs dans l'application. */
const fcfa = (n?: number | string | null) =>
  n == null ? '—' : `${new Intl.NumberFormat('fr-FR').format(Math.round(Number(n) || 0))} FCFA`;

const formatDate = (d?: string | null) => {
  if (!d) return '—';
  const date = new Date(d);
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
};

/* ─── Briques ─────────────────────────────────────────────────────────────── */

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-foreground-muted">{label}</dt>
      <dd className="mt-0.5 text-sm font-semibold text-foreground">{children}</dd>
    </div>
  );
}

function Block({
  icon: Icon, title, children,
}: {
  icon: typeof Home;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3 rounded-card border border-border p-4">
      <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-foreground">
        <Icon className="h-4 w-4 text-foreground-muted" aria-hidden="true" />
        {title}
      </h3>
      {children}
    </section>
  );
}

/* ─── Composant ───────────────────────────────────────────────────────────── */

export function AdminLogementDetailModal({
  listing, isOpen, onClose, onPublish, onReject, onSuspend, onUnsuspend,
}: Props) {
  const [details, setDetails] = useState<ListingDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [tab, setTab] = useState<TabId>('apercu');
  const [codesVisibles, setCodesVisibles] = useState(false);

  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    if (!listing?.id || !isOpen) {
      setDetails(null);
      setPhotoIndex(0);
      setTab('apercu');
      setCodesVisibles(false);
      setLoadError(false);
      return;
    }
    setIsLoading(true);
    setLoadError(false);
    adminApi.getListingDetails(listing.id)
      .then((data) => { if (mounted.current) setDetails(data as ListingDetails); })
      .catch(() => { if (mounted.current) setLoadError(true); })
      .finally(() => { if (mounted.current) setIsLoading(false); });
  }, [listing?.id, isOpen]);

  /* Ni Échap, ni piège à focus, ni verrou de scroll, ni fermeture au clic sur
     le fond — sur une modale qui porte des actions de publication. */
  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key !== 'Tab') return;
      const items = panelRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href]',
      );
      if (!items?.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused.current?.focus();
    };
  }, [isOpen, onClose]);

  /* Les données complémentaires ne viennent QUE de l'API. Le repli
     `details ?? listing` affichait « aucune photo », « aucun équipement »,
     « aucun tarif » en cas d'échec réseau, comme si c'était la réalité. */
  const d = details;
  const base = details ?? listing;

  const photos = useMemo(() => d?.photos ?? [], [d]);
  const equipements = d?.equipements ?? [];
  const tarifsPersonnes = d?.tarifsPersonnes ?? [];
  const tarifsNuits = d?.tarifsNuits ?? [];

  const prevPhoto = useCallback(() => {
    setPhotoIndex((i) => (i === 0 ? photos.length - 1 : i - 1));
  }, [photos.length]);

  const nextPhoto = useCallback(() => {
    setPhotoIndex((i) => (i === photos.length - 1 ? 0 : i + 1));
  }, [photos.length]);

  if (!isOpen || !listing || !base) return null;

  const cfg = STATUT[base.statut] ?? STATUT.DRAFT;
  const StatutIcon = cfg.Icon;
  const prop = base.proprietaire;
  const kyc = KYC_LABELS[prop?.statutKyc ?? 'NON_VERIFIE'] ?? KYC_LABELS.NON_VERIFIE;
  const prixBase = Number(base.prixBase) || 0;
  const acompte = d?.acomptePourcentage ?? base.acomptePourcentage ?? 30;
  const signalements = base.nbNonConformitesAnnonce ?? 0;
  const hasCodes = Boolean(d?.codeWifi || d?.instructionsDigicode);

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center overflow-y-auto bg-forest-950/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
        className="no-scrollbar flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-card border border-border bg-background-card shadow-xl"
      >
        {/* ── En-tête ──────────────────────────────────────────────────── */}

        <header className="shrink-0 space-y-3 border-b border-border p-6 pb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-inner border border-forest-100 bg-forest-50 text-forest-700">
                <Building2 className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 id={titleId} className="font-display text-xl font-semibold text-foreground">
                    {base.titre}
                  </h2>
                  {d?.sousType && (
                    <span className="rounded-pill border border-border bg-background-alt px-2.5 py-0.5 text-xs font-semibold text-foreground-muted">
                      {d.sousType}
                    </span>
                  )}
                </div>
                <p className="flex flex-wrap items-center gap-1.5 text-xs text-foreground-muted">
                  <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  {[base.ville, base.quartier].filter(Boolean).join(', ')} · {base.type}
                </p>
              </div>
            </div>

            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              aria-label="Fermer"
              className="shrink-0 rounded-pill border border-border p-1.5 text-foreground-muted transition-colors hover:bg-background-alt hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Badges — le statut brut s'affichait tel quel : `PENDING_REVIEW`. */}
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn('inline-flex items-center gap-1 rounded-pill border px-3 py-1 text-xs font-semibold', cfg.badge)}>
              <StatutIcon className="h-3.5 w-3.5" aria-hidden="true" />
              {cfg.label}
            </span>

            {base.isInstantBooking && (
              <span className="inline-flex items-center gap-1 rounded-pill border border-forest-100 bg-forest-50 px-3 py-1 text-xs font-semibold text-forest-700">
                <Zap className="h-3.5 w-3.5" aria-hidden="true" /> Réservation instantanée
              </span>
            )}

            {base.isFeatured && (
              <span className="inline-flex items-center gap-1 rounded-pill border border-gold-200 bg-gold-50 px-3 py-1 text-xs font-semibold text-gold-700">
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                En vedette
                {base.featuredUntil && <span className="font-normal"> jusqu’au {formatDate(base.featuredUntil)}</span>}
              </span>
            )}

            {d?.derniereMinuteActive && (
              <span className="inline-flex items-center gap-1 rounded-pill border border-warning-500/25 bg-warning-50 px-3 py-1 text-xs font-semibold text-warning-700">
                <Clock className="h-3.5 w-3.5" aria-hidden="true" /> Dernière minute
              </span>
            )}

            {signalements > 0 && (
              <span className="inline-flex items-center gap-1 rounded-pill border border-error-500/25 bg-error-50 px-3 py-1 text-xs font-semibold text-error-700">
                <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="tabular-nums">{signalements}</span> signalement{signalements > 1 ? 's' : ''}
              </span>
            )}
          </div>

          {/* Le motif de rejet était noyé en septième position, entre les
             tarifs et les équipements. Il remonte en en-tête. */}
          {d?.rejectionReason && (
            <div className="flex items-start gap-2.5 rounded-inner border border-error-500/20 bg-error-50 p-3">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-error-600" aria-hidden="true" />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-error-700">Motif du rejet ou de la suspension</p>
                <p className="mt-0.5 text-xs leading-relaxed text-error-700">{d.rejectionReason}</p>
              </div>
            </div>
          )}

          <div role="tablist" aria-label="Sections du logement" className="flex flex-wrap items-center gap-1.5">
            {TABS.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={tab === id}
                onClick={() => setTab(id)}
                className={cn(
                  'rounded-pill border px-3.5 py-1.5 text-xs font-semibold transition-colors',
                  tab === id
                    ? 'border-forest-600 bg-forest-600 text-neutral-0'
                    : 'border-border bg-background-alt text-foreground-muted hover:text-foreground',
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </header>

        {/* ── Corps ────────────────────────────────────────────────────── */}

        <div className="no-scrollbar flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="space-y-4" aria-busy="true">
              <div className="h-72 animate-pulse rounded-card bg-background-alt" />
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="h-24 animate-pulse rounded-inner bg-background-alt" />
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {loadError && (
                <div role="alert" className="flex items-start gap-2.5 rounded-inner border border-error-500/20 bg-error-50 p-3.5">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-error-600" aria-hidden="true" />
                  <p className="text-xs leading-relaxed text-error-700">
                    Le dossier complet n’a pas pu être chargé. Photos, tarifs, équipements et
                    consignes d’accès ne sont pas affichés — ils ne sont pas vides pour autant.
                    Fermez et rouvrez la fiche.
                  </p>
                </div>
              )}

              {/* ══ APERÇU ═══════════════════════════════════════════════ */}

              {tab === 'apercu' && (
                <>
                  {photos.length > 0 ? (
                    <div className="space-y-3">
                      <div className="relative h-72 w-full overflow-hidden rounded-card border border-border bg-background-alt">
                        <Image
                          src={photos[photoIndex]?.url ?? photos[0].url}
                          alt=""
                          fill
                          sizes="(min-width: 1024px) 900px, 100vw"
                          unoptimized
                          className="object-cover"
                        />

                        {/* La galerie n'avait aucune navigation au clavier :
                           il fallait cliquer une vignette à la souris. */}
                        {photos.length > 1 && (
                          <>
                            <button
                              type="button"
                              onClick={prevPhoto}
                              aria-label="Photo précédente"
                              className="glass absolute top-1/2 left-3 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-pill"
                            >
                              <ChevronLeft className="h-5 w-5 text-forest-900" />
                            </button>
                            <button
                              type="button"
                              onClick={nextPhoto}
                              aria-label="Photo suivante"
                              className="glass absolute top-1/2 right-3 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-pill"
                            >
                              <ChevronRight className="h-5 w-5 text-forest-900" />
                            </button>
                            <span className="glass-dark absolute bottom-3 left-3 rounded-pill px-2.5 py-1 text-xs font-semibold tabular-nums">
                              {photoIndex + 1} / {photos.length}
                            </span>
                          </>
                        )}

                        {d?.videoUrl && (
                          <a
                            href={d.videoUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="glass-dark absolute right-3 bottom-3 inline-flex items-center gap-1.5 rounded-pill px-3 py-1.5 text-xs font-semibold"
                          >
                            <Video className="h-4 w-4" aria-hidden="true" /> Visite vidéo
                          </a>
                        )}
                      </div>

                      {photos.length > 1 && (
                        <div className="no-scrollbar flex items-center gap-2 overflow-x-auto pb-1">
                          {photos.map((p, idx) => (
                            <button
                              key={p.id ?? idx}
                              type="button"
                              onClick={() => setPhotoIndex(idx)}
                              aria-label={`Photo ${idx + 1}`}
                              aria-current={photoIndex === idx}
                              className={cn(
                                'relative h-16 w-24 shrink-0 overflow-hidden rounded-inner border transition-opacity',
                                photoIndex === idx
                                  ? 'border-forest-600'
                                  : 'border-border opacity-60 hover:opacity-100',
                              )}
                            >
                              <Image src={p.url} alt="" fill sizes="96px" unoptimized className="object-cover" />
                              {p.estPrincipale && (
                                <span className="glass-dark absolute top-1 left-1 rounded-pill px-1.5 py-0.5 text-xs font-semibold">
                                  Couv.
                                </span>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="rounded-card border border-dashed border-border bg-background-alt p-8 text-center text-xs text-foreground-muted">
                      {loadError ? 'Photos indisponibles.' : 'Aucune photo ajoutée.'}
                    </p>
                  )}

                  <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="space-y-1 rounded-inner border border-border bg-background-alt p-4">
                      <dt className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-foreground-muted">
                        <Wallet className="h-3.5 w-3.5" aria-hidden="true" /> Tarif hôte
                      </dt>
                      <dd className="font-display text-base font-semibold tabular-nums text-foreground">
                        {fcfa(prixBase)}
                      </dd>
                      {/* Le prix public n'apparaissait nulle part : un admin
                         ne voyait pas ce que le locataire paie réellement. */}
                      <p className="text-xs tabular-nums text-foreground-muted">
                        Public : {fcfa(prixBase * MARKUP)}
                      </p>
                    </div>

                    <div className="space-y-1 rounded-inner border border-border bg-background-alt p-4">
                      <dt className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-foreground-muted">
                        <Home className="h-3.5 w-3.5" aria-hidden="true" /> Composition
                      </dt>
                      <dd className="flex flex-wrap gap-2 text-sm font-semibold tabular-nums text-foreground">
                        <span className="flex items-center gap-1">
                          <Bed className="h-3.5 w-3.5" aria-hidden="true" /> {d?.nombreChambres ?? base.nombreChambres ?? 1}
                        </span>
                        <span className="flex items-center gap-1">
                          <Bath className="h-3.5 w-3.5" aria-hidden="true" /> {d?.nombreSallesBain ?? base.nombreSallesBain ?? 1}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" aria-hidden="true" /> {d?.capaciteMax ?? base.capaciteMax ?? 1}
                        </span>
                      </dd>
                      <p className="text-xs text-foreground-muted">
                        {d?.nombrePieces ?? '—'} pièces
                        {d?.surface ? ` · ${d.surface} m²` : ''}
                      </p>
                    </div>

                    <div className="space-y-1 rounded-inner border border-border bg-background-alt p-4">
                      <dt className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-foreground-muted">
                        <Calendar className="h-3.5 w-3.5" aria-hidden="true" /> Conditions
                      </dt>
                      <dd className="text-sm font-semibold tabular-nums text-foreground">
                        Min. {d?.nuitesMinimum ?? base.nuitesMinimum ?? 1} nuit
                        {(d?.nuitesMinimum ?? 1) > 1 ? 's' : ''}
                      </dd>
                      <p className="text-xs tabular-nums text-foreground-muted">
                        Âge minimum : {d?.ageMin ?? 18} ans
                      </p>
                    </div>

                    <div className="space-y-1 rounded-inner border border-border bg-background-alt p-4">
                      <dt className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-foreground-muted">
                        <Star className="h-3.5 w-3.5" aria-hidden="true" /> Activité
                      </dt>
                      <dd className="text-sm font-semibold tabular-nums text-foreground">
                        {base.totalSejours ?? 0} séjour{(base.totalSejours ?? 0) > 1 ? 's' : ''}
                      </dd>
                      <p className="flex items-center gap-1 text-xs tabular-nums text-foreground-muted">
                        <Star className="h-3 w-3 fill-gold-400 text-gold-400" aria-hidden="true" />
                        {Number(base.note ?? 0).toFixed(1)} ({base.totalAvis ?? 0})
                      </p>
                    </div>
                  </dl>

                  {d?.description && (
                    <Block icon={Building2} title="Description">
                      <p className="text-sm leading-relaxed text-foreground-muted">{d.description}</p>
                    </Block>
                  )}

                  {equipements.length > 0 && (
                    <Block icon={ShieldCheck} title={`Équipements · ${equipements.length}`}>
                      <ul className="flex flex-wrap gap-2">
                        {equipements.map((eq) => (
                          <li
                            key={eq.equipement?.id ?? eq.equipement?.nom}
                            className="rounded-pill border border-border bg-background-alt px-3 py-1 text-xs font-semibold text-foreground"
                          >
                            {eq.equipement?.nom}
                          </li>
                        ))}
                      </ul>
                    </Block>
                  )}
                </>
              )}

              {/* ══ TARIFS ═══════════════════════════════════════════════ */}

              {tab === 'tarifs' && (
                <>
                  <Block icon={Wallet} title="Tarif de base">
                    <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <Field label="Prix hôte / nuit">
                        <span className="tabular-nums">{fcfa(prixBase)}</span>
                      </Field>
                      <Field label="Prix public / nuit">
                        <span className="tabular-nums">{fcfa(prixBase * MARKUP)}</span>
                      </Field>
                      <Field label={`Acompte ${acompte} %`}>
                        <span className="tabular-nums">
                          {fcfa((prixBase * MARKUP * acompte) / 100)}
                        </span>
                      </Field>
                    </dl>
                  </Block>

                  {tarifsPersonnes.length > 0 && (
                    <Block icon={Users} title="Suppléments par voyageur">
                      <dl className="space-y-1.5">
                        {tarifsPersonnes.map((t, i) => (
                          <div key={i} className="flex justify-between gap-3 border-b border-border pb-1.5 text-sm last:border-0">
                            <dt className="text-foreground-muted">
                              {t.personnesMin} à {t.personnesMax} personnes
                            </dt>
                            <dd className="font-semibold tabular-nums text-foreground">
                              +{fcfa(t.supplement)} / nuit
                            </dd>
                          </div>
                        ))}
                      </dl>
                    </Block>
                  )}

                  {tarifsNuits.length > 0 && (
                    <Block icon={Percent} title="Tarif dégressif par durée">
                      <dl className="space-y-1.5">
                        {tarifsNuits.map((t, i) => (
                          <div key={i} className="flex justify-between gap-3 border-b border-border pb-1.5 text-sm last:border-0">
                            <dt className="text-foreground-muted">
                              Dès {t.nuitsMin} nuit{t.nuitsMin > 1 ? 's' : ''}
                              {t.nuitsMax ? ` jusqu’à ${t.nuitsMax}` : ''}
                            </dt>
                            <dd className="font-semibold tabular-nums text-foreground">
                              {fcfa(t.prix)} / nuit
                            </dd>
                          </div>
                        ))}
                      </dl>
                    </Block>
                  )}

                  {tarifsPersonnes.length === 0 && tarifsNuits.length === 0 && !loadError && (
                    <p className="rounded-inner border border-border bg-background-alt p-4 text-xs text-foreground-muted">
                      Aucun tarif conditionnel configuré.
                    </p>
                  )}
                </>
              )}

              {/* ══ HÔTE ═════════════════════════════════════════════════ */}

              {tab === 'hote' && (
                <Block icon={User} title="Propriétaire">
                  <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="Nom">
                      {[prop?.prenom, prop?.nom].filter(Boolean).join(' ') || '—'}
                    </Field>
                    <Field label="E-mail">{prop?.email ?? '—'}</Field>
                    <Field label="Téléphone">
                      <span className="tabular-nums">{prop?.telephone ?? '—'}</span>
                    </Field>
                    <Field label="Vérification d’identité">
                      {/* Le statut brut s'affichait tel quel, dans un badge
                         vert quel que soit son contenu : `NON_VERIFIE`
                         ressemblait à une validation. */}
                      <span className={cn(
                        'inline-flex items-center rounded-pill border px-2.5 py-0.5 text-xs font-semibold',
                        kyc.badge,
                      )}>
                        {kyc.label}
                      </span>
                    </Field>
                  </dl>

                  {prop?.id && (
                    <Link
                      href={`/admin/utilisateurs/${prop.id}`}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-link hover:underline"
                    >
                      Ouvrir la fiche utilisateur
                      <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                    </Link>
                  )}
                </Block>
              )}

              {/* ══ ACCÈS ════════════════════════════════════════════════ */}

              {tab === 'acces' && (
                <>
                  <Block icon={Compass} title="Localisation">
                    <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <Field label="Adresse">{d?.adresse ?? base.adresse ?? '—'}</Field>
                      <Field label="Ville et quartier">
                        {[base.ville, base.quartier].filter(Boolean).join(', ')}
                      </Field>
                      <Field label="Coordonnées GPS">
                        <span className="tabular-nums">
                          {d?.latitude && d?.longitude ? `${d.latitude}, ${d.longitude}` : 'Non renseignées'}
                        </span>
                      </Field>
                    </dl>
                  </Block>

                  {/* ⚠️ Ces codes ouvrent physiquement un logement. Ton produit
                     les protège côté locataire — visibles seulement après
                     confirmation de réservation. Les afficher en clair par
                     défaut dans l'admin annule cette protection. Révélation à
                     la demande. */}
                  {hasCodes && (
                    <Block icon={Key} title="Codes d’accès">
                      <div className="flex items-start gap-2.5 rounded-inner border border-warning-500/25 bg-warning-50 p-3">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning-600" aria-hidden="true" />
                        <p className="text-xs leading-relaxed text-warning-700">
                          Ces informations ouvrent physiquement le logement. Ne les consultez que
                          si c’est nécessaire au traitement d’un dossier.
                        </p>
                      </div>

                      {codesVisibles ? (
                        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          {d?.nomReseauWifi && (
                            <Field label="Réseau Wi-Fi">{d.nomReseauWifi}</Field>
                          )}
                          {d?.codeWifi && (
                            <Field label="Mot de passe Wi-Fi">
                              <span className="tabular-nums">{d.codeWifi}</span>
                            </Field>
                          )}
                          {d?.instructionsDigicode && (
                            <Field label="Digicode">
                              <span className="tabular-nums">{d.instructionsDigicode}</span>
                            </Field>
                          )}
                        </dl>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setCodesVisibles(true)}
                          className="inline-flex items-center gap-1.5 rounded-pill border border-border bg-background-card px-4 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-background-alt"
                        >
                          <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                          Afficher les codes
                        </button>
                      )}

                      {codesVisibles && (
                        <button
                          type="button"
                          onClick={() => setCodesVisibles(false)}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground-muted hover:text-foreground"
                        >
                          <EyeOff className="h-3.5 w-3.5" aria-hidden="true" />
                          Masquer
                        </button>
                      )}
                    </Block>
                  )}

                  {d?.nomReseauWifi && !d?.codeWifi && (
                    <Block icon={Wifi} title="Wi-Fi">
                      <Field label="Réseau">{d.nomReseauWifi}</Field>
                    </Block>
                  )}

                  {d?.instructionsAcces && (
                    <Block icon={Key} title="Instructions d’arrivée">
                      <p className="rounded-inner border border-border bg-background-alt p-3 text-sm leading-relaxed text-foreground-muted">
                        {d.instructionsAcces}
                      </p>
                    </Block>
                  )}

                  {d?.reglesMaison && (
                    <Block icon={ShieldCheck} title="Règles de la maison">
                      <p className="rounded-inner border border-border bg-background-alt p-3 text-sm leading-relaxed text-foreground-muted">
                        {d.reglesMaison}
                      </p>
                    </Block>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* ── Actions ──────────────────────────────────────────────────── */}

        <footer className="flex shrink-0 flex-wrap items-center justify-end gap-3 border-t border-border bg-background-alt px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-pill border border-border bg-background-card px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-background-alt"
          >
            Fermer
          </button>

          {base.statut === 'PENDING_REVIEW' && (
            <>
              <button
                type="button"
                onClick={() => { onClose(); onReject(listing); }}
                className="rounded-pill border border-error-500/25 bg-background-card px-4 py-2 text-sm font-semibold text-error-700 transition-colors hover:bg-error-50"
              >
                Rejeter
              </button>
              <button
                type="button"
                onClick={() => { onClose(); onPublish(listing); }}
                className="rounded-pill bg-button-primary px-5 py-2 text-sm font-semibold text-on-button-primary transition-colors hover:bg-button-primary-hover"
              >
                Valider et publier
              </button>
            </>
          )}

          {base.statut === 'PUBLISHED' && (
            <button
              type="button"
              onClick={() => { onClose(); onSuspend(listing); }}
              className="rounded-pill border border-error-500/25 bg-background-card px-4 py-2 text-sm font-semibold text-error-700 transition-colors hover:bg-error-50"
            >
              Suspendre
            </button>
          )}

          {(base.statut === 'SUSPENDED' || base.statut === 'REJECTED') && (
            <button
              type="button"
              onClick={() => { onClose(); onUnsuspend(listing); }}
              className="rounded-pill border border-forest-100 bg-forest-50 px-4 py-2 text-sm font-semibold text-forest-700 transition-colors hover:bg-forest-100"
            >
              Réactiver
            </button>
          )}
        </footer>
      </div>
    </div>
  );
}