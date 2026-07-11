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
  AlertTriangle, CheckCircle2, Shield,
  MapPin, Phone, Star, Camera, History, Banknote,
  Users, Moon, TrendingUp, ExternalLink, Clock,
  ChevronUp, X, XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { ReservationActionPanel } from '@/features/reservations/components/owner/ReservationActionPanel';
import { TenantReservationActionPanel } from '@/features/reservations/components/tenant/TenantReservationActionPanel';
import { PhotosEtatLieuSection } from '@/features/reservations/components/owner/PhotosEtatLieuSection';
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

/* ─── Config statut ───────────────────────────────────────────────────────── */

const STATUT_CFG: Record<string, {
  label: string;
  gradient: string;
  badge: string;
  dot: string;
  glow: string;
  icon: typeof CheckCircle2;
}> = {
  PENDING:    { label: 'En attente',      gradient: 'from-amber-400 to-amber-500',     badge: 'bg-amber-400/15 text-amber-300 border-amber-400/30',       dot: 'bg-amber-400',   glow: 'shadow-amber-500/20',    icon: Clock         },
  PAID:       { label: 'Paiement reçu',   gradient: 'from-emerald-400 to-emerald-500', badge: 'bg-emerald-400/15 text-emerald-300 border-emerald-400/30', dot: 'bg-emerald-400', glow: 'shadow-emerald-500/20',  icon: CheckCircle2  },
  CONFIRMED:  { label: 'Confirmée',       gradient: 'from-emerald-400 to-emerald-500', badge: 'bg-emerald-400/15 text-emerald-300 border-emerald-400/30', dot: 'bg-emerald-400', glow: 'shadow-emerald-500/20',  icon: CheckCircle2  },
  CHECKED_IN: { label: 'Séjour en cours', gradient: 'from-emerald-500 to-emerald-600', badge: 'bg-emerald-400/15 text-emerald-300 border-emerald-400/30', dot: 'bg-emerald-400', glow: 'shadow-emerald-500/20',  icon: CheckCircle2  },
  COMPLETED:  { label: 'Terminée',        gradient: 'from-neutral-500 to-neutral-600', badge: 'bg-neutral-400/10 text-neutral-400 border-neutral-400/20', dot: 'bg-neutral-400', glow: 'shadow-neutral-500/10',  icon: CheckCircle2  },
  CANCELLED:  { label: 'Annulée',         gradient: 'from-rose-500 to-rose-600',       badge: 'bg-rose-400/15 text-rose-300 border-rose-400/30',          dot: 'bg-rose-400',    glow: 'shadow-rose-500/20',     icon: AlertTriangle },
  DISPUTED:   { label: 'Litige',          gradient: 'from-rose-600 to-red-700',        badge: 'bg-rose-500/15 text-rose-300 border-rose-500/30',          dot: 'bg-rose-500',    glow: 'shadow-rose-600/30',     icon: AlertTriangle },
  EXPIRED:    { label: 'Expirée',         gradient: 'from-neutral-400 to-neutral-500', badge: 'bg-neutral-400/10 text-neutral-400 border-neutral-400/20', dot: 'bg-neutral-400', glow: 'shadow-neutral-500/10',  icon: Clock         },
};

