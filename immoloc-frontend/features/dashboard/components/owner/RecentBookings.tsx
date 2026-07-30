'use client';

import { MapPin, Calendar, ArrowRight, ChevronDown, ChevronRight, Bookmark } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

interface Booking {
  id: string;
  dateDebut: string;
  dateFin: string;
  nbNuits?: number;
  totalLocataire: number;
  statut: string;
  locataire: { prenom: string; nom: string; avatarUrl: string | null };
  logement: { titre: string; ville: string; photos: any[] };
}

interface Props {
  bookings: Booking[];
}

const STATUT_CONFIG: Record<string, { label: string; theme: 'neutral' | 'forest' | 'success' | 'warning' | 'error' }> = {
  COMPLETED:  { label: 'Terminée',   theme: 'neutral' },
  CHECKED_IN: { label: 'En cours',   theme: 'success' },
  CONFIRMED:  { label: 'Confirmée',  theme: 'forest' },
  PENDING:    { label: 'En attente', theme: 'warning' },
  CANCELLED:  { label: 'Annulée',    theme: 'error' },
  DISPUTED:   { label: 'Litige',     theme: 'error' },
  PAID:       { label: 'Payée',      theme: 'success' },
};

const THEMES = {
  neutral: { bg: 'bg-background-alt', text: 'text-foreground-muted', dot: 'bg-foreground-faint', border: 'border-border/80' },
  forest:  { bg: 'bg-forest-50',       text: 'text-forest-800',       dot: 'bg-forest-600',       border: 'border-forest-100' },
  success: { bg: 'bg-forest-50',       text: 'text-forest-800',       dot: 'bg-lime-500',         border: 'border-forest-100' },
  warning: { bg: 'bg-warning-50',      text: 'text-warning-800',      dot: 'bg-warning-500',      border: 'border-warning-200' },
  error:   { bg: 'bg-error-50',        text: 'text-error-800',        dot: 'bg-error-500',        border: 'border-error-200' },
};

const ORDER = ['CHECKED_IN', 'CONFIRMED', 'PENDING', 'COMPLETED', 'CANCELLED', 'DISPUTED'];

