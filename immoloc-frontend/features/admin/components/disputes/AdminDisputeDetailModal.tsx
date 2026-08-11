'use client';

import { useCallback, useEffect, useId, useRef, useState, type ComponentType } from 'react';
import {
  AlertTriangle, Calendar, Camera, ChevronLeft, ChevronRight, CreditCard, FileText,
  Loader2, MapPin, Scale, User, X, XCircle,
} from 'lucide-react';
import type { DisputeItem } from './AdminDisputesTable';
import { adminApi } from '@/lib/nestjs';
import { cn } from '@/lib/utils/cn';
/* ⚠ Import inter-feature assumé : `DocumentViewer` a été écrit pour le KYC
   mais résout exactement le même problème ici — lire une pièce sans la
   recadrer. À déplacer dans un dossier partagé (`@/components/media/`). */
import { DocumentViewer } from '@/features/admin/components/kyc/DocumentViewer';

interface PhotoEtatLieu {
  id: string;
  url: string;
  type?: string;
  categorie?: string;
}

/* `details: any` empêchait de savoir ce que renvoie le backend : le code lisait
   `res.totalLocataire` et `res.paiement.statut`, deux champs absents du type
   `DisputeItem`. Un renommage côté Nest passait sans erreur de compilation.
   Adapter au DTO réel. */
interface DisputeDetails extends DisputeItem {
  reservation?: DisputeItem['reservation'] & {
    dateDebut?: string;
    dateFin?: string;
    totalLocataire?: number;
    paiement?: { statut?: string; fournisseur?: string; montant?: number };
  };
}

interface Props {
  dispute: DisputeItem | null;
  isOpen: boolean;
  onClose: () => void;
  onResolve: (dispute: DisputeItem) => void;
}

const MOTIFS: Record<string, string> = {
  LOGEMENT_NON_CONFORME: 'Logement non conforme',
  LOGEMENT_INACCESSIBLE: 'Logement inaccessible',
  DEPASSEMENT_PERSONNES: 'Dépassement de personnes',
  DOMMAGES: 'Dommages',
  AUTRE: 'Autre',
};

/* Aligné sur AdminDisputesTable : un litige FONDÉ n'est pas une réussite —
   la plainte est justifiée, une indemnisation part. Le vert allait à
   NON_FONDÉ, la seule issue sans conséquence. */
const STATUTS: Record<
  DisputeItem['statut'],
  { label: string; Icon: ComponentType<{ className?: string }>; badge: string; panneau: string }
> = {
  EN_ATTENTE: {
    label: 'En attente d’arbitrage',
    Icon: AlertTriangle,
    badge: 'border-warning-500/25 bg-warning-50 text-warning-700',
    panneau: 'bg-warning-50',
  },
  FONDE: {
    label: 'Litige fondé',
    Icon: Scale,
    badge: 'border-error-500/25 bg-error-50 text-error-700',
    panneau: 'bg-error-50',
  },
  NON_FONDE: {
    label: 'Litige non fondé',
    Icon: XCircle,
    badge: 'border-border bg-background-alt text-foreground-muted',
    panneau: 'bg-background-alt',
  },
};

const fmtMontant = (n?: number | null) =>
  n == null || Number.isNaN(Number(n))
    ? '—'
    : `${new Intl.NumberFormat('fr-FR').format(Math.round(Number(n)))} FCFA`;

const fmtDate = (d?: string | null) => {
  if (!d) return '—';
  const date = new Date(d);
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
};

const nomComplet = (u?: { prenom?: string; nom?: string } | null) =>
  `${u?.prenom ?? ''} ${u?.nom ?? ''}`.trim() || '—';

/* ─── Briques ─────────────────────────────────────────────────────────────── */

function Bloc({
  icon: Icon,
  titre,
  children,
  className,
}: {
  icon: ComponentType<{ className?: string }>;
  titre: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('space-y-2 rounded-inner border border-border p-4', className)}>
      <h3 className="eyebrow flex items-center gap-1.5 text-[0.6875rem]">
        <Icon className="h-3.5 w-3.5" aria-hidden />
        {titre}
      </h3>
      {children}
    </section>
  );
}

/* ─── Composant ───────────────────────────────────────────────────────────── */

