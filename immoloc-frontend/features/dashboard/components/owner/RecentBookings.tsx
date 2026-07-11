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

const STATUT_CONFIG: Record<string, { label: string; theme: 'neutral' | 'emerald' | 'success' | 'warning' | 'error' }> = {
  COMPLETED:  { label: 'Terminée',   theme: 'neutral' },
  CHECKED_IN: { label: 'En cours',   theme: 'success' },
  CONFIRMED:  { label: 'Confirmée',  theme: 'emerald' },
  PENDING:    { label: 'En attente', theme: 'warning' },
  CANCELLED:  { label: 'Annulée',    theme: 'error' },
  DISPUTED:   { label: 'Litige',     theme: 'error' },
  PAID:       { label: 'Payée',      theme: 'success' },
};

const THEMES = {
  neutral: { bg: 'bg-neutral-100',  text: 'text-neutral-600',  dot: 'bg-neutral-400',  border: 'border-border',  avatar: 'bg-neutral-100 text-neutral-600' },
  emerald: { bg: 'bg-emerald-50',   text: 'text-emerald-600',  dot: 'bg-emerald-500',  border: 'border-emerald-100',  avatar: 'bg-emerald-100 text-emerald-700' },
  success: { bg: 'bg-emerald-50',   text: 'text-emerald-600',  dot: 'bg-emerald-500',  border: 'border-emerald-100',  avatar: 'bg-emerald-100 text-emerald-700' },
  warning: { bg: 'bg-amber-50',     text: 'text-amber-600',    dot: 'bg-amber-500',    border: 'border-amber-100',    avatar: 'bg-amber-100 text-amber-700' },
  error:   { bg: 'bg-rose-50',      text: 'text-rose-600',     dot: 'bg-rose-500',     border: 'border-rose-100',     avatar: 'bg-rose-100 text-rose-700' },
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

      {/* ── Mobile card ─────────────────────────────────────────────── */}
      <div className="lg:hidden rounded-2xl border border-neutral-100 bg-background-card shadow-sm overflow-hidden">
        <div className="flex gap-3 p-3">

          {/* Photo */}
          <div className="relative w-[72px] h-[72px] rounded-xl overflow-hidden bg-neutral-100 shrink-0">
            {booking.logement.photos?.[0]?.url ? (
              <Image src={booking.logement.photos[0].url} alt={booking.logement.titre} fill className="object-cover" sizes="72px" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <MapPin className="w-5 h-5 text-neutral-300" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 py-0.5">
            {/* Title + badge */}
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <p className="text-sm font-bold text-foreground leading-tight line-clamp-2 flex-1">
                {booking.logement.titre}
              </p>
              <span className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border ${theme.bg} ${theme.text} ${theme.border}`}>
                <span className={`w-1 h-1 rounded-full ${theme.dot}`} />
                {cfg.label}
              </span>
            </div>

            {/* Guest */}
            <div className="flex items-center gap-1.5 mb-1">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black shrink-0 ${theme.avatar}`}>
                {initials}
              </div>
              <span className="text-xs font-semibold text-neutral-600 truncate">
                {booking.locataire.prenom} {booking.locataire.nom.charAt(0)}.
              </span>
            </div>

            {/* Date */}
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3 text-neutral-300 shrink-0" />
              <span className="text-[11px] text-foreground-muted font-medium">
                {fmtDate(booking.dateDebut)} — {fmtDate(booking.dateFin)}
                {booking.nbNuits ? ` · ${booking.nbNuits} nuit${booking.nbNuits > 1 ? 's' : ''}` : ''}
              </span>
            </div>
          </div>
        </div>

        {/* Footer strip */}
        <div className="flex items-center justify-between px-3 py-2.5 bg-neutral-50 border-t border-neutral-100">
          <span className="text-sm font-black text-foreground">
            {fmt(booking.totalLocataire)}
            <span className="text-[10px] font-bold text-foreground-muted ml-1">FCFA</span>
          </span>
          <div className="flex items-center gap-1 text-xs font-bold text-emerald-600">
            Voir le détail
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {/* ── Desktop row ─────────────────────────────────────────────── */}
      <div className="hidden lg:flex items-center gap-4 p-3 group rounded-2xl hover:bg-background-card hover:shadow-lg hover:shadow-md/40 hover:-translate-y-0.5 border border-transparent hover:border-neutral-200/60 transition-all duration-300">
        <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-neutral-100 flex-shrink-0 shadow-inner group-hover:ring-2 group-hover:ring-emerald-500/20 transition-all">
          {booking.logement.photos?.[0]?.url ? (
            <Image src={booking.logement.photos[0].url} alt={booking.logement.titre} fill className="object-cover" sizes="56px" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <MapPin className="w-5 h-5 text-neutral-300" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground truncate mb-1">{booking.logement.titre}</p>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-foreground-muted bg-neutral-50 px-2 py-0.5 rounded-md border border-neutral-100">
              {booking.locataire.prenom} {booking.locataire.nom.charAt(0)}.
            </span>
            <span className="text-[11px] font-medium text-foreground-muted flex items-center gap-1">
              <Calendar className="w-3 h-3 text-neutral-300" />
              {fmtDate(booking.dateDebut)} — {fmtDate(booking.dateFin)}
            </span>
          </div>
        </div>

        <div className="text-right flex-shrink-0">
          <p className="text-sm font-black text-foreground">{fmt(booking.totalLocataire)} <span className="text-[10px] text-foreground-muted font-bold uppercase">FCFA</span></p>
          <div className="flex items-center justify-end gap-1.5 mt-1.5">
            <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border ${theme.bg} ${theme.text} ${theme.border}`}>
              {cfg.label}
            </span>
          </div>
        </div>

        <div className="w-8 h-8 rounded-full bg-neutral-50 flex items-center justify-center border border-neutral-100 group-hover:bg-emerald-500 group-hover:border-emerald-500 transition-colors shrink-0 ml-1">
          <ChevronRight className="w-4 h-4 text-foreground-muted group-hover:text-white transition-colors" />
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
        className="w-full flex items-center gap-3 py-2.5 group outline-none"
      >
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${theme.bg} ${theme.text} ${theme.border} transition-colors group-hover:brightness-95`}>
          <div className={`w-1.5 h-1.5 rounded-full ${theme.dot}`} />
          <span className="text-[10px] font-black uppercase tracking-wider">{cfg.label}</span>
          <span className="text-[10px] font-black ml-0.5 opacity-60">{bookings.length}</span>
        </div>
        <div className="flex-1 h-[1px] bg-neutral-100 group-hover:bg-neutral-200 transition-colors" />
        <div className="w-5 h-5 rounded-full bg-neutral-50 flex items-center justify-center border border-neutral-100">
          <ChevronDown className={`w-3 h-3 text-foreground-muted transition-transform duration-300 ${open ? '' : '-rotate-90'}`} />
        </div>
      </button>

      <div className={`grid transition-all duration-300 ease-in-out ${open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="overflow-hidden">
          <div className="space-y-2 lg:space-y-1">
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
    <div className="bg-background-card rounded-2xl p-4 lg:p-6 border border-border/80 h-full min-h-[420px] flex flex-col hover:shadow-xl hover:shadow-md/40 hover:-translate-y-0.5 transition-all duration-500">

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-4 lg:mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-xl bg-emerald-50 flex items-center justify-center border border-emerald-100 shadow-sm shrink-0">
            <Bookmark className="w-[16px] h-[16px] lg:w-[18px] lg:h-[18px] text-emerald-600" />
          </div>
          <div>
            <p className="text-[10px] font-black text-foreground-muted uppercase tracking-widest">Activité</p>
            <h3 className="text-sm font-bold text-foreground">Réservations récentes</h3>
          </div>
        </div>

        <Link href="/dashboard/reservations"
          className="px-3 py-1.5 rounded-lg bg-neutral-50 hover:bg-emerald-50 text-[10px] font-bold text-foreground-muted hover:text-emerald-600 border border-neutral-100 hover:border-emerald-100 transition-colors flex items-center gap-1.5">
          Historique
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {/* ── Content ── */}
      <div className="flex-1">
        {bookings.length === 0 ? (
          <div className="h-full min-h-[200px] flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-full bg-neutral-50 flex items-center justify-center mb-3">
              <Calendar className="w-5 h-5 text-neutral-300" />
            </div>
            <p className="text-xs font-bold text-foreground">Aucune réservation</p>
            <p className="text-[10px] text-foreground-muted mt-1">Vos dernières réservations apparaîtront ici.</p>
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
