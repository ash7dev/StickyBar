'use client';

import { useCallback, useEffect, useRef, useState, use } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ShieldCheck, Star, Home, MessageSquare, MapPin, Calendar, Clock,
  Share2, Check, Award, Sparkles, ArrowLeft, ChevronRight, Users,
} from 'lucide-react';
import { nestFetch, NEST_API } from '@/lib/nestjs';
import { cn } from '@/lib/utils/cn';

/**
 * Majoration appliquée au prix de base avant affichage public.
 * ⚠️ NE JAMAIS RETIRER — cette page affichait prixBase brut, donc un prix
 * inférieur à celui de la fiche logement et du checkout.
 * À centraliser dans `@/lib/pricing`.
 */
const MARKUP = 1.07;

const prixPublic = (base: number | string | null | undefined) =>
  Math.round(Number(base ?? 0) * MARKUP).toLocaleString('fr-FR');

interface OwnerData {
  owner: {
    id: string;
    userId: string;
    prenom: string;
    nom: string;
    avatarUrl: string | null;
    creeLe: string;
    statutKyc: string;
    estProprietaire: boolean;
    noteProprietaire: string;
    totalAvis: number;
    isSuperhost: boolean;
    isKycVerified: boolean;
  };
  stats: {
    totalLogements: number;
    noteMoyenne: string;
    totalAvisCount: number;
    tauxReponse: string;
    delaiReponse: string;
  };
  logements: Array<{
    id: string;
    slug: string;
    titre: string;
    description: string | null;
    prixBase?: number;
    prixParNuit?: number;
    ville: string;
    quartier: string | null;
    capaciteMax: number;
    nbChambres: number;
    nbSallesDeBain: number;
    note: number;
    totalAvis: number;
    photos: Array<{ url: string; estCouverture: boolean; position: number }>;
  }>;
  avis: Array<{
    id: string;
    note: number;
    commentaire: string;
    typeAvis: string;
    creeLe: string;
    auteur: { id: string; prenom: string; nom: string; avatarUrl: string | null };
    reservation: {
      id: string;
      logement: { id: string; titre: string; slug: string } | null;
    } | null;
  }>;
}

type TabId = 'annonces' | 'avis' | 'apropos';

const TABS: Array<{ id: TabId; label: string; icon: typeof Home }> = [
  { id: 'annonces', label: 'Annonces', icon: Home },
  { id: 'avis', label: 'Avis', icon: MessageSquare },
  { id: 'apropos', label: 'À propos', icon: ShieldCheck },
];

/* ═══ SKELETON ═══════════════════════════════════════════════════════════════
   Calqué sur la structure réelle : mêmes rayons, mêmes hauteurs, mêmes
   gouttières. Un skeleton qui ne correspond pas au contenu final produit un
   saut de mise en page à l'arrivée des données — l'inverse de l'effet
   recherché.                                                                */

