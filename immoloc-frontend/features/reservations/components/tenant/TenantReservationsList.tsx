'use client';

import Link from 'next/link';
import Image from 'next/image';
import {
  Calendar, MapPin, Users, Moon, ChevronRight,
  Clock, CheckCircle2, XCircle, AlertCircle, Building2,
  ArrowRight, ShieldCheck, FileText, Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { TenantReservation } from '@/features/reservations/components/tenant-reservation-card';

const STATUS_CFG: Record<string, {
  label: string;
  badgeClass: string;
  Icon: React.ComponentType<{ className?: string }>;
}> = {
  PENDING:    { label: 'En attente',              badgeClass: 'bg-warning-50 text-warning-700 border-warning-200', Icon: Clock },
  PAID:       { label: 'Sous séquestre',          badgeClass: 'bg-forest-50 text-forest-800 border-forest-200', Icon: ShieldCheck },
  CONFIRMED:  { label: 'Confirmée',               badgeClass: 'bg-forest-50 text-forest-800 border-forest-200', Icon: CheckCircle2 },
  CHECKED_IN: { label: 'En cours',                badgeClass: 'bg-forest-50 text-forest-800 border-forest-200 ring-2 ring-lime-400', Icon: Sparkles },
  COMPLETED:  { label: 'Terminée',                badgeClass: 'bg-background-alt text-foreground-muted border-border', Icon: CheckCircle2 },
  CANCELLED:  { label: 'Annulée',                 badgeClass: 'bg-error-50 text-error-700 border-error-200', Icon: XCircle },
  DISPUTED:   { label: 'Litige',                  badgeClass: 'bg-error-50 text-error-700 border-error-200', Icon: AlertCircle },
  EXPIRED:    { label: 'Expirée',                 badgeClass: 'bg-background-alt text-foreground-muted border-border', Icon: Clock },
};

function formatShort(d: string) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

function fcfa(n: number) {
  if (!n) return '0';
  return new Intl.NumberFormat('fr-FR').format(Math.round(n));
}

export function TenantReservationCardItem({ reservation }: { reservation: TenantReservation }) {
  const cfg = STATUS_CFG[reservation.statut] ?? STATUS_CFG.PENDING;
  const { Icon } = cfg;
  const photo = reservation.logement.photos.find((p) => p.estPrincipale) ?? reservation.logement.photos[0];
  const categoryLabel = reservation.logement.type || 'Logement';
  const nbNuits = reservation.nbNuits
    ?? Math.round((new Date(reservation.dateFin).getTime() - new Date(reservation.dateDebut).getTime()) / (1000 * 60 * 60 * 24));

  return (
    <>
      {/* ── RENDU MOBILE : RANGÉE PRÉMIUM AVEC MISE EN AVANT DU PRIX LIME ───────── */}
      <Link href={`/reservations/${reservation.id}`} className="group block sm:hidden">
        <article className="bg-background-card rounded-card border border-border/80 p-4.5 shadow-sm hover:border-forest-300 transition-all space-y-3.5">
          {/* Ligne 1 : Statut Badge + Tag Catégorie */}
          <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-2.5">
            <span className={cn(
              'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-pill text-[11px] font-bold border',
              cfg.badgeClass,
            )}>
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span>{cfg.label}</span>
            </span>

            <span className="text-[10px] font-extrabold uppercase tracking-wider text-forest-700 bg-forest-50 px-2 py-0.5 rounded-pill border border-forest-100">
              {categoryLabel}
            </span>
          </div>

          {/* Ligne 2 : Photo + Infos du bien */}
          <div className="flex items-start gap-3.5">
            <div className="relative w-24 h-24 rounded-inner overflow-hidden border border-border shrink-0 bg-background-alt shadow-2xs">
              {photo ? (
                <Image
                  src={photo.url}
                  alt={reservation.logement.titre}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  sizes="96px"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-foreground-faint">
                  <Building2 className="w-7 h-7" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0 space-y-1.5 pt-0.5">
              <h3 className="font-display text-base font-bold text-forest-950 line-clamp-2 leading-snug group-hover:text-forest-700 transition-colors">
                {reservation.logement.titre}
              </h3>

              <p className="text-xs text-foreground-muted flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-forest-600 shrink-0" />
                <span className="truncate">{reservation.logement.ville}{reservation.logement.quartier ? `, ${reservation.logement.quartier}` : ''}</span>
              </p>

              <p className="text-xs font-semibold text-forest-900 flex items-center gap-1 mt-0.5">
                <Calendar className="w-3.5 h-3.5 text-forest-600 shrink-0" />
                <span>{formatShort(reservation.dateDebut)} → {formatShort(reservation.dateFin)}</span>
                <span className="text-foreground-faint">({nbNuits} nuit{nbNuits > 1 ? 's' : ''})</span>
              </p>
            </div>
          </div>

          {/* Ligne 3 : BANNIÈRE DE PRIX HAUTE VISIBILITÉ LIME */}
          <div className="bg-forest-950 text-white rounded-inner p-3.5 flex items-center justify-between shadow-xs">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-forest-200 block">
                Total Réglé (Séquestre)
              </span>
              <div className="font-display text-xl font-extrabold text-lime-400 leading-none mt-0.5">
                {fcfa(reservation.totalLocataire)} <span className="text-xs font-sans font-bold text-lime-200">FCFA</span>
              </div>
            </div>

            <div className="flex items-center gap-1 text-xs font-bold text-lime-300 group-hover:translate-x-0.5 transition-transform">
              <span>Voir le séjour</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        </article>
      </Link>

      {/* ── RENDU DESKTOP : CARTE COMPLÈTE PRÉMIUM AVEC ACCENTS LIME ────────── */}
      <article className="hidden sm:block group bg-background-card rounded-card border border-border/80 p-3.5 sm:p-4 shadow-2xs hover:shadow-md hover:border-forest-300 transition-all duration-300 relative overflow-hidden">
        <div className="flex flex-col md:flex-row gap-4 items-center">

          {/* Photo Vignette */}
          <div className="relative w-full md:w-56 h-[145px] rounded-inner overflow-hidden border border-border shrink-0 bg-background-alt shadow-2xs">
            {photo ? (
              <Image
                src={photo.url}
                alt={reservation.logement.titre}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                sizes="(max-width: 768px) 100vw, 224px"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-foreground-faint">
                <Building2 className="w-8 h-8" />
              </div>
            )}

            {/* Type tag avec accent Lime */}
            <div className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-pill bg-forest-950/90 backdrop-blur-md text-lime-300 text-[10px] font-extrabold uppercase tracking-wider border border-lime-400/20">
              {categoryLabel}
            </div>
          </div>

          {/* Info Principales */}
          <div className="flex-1 min-w-0 space-y-2.5 w-full">

            {/* Ligne 1 : Statut + Réf */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-2">
              <span className={cn(
                'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-pill text-[11px] font-bold border',
                cfg.badgeClass,
              )}>
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{cfg.label}</span>
              </span>

              <span className="text-[11px] font-mono font-bold text-foreground-faint">
                RÉF: #{reservation.id.slice(0, 8).toUpperCase()}
              </span>
            </div>

            {/* Titre & Ville */}
            <div>
              <h3 className="font-display text-lg font-bold text-forest-950 truncate group-hover:text-forest-700 transition-colors">
                {reservation.logement.titre}
              </h3>
              <p className="text-xs text-foreground-muted flex items-center gap-1 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-forest-600 shrink-0" />
                <span>{reservation.logement.ville}{reservation.logement.quartier ? `, ${reservation.logement.quartier}` : ''}</span>
              </p>
            </div>

            {/* Dates & Nuits Box */}
            <div className="bg-background-alt p-2.5 rounded-inner border border-border/80 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-forest-600 shrink-0" />
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-foreground-faint block">Du</span>
                  <span className="font-bold text-forest-950">{formatShort(reservation.dateDebut)}</span>
                </div>
              </div>

              <div className="px-2.5 py-0.5 rounded-pill bg-forest-900 text-lime-300 text-[11px] font-extrabold shadow-2xs">
                {nbNuits} nuit{nbNuits > 1 ? 's' : ''}
              </div>

              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-forest-600 shrink-0" />
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-foreground-faint block">Au</span>
                  <span className="font-bold text-forest-950">{formatShort(reservation.dateFin)}</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-foreground-muted pl-3 border-l border-border">
                <Users className="w-3.5 h-3.5" />
                <span className="font-semibold">{reservation.nbPersonnes} voyageur{reservation.nbPersonnes > 1 ? 's' : ''}</span>
              </div>
            </div>

            {/* BANNIÈRE DE PRIX DESKTOP EN VERT FORÊT SOMBRE ET BOUTON LIME 400 */}
            <div className="bg-forest-950 text-white rounded-inner p-2.5 px-3.5 flex items-center justify-between shadow-xs">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-forest-200 block">
                  Montant Total sous séquestre Klef
                </span>
                <div className="font-display text-lg lg:text-xl font-extrabold text-lime-400 leading-none mt-0.5">
                  {fcfa(reservation.totalLocataire)} <span className="text-xs font-sans font-bold text-lime-200">FCFA</span>
                </div>
              </div>

              <Link
                href={`/reservations/${reservation.id}`}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-pill bg-lime-400 hover:bg-lime-300 text-forest-950 font-extrabold text-xs shadow-md transition-all active:scale-95 group/btn"
              >
                <FileText className="w-3.5 h-3.5 text-forest-950" />
                <span>Détails & Contrat</span>
                <ChevronRight className="w-3.5 h-3.5 text-forest-950 transition-transform group-hover/btn:translate-x-0.5" />
              </Link>
            </div>

          </div>
        </div>
      </article>
    </>
  );
}

export function TenantReservationsEmptyState({ filtered }: { filtered?: boolean }) {
  return (
    <div className="bg-background-card rounded-card border border-border p-12 text-center space-y-4 max-w-md mx-auto my-8">
      <div className="w-16 h-16 rounded-inner bg-forest-950 border border-lime-400/20 flex items-center justify-center mx-auto text-lime-400 shadow-md">
        <Calendar className="w-8 h-8 text-lime-400" />
      </div>
      <div className="space-y-1">
        <h3 className="font-display text-lg font-bold text-forest-950">
          {filtered ? 'Aucun séjour trouvé' : 'Aucune réservation pour le moment'}
        </h3>
        <p className="text-xs text-foreground-muted leading-relaxed">
          {filtered
            ? 'Aucune réservation ne correspond à la catégorie sélectionnée.'
            : 'Explorez nos logements vérifiés et préparez votre prochain voyage en toute sécurité avec la garantie Klef.'}
        </p>
      </div>

      {!filtered && (
        <Link
          href="/explorer"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-pill bg-lime-400 hover:bg-lime-300 text-forest-950 font-bold text-xs shadow-md transition-all active:scale-95 mt-2"
        >
          <span>Parcourir les logements</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      )}
    </div>
  );
}
