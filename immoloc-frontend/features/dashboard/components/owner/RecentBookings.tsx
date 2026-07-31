'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Calendar, ChevronRight, ImageOff, Inbox } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { netHost, STATUT_CFG_LIGHT } from '@/lib/dashboard/owner-tokens';

const nf = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });
const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });

interface Booking {
  id: string;
  dateDebut: string;
  dateFin: string;
  nbNuits?: number;
  totalLocataire: number;
  statut: string;
  locataire: { prenom?: string | null; nom?: string | null; avatarUrl?: string | null };
  // photos: any[] etait typé any.
  logement: { titre: string; ville: string; photos?: { url: string }[] };
}

interface Props {
  bookings?: Booking[] | null;
  isLoading?: boolean;
  /** Nombre de lignes affichées dans ce résumé. */
  limit?: number;
}

/* Priorité d'affichage. Les statuts absents de cette table restent visibles,
   relégués en fin de liste — l'ancien ORDER servait de filtre, donc PAID,
   qui n'y figurait pas, disparaissait purement et simplement. */
const PRIORITY: Record<string, number> = {
  DISPUTED: 0, PENDING: 1, CHECKED_IN: 2, CONFIRMED: 3, PAID: 4, COMPLETED: 5, CANCELLED: 6,
};

function Row({ booking }: { booking: Booking }) {
  const cfg = STATUT_CFG_LIGHT[booking.statut] ?? { label: booking.statut, cls: 'bg-neutral-100 text-foreground-muted', dot: 'bg-neutral-400' };
  const photo = booking.logement.photos?.[0]?.url;

  // .charAt(0) sur un nom absent levait une TypeError et cassait le rendu.
  const prenom = booking.locataire.prenom?.trim() || '';
  const nom = booking.locataire.nom?.trim() || '';
  const who = [prenom, nom ? `${nom[0]}.` : ''].filter(Boolean).join(' ') || 'Voyageur';

  return (
    <li>
      <Link
        href={`/dashboard/reservations/${booking.id}`}
        /* Le composant rendait DEUX balisages complets, mobile et desktop, en
           lg:hidden et hidden lg:flex. Les deux etaient montes : deux <Image>
           par reservation, avec des `sizes` differents donc potentiellement
           deux telechargements. Un seul balisage, responsive. */
        className="group flex items-center gap-3 rounded-inner border border-transparent p-2.5 transition-colors duration-150 hover:border-border hover:bg-background-alt"
      >
        <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-inner bg-neutral-100 sm:h-14 sm:w-14">
          {photo ? (
            <Image src={photo} alt="" fill sizes="56px" className="object-cover" />
          ) : (
            <span className="grid h-full place-items-center text-neutral-300">
              <ImageOff className="h-4 w-4" aria-hidden="true" />
            </span>
          )}
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex items-start justify-between gap-2">
            <span className="truncate font-display text-sm font-semibold leading-snug text-forest-900">
              {booking.logement.titre}
            </span>
            <span className={cn(
              'inline-flex shrink-0 items-center gap-1.5 rounded-pill px-2 py-0.5 text-[0.6875rem] font-semibold',
              cfg.cls,
            )}>
              <span className={cn('h-1.5 w-1.5 rounded-pill', cfg.dot)} />
              {cfg.label}
            </span>
          </span>

          <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-foreground-muted">
            <span className="truncate">{who}</span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 shrink-0 text-foreground-faint" aria-hidden="true" />
              {fmtDate(booking.dateDebut)} – {fmtDate(booking.dateFin)}
            </span>
          </span>
        </span>

        <span className="shrink-0 text-right">
          {/*
            L'original affichait totalLocataire : le montant paye par le
            VOYAGEUR, sur le tableau de bord de l'hote. Ailleurs dans le
            produit, la meme reservation affiche le net hote. Deux chiffres
            differents pour la meme ligne selon l'ecran.
          */}
          <span className="block text-sm font-semibold tabular-nums text-forest-900">
            {nf.format(netHost(booking.totalLocataire))}
          </span>
          <span className="block text-[0.6875rem] text-foreground-faint">FCFA net</span>
        </span>

        <ChevronRight
          className="hidden h-4 w-4 shrink-0 text-foreground-faint transition-colors group-hover:text-forest-600 sm:block"
          aria-hidden="true"
        />
      </Link>
    </li>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <section className="klef-rise flex h-full min-h-[22rem] flex-col rounded-card border border-border bg-background-card p-5 shadow-sm lg:p-6">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3 sm:flex-nowrap">
        <div className="flex min-w-0 items-center gap-3">
          {/* Le squircle etait en forest-950 a icone lime, en en-tete ET dans
              l'etat vide : deux blocs sombres sur une carte claire. */}
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-inner bg-neutral-100 text-forest-700">
            <Inbox className="h-[1.125rem] w-[1.125rem]" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-[0.6875rem] uppercase tracking-[0.12em] text-foreground-faint">Activité</p>
            <h2 className="truncate font-display text-base font-semibold tracking-[-0.015em] text-forest-900">
              Réservations récentes
            </h2>
          </div>
        </div>

        {/* Ce bouton etait en lime plein, alors que « voir l'historique » est
            une navigation secondaire. Le lime revient au CTA de la page. */}
        <Link
          href="/dashboard/reservations"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-pill border border-border px-3.5 py-2 text-xs font-semibold text-forest-800 transition-colors duration-150 hover:bg-neutral-100"
        >
          Tout voir
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </header>
      {children}
    </section>
  );
}

