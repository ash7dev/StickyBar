'use client';

import {
  useCallback, useEffect, useId, useMemo, useRef, useState,
} from 'react';
import Image from 'next/image';
import {
  Shield, AlertTriangle, CheckCircle2, Camera, X, Users, Gavel, ChevronDown,
  Loader2, Clock, RefreshCw, LogIn, LogOut, ArrowRight, Banknote, Lock,
  HelpCircle, Star, UserX, XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { nestFetch } from '@/lib/nestjs/api-client';
import { NEST_API } from '@/lib/nestjs/endpoints';
import type { ReservationDetail } from '@/lib/nestjs/types';
import { CheckinModal, CheckoutModal } from './EtatLieuxModal';

/* ═══════════════════════════════════════════════════════════════════════════
   CONSTANTES MÉTIER
   ═══════════════════════════════════════════════════════════════════════════ */

const CHECKIN_GUARD_MS = 4 * 60 * 60 * 1000;   // fenêtre d'ouverture du check-in
const NOSHOW_DELAY_MS = 2 * 60 * 60 * 1000;    // délai avant signalement d'absence
const MOTIF_MIN = 15;
const TOTAL_STEPS = 5;

const PENALITES = { early: 0, mid: 2_500, late: 10_000 } as const;

const MOTIFS_LITIGE = [
  { value: 'LOGEMENT_NON_CONFORME', label: 'Logement non conforme à l’annonce' },
  { value: 'DEGRADATION', label: 'Dégradation du logement' },
  { value: 'NON_PAIEMENT', label: 'Non-paiement de frais supplémentaires' },
  { value: 'DEPASSEMENT_PERSONNES', label: 'Dépassement du nombre de personnes' },
  { value: 'NUISANCES', label: 'Nuisances ou comportement inapproprié' },
  { value: 'AUTRE', label: 'Autre motif' },
] as const;

const labelMotif = (motif: string) =>
  MOTIFS_LITIGE.find((m) => m.value === motif)?.label ?? motif.replace(/_/g, ' ');

const formatDateTime = (value: string | number | Date) =>
  new Date(value).toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
  });

/* ═══════════════════════════════════════════════════════════════════════════
   TONALITÉS — classes complètes, jamais interpolées
   ═══════════════════════════════════════════════════════════════════════════ */

type Tone = 'neutral' | 'forest' | 'success' | 'warning' | 'error';

const TONE: Record<Tone, { box: string; icon: string; title: string; body: string }> = {
  neutral: {
    box: 'bg-background-alt border-border',
    icon: 'bg-background-card border-border text-foreground-muted',
    title: 'text-foreground',
    body: 'text-foreground-muted',
  },
  forest: {
    box: 'bg-forest-50 border-forest-100',
    icon: 'bg-forest-100 border-forest-200 text-forest-700',
    title: 'text-forest-900',
    body: 'text-forest-800',
  },
  success: {
    box: 'bg-success-50 border-success-500/25',
    icon: 'bg-success-50 border-success-500/30 text-success-600',
    title: 'text-success-700',
    body: 'text-success-700',
  },
  warning: {
    box: 'bg-warning-50 border-warning-500/25',
    icon: 'bg-warning-50 border-warning-500/30 text-warning-600',
    title: 'text-warning-700',
    body: 'text-warning-700',
  },
  error: {
    box: 'bg-error-50 border-error-500/20',
    icon: 'bg-error-50 border-error-500/25 text-error-600',
    title: 'text-error-700',
    body: 'text-error-700',
  },
};

/* ═══════════════════════════════════════════════════════════════════════════
   HORLOGE VIVANTE
   ───────────────────────────────────────────────────────────────────────────
   La version précédente figeait `Date.now()` au montage. Ce panneau reste
   ouvert longtemps : le propriétaire qui attend l'ouverture de la fenêtre de
   check-in (4 h avant l'arrivée) ne voyait jamais le bouton se débloquer, et
   le signalement d'absence n'apparaissait jamais, sans rechargement manuel.
   ═══════════════════════════════════════════════════════════════════════════ */

function useNow(intervalMs = 30_000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);
  return now;
}

/* ═══════════════════════════════════════════════════════════════════════════
   MODALE ACCESSIBLE — Échap, piège à focus, verrou de scroll
   ═══════════════════════════════════════════════════════════════════════════ */

function Modal({
  title, children, onClose, dismissible = true,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  dismissible?: boolean;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const titleId = useId();

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && dismissible) { onClose(); return; }
      if (e.key !== 'Tab') return;
      const items = panelRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href]',
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
  }, [onClose, dismissible]);

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-forest-950/75 p-3 backdrop-blur-sm sm:p-4"
      onClick={() => dismissible && onClose()}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-border bg-background-card shadow-2xl transition-all"
      >
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-5 py-4 sm:px-6 sm:py-5">
          <h2 id={titleId} className="font-display text-base font-semibold text-foreground">
            {title}
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-pill border border-border text-foreground-muted transition-colors hover:bg-background-alt hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   BRIQUES PARTAGÉES
   ═══════════════════════════════════════════════════════════════════════════ */

function Feedback({ type, message }: { type: 'error' | 'success'; message: string }) {
  const tone = TONE[type === 'error' ? 'error' : 'success'];
  const Icon = type === 'error' ? AlertTriangle : CheckCircle2;
  return (
    <div role={type === 'error' ? 'alert' : 'status'} className={cn('flex items-start gap-2.5 rounded-inner border p-3.5', tone.box)}>
      <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', tone.title)} aria-hidden="true" />
      <p className={cn('text-xs leading-relaxed', tone.body)}>{message}</p>
    </div>
  );
}

function Notice({
  tone = 'neutral', icon: Icon, title, children,
}: {
  tone?: Tone;
  icon: typeof Clock;
  title: string;
  children?: React.ReactNode;
}) {
  const t = TONE[tone];
  return (
    <div className={cn('flex items-start gap-3 rounded-inner border p-4', t.box)}>
      <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-inner border', t.icon)}>
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className={cn('text-xs font-semibold', t.title)}>{title}</p>
        {children && (
          <div className={cn('mt-1 text-xs leading-relaxed', t.body)}>{children}</div>
        )}
      </div>
    </div>
  );
}

/** Grande carte d'action (démarrer un état des lieux). */
function ActionCard({
  icon: Icon, title, description, onClick, tone,
}: {
  icon: typeof Camera;
  title: string;
  description: string;
  onClick: () => void;
  tone: 'success' | 'warning';
}) {
  const accent = tone === 'success'
    ? { bar: 'bg-success-600', box: 'bg-success-50 border-success-500/30 text-success-600', ring: 'hover:border-success-500/50' }
    : { bar: 'bg-warning-600', box: 'bg-warning-50 border-warning-500/30 text-warning-600', ring: 'hover:border-warning-500/50' };

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group relative flex w-full items-center gap-4 overflow-hidden rounded-card border border-border bg-background-card p-4 text-left transition-[border-color,box-shadow] duration-200 hover:shadow-md',
        accent.ring,
      )}
    >
      <span aria-hidden="true" className={cn('absolute inset-y-0 left-0 w-1', accent.bar)} />
      <span className={cn('ml-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-inner border', accent.box)}>
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold leading-tight text-foreground">{title}</span>
        <span className="mt-0.5 block text-xs text-foreground-muted">{description}</span>
      </span>
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-pill bg-background-alt text-foreground-muted transition-colors group-hover:text-foreground">
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </span>
    </button>
  );
}

