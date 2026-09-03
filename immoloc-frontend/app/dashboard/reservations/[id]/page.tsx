'use client';

import { use, useCallback, useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft, FileText, User, Home, AlertTriangle, CheckCircle2, Shield,
  ShieldCheck, MapPin, Phone, PhoneCall, Star, Banknote, Users, Moon,
  TrendingUp, ExternalLink, Clock, ChevronUp, X, Lock,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { nestFetch } from '@/lib/nestjs/api-client';
import { NEST_API } from '@/lib/nestjs/endpoints';
import type { ReservationDetail } from '@/lib/nestjs/types';
import { useRoleStore } from '@/stores/role.store';
import { ReservationActionPanel } from '@/features/reservations/components/owner/ReservationActionPanel';
import { TenantReservationActionPanel } from '@/features/reservations/components/tenant/TenantReservationActionPanel';
import { PhotosEtatLieuSection } from '@/features/reservations/components/owner/PhotosEtatLieuSection';
import { ReservationPaymentCard } from '@/features/reservations/components/shared/ReservationPaymentCard';
import { ReservationTimeline } from '@/features/reservations/components/shared/ReservationTimeline';
import { canSeeCoordonnees } from '@/features/reservations/utils';
import { AskAssistantButton } from '@/components/assistant/AskAssistantButton';

/* ═══════════════════════════════════════════════════════════════════════════
   DIRECTION VISUELLE ASSUMÉE
   ───────────────────────────────────────────────────────────────────────────
   Le lime et le rouge sont ici des outils d'emphase, volontairement.
   La contrainte qui les rend efficaces : ils ne servent QU'À ÇA.

     · lime  → le revenu net (hero + détail financier) et le CTA contrat.
     · rouge → la commission déduite et les états d'alerte (litige, annulée).

   Tout le reste — icônes de section, avatars, pastilles, halos, téléphone,
   barres — passe en vert et neutres. Le fichier précédent comptait 18
   occurrences de lime : un chiffre lime au milieu de 17 autres éléments lime
   ne ressort pas. C'est la rareté qui produit l'impact, pas la quantité.
   ═══════════════════════════════════════════════════════════════════════════ */

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

const fcfa = (n: number | string) =>
  new Intl.NumberFormat('fr-FR').format(Math.round(Number(n) || 0));

const dateLong = (s: string) =>
  new Date(s).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

const dateTimeLong = (s: string) =>
  new Date(s).toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

/* Même piège que dans CheckInTimeCard et TenantReservationHero : `dateDebut`
   arrive souvent en date seule, lue à minuit UTC. `toLocaleTimeString()`
   affichait « 00:00 » depuis Dakar et « 02:00 » depuis Paris — présenté comme
   l'heure d'arrivée confirmée par l'hôte. On n'affiche que ce qui existe. */
function timeOrNull(iso: string) {
  if (!/\d{2}:\d{2}/.test(iso)) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? null
    : d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

/* ─── Statuts ─────────────────────────────────────────────────────────────
   ⚠️ Corrigé : `warning-400`, `error-400`, `neutral-700/800/300/400`
   n'existent pas dans la palette Klef. PENDING, CANCELLED, DISPUTED,
   COMPLETED et EXPIRED rendaient sans couleur de texte ni pastille — cinq
   statuts sur huit. Toutes les classes sont désormais écrites en entier. */

type StatutStyle = {
  label: string;
  badge: string;
  dot: string;
  icon: typeof CheckCircle2;
  /** Une pastille qui pulse dit « en cours ». Pas « terminé ». */
  live?: boolean;
};

const STATUT_CFG: Record<string, StatutStyle> = {
  PENDING: {
    label: 'En attente',
    badge: 'border-warning-500/30 bg-warning-500/12 text-warning-50',
    dot: 'bg-warning-500', icon: Clock, live: true,
  },
  PAID: {
    label: 'Sous séquestre',
    badge: 'border-border-inverse bg-white/8 text-on-inverse',
    dot: 'bg-forest-300', icon: ShieldCheck,
  },
  CONFIRMED: {
    label: 'Confirmée',
    badge: 'border-border-inverse bg-white/8 text-on-inverse',
    dot: 'bg-forest-300', icon: CheckCircle2,
  },
  CHECKED_IN: {
    label: 'Séjour en cours',
    badge: 'border-border-inverse bg-white/8 text-on-inverse',
    dot: 'bg-forest-300', icon: CheckCircle2, live: true,
  },
  COMPLETED: {
    label: 'Terminée',
    badge: 'border-border-inverse bg-white/5 text-on-inverse-muted',
    dot: 'bg-forest-400', icon: CheckCircle2,
  },
  CANCELLED: {
    label: 'Annulée',
    badge: 'border-error-500/35 bg-error-500/15 text-error-50',
    dot: 'bg-error-500', icon: AlertTriangle,
  },
  DISPUTED: {
    label: 'Litige',
    badge: 'border-error-500/35 bg-error-500/15 text-error-50',
    dot: 'bg-error-500', icon: AlertTriangle, live: true,
  },
  EXPIRED: {
    label: 'Expirée',
    badge: 'border-border-inverse bg-white/5 text-on-inverse-muted',
    dot: 'bg-forest-400', icon: Clock,
  },
};

const MOTIFS_LITIGE: Record<string, string> = {
  DEPASSEMENT_PERSONNES: 'Dépassement du nombre de voyageurs',
  DEGRADATION: 'Dégradation du logement',
  LOGEMENT_NON_CONFORME: 'Logement non conforme',
  NON_PAIEMENT: 'Non-paiement de frais supplémentaires',
  NUISANCES: 'Nuisances ou comportement inapproprié',
  AUTRE: 'Autre motif',
};

/* ─── Skeleton ────────────────────────────────────────────────────────────── */

export function ReservationDetailSkeleton() {
  return (
    <div
      aria-busy="true"
      className="mx-auto max-w-6xl space-y-6 px-4 pt-10 pb-24 sm:px-6 lg:px-8 lg:pt-12"
    >
      <span className="sr-only">Chargement de la réservation…</span>

      <div className="flex items-center justify-between">
        <div className="h-8 w-40 animate-pulse rounded-pill bg-border" />
        <div className="h-7 w-28 animate-pulse rounded-pill bg-border" />
      </div>

      <div className="section-inverse space-y-6 p-6 md:p-8">
        <div className="flex flex-col gap-6 md:flex-row">
          <div className="flex-1 space-y-5">
            <div className="flex items-center gap-3">
              <div className="h-7 w-28 animate-pulse rounded-pill bg-white/10" />
              <div className="h-4 w-36 animate-pulse rounded-pill bg-white/[0.07]" />
            </div>
            <div className="space-y-2">
              <div className="h-3 w-32 animate-pulse rounded-pill bg-white/[0.07]" />
              <div className="h-8 w-72 animate-pulse rounded-pill bg-white/10" />
            </div>
            <div className="h-20 w-full max-w-sm animate-pulse rounded-inner bg-white/[0.07]" />
          </div>
          <div className="shrink-0 space-y-3 md:w-56">
            <div className="h-36 w-full animate-pulse rounded-inner bg-white/10" />
            <div className="h-24 animate-pulse rounded-inner bg-white/10" />
          </div>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {[0, 1].map((i) => (
          <div key={i} className="space-y-4 rounded-card border border-border bg-background-card p-5">
            <div className="h-6 w-32 animate-pulse rounded-pill bg-border" />
            <div className="h-24 w-full animate-pulse rounded-inner bg-border" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Briques ─────────────────────────────────────────────────────────────── */

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <section className={cn('space-y-4 rounded-card border border-border bg-background-card p-5 shadow-sm', className)}>
      {children}
    </section>
  );
}

function CardHeader({ icon: Icon, title }: { icon: typeof User; title: string }) {
  return (
    <header className="flex items-center gap-2.5 border-b border-border pb-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-inner border border-forest-100 bg-forest-50 text-forest-700">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <h2 className="font-display text-base font-semibold text-foreground">{title}</h2>
    </header>
  );
}

function InverseHeader({ icon: Icon, title, subtitle }: {
  icon: typeof User; title: string; subtitle?: string;
}) {
  return (
    <header className="flex items-center gap-3 border-b border-border-inverse pb-4">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-inner border border-border-inverse bg-white/5 text-on-inverse-muted">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <h2 className="font-display text-base font-semibold text-on-inverse-display">{title}</h2>
        {subtitle && <p className="mt-0.5 text-xs text-on-inverse-muted">{subtitle}</p>}
      </div>
    </header>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   PAGE
   ═══════════════════════════════════════════════════════════════════════════ */

export default function ReservationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { userId, activeRole } = useRoleStore();

  const { data: res, isLoading, error, refetch } = useQuery<ReservationDetail>({
    queryKey: ['reservation', id],
    queryFn: () => nestFetch<ReservationDetail>(NEST_API.RESERVATIONS.FIND_ONE(id)),
    staleTime: 5000,
    refetchOnWindowFocus: false,
  });

  const [panelOpen, setPanelOpen] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* Le `setTimeout(…, 1500)` d'origine n'était jamais nettoyé : quitter la
     page pendant le délai déclenchait un setState sur composant démonté. */
  useEffect(() => () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }, []);

  /* Le bottom sheet n'avait ni Échap, ni verrou de scroll : la page défilait
     derrière lui sur mobile. */
  useEffect(() => {
    if (!panelOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') setPanelOpen(false); };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [panelOpen]);

  const handleRefetchAndClose = useCallback(() => {
    refetch();
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setPanelOpen(false), 1500);
  }, [refetch]);

  if (isLoading) return <ReservationDetailSkeleton />;

  if (error || !res) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-md space-y-3 rounded-card border border-error-500/20 bg-error-50 p-6 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-pill border border-error-500/25 bg-background-card">
            <AlertTriangle className="h-6 w-6 text-error-600" aria-hidden="true" />
          </span>
          <p className="text-sm font-semibold text-error-700">
            Impossible de charger cette réservation.
          </p>
          <Link
            href="/dashboard/reservations"
            className="inline-flex items-center gap-2 rounded-pill bg-button-primary px-5 py-2.5 text-xs font-semibold text-on-button-primary transition-colors hover:bg-button-primary-hover"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Retour à mes réservations
          </Link>
        </div>
      </div>
    );
  }

  const cfg = STATUT_CFG[res.statut] ?? STATUT_CFG.PENDING;
  const StatusIcon = cfg.icon;

  const isOwner =
    (res.proprietaire.id === userId && activeRole === 'PROPRIETAIRE') ||
    activeRole === 'GESTIONNAIRE' ||
    (res.logement as any)?.gestionnaireId === userId;
  const canSeePhone = canSeeCoordonnees(res.statut, res.dateDebut);

  const mainPhoto =
    res.logement?.photos.find((p) => p.estPrincipale)?.url ?? res.logement?.photos[0]?.url;
  const checkinPhotos = res.photosEtatLieu.filter((p) => p.type === 'CHECKIN');
  const checkoutPhotos = res.photosEtatLieu.filter((p) => p.type === 'CHECKOUT');

  const commissionPct = Math.round(Number(res.tauxCommission) * 100);
  const ownPct = 100 - commissionPct;

  const heureArrivee = res.confirmeeLe ? timeOrNull(res.dateDebut) : null;
  const heureDepart = res.confirmeeLe ? timeOrNull(res.dateFin) : null;

  const initiales =
    `${res.locataire.prenom?.[0] ?? ''}${res.locataire.nom?.[0] ?? ''}`.toUpperCase() || '?';

  const OWNER_STATUTS = ['PENDING', 'PAID', 'CONFIRMED', 'CHECKED_IN', 'COMPLETED', 'DISPUTED'];
  const TENANT_STATUTS = ['CONFIRMED', 'COMPLETED'];
  const showStickyBar = isOwner
    ? OWNER_STATUTS.includes(res.statut)
    : TENANT_STATUTS.includes(res.statut);

  /* Le CTA mobile : une seule variante lime — l'action réellement attendue.
     Les états passifs et les alertes ne portent pas d'aplat lime. */
  const CTA: Record<string, { label: string; btn: string; urgent?: boolean }> = isOwner
    ? {
      PENDING: { label: 'En attente du paiement', btn: 'Voir' },
      PAID: { label: 'Décision requise', btn: 'Décider', urgent: true },
      CONFIRMED: { label: 'Check-in à gérer', btn: 'Gérer', urgent: true },
      CHECKED_IN: { label: 'Check-out à gérer', btn: 'Gérer', urgent: true },
      COMPLETED: { label: 'Noter votre expérience', btn: 'Noter' },
      DISPUTED: { label: 'Litige en cours', btn: 'Voir' },
    }
    : {
      CONFIRMED: { label: 'Check-in à valider', btn: 'Valider', urgent: true },
      COMPLETED: { label: 'Noter votre séjour', btn: 'Noter' },
    };

  const cta = CTA[res.statut] ?? { label: cfg.label, btn: 'Voir' };

  const ligneMontants: {
    label: string;
    value: string;
    kind?: 'total' | 'deduction' | 'net';
  }[] = [
      { label: 'Prix de base', value: `${fcfa(res.prixBase)} FCFA` },
      { label: 'Supplément voyageurs', value: `+${fcfa(res.supplementPersonnes)} FCFA` },
      {
        label: `Réduction séjour (${res.nbNuits} nuits)`,
        value: Number(res.reductionNuits) > 0 ? `−${fcfa(res.reductionNuits)} FCFA` : '—',
      },
      { label: 'Total payé par le locataire', value: `${fcfa(res.totalLocataire)} FCFA`, kind: 'total' },
      {
        label: `Commission Klef (${commissionPct} %)`,
        value: `−${fcfa(res.montantCommission)} FCFA`,
        kind: 'deduction',
      },
      { label: 'Votre revenu net', value: `${fcfa(res.netProprietaire)} FCFA`, kind: 'net' },
    ];

  return (
    <>
      <div className="mx-auto max-w-6xl space-y-6 px-4 pt-10 pb-40 sm:px-6 lg:px-8 lg:pt-12 lg:pb-24">

        {/* ── Navigation ───────────────────────────────────────────────── */}

        <div className="flex items-center justify-between gap-3">
          <Link
            href={activeRole === 'GESTIONNAIRE' ? '/gestionnaire/reservations' : '/dashboard/reservations'}
            className="group inline-flex items-center gap-2 text-xs font-semibold text-foreground-muted transition-colors hover:text-foreground"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-pill border border-border bg-background-alt transition-colors group-hover:border-border-hover">
              <ArrowLeft className="h-4 w-4 text-forest-700" aria-hidden="true" />
            </span>
            Retour aux réservations
          </Link>

          <span className="rounded-pill border border-border bg-background-alt px-3.5 py-1.5 text-xs font-semibold tracking-wider text-foreground-muted tabular-nums">
            RÉF #{res.id.slice(0, 8).toUpperCase()}
          </span>
        </div>

        {/* ══ HERO ═══════════════════════════════════════════════════════ */}

        <section className="section-inverse relative overflow-hidden p-6 md:p-8">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-pill bg-forest-700/40 blur-3xl"
          />

          <div className="relative flex flex-col gap-6 md:flex-row md:items-start">

            <div className="min-w-0 flex-1 space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className={cn(
                  'inline-flex items-center gap-1.5 rounded-pill border px-3 py-1 text-xs font-semibold',
                  cfg.badge,
                )}>
                  <span
                    aria-hidden="true"
                    className={cn('h-1.5 w-1.5 rounded-pill', cfg.dot, cfg.live && 'animate-pulse')}
                  />
                  <StatusIcon className="h-3.5 w-3.5" />
                  {cfg.label}
                </span>
                <span className="text-xs text-on-inverse-muted">
                  Créée le {dateLong(res.creeLe)}
                </span>
              </div>

              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-on-inverse-muted">
                  {[res.logement?.type, res.logement?.ville, res.logement?.quartier]
                    .filter(Boolean).join(' · ')}
                </p>
                <h1 className="font-display text-2xl font-semibold leading-tight tracking-tight text-on-inverse-display md:text-3xl">
                  {res.logement?.titre ?? 'Réservation'}
                </h1>
              </div>

              <div className="flex w-full max-w-sm items-stretch overflow-hidden rounded-inner border border-border-inverse bg-white/5">
                <div className="flex-1 px-4 py-3 text-center">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-on-inverse-muted">
                    Arrivée
                  </p>
                  <p className="text-sm font-semibold text-on-inverse">
                    <time dateTime={res.dateDebut.slice(0, 10)}>{dateLong(res.dateDebut)}</time>
                  </p>
                  {heureArrivee && (
                    <p className="mt-1 flex items-center justify-center gap-1 text-xs tabular-nums text-on-inverse-muted">
                      <Clock className="h-3 w-3" aria-hidden="true" />
                      {heureArrivee}
                    </p>
                  )}
                </div>

                <div className="flex flex-col items-center justify-center border-x border-border-inverse bg-white/[0.04] px-4">
                  <Moon className="h-4 w-4 text-on-inverse-muted" aria-hidden="true" />
                  <span className="mt-0.5 text-base font-semibold leading-none tabular-nums text-on-inverse">
                    {res.nbNuits}
                  </span>
                  <span className="text-xs uppercase text-on-inverse-muted">
                    nuit{res.nbNuits > 1 ? 's' : ''}
                  </span>
                </div>

                <div className="flex-1 px-4 py-3 text-center">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-on-inverse-muted">
                    Départ
                  </p>
                  <p className="text-sm font-semibold text-on-inverse">
                    <time dateTime={res.dateFin.slice(0, 10)}>{dateLong(res.dateFin)}</time>
                  </p>
                  {heureDepart && (
                    <p className="mt-1 flex items-center justify-center gap-1 text-xs tabular-nums text-on-inverse-muted">
                      <Clock className="h-3 w-3" aria-hidden="true" />
                      {heureDepart}
                    </p>
                  )}
                </div>
              </div>

              <p className="flex items-center gap-2 text-xs font-semibold text-on-inverse-muted">
                <Users className="h-4 w-4" aria-hidden="true" />
                {res.nbPersonnes} voyageur{res.nbPersonnes > 1 ? 's' : ''}
              </p>
            </div>

            {/* Colonne droite : photo + LE chiffre lime du hero */}
            <div className="flex shrink-0 flex-col gap-3 md:w-56">
              {mainPhoto && (
                <div className="relative h-36 w-full overflow-hidden rounded-inner border border-border-inverse md:h-40">
                  <Image
                    src={mainPhoto}
                    alt={res.logement?.titre ?? ''}
                    fill
                    sizes="(min-width: 768px) 224px, 100vw"
                    className="object-cover"
                  />
                </div>
              )}

              {/* ★ Emphase 1/2 : le revenu net. Seul aplat lime du hero. */}
              <div className="space-y-1 rounded-inner border border-action/35 bg-marker-bg p-4 text-center">
                <p className="text-xs font-semibold uppercase tracking-wider text-on-inverse-muted">
                  {isOwner ? 'Votre revenu net' : 'Total réglé'}
                </p>
                <p className="font-display text-3xl font-semibold leading-none tabular-nums text-on-inverse-marker">
                  {fcfa(isOwner ? res.netProprietaire : res.totalLocataire)}
                </p>
                <p className="text-xs font-semibold text-on-inverse-muted">FCFA</p>
              </div>
            </div>
          </div>
        </section>

        {/* ══ PANNEAU D'ACTIONS — desktop ═══════════════════════════════ */}

        <div className="hidden lg:block">
          {isOwner ? (
            <ReservationActionPanel id={id} res={res} onRefetch={refetch} />
          ) : (
            <TenantReservationActionPanel id={id} res={res} onRefetch={refetch} />
          )}
        </div>

        {/* ══ CONTRAT ════════════════════════════════════════════════════ */}

        <section className="section-inverse flex flex-wrap items-center justify-between gap-4 p-5">
          <div className="flex min-w-0 items-center gap-3.5">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-inner border border-border-inverse bg-white/5 text-on-inverse-muted">
              <FileText className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="font-display text-base font-semibold text-on-inverse-display">
                Contrat de location vérifié
              </p>
              <p className="text-xs text-on-inverse-muted">
                Généré par Klef, horodaté et signé numériquement
              </p>
            </div>
          </div>

          {/* ★ Emphase 2/2 : l'action. Seul bouton lime de la page. */}
          <Link
            href={`/dashboard/reservations/${id}/contrat`}
            className="inline-flex shrink-0 items-center gap-2 rounded-pill bg-action px-5 py-2.5 text-xs font-semibold text-on-action shadow-action transition-[background-color,box-shadow,transform] hover:bg-action-hover hover:shadow-action-hover active:scale-[0.98]"
          >
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
            Consulter le contrat PDF
          </Link>
        </section>

        {/* ══ LOCATAIRE + LOGEMENT ═══════════════════════════════════════ */}

        <div className="grid gap-5 md:grid-cols-2">

          <Card>
            <CardHeader icon={User} title="Locataire" />

            <div className="flex items-center gap-3.5">
              <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-inner border border-border bg-forest-800 font-display text-base font-semibold text-neutral-50">
                {res.locataire.avatarUrl ? (
                  <Image src={res.locataire.avatarUrl} alt="" fill sizes="56px" className="object-cover" />
                ) : initiales}
              </div>

              <div className="min-w-0 flex-1">
                <p className="mb-0.5 text-xs font-semibold uppercase tracking-wider text-foreground-muted">
                  Réservataire
                </p>
                <h3 className="truncate font-display text-base font-bold leading-tight text-foreground">
                  {res.locataire.prenom} {res.locataire.nom}
                </h3>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {res.locataire.statutKyc === 'VERIFIE' ? (
                    <span className="inline-flex items-center gap-1 rounded-pill border border-gold-200 bg-gold-50 px-2.5 py-0.5 text-xs font-semibold text-gold-700">
                      <ShieldCheck className="h-3 w-3" aria-hidden="true" />
                      Identité vérifiée
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-pill border border-warning-500/25 bg-warning-50 px-2.5 py-0.5 text-xs font-semibold text-warning-700">
                      <AlertTriangle className="h-3 w-3" aria-hidden="true" />
                      Identité non vérifiée
                    </span>
                  )}

                  {/* Qualification Teranga Club */}
                  <span className="inline-flex items-center gap-1 rounded-pill border border-lime-500/40 bg-lime-500/15 px-2.5 py-0.5 text-xs font-extrabold text-forest-900 shadow-2xs">
                    <span>
                      {res.locataire.terangaTier === 'GOLD'
                        ? '👑'
                        : res.locataire.terangaTier === 'SILVER'
                        ? '🔑'
                        : '🗝️'}
                    </span>
                    <span>
                      {res.locataire.terangaTier === 'GOLD'
                        ? "Clé d'Or"
                        : res.locataire.terangaTier === 'SILVER'
                        ? "Clé d'Argent"
                        : 'Clé de Bronze'}
                    </span>
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3 border-t border-border pt-3">
              {canSeePhone && res.locataire.telephone ? (
                <a
                  href={`tel:${res.locataire.telephone.replace(/\s/g, '')}`}
                  className="group flex w-full items-center gap-3.5 rounded-inner border border-border bg-background-alt p-3.5 transition-colors hover:border-border-hover hover:bg-background-card"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-inner border border-forest-100 bg-forest-50 text-forest-700">
                    <PhoneCall className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-xs font-semibold uppercase tracking-wider text-foreground-muted">
                      Appeler le locataire
                    </span>
                    <span className="block text-sm font-semibold tabular-nums text-foreground">
                      {res.locataire.telephone}
                    </span>
                  </span>
                </a>
              ) : (
                <div className="flex items-center gap-3.5 rounded-inner border border-border bg-background-alt p-3.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-inner border border-border bg-background-card">
                    <Lock className="h-4 w-4 text-foreground-muted" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-foreground">Numéro masqué</p>
                    <p className="mt-0.5 text-xs text-foreground-muted">
                      Visible 48 h avant le check-in
                    </p>
                  </div>
                  <Phone className="h-4 w-4 shrink-0 text-foreground-muted" aria-hidden="true" />
                </div>
              )}

              {/* Note / Étoile du locataire ultra visible */}
              <div className="flex items-center gap-2.5 rounded-inner border border-gold-300/40 bg-gradient-to-r from-gold-500/10 to-amber-500/5 p-3">
                <div className="flex items-center gap-1.5">
                  <Star className="h-4 w-4 shrink-0 fill-gold-400 text-gold-500" aria-hidden="true" />
                  <span className="text-xs font-bold text-gold-950">Note globale locataire</span>
                </div>
                <span className="ml-auto text-xs font-black tabular-nums text-gold-900 bg-gold-400/20 px-2.5 py-0.5 rounded-pill border border-gold-400/30">
                  {res.locataire.noteLocataire != null && res.locataire.noteLocataire > 0
                    ? `⭐ ${res.locataire.noteLocataire.toFixed(1)} / 5`
                    : '⭐ Nouveau locataire'}
                </span>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader icon={Home} title="Logement loué" />

            {mainPhoto && (
              <div className="relative h-32 w-full overflow-hidden rounded-inner border border-border bg-background-alt">
                <Image
                  src={mainPhoto}
                  alt={res.logement?.titre ?? ''}
                  fill
                  sizes="(min-width: 768px) 50vw, 100vw"
                  className="object-cover"
                />
              </div>
            )}

            <div>
              <h3 className="font-display text-base font-semibold leading-snug text-foreground">
                {res.logement?.titre}
              </h3>
              <p className="mt-0.5 text-xs font-semibold uppercase tracking-wider text-foreground-muted">
                {res.logement?.type}
              </p>
            </div>

            <div className="flex items-start gap-2.5 border-t border-border pt-3">
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-inner border border-forest-100 bg-forest-50">
                <MapPin className="h-3.5 w-3.5 text-forest-700" aria-hidden="true" />
              </span>
              <address className="text-xs not-italic leading-relaxed text-foreground">
                {[res.logement?.adresse, res.logement?.quartier, res.logement?.ville]
                  .filter(Boolean).join(', ')}
              </address>
            </div>
          </Card>
        </div>

        {/* ══ TRAÇABILITÉ & MANDAT DE GESTION ════════════════════════════ */}

        <Card>
          <CardHeader icon={ShieldCheck} title="Traçabilité & Mandat de Gestion" />

          <div className="space-y-4">
            {/* Pastille de statut du mandat */}
            <div className="flex items-center gap-2 rounded-inner border border-forest-100 bg-forest-50 p-3 text-xs font-medium text-forest-800">
              <ShieldCheck className="h-4 w-4 shrink-0 text-forest-600" aria-hidden="true" />
              <span>
                {res.logement?.gestionnaire ? (
                  <>
                    <strong className="font-semibold text-forest-900">Mandat délégué actif</strong> — Ce bien est géré par{' '}
                    <span className="font-semibold underline decoration-forest-400">
                      {res.logement.gestionnaire.prenom} {res.logement.gestionnaire.nom}
                    </span>{' '}
                    pour le compte du propriétaire titulaire{' '}
                    <span className="font-semibold">
                      {res.proprietaire.prenom} {res.proprietaire.nom}
                    </span>.
                  </>
                ) : (
                  <>
                    <strong className="font-semibold text-forest-900">Gestion directe</strong> — Ce bien est géré en direct par le propriétaire titulaire{' '}
                    <span className="font-semibold">
                      {res.proprietaire.prenom} {res.proprietaire.nom}
                    </span>.
                  </>
                )}
              </span>
            </div>

            {/* Fiches des intervenants */}
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Propriétaire Titulaire */}
              <div className="flex items-center gap-3 rounded-inner border border-border bg-background-alt p-3.5">
                <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-inner border border-border bg-forest-800 text-xs font-semibold text-neutral-50">
                  {res.proprietaire.avatarUrl ? (
                    <Image src={res.proprietaire.avatarUrl} alt="" fill sizes="44px" className="object-cover" />
                  ) : (
                    `${res.proprietaire.prenom?.[0] ?? ''}${res.proprietaire.nom?.[0] ?? ''}`.toUpperCase()
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-foreground-muted">
                    Propriétaire Titulaire (Bailleur)
                  </span>
                  <span className="block truncate text-xs font-semibold text-foreground">
                    {res.proprietaire.prenom} {res.proprietaire.nom}
                  </span>
                  {res.proprietaire.telephone && (
                    <span className="block text-[11px] tabular-nums text-foreground-muted">
                      📞 {res.proprietaire.telephone}
                    </span>
                  )}
                </div>
              </div>

              {/* Gestionnaire Délégué (si présent) */}
              {res.logement?.gestionnaire ? (
                <div className="flex items-center gap-3 rounded-inner border border-forest-200 bg-forest-50/50 p-3.5">
                  <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-inner border border-forest-300 bg-forest-700 text-xs font-semibold text-neutral-50">
                    {res.logement.gestionnaire.avatarUrl ? (
                      <Image src={res.logement.gestionnaire.avatarUrl} alt="" fill sizes="44px" className="object-cover" />
                    ) : (
                      `${res.logement.gestionnaire.prenom?.[0] ?? ''}${res.logement.gestionnaire.nom?.[0] ?? ''}`.toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-forest-700">
                      Gestionnaire Délégué (Mandataire)
                    </span>
                    <span className="block truncate text-xs font-semibold text-foreground">
                      {res.logement.gestionnaire.prenom} {res.logement.gestionnaire.nom}
                    </span>
                    {res.logement.gestionnaire.telephone && (
                      <span className="block text-[11px] tabular-nums text-foreground-muted">
                        📞 {res.logement.gestionnaire.telephone}
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 rounded-inner border border-dashed border-border bg-background-alt p-3.5 opacity-60">
                  <span className="text-xs text-foreground-muted">
                    Aucun gestionnaire délégué associé à cette annonce.
                  </span>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* ══ DÉTAIL FINANCIER ═══════════════════════════════════════════ */}

        {isOwner && (
          <section className="section-inverse space-y-5 p-6">
            <InverseHeader icon={TrendingUp} title="Détail financier" subtitle="Répartition du montant réglé" />

            <dl className="space-y-1">
              {ligneMontants.map((row) => (
                <div
                  key={row.label}
                  className={cn(
                    'flex items-center justify-between gap-3 py-2.5',
                    row.kind && 'border-t border-border-inverse pt-3',
                  )}
                >
                  <dt className={cn(
                    'text-sm',
                    row.kind === 'total' || row.kind === 'net'
                      ? 'font-semibold text-on-inverse'
                      : 'text-on-inverse-muted',
                  )}>
                    {row.label}
                  </dt>
                  <dd className={cn(
                    'text-sm font-semibold tabular-nums',
                    row.kind === 'net'
                      /* ★ Le revenu net, à nouveau en lime : c'est le chiffre
                         que le propriétaire vient chercher. */
                      ? 'rounded-pill border border-action-edge bg-marker-bg px-3 py-1 font-display text-xl text-on-inverse-marker'
                      /* ★ La commission : seule ligne rouge de la page. */
                      : row.kind === 'deduction'
                        ? 'text-error-500'
                        : 'text-on-inverse',
                  )}>
                    {row.value}
                  </dd>
                </div>
              ))}
            </dl>

            <div className="space-y-2 border-t border-border-inverse pt-3">
              <div className="flex justify-between text-xs font-semibold uppercase tracking-wider text-on-inverse-muted">
                <span>Votre part — {ownPct} %</span>
                <span>Klef — {commissionPct} %</span>
              </div>
              <div
                role="img"
                aria-label={`Votre part : ${ownPct} %. Commission Klef : ${commissionPct} %.`}
                className="h-2 overflow-hidden rounded-pill bg-white/10"
              >
                <div
                  className="h-full rounded-pill bg-action transition-[width] duration-700"
                  style={{ width: `${ownPct}%` }}
                />
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-inner border border-border-inverse bg-white/5 p-3.5">
              <Shield className="mt-0.5 h-4 w-4 shrink-0 text-on-inverse-muted" aria-hidden="true" />
              <p className="text-xs leading-relaxed text-on-inverse-muted">
                La commission couvre la garantie de paiement sous séquestre, le support 7 j/7 et
                la protection contre les dégradations.
              </p>
            </div>
          </section>
        )}

        {/* ══ PAIEMENT ═══════════════════════════════════════════════════ */}

        <ReservationPaymentCard paiement={res.paiement} reservation={res} />

        {/* ══ ÉTAT DES LIEUX ═════════════════════════════════════════════ */}

        <PhotosEtatLieuSection checkinPhotos={checkinPhotos} checkoutPhotos={checkoutPhotos} />

        {/* ══ LITIGE ═════════════════════════════════════════════════════ */}

        {res.litige && (
          <section className="space-y-5 rounded-card border border-error-500/25 bg-background-card p-6 shadow-sm">
            <header className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-inner border border-error-500/25 bg-error-50 text-error-600">
                  <AlertTriangle className="h-5 w-5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <h2 className="font-display text-base font-semibold text-foreground">
                    Litige déclaré
                  </h2>
                  <p className="mt-0.5 text-xs text-foreground-muted">
                    Par le {isOwner ? 'propriétaire' : 'locataire'}
                  </p>
                </div>
              </div>

              <span className={cn(
                'inline-flex shrink-0 items-center gap-1.5 rounded-pill border px-3 py-1 text-xs font-semibold',
                res.litige.statut === 'EN_ATTENTE' && 'border-warning-500/25 bg-warning-50 text-warning-700',
                res.litige.statut === 'FONDE' && 'border-error-500/25 bg-error-50 text-error-700',
                res.litige.statut === 'NON_FONDE' && 'border-success-500/25 bg-success-50 text-success-700',
              )}>
                {res.litige.statut === 'EN_ATTENTE' && 'En cours d’examen'}
                {res.litige.statut === 'FONDE' && 'Litige fondé'}
                {res.litige.statut === 'NON_FONDE' && 'Litige non fondé'}
              </span>
            </header>

            <dl className="space-y-4">
              <div>
                <dt className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-foreground-muted">
                  Motif
                </dt>
                <dd className="text-sm font-semibold text-foreground">
                  {MOTIFS_LITIGE[res.litige.motif] ?? res.litige.motif.replace(/_/g, ' ')}
                </dd>
              </div>

              <div>
                <dt className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-foreground-muted">
                  Description
                </dt>
                <dd className="rounded-inner border border-border bg-background-alt p-3 text-xs leading-relaxed text-foreground">
                  {res.litige.description}
                </dd>
              </div>
            </dl>

            <p className="flex items-center gap-2 text-xs text-foreground-muted">
              <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              Ouvert le {dateTimeLong(res.litige.creeLe)}
            </p>
          </section>
        )}

        {/* ══ ASSISTANCE KLEF ════════════════════════════════════════════ */}

        <section className="rounded-card border border-border bg-background-card p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="font-display text-sm font-semibold text-foreground">
              Besoin d&apos;aide concernant cette réservation hôte ?
            </h3>
            <p className="text-xs text-foreground-muted">
              Posez votre question à l&apos;assistant Klef ou ouvrez un ticket prioritaire avec notre support.
            </p>
          </div>
          <AskAssistantButton
            label="Demander à l'assistant"
            subject={`Question hôte — Réservation #${res.id.slice(0, 8).toUpperCase()}`}
            category="RESERVATION"
            reservationId={res.id}
            logementId={res.logement?.id}
            variant="lime"
          />
        </section>

        {/* ══ CHRONOLOGIE ════════════════════════════════════════════════ */}

        <ReservationTimeline historique={res.historique} variant="dark" isOwner={isOwner} reservation={res} />
      </div>

      {/* ══ BARRE STICKY MOBILE ══════════════════════════════════════════ */}

      {showStickyBar && !panelOpen && (
        <div className="fixed inset-x-0 bottom-[calc(0.75rem+env(safe-area-inset-bottom,0px))] z-30 px-3 lg:hidden">
          <button
            type="button"
            onClick={() => setPanelOpen(true)}
            aria-expanded={panelOpen}
            className="section-inverse w-full overflow-hidden shadow-xl transition-transform active:scale-[0.985]"
          >
            <span className="flex items-center gap-3 px-4 py-3.5">
              <span className={cn(
                'flex h-9 w-9 shrink-0 items-center justify-center rounded-inner border',
                cfg.badge,
              )}>
                <StatusIcon className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1 text-left">
                <span className="block truncate text-sm font-semibold leading-tight text-on-inverse">
                  {cta.label}
                </span>
                <span className="mt-0.5 block truncate text-xs text-on-inverse-muted">
                  {res.locataire.prenom} {res.locataire.nom} · {res.nbNuits} nuit
                  {res.nbNuits > 1 ? 's' : ''}
                </span>
              </span>
              <span className={cn(
                'flex shrink-0 items-center gap-1.5 rounded-pill px-4 py-2.5 text-xs font-semibold',
                cta.urgent
                  ? 'bg-action text-on-action shadow-action'
                  : 'border border-border-inverse bg-white/8 text-on-inverse',
              )}>
                {cta.btn}
                <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
            </span>
          </button>
        </div>
      )}

      {/* ══ BOTTOM SHEET ═════════════════════════════════════════════════ */}

      {showStickyBar && panelOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-forest-950/70 backdrop-blur-sm lg:hidden"
            onClick={() => setPanelOpen(false)}
          />
          <div
            ref={sheetRef}
            role="dialog"
            aria-modal="true"
            aria-label={cta.label}
            className="fixed inset-x-0 bottom-0 z-50 max-h-[88dvh] overflow-y-auto rounded-t-card bg-background shadow-xl lg:hidden"
          >
            <div className="sticky top-0 z-10 bg-background pt-3">
              <div className="mb-2.5 flex justify-center">
                <span aria-hidden="true" className="h-1 w-10 rounded-pill bg-border-hover" />
              </div>
              <div className="flex items-center justify-between gap-3 border-b border-border px-5 pb-3.5">
                <p className="font-display text-sm font-semibold text-foreground">{cfg.label}</p>
                <button
                  type="button"
                  onClick={() => setPanelOpen(false)}
                  aria-label="Fermer"
                  className="flex h-8 w-8 items-center justify-center rounded-pill border border-border text-foreground-muted transition-colors hover:bg-background-alt active:scale-90"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="p-4 pb-10">
              {isOwner ? (
                <ReservationActionPanel id={id} res={res} onRefetch={handleRefetchAndClose} />
              ) : (
                <TenantReservationActionPanel id={id} res={res} onRefetch={handleRefetchAndClose} />
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}