export function RecentBookings({ bookings, isLoading = false, limit = 5 }: Props) {
  if (isLoading) {
    return (
      <Shell>
        <div className="flex-1 animate-pulse space-y-2" aria-hidden="true">
          {[0, 1, 2, 3].map((i) => <div key={i} className="h-16 rounded-inner bg-neutral-100" />)}
        </div>
        <span className="sr-only" role="status">Chargement des réservations</span>
      </Shell>
    );
  }

  // bookings.forEach plantait si la prop etait undefined au premier rendu.
  const list = bookings ?? [];

  /*
    Liste plate, triee par urgence puis par date.

    L'original groupait par statut dans des accordeons repliables. Sur une
    carte de tableau de bord qui affiche cinq lignes, ca ajoute un niveau de
    hierarchie et un clic pour une information de survol. Et les liens des
    groupes replies restaient dans le DOM, donc atteignables au clavier alors
    qu'ils etaient invisibles.
  */
  const sorted = [...list].sort((a, b) => {
    const pa = PRIORITY[a.statut] ?? 99;
    const pb = PRIORITY[b.statut] ?? 99;
    if (pa !== pb) return pa - pb;
    return new Date(b.dateDebut).getTime() - new Date(a.dateDebut).getTime();
  });

  const shown = sorted.slice(0, limit);
  const rest = sorted.length - shown.length;

  if (shown.length === 0) {
    return (
      <Shell>
        <div className="flex flex-1 flex-col items-center justify-center gap-2.5 text-center">
          <span className="grid h-11 w-11 place-items-center rounded-inner bg-neutral-100 text-foreground-muted">
            <Calendar className="h-5 w-5" aria-hidden="true" />
          </span>
          <p className="text-sm font-medium text-forest-900">Aucune réservation</p>
          <p className="max-w-[18rem] text-xs leading-relaxed text-foreground-muted">
            Les demandes de vos voyageurs apparaîtront ici dès la première.
          </p>
          <Link
            href="/dashboard/annonces"
            className="mt-2 inline-flex items-center gap-1.5 rounded-pill border border-border px-4 py-2 text-xs font-semibold text-forest-800 transition-colors duration-150 hover:bg-neutral-100"
          >
            Améliorer mes annonces
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <ul className="flex-1 space-y-1">
        {shown.map((b) => <Row key={b.id} booking={b} />)}
      </ul>

      {rest > 0 && (
        <p className="mt-3 border-t border-border pt-3 text-center text-xs text-foreground-muted">
          <Link href="/dashboard/reservations" className="font-medium text-forest-700 hover:underline">
            {rest} autre{rest > 1 ? 's' : ''} réservation{rest > 1 ? 's' : ''}
          </Link>
        </p>
      )}
    </Shell>
  );
}