/** Accordéon « dépassement voyageurs » — était copié à l'identique 3 fois. */
function DepassementAccordion({
  nbPersonnes, open, onToggle, onSignal,
}: {
  nbPersonnes: number;
  open: boolean;
  onToggle: () => void;
  onSignal: () => void;
}) {
  return (
    <div className="overflow-hidden rounded-card border border-warning-500/25 bg-warning-50/50">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors hover:bg-warning-50"
      >
        <span className="flex min-w-0 items-center gap-2.5">
          <Users className="h-4 w-4 shrink-0 text-warning-600" aria-hidden="true" />
          <span className="text-xs font-semibold text-warning-700">
            Plus de voyageurs que prévu ?
          </span>
        </span>
        <ChevronDown
          className={cn('h-4 w-4 shrink-0 text-warning-600 transition-transform duration-200', open && 'rotate-180')}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div className="space-y-3 border-t border-warning-500/20 px-4 pt-3 pb-4">
          <p className="text-xs leading-relaxed text-warning-700">
            {nbPersonnes} voyageur{nbPersonnes > 1 ? 's' : ''} {nbPersonnes > 1 ? 'sont' : 'est'} déclaré
            {nbPersonnes > 1 ? 's' : ''} sur cette réservation. Si le groupe est plus nombreux,
            signalez-le maintenant pour régulariser la situation.
          </p>
          <button
            type="button"
            onClick={onSignal}
            className="inline-flex items-center gap-2 rounded-pill border border-error-500/25 px-4 py-2.5 text-xs font-semibold text-error-600 transition-colors hover:bg-error-50"
          >
            <Gavel className="h-3.5 w-3.5" aria-hidden="true" />
            Signaler le dépassement
          </button>
        </div>
      )}
    </div>
  );
}

/** Signalement d'absence — était copié à l'identique 3 fois. */
function NoShowCta({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-card border border-error-500/20 bg-error-50/50 px-4 py-3.5 text-left transition-colors hover:bg-error-50"
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-inner border border-error-500/25 bg-error-50 text-error-600">
        <UserX className="h-4 w-4" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-semibold text-error-700">
          Le locataire ne s’est pas présenté ?
        </span>
        <span className="mt-0.5 block text-xs text-error-600">
          Signalez son absence pour déclencher une annulation automatique
        </span>
      </span>
    </button>
  );
}

/** Panneau litige — ~150 lignes qui existaient en double dans le fichier. */
function LitigePanel({ litige }: { litige: NonNullable<ReservationDetail['litige']> }) {
  const statutTone: Record<string, Tone> = {
    EN_ATTENTE: 'warning',
    FONDE: 'error',
    NON_FONDE: 'success',
  };
  const tone = TONE[statutTone[litige.statut] ?? 'neutral'];

  const StatutIcon =
    litige.statut === 'EN_ATTENTE' ? Clock : litige.statut === 'FONDE' ? CheckCircle2 : XCircle;
  const statutLabel =
    litige.statut === 'EN_ATTENTE' ? 'En cours d’examen'
      : litige.statut === 'FONDE' ? 'Litige fondé'
        : 'Litige non fondé';

  return (
    <div className="space-y-3">
      <Notice tone="error" icon={Gavel} title="Litige ouvert">
        Les fonds restent gelés jusqu’à résolution par l’équipe support de Klef.
      </Notice>

      <div className="space-y-4 rounded-card border border-border bg-background-card p-4">
        <Field label="Motif">
          <p className="text-xs font-semibold text-foreground">{labelMotif(litige.motif)}</p>
        </Field>

        <Field label="Description">
          <p className="rounded-inner border border-border bg-background-alt p-2.5 text-xs leading-relaxed text-foreground">
            {litige.description}
          </p>
        </Field>

        <Field label="Statut actuel">
          <span className={cn('inline-flex items-center gap-1.5 rounded-pill border px-3 py-1.5 text-xs font-semibold', tone.box, tone.title)}>
            <StatutIcon className="h-3 w-3" aria-hidden="true" />
            {statutLabel}
          </span>
        </Field>

        <Field label="Ouvert le">
          <p className="text-xs text-foreground-muted">{formatDateTime(litige.creeLe)}</p>
        </Field>

        {litige.statut === 'EN_ATTENTE' && (
          <>
            <Notice tone="warning" icon={Clock} title="Délai de traitement : 48 à 72 h">
              L’équipe support examine le dossier et vous contacte par e-mail ou téléphone.
            </Notice>

            <Field label="Issues possibles">
              <ul className="space-y-1.5">
                {[
                  ['Litige fondé', 'pénalité appliquée au locataire, compensation versée'],
                  ['Litige non fondé', 'fonds débloqués normalement, aucune pénalité'],
                  ['Arrangement à l’amiable', 'médiation entre les parties'],
                ].map(([titre, detail]) => (
                  <li key={titre} className="flex items-start gap-2 text-xs text-foreground-muted">
                    <span aria-hidden="true" className="mt-1.5 h-1 w-1 shrink-0 rounded-pill bg-border-hover" />
                    <span className="leading-relaxed">
                      <span className="font-semibold text-foreground">{titre}</span> : {detail}
                    </span>
                  </li>
                ))}
              </ul>
            </Field>
          </>
        )}

        {litige.statut === 'FONDE' && (
          <Notice tone="error" icon={CheckCircle2} title="Litige fondé">
            Une pénalité a été appliquée au locataire. Une compensation peut vous être versée
            selon l’évaluation des dommages.
          </Notice>
        )}

        {litige.statut === 'NON_FONDE' && (
          <Notice tone="success" icon={XCircle} title="Litige non fondé">
            Les fonds seront débloqués normalement après le check-out. Aucune pénalité n’est
            appliquée.
          </Notice>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-foreground-muted">
        {label}
      </p>
      {children}
    </div>
  );
}

function PrimaryButton({
  onClick, disabled, loading, loadingLabel, icon: Icon, children,
}: {
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  loadingLabel: string;
  icon?: typeof CheckCircle2;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className="flex w-full items-center justify-center gap-2.5 rounded-pill bg-action py-3.5 text-sm font-semibold text-on-action shadow-action transition-[background-color,box-shadow,transform] duration-200 hover:bg-action-hover hover:shadow-action-hover active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-background-alt disabled:text-foreground-muted disabled:shadow-none"
    >
      {loading ? (
        <><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />{loadingLabel}</>
      ) : (
        <>{Icon && <Icon className="h-4 w-4" aria-hidden="true" />}{children}</>
      )}
    </button>
  );
}

function GhostButton({
  onClick, disabled, children, className,
}: {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-pill border border-neutral-300 bg-background-alt px-4 py-2.5 text-xs font-semibold text-foreground shadow-2xs transition-[border-color,background-color,box-shadow,transform] duration-150 hover:border-forest-600/40 hover:bg-background-card hover:shadow-xs active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none',
        className,
      )}
    >
      {children}
    </button>
  );
}