export function AdminDisputeDetailModal({ dispute, isOpen, onClose, onResolve }: Props) {
  const [details, setDetails] = useState<DisputeDetails | null>(null);
  const [chargement, setChargement] = useState(false);
  const [erreurChargement, setErreurChargement] = useState(false);
  const [photoOuverte, setPhotoOuverte] = useState<number | null>(null);

  const baseId = useId();
  const panneau = useRef<HTMLDivElement>(null);
  const monte = useRef(true);

  useEffect(() => {
    monte.current = true;
    return () => {
      monte.current = false;
    };
  }, []);

  useEffect(() => {
    if (!dispute?.id || !isOpen) {
      setDetails(null);
      setErreurChargement(false);
      setPhotoOuverte(null);
      return;
    }
    setChargement(true);
    setErreurChargement(false);
    adminApi
      .getDisputeDetails(dispute.id)
      .then((d) => {
        if (monte.current) setDetails(d as DisputeDetails);
      })
      .catch(() => {
        /* L'échec était silencieux : la modale retombait sur la ligne du
           tableau sans dire que le dossier complet manquait — donc sans
           photos d'état des lieux, sur un écran d'arbitrage. */
        if (monte.current) setErreurChargement(true);
      })
      .finally(() => {
        if (monte.current) setChargement(false);
      });
  }, [dispute?.id, isOpen]);

  const fermer = useCallback(() => {
    if (photoOuverte !== null) setPhotoOuverte(null);
    else onClose();
  }, [photoOuverte, onClose]);

  /* Ni Échap, ni verrou de scroll, ni fermeture au fond — sur une modale qui
     mène à une décision d'indemnisation. */
  useEffect(() => {
    if (!isOpen) return;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') fermer();
    };
    document.addEventListener('keydown', onKey);
    panneau.current?.focus();
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener('keydown', onKey);
    };
  }, [isOpen, fermer]);

  if (!isOpen || !dispute) return null;

  const data: DisputeDetails = details ?? dispute;
  const res = data.reservation;
  const photos: PhotoEtatLieu[] = res?.photosEtatLieu ?? [];
  const statut = STATUTS[data.statut] ?? STATUTS.EN_ATTENTE;
  const StatutIcon = statut.Icon;
  const parLocataire = data.declarePar === 'LOCATAIRE';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-overlay p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panneau}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${baseId}-titre`}
        tabIndex={-1}
        className="no-scrollbar max-h-[90vh] w-full max-w-4xl space-y-5 overflow-y-auto rounded-card border border-border bg-background-card p-6 shadow-xl focus-visible:outline-none"
      >
        {/* ── En-tête ────────────────────────────────────────────────────── */}
        <header className="flex items-start justify-between gap-3 border-b border-border pb-4">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-inner bg-forest-50 text-forest-700">
              <Scale className="h-5 w-5" aria-hidden />
            </span>
            <div className="min-w-0">
              <h2
                id={`${baseId}-titre`}
                className="font-display text-lg font-semibold leading-snug text-foreground"
              >
                {MOTIFS[data.motif] ?? data.motif}
              </h2>
              <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-foreground-muted">
                <Calendar className="h-3.5 w-3.5 shrink-0" aria-hidden />
                Déclaré par {parLocataire ? 'le locataire' : 'l’hôte'} le {fmtDate(data.creeLe)}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-pill border border-border text-foreground-muted transition-colors hover:bg-background-alt hover:text-foreground"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </header>

        {chargement ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-7 w-7 animate-spin text-forest-600" aria-hidden />
            <span className="sr-only">Chargement du dossier</span>
          </div>
        ) : (
          <>
            {erreurChargement && (
              <p
                role="alert"
                className="flex items-start gap-2 rounded-inner bg-error-50 px-3.5 py-2.5 text-xs text-error-700"
              >
                <AlertTriangle className="mt-px h-4 w-4 shrink-0" aria-hidden />
                Le dossier complet n’a pas pu être chargé. Les photos d’état des lieux et le détail
                du paiement ne sont pas affichés — ils ne sont pas absents pour autant. Rouvrez la
                fiche avant d’arbitrer.
              </p>
            )}

            {/* ── Statut et enjeu ─────────────────────────────────────────
                `coutEstime` et `montantCompensation` étaient dans le type sans
                jamais apparaître — sur l'écran qui mène à la décision, la somme
                en jeu était la donnée manquante. */}
            <div className={cn('space-y-3 rounded-inner p-4', statut.panneau)}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="eyebrow text-[0.6875rem]">Statut</span>
                <span
                  className={cn(
                    'inline-flex items-center gap-1 rounded-pill border px-2.5 py-1 text-xs font-semibold',
                    statut.badge,
                  )}
                >
                  <StatutIcon className="h-3.5 w-3.5" aria-hidden />
                  {statut.label}
                </span>
              </div>

              <dl className="grid grid-cols-2 gap-3 border-t border-border pt-3 text-xs">
                <div>
                  <dt className="text-foreground-muted">Montant réclamé</dt>
                  <dd className="mt-0.5 font-display text-base font-semibold tabular-nums text-foreground">
                    {fmtMontant(data.coutEstime)}
                  </dd>
                </div>
                <div>
                  <dt className="text-foreground-muted">Compensation accordée</dt>
                  <dd
                    className={cn(
                      'mt-0.5 font-display text-base font-semibold tabular-nums',
                      data.montantCompensation == null ? 'text-foreground-muted' : 'text-foreground',
                    )}
                  >
                    {fmtMontant(data.montantCompensation)}
                  </dd>
                </div>
              </dl>

              {data.decisionAdmin && (
                <div className="border-t border-border pt-3">
                  <p className="eyebrow text-[0.6875rem]">Décision</p>
                  <p className="mt-1 whitespace-pre-line text-xs leading-relaxed text-foreground">
                    {data.decisionAdmin}
                  </p>
                  {data.resoluLe && (
                    <p className="mt-1 text-xs text-foreground-muted">
                      Close le {fmtDate(data.resoluLe)}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* ── Faits déclarés ─────────────────────────────────────────── */}
            <Bloc icon={FileText} titre="Faits déclarés" className="bg-background-alt">
              <p className="whitespace-pre-line text-sm leading-relaxed text-foreground">
                {data.description || '—'}
              </p>
            </Bloc>

            {/* ── Parties ────────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {([
                { cle: 'loc', role: 'Locataire', personne: res?.locataire, plaignant: parLocataire },
                { cle: 'prop', role: 'Hôte', personne: res?.proprietaire, plaignant: !parLocataire },
              ]).map(({ cle, role, personne, plaignant }) => (
                <Bloc key={cle} icon={User} titre={role}>
                  {plaignant && (
                    <span className="inline-flex rounded-pill border border-warning-500/25 bg-warning-50 px-2 py-0.5 text-xs font-medium text-warning-700">
                      Déclarant
                    </span>
                  )}
                  {/* `{prenom} {nom}` rendait un espace seul quand les deux
                      champs manquaient. */}
                  <p className="text-sm font-semibold text-foreground">{nomComplet(personne)}</p>
                  {personne?.email && (
                    <p className="truncate text-xs text-foreground-muted">{personne.email}</p>
                  )}
                  {personne?.telephone && (
                    <a
                      href={`tel:${personne.telephone.replace(/\s/g, '')}`}
                      className="text-xs tabular-nums text-link hover:underline"
                    >
                      {personne.telephone}
                    </a>
                  )}
                </Bloc>
              ))}
            </div>

            {/* ── Logement et paiement ───────────────────────────────────── */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Bloc icon={MapPin} titre="Logement">
                <p className="text-sm font-semibold text-foreground">
                  {res?.logement?.titre ?? '—'}
                </p>
                <p className="text-xs text-foreground-muted">{res?.logement?.ville ?? '—'}</p>
                {res?.dateDebut && res?.dateFin && (
                  <p className="text-xs tabular-nums text-foreground-muted">
                    Séjour du {fmtDate(res.dateDebut)} au {fmtDate(res.dateFin)}
                  </p>
                )}
              </Bloc>

              <Bloc icon={CreditCard} titre="Paiement">
                <p className="text-sm font-semibold tabular-nums text-foreground">
                  {fmtMontant(res?.totalLocataire ?? res?.paiement?.montant)}
                </p>
                <p className="text-xs text-foreground-muted">
                  {res?.paiement?.statut
                    ? `Paiement ${res.paiement.statut.toLowerCase()}${res.paiement.fournisseur ? ` · ${res.paiement.fournisseur}` : ''
                    }`
                    : 'Statut de paiement indisponible'}
                </p>
              </Bloc>
            </div>

            {/* ── Preuves ──────────────────────────────────────────────────
                Les photos étaient en `object-cover` avec un zoom au survol :
                une preuve d'état des lieux recadrée perd justement le détail
                qu'elle est censée montrer, et l'animation déplace ce qu'on
                essaie de regarder. Vignettes en `object-contain`, clic pour
                ouvrir en pleine résolution avec zoom et rotation. */}
            <section className="space-y-2">
              <h3 className="eyebrow flex items-center gap-1.5 text-[0.6875rem]">
                <Camera className="h-3.5 w-3.5" aria-hidden />
                État des lieux
                {photos.length > 0 && <span className="tabular-nums">· {photos.length}</span>}
              </h3>

              {photos.length === 0 ? (
                <p
                  className={cn(
                    'rounded-inner px-3.5 py-2.5 text-xs',
                    erreurChargement
                      ? 'bg-background-alt text-foreground-muted'
                      : 'bg-warning-50 text-warning-700',
                  )}
                >
                  {erreurChargement
                    ? 'Photos non chargées.'
                    : 'Aucune photo d’état des lieux — l’arbitrage repose uniquement sur les déclarations.'}
                </p>
              ) : (
                <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {photos.map((p, i) => (
                    <li key={p.id}>
                      <button
                        type="button"
                        onClick={() => setPhotoOuverte(i)}
                        aria-label={`Agrandir la photo ${i + 1}${p.type ? ` — ${p.type}` : ''}`}
                        className="relative block h-28 w-full overflow-hidden rounded-inner border border-border bg-forest-950 transition-colors hover:border-forest-500"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={p.url}
                          alt=""
                          loading="lazy"
                          className="h-full w-full object-contain"
                        />
                        {p.type && (
                          <span className="glass-dark absolute bottom-1 left-1 rounded-pill px-2 py-0.5 text-xs font-medium">
                            {p.type}
                          </span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}

        {/* ── Actions ──────────────────────────────────────────────────── */}
        <footer className="flex items-center justify-end gap-3 border-t border-border pt-4">
          <button type="button" onClick={onClose} className="btn-ghost h-9 px-4 text-xs">
            Fermer
          </button>

          {data.statut === 'EN_ATTENTE' && !chargement && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onResolve(dispute);
              }}
              className="btn-primary h-9 px-5 text-xs"
            >
              <Scale className="h-4 w-4" aria-hidden />
              Rendre une décision
            </button>
          )}
        </footer>
      </div>

      {/* ── Visionneuse plein écran ──────────────────────────────────────── */}
      {photoOuverte !== null && photos[photoOuverte] && (
        <div
          className="fixed inset-0 z-60 flex flex-col gap-3 bg-overlay p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setPhotoOuverte(null);
          }}
        >
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold text-neutral-50">
              Photo <span className="tabular-nums">{photoOuverte + 1}</span> sur{' '}
              <span className="tabular-nums">{photos.length}</span>
              {photos[photoOuverte].type ? ` · ${photos[photoOuverte].type}` : ''}
            </p>
            <button
              type="button"
              onClick={() => setPhotoOuverte(null)}
              aria-label="Fermer la photo"
              className="flex h-9 w-9 items-center justify-center rounded-pill border border-border-inverse-strong text-neutral-50 transition-colors hover:bg-neutral-0/10"
            >
              <X className="h-5 w-5" aria-hidden />
            </button>
          </div>

          <div className="flex min-h-0 flex-1 items-center gap-3">
            {photos.length > 1 && (
              <button
                type="button"
                onClick={() => setPhotoOuverte((i) => ((i ?? 0) - 1 + photos.length) % photos.length)}
                aria-label="Photo précédente"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-pill border border-border-inverse-strong text-neutral-50 transition-colors hover:bg-neutral-0/10"
              >
                <ChevronLeft className="h-5 w-5" aria-hidden />
              </button>
            )}

            <DocumentViewer
              src={photos[photoOuverte].url}
              alt={`État des lieux, photo ${photoOuverte + 1}`}
              className="min-h-0 flex-1 self-stretch"
            />

            {photos.length > 1 && (
              <button
                type="button"
                onClick={() => setPhotoOuverte((i) => ((i ?? 0) + 1) % photos.length)}
                aria-label="Photo suivante"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-pill border border-border-inverse-strong text-neutral-50 transition-colors hover:bg-neutral-0/10"
              >
                <ChevronRight className="h-5 w-5" aria-hidden />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}