const HISTORIQUE_CFG: Record<string, { label: string; icon: typeof CheckCircle2; accent: string }> = {
  PENDING:    { label: 'Réservation créée',     icon: Clock,         accent: 'text-amber-400 bg-amber-400/10 border-amber-400/20'    },
  PAID:       { label: 'Paiement confirmé',     icon: Banknote,      accent: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' },
  CONFIRMED:  { label: 'Réservation confirmée', icon: CheckCircle2,  accent: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' },
  CHECKED_IN: { label: 'Check-in effectué',     icon: CheckCircle2,  accent: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' },
  COMPLETED:  { label: 'Séjour terminé',        icon: CheckCircle2,  accent: 'text-neutral-400 bg-neutral-400/10 border-neutral-400/20' },
  CANCELLED:  { label: 'Annulée',               icon: AlertTriangle, accent: 'text-rose-400 bg-rose-400/10 border-rose-400/20'          },
  DISPUTED:   { label: 'Litige déclaré',        icon: AlertTriangle, accent: 'text-rose-400 bg-rose-400/10 border-rose-400/20'          },
  EXPIRED:    { label: 'Expirée',               icon: Clock,         accent: 'text-neutral-500 bg-neutral-500/10 border-neutral-500/20' },
};

const FOURNISSEUR_LABEL: Record<string, string> = {
  WAVE: 'Wave', ORANGE_MONEY: 'Orange Money', PAYDUNYA: 'PayDunya', STRIPE: 'Carte bancaire',
};

const FOURNISSEUR_BADGE: Record<string, string> = {
  WAVE:         'bg-sky-400/10 text-sky-300 border-sky-400/20',
  ORANGE_MONEY: 'bg-orange-400/10 text-orange-300 border-orange-400/20',
  PAYDUNYA:     'bg-emerald-400/10 text-emerald-300 border-emerald-400/20',
  STRIPE:       'bg-violet-400/10 text-violet-300 border-violet-400/20',
};

/* ─── Skeleton Premium ────────────────────────────────────────────────────── */

export function ReservationDetailSkeleton() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-6 pb-16 space-y-5">
      {/* Retour */}
      <div className="flex items-center justify-between">
        <div className="h-5 w-32 bg-neutral-100 rounded-lg animate-pulse" />
        <div className="h-6 w-20 bg-neutral-100 rounded-lg animate-pulse" />
      </div>

      {/* Hero dark card */}
      <div className="bg-surface-dark rounded-3xl overflow-hidden animate-pulse">
        <div className="h-1 w-full bg-neutral-700" />
        <div className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1 space-y-5">
              <div className="flex items-center gap-3">
                <div className="h-7 w-28 bg-white/8 rounded-xl" />
                <div className="h-4 w-36 bg-white/8 rounded-lg" />
              </div>
              <div className="space-y-2">
                <div className="h-3 w-32 bg-white/8 rounded" />
                <div className="h-8 w-72 bg-white/8 rounded-xl" />
              </div>
              <div className="h-16 w-full max-w-md bg-white/8 rounded-2xl" />
              <div className="h-5 w-32 bg-white/8 rounded-lg" />
            </div>
            <div className="md:w-60 shrink-0 space-y-3">
              <div className="h-44 w-full bg-white/8 rounded-2xl" />
              <div className="h-20 bg-white/8 rounded-2xl" />
            </div>
          </div>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-neutral-900 rounded-2xl p-5 animate-pulse space-y-3">
            <div className="h-3 w-20 bg-white/8 rounded" />
            <div className="h-8 w-28 bg-white/8 rounded-xl" />
            <div className="h-2 w-10 bg-white/8 rounded" />
          </div>
        ))}
      </div>

      {/* Contract */}
      <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-5 animate-pulse flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-neutral-100 rounded-2xl" />
          <div className="space-y-2">
            <div className="h-4 w-40 bg-neutral-100 rounded-lg" />
            <div className="h-3 w-52 bg-neutral-100 rounded" />
          </div>
        </div>
        <div className="h-9 w-28 bg-neutral-100 rounded-xl" />
      </div>

      {/* Locataire + Logement */}
      <div className="grid md:grid-cols-2 gap-4">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden animate-pulse">
            <div className="px-5 py-4 border-b border-neutral-100 flex items-center gap-3">
              <div className="w-8 h-8 bg-neutral-100 rounded-xl" />
              <div className="h-4 w-24 bg-neutral-100 rounded-lg" />
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-neutral-100 rounded-2xl" />
                <div className="space-y-2">
                  <div className="h-4 w-36 bg-neutral-100 rounded-lg" />
                  <div className="h-5 w-28 bg-neutral-100 rounded-full" />
                </div>
              </div>
              <div className="border-t border-neutral-100 pt-3 space-y-2.5">
                <div className="h-4 w-full bg-neutral-100 rounded-lg" />
                <div className="h-4 w-3/4 bg-neutral-100 rounded-lg" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Financial */}
      <div className="bg-surface-dark rounded-2xl overflow-hidden animate-pulse">
        <div className="px-6 py-5 border-b border-neutral-800 flex items-center gap-3">
          <div className="w-8 h-8 bg-white/8 rounded-xl" />
          <div className="h-4 w-32 bg-white/8 rounded-lg" />
        </div>
        <div className="p-6 space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex justify-between py-2">
              <div className="h-4 bg-white/8 rounded-lg" style={{ width: `${40 + i * 8}%` }} />
              <div className="h-4 w-24 bg-white/8 rounded-lg" />
            </div>
          ))}
          <div className="pt-4 h-3 bg-white/8 rounded-full mt-2" />
        </div>
      </div>
    </div>
  );
}

