'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Heart, ImageOff, ShieldCheck, Star } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Formateurs créés une seule fois, avec locale explicite.
//
// `prixBase.toLocaleString()` sans locale utilisait celle du runtime : Node
// côté serveur et le navigateur côté client peuvent différer, ce qui provoque
// une erreur d'hydratation sur un texte aussi visible que le prix.
// ─────────────────────────────────────────────────────────────────────────────

const money = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });
const rating = new Intl.NumberFormat('fr-FR', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

export interface ListingCardProps {
  id: string;
  slug?: string;
  titre: string;
  type: string;
  sousType?: string;
  ville: string;
  quartier?: string;
  prixBase: number;
  note: number | null;
  totalSejours: number;
  photos: { url: string }[];
  /** Vérification par un agent — signal de confiance, mérité. */
  verifie?: boolean;
  /** Mise en avant payante — signal commercial. Volontairement discret. */
  sponsorise?: boolean;
  isFavorite?: boolean;
  onToggleFavorite?: (id: string, next: boolean) => void;
  /** À activer pour les cartes visibles au chargement. */
  priority?: boolean;
  variant?: 'standard' | 'premium';
}

export function ListingCard({
  id,
  slug,
  titre,
  type,
  sousType,
  ville,
  quartier,
  prixBase,
  note,
  totalSejours,
  photos,
  verifie = false,
  sponsorise = false,
  isFavorite = false,
  onToggleFavorite,
  priority = false,
}: ListingCardProps) {
  const src = photos?.[0]?.url;
  const lieu = quartier ? `${quartier}, ${ville}` : ville;
  const categorie = sousType ?? type;

  return (
    /*
      Structure corrigée. Avant, le bouton favori était un <button> imbriqué
      dans un <a> : c'est invalide en HTML (contenu interactif dans un lien),
      et les lecteurs d'écran comme certains navigateurs s'y perdent. Le
      preventDefault ne faisait que masquer le symptôme.

      Ici : l'article est le conteneur, le lien s'étire par ::after sur toute
      la carte, et le favori se pose au-dessus avec un z-index supérieur.
    */
    <article className="group relative isolate flex flex-col overflow-hidden rounded-card border border-border bg-background-card transition-[box-shadow,transform] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:shadow-md motion-reduce:transform-none motion-reduce:transition-none">

      {/* ── Photo ───────────────────────────────────────────────────────── */}
      <div className="relative aspect-[4/3] overflow-hidden bg-neutral-100">
        {src ? (
          <Image
            src={src}
            alt=""
            fill
            priority={priority}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-[320ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.03] motion-reduce:transform-none motion-reduce:transition-none"
          />
        ) : (
          /* « Aucune photo » en texte gris lisait comme une carte cassée.
             Un pictogramme sur la teinte neutre lit comme un état assumé. */
          <div className="grid h-full place-items-center text-neutral-300">
            <ImageOff className="h-7 w-7" aria-hidden="true" />
            <span className="sr-only">Photo non disponible</span>
          </div>
        )}

        {/*
          Un seul badge sur la photo, et c'est le signal de confiance.
          Le badge « Premium » doré occupait cette place : sur une plateforme
          à séquestre, un statut payant ne doit pas ressembler à un gage de
          qualité vérifiée. Il est descendu dans le contenu, en neutre.
        */}
        {verifie && (
          <span className="glass-dark absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1 text-[0.6875rem] font-semibold text-neutral-50">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            Vérifié
          </span>
        )}

        <button
          type="button"
          onClick={() => onToggleFavorite?.(id, !isFavorite)}
          aria-pressed={isFavorite}
          aria-label={isFavorite ? `Retirer ${titre} des favoris` : `Ajouter ${titre} aux favoris`}
          className={`absolute right-3 top-3 z-20 grid h-9 w-9 place-items-center rounded-pill border transition-colors duration-150 ${
            isFavorite
              ? 'border-error-500/25 bg-white text-error-500'
              : 'border-white/60 bg-white/80 text-forest-700 backdrop-blur-md hover:bg-white'
          }`}
        >
          {/* Le favori était en lime-400 quand actif. Le lime est la couleur
              de l'action principale : l'attribuer à un favori le banalise. */}
          <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} aria-hidden="true" />
        </button>
      </div>

      {/* ── Contenu ─────────────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col p-4">

        <div className="flex items-start justify-between gap-3">
          <h3 className="min-w-0 font-display text-[1.0625rem] font-semibold leading-snug tracking-[-0.01em] text-forest-900">
            <Link
              href={`/explorer/${slug ?? id}`}
              className="line-clamp-1 after:absolute after:inset-0 after:z-10 after:content-[''] focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-ring"
            >
              {titre}
            </Link>
          </h3>

          {note !== null && note > 0 && (
            <span className="flex shrink-0 items-center gap-1 text-sm">
              {/* gold-400 sur blanc plafonnait à 2.40:1, sous le seuil de 3:1
                  applicable aux graphiques porteurs de sens. gold-500 passe. */}
              <Star className="h-3.5 w-3.5 fill-current text-gold-500" aria-hidden="true" />
              <span className="font-semibold tabular-nums text-foreground">
                {rating.format(note)}
              </span>
              {totalSejours > 0 && (
                <span className="text-xs text-foreground-faint tabular-nums">
                  ({totalSejours})
                </span>
              )}
            </span>
          )}
        </div>

        {/* Lieu et catégorie sur une seule ligne : le badge sousType occupait
            un troisième emplacement sur la photo pour une information de
            second plan. */}
        <p className="mt-1 line-clamp-1 text-sm text-foreground-muted">
          {lieu}
          {categorie && <span className="text-foreground-faint"> · {categorie}</span>}
        </p>

        <div className="mt-auto flex items-end justify-between gap-3 pt-3">
          <p className="flex items-baseline gap-1">
            <span className="text-[1.125rem] font-semibold tabular-nums tracking-[-0.01em] text-foreground">
              {money.format(prixBase)}
            </span>
            <span className="text-[0.8125rem] font-medium text-foreground-muted">FCFA</span>
            <span className="text-[0.8125rem] text-foreground-faint">/ nuit</span>
          </p>

          {sponsorise && (
            <span className="shrink-0 rounded-pill bg-neutral-100 px-2 py-0.5 text-[0.6875rem] font-medium text-foreground-faint">
              Mis en avant
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Squelette — mêmes dimensions exactes que la carte, pour éviter le décalage
// de mise en page au moment du remplacement.
// ─────────────────────────────────────────────────────────────────────────────

export function ListingCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-card border border-border bg-background-card" aria-hidden="true">
      <div className="aspect-[4/3] animate-pulse bg-neutral-100" />
      <div className="p-4">
        <div className="h-[1.0625rem] w-3/4 animate-pulse rounded bg-neutral-100" />
        <div className="mt-2.5 h-3.5 w-1/2 animate-pulse rounded bg-neutral-100" />
        <div className="mt-5 h-[1.125rem] w-2/5 animate-pulse rounded bg-neutral-100" />
      </div>
    </div>
  );
}