function Shimmer({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-inner bg-border', className)} />;
}

function OwnerProfileSkeleton() {
  return (
    <div className="bg-canvas pt-6 pb-20" aria-busy="true" aria-live="polite">
      <span className="sr-only">Chargement du profil de l’hôte…</span>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <Shimmer className="mb-6 h-4 w-40 rounded-pill" />

        {/* Hero sombre */}
        <div className="mb-8 overflow-hidden rounded-card bg-surface-inverse p-6 sm:p-8 lg:p-10">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start sm:gap-8">
            <div className="h-28 w-28 shrink-0 animate-pulse rounded-card bg-white/10 sm:h-32 sm:w-32" />
            <div className="w-full space-y-3">
              <div className="h-8 w-56 animate-pulse rounded-pill bg-white/10" />
              <div className="h-4 w-44 animate-pulse rounded-pill bg-white/[0.07]" />
              <div className="flex gap-2 pt-1">
                <div className="h-7 w-32 animate-pulse rounded-pill bg-white/[0.07]" />
                <div className="h-7 w-36 animate-pulse rounded-pill bg-white/[0.07]" />
              </div>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-3 gap-3 border-t border-border-inverse pt-6 sm:gap-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="space-y-2 text-center">
                <div className="mx-auto h-7 w-12 animate-pulse rounded-pill bg-white/10" />
                <div className="mx-auto h-3 w-20 animate-pulse rounded-pill bg-white/[0.07]" />
              </div>
            ))}
          </div>
        </div>

        {/* Onglets */}
        <div className="mb-8 flex justify-center gap-8 border-b border-border pb-3">
          {[0, 1, 2].map((i) => (
            <Shimmer key={i} className="h-4 w-24 rounded-pill" />
          ))}
        </div>

        {/* Grille d’annonces */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="overflow-hidden rounded-card border border-border bg-background-card">
              <Shimmer className="aspect-4/3 rounded-none" />
              <div className="space-y-3 p-5">
                <Shimmer className="h-3 w-28 rounded-pill" />
                <Shimmer className="h-5 w-full rounded-pill" />
                <Shimmer className="h-3 w-4/5 rounded-pill" />
                <div className="flex items-center justify-between border-t border-border pt-4">
                  <Shimmer className="h-3 w-32 rounded-pill" />
                  <Shimmer className="h-3 w-20 rounded-pill" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══ PAGE ═══════════════════════════════════════════════════════════════ */

export default function OwnerPublicProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: ownerId } = use(params);

  const [data, setData] = useState<OwnerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('annonces');
  const [copied, setCopied] = useState(false);

  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await nestFetch<OwnerData>(NEST_API.USERS.OWNER_PROFILE(ownerId));
        if (!cancelled) setData(res);
      } catch (err) {
        if (cancelled) return;
        const message =
          err instanceof Error ? err.message : 'Impossible de charger le profil de l’hôte.';
        setError(message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [ownerId]);

  /* Nettoyage du timer : sans ça, un démontage pendant les 2,5 s déclenche
     un setState sur un composant démonté.                                  */
  useEffect(() => () => {
    if (copyTimer.current) clearTimeout(copyTimer.current);
  }, []);

  const handleShare = useCallback(async () => {
    const url = window.location.href;
    const title = data ? `${data.owner.prenom} ${data.owner.nom} sur Klef` : 'Klef';

    // Partage natif sur mobile, presse-papiers en repli.
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        /* Partage annulé par l’utilisateur — on retombe sur la copie. */
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      if (copyTimer.current) clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopied(false), 2500);
    } catch {
      /* clipboard indisponible (contexte non sécurisé) — on n’affiche pas
         un faux « Lien copié ». */
    }
  }, [data]);

  /** Navigation clavier des onglets — Flèches, Début, Fin (pattern ARIA). */
  const handleTabKeyDown = useCallback((e: React.KeyboardEvent, index: number) => {
    const last = TABS.length - 1;
    let next: number | null = null;

    if (e.key === 'ArrowRight') next = index === last ? 0 : index + 1;
    else if (e.key === 'ArrowLeft') next = index === 0 ? last : index - 1;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = last;

    if (next === null) return;
    e.preventDefault();
    setActiveTab(TABS[next].id);
    tabRefs.current[next]?.focus();
  }, []);

  if (loading) return <OwnerProfileSkeleton />;

  if (error || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas p-4">
        <div className="w-full max-w-md rounded-card border border-border bg-background-card p-8 text-center shadow-lg">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-pill border border-error-500/20 bg-error-50">
            <ShieldCheck className="h-6 w-6 text-error-600" />
          </div>
          <h2 className="mb-2 font-display text-xl font-semibold text-foreground">
            Profil introuvable
          </h2>
          <p className="mb-6 text-sm text-foreground-muted">
            {error || 'Ce profil d’hôte n’existe plus ou n’est pas accessible.'}
          </p>
          <Link
            href="/explorer"
            className="inline-flex items-center gap-2 rounded-pill bg-button-primary px-6 py-3 text-sm font-semibold text-on-button-primary transition-colors hover:bg-button-primary-hover"
          >
            <ArrowLeft className="h-4 w-4" />
            Explorer les logements
          </Link>
        </div>
      </div>
    );
  }

  const { owner, stats, logements, avis } = data;
  const initiales = `${owner.prenom[0] ?? ''}${owner.nom[0] ?? ''}`.toUpperCase();
  const dateMembre = new Date(owner.creeLe).toLocaleDateString('fr-FR', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="bg-canvas pt-6 pb-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">

        <Link
          href="/explorer"
          className="group mb-6 inline-flex items-center gap-2 text-xs font-semibold text-foreground-muted transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          Retour aux annonces
        </Link>

        {/* ═══ HERO ═══════════════════════════════════════════════════════
            Carte sombre encastrée : c’est le geste signature du système, et
            il isole l’hôte du reste de la page bien mieux qu’une carte
            blanche de plus.                                                */}

        <header className="section-inverse relative mb-8 overflow-hidden p-6 sm:p-8 lg:p-10">
          {/* Un seul halo, dans le vert de la marque. Deux blobs lime en
              décoration diluaient l’accent avant même le premier CTA. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-24 right-0 h-72 w-72 rounded-pill bg-forest-700/40 blur-3xl"
          />

          <div className="relative flex flex-col items-center justify-between gap-6 md:flex-row md:items-start md:gap-8">
            <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:items-start sm:text-left">

              {/* Avatar */}
              <div className="relative shrink-0">
                <div className="relative flex h-28 w-28 items-center justify-center overflow-hidden rounded-card bg-forest-800 font-display text-3xl font-semibold text-on-inverse ring-4 ring-white/10 sm:h-32 sm:w-32">
                  {owner.avatarUrl ? (
                    <Image
                      src={owner.avatarUrl}
                      alt={`${owner.prenom} ${owner.nom}`}
                      fill
                      sizes="128px"
                      className="object-cover"
                    />
                  ) : (
                    initiales
                  )}
                </div>

                {owner.isKycVerified && (
                  <span className="absolute -right-2 -bottom-2 flex h-9 w-9 items-center justify-center rounded-inner border-2 border-surface-inverse bg-gold-400 text-forest-900">
                    <ShieldCheck className="h-5 w-5" aria-hidden="true" />
                    <span className="sr-only">Compte vérifié Klef</span>
                  </span>
                )}
              </div>

              {/* Identité */}
              <div className="min-w-0">
                <div className="mb-2 flex flex-wrap items-center justify-center gap-2.5 sm:justify-start">
                  <h1 className="font-display text-2xl font-semibold tracking-tight text-on-inverse-display sm:text-3xl">
                    {owner.prenom} {owner.nom}
                  </h1>

                  {owner.isSuperhost && (
                    <span className="inline-flex items-center gap-1.5 rounded-pill border border-gold-400/30 bg-gold-400/12 px-3 py-1 text-xs font-semibold text-gold-300">
                      <Award className="h-3.5 w-3.5" aria-hidden="true" />
                      Superhôte
                    </span>
                  )}

                  {owner.isKycVerified && (
                    <span className="inline-flex items-center gap-1.5 rounded-pill border border-gold-400/30 bg-gold-400/12 px-3 py-1 text-xs font-semibold text-gold-300">
                      <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                      Vérifié Klef
                    </span>
                  )}
                </div>

                <p className="mb-4 flex items-center justify-center gap-2 text-sm text-on-inverse-muted sm:justify-start">
                  <Calendar className="h-4 w-4 shrink-0" aria-hidden="true" />
                  Membre sur Klef depuis {dateMembre}
                </p>

                <div className="flex flex-wrap items-center justify-center gap-2.5 sm:justify-start">
                  <span className="inline-flex items-center gap-1.5 rounded-pill border border-border-inverse bg-white/5 px-3.5 py-1.5 text-xs font-semibold text-on-inverse">
                    <Clock className="h-3.5 w-3.5 text-on-inverse-marker" aria-hidden="true" />
                    Réponse : {stats.delaiReponse}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-pill border border-border-inverse bg-white/5 px-3.5 py-1.5 text-xs font-semibold text-on-inverse">
                    <Sparkles className="h-3.5 w-3.5 text-on-inverse-marker" aria-hidden="true" />
                    Acceptation : {stats.tauxReponse}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleShare}
              className="flex w-full shrink-0 items-center justify-center gap-2 rounded-pill border border-border-inverse bg-white/5 px-5 py-2.5 text-xs font-semibold text-on-inverse transition-colors hover:bg-white/10 active:scale-[0.98] sm:w-auto"
            >
              {copied ? (
                <Check className="h-4 w-4 text-on-inverse-marker" aria-hidden="true" />
              ) : (
                <Share2 className="h-4 w-4" aria-hidden="true" />
              )}
              {copied ? 'Lien copié' : 'Partager'}
            </button>
          </div>

          {/* Statistiques */}
          <dl className="relative mt-8 grid grid-cols-3 gap-3 border-t border-border-inverse pt-6 sm:gap-4">
            {[
              { value: stats.totalLogements, label: 'Annonces', star: false },
              { value: stats.noteMoyenne, label: 'Note globale', star: true },
              { value: stats.totalAvisCount, label: 'Avis reçus', star: false },
            ].map(({ value, label, star }) => (
              <div key={label} className="text-center">
                <dd className="flex items-center justify-center gap-1.5 font-display text-2xl font-semibold tabular-nums text-on-inverse">
                  {value}
                  {star && (
                    <Star className="h-4 w-4 fill-gold-400 text-gold-400" aria-hidden="true" />
                  )}
                </dd>
                <dt className="mt-1 text-xs font-semibold uppercase tracking-wider text-on-inverse-muted">
                  {label}
                </dt>
              </div>
            ))}
          </dl>
        </header>

        {/* ═══ ONGLETS ═══════════════════════════════════════════════════ */}

        <div className="mb-8 flex justify-center border-b border-border">
          <div role="tablist" aria-label="Sections du profil" className="flex items-center gap-8">
            {TABS.map((tab, index) => {
              const Icon = tab.icon;
              const selected = activeTab === tab.id;
              const count =
                tab.id === 'annonces' ? logements.length : tab.id === 'avis' ? avis.length : null;

              return (
                <button
                  key={tab.id}
                  ref={(el) => { tabRefs.current[index] = el; }}
                  type="button"
                  role="tab"
                  id={`onglet-${tab.id}`}
                  aria-selected={selected}
                  aria-controls={`panneau-${tab.id}`}
                  tabIndex={selected ? 0 : -1}
                  onClick={() => setActiveTab(tab.id)}
                  onKeyDown={(e) => handleTabKeyDown(e, index)}
                  className={cn(
                    'flex items-center gap-2 border-b-2 py-3 text-xs font-semibold uppercase tracking-wider transition-colors',
                    selected
                      ? 'border-forest-600 text-forest-700'
                      : 'border-transparent text-foreground-muted hover:text-foreground',
                  )}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {tab.label}
                  {count !== null && <span className="tabular-nums opacity-70">({count})</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* ═══ ANNONCES ══════════════════════════════════════════════════ */}

        {activeTab === 'annonces' && (
          <section role="tabpanel" id="panneau-annonces" aria-labelledby="onglet-annonces">
            {logements.length === 0 ? (
              <EmptyState
                icon={Home}
                title="Aucune annonce publiée"
                text="Cet hôte n’a pas d’annonce active pour le moment."
              />
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {logements.map((logement) => {
                  const cover =
                    logement.photos.find((p) => p.estCouverture)?.url ??
                    logement.photos[0]?.url ??
                    '/hero-bg.png';

                  return (
                    /* Carte entièrement cliquable : un seul élément
                       interactif, pas de lien imbriqué dans un lien. */
                    <Link
                      key={logement.id}
                      href={`/explorer/${logement.slug || logement.id}`}
                      className="group flex flex-col overflow-hidden rounded-card border border-border bg-background-card shadow-sm transition-[box-shadow,border-color] duration-200 hover:border-border-hover hover:shadow-md"
                    >
                      <div className="relative aspect-4/3 overflow-hidden bg-background-alt">
                        <Image
                          src={cover}
                          alt={logement.titre}
                          fill
                          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        {/* Glass légitime : il y a une photo derrière. */}
                        <span className="glass-dark absolute top-3 right-3 rounded-pill px-3 py-1 text-xs font-semibold tabular-nums">
                          {prixPublic(logement.prixBase ?? logement.prixParNuit)} FCFA
                          <span className="font-normal opacity-75"> / nuit</span>
                        </span>
                      </div>

                      <div className="flex flex-1 flex-col justify-between p-5">
                        <div>
                          <div className="mb-1.5 flex items-center justify-between gap-2 text-xs text-foreground-muted">
                            <span className="flex min-w-0 items-center gap-1">
                              <MapPin className="h-3.5 w-3.5 shrink-0 text-forest-600" aria-hidden="true" />
                              <span className="truncate">
                                {logement.ville}
                                {logement.quartier ? ` · ${logement.quartier}` : ''}
                              </span>
                            </span>
                            <span className="flex shrink-0 items-center gap-1 font-semibold text-foreground">
                              <Star className="h-3.5 w-3.5 fill-gold-400 text-gold-400" aria-hidden="true" />
                              <span className="tabular-nums">
                                {Number(logement.note || 5).toFixed(1)}
                              </span>
                              <span className="font-normal text-foreground-muted tabular-nums">
                                ({logement.totalAvis})
                              </span>
                            </span>
                          </div>

                          <h3 className="mt-1 font-display text-base font-semibold text-foreground transition-colors line-clamp-2 group-hover:text-forest-700">
                            {logement.titre}
                          </h3>

                          <p className="mt-2 text-xs leading-relaxed text-foreground-muted line-clamp-2">
                            {logement.description || 'Logement vérifié, géré par un hôte Klef.'}
                          </p>
                        </div>

                        <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
                          <span className="flex items-center gap-1.5 text-xs text-foreground-muted">
                            <Users className="h-3.5 w-3.5" aria-hidden="true" />
                            Jusqu’à {logement.capaciteMax} personnes
                          </span>
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-pill bg-action hover:bg-action-hover text-forest-900 text-xs font-semibold shadow-2xs transition-all duration-200 group-hover:scale-105">
                            Voir
                            <ChevronRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* ═══ AVIS ══════════════════════════════════════════════════════ */}

        {activeTab === 'avis' && (
          <section role="tabpanel" id="panneau-avis" aria-labelledby="onglet-avis">
            {avis.length === 0 ? (
              <EmptyState
                icon={MessageSquare}
                title="Aucun avis pour l’instant"
                text="Les avis des voyageurs apparaîtront ici après leurs séjours."
              />
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2">
                {avis.map((rev) => {
                  const auteurInitiales =
                    `${rev.auteur.prenom[0] ?? ''}${rev.auteur.nom[0] ?? ''}`.toUpperCase();
                  const revDate = new Date(rev.creeLe).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  });

                  return (
                    <article
                      key={rev.id}
                      className="flex flex-col justify-between rounded-card border border-border bg-background-card p-5 shadow-sm sm:p-6"
                    >
                      <div>
                        <div className="mb-4 flex items-center justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-pill bg-forest-800 text-xs font-semibold text-neutral-50">
                              {rev.auteur.avatarUrl ? (
                                <Image
                                  src={rev.auteur.avatarUrl}
                                  alt=""
                                  fill
                                  sizes="40px"
                                  className="object-cover"
                                />
                              ) : (
                                auteurInitiales
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-foreground">
                                {rev.auteur.prenom} {rev.auteur.nom}
                              </p>
                              <p className="text-xs text-foreground-muted">{revDate}</p>
                            </div>
                          </div>

                          <span className="flex shrink-0 items-center gap-1 rounded-pill border border-gold-200 bg-gold-50 px-2.5 py-1 text-xs font-semibold text-gold-700">
                            <Star className="h-3.5 w-3.5 fill-gold-400 text-gold-400" aria-hidden="true" />
                            <span className="tabular-nums">{rev.note}/5</span>
                          </span>
                        </div>

                        <blockquote className="text-sm leading-relaxed text-foreground">
                          {`« ${rev.commentaire} »`}
                        </blockquote>
                      </div>

                      {rev.reservation?.logement && (
                        <p className="mt-4 flex items-center gap-1.5 border-t border-border pt-3 text-xs text-foreground-muted">
                          <Home className="h-3.5 w-3.5 shrink-0 text-forest-600" aria-hidden="true" />
                          <span className="truncate">
                            Séjour à {rev.reservation.logement.titre}
                          </span>
                        </p>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* ═══ À PROPOS ══════════════════════════════════════════════════ */}

        {activeTab === 'apropos' && (
          <section
            role="tabpanel"
            id="panneau-apropos"
            aria-labelledby="onglet-apropos"
            className="mx-auto max-w-2xl"
          >
            <div className="rounded-card border border-border bg-background-card p-6 shadow-sm sm:p-8">
              <h2 className="mb-1 font-display text-lg font-semibold text-foreground">
                Vérifications
              </h2>
              <p className="mb-5 text-xs text-foreground-muted">
                Contrôles effectués par Klef avant la mise en ligne des annonces.
              </p>

              <dl className="space-y-3">
                {[
                  {
                    icon: ShieldCheck,
                    label: 'Identité (CNI / Passeport)',
                    value: owner.isKycVerified ? 'Vérifiée par Klef' : 'En attente',
                    ok: owner.isKycVerified,
                  },
                  {
                    icon: Award,
                    label: 'Statut d’hôte',
                    value: owner.isSuperhost ? 'Superhôte de confiance' : 'Hôte actif',
                    ok: owner.isSuperhost,
                  },
                  {
                    icon: Clock,
                    label: 'Réactivité',
                    value: stats.delaiReponse,
                    ok: null,
                  },
                ].map(({ icon: Icon, label, value, ok }) => (
                  <div
                    key={label}
                    className="flex items-center justify-between gap-4 rounded-inner border border-border bg-background-alt px-4 py-3.5"
                  >
                    <dt className="flex min-w-0 items-center gap-2 text-sm text-foreground">
                      <Icon className="h-4 w-4 shrink-0 text-forest-600" aria-hidden="true" />
                      <span className="truncate">{label}</span>
                    </dt>
                    <dd
                      className={cn(
                        'shrink-0 text-sm font-semibold',
                        ok === true ? 'text-success-700' : 'text-foreground',
                      )}
                    >
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

/* ═══ ÉTAT VIDE ══════════════════════════════════════════════════════════ */

function EmptyState({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof Home;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-card border border-border bg-background-card px-8 py-16 text-center">
      <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-inner border border-border bg-background-alt">
        <Icon className="h-5 w-5 text-foreground-muted" aria-hidden="true" />
      </span>
      <h3 className="font-display text-base font-semibold text-foreground">{title}</h3>
      <p className="mt-1 text-xs text-foreground-muted">{text}</p>
    </div>
  );
}