/* ─── Composant utilitaire : Card dark glass ──────────────────────────────── */

function DarkCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn(
      'bg-primary-900 border border-primary-800/50 rounded-2xl overflow-hidden',
      'shadow-xl shadow-primary-950/60',
      className,
    )}>
      {children}
    </div>
  );
}

function GlassCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn(
      'bg-white/80 backdrop-blur-sm border border-neutral-200/80 rounded-2xl overflow-hidden',
      'shadow-sm shadow-neutral-900/5',
      className,
    )}>
      {children}
    </div>
  );
}

function DarkCardHeader({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle?: string }) {
  return (
    <div className="flex items-center gap-3 px-6 py-4 border-b border-white/6">
      <div className="w-8 h-8 rounded-xl bg-white/8 border border-white/5 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-sm font-bold text-white">{title}</p>
        {subtitle && <p className="text-xs text-neutral-500 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

function GlassCardHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-3 px-5 py-4 border-b border-neutral-200/60">
      <div className="w-8 h-8 rounded-xl bg-neutral-100 border border-neutral-200/60 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <span className="text-sm font-bold text-neutral-800">{title}</span>
    </div>
  );
}

/* ─── Page ────────────────────────────────────────────────────────────────── */

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
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex items-start gap-3 bg-rose-50 border border-rose-200 rounded-2xl p-5">
          <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          <p className="text-sm text-rose-700 font-medium">Impossible de charger cette réservation.</p>
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
    PENDING:    { label: 'En attente du paiement', btnLabel: 'Voir',    btnCls: 'bg-white/10 text-white border border-white/20',                          chipBg: 'bg-amber-400/10 border-amber-400/20',   chipIcon: 'text-amber-400'   },
    PAID:       { label: 'Décision requise',        btnLabel: 'Décider', btnCls: 'bg-amber-500 text-white shadow-lg shadow-amber-500/40',                  chipBg: 'bg-amber-400/10 border-amber-400/20',   chipIcon: 'text-amber-400'   },
    CONFIRMED:  { label: 'Check-in à gérer',        btnLabel: 'Gérer',   btnCls: 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/40',              chipBg: 'bg-emerald-400/10 border-emerald-400/20', chipIcon: 'text-emerald-400' },
    CHECKED_IN: { label: 'Check-out à gérer',       btnLabel: 'Gérer',   btnCls: 'bg-rose-500 text-white shadow-lg shadow-rose-500/40',                   chipBg: 'bg-rose-400/10 border-rose-400/20',     chipIcon: 'text-rose-400'    },
    COMPLETED:  { label: 'Noter votre expérience',  btnLabel: 'Noter',   btnCls: 'bg-gradient-to-r from-emerald-500 to-emerald-700 text-white shadow-lg shadow-emerald-500/40', chipBg: 'bg-emerald-400/10 border-emerald-400/20', chipIcon: 'text-emerald-400' },
    DISPUTED:   { label: 'Litige en cours',         btnLabel: 'Voir',    btnCls: 'bg-rose-600 text-white shadow-lg shadow-rose-600/40',                    chipBg: 'bg-rose-400/10 border-rose-400/20',     chipIcon: 'text-rose-400'    },
  };
  const TENANT_PANEL_CTA: Record<string, { label: string; btnLabel: string; btnCls: string; chipBg: string; chipIcon: string }> = {
    CONFIRMED:  { label: 'Check-in à valider',       btnLabel: 'Valider', btnCls: 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/40',              chipBg: 'bg-emerald-400/10 border-emerald-400/20', chipIcon: 'text-emerald-400' },
    COMPLETED:  { label: 'Noter votre séjour',       btnLabel: 'Noter',   btnCls: 'bg-gradient-to-r from-emerald-500 to-emerald-700 text-white shadow-lg shadow-emerald-500/40', chipBg: 'bg-emerald-400/10 border-emerald-400/20', chipIcon: 'text-emerald-400' },
  };
  const cta = (isOwner ? OWNER_PANEL_CTA[res.statut] : TENANT_PANEL_CTA[res.statut]) ?? { label: cfg.label, btnLabel: 'Voir', btnCls: 'bg-white/10 text-white border border-white/20', chipBg: 'bg-white/6 border-white/10', chipIcon: 'text-white/50' };

  return (
    <>
    <div className="max-w-5xl mx-auto px-4 py-6 pb-40 lg:pb-16 space-y-4">

      {/* ── Retour + ID ── */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard/reservations"
          className="inline-flex items-center gap-2 text-sm font-semibold text-neutral-500 hover:text-neutral-900 transition-colors group"
        >
          <span className="w-7 h-7 rounded-xl bg-neutral-100 border border-neutral-200 flex items-center justify-center group-hover:bg-neutral-200 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
          </span>
          Réservations
        </Link>
        <span className="text-[10px] font-mono font-bold text-neutral-500 bg-neutral-100 border border-neutral-200 px-3 py-1.5 rounded-xl tracking-wider">
          #{res.id.slice(0, 8).toUpperCase()}
        </span>
      </div>

      {/* ══ HERO ══ */}
      <DarkCard className="rounded-3xl">
        <div className={cn('h-0.5 w-full bg-gradient-to-r', cfg.gradient)} />
        <div className="relative overflow-hidden">
          <div className={cn('absolute -top-20 -right-20 w-72 h-72 rounded-full opacity-8 blur-3xl bg-gradient-to-br', cfg.gradient)} />
          <div className="relative p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-start gap-6">
              <div className="flex-1 min-w-0 space-y-5">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className={cn('inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold backdrop-blur-sm', cfg.badge)}>
                    <span className={cn('w-1.5 h-1.5 rounded-full animate-pulse', cfg.dot)} />
                    <StatusIcon className="w-3 h-3" />
                    {cfg.label}
                  </span>
                  <span className="text-xs text-neutral-500 font-medium">Créée le {dateLong(res.creeLe)}</span>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-500 mb-1.5">
                    {res.logement.type} · {res.logement.ville}{res.logement.quartier ? ` · ${res.logement.quartier}` : ''}
                  </p>
                  <h1 className="text-xl md:text-2xl font-black text-white leading-tight tracking-tight">{res.logement.titre}</h1>
                </div>
                <div className="flex items-stretch bg-white/6 border border-white/10 rounded-2xl overflow-hidden w-full max-w-sm backdrop-blur-sm">
                  <div className="flex-1 px-5 py-3.5 text-center">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-neutral-500 mb-1">Arrivée</p>
                    <p className="text-sm font-bold text-white">{dateLong(res.dateDebut)}</p>
                    {res.confirmeeLe && (
                      <p className="text-[10px] font-semibold text-emerald-400 mt-1 flex items-center justify-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(res.dateDebut).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-center justify-center px-4 border-x border-white/10 gap-0.5">
                    <Moon className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-base font-black text-white tabular-nums leading-none">{res.nbNuits}</span>
                    <span className="text-[8px] font-bold text-neutral-500 uppercase">nuit{res.nbNuits > 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex-1 px-5 py-3.5 text-center">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-neutral-500 mb-1">Départ</p>
                    <p className="text-sm font-bold text-white">{dateLong(res.dateFin)}</p>
                    {res.confirmeeLe && (
                      <p className="text-[10px] font-semibold text-rose-400 mt-1 flex items-center justify-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(res.dateFin).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm font-semibold text-neutral-400">
                  <Users className="w-4 h-4 text-neutral-500" />
                  {res.nbPersonnes} voyageur{res.nbPersonnes > 1 ? 's' : ''}
                </div>
              </div>
              <div className="flex flex-col gap-3 md:w-56 shrink-0">
                {mainPhoto && (
                  <div className="relative w-full h-36 md:h-44 rounded-2xl overflow-hidden bg-white/6 border border-white/10">
                    <Image src={mainPhoto} alt={res.logement.titre} fill className="object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  </div>
                )}
                <div className="rounded-2xl bg-white/6 border border-white/10 p-4 text-center backdrop-blur-sm">
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-neutral-500 mb-1">Votre revenu net</p>
                  <p className="text-3xl font-black text-emerald-400 tracking-tight leading-none">{fcfa(res.netProprietaire)}</p>
                  <p className="text-[10px] font-bold text-neutral-600 mt-0.5">FCFA</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DarkCard>

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

      {/* ══ CONTRAT ══ */}
      <GlassCard>
        <div className="flex items-center justify-between p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
              <FileText className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-neutral-900">Contrat de location</p>
              <p className="text-xs text-neutral-400">Généré automatiquement · Signé numériquement</p>
            </div>
          </div>
          <Link
            href={`/dashboard/reservations/${id}/contrat`}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-surface-dark hover:bg-neutral-900 text-white text-xs font-bold rounded-xl transition-colors shadow-sm border border-white/8"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Consulter
          </Link>
        </div>
      </GlassCard>

      {/* ══ LOCATAIRE + LOGEMENT ══ */}
      <div className="grid md:grid-cols-2 gap-4">
        <GlassCard>
          <GlassCardHeader icon={<User className="w-4 h-4 text-neutral-600" />} title="Locataire" />
          <div className="p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-sm font-black text-emerald-700 shrink-0 overflow-hidden border border-emerald-200/50">
                {res.locataire.avatarUrl
                  ? <Image src={res.locataire.avatarUrl} alt="" width={48} height={48} className="object-cover w-full h-full" />
                  : `${res.locataire.prenom[0]}${res.locataire.nom[0]}`}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-neutral-900 truncate">{res.locataire.prenom} {res.locataire.nom}</p>
                <div className="mt-1">
                  {res.locataire.statutKyc === 'VERIFIE' ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                      <Shield className="w-2.5 h-2.5" /> Identité vérifiée
                    </span>
                  ) : (
                    <span className="inline-flex text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                      KYC {res.locataire.statutKyc?.toLowerCase() ?? 'Non vérifié'}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="space-y-2.5 pt-3 border-t border-neutral-200/60">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-neutral-100 flex items-center justify-center shrink-0">
                  <Phone className="w-3.5 h-3.5 text-neutral-500" />
                </div>
                {canSeePhone && res.locataire.telephone ? (
                  <a href={`tel:${res.locataire.telephone}`} className="text-sm font-semibold text-neutral-800 hover:text-emerald-700 transition-colors">
                    {res.locataire.telephone}
                  </a>
                ) : (
                  <div>
                    <p className="text-sm font-mono text-neutral-300 tracking-widest">••••••••••</p>
                    <p className="text-[10px] text-neutral-400 mt-0.5">Visible 48h avant le check-in</p>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-gold-50 border border-gold-100 flex items-center justify-center shrink-0">
                  <Star className="w-3.5 h-3.5 text-gold-500 fill-gold-500" />
                </div>
                <span className="text-sm font-bold text-neutral-900">{res.locataire.noteLocataire?.toFixed(1) ?? '—'}</span>
                <span className="text-xs text-neutral-400">/ 5</span>
              </div>
            </div>
          </div>
        </GlassCard>

        <GlassCard>
          <GlassCardHeader icon={<Home className="w-4 h-4 text-neutral-600" />} title="Logement" />
          <div className="p-5 space-y-4">
            {mainPhoto && (
              <div className="relative w-full h-32 rounded-xl overflow-hidden bg-neutral-100 border border-neutral-200/60">
                <Image src={mainPhoto} alt={res.logement.titre} fill className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              </div>
            )}
            <div>
              <p className="text-sm font-bold text-neutral-900">{res.logement.titre}</p>
              <p className="text-xs font-semibold text-neutral-400 mt-0.5">{res.logement.type}</p>
            </div>
            <div className="flex items-start gap-2.5 pt-3 border-t border-neutral-200/60">
              <div className="w-7 h-7 rounded-lg bg-neutral-100 flex items-center justify-center shrink-0 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-neutral-500" />
              </div>
              <p className="text-xs text-neutral-600 leading-relaxed">
                {res.logement.adresse}{res.logement.quartier ? `, ${res.logement.quartier}` : ''}{`, ${res.logement.ville}`}
              </p>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* ══ DÉTAIL FINANCIER ══ */}
      <DarkCard>
        <DarkCardHeader
          icon={<TrendingUp className="w-4 h-4 text-neutral-400" />}
          title="Détail financier"
        />
        <div className="p-6 space-y-5">
          <div className="space-y-1">
            {[
              { label: 'Prix de base',                         value: fcfa(res.prixBase),                                                   muted: true  },
              { label: 'Supplément personnes',                  value: `+${fcfa(res.supplementPersonnes)}`,                                  muted: true  },
              { label: `Réduction (${res.nbNuits} nuits)`,     value: res.reductionNuits > 0 ? `-${fcfa(res.reductionNuits)}` : '—',         muted: true  },
              { label: 'Total payé par le locataire',           value: `${fcfa(res.totalLocataire)} FCFA`,          bold: true                              },
              { label: `Commission ImmoLoc (${commissionPct}%)`, value: `-${fcfa(res.montantCommission)} FCFA`,     muted: true, red: true                  },
              { label: 'Votre revenu net',                      value: `${fcfa(res.netProprietaire)} FCFA`,         bold: true, green: true                 },
            ].map((row) => (
              <div key={row.label} className={cn(
                'flex items-center justify-between py-2.5',
                !row.muted && 'border-t border-white/8',
              )}>
                <span className={cn('text-sm', row.bold ? 'font-bold text-white' : 'font-medium text-neutral-500')}>
                  {row.label}
                </span>
                <span className={cn(
                  'text-sm font-bold',
                  row.green ? 'text-emerald-400' : row.red ? 'text-rose-400' : row.bold ? 'text-white' : 'text-neutral-500',
                )}>
                  {row.value}
                </span>
              </div>
            ))}
          </div>

          {/* Barre de répartition */}
          <div className="space-y-2 pt-3 border-t border-white/8">
            <div className="flex justify-between text-[10px] font-bold text-neutral-500">
              <span>Votre part — {ownPct}%</span>
              <span>Commission — {commissionPct}%</span>
            </div>
            <div className="h-2 rounded-full bg-white/8 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-700"
                style={{ width: `${ownPct}%` }}
              />
            </div>
          </div>

          {/* Info séquestre */}
          <div className="flex items-start gap-3 bg-emerald-500/8 border border-emerald-400/15 rounded-xl p-4">
            <Shield className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <p className="text-xs text-emerald-300 font-medium leading-relaxed">
              La commission de {commissionPct}% couvre le système de séquestre, la protection des deux parties et le support ImmoLoc.
            </p>
          </div>
        </div>
      </DarkCard>

      {/* ══════════════════════════════════════════════════════════
          PAIEMENT — Dark card
          ══════════════════════════════════════════════════════════ */}
      {res.paiement && (
        <DarkCard>
          <DarkCardHeader
            icon={<CreditCard className="w-4 h-4 text-neutral-400" />}
            title="Paiement"
          />
          <div className="p-6">
            <div className="grid sm:grid-cols-3 gap-5">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-neutral-500 mb-2.5">Moyen de paiement</p>
                <span className={cn('inline-flex items-center px-3 py-1.5 rounded-xl border text-xs font-bold', FOURNISSEUR_BADGE[res.paiement.fournisseur])}>
                  {FOURNISSEUR_LABEL[res.paiement.fournisseur]}
                </span>
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-neutral-500 mb-2.5">Statut</p>
                <span className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold',
                  res.paiement.statut === 'CONFIRME'
                    ? 'bg-emerald-400/10 text-emerald-300 border-emerald-400/20'
                    : 'bg-amber-400/10 text-amber-300 border-amber-400/20',
                )}>
                  <span className={cn('w-1.5 h-1.5 rounded-full animate-pulse', res.paiement.statut === 'CONFIRME' ? 'bg-emerald-400' : 'bg-amber-400')} />
                  {res.paiement.statut === 'CONFIRME' ? 'Confirmé' : res.paiement.statut}
                </span>
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-neutral-500 mb-2.5">Montant reçu</p>
                <p className="text-2xl font-black text-white tracking-tight">
                  {fcfa(res.paiement.montant)} <span className="text-xs font-bold text-neutral-500">FCFA</span>
                </p>
              </div>
            </div>
          </div>
        </DarkCard>
      )}

      {/* ══════════════════════════════════════════════════════════
          PHOTOS ÉTAT DES LIEUX — Composant premium
          ══════════════════════════════════════════════════════════ */}
      <PhotosEtatLieuSection
        checkinPhotos={checkinPhotos}
        checkoutPhotos={checkoutPhotos}
      />

      {/* ══════════════════════════════════════════════════════════
          LITIGE — Dark rose card avec détails complets
          ══════════════════════════════════════════════════════════ */}
      {res.litige && (
        <div className="bg-surface-dark border border-rose-500/20 rounded-2xl overflow-hidden shadow-xl shadow-black/40">
          <div className="h-0.5 bg-gradient-to-r from-rose-500 to-red-600 w-full" />
          <div className="p-6 space-y-5">
            {/* En-tête */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5 text-rose-400" />
                </div>
                <div>
                  <p className="text-sm font-black text-white">Litige déclaré</p>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Par le {isOwner ? 'propriétaire' : 'locataire'}
                  </p>
                </div>
              </div>
              <span className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold shrink-0',
                res.litige.statut === 'EN_ATTENTE' && 'bg-amber-500/10 text-amber-300 border-amber-500/20',
                res.litige.statut === 'FONDE' && 'bg-rose-500/10 text-rose-300 border-rose-500/20',
                res.litige.statut === 'NON_FONDE' && 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
              )}>
                <span className={cn('w-1.5 h-1.5 rounded-full animate-pulse',
                  res.litige.statut === 'EN_ATTENTE' && 'bg-amber-400',
                  res.litige.statut === 'FONDE' && 'bg-rose-400',
                  res.litige.statut === 'NON_FONDE' && 'bg-emerald-400',
                )} />
                {res.litige.statut === 'EN_ATTENTE' && 'En cours d\'examen'}
                {res.litige.statut === 'FONDE' && 'Litige fondé'}
                {res.litige.statut === 'NON_FONDE' && 'Litige non fondé'}
              </span>
            </div>

            {/* Motif */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-2">
              <p className="text-[10px] font-black uppercase tracking-wider text-neutral-500">Motif du litige</p>
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

            {/* Description */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-2">
              <p className="text-[10px] font-black uppercase tracking-wider text-neutral-500">Description</p>
              <p className="text-xs text-neutral-300 leading-relaxed">{res.litige.description}</p>
            </div>

            {/* Date */}
            <div className="flex items-center gap-2.5 text-xs text-neutral-500">
              <Clock className="w-3.5 h-3.5 shrink-0" />
              <span>Ouvert le {new Date(res.litige.creeLe).toLocaleDateString('fr-FR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}</span>
            </div>

            {/* Délai de traitement */}
            {res.litige.statut === 'EN_ATTENTE' && (
              <div className="flex items-start gap-3 bg-amber-500/8 border border-amber-500/15 rounded-xl p-4">
                <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-amber-300">Délai de traitement : 48-72h</p>
                  <p className="text-xs text-amber-400/80 mt-1 leading-relaxed">
                    Notre équipe support examine le litige et vous contactera par email ou téléphone.
                  </p>
                </div>
              </div>
            )}

            {/* Issues possibles */}
            {res.litige.statut === 'EN_ATTENTE' && (
              <div className="space-y-3">
                <p className="text-[10px] font-black uppercase tracking-wider text-neutral-500">Issues possibles</p>
                <div className="space-y-2">
                  <div className="flex items-start gap-2.5 text-xs text-neutral-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-neutral-600 shrink-0 mt-1.5" />
                    <span className="leading-relaxed"><span className="font-bold text-white">Litige fondé</span> : Pénalité appliquée, compensation versée</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs text-neutral-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-neutral-600 shrink-0 mt-1.5" />
                    <span className="leading-relaxed"><span className="font-bold text-white">Litige non fondé</span> : Fonds débloqués normalement</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs text-neutral-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-neutral-600 shrink-0 mt-1.5" />
                    <span className="leading-relaxed"><span className="font-bold text-white">Arrangement à l'amiable</span> : Médiation entre les parties</span>
                  </div>
                </div>
              </div>
            )}

            {/* Résultat si litige résolu */}
            {res.litige.statut === 'FONDE' && (
              <div className="flex items-start gap-3 bg-rose-500/8 border border-rose-500/15 rounded-xl p-4">
                <CheckCircle2 className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <p className="text-xs text-rose-300 leading-relaxed">
                  <span className="font-bold">Litige fondé.</span> Une pénalité a été appliquée {isOwner ? 'au locataire' : 'par le propriétaire'} et une compensation {isOwner ? 'pourra vous être versée' : 'sera déduite'} selon l'évaluation des dommages.
                </p>
              </div>
            )}
            {res.litige.statut === 'NON_FONDE' && (
              <div className="flex items-start gap-3 bg-emerald-500/8 border border-emerald-500/15 rounded-xl p-4">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-xs text-emerald-300 leading-relaxed">
                  <span className="font-bold">Litige non fondé.</span> Les fonds seront débloqués normalement. Aucune pénalité n'est appliquée.
                </p>
              </div>
            )}

            {/* Alert fonds gelés */}
            {res.litige.statut === 'EN_ATTENTE' && (
              <div className="flex items-start gap-3 bg-emerald-500/8 border border-emerald-400/15 rounded-xl p-4">
                <Shield className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-xs text-emerald-300 leading-relaxed">
                  Les fonds restent gelés en séquestre jusqu'à la résolution du litige par notre équipe support.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          CHRONOLOGIE — Dark card avec timeline élégante
          ══════════════════════════════════════════════════════════ */}
      {res.historique.length > 0 && (
        <DarkCard>
          <DarkCardHeader icon={<History className="w-4 h-4 text-neutral-400" />} title="Chronologie" />
          <div className="p-6">
            <div className="space-y-0">
              {res.historique.map((event, i) => {
                const hcfg = HISTORIQUE_CFG[event.nouveauStatut];
                if (!hcfg) return null;
                const Icon = hcfg.icon;
                const isLast = i === res.historique.length - 1;
                return (
                  <div key={event.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={cn('w-8 h-8 rounded-xl border flex items-center justify-center shrink-0', hcfg.accent)}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      {!isLast && <div className="w-px flex-1 bg-white/10 my-1.5" />}
                    </div>
                    <div className={cn('pb-5', isLast && 'pb-0')}>
                      <p className="text-sm font-bold text-white">{hcfg.label}</p>
                      <p className="text-xs text-neutral-500 mt-0.5">{dateTime(event.modifieLe)}</p>
                      {event.raison && (
                        <p className="text-xs text-neutral-400 mt-1.5 italic leading-relaxed">{event.raison}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </DarkCard>
      )}

    </div>

    {/* ══ STICKY BAR — mobile only ══════════════════════════════════════════ */}
    {showStickyBar && (
      <div className="lg:hidden fixed bottom-[76px] left-0 right-0 z-30 px-3">
        <button
          onClick={() => setPanelOpen(true)}
          className="w-full rounded-2xl overflow-hidden shadow-[0_16px_56px_rgba(0,0,0,0.5)] active:scale-[0.985] transition-transform"
          style={{
            background: 'rgba(10,10,10,0.94)',
            backdropFilter: 'blur(28px) saturate(180%)',
            WebkitBackdropFilter: 'blur(28px) saturate(180%)',
          }}
        >
          <div className={cn('h-[3px] w-full bg-gradient-to-r', cfg.gradient)} />
          <div className="flex items-center gap-3 px-4 py-3.5">
            <div className={cn('w-9 h-9 rounded-xl border flex items-center justify-center shrink-0', cta.chipBg)}>
              <StatusIcon className={cn('w-4 h-4', cta.chipIcon)} />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-black text-white leading-tight truncate">{cta.label}</p>
              <p className="text-[11px] font-medium text-white/40 mt-0.5 truncate">
                {res.locataire.prenom} {res.locataire.nom} · {res.nbNuits} nuit{res.nbNuits > 1 ? 's' : ''}
              </p>
            </div>
            <span className={cn('flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-black shrink-0', cta.btnCls)}>
              {cta.btnLabel}
              <ChevronUp className="w-3.5 h-3.5" />
            </span>
          </div>
        </button>
      </div>
    )}

    {/* ══ BOTTOM SHEET — mobile only ════════════════════════════════════════ */}
    {showStickyBar && panelOpen && (
      <>
        <div
          className="lg:hidden fixed inset-0 z-30 bg-black/50 backdrop-blur-sm"
          onClick={() => setPanelOpen(false)}
        />
        <div className="lg:hidden fixed inset-x-0 bottom-0 z-40 bg-neutral-50 rounded-t-3xl max-h-[88dvh] overflow-y-auto shadow-2xl">
          <div className="sticky top-0 bg-neutral-50 z-10 pt-3">
            <div className="flex justify-center mb-2.5">
              <div className="w-10 h-1 rounded-full bg-neutral-200" />
            </div>
            <div className="flex items-center justify-between px-5 pb-3.5 border-b border-neutral-200/60">
              <div className="flex items-center gap-2.5">
                <span className={cn('w-2 h-2 rounded-full', cfg.dot)} />
                <p className="text-sm font-black text-neutral-900">{cfg.label}</p>
              </div>
              <button
                onClick={() => setPanelOpen(false)}
                className="w-8 h-8 rounded-xl bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center transition-colors active:scale-90"
              >
                <X className="w-4 h-4 text-neutral-500" />
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