function DangerButton({
  onClick, disabled, loading, loadingLabel, icon: Icon, children, className,
}: {
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  loadingLabel?: string;
  icon?: typeof X;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-pill bg-error-600 px-4 py-2.5 text-xs font-semibold text-neutral-0 transition-colors hover:bg-error-700 disabled:cursor-not-allowed disabled:bg-background-alt disabled:text-foreground-faint',
        className,
      )}
    >
      {loading ? (
        <><Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />{loadingLabel ?? 'En cours…'}</>
      ) : (
        <>{Icon && <Icon className="h-3.5 w-3.5" aria-hidden="true" />}{children}</>
      )}
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   CONFIGURATION PAR STATUT
   ═══════════════════════════════════════════════════════════════════════════ */

const STEP_CONFIG = {
  PENDING: {
    step: 1, icon: Clock, accent: 'bg-border',
    chip: 'bg-background-alt text-foreground-muted border-border',
    iconBox: 'bg-background-alt border-border text-foreground-muted',
    label: 'En attente', sub: 'En attente du paiement du locataire',
  },
  PAID: {
    step: 2, icon: Shield, accent: 'bg-gold-400',
    chip: 'bg-gold-50 text-gold-700 border-gold-200',
    iconBox: 'bg-gold-50 border-gold-200 text-gold-700',
    label: 'Décision requise', sub: 'Paiement reçu — acceptez ou refusez',
  },
  CONFIRMED: {
    step: 3, icon: LogIn, accent: 'bg-forest-600',
    chip: 'bg-forest-50 text-forest-700 border-forest-100',
    iconBox: 'bg-forest-50 border-forest-100 text-forest-700',
    label: 'Check-in', sub: 'État des lieux d’entrée',
  },
  CHECKED_IN: {
    step: 4, icon: LogOut, accent: 'bg-warning-500',
    chip: 'bg-warning-50 text-warning-700 border-warning-500/25',
    iconBox: 'bg-warning-50 border-warning-500/25 text-warning-700',
    label: 'Check-out', sub: 'Clôture du séjour',
  },
  COMPLETED: {
    step: 5, icon: CheckCircle2, accent: 'bg-forest-600',
    chip: 'bg-forest-50 text-forest-700 border-forest-100',
    iconBox: 'bg-forest-50 border-forest-100 text-forest-700',
    label: 'Terminée', sub: 'Séjour terminé',
  },
  DISPUTED: {
    step: null, icon: AlertTriangle, accent: 'bg-error-500',
    chip: 'bg-error-50 text-error-700 border-error-500/20',
    iconBox: 'bg-error-50 border-error-500/20 text-error-600',
    label: 'Litige en cours', sub: 'En attente de résolution',
  },
} as const;

type Statut = keyof typeof STEP_CONFIG;

/* ═══════════════════════════════════════════════════════════════════════════
   COMPOSANT PRINCIPAL
   ═══════════════════════════════════════════════════════════════════════════ */

interface Props {
  id: string;
  res: ReservationDetail;
  onRefetch: () => void;
}

