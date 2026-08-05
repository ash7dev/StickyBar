'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Heart, ImageOff, MapPin, RotateCcw, SearchX, ShieldCheck, Star, Users } from 'lucide-react';
import type { Listing } from '@/lib/nestjs/types';
import { cn } from '@/lib/utils/cn';

import { getPrixPublic, getPrixDerniereMinute } from '@/lib/pricing';
import { TenantPriceDisplay } from '@/components/ui/TenantPriceDisplay';

const money = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });
const rating = new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

interface ResultsGridProps {
  listings: Listing[];
  /** Nombre de nuits issu des filtres. Si fourni, le prix total devient l'info principale. */
  nights?: number;
}

export function ResultsGrid({ listings, nights }: ResultsGridProps) {
  if (!listings?.length) {
    return <EmptyState />;
  }

  return (
    <ul className="flex flex-col gap-4">
      {listings.map((listing, i) => (
        <li key={listing.id}>
          <ListingRow listing={listing} nights={nights} priority={i < 3} />
        </li>
      ))}
    </ul>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-card border border-border bg-background-card p-8 sm:p-12 text-center shadow-xs">
      <div className="mb-4 grid h-14 w-14 place-items-center rounded-pill bg-forest-50 text-forest-700 border border-forest-100">
        <SearchX className="h-7 w-7 text-forest-600" aria-hidden="true" />
      </div>

      <h3 className="font-display text-lg sm:text-xl font-semibold text-forest-900">
        Aucun logement ne correspond à vos critères
      </h3>

      <p className="mt-2 max-w-md text-sm leading-relaxed text-foreground-muted">
        Essayez d’élargir vos filtres, d’ajuster le budget ou de découvrir les offres dans une autre ville au Sénégal.
      </p>

      {/* Actions */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/explorer"
          className="inline-flex items-center gap-2 rounded-pill bg-forest-950 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-forest-900 active:scale-95 shadow-sm"
        >
          <RotateCcw className="h-4 w-4 text-lime-400" aria-hidden="true" />
          Réinitialiser tous les filtres
        </Link>
      </div>

      {/* Villes populaires suggérées */}
      <div className="mt-8 border-t border-border pt-6 w-full max-w-md">
        <p className="text-[0.6875rem] font-semibold uppercase tracking-wider text-foreground-faint mb-3">
          Villes populaires à explorer
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {['Dakar', 'Saly', 'Ngor', 'Somone', 'Saint-Louis'].map((v) => (
            <Link
              key={v}
              href={`/explorer?ville=${encodeURIComponent(v)}`}
              className="inline-flex items-center gap-1.5 rounded-pill border border-border bg-background-alt px-3 py-1.5 text-xs font-medium text-forest-900 hover:border-forest-400 hover:bg-forest-50 transition-colors"
            >
              <MapPin className="h-3 w-3 text-forest-600" aria-hidden="true" />
              {v}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

function ListingRow({
  listing,
  nights,
  priority = false,
}: {
  listing: Listing;
  nights?: number;
  priority?: boolean;
}) {
  const photos = listing.photos ?? [];
  const [idx, setIdx] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);

  const current = photos[idx]?.url;
  const titre = listing.titre?.trim() || 'Logement sans titre';
  const lieu = [listing.quartier?.trim(), listing.ville?.trim()].filter(Boolean).join(', ') || 'Sénégal';

  const derniereMinuteActive = Boolean((listing as { derniereMinuteActive?: boolean }).derniereMinuteActive);
  const prix = getPrixPublic(listing.prixBase);
  const prixFinal = derniereMinuteActive ? getPrixDerniereMinute(prix) : prix;
  const total = nights ? prixFinal * nights : null;
  const hasNote = typeof listing.note === 'number' && listing.note > 0;

  /*
    `verifie` vient exclusivement du backend. L'ancien calcul
    `note >= 4.5 || totalSejours >= 5` fabriquait une vérification à partir
    de la popularité : un logement jamais visité par un agent obtenait le
    badge à sa cinquième réservation.
  */
  const verifie = Boolean((listing as { verifie?: boolean }).verifie);

  /*
    Aucun équipement de repli. L'ancien code injectait « Climatisation »,
    « Wifi » et « Parking » quand la base était vide — donc affichait des
    prestations potentiellement inexistantes, sur lesquelles le locataire
    fonde sa réservation.
  */
  const equipements = (listing.equipements ?? []).slice(0, 3);

  const prop = (listing as { proprietaire?: { prenom?: string; nom?: string } }).proprietaire;
  const ownerName = prop?.prenom
    ? `${prop.prenom}${prop.nom ? ` ${prop.nom[0]}.` : ''}`
    : null;

  const move = (dir: 1 | -1) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIdx((p) => (p + dir + photos.length) % photos.length);
  };

  return (
    <article className="group relative isolate flex flex-col overflow-hidden rounded-card border border-border bg-background-card shadow-xs transition-[box-shadow,transform] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:shadow-md motion-reduce:transform-none motion-reduce:transition-none sm:flex-row">

      {/* ── Photo ───────────────────────────────────────────────────────── */}
      <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden bg-neutral-100 sm:aspect-auto sm:min-h-[13.5rem] sm:w-[17.5rem] lg:w-[20rem]">
        {current ? (
          <Image
            src={current}
            alt=""
            fill
            priority={priority}
            sizes="(max-width: 640px) 100vw, 320px"
            className="object-cover transition-transform duration-[320ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.03] motion-reduce:transform-none"
          />
        ) : (
          <div className="grid h-full place-items-center text-neutral-300">
            <ImageOff className="h-7 w-7" aria-hidden="true" />
            <span className="sr-only">Photo non disponible</span>
          </div>
        )}

        {/*
          Le double voile noir (from-black/40 … to-black/20) est supprimé.
          Il ternissait chaque photo sans qu'aucun texte n'ait besoin de
          contraste dessus. Il ne reste qu'un voile bas, en vert forêt et
          non en noir, uniquement là où se posent les puces.
        */}
        {photos.length > 1 && (
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-forest-950/45 to-transparent"
            aria-hidden="true"
          />
        )}

        {verifie && (
          <span className="glass-dark absolute left-3 top-3 z-20 inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1 text-[0.6875rem] font-semibold text-gold-300">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            Vérifié
          </span>
        )}

        <button
          type="button"
          onClick={() => setIsFavorite((v) => !v)}
          aria-pressed={isFavorite}
          aria-label={isFavorite ? `Retirer ${titre} des favoris` : `Ajouter ${titre} aux favoris`}
          className={cn(
            'absolute right-3 top-3 z-20 grid h-9 w-9 place-items-center rounded-pill border transition-colors duration-150 active:scale-95',
            isFavorite
              ? 'border-error-500/25 bg-white text-error-500'
              : 'border-white/60 bg-white/85 text-forest-700 backdrop-blur-md hover:bg-white',
          )}
        >
          <Heart className={cn('h-4 w-4', isFavorite && 'fill-current')} aria-hidden="true" />
        </button>

        {photos.length > 1 && (
          <>
            {/* Les flèches n'apparaissaient qu'au survol : elles étaient donc
                inaccessibles au tactile. Visibles par défaut, masquées jusqu'au
                survol uniquement sur les appareils à pointeur. */}
            {([['prev', -1, ChevronLeft, 'left-2'], ['next', 1, ChevronRight, 'right-2']] as const).map(
              ([key, dir, Icon, side]) => (
                <button
                  key={key}
                  type="button"
                  onClick={move(dir)}
                  aria-label={dir === -1 ? 'Photo précédente' : 'Photo suivante'}
                  className={cn(
                    'absolute top-1/2 z-20 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-pill bg-white/85 text-forest-800 shadow-sm backdrop-blur-sm transition-opacity duration-150 hover:bg-white',
                    side,
                    '[@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:focus-visible:opacity-100',
                  )}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </button>
              ),
            )}

            <div className="absolute inset-x-0 bottom-3 z-20 flex items-center justify-center gap-1" aria-hidden="true">
              {photos.slice(0, 5).map((_, i) => (
                <span
                  key={i}
                  className={cn(
                    'h-1.5 rounded-pill bg-white transition-all duration-150',
                    i === idx ? 'w-3' : 'w-1.5 opacity-55',
                  )}
                />
              ))}
              {photos.length > 5 && (
                <span className="ml-0.5 text-[0.625rem] font-semibold text-white/80">+{photos.length - 5}</span>
              )}
            </div>
          </>
        )}
      </div>

      {/* ── Contenu ─────────────────────────────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col justify-between p-5">
        <div>
          <div className="flex items-start justify-between gap-3">
            <p className="flex min-w-0 items-center gap-1.5 text-[0.8125rem] text-foreground-muted flex-wrap">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-forest-600" aria-hidden="true" />
              <span className="truncate">{lieu}</span>
              {listing.distanceKm !== undefined && listing.distanceKm !== null && (
                <span className="inline-flex items-center gap-0.5 rounded-full bg-forest-50 px-2 py-0.5 text-[10px] font-extrabold text-forest-800 border border-forest-100/80 shrink-0">
                  📍 À {(listing.distanceKm as number).toFixed(1)} km
                </span>
              )}
            </p>

            {hasNote && (
              <span className="flex shrink-0 items-center gap-1 text-sm">
                {/* gold-400 plafonnait à 2.40:1 sur blanc, sous le seuil de 3:1
                    applicable aux graphiques porteurs de sens. */}
                <Star className="h-3.5 w-3.5 fill-current text-gold-500" aria-hidden="true" />
                <span className="font-semibold tabular-nums text-foreground">{rating.format(listing.note!)}</span>
                {(listing.totalSejours ?? 0) > 0 && (
                  <span className="text-xs tabular-nums text-foreground-faint">({listing.totalSejours})</span>
                )}
              </span>
            )}
          </div>

          <h3 className="mt-1.5 font-display text-xl font-semibold leading-snug tracking-[-0.015em] text-forest-900">
            <Link
              href={`/explorer/${listing.id}`}
              className="line-clamp-1 after:absolute after:inset-0 after:z-10 after:content-[''] focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-ring"
            >
              {titre}
            </Link>
          </h3>

          {/* L'année de `createdAt` a été retirée : c'était l'année du modèle
              de voiture chez Gunóor. Sur un logement, elle ne dit rien. */}
          <p className="mt-1 text-[0.8125rem] text-foreground-muted">
            {formatType(listing.type, listing.sousType)}
            {listing.nombreChambres ? ` · ${listing.nombreChambres} chambre${listing.nombreChambres > 1 ? 's' : ''}` : ''}
            {listing.nombreSallesBain ? ` · ${listing.nombreSallesBain} sdb` : ''}
          </p>

          <ul className="mt-3.5 flex flex-wrap gap-1.5">
            <Chip>
              <Users className="h-3.5 w-3.5 text-neutral-500" aria-hidden="true" />
              {listing.capaciteMax ?? 1} pers.
            </Chip>
            {equipements.map((eq) => (
              <Chip key={eq.id ?? eq.nom}>{eq.nom}</Chip>
            ))}
          </ul>
        </div>

        <div className="mt-4 flex items-end justify-between gap-3 border-t border-border pt-3.5">
          <div className="min-w-0">
            {ownerName && (
              <div className="flex items-center gap-2">
                {/* L'initiale était en lime-300 : l'accent portait du texte.
                    forest-700 sur forest-100 donne 7.4:1 et reste sobre. */}
                <span
                  className="grid h-7 w-7 shrink-0 place-items-center rounded-pill bg-forest-100 text-xs font-semibold text-forest-700"
                  aria-hidden="true"
                >
                  {ownerName[0].toUpperCase()}
                </span>
                <span className="truncate text-[0.8125rem] text-foreground-muted">{ownerName}</span>
              </div>
            )}
            {/* La seule touche de lime du contenu, et elle sert la promesse
                produit. lime-700 échouait à 3.50:1 sur blanc en petit corps. */}
            <p className="mt-1.5 text-[0.6875rem] font-medium text-lime-800">
              Payé à la remise des clés
            </p>
          </div>

          <div className="shrink-0 text-right">
            <TenantPriceDisplay
              prixBase={listing.prixBase}
              derniereMinuteActive={derniereMinuteActive}
              size="md"
            />
          </div>
        </div>
      </div>
    </article>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <li className="inline-flex items-center gap-1.5 rounded-pill bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-700">
      {children}
    </li>
  );
}

function formatType(type?: string | null, sousType?: string | null): string {
  if (sousType?.trim()) return sousType.trim();
  if (!type) return 'Logement';
  const labels: Record<string, string> = {
    VILLA: 'Villa',
    APPARTEMENT: 'Appartement',
    CHAMBRE: 'Chambre',
    AUTRES: 'Autre',
    AUTRE: 'Autre',
  };
  return labels[type.toUpperCase()] ?? type;
}