function BookingRow({ booking }: { booking: Booking }) {
  const fmt     = (n: number) => new Intl.NumberFormat('fr-FR').format(n);
  const fmtDate = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  const cfg     = STATUT_CONFIG[booking.statut] ?? { label: booking.statut, theme: 'neutral' };
  const theme   = THEMES[cfg.theme as keyof typeof THEMES];
  const initials = `${booking.locataire.prenom.charAt(0)}${booking.locataire.nom.charAt(0)}`.toUpperCase();

  return (
    <Link href={`/dashboard/reservations/${booking.id}`} className="block active:scale-[0.985] transition-transform">
      {/* Mobile card */}
      <div className="lg:hidden rounded-inner border border-border/80 bg-background-card p-3 shadow-sm space-y-2">
        <div className="flex gap-3">
          <div className="relative w-[64px] h-[64px] rounded-inner overflow-hidden bg-background-alt shrink-0 border border-border/60">
            {booking.logement.photos?.[0]?.url ? (
              <Image src={booking.logement.photos[0].url} alt={booking.logement.titre} fill className="object-cover" sizes="64px" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <MapPin className="w-4 h-4 text-foreground-faint" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0 py-0.5">
            <div className="flex items-start justify-between gap-2 mb-1">
              <p className="font-display text-xs font-bold text-forest-950 leading-tight truncate">
                {booking.logement.titre}
              </p>
              <span className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-pill text-[9px] font-extrabold uppercase tracking-wider border ${theme.bg} ${theme.text} ${theme.border}`}>
                <span className={`w-1 h-1 rounded-full ${theme.dot}`} />
                {cfg.label}
              </span>
            </div>

            <p className="text-[11px] font-bold text-foreground-muted truncate">
              {booking.locataire.prenom} {booking.locataire.nom.charAt(0)}.
            </p>

            <p className="text-[10px] text-foreground-faint font-medium">
              {fmtDate(booking.dateDebut)} — {fmtDate(booking.dateFin)}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border/60">
          <span className="font-display text-xs font-extrabold text-forest-950">
            {fmt(booking.totalLocataire)} <span className="text-[9px] font-extrabold text-foreground-muted">FCFA</span>
          </span>
          <span className="text-xs font-extrabold text-lime-600 flex items-center gap-1">
            Détails <ChevronRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>

      {/* Desktop row */}
      <div className="hidden lg:flex items-center gap-4 p-3 group rounded-inner hover:bg-background-alt border border-transparent hover:border-border/80 transition-all">
        <div className="relative w-12 h-12 rounded-inner overflow-hidden bg-background-alt shrink-0 border border-border/60">
          {booking.logement.photos?.[0]?.url ? (
            <Image src={booking.logement.photos[0].url} alt={booking.logement.titre} fill className="object-cover" sizes="48px" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <MapPin className="w-4 h-4 text-foreground-faint" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-display text-xs font-bold text-forest-950 truncate mb-0.5">{booking.logement.titre}</p>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-forest-950 bg-background-alt px-2 py-0.5 rounded-pill border border-border/60">
              {booking.locataire.prenom} {booking.locataire.nom.charAt(0)}.
            </span>
            <span className="text-[10px] font-medium text-foreground-muted flex items-center gap-1">
              <Calendar className="w-3 h-3 text-foreground-faint" />
              {fmtDate(booking.dateDebut)} — {fmtDate(booking.dateFin)}
            </span>
          </div>
        </div>

        <div className="text-right shrink-0">
          <p className="font-display text-xs font-extrabold text-forest-950">{fmt(booking.totalLocataire)} <span className="text-[9px] text-foreground-muted font-bold">FCFA</span></p>
          <div className="flex items-center justify-end gap-1.5 mt-1">
            <span className={`px-2 py-0.5 rounded-pill text-[9px] font-extrabold uppercase tracking-wider border ${theme.bg} ${theme.text} ${theme.border}`}>
              {cfg.label}
            </span>
          </div>
        </div>

        <div className="w-7 h-7 rounded-inner bg-background-alt flex items-center justify-center border border-border/60 group-hover:bg-forest-950 group-hover:text-lime-400 transition-colors shrink-0 ml-1">
          <ChevronRight className="w-3.5 h-3.5 text-foreground-muted group-hover:text-lime-400 transition-colors" />
        </div>
      </div>
    </Link>
  );
}

function StatusGroup({ statut, bookings }: { statut: string; bookings: Booking[] }) {
  const [open, setOpen] = useState(true);
  const cfg   = STATUT_CONFIG[statut] ?? { label: statut, theme: 'neutral' };
  const theme = THEMES[cfg.theme as keyof typeof THEMES];

  return (
    <div className="mb-2">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 py-2 group outline-none"
      >
        <div className={`flex items-center gap-2 px-3 py-0.5 rounded-pill border ${theme.bg} ${theme.text} ${theme.border} transition-colors`}>
          <div className={`w-1.5 h-1.5 rounded-full ${theme.dot}`} />
          <span className="text-[9px] font-extrabold uppercase tracking-wider">{cfg.label}</span>
          <span className="text-[9px] font-extrabold opacity-60 ml-0.5">{bookings.length}</span>
        </div>
        <div className="flex-1 h-px bg-border/60" />
        <div className="w-5 h-5 rounded-inner bg-background-alt flex items-center justify-center border border-border/60">
          <ChevronDown className={`w-3 h-3 text-foreground-muted transition-transform duration-300 ${open ? '' : '-rotate-90'}`} />
        </div>
      </button>

      <div className={`grid transition-all duration-300 ease-in-out ${open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="overflow-hidden">
          <div className="space-y-2 lg:space-y-1 pt-1">
            {bookings.map(b => <BookingRow key={b.id} booking={b} />)}
          </div>
        </div>
      </div>
    </div>
  );
}

export function RecentBookings({ bookings }: Props) {
  const grouped: Record<string, Booking[]> = {};
  for (const b of bookings) {
    if (!grouped[b.statut]) grouped[b.statut] = [];
    grouped[b.statut].push(b);
  }

  const sortedKeys = ORDER.filter(s => grouped[s]?.length > 0);

  return (
    <div className="klef-rise bg-background-card rounded-card border border-border/80 p-5 lg:p-6 flex flex-col justify-between shadow-sm hover:border-forest-600/30 hover:shadow-md transition-[box-shadow,border-color] duration-200 h-full min-h-[380px]">

      {/* Header */}
      <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap mb-4 pb-3 border-b border-border/60">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-inner bg-forest-950 text-lime-400 border border-lime-400/20 flex items-center justify-center shrink-0">
            <Bookmark className="w-4 h-4 text-lime-400" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-extrabold text-foreground-muted uppercase tracking-wider">Activité</p>
            <h3 className="font-display text-sm sm:text-base font-bold text-forest-950 truncate">Réservations récentes</h3>
          </div>
        </div>

        <Link
          href="/dashboard/reservations"
          className="px-3.5 py-1.5 rounded-pill bg-lime-400 hover:bg-lime-300 text-forest-950 text-xs font-extrabold transition-all shadow-md active:scale-95 flex items-center gap-1.5 shrink-0"
        >
          <span>Historique</span>
          <ArrowRight className="w-3.5 h-3.5 text-forest-950" />
        </Link>
      </div>

      {/* Content */}
      <div className="flex-1">
        {bookings.length === 0 ? (
          <div className="h-full min-h-[200px] flex flex-col items-center justify-center text-center space-y-2">
            <div className="w-10 h-10 rounded-inner bg-forest-950 text-lime-400 border border-lime-400/20 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-lime-400" />
            </div>
            <p className="font-display text-sm font-bold text-forest-950">Aucune réservation récente</p>
            <p className="text-xs text-foreground-muted">Vos dernières réservations apparaîtront ici.</p>
          </div>
        ) : (
          <div className="space-y-1">
            {sortedKeys.map(statut => (
              <StatusGroup key={statut} statut={statut} bookings={grouped[statut]} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
