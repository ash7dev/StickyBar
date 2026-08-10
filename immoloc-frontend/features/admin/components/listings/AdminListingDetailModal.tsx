'use client';

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  X, Check, MapPin, Building2, User, ChevronLeft, ChevronRight,
  ExternalLink, ShieldAlert, CheckCircle2, FileText, Coins, AlertTriangle,
  Bed, Bath, Users, Calendar, Star, Sparkles, Zap, Clock, Video, Wifi,
  Key, Percent, Compass, Eye, EyeOff, Pause, Play, XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { adminApi } from '@/lib/nestjs';
import { type ListingItem, MARKUP } from './AdminListingsTable';

/* ─── Types de la réponse API ──────────────────────────────────────────────
   `details: any` empêchait de savoir ce que le backend renvoie réellement.
   C'est ce qui produisait des `details.nbChambres ?? details.nombreChambres` :
   le code devinait. Adapte ces champs au DTO Nest réel — TypeScript te dira
   alors lui-même ce qui manque à l'écran. */

interface Photo { id?: string; url: string; estPrincipale?: boolean; categorie?: string }
interface Equipement { equipement?: { id?: string; nom: string; icone?: string; categorie?: string } }
interface TarifPersonne { personnesMin: number; personnesMax: number; supplement: number | string }
interface TarifNuit { nuitsMin: number; nuitsMax?: number | null; prix: number | string }

interface ListingDetails extends ListingItem {
  description?: string;
  adresse?: string;
  latitude?: number;
  longitude?: number;
  nombrePieces?: number;
  ageMin?: number;
  videoUrl?: string;
  derniereMinuteActive?: boolean;
  reglesMaison?: string;
  instructionsAcces?: string;
  instructionsDigicode?: string;
  nomReseauWifi?: string;
  codeWifi?: string;
  equipements?: Equipement[];
  tarifsPersonnes?: TarifPersonne[];
  tarifsNuits?: TarifNuit[];
  nbNonConformitesAnnonce?: number;
  sousType?: string;
  featuredUntil?: string | null;
  nuitesMinimum?: number;
  totalSejours?: number;
  note?: number | null;
  totalAvis?: number;
}

interface Props {
  listing: ListingItem | null;
  isOpen: boolean;
  onClose: () => void;
  onPublish: (l: ListingItem) => void;
  onReject: (l: ListingItem) => void;
  onSuspend: (l: ListingItem) => void;
  onUnsuspend: (l: ListingItem) => void;
}

type TabId = 'apercu' | 'tarifs' | 'hote' | 'acces';

const TABS: { id: TabId; label: string }[] = [
  { id: 'apercu', label: 'Aperçu' },
  { id: 'tarifs', label: 'Tarifs' },
  { id: 'hote', label: 'Hôte' },
  { id: 'acces', label: 'Accès et règles' },
];

const STATUT: Record<string, { label: string; badge: string; Icon: typeof Clock }> = {
  PENDING_REVIEW: { label: 'À modérer', badge: 'border-warning-500/25 bg-warning-50 text-warning-700', Icon: Clock },
  PUBLISHED: { label: 'En ligne', badge: 'border-forest-100 bg-forest-50 text-forest-700', Icon: CheckCircle2 },
  REJECTED: { label: 'Rejetée', badge: 'border-error-500/25 bg-error-50 text-error-700', Icon: XCircle },
  SUSPENDED: { label: 'Suspendue', badge: 'border-error-500/25 bg-error-50 text-error-700', Icon: AlertTriangle },
  DRAFT: { label: 'Brouillon', badge: 'border-border bg-background-alt text-foreground-muted', Icon: Building2 },
};

const KYC_BADGES: Record<string, { label: string; badge: string }> = {
  VERIFIE: { label: 'KYC validé', badge: 'border-gold-200 bg-gold-50 text-gold-700' },
  EN_ATTENTE: { label: 'KYC en attente', badge: 'border-warning-500/25 bg-warning-50 text-warning-700' },
  REJETE: { label: 'KYC rejeté', badge: 'border-error-500/25 bg-error-50 text-error-700' },
  A_RENOUVELER: { label: 'KYC à renouveler', badge: 'border-warning-500/25 bg-warning-50 text-warning-700' },
  NON_VERIFIE: { label: 'KYC non vérifié', badge: 'border-border bg-background-alt text-foreground-muted' },
};

const fcfa = (n?: number | string | null) =>
  n == null ? '—' : `${new Intl.NumberFormat('fr-FR').format(Math.round(Number(n) || 0))} FCFA`;