export function ReservationActionPanel({ id, res, onRefetch }: Props) {
  const { statut, dateDebut, nbPersonnes, photosEtatLieu } = res;

  const now = useNow();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const [showLitigeModal, setShowLitigeModal] = useState(false);
  const [litigeMotif, setLitigeMotif] = useState('');
  const [litigeDescription, setLitigeDescription] = useState('');

  const [showDepassement, setShowDepassement] = useState(false);
  const [showCheckinModal, setShowCheckinModal] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [showNoshowModal, setShowNoshowModal] = useState(false);

  const [checkinHeure, setCheckinHeure] = useState('14:00');
  const [checkoutHeureInput, setCheckoutHeureInput] = useState('12:00');
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [noshowComment, setNoshowComment] = useState('');

  /* ── Données dérivées ─────────────────────────────────────────────────── */

  const checkinPhotos = useMemo(
    () => photosEtatLieu.filter((p) => p.type === 'CHECKIN'), [photosEtatLieu],
  );
  const checkoutPhotos = useMemo(
    () => photosEtatLieu.filter((p) => p.type === 'CHECKOUT'), [photosEtatLieu],
  );

  const debutMs = new Date(dateDebut).getTime();
  const checkinWindowStart = debutMs - CHECKIN_GUARD_MS;
  const canStartCheckin = now >= checkinWindowStart;
  const hoursUntilCheckin = Math.max(1, Math.ceil((checkinWindowStart - now) / 3_600_000));
  const canSignalNoshow = now - debutMs >= NOSHOW_DELAY_MS;

  const finMs = new Date(res.dateFin).getTime();
  const checkoutWindowStart = finMs - CHECKIN_GUARD_MS;
  const canStartCheckout = now >= checkoutWindowStart;
  const hoursUntilCheckout = Math.max(1, Math.ceil((checkoutWindowStart - now) / 3_600_000));

  const absenceMs = res.absenceSignaleeLe ? new Date(res.absenceSignaleeLe).getTime() : 0;
  const isAbsenceActive =
    !!res.absenceSignaleeLe &&
    statut === 'CONFIRMED' &&
    !res.checkinProprioLe &&
    now - absenceMs < 2 * 60 * 60 * 1000;

  const daysToCheckin = (debutMs - now) / 86_400_000;
  const penaliteOwner =
    daysToCheckin > 5 ? PENALITES.early : daysToCheckin >= 1 ? PENALITES.mid : PENALITES.late;

  const ownerCheckinDone = !!res.checkinProprioLe;
  const ownerCheckoutDone = !!res.checkoutProprioLe;

  const confirmedSub = ownerCheckinDone
    ? 'waiting-tenant'
    : checkinPhotos.length > 0
      ? 'photos-uploaded'
      : canStartCheckin ? 'ready' : 'locked';

  const checkedInSub = !canStartCheckout
    ? 'locked'
    : ownerCheckoutDone
      ? 'awaiting-completion'
      : checkoutPhotos.length > 0 ? 'photos-uploaded' : 'ready';

  /* ── Helpers ──────────────────────────────────────────────────────────── */

  const clearFeedback = useCallback(() => {
    setErrorMsg(null);
    setSuccessMsg(null);
  }, []);

  const run = useCallback(async (fn: () => Promise<void>, success: string) => {
    clearFeedback();
    setIsSubmitting(true);
    try {
      await fn();
      setSuccessMsg(success);
      onRefetch();
    } catch (e) {
      setErrorMsg(e instanceof Error && e.message ? e.message : 'Une erreur est survenue.');
    } finally {
      setIsSubmitting(false);
    }
  }, [clearFeedback, onRefetch]);

  /* Le message de succès disparaît seul : il restait affiché indéfiniment
     et se retrouvait à côté d'une erreur ultérieure sans contexte. */
  useEffect(() => {
    if (!successMsg) return;
    const timer = setTimeout(() => setSuccessMsg(null), 8_000);
    return () => clearTimeout(timer);
  }, [successMsg]);

  /* ── Handlers ─────────────────────────────────────────────────────────── */

  const handleConfirm = () => {
    if (!/^\d{2}:\d{2}$/.test(checkinHeure) || !/^\d{2}:\d{2}$/.test(checkoutHeureInput)) {
      setErrorMsg('Indiquez des heures de check-in et check-out valides (HH:mm).');
      return;
    }
    setShowTimeModal(false);
    run(async () => {
      await nestFetch(NEST_API.RESERVATIONS.CONFIRM(id), {
        method: 'PATCH',
        body: JSON.stringify({ heureDebut: checkinHeure, heureFin: checkoutHeureInput }),
      });
    }, 'Réservation confirmée.');
  };

  const handleCancel = () => {
    if (cancelReason.trim().length < MOTIF_MIN) {
      setErrorMsg(`Le motif doit contenir au moins ${MOTIF_MIN} caractères.`);
      return;
    }
    run(async () => {
      await nestFetch(NEST_API.RESERVATIONS.CANCEL(id), {
        method: 'PATCH',
        body: JSON.stringify({ raison: cancelReason.trim() }),
      });
      setShowCancelModal(false);
      setCancelReason('');
    }, 'Réservation annulée.');
  };

  const handleCheckinProprio = () => run(async () => {
    await nestFetch(NEST_API.RESERVATIONS.CHECKIN_PROPRIO(id), { method: 'POST' });
  }, 'Check-in confirmé. Le locataire peut valider son arrivée.');

  const handleCheckoutProprio = () => run(async () => {
    await nestFetch(NEST_API.RESERVATIONS.CHECKOUT_PROPRIO(id), { method: 'POST' });
  }, 'État des lieux de sortie confirmé. Vous pouvez clôturer la réservation.');

  const handleCompleteCheckout = () => run(async () => {
    await nestFetch(NEST_API.RESERVATIONS.COMPLETE_CHECKOUT(id), { method: 'PATCH' });
  }, 'Réservation clôturée avec succès.');

  const handleOpenLitige = () => {
    if (!litigeMotif || litigeDescription.trim().length < MOTIF_MIN) {
      setErrorMsg(`Sélectionnez un motif et décrivez le problème (${MOTIF_MIN} caractères minimum).`);
      return;
    }
    run(async () => {
      await nestFetch(NEST_API.DISPUTES.CREATE, {
        method: 'POST',
        body: JSON.stringify({
          reservationId: id,
          motif: litigeMotif,
          description: litigeDescription.trim(),
        }),
      });
      setShowLitigeModal(false);
      setLitigeMotif('');
      setLitigeDescription('');
    }, 'Litige ouvert. L’équipe support vous contacte sous 48 h.');
  };

  const handleSubmitRating = () => {
    if (rating === 0) {
      setErrorMsg('Sélectionnez une note de 1 à 5 étoiles.');
      return;
    }
    run(async () => {
      await nestFetch(NEST_API.RESERVATIONS.RATE_TENANT(id), {
        method: 'POST',
        body: JSON.stringify({ note: rating, commentaire: ratingComment.trim() || undefined }),
      });
      setRating(0);
      setRatingComment('');
    }, 'Votre évaluation a été publiée.');
  };

  const handleSignalNoshow = () => run(async () => {
    await nestFetch(NEST_API.RESERVATIONS.SIGNAL_NOSHOW(id), {
      method: 'POST',
      body: JSON.stringify({ commentaire: noshowComment.trim() || undefined }),
    });
    setShowNoshowModal(false);
    setNoshowComment('');
  }, 'Absence signalée. La réservation sera annulée si le locataire ne se présente pas sous 3 h.');

  const handleReopenLateCheckin = () => run(async () => {
    await nestFetch(NEST_API.RESERVATIONS.REOPEN_LATE_CHECKIN(id), { method: 'POST' });
  }, 'Réservation ré-ouverte pour un check-in tardif.');

  const openLitigeDepassement = () => {
    setShowDepassement(false);
    clearFeedback();
    setLitigeMotif('DEPASSEMENT_PERSONNES');
    setShowLitigeModal(true);
  };

  /* ── Rendu ────────────────────────────────────────────────────────────── */

  if (!(statut in STEP_CONFIG)) return null;
  const step = STEP_CONFIG[statut as Statut];
  const StepIcon = step.icon;

  const sideActions = !res.litige && (
    <>
      <DepassementAccordion
        nbPersonnes={nbPersonnes}
        open={showDepassement}
        onToggle={() => setShowDepassement((v) => !v)}
        onSignal={openLitigeDepassement}
      />
      {canSignalNoshow && <NoShowCta onClick={() => { clearFeedback(); setShowNoshowModal(true); }} />}
    </>
  );

  const tenantInitials =
    `${res.locataire.prenom?.[0] ?? ''}${res.locataire.nom?.[0] ?? ''}`.toUpperCase() || '?';

  return (
    <>
      <div className="overflow-hidden rounded-card border border-border bg-background-card shadow-sm">

        <div className={cn('h-1 w-full', step.accent)} />

        {/* ── En-tête ──────────────────────────────────────────────────── */}

        <div className="flex items-start gap-4 px-6 pt-5 pb-4">
          <span className={cn('mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-inner border', step.iconBox)}>
            <StepIcon className="h-4 w-4" aria-hidden="true" />
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-display text-base font-semibold leading-tight text-foreground">
                {step.label}
              </h2>
              {/* Le badge affichait « Étape 5/4 » sur COMPLETED et « Étape 0/4 »
                  sur DISPUTED : le total était figé à 4 pour 5 étapes, et le
                  litige n'est pas une étape du parcours. */}
              {step.step !== null && (
                <span className={cn('rounded-pill border px-2.5 py-0.5 text-xs font-semibold', step.chip)}>
                  Étape {step.step}/{TOTAL_STEPS}
                </span>
              )}
            </div>
            <p className="mt-0.5 text-xs text-foreground-muted">{step.sub}</p>
          </div>

          <button
            type="button"
            onClick={onRefetch}
            aria-label="Actualiser"
            className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-pill border border-border bg-background-alt text-forest-700 transition-colors hover:bg-forest-50"
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>

        <div className="mx-6 h-px bg-border" />

        <div className="space-y-4 p-6">

          {errorMsg && <Feedback type="error" message={errorMsg} />}
          {successMsg && <Feedback type="success" message={successMsg} />}

          {isAbsenceActive && (
            <Notice tone="error" icon={AlertTriangle} title="⚠️ URGENT : Le locataire signale votre absence le jour J !">
              Le locataire a indiqué être sans nouvelles de vous pour l&apos;arrivée (signalé le{' '}
              <span className="font-semibold">{formatDateTime(res.absenceSignaleeLe!)}</span>). Vous disposez de 2h à compter du signalement pour réaliser l&apos;état des lieux ou contacter le locataire, sans quoi la réservation sera annulée avec remboursement à 100%.
            </Notice>
          )}

          {/* ══ PENDING ══ */}
          {statut === 'PENDING' && (
            <>
              <Notice tone="neutral" icon={Clock} title="En attente du paiement">
                Le locataire n’a pas encore finalisé le paiement. Vous serez notifié dès
                réception.
              </Notice>
              <div className="border-t border-border pt-4">
                <GhostButton onClick={() => { clearFeedback(); setShowCancelModal(true); }}>
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                  Annuler la demande
                </GhostButton>
              </div>
            </>
          )}

          {/* ══ PAID ══ */}
          {statut === 'PAID' && (
            <>
              {res.locataire.statutKyc === 'VERIFIE' ? (
                <Notice tone="success" icon={CheckCircle2} title="Identité vérifiée">
                  Vous pouvez confirmer la réservation en toute sécurité.
                </Notice>
              ) : (
                <Notice
                  tone="warning"
                  icon={AlertTriangle}
                  title={
                    res.locataire.statutKyc === 'EN_ATTENTE'
                      ? 'Identité en cours de validation'
                      : 'Identité non vérifiée'
                  }
                >
                  {res.locataire.statutKyc === 'EN_ATTENTE'
                    ? 'Les documents sont en cours de vérification par l’équipe Klef.'
                    : 'Le locataire n’a pas encore soumis ses documents d’identité.'}
                </Notice>
              )}

              <div className="flex items-center gap-2.5 rounded-inner border border-border bg-background-alt px-4 py-3">
                <Clock className="h-3.5 w-3.5 shrink-0 text-foreground-muted" aria-hidden="true" />
                <p className="text-xs text-foreground-muted">
                  Répondez avant le{' '}
                  <span className="font-semibold text-foreground">
                    {formatDateTime(res.delaiConfirmation)}
                  </span>
                </p>
              </div>

              <Notice tone="warning" icon={AlertTriangle} title="Annulation après confirmation">
                Une pénalité sera déduite de votre wallet selon le délai restant avant l’arrivée.
              </Notice>

              <div className="flex flex-col gap-3 pt-1 sm:flex-row">
                <GhostButton
                  onClick={() => { clearFeedback(); setShowCancelModal(true); }}
                  disabled={isSubmitting}
                  className="flex-1 py-3 text-sm"
                >
                  Refuser
                </GhostButton>
                <div className="flex-1">
                  <PrimaryButton
                    onClick={() => { clearFeedback(); setShowTimeModal(true); }}
                    disabled={res.locataire.statutKyc !== 'VERIFIE' || isSubmitting}
                    loadingLabel="Confirmation…"
                  >
                    Confirmer la réservation
                  </PrimaryButton>
                </div>
              </div>
            </>
          )}

          {/* ══ CONFIRMED ══ */}
          {statut === 'CONFIRMED' && (
            <>
              {confirmedSub === 'locked' && (
                <Notice
                  tone="neutral"
                  icon={Lock}
                  title={`État des lieux disponible dans ${hoursUntilCheckin} h`}
                >
                  L’état des lieux d’entrée ne peut démarrer que{' '}
                  <span className="font-semibold text-foreground">4 h avant l’arrivée</span>, pour
                  garantir des photos fidèles. Revenez le{' '}
                  <span className="font-semibold text-foreground">
                    {formatDateTime(checkinWindowStart)}
                  </span>.
                </Notice>
              )}

              {confirmedSub === 'ready' && (
                <ActionCard
                  icon={Camera}
                  tone="success"
                  title="Démarrer l’état des lieux d’entrée"
                  description="Photographiez chaque pièce avant l’arrivée du locataire"
                  onClick={() => { clearFeedback(); setShowCheckinModal(true); }}
                />
              )}

              {confirmedSub === 'photos-uploaded' && (
                <>
                  <Notice
                    tone="warning"
                    icon={Camera}
                    title={`${checkinPhotos.length} photo${checkinPhotos.length > 1 ? 's' : ''} enregistrée${checkinPhotos.length > 1 ? 's' : ''} — confirmation requise`}
                  >
                    Confirmez ci-dessous pour notifier le locataire et démarrer officiellement le
                    check-in.
                  </Notice>

                  <PrimaryButton
                    onClick={handleCheckinProprio}
                    loading={isSubmitting}
                    loadingLabel="Confirmation…"
                    icon={CheckCircle2}
                  >
                    Confirmer l’état des lieux d’entrée
                  </PrimaryButton>

                  <GhostButton
                    onClick={() => { clearFeedback(); setShowCheckinModal(true); }}
                    className="w-full"
                  >
                    Ajouter d’autres photos
                  </GhostButton>
                </>
              )}

              {confirmedSub === 'waiting-tenant' && (
                <Notice
                  tone="forest"
                  icon={CheckCircle2}
                  title={`${checkinPhotos.length} photo${checkinPhotos.length > 1 ? 's' : ''} de check-in confirmée${checkinPhotos.length > 1 ? 's' : ''}`}
                >
                  Le locataire a été notifié. Il doit confirmer son check-in depuis son espace.
                  Les fonds restent en séquestre jusqu’à sa validation.
                </Notice>
              )}

              {sideActions}

              <div className="border-t border-border pt-4">
                <button
                  type="button"
                  onClick={() => { clearFeedback(); setShowCancelModal(true); }}
                  className="inline-flex items-center gap-2 rounded-pill border border-error-300 bg-error-50 px-4 py-2.5 text-xs font-semibold text-error-700 shadow-2xs transition-[border-color,background-color,box-shadow,transform] hover:bg-error-100 hover:border-error-400 hover:shadow-xs active:scale-[0.98]"
                >
                  <X className="h-3.5 w-3.5 text-error-700" aria-hidden="true" />
                  Annuler la réservation
                </button>
              </div>
            </>
          )}

          {/* ══ CHECKED_IN ══ */}
          {statut === 'CHECKED_IN' && (
            <>
              {/* Notice spéciale si auto-checkin système */}
              {res.historique?.some((h) => h.modifiePar === 'SYSTEM_AUTO_CHECKIN') && (
                <Notice tone="forest" icon={CheckCircle2} title="⚡ Check-in validé automatiquement par le système (H+6)">
                  6 heures se sont écoulées après l'heure d'arrivée sans action ni litige. Le séjour a été activé automatiquement et votre portefeuille a été crédité du montant net de la réservation.
                </Notice>
              )}
              {checkedInSub === 'locked' && (
                <Notice
                  tone="neutral"
                  icon={Lock}
                  title={`Check-out et clôture disponibles dans ${hoursUntilCheckout} h`}
                >
                  L’état des lieux de sortie et la clôture du séjour ne peuvent être effectués qu’à la date de fin de la réservation, à partir du{' '}
                  <span className="font-semibold text-foreground">
                    {formatDateTime(checkoutWindowStart)}
                  </span>.
                </Notice>
              )}

              {checkedInSub === 'ready' && (
                <div className="space-y-4">
                  <ActionCard
                    icon={Camera}
                    tone="warning"
                    title="Démarrer l’état des lieux de sortie"
                    description="Photographiez le logement au départ du locataire (recommandé)"
                    onClick={() => { clearFeedback(); setShowCheckoutModal(true); }}
                  />

                  <div className="space-y-3 rounded-card border border-border bg-background-alt p-4">
                    <div>
                      <p className="text-xs font-semibold text-foreground">Clôture directe sans état des lieux</p>
                      <p className="mt-0.5 text-xs text-foreground-muted">
                        Si vous ne souhaitez pas effectuer d’état des lieux photographique, vous pouvez clôturer directement le séjour.
                      </p>
                    </div>

                    <PrimaryButton
                      onClick={handleCompleteCheckout}
                      loading={isSubmitting}
                      loadingLabel="Clôture en cours…"
                      icon={CheckCircle2}
                    >
                      Clôturer la réservation
                    </PrimaryButton>
                  </div>
                </div>
              )}

              {checkedInSub === 'photos-uploaded' && (
                <>
                  <Notice
                    tone="warning"
                    icon={Camera}
                    title={`${checkoutPhotos.length} photo${checkoutPhotos.length > 1 ? 's' : ''} de sortie — confirmation requise`}
                  >
                    Confirmez l’état des lieux de sortie pour pouvoir clôturer la réservation.
                  </Notice>

                  <PrimaryButton
                    onClick={handleCheckoutProprio}
                    loading={isSubmitting}
                    loadingLabel="Confirmation…"
                    icon={CheckCircle2}
                  >
                    Confirmer l’état des lieux de sortie
                  </PrimaryButton>

                  <div className="flex flex-col gap-2">
                    <GhostButton
                      onClick={() => { clearFeedback(); setShowCheckoutModal(true); }}
                      className="w-full"
                    >
                      Ajouter d’autres photos
                    </GhostButton>
                    <GhostButton
                      onClick={handleCompleteCheckout}
                      className="w-full text-forest-700"
                    >
                      Clôturer directement la réservation
                    </GhostButton>
                  </div>
                </>
              )}

              {checkedInSub === 'awaiting-completion' && (
                <>
                  <Notice
                    tone="forest"
                    icon={CheckCircle2}
                    title={`${checkoutPhotos.length} photo${checkoutPhotos.length > 1 ? 's' : ''} de check-out confirmée${checkoutPhotos.length > 1 ? 's' : ''}`}
                  >
                    État des lieux documenté. Vous pouvez maintenant clôturer la réservation.
                  </Notice>

                  <PrimaryButton
                    onClick={handleCompleteCheckout}
                    loading={isSubmitting}
                    loadingLabel="Clôture en cours…"
                    icon={CheckCircle2}
                  >
                    Clôturer la réservation
                  </PrimaryButton>
                </>
              )}

              <div className="space-y-3 border-t border-border pt-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
                  Problème pendant le séjour ?
                </p>

                {res.litige ? (
                  <LitigePanel litige={res.litige} />
                ) : (
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => { clearFeedback(); setShowLitigeModal(true); }}
                      className="inline-flex items-center justify-center gap-2 rounded-pill border border-error-200 bg-error-50 px-4 py-2.5 text-xs font-semibold text-error-700 shadow-2xs transition-[border-color,background-color,box-shadow,transform] duration-150 hover:border-error-300 hover:bg-error-100 hover:shadow-xs active:scale-[0.98]"
                    >
                      <Gavel className="h-3.5 w-3.5 text-error-600" aria-hidden="true" />
                      Ouvrir un litige
                    </button>
                    <button
                      type="button"
                      onClick={openLitigeDepassement}
                      className="inline-flex items-center justify-center gap-2 rounded-pill border border-warning-500/30 bg-warning-50 px-4 py-2.5 text-xs font-semibold text-warning-800 shadow-2xs transition-[border-color,background-color,box-shadow,transform] duration-150 hover:border-warning-500/50 hover:bg-warning-100 hover:shadow-xs active:scale-[0.98]"
                    >
                      <Users className="h-3.5 w-3.5 text-warning-700" aria-hidden="true" />
                      Dépassement voyageurs
                    </button>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ══ DISPUTED ══ */}
          {statut === 'DISPUTED' && res.litige && <LitigePanel litige={res.litige} />}

          {/* ══ COMPLETED ══ */}
          {statut === 'COMPLETED' && (
            <>
              <Notice tone="forest" icon={CheckCircle2} title="Séjour terminé">
                Les fonds ont été débloqués et transférés vers votre wallet.
              </Notice>

              {(res.politiqueAppliquee as string) === 'NO_SHOW_LOCATAIRE' && (
                <div className="space-y-2.5 rounded-card border border-warning-500/25 bg-warning-50 p-4">
                  <p className="text-xs font-semibold text-warning-700">
                    Le locataire est finalement arrivé avec du retard ?
                  </p>
                  <p className="text-xs leading-relaxed text-warning-700">
                    Vous pouvez ré-ouvrir la réservation pour lui remettre les clés, tout en
                    conservant vos fonds débloqués.
                  </p>
                  <button
                    type="button"
                    onClick={handleReopenLateCheckin}
                    disabled={isSubmitting}
                    className="flex w-full items-center justify-center gap-2 rounded-pill bg-warning-700 px-4 py-2.5 text-xs font-semibold text-neutral-0 transition-colors hover:bg-warning-600 disabled:opacity-50"
                  >
                    {isSubmitting
                      ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      : <RefreshCw className="h-4 w-4" aria-hidden="true" />}
                    Accueillir le voyageur (check-in tardif)
                  </button>
                </div>
              )}

              {/* ── Évaluation du locataire ─────────────────────────────── */}
              <div className="space-y-3 border-t border-border pt-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
                  Évaluer votre expérience
                </p>

                <div className="space-y-4 rounded-card border border-border bg-background-alt p-5">
                  <div className="flex items-start gap-3">
                    <span className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-inner bg-forest-800 text-xs font-semibold text-neutral-50">
                      {res.locataire.avatarUrl ? (
                        <Image
                          src={res.locataire.avatarUrl}
                          alt=""
                          fill
                          sizes="40px"
                          className="object-cover"
                        />
                      ) : tenantInitials}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground">
                        Noter {res.locataire.prenom} {res.locataire.nom}
                      </p>
                      <p className="mt-0.5 text-xs text-foreground-muted">
                        Comment s’est passé le séjour avec ce locataire ?
                      </p>
                    </div>
                  </div>

                  <div
                    role="radiogroup"
                    aria-label="Note du locataire"
                    className="flex items-center justify-center gap-2 rounded-inner border border-border bg-background-card py-4"
                    onMouseLeave={() => setHoverRating(0)}
                  >
                    {[1, 2, 3, 4, 5].map((star) => {
                      const active = (hoverRating || rating) >= star;
                      return (
                        <button
                          key={star}
                          type="button"
                          role="radio"
                          aria-checked={rating === star}
                          aria-label={`${star} étoile${star > 1 ? 's' : ''}`}
                          onClick={() => setRating(star)}
                          onMouseEnter={() => setHoverRating(star)}
                          onFocus={() => setHoverRating(star)}
                          onBlur={() => setHoverRating(0)}
                          className="rounded-pill transition-transform duration-150 hover:scale-110 active:scale-95"
                        >
                          <Star
                            className={cn(
                              'h-8 w-8 transition-colors duration-150',
                              active ? 'fill-gold-400 text-gold-400' : 'text-border-hover',
                            )}
                            aria-hidden="true"
                          />
                        </button>
                      );
                    })}
                  </div>

                  {rating > 0 && (
                    <p className="text-center text-xs font-semibold text-foreground" aria-live="polite">
                      {['Très insatisfait', 'Insatisfait', 'Moyen', 'Satisfait', 'Excellent'][rating - 1]}
                    </p>
                  )}

                  <div className="space-y-2">
                    <label htmlFor="rating-comment" className="block text-xs font-semibold text-foreground">
                      Commentaire{' '}
                      <span className="font-normal text-foreground-muted">(optionnel)</span>
                    </label>
                    <textarea
                      id="rating-comment"
                      rows={3}
                      value={ratingComment}
                      onChange={(e) => setRatingComment(e.target.value)}
                      placeholder="Partagez votre expérience avec ce locataire."
                      className="w-full resize-none rounded-field border border-border bg-background-card px-4 py-3 text-foreground placeholder:text-foreground-faint focus:border-forest-500 focus:outline-none"
                    />
                  </div>

                  <PrimaryButton
                    onClick={handleSubmitRating}
                    disabled={rating === 0}
                    loading={isSubmitting}
                    loadingLabel="Publication…"
                    icon={Star}
                  >
                    Publier mon évaluation
                  </PrimaryButton>

                  <p className="text-center text-xs leading-relaxed text-foreground-muted">
                    Votre évaluation aide les autres propriétaires à mieux connaître ce locataire.
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* ── Pied : règles ────────────────────────────────────────────── */}

        <div className="border-t border-border bg-background-alt px-6 py-4">
          <button
            type="button"
            onClick={() => setShowRulesModal(true)}
            className="inline-flex items-center gap-2 text-xs font-semibold text-forest-700 transition-colors hover:text-forest-900"
          >
            <HelpCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
            Comprendre les règles : séquestre, fenêtre de check-in, pénalités
          </button>
        </div>
      </div>

      {/* ═══ MODALES ═══════════════════════════════════════════════════════ */}

      {showTimeModal && (
        <Modal title="Horaires du séjour" onClose={() => setShowTimeModal(false)}>
          <div className="space-y-5 p-6">
            <div className="flex items-stretch overflow-hidden rounded-inner border border-border text-center">
              <div className="flex-1 px-4 py-3">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-foreground-muted">
                  Arrivée
                </p>
                <p className="text-xs font-semibold text-foreground">
                  {new Date(res.dateDebut).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
              <div className="flex items-center justify-center border-x border-border px-3">
                <span className="text-xs font-semibold tabular-nums text-foreground-muted">
                  {res.nbNuits} n
                </span>
              </div>
              <div className="flex-1 px-4 py-3">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-foreground-muted">
                  Départ
                </p>
                <p className="text-xs font-semibold text-foreground">
                  {new Date(res.dateFin).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label htmlFor="checkin-heure" className="block text-xs font-semibold text-foreground">
                  Heure d&apos;arrivée (Check-in)
                </label>
                <div className="relative">
                  <Clock className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-foreground-muted" aria-hidden="true" />
                  <input
                    id="checkin-heure"
                    type="time"
                    required
                    value={checkinHeure}
                    onChange={(e) => setCheckinHeure(e.target.value)}
                    className="w-full rounded-field border border-border bg-background py-2.5 pr-3 pl-9 text-xs font-semibold text-foreground focus:border-forest-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="checkout-heure" className="block text-xs font-semibold text-foreground">
                  Heure de départ (Check-out)
                </label>
                <div className="relative">
                  <Clock className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-foreground-muted" aria-hidden="true" />
                  <input
                    id="checkout-heure"
                    type="time"
                    required
                    value={checkoutHeureInput}
                    onChange={(e) => setCheckoutHeureInput(e.target.value)}
                    className="w-full rounded-field border border-border bg-background py-2.5 pr-3 pl-9 text-xs font-semibold text-foreground focus:border-forest-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <Notice tone="forest" icon={Lock} title="Fonds en séquestre">
              Après confirmation, le locataire est notifié. Les fonds restent bloqués jusqu’au
              check-in validé des deux côtés.
            </Notice>

            {errorMsg && <Feedback type="error" message={errorMsg} />}

            <div className="flex gap-3 pt-1">
              <GhostButton onClick={() => setShowTimeModal(false)} className="flex-1 py-3 text-sm">
                Retour
              </GhostButton>
              <div className="flex-1">
                <PrimaryButton
                  onClick={handleConfirm}
                  loading={isSubmitting}
                  disabled={!checkoutHeureInput}
                  loadingLabel="Confirmation…"
                >
                  Confirmer
                </PrimaryButton>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {showCheckinModal && (
        <CheckinModal
          reservationId={id}
          onSuccess={() => { setShowCheckinModal(false); onRefetch(); }}
          onCancel={() => setShowCheckinModal(false)}
        />
      )}

      {showCheckoutModal && (
        <CheckoutModal
          reservationId={id}
          onSuccess={() => { setShowCheckoutModal(false); onRefetch(); }}
          onCancel={() => setShowCheckoutModal(false)}
        />
      )}

      {showCancelModal && (
        <Modal
          title={
            statut === 'PENDING' ? 'Annuler la demande'
              : statut === 'CONFIRMED' ? 'Annuler une réservation confirmée'
                : 'Refuser la réservation'
          }
          onClose={() => { setShowCancelModal(false); setCancelReason(''); clearFeedback(); }}
        >
          <div className="space-y-4 p-6">
            {statut === 'PAID' && (
              <Notice tone="error" icon={AlertTriangle} title="Remboursement intégral du locataire">
                Une pénalité peut s’appliquer sur votre wallet selon le délai.
              </Notice>
            )}

            {statut === 'CONFIRMED' && (
              <>
                <Notice
                  tone="error"
                  icon={AlertTriangle}
                  title={`Pénalité : ${penaliteOwner.toLocaleString('fr-FR')} FCFA`}
                >
                  Le locataire sera remboursé intégralement. Cette pénalité est déduite de votre
                  wallet.
                </Notice>
                <Notice tone="warning" icon={AlertTriangle} title="Suspension automatique">
                  Trois annulations après confirmation entraînent la suspension de toutes vos
                  annonces.
                </Notice>
              </>
            )}

            <div>
              <label htmlFor="cancel-reason" className="mb-1.5 block text-xs font-semibold text-foreground">
                Motif <span className="text-error-600">*</span>
              </label>
              <textarea
                id="cancel-reason"
                rows={3}
                autoFocus
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                onFocus={(e) => e.target.scrollIntoView({ block: 'center', behavior: 'smooth' })}
                placeholder="Ex : le logement n’est plus disponible à ces dates."
                className="w-full resize-none rounded-xl border border-border bg-white p-3 text-sm font-medium text-foreground placeholder:text-foreground-faint focus:border-forest-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-forest-500/20"
              />
              <p className="mt-1.5 text-xs text-foreground-muted">
                Minimum {MOTIF_MIN} caractères · {cancelReason.trim().length} saisis
              </p>
            </div>

            {errorMsg && <Feedback type="error" message={errorMsg} />}

            <div className="flex gap-3 pt-1">
              <GhostButton
                onClick={() => { setShowCancelModal(false); setCancelReason(''); clearFeedback(); }}
                className="flex-1 py-3 text-sm"
              >
                Retour
              </GhostButton>
              <DangerButton
                onClick={handleCancel}
                disabled={cancelReason.trim().length < MOTIF_MIN}
                loading={isSubmitting}
                className="flex-1 py-3 text-sm"
              >
                Confirmer
              </DangerButton>
            </div>
          </div>
        </Modal>
      )}

      {showLitigeModal && (
        <Modal
          title="Ouvrir un litige"
          onClose={() => { setShowLitigeModal(false); setLitigeMotif(''); setLitigeDescription(''); clearFeedback(); }}
        >
          <div className="space-y-4 p-6">
            <Notice tone="error" icon={Lock} title="Les fonds seront gelés">
              Un litige bloque le séquestre jusqu’à résolution. L’équipe support vous contacte
              sous 48 h.
            </Notice>

            <div>
              <label htmlFor="litige-motif" className="mb-1.5 block text-xs font-semibold text-foreground">
                Motif <span className="text-error-600">*</span>
              </label>
              <select
                id="litige-motif"
                value={litigeMotif}
                onChange={(e) => setLitigeMotif(e.target.value)}
                className="w-full rounded-field border border-border bg-background px-4 py-3 text-foreground focus:border-forest-500 focus:outline-none"
              >
                <option value="" disabled>Sélectionnez un motif</option>
                {MOTIFS_LITIGE.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="litige-description" className="mb-1.5 block text-xs font-semibold text-foreground">
                Description <span className="text-error-600">*</span>
              </label>
              <textarea
                id="litige-description"
                rows={4}
                value={litigeDescription}
                onChange={(e) => setLitigeDescription(e.target.value)}
                placeholder="Décrivez précisément le problème, avec les dates et les faits."
                className="w-full resize-none rounded-field border border-border bg-background px-4 py-3 text-foreground placeholder:text-foreground-faint focus:border-forest-500 focus:outline-none"
              />
              <p className="mt-1.5 text-xs text-foreground-muted">
                Minimum {MOTIF_MIN} caractères · {litigeDescription.trim().length} saisis
              </p>
            </div>

            {errorMsg && <Feedback type="error" message={errorMsg} />}

            <div className="flex gap-3 pt-1">
              <GhostButton
                onClick={() => { setShowLitigeModal(false); setLitigeMotif(''); setLitigeDescription(''); clearFeedback(); }}
                className="flex-1 py-3 text-sm"
              >
                Retour
              </GhostButton>
              <DangerButton
                onClick={handleOpenLitige}
                disabled={!litigeMotif || litigeDescription.trim().length < MOTIF_MIN}
                loading={isSubmitting}
                loadingLabel="Ouverture…"
                className="flex-1 py-3 text-sm"
              >
                Ouvrir le litige
              </DangerButton>
            </div>
          </div>
        </Modal>
      )}

      {showNoshowModal && (
        <Modal
          title="Signaler l’absence du locataire"
          onClose={() => { if (!isSubmitting) { setShowNoshowModal(false); setNoshowComment(''); clearFeedback(); } }}
        >
          <div className="space-y-4 p-6">
            <Notice tone="error" icon={AlertTriangle} title="Compte à rebours de 3 heures">
              Si le locataire ne se présente pas dans ce délai, la réservation sera annulée
              automatiquement.
            </Notice>

            <div>
              <label htmlFor="noshow-comment" className="mb-1.5 block text-xs font-semibold text-foreground">
                Commentaire <span className="font-normal text-foreground-muted">(optionnel)</span>
              </label>
              <textarea
                id="noshow-comment"
                rows={3}
                maxLength={500}
                value={noshowComment}
                onChange={(e) => setNoshowComment(e.target.value)}
                disabled={isSubmitting}
                placeholder="Ex : aucune réponse aux appels ni aux SMS depuis deux heures."
                className="w-full resize-none rounded-field border border-border bg-background px-4 py-3 text-foreground placeholder:text-foreground-faint focus:border-forest-500 focus:outline-none disabled:opacity-50"
              />
              <p className="mt-1.5 text-right text-xs tabular-nums text-foreground-muted">
                {noshowComment.length} / 500
              </p>
            </div>

            <div className="rounded-inner border border-border bg-background-alt p-3.5">
              <p className="text-xs leading-relaxed text-foreground-muted">
                <span className="font-semibold text-foreground">Ce qui se passe ensuite : </span>
                le locataire dispose de 3 h pour se présenter et confirmer son check-in. Passé ce
                délai, la réservation est annulée avec remboursement partiel (30 % pour le
                locataire, 50 % de compensation pour vous).
              </p>
            </div>

            {errorMsg && <Feedback type="error" message={errorMsg} />}

            <div className="flex gap-3 pt-1">
              <GhostButton
                onClick={() => { setShowNoshowModal(false); setNoshowComment(''); clearFeedback(); }}
                disabled={isSubmitting}
                className="flex-1 py-3 text-sm"
              >
                Retour
              </GhostButton>
              <DangerButton
                onClick={handleSignalNoshow}
                loading={isSubmitting}
                loadingLabel="Envoi…"
                icon={UserX}
                className="flex-1 py-3 text-sm"
              >
                Confirmer le signalement
              </DangerButton>
            </div>
          </div>
        </Modal>
      )}

      {showRulesModal && (
        <Modal title="Règles de séjour et séquestre" onClose={() => setShowRulesModal(false)}>
          <div className="space-y-4 p-6">
            <p className="text-xs leading-relaxed text-foreground-muted">
              Klef applique une double validation et un séquestre sécurisé pour protéger les deux
              parties.
            </p>

            {[
              {
                icon: Clock, tone: 'forest' as Tone, title: '1. Délai de confirmation',
                body: 'Vous disposez du délai affiché pour valider la réservation. Passé ce délai sans action, la réservation est annulée et le locataire intégralement remboursé.',
              },
              {
                icon: Lock, tone: 'warning' as Tone, title: '2. Fenêtre de check-in (J−4 h)',
                body: 'L’état des lieux d’entrée ne peut démarrer que 4 heures avant l’arrivée. Cela garantit des photos fidèles et empêche tout déclenchement prématuré du versement.',
              },
              {
                icon: Shield, tone: 'forest' as Tone, title: '3. Double validation du check-in',
                body: 'Le séjour démarre lorsque vous avez importé les photos ET que le locataire a confirmé son installation. Les fonds restent en séquestre jusque-là.',
              },
              {
                icon: AlertTriangle, tone: 'error' as Tone, title: '4. Pénalités d’annulation',
                body: `Après confirmation : Gratuit (0 FCFA) au-delà de 5 jours, ${PENALITES.mid.toLocaleString('fr-FR')} FCFA entre 24 h et 5 jours, ${PENALITES.late.toLocaleString('fr-FR')} FCFA à moins de 24 h (dernière minute).`,
              },
            ].map(({ icon, tone, title, body }) => (
              <Notice key={title} tone={tone} icon={icon} title={title}>
                {body}
              </Notice>
            ))}

            <PrimaryButton onClick={() => setShowRulesModal(false)} loadingLabel="">
              J’ai compris
            </PrimaryButton>
          </div>
        </Modal>
      )}
    </>
  );
}