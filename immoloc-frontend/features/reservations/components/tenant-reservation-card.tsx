'use client';

import Link from 'next/link';
import Image from 'next/image';
import {
  Calendar, MapPin, Users, Moon, ChevronRight,
  Clock, CheckCircle2, XCircle, AlertCircle, Building2, ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

/* ─── Types ───────────────────────────────────────────────────────────────── */

export interface TenantReservation {
  id: string;
  dateDebut: string;
  dateFin: string;
  nbNuits: number;
  nbPersonnes: number;
  totalLocataire: number;
  prixBase: number;
  statut: 'PENDING' | 'PAID' | 'CONFIRMED' | 'CHECKED_IN' | 'COMPLETED' | 'CANCELLED' | 'DISPUTED' | 'EXPIRED';
  logement: {
    id: string;
    titre: string;
    type: string;
    ville: string;
    quartier?: string | null;
    photos: Array<{ url: string; estPrincipale: boolean }>;
  };
  creeLe: string;
}

/* ─── Config statut (tokens ImmoLoc uniquement) ───────────────────────────── */

const STATUS_CFG: Record<string, {
  label: string;
  color: string;   // texte du badge (verre blanc) + accents
  stripe: string;  // bande supérieure
  Icon: React.ComponentType<{ className?: string }>;
}> = {
  PENDING:    { label: 'En attente',      color: 'text-warning-600',      stripe: 'bg-warning-500', Icon: Clock },
  PAID:       { label: 'Paiement reçu',   color: 'text-success-600',      stripe: 'bg-success-500', Icon: CheckCircle2 },
  CONFIRMED:  { label: 'Confirmée',       color: 'text-emerald-700',      stripe: 'bg-emerald-500', Icon: CheckCircle2 },
  CHECKED_IN: { label: 'Séjour en cours', color: 'text-success-600',      stripe: 'bg-success-500', Icon: CheckCircle2 },
  COMPLETED:  { label: 'Terminée',        color: 'text-foreground-muted', stripe: 'bg-neutral-400', Icon: CheckCircle2 },
  CANCELLED:  { label: 'Annulée',         color: 'text-error-600',        stripe: 'bg-error-500',   Icon: XCircle },
  DISPUTED:   { label: 'Litige',          color: 'text-error-600',        stripe: 'bg-error-600',   Icon: AlertCircle },
  EXPIRED:    { label: 'Expirée',         color: 'text-foreground-muted', stripe: 'bg-neutral-300', Icon: Clock },
};

const TYPE_LABELS: Record<string, string> = {
  APPARTEMENT: 'Appartement', STUDIO: 'Studio', VILLA: 'Villa',
  CHAMBRE: 'Chambre', DUPLEX: 'Duplex', PENTHOUSE: 'Penthouse',
};

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

function formatShort(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

function fcfa(n: number) {
  return new Intl.NumberFormat('fr-FR').format(n);
}

/* ─── Skeleton ────────────────────────────────────────────────────────────── */

export function TenantReservationCardSkeleton() {
  return (
    <div className="bg-background-card rounded-3xl border border-border shadow-md overflow-hidden animate-pulse">
      <div className="h-1 bg-background-alt" />
      <div className="flex flex-col">
        <div className="w-full aspect-[16/9] bg-background-alt relative">
          <div className="absolute top-3 left-3 h-8 w-28 bg-background-card/80 rounded-xl" />
          <div className="absolute top-3 right-3 h-8 w-24 bg-background-card/80 rounded-lg" />
        </div>
        <div className="p-5 space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="h-7 w-24 bg-emerald-50 rounded-lg" />
              <div className="h-4 w-32 bg-background-alt rounded" />
            </div>
            <div className="h-6 w-3/4 bg-background-alt rounded-lg" />
          </div>
          <div className="h-20 w-full bg-background-alt rounded-2xl border border-border" />
          <div className="flex items-center justify-between pt-3">
            <div className="flex items-center gap-3">
              <div className="space-y-1">
                <div className="h-3 w-12 bg-background-alt rounded" />
                <div className="h-6 w-28 bg-background-alt rounded" />
              </div>
              <div className="h-9 w-20 bg-background-alt rounded-xl" />
            </div>
            <div className="h-10 w-10 bg-emerald-100 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Card ────────────────────────────────────────────────────────────────── */

export function TenantReservationCard({ reservation }: { reservation: TenantReservation }) {
  const cfg = STATUS_CFG[reservation.statut] ?? STATUS_CFG.PENDING;
  const { Icon } = cfg;
  const photo = reservation.logement.photos.find((p) => p.estPrincipale) ?? reservation.logement.photos[0];
  const typeLabel = TYPE_LABELS[reservation.logement.type] ?? reservation.logement.type;
  const nbNuits = reservation.nbNuits
    ?? Math.round((new Date(reservation.dateFin).getTime() - new Date(reservation.dateDebut).getTime()) / 86_400_000);

  return (
    <Link href={`/reservations/${reservation.id}`} className="group block">
      <article className="relative bg-gradient-to-br from-background-card via-background-card to-background-alt/50 rounded-[28px] border border-border/80 shadow-lg shadow-black/5 overflow-hidden hover:shadow-[0_20px_40px_-12px_rgba(16,185,129,0.25)] hover:border-emerald-400/50 hover:-translate-y-1.5 transition-all duration-500 ease-out">

        {/* Bande de statut avec gradient */}
        <div className={cn('h-1.5 w-full', cfg.stripe, 'opacity-90')} />

        <div className="flex flex-col">

          {/* Photo */}
          <div className="relative w-full aspect-[16/9] shrink-0 bg-gradient-to-br from-background-alt to-background-card overflow-hidden">
            {photo ? (
              <>
                <Image
                  src={photo.url}
                  alt={reservation.logement.titre}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                  sizes="(max-width: 640px) 100vw, 640px"
                />
                {/* Gradient overlay plus subtil */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                {/* Vignette */}
                <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-b-[28px]" />
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Building2 className="w-12 h-12 text-neutral-300" />
              </div>
            )}

            {/* Badge statut — glassmorphism premium */}
            <div className="absolute top-4 left-4">
              <span className={cn(
                'inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-black shadow-xl shadow-black/10 bg-white/90 backdrop-blur-xl border border-white/80 ring-1 ring-black/5',
                cfg.color,
              )}>
                <Icon className="w-4 h-4" />
                {cfg.label}
              </span>
            </div>

            {/* Référence — glassmorphism */}
            <div className="absolute top-4 right-4">
              <span className="inline-flex items-center px-3 py-2 rounded-xl backdrop-blur-xl bg-white/85 border border-white/70 shadow-lg shadow-black/5 ring-1 ring-black/5">
                <span className="text-[10px] font-mono font-black text-neutral-600 tracking-wider">
                  #{reservation.id.slice(0, 8).toUpperCase()}
                </span>
              </span>
            </div>
          </div>

          {/* Contenu */}
          <div className="p-6 flex flex-col min-w-0 space-y-5">

            {/* Localisation + titre */}
            <div className="space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200/80 shadow-sm">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" strokeWidth={2.5} />
                  <span className="text-[11px] font-black text-emerald-700 uppercase tracking-wider">
                    {typeLabel}
                  </span>
                </div>
                <span className="text-xs font-bold text-foreground-muted/80 truncate">
                  {reservation.logement.ville}
                  {reservation.logement.quartier ? ` · ${reservation.logement.quartier}` : ''}
                </span>
              </div>
              <h3 className="font-display text-xl font-bold text-foreground line-clamp-2 group-hover:text-emerald-600 transition-colors duration-300 leading-tight">
                {reservation.logement.titre}
              </h3>
            </div>

            {/* Bloc dates — design premium */}
            <div className="overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-background-alt to-background-card shadow-sm">
              <div className="flex items-stretch divide-x divide-border/60">
                <div className="flex-1 px-5 py-4 text-center">
                  <p className="text-[10px] font-black text-foreground-muted/70 uppercase tracking-widest mb-1.5">Arrivée</p>
                  <p className="text-base md:text-lg font-black text-foreground tabular-nums tracking-tight">{formatShort(reservation.dateDebut)}</p>
                </div>

                <div className="flex items-center justify-center px-5 bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-800 shadow-inner">
                  <div className="flex flex-col items-center gap-1 py-2">
                    <Moon className="w-5 h-5 text-white/90" strokeWidth={2.5} />
                    <span className="text-lg font-black text-white tabular-nums leading-none tracking-tight">{nbNuits}</span>
                    <span className="text-[9px] font-black text-white/80 uppercase tracking-widest">nuit{nbNuits > 1 ? 's' : ''}</span>
                  </div>
                </div>

                <div className="flex-1 px-5 py-4 text-center">
                  <p className="text-[10px] font-black text-foreground-muted/70 uppercase tracking-widest mb-1.5">Départ</p>
                  <p className="text-base md:text-lg font-black text-foreground tabular-nums tracking-tight">{formatShort(reservation.dateFin)}</p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-border/60">
              <div className="flex items-center gap-4">
                <div className="flex flex-col">
                  <p className="text-[10px] font-black text-foreground-muted/70 uppercase tracking-widest mb-1">Total</p>
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-sans text-2xl font-black text-emerald-600 tracking-tight leading-none tabular-nums">
                      {fcfa(reservation.totalLocataire)}
                    </span>
                    <span className="text-xs font-black text-foreground-muted/80">FCFA</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-br from-background-alt to-background-card border border-border/80 shadow-sm">
                  <Users className="w-4 h-4 text-foreground-muted/70" strokeWidth={2.5} />
                  <span className="text-sm font-black text-foreground tabular-nums">{reservation.nbPersonnes ?? 1}</span>
                  <span className="text-xs font-bold text-foreground-muted/70">pers.</span>
                </div>
              </div>

              {/* Voir détails */}
              <div className="relative w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-800 flex items-center justify-center text-white shadow-lg shadow-emerald-600/30 group-hover:shadow-xl group-hover:shadow-emerald-600/40 group-hover:scale-110 transition-all duration-300 ring-1 ring-white/20">
                <ChevronRight className="w-5 h-5" strokeWidth={3} />
              </div>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}

/* ─── Empty state ─────────────────────────────────────────────────────────── */

export function TenantReservationsEmpty({ filtered }: { filtered?: boolean }) {
  return (
    <div className="flex flex-col items-center py-20 px-6 text-center">
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-3xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
          <Calendar className="w-9 h-9 text-emerald-300" />
        </div>
        <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-xl bg-accent-50 border border-accent-100 flex items-center justify-center">
          <span className="text-sm">🏖️</span>
        </div>
      </div>
      <h3 className="font-display text-lg font-semibold text-foreground mb-2">
        {filtered ? 'Aucune réservation dans cette catégorie' : 'Pas encore de réservation'}
      </h3>
      <p className="text-sm text-foreground-muted max-w-xs leading-relaxed mb-8">
        {filtered
          ? 'Essayez un autre filtre ou consultez toutes vos réservations.'
          : 'Votre prochaine aventure vous attend. Parcourez nos logements et réservez votre séjour.'}
      </p>
      {!filtered && (
        <Link
          href="/logements"
          className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-md shadow-emerald-600/25 hover:-translate-y-0.5 active:scale-95 transition-all"
        >
          Parcourir les logements
          <ArrowRight className="w-4 h-4" />
        </Link>
      )}
    </div>
  );
}