const formatDate = (d?: string | null) => {
  if (!d) return '—';
  const date = new Date(d);
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
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
  icon: typeof User;
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

function Stat({ icon: Icon, label, value, hint }: {
  icon: typeof Bed; label: string; value: React.ReactNode; hint?: React.ReactNode;
}) {
  return (
    <div className="space-y-1 rounded-inner border border-border bg-background-alt p-4">
      <p className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-foreground-muted">
        <Icon className="h-3.5 w-3.5" aria-hidden="true" /> {label}
      </p>
      <p className="font-display text-base font-semibold tabular-nums text-foreground">{value}</p>
      {hint && <p className="text-xs tabular-nums text-foreground-muted">{hint}</p>}
    </div>
  );
}

/* ─── Composant ───────────────────────────────────────────────────────────── */

export function AdminListingDetailModal({
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
     le fond — sur une modale qui porte des boutons de publication. */
  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key !== 'Tab') return;
      const items = panelRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]), a[href]');
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

  const photos: Photo[] = useMemo(
    () => details?.photos ?? listing?.photos ?? [],
    [details, listing],
  );

  const prevPhoto = useCallback(() => {
    setPhotoIndex((i) => (i === 0 ? photos.length - 1 : i - 1));
  }, [photos.length]);
  const nextPhoto = useCallback(() => {
    setPhotoIndex((i) => (i === photos.length - 1 ? 0 : i + 1));
  }, [photos.length]);

  if (!isOpen || !listing) return null;

  const d = details;
  const cfg = STATUT[listing.statut] ?? STATUT.DRAFT;
  const StatutIcon = cfg.Icon;

  const owner = d?.proprietaire ?? listing.proprietaire;
  const ownerName = [owner?.prenom, owner?.nom].filter(Boolean).join(' ') || '—';
  const kycStatus = owner?.statutKyc ?? 'NON_VERIFIE';
  const kycCfg = KYC_BADGES[kycStatus] ?? KYC_BADGES.NON_VERIFIE;
  const kycOk = kycStatus === 'VERIFIE';

  const prixBase = Number(d?.prixBase ?? listing.prixBase) || 0;
  const prixPublic = Math.round(prixBase * MARKUP);
  const acompte = d?.acomptePourcentage ?? listing.acomptePourcentage ?? 30;

  const equipements = d?.equipements ?? [];
  const tarifsPersonnes = d?.tarifsPersonnes ?? [];
  const tarifsNuits = d?.tarifsNuits ?? [];
  const signalements = d?.nbNonConformitesAnnonce ?? listing.nbNonConformitesAnnonce ?? 0;
  const motifRejet = d?.rejectionReason ?? listing.rejectionReason;
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
        {/* ══ En-tête ═══════════════════════════════════════════════════ */}

        <header className="shrink-0 space-y-3 border-b border-border p-6 pb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-inner border border-forest-100 bg-forest-50 text-forest-700">
                <Building2 className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 id={titleId} className="font-display text-lg font-semibold text-foreground">
                    {listing.titre}
                  </h2>
                  {/* ⚠️ Route à vérifier : ailleurs dans l'app la fiche
                     publique est sur `/explorer/[slug]`, pas `/listings/[id]`. */}
                  <Link
                    href={`/explorer/${listing.id}`}
                    target="_blank"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-link hover:underline"
                  >
                    Aperçu public
                    <ExternalLink className="h-3 w-3" aria-hidden="true" />
                  </Link>
                </div>
                <p className="flex items-center gap-1.5 text-xs text-foreground-muted">
                  <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  {[d?.ville ?? listing.ville, d?.quartier ?? listing.quartier]
                    .filter(Boolean).join(', ') || '—'}
                  {' · '}{d?.sousType ?? listing.sousType ?? listing.type ?? 'Logement'}
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

          <div className="flex flex-wrap items-center gap-2">
            <span className={cn('inline-flex items-center gap-1 rounded-pill border px-3 py-1 text-xs font-semibold', cfg.badge)}>
              <StatutIcon className="h-3.5 w-3.5" aria-hidden="true" />
              {cfg.label}
            </span>

            {(d?.isInstantBooking ?? listing.isInstantBooking) && (
              <span className="inline-flex items-center gap-1 rounded-pill border border-forest-100 bg-forest-50 px-3 py-1 text-xs font-semibold text-forest-700">
                <Zap className="h-3.5 w-3.5" aria-hidden="true" /> Réservation instantanée
              </span>
            )}

            {(d?.isFeatured ?? listing.isFeatured) && (
              <span className="inline-flex items-center gap-1 rounded-pill border border-gold-200 bg-gold-50 px-3 py-1 text-xs font-semibold text-gold-700">
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                En vedette
                {(d?.featuredUntil ?? listing.featuredUntil) && (
                  <span className="font-normal">
                    {' '}jusqu’au {formatDate(d?.featuredUntil ?? listing.featuredUntil)}
                  </span>
                )}
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

          {/* Le motif de rejet était en dernière position, après les
             équipements. C'est ce qui explique l'état de l'annonce. */}
          {motifRejet && (
            <div className="flex items-start gap-2.5 rounded-inner border border-error-500/20 bg-error-50 p-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-error-600" aria-hidden="true" />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-error-700">Motif du rejet ou de la suspension</p>
                <p className="mt-0.5 text-xs leading-relaxed text-error-700">{motifRejet}</p>
              </div>
            </div>
          )}

          {!kycOk && (
            <div className="flex items-center gap-2 rounded-inner border border-warning-500/25 bg-warning-50 p-2.5">
              <ShieldAlert className="h-4 w-4 shrink-0 text-warning-600" aria-hidden="true" />
              <p className="text-xs text-warning-700">
                L’identité de cet hôte n’est pas validée. À vérifier avant publication.
              </p>
            </div>
          )}

          <div role="tablist" aria-label="Sections de l’annonce" className="flex flex-wrap items-center gap-1.5">
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

        {/* ══ Corps ═════════════════════════════════════════════════════ */}

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
                    Le dossier complet n’a pas pu être chargé. Description, équipements, tarifs
                    conditionnels et consignes d’accès ne sont pas affichés — ils ne sont pas
                    vides pour autant. Fermez et rouvrez la fiche avant de décider.
                  </p>
                </div>
              )}

              {/* ══ APERÇU ══════════════════════════════════════════════ */}

              {tab === 'apercu' && (
                <>
                  {photos.length > 0 ? (
                    <div className="space-y-2">
                      <div className="relative h-64 w-full overflow-hidden rounded-card border border-border bg-background-alt sm:h-80">
                        <Image
                          src={photos[photoIndex]?.url ?? photos[0].url}
                          alt=""
                          fill
                          sizes="(min-width: 1024px) 900px, 100vw"
                          unoptimized
                          className="object-cover"
                        />

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
                            <span className="glass-dark absolute right-3 bottom-3 rounded-pill px-2.5 py-1 text-xs font-semibold tabular-nums">
                              {photoIndex + 1} / {photos.length}
                            </span>
                          </>
                        )}

                        {photos[photoIndex]?.categorie && (
                          <span className="glass-dark absolute top-3 left-3 rounded-pill px-2.5 py-1 text-xs font-semibold">
                            {photos[photoIndex].categorie}
                          </span>
                        )}

                        {d?.videoUrl && (
                          <a
                            href={d.videoUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="glass-dark absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-pill px-3 py-1.5 text-xs font-semibold"
                          >
                            <Video className="h-4 w-4" aria-hidden="true" /> Visite vidéo
                          </a>
                        )}
                      </div>

                      {photos.length > 1 && (
                        <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
                          {photos.map((p, i) => (
                            <button
                              key={p.id ?? i}
                              type="button"
                              onClick={() => setPhotoIndex(i)}
                              aria-label={`Photo ${i + 1}`}
                              aria-current={i === photoIndex}
                              className={cn(
                                'relative h-14 w-20 shrink-0 overflow-hidden rounded-inner border-2 transition-opacity',
                                i === photoIndex
                                  ? 'border-forest-600'
                                  : 'border-border opacity-60 hover:opacity-100',
                              )}
                            >
                              <Image src={p.url} alt="" fill sizes="80px" unoptimized className="object-cover" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="rounded-card border border-dashed border-border bg-background-alt p-8 text-center text-xs text-foreground-muted">
                      {loadError ? 'Photos indisponibles.' : 'Aucune photo — l’annonce ne peut pas être publiée.'}
                    </p>
                  )}

                  <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <Stat
                      icon={Bed}
                      label="Composition"
                      value={`${d?.nombreChambres ?? listing.nombreChambres ?? 1} ch.`}
                      hint={
                        <>
                          {d?.nombreSallesBain ?? listing.nombreSallesBain ?? 1} sdb
                          {d?.nombrePieces ? ` · ${d.nombrePieces} pièces` : ''}
                          {(d?.surface ?? listing.surface) ? ` · ${d?.surface ?? listing.surface} m²` : ''}
                        </>
                      }
                    />
                    <Stat
                      icon={Users}
                      label="Capacité"
                      value={`${d?.capaciteMax ?? listing.capaciteMax ?? 1} voy.`}
                      hint={`Âge minimum : ${d?.ageMin ?? 18} ans`}
                    />
                    <Stat
                      icon={Calendar}
                      label="Séjour"
                      value={`Min. ${d?.nuitesMinimum ?? listing.nuitesMinimum ?? 1} nuit${(d?.nuitesMinimum ?? 1) > 1 ? 's' : ''}`}
                      hint={`Créée le ${formatDate(d?.creeLe ?? listing.creeLe)}`}
                    />
                    <Stat
                      icon={Star}
                      label="Activité"
                      value={`${d?.totalSejours ?? listing.totalSejours ?? 0} séjour${(listing.totalSejours ?? 0) > 1 ? 's' : ''}`}
                      hint={
                        <span className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-gold-400 text-gold-400" aria-hidden="true" />
                          {Number(d?.note ?? listing.note ?? 0).toFixed(1)} ({d?.totalAvis ?? listing.totalAvis ?? 0})
                        </span>
                      }
                    />
                  </dl>

                  {d?.description && (
                    <Block icon={FileText} title="Description">
                      <p className="text-sm leading-relaxed whitespace-pre-line text-foreground-muted">
                        {d.description}
                      </p>
                    </Block>
                  )}

                  {equipements.length > 0 && (
                    <Block icon={CheckCircle2} title={`Équipements · ${equipements.length}`}>
                      <ul className="flex flex-wrap gap-2">
                        {equipements.map((eq, i) => (
                          <li
                            key={eq.equipement?.id ?? i}
                            className="rounded-pill border border-border bg-background-alt px-3 py-1.5 text-xs font-semibold text-foreground"
                          >
                            {eq.equipement?.nom ?? 'Équipement'}
                          </li>
                        ))}
                      </ul>
                    </Block>
                  )}
                </>
              )}

              {/* ══ TARIFS ══════════════════════════════════════════════ */}

              {tab === 'tarifs' && (
                <>
                  <Block icon={Coins} title="Tarif de base">
                    <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <div className="space-y-0.5 rounded-inner border border-border bg-background-alt p-3">
                        <dt className="text-xs text-foreground-muted">Prix net hôte</dt>
                        <dd className="font-display text-base font-semibold tabular-nums text-foreground">
                          {fcfa(prixBase)}
                        </dd>
                        <p className="text-xs text-foreground-muted">par nuit</p>
                      </div>
                      <div className="space-y-0.5 rounded-inner border border-border bg-background-alt p-3">
                        <dt className="text-xs text-foreground-muted">Prix public</dt>
                        <dd className="font-display text-base font-semibold tabular-nums text-foreground">
                          {fcfa(prixPublic)}
                        </dd>
                        <p className="text-xs text-foreground-muted">
                          majoration de {Math.round((MARKUP - 1) * 100)} %
                        </p>
                      </div>
                      <div className="space-y-0.5 rounded-inner border border-border bg-background-alt p-3">
                        <dt className="text-xs text-foreground-muted">Acompte en ligne</dt>
                        <dd className="font-display text-base font-semibold tabular-nums text-foreground">
                          {fcfa((prixPublic * acompte) / 100)}
                        </dd>
                        <p className="text-xs tabular-nums text-foreground-muted">{acompte} % du total</p>
                      </div>
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

              {/* ══ HÔTE ════════════════════════════════════════════════ */}

              {tab === 'hote' && (
                <Block icon={User} title="Propriétaire">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-display text-base font-semibold text-foreground">{ownerName}</p>
                    <span className={cn(
                      'inline-flex items-center gap-1 rounded-pill border px-2.5 py-0.5 text-xs font-semibold',
                      kycCfg.badge,
                    )}>
                      {kycOk
                        ? <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                        : <ShieldAlert className="h-3 w-3" aria-hidden="true" />}
                      {kycCfg.label}
                    </span>
                  </div>

                  <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="E-mail">{owner?.email ?? '—'}</Field>
                    <Field label="Téléphone">
                      <span className="tabular-nums">{owner?.telephone ?? '—'}</span>
                    </Field>
                  </dl>

                  {owner?.id && (
                    <Link
                      href={`/admin/utilisateurs/${owner.id}`}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-link hover:underline"
                    >
                      Ouvrir la fiche utilisateur
                      <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                    </Link>
                  )}
                </Block>
              )}

              {/* ══ ACCÈS ═══════════════════════════════════════════════ */}

              {tab === 'acces' && (
                <>
                  <Block icon={Compass} title="Localisation">
                    <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <Field label="Adresse">{d?.adresse ?? '—'}</Field>
                      <Field label="Ville et quartier">
                        {[d?.ville ?? listing.ville, d?.quartier ?? listing.quartier]
                          .filter(Boolean).join(', ') || '—'}
                      </Field>
                      <Field label="Coordonnées GPS">
                        <span className="tabular-nums">
                          {d?.latitude && d?.longitude
                            ? `${d.latitude}, ${d.longitude}`
                            : 'Non renseignées'}
                        </span>
                      </Field>
                    </dl>
                  </Block>

                  {/* ⚠️ Ces codes ouvrent physiquement un logement. Le produit
                     les protège côté locataire — visibles seulement après
                     confirmation de réservation. Les exposer par défaut dans
                     l'admin annulerait cette protection. Révélation à la
                     demande, et à journaliser côté backend. */}
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
                        <>
                          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            {d?.nomReseauWifi && <Field label="Réseau Wi-Fi">{d.nomReseauWifi}</Field>}
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
                          <button
                            type="button"
                            onClick={() => setCodesVisibles(false)}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground-muted hover:text-foreground"
                          >
                            <EyeOff className="h-3.5 w-3.5" aria-hidden="true" /> Masquer
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setCodesVisibles(true)}
                          className="inline-flex items-center gap-1.5 rounded-pill border border-border bg-background-card px-4 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-background-alt"
                        >
                          <Eye className="h-3.5 w-3.5" aria-hidden="true" /> Afficher les codes
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
                      <p className="rounded-inner border border-border bg-background-alt p-3 text-sm leading-relaxed whitespace-pre-line text-foreground-muted">
                        {d.instructionsAcces}
                      </p>
                    </Block>
                  )}

                  {d?.reglesMaison && (
                    <Block icon={FileText} title="Règlement intérieur">
                      <p className="rounded-inner border border-border bg-background-alt p-3 text-sm leading-relaxed whitespace-pre-line text-foreground-muted">
                        {d.reglesMaison}
                      </p>
                    </Block>
                  )}

                  {!d?.instructionsAcces && !d?.reglesMaison && !hasCodes && !loadError && (
                    <p className="rounded-inner border border-border bg-background-alt p-4 text-xs text-foreground-muted">
                      Aucun livret d’accueil renseigné.
                    </p>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* ══ Actions ═══════════════════════════════════════════════════ */}

        <footer className="flex shrink-0 flex-wrap items-center justify-end gap-3 border-t border-border bg-background-alt px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-pill border border-border bg-background-card px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-background-alt"
          >
            Fermer
          </button>

          {listing.statut === 'PENDING_REVIEW' && (
            <>
              <button
                type="button"
                onClick={() => { onClose(); onReject(listing); }}
                className="inline-flex items-center gap-1.5 rounded-pill border border-error-500/25 bg-background-card px-4 py-2 text-sm font-semibold text-error-700 transition-colors hover:bg-error-50"
              >
                <X className="h-4 w-4" aria-hidden="true" />
                Rejeter
              </button>
              <button
                type="button"
                onClick={() => { onClose(); onPublish(listing); }}
                className="inline-flex items-center gap-1.5 rounded-pill bg-button-primary px-5 py-2 text-sm font-semibold text-on-button-primary transition-colors hover:bg-button-primary-hover"
              >
                <Check className="h-4 w-4" aria-hidden="true" />
                Publier
              </button>
            </>
          )}

          {listing.statut === 'PUBLISHED' && (
            <button
              type="button"
              onClick={() => { onClose(); onSuspend(listing); }}
              className="inline-flex items-center gap-1.5 rounded-pill border border-error-500/25 bg-background-card px-4 py-2 text-sm font-semibold text-error-700 transition-colors hover:bg-error-50"
            >
              <Pause className="h-4 w-4" aria-hidden="true" />
              Suspendre
            </button>
          )}

          {(listing.statut === 'SUSPENDED' || listing.statut === 'REJECTED') && (
            <button
              type="button"
              onClick={() => { onClose(); onUnsuspend(listing); }}
              className="inline-flex items-center gap-1.5 rounded-pill bg-button-primary px-5 py-2 text-sm font-semibold text-on-button-primary transition-colors hover:bg-button-primary-hover"
            >
              <Play className="h-4 w-4" aria-hidden="true" />
              Réactiver
            </button>
          )}
        </footer>
      </div>
    </div>
  );
}