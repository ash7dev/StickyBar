/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { use, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { nestFetch } from '@/lib/nestjs/api-client';
import { NEST_API } from '@/lib/nestjs/endpoints';
import type { ReservationDetail } from '@/lib/nestjs/types';
import { useRoleStore } from '@/stores/role.store';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft, FileText, User, Home, CreditCard,
  AlertTriangle, CheckCircle2, Shield, ShieldCheck,
  MapPin, Phone, PhoneCall, Star, Camera, History, Banknote,
  Users, Moon, TrendingUp, ExternalLink, Clock,
  ChevronUp, X, Lock,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { ReservationActionPanel } from '@/features/reservations/components/owner/ReservationActionPanel';
import { TenantReservationActionPanel } from '@/features/reservations/components/tenant/TenantReservationActionPanel';
import { PhotosEtatLieuSection } from '@/features/reservations/components/owner/PhotosEtatLieuSection';
import { ReservationPaymentCard } from '@/features/reservations/components/shared/ReservationPaymentCard';
import { ReservationTimeline } from '@/features/reservations/components/shared/ReservationTimeline';
import { canSeeCoordonnees } from '@/features/reservations/utils';

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

function fcfa(n: number) {
  return new Intl.NumberFormat('fr-FR').format(Math.round(n));
}

function dateLong(s: string) {
  return new Date(s).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

function dateTime(s: string) {
  return new Date(s).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

/* ─── Config statut (Klef Design System v2) ───────────────────────────── */

const STATUT_CFG: Record<string, {
  label: string;
  badge: string;
  dot: string;
  icon: typeof CheckCircle2;
}> = {
  PENDING:    { label: 'En attente',      badge: 'bg-warning-50/20 text-warning-400 border-warning-400/30', dot: 'bg-warning-400', icon: Clock },
  PAID:       { label: 'Sous séquestre',  badge: 'bg-forest-900/90 text-lime-300 border-lime-400/30',       dot: 'bg-lime-400',    icon: ShieldCheck },
  CONFIRMED:  { label: 'Confirmée',       badge: 'bg-forest-900/90 text-lime-300 border-lime-400/30',       dot: 'bg-lime-400',    icon: CheckCircle2 },
  CHECKED_IN: { label: 'Séjour en cours', badge: 'bg-forest-900/90 text-lime-300 border-lime-400/30 ring-1 ring-lime-400/50', dot: 'bg-lime-400', icon: CheckCircle2 },
  COMPLETED:  { label: 'Terminée',        badge: 'bg-neutral-800/60 text-neutral-300 border-neutral-700/50', dot: 'bg-neutral-400', icon: CheckCircle2 },
  CANCELLED:  { label: 'Annulée',         badge: 'bg-error-500/20 text-error-400 border-error-500/30',       dot: 'bg-error-400',   icon: AlertTriangle },
  DISPUTED:   { label: 'Litige',          badge: 'bg-error-500/20 text-error-400 border-error-500/30',       dot: 'bg-error-400',   icon: AlertTriangle },
  EXPIRED:    { label: 'Expirée',         badge: 'bg-neutral-800/60 text-neutral-400 border-neutral-700/50', dot: 'bg-neutral-400', icon: Clock },
};

const HISTORIQUE_CFG: Record<string, { label: string; icon: typeof CheckCircle2; accent: string }> = {
  PENDING:    { label: 'Réservation créée',     icon: Clock,         accent: 'text-warning-400 bg-warning-50/20 border-warning-400/30' },
  PAID:       { label: 'Paiement confirmé',     icon: Banknote,      accent: 'text-lime-300 bg-forest-900/90 border-lime-400/30' },
  CONFIRMED:  { label: 'Réservation confirmée', icon: CheckCircle2,  accent: 'text-lime-300 bg-forest-900/90 border-lime-400/30' },
  CHECKED_IN: { label: 'Check-in effectué',     icon: CheckCircle2,  accent: 'text-lime-300 bg-forest-900/90 border-lime-400/30' },
  COMPLETED:  { label: 'Séjour terminé',        icon: CheckCircle2,  accent: 'text-neutral-300 bg-neutral-800/60 border-neutral-700/50' },
  CANCELLED:  { label: 'Annulée',               icon: AlertTriangle, accent: 'text-error-400 bg-error-500/20 border-error-500/30' },
  DISPUTED:   { label: 'Litige déclaré',        icon: AlertTriangle, accent: 'text-error-400 bg-error-500/20 border-error-500/30' },
  EXPIRED:    { label: 'Expirée',               icon: Clock,         accent: 'text-neutral-400 bg-neutral-800/60 border-neutral-700/50' },
};

/* ─── Skeleton Premium ────────────────────────────────────────────────────── */

export function ReservationDetailSkeleton() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 lg:pt-12 pb-24 space-y-6">
      {/* Navigation retour */}
      <div className="flex items-center justify-between">
        <div className="h-8 w-36 bg-background-alt border border-border rounded-pill animate-pulse" />
        <div className="h-7 w-28 bg-background-alt border border-border rounded-pill animate-pulse" />
      </div>

      {/* Hero dark card */}
      <div className="bg-forest-950 rounded-card overflow-hidden border border-forest-800/90 animate-pulse p-6 md:p-8 space-y-6">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1 space-y-5">
            <div className="flex items-center gap-3">
              <div className="h-7 w-28 bg-forest-900/80 rounded-pill" />
              <div className="h-4 w-36 bg-forest-900/80 rounded-inner" />
            </div>
            <div className="space-y-2">
              <div className="h-3 w-32 bg-forest-900/80 rounded" />
              <div className="h-8 w-72 bg-forest-900/80 rounded-inner" />
            </div>
            <div className="h-16 w-full max-w-sm bg-forest-900/60 rounded-inner" />
            <div className="h-5 w-32 bg-forest-900/80 rounded-inner" />
          </div>
          <div className="md:w-56 shrink-0 space-y-3">
            <div className="h-36 w-full bg-forest-900/80 rounded-inner" />
            <div className="h-20 bg-forest-900/80 rounded-inner" />
          </div>
        </div>
      </div>

      {/* Cards skeleton */}
      <div className="grid md:grid-cols-2 gap-5">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="bg-background-card rounded-card border border-border/80 p-5 space-y-4 animate-pulse">
            <div className="h-6 w-32 bg-background-alt rounded-inner" />
            <div className="h-24 w-full bg-background-alt rounded-inner" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Composants utilitaires : Cards ─────────────────────────────────────── */

function DarkCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn(
      'bg-forest-950 text-white border border-forest-800/90 rounded-card overflow-hidden shadow-xl relative',
      className,
    )}>
      {children}
    </div>
  );
}

function GlassCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn(
      'bg-background-card border border-border/80 rounded-card p-5 space-y-4 shadow-2xs',
      className,
    )}>
      {children}
    </div>
  );
}

function DarkCardHeader({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle?: string }) {
  return (
    <div className="flex items-center gap-3 px-6 py-4 border-b border-forest-800/80">
      <div className="w-8 h-8 rounded-inner bg-forest-900 border border-lime-400/20 text-lime-400 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div>
        <h4 className="font-display text-base font-bold text-white">{title}</h4>
        {subtitle && <p className="text-xs text-forest-300 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

function GlassCardHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2.5 pb-3 border-b border-border/60">
      <div className="w-8 h-8 rounded-inner bg-forest-950 text-lime-400 border border-lime-400/20 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <h4 className="font-display text-base font-bold text-forest-950">{title}</h4>
    </div>
  );
}

/* ─── Page Principale ─────────────────────────────────────────────────────── */

export default function ReservationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { userId, activeRole } = useRoleStore();

  const { data: res, isLoading, error, refetch } = useQuery<ReservationDetail>({
    queryKey: ['reservation', id],
    queryFn: () => nestFetch<ReservationDetail>(NEST_API.RESERVATIONS.FIND_ONE(id)),
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  const [panelOpen, setPanelOpen] = useState(false);

  if (isLoading) return <ReservationDetailSkeleton />;

  if (error || !res) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-error-50 border border-error-200 rounded-card p-6 text-center space-y-3 max-w-md mx-auto">
          <div className="w-12 h-12 rounded-inner bg-error-100 flex items-center justify-center mx-auto text-error-700">
            <AlertTriangle className="w-6 h-6 text-error-600" />
          </div>
          <p className="text-sm text-error-800 font-bold">Impossible de charger cette réservation.</p>
          <Link
            href="/dashboard/reservations"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-pill bg-forest-900 text-white font-bold text-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Retour à mes réservations</span>
          </Link>
        </div>
      </div>
    );
  }

  const cfg = STATUT_CFG[res.statut] ?? STATUT_CFG.PENDING;
  const StatusIcon = cfg.icon;
  const isOwner = res.proprietaire.id === userId && activeRole === 'PROPRIETAIRE';
  const canSeePhone = canSeeCoordonnees(res.statut, res.dateDebut);
  const mainPhoto = res.logement.photos.find((p) => p.estPrincipale)?.url ?? res.logement.photos[0]?.url;
  const checkinPhotos = res.photosEtatLieu.filter((p) => p.type === 'CHECKIN');
  const checkoutPhotos = res.photosEtatLieu.filter((p) => p.type === 'CHECKOUT');
  const commissionPct = Math.round(res.tauxCommission * 100);
  const ownPct = 100 - commissionPct;
  const ACTIVE_STATUTS = ['PENDING', 'PAID', 'CONFIRMED', 'CHECKED_IN', 'COMPLETED', 'DISPUTED'];
  const TENANT_ACTIVE_STATUTS = ['CONFIRMED', 'COMPLETED'];
  const showStickyBar = (isOwner && ACTIVE_STATUTS.includes(res.statut)) || (!isOwner && TENANT_ACTIVE_STATUTS.includes(res.statut));

  const OWNER_PANEL_CTA: Record<string, { label: string; btnLabel: string; btnCls: string; chipBg: string; chipIcon: string }> = {
    PENDING:    { label: 'En attente du paiement', btnLabel: 'Voir',    btnCls: 'bg-forest-900 text-white border border-forest-800',                     chipBg: 'bg-warning-50/20 border-warning-400/30', chipIcon: 'text-warning-400' },
    PAID:       { label: 'Décision requise',        btnLabel: 'Décider', btnCls: 'bg-lime-400 text-forest-950 font-extrabold shadow-md',                 chipBg: 'bg-forest-900 border-lime-400/30',       chipIcon: 'text-lime-400' },
    CONFIRMED:  { label: 'Check-in à gérer',        btnLabel: 'Gérer',   btnCls: 'bg-lime-400 text-forest-950 font-extrabold shadow-md',                 chipBg: 'bg-forest-900 border-lime-400/30',       chipIcon: 'text-lime-400' },
    CHECKED_IN: { label: 'Check-out à gérer',       btnLabel: 'Gérer',   btnCls: 'bg-error-500 text-white font-extrabold shadow-md',                     chipBg: 'bg-error-500/20 border-error-500/30',    chipIcon: 'text-error-400' },
    COMPLETED:  { label: 'Noter votre expérience',  btnLabel: 'Noter',   btnCls: 'bg-lime-400 text-forest-950 font-extrabold shadow-md',                 chipBg: 'bg-forest-900 border-lime-400/30',       chipIcon: 'text-lime-400' },
    DISPUTED:   { label: 'Litige en cours',         btnLabel: 'Voir',    btnCls: 'bg-error-500 text-white font-extrabold shadow-md',                     chipBg: 'bg-error-500/20 border-error-500/30',    chipIcon: 'text-error-400' },
  };

  const TENANT_PANEL_CTA: Record<string, { label: string; btnLabel: string; btnCls: string; chipBg: string; chipIcon: string }> = {
    CONFIRMED:  { label: 'Check-in à valider',       btnLabel: 'Valider', btnCls: 'bg-lime-400 text-forest-950 font-extrabold shadow-md',                 chipBg: 'bg-forest-900 border-lime-400/30',       chipIcon: 'text-lime-400' },
    COMPLETED:  { label: 'Noter votre séjour',       btnLabel: 'Noter',   btnCls: 'bg-lime-400 text-forest-950 font-extrabold shadow-md',                 chipBg: 'bg-forest-900 border-lime-400/30',       chipIcon: 'text-lime-400' },
  };

  const cta = (isOwner ? OWNER_PANEL_CTA[res.statut] : TENANT_PANEL_CTA[res.statut]) ?? {
    label: cfg.label, btnLabel: 'Voir', btnCls: 'bg-forest-900 text-white border border-forest-800', chipBg: 'bg-forest-900 border-forest-800', chipIcon: 'text-forest-200',
  };

  return (
    <>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 lg:pt-12 pb-40 lg:pb-24 space-y-6">

        {/* ── Navigation Retour + RÉF ── */}
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard/reservations"
            className="inline-flex items-center gap-2 text-xs font-bold text-foreground-muted hover:text-forest-950 transition-colors group"
          >
            <span className="w-8 h-8 rounded-inner bg-background-alt border border-border flex items-center justify-center group-hover:border-forest-300 transition-colors">
              <ArrowLeft className="w-4 h-4 text-forest-700" />
            </span>
            <span>Retour aux réservations</span>
          </Link>

          <span className="text-[11px] font-mono font-bold text-foreground-faint bg-background-alt border border-border/80 px-3.5 py-1.5 rounded-pill tracking-wider">
            RÉF: #{res.id.slice(0, 8).toUpperCase()}
          </span>
        </div>

        {/* ══ HERO PRINCIPAL DE LA RÉSERVATION ══ */}
        <div className="relative rounded-card border border-forest-800/90 bg-gradient-to-b from-forest-950 via-forest-900 to-forest-950 p-6 md:p-8 shadow-2xl overflow-hidden text-white">
          {/* Halos de fond */}
          <div className="pointer-events-none absolute -top-24 -right-24 w-64 h-64 rounded-full bg-lime-400/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 w-64 h-64 rounded-full bg-forest-600/20 blur-3xl" />

          <div className="relative flex flex-col md:flex-row md:items-start gap-6">

            {/* Colonne Gauche */}
            <div className="flex-1 min-w-0 space-y-4">
              <div className="flex items-center gap-3 flex-wrap">
                <span className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1 rounded-pill border text-xs font-bold backdrop-blur-md',
                  cfg.badge,
                )}>
                  <span className={cn('w-1.5 h-1.5 rounded-full animate-pulse', cfg.dot)} />
                  <StatusIcon className="w-3.5 h-3.5" />
                  {cfg.label}
                </span>
                <span className="text-xs text-forest-300/80 font-medium">
                  Créée le {dateLong(res.creeLe)}
                </span>
              </div>

              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-forest-300 mb-1">
                  {res.logement.type} · {res.logement.ville}
                  {res.logement.quartier ? ` · ${res.logement.quartier}` : ''}
                </p>
                <h1 className="font-display text-2xl md:text-3xl font-bold text-white leading-tight tracking-tight">
                  {res.logement.titre}
                </h1>
              </div>

              {/* Widget Dates Box */}
              <div className="flex items-stretch bg-forest-900/60 border border-forest-800/80 rounded-inner overflow-hidden w-full max-w-sm backdrop-blur-md">
                <div className="flex-1 px-4 py-3 text-center">
                  <p className="text-[9px] font-extrabold uppercase tracking-wider text-forest-300 mb-1">Arrivée</p>
                  <p className="text-sm font-bold text-white">{dateLong(res.dateDebut)}</p>
                  {res.confirmeeLe && (
                    <p className="text-[10px] font-semibold text-lime-300 mt-1 flex items-center justify-center gap-1">
                      <Clock className="w-3 h-3 text-lime-400" />
                      {new Date(res.dateDebut).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  )}
                </div>

                <div className="flex flex-col items-center justify-center px-4 border-x border-forest-800/80 bg-forest-950/40">
                  <Moon className="w-4 h-4 text-lime-400" />
                  <span className="text-base font-extrabold text-white tabular-nums leading-none mt-0.5">{res.nbNuits}</span>
                  <span className="text-[8px] font-bold text-forest-300 uppercase">nuit{res.nbNuits > 1 ? 's' : ''}</span>
                </div>

                <div className="flex-1 px-4 py-3 text-center">
                  <p className="text-[9px] font-extrabold uppercase tracking-wider text-forest-300 mb-1">Départ</p>
                  <p className="text-sm font-bold text-white">{dateLong(res.dateFin)}</p>
                  {res.confirmeeLe && (
                    <p className="text-[10px] font-semibold text-forest-300 mt-1 flex items-center justify-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(res.dateFin).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs font-semibold text-forest-200">
                <Users className="w-4 h-4 text-lime-400" />
                <span>{res.nbPersonnes} voyageur{res.nbPersonnes > 1 ? 's' : ''}</span>
              </div>
            </div>

            {/* Colonne Droite : Photo & Revenu Net */}
            <div className="flex flex-col gap-3 md:w-56 shrink-0">
              {mainPhoto && (
                <div className="relative w-full h-36 md:h-40 rounded-inner overflow-hidden border border-forest-800 bg-forest-950">
                  <Image src={mainPhoto} alt={res.logement.titre} fill className="object-cover" />
                </div>
              )}

              <div className="rounded-inner bg-forest-900/80 border border-forest-800/80 p-4 text-center backdrop-blur-md space-y-1">
                <p className="text-[9px] font-extrabold uppercase tracking-wider text-neutral-300">Votre Revenu Net</p>
                <p className="font-display text-2xl font-extrabold text-lime-400 leading-none">{fcfa(res.netProprietaire)}</p>
                <p className="text-[10px] font-bold text-neutral-400">FCFA</p>
              </div>
            </div>

          </div>
        </div>

        {/* ══ ACTIONS PROPRIÉTAIRE — desktop inline ══ */}
        {isOwner && (
          <div className="hidden lg:block">
            <ReservationActionPanel id={id} res={res} onRefetch={refetch} />
          </div>
        )}

        {/* ══ ACTIONS LOCATAIRE — desktop inline ══ */}
        {!isOwner && (
          <div className="hidden lg:block">
            <TenantReservationActionPanel id={id} res={res} onRefetch={refetch} />
          </div>
        )}

        {/* ══ CONTRAT DE LOCATION KLEF ══ */}
        <div className="bg-forest-950 text-white rounded-card p-5 border border-forest-800/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-inner bg-forest-900 border border-forest-800 flex items-center justify-center text-lime-400 shrink-0">
              <FileText className="w-5 h-5 text-lime-400" />
            </div>
            <div>
              <p className="font-display text-base font-bold text-white">Contrat de location vérifié</p>
              <p className="text-xs text-neutral-300">Généré automatiquement par Klef · Horodaté & Signé numériquement</p>
            </div>
          </div>

          <Link
            href={`/dashboard/reservations/${id}/contrat`}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-pill bg-lime-400 hover:bg-lime-300 text-forest-950 font-extrabold text-xs shadow-md transition-all active:scale-95"
          >
            <ExternalLink className="w-4 h-4 text-forest-950" />
            <span>Consulter le Contrat PDF</span>
          </Link>
        </div>

        {/* ══ GRILLE LOCATAIRE + LOGEMENT ══ */}
        <div className="grid md:grid-cols-2 gap-5">
          {/* Card Locataire */}
          <GlassCard>
            <GlassCardHeader icon={<User className="w-4 h-4 text-lime-400" />} title="Locataire" />

            <div className="flex items-center gap-3.5">
              <div className="relative shrink-0">
                <div className="w-14 h-14 rounded-inner bg-forest-950 text-lime-400 font-display font-extrabold text-base flex items-center justify-center border border-lime-400/20 overflow-hidden shadow-2xs">
                  {res.locataire.avatarUrl ? (
                    <Image src={res.locataire.avatarUrl} alt="" fill className="object-cover" />
                  ) : (
                    `${res.locataire.prenom[0]}${res.locataire.nom[0]}`.toUpperCase()
                  )}
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-lime-400 border-2 border-background-card rounded-full" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-foreground-muted mb-0.5">Locataire réservataire</p>
                <h4 className="font-display text-base font-bold text-forest-950 leading-tight truncate">
                  {res.locataire.prenom} {res.locataire.nom}
                </h4>
                <div className="mt-1">
                  {res.locataire.statutKyc === 'VERIFIE' ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-forest-800 bg-forest-50 border border-forest-100 px-2.5 py-0.5 rounded-pill">
                      <ShieldCheck className="w-3 h-3 text-forest-600" />
                      <span>Identité vérifiée (KYC)</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-warning-700 bg-warning-50 border border-warning-200 px-2.5 py-0.5 rounded-pill">
                      <AlertTriangle className="w-3 h-3 text-warning-600" />
                      <span>KYC {res.locataire.statutKyc?.toLowerCase() ?? 'Non vérifié'}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Téléphone & Note */}
            <div className="space-y-3 pt-3 border-t border-border/60">
              {canSeePhone && res.locataire.telephone ? (
                <a
                  href={`tel:${res.locataire.telephone}`}
                  className="flex items-center gap-3.5 w-full bg-forest-950 hover:bg-forest-900 border border-forest-800 rounded-inner p-3.5 transition-all group"
                >
                  <div className="w-9 h-9 rounded-inner bg-lime-400 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                    <PhoneCall className="w-4 h-4 text-forest-950" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-300">Appeler le locataire</p>
                    <p className="text-sm font-mono font-extrabold text-lime-400 tracking-wide">{res.locataire.telephone}</p>
                  </div>
                </a>
              ) : (
                <div className="flex items-center gap-3.5 bg-background-alt border border-border/80 rounded-inner p-3.5">
                  <div className="w-9 h-9 rounded-inner bg-background-card border border-border flex items-center justify-center shrink-0">
                    <Lock className="w-4 h-4 text-foreground-faint" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-forest-950">Numéro masqué</p>
                    <p className="text-[10px] text-foreground-muted mt-0.5 leading-relaxed">
                      Visible 48h avant le check-in
                    </p>
                  </div>
                  <Phone className="w-4 h-4 text-foreground-faint shrink-0" />
                </div>
              )}

              {/* Note Locataire */}
              <div className="flex items-center gap-2.5 bg-gold-50 border border-gold-100 rounded-inner p-3">
                <Star className="w-4 h-4 text-gold-500 fill-gold-500 shrink-0" />
                <span className="text-xs font-bold text-gold-700">Note du locataire :</span>
                <span className="text-xs font-extrabold text-forest-950">{res.locataire.noteLocataire?.toFixed(1) ?? 'Nouveau locataire'}</span>
              </div>
            </div>
          </GlassCard>

          {/* Card Logement */}
          <GlassCard>
            <GlassCardHeader icon={<Home className="w-4 h-4 text-lime-400" />} title="Logement loué" />
            
            {mainPhoto && (
              <div className="relative w-full h-32 rounded-inner overflow-hidden border border-border bg-background-alt shadow-2xs">
                <Image src={mainPhoto} alt={res.logement.titre} fill className="object-cover" />
              </div>
            )}

            <div>
              <h5 className="font-display text-base font-bold text-forest-950 leading-snug">
                {res.logement.titre}
              </h5>
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-foreground-muted mt-0.5">{res.logement.type}</p>
            </div>

            <div className="flex items-start gap-2.5 pt-3 border-t border-border/60 text-xs text-foreground-muted">
              <div className="w-7 h-7 rounded-inner bg-forest-50 border border-forest-100 flex items-center justify-center shrink-0 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-forest-700" />
              </div>
              <p className="leading-relaxed text-forest-950 font-medium">
                {res.logement.adresse}
                {res.logement.quartier ? `, ${res.logement.quartier}` : ''}
                {`, ${res.logement.ville}`}
              </p>
            </div>
          </GlassCard>
        </div>

        {/* ══ DÉTAIL FINANCIER HÔTE ══ */}
        <DarkCard className="p-6 space-y-5">
          <DarkCardHeader
            icon={<TrendingUp className="w-4 h-4 text-lime-400" />}
            title="Détail financier & Répartition"
          />

          <div className="space-y-4">
            <div className="space-y-1">
              {[
                { label: 'Prix de base',                         value: `${fcfa(res.prixBase)} FCFA`,                                                   muted: true  },
                { label: 'Supplément personnes',                  value: `+${fcfa(res.supplementPersonnes)} FCFA`,                                       muted: true  },
                { label: `Réduction (${res.nbNuits} nuits)`,     value: res.reductionNuits > 0 ? `-${fcfa(res.reductionNuits)} FCFA` : '—',            muted: true  },
                { label: 'Total payé par le locataire',           value: `${fcfa(res.totalLocataire)} FCFA`,          bold: true                              },
                { label: `Commission Klef (${commissionPct}%)`, value: `-${fcfa(res.montantCommission)} FCFA`,     muted: true, red: true                  },
                { label: 'Votre revenu net',                      value: `${fcfa(res.netProprietaire)} FCFA`,         bold: true, highlightNet: true          },
              ].map((row) => (
                <div key={row.label} className={cn(
                  'flex items-center justify-between py-2.5',
                  !row.muted && 'border-t border-forest-800/80 pt-3',
                )}>
                  <span className={cn('text-sm', row.bold ? 'font-bold text-white' : 'font-medium text-neutral-300')}>
                    {row.label}
                  </span>
                  <span className={cn(
                    'text-sm font-bold',
                    row.highlightNet
                      ? 'font-display text-xl text-lime-400 bg-lime-400/10 px-3 py-1 rounded-pill border border-lime-400/20'
                      : row.red
                        ? 'text-rose-400'
                        : row.bold
                          ? 'text-white'
                          : 'text-neutral-200',
                  )}>
                    {row.value}
                  </span>
                </div>
              ))}
            </div>

            {/* Barre de répartition */}
            <div className="space-y-2 pt-3 border-t border-forest-800/80">
              <div className="flex justify-between text-[10px] font-extrabold uppercase tracking-wider text-neutral-400">
                <span>Votre part — {ownPct}%</span>
                <span>Commission Klef — {commissionPct}%</span>
              </div>
              <div className="h-2 rounded-pill bg-forest-900 overflow-hidden">
                <div
                  className="h-full rounded-pill bg-gradient-to-r from-lime-400 to-lime-500 transition-all duration-700"
                  style={{ width: `${ownPct}%` }}
                />
              </div>
            </div>

            {/* Info séquestre */}
            <div className="flex items-start gap-3 bg-forest-900/80 border border-forest-800 rounded-inner p-3.5">
              <Shield className="w-4 h-4 text-lime-400 shrink-0 mt-0.5" />
              <p className="text-xs text-neutral-200 font-medium leading-relaxed">
                La commission de <span className="text-white font-bold">{commissionPct}%</span> couvre la garantie de paiement sous séquestre, le support 7j/7 et la protection contre les dégradations.
              </p>
            </div>
          </div>
        </DarkCard>

        {/* ══ PAIEMENT LOCATAIRE ══ */}
        <ReservationPaymentCard paiement={res.paiement} />

        {/* ══ PHOTOS ÉTAT DES LIEUX ══ */}
        <PhotosEtatLieuSection
          checkinPhotos={checkinPhotos}
          checkoutPhotos={checkoutPhotos}
        />

        {/* ══ LITIGE ÉVENTUEL ══ */}
        {res.litige && (
          <div className="bg-forest-950 border border-error-500/30 rounded-card overflow-hidden shadow-2xl p-6 space-y-5 text-white">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-inner bg-error-500/20 border border-error-500/30 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5 text-error-400" />
                </div>
                <div>
                  <h4 className="font-display text-base font-bold text-white">Litige déclaré</h4>
                  <p className="text-xs text-forest-300 mt-0.5">
                    Par le {isOwner ? 'propriétaire' : 'locataire'}
                  </p>
                </div>
              </div>
              <span className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1 rounded-pill text-xs font-bold shrink-0',
                res.litige.statut === 'EN_ATTENTE' && 'bg-warning-50/20 text-warning-400 border border-warning-400/30',
                res.litige.statut === 'FONDE' && 'bg-error-500/20 text-error-400 border border-error-500/30',
                res.litige.statut === 'NON_FONDE' && 'bg-forest-900 text-lime-300 border border-lime-400/30',
              )}>
                <span className={cn('w-1.5 h-1.5 rounded-full animate-pulse',
                  res.litige.statut === 'EN_ATTENTE' && 'bg-warning-400',
                  res.litige.statut === 'FONDE' && 'bg-error-400',
                  res.litige.statut === 'NON_FONDE' && 'bg-lime-400',
                )} />
                {res.litige.statut === 'EN_ATTENTE' && 'En cours d\'examen'}
                {res.litige.statut === 'FONDE' && 'Litige fondé'}
                {res.litige.statut === 'NON_FONDE' && 'Litige non fondé'}
              </span>
            </div>

            {/* Motif & Description */}
            <div className="bg-forest-900/60 border border-forest-800/80 rounded-inner p-4 space-y-2">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-forest-300">Motif du litige</p>
              <p className="text-sm font-bold text-white">
                {res.litige.motif === 'DEPASSEMENT_PERSONNES' && 'Dépassement du nombre de voyageurs'}
                {res.litige.motif === 'DEGRADATION' && 'Dégradation du logement'}
                {res.litige.motif === 'LOGEMENT_NON_CONFORME' && 'Logement non conforme'}
                {res.litige.motif === 'NON_PAIEMENT' && 'Non-paiement de frais supplémentaires'}
                {res.litige.motif === 'NUISANCES' && 'Nuisances ou comportement inapproprié'}
                {res.litige.motif === 'AUTRE' && 'Autre motif'}
                {!['DEPASSEMENT_PERSONNES', 'DEGRADATION', 'LOGEMENT_NON_CONFORME', 'NON_PAIEMENT', 'NUISANCES', 'AUTRE'].includes(res.litige.motif) && res.litige.motif.replace(/_/g, ' ')}
              </p>
            </div>

            <div className="bg-forest-900/60 border border-forest-800/80 rounded-inner p-4 space-y-2">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-forest-300">Description</p>
              <p className="text-xs text-forest-200 leading-relaxed">{res.litige.description}</p>
            </div>

            <div className="flex items-center gap-2 text-xs text-forest-300">
              <Clock className="w-3.5 h-3.5 shrink-0" />
              <span>Ouvert le {new Date(res.litige.creeLe).toLocaleDateString('fr-FR', {
                weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
              })}</span>
            </div>
          </div>
        )}

        {/* ══ CHRONOLOGIE DÉTAILLÉE ══ */}
        <ReservationTimeline historique={res.historique} variant="dark" isOwner={true} />

      </div>

      {/* ══ BARRE STICKY MOBILE ══ */}
      {showStickyBar && (
        <div className="lg:hidden fixed bottom-[76px] left-0 right-0 z-30 px-3">
          <button
            onClick={() => setPanelOpen(true)}
            className="w-full rounded-card border border-forest-800/90 bg-forest-950/95 backdrop-blur-xl shadow-2xl overflow-hidden active:scale-[0.985] transition-transform"
          >
            <div className="flex items-center gap-3 px-4 py-3.5">
              <div className={cn('w-9 h-9 rounded-inner border flex items-center justify-center shrink-0', cta.chipBg)}>
                <StatusIcon className={cn('w-4 h-4', cta.chipIcon)} />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-black text-white leading-tight truncate">{cta.label}</p>
                <p className="text-[11px] font-medium text-forest-300 mt-0.5 truncate">
                  {res.locataire.prenom} {res.locataire.nom} · {res.nbNuits} nuit{res.nbNuits > 1 ? 's' : ''}
                </p>
              </div>
              <span className={cn('flex items-center gap-1.5 px-4 py-2.5 rounded-pill text-xs font-extrabold shrink-0', cta.btnCls)}>
                {cta.btnLabel}
                <ChevronUp className="w-3.5 h-3.5" />
              </span>
            </div>
          </button>
        </div>
      )}

      {/* ══ BOTTOM SHEET MOBILE ══ */}
      {showStickyBar && panelOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 z-30 bg-black/60 backdrop-blur-sm"
            onClick={() => setPanelOpen(false)}
          />
          <div className="lg:hidden fixed inset-x-0 bottom-0 z-40 bg-background rounded-t-card max-h-[88dvh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-background z-10 pt-3">
              <div className="flex justify-center mb-2.5">
                <div className="w-10 h-1 rounded-pill bg-border" />
              </div>
              <div className="flex items-center justify-between px-5 pb-3.5 border-b border-border/60">
                <div className="flex items-center gap-2.5">
                  <span className={cn('w-2 h-2 rounded-full', cfg.dot)} />
                  <p className="font-display text-sm font-bold text-forest-950">{cfg.label}</p>
                </div>
                <button
                  onClick={() => setPanelOpen(false)}
                  className="w-8 h-8 rounded-inner bg-background-alt hover:bg-border flex items-center justify-center transition-colors active:scale-90"
                >
                  <X className="w-4 h-4 text-foreground-muted" />
                </button>
              </div>
            </div>
            <div className="p-4 pb-10">
              {isOwner ? (
                <ReservationActionPanel
                  id={id}
                  res={res}
                  onRefetch={() => { refetch(); setTimeout(() => setPanelOpen(false), 1500); }}
                />
              ) : (
                <TenantReservationActionPanel
                  id={id}
                  res={res}
                  onRefetch={() => { refetch(); setTimeout(() => setPanelOpen(false), 1500); }}
                />
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
