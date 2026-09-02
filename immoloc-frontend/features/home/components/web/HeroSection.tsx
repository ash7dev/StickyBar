'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CalendarDays, MapPin, Search, ShieldCheck, SlidersHorizontal, X, RotateCcw, Check } from 'lucide-react';
import { DateRangeCalendar, shortLabel, type DateRange } from './date-range-calendar';
import type { Listing } from '@/lib/nestjs/types';
import { formatPrixPublic, getPrixPublic, formatPrixDerniereMinute } from '@/lib/pricing';

/**
 * HeroSection
 *
 * Les annonces sont passées en props par un Server Component parent :
 *   const { data } = await listingsApi.search({ limit: 4, page: 1 });
 *   return <HeroSection listings={data ?? []} />;
 *
 * Nécessite les keyframes de hero-animations.css dans globals.css.
 */

interface Props {
  listings?: Listing[];
}

const POPULAR = ['Almadies', 'Ngor', 'Plateau', 'Saly'] as const;

export function HeroSection({ listings = [] }: Props) {
  const router = useRouter();
  const titleId = useId();
  const placeId = useId();

  const [place, setPlace] = useState('');
  const [range, setRange] = useState<DateRange>({ from: null, to: null });
  const [openField, setOpenField] = useState<'from' | 'to' | null>(null);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<'where' | 'dates'>('where');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const popoverRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (isMobileSearchOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileSearchOpen]);

  useEffect(() => {
    if (!openField) return;
    const onDown = (e: MouseEvent) => {
      if (!popoverRef.current?.contains(e.target as Node)) setOpenField(null);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpenField(null); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [openField]);

  function submit(e?: React.FormEvent) {
    e?.preventDefault();
    const params = new URLSearchParams();
    if (place.trim()) params.set('ville', place.trim());
    if (range.from) params.set('arrivee', range.from.toISOString().slice(0, 10));
    if (range.to) params.set('depart', range.to.toISOString().slice(0, 10));
    router.push(`/explorer${params.size ? `?${params}` : ''}`);
  }

  const featured = listings.slice(0, 4);

  return (
    <section aria-labelledby={titleId} className="relative z-20">
      {/* Formes géométriques décoratives en arrière-plan (desktop uniquement) */}
      <div className="absolute inset-0 pointer-events-none hidden lg:block overflow-hidden" aria-hidden="true">
        {/* Cercle lime en haut à droite */}
        <div className="absolute top-20 right-[10%] w-64 h-64 rounded-full bg-marker-bg blur-3xl" />

        {/* Carré forest tournant en bas à gauche */}
        <div className="absolute bottom-32 left-[8%] w-32 h-32 bg-forest-900/5 rotate-12 rounded-2xl" />

        {/* Petit cercle gold en haut à gauche */}
        <div className="absolute top-40 left-[15%] w-20 h-20 rounded-full bg-gold-400/15" />

        {/* Ligne verticale décorative */}
        <div className="absolute top-1/4 right-[25%] w-1 h-32 bg-gradient-to-b from-lime-500/20 to-transparent" />

        {/* Grille subtile en arrière-plan */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(20,101,76,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(20,101,76,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem]" />
      </div>

      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 pb-6 pt-5 sm:pb-16 sm:pt-20 md:pb-24 md:pt-28 relative z-10">
        <div className="grid items-center gap-6 sm:gap-10 lg:grid-cols-[1.15fr_0.85fr]">

          {/* -- Colonne texte ------------------------------------------- */}
          <div>
            <div className="klef-rise mb-3 sm:mb-6 inline-flex items-center gap-2 rounded-pill border border-white/60 bg-white/55 px-3.5 py-1.5 sm:px-4 sm:py-2 backdrop-blur-md">
              <ShieldCheck className="h-4 w-4 text-forest-700 shrink-0" aria-hidden="true" />
              <span className="text-[0.75rem] sm:text-[0.8125rem] font-medium text-neutral-700">
                Votre argent est bloqué jusqu’à la remise des clés
              </span>
            </div>

            <h1
              id={titleId}
              className="klef-rise font-display text-[clamp(2rem,6vw,4rem)] font-semibold leading-[1.08] sm:leading-[1.06] tracking-[-0.025em] text-forest-900 relative"
              style={{ '--rise-delay': '60ms' } as React.CSSProperties}
            >
              Un logement{' '}
              <span className="relative inline-block">
                <span className="relative z-10">sûr</span>
                {/* Soulignement ondulé lime (desktop uniquement) */}
                <svg
                  className="absolute -bottom-2 left-0 w-full h-3 hidden lg:block"
                  viewBox="0 0 120 12"
                  fill="none"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <path
                    d="M0 6 Q 15 0, 30 6 T 60 6 T 90 6 T 120 6"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    className="text-forest-400/30"
                  />
                </svg>
              </span>
              ,
              <br />
              à Dakar comme à Saly.
            </h1>

            <p
              className="klef-rise mt-3 sm:mt-5 max-w-xl text-base sm:text-lg leading-relaxed text-foreground-muted"
              style={{ '--rise-delay': '120ms' } as React.CSSProperties}
            >
              Vous ne payez
              rien tant que vous n’avez pas les clés en main.
            </p>

            {/* -- Bouton Pilule de Recherche Mobile (Uniquement Mobile) ----------- */}
            <div className="sm:hidden klef-rise relative z-30 mt-4" style={{ '--rise-delay': '180ms' } as React.CSSProperties}>
              <button
                type="button"
                onClick={() => setIsMobileSearchOpen(true)}
                className="w-full flex items-center justify-between gap-3 p-3.5 rounded-full bg-white/95 backdrop-blur-md border border-forest-900/10 shadow-[0_8px_30px_rgba(20,101,76,0.12)] hover:shadow-lg transition-all active:scale-[0.98] text-left cursor-pointer"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-forest-900 flex items-center justify-center shrink-0 shadow-md text-lime-400">
                    <Search className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-forest-950 truncate">
                      {place.trim() ? place : 'Où allez-vous ?'}
                    </p>
                    <p className="text-xs text-foreground-muted truncate">
                      {range.from
                        ? `${shortLabel.format(range.from)} - ${range.to ? shortLabel.format(range.to) : '...'}`
                        : 'Destination · Dates · Tout Sénégal'}
                    </p>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-forest-50 flex items-center justify-center text-forest-700 shrink-0 border border-forest-100">
                  <SlidersHorizontal className="w-4 h-4" />
                </div>
              </button>
            </div>

            {/* -- Barre de recherche Desktop (Uniquement Desktop) ---------------- */}
            <form
              role="search"
              onSubmit={submit}
              ref={popoverRef}
              className="klef-rise relative z-50 mt-9 hidden sm:block"
              style={{ '--rise-delay': '180ms' } as React.CSSProperties}
            >
              <div className="glass flex flex-col rounded-card p-1.5 sm:flex-row sm:items-stretch sm:rounded-pill">

                <div className="flex flex-1 items-center gap-2.5 rounded-pill px-4 py-2.5 transition-colors duration-150 focus-within:bg-white/60">
                  <MapPin className="h-4 w-4 shrink-0 text-foreground-muted" aria-hidden="true" />
                  <span className="min-w-0 flex-1">
                    <label htmlFor={placeId} className="block text-[0.6875rem] font-semibold uppercase tracking-wider text-foreground-faint">
                      Où
                    </label>
                    <input
                      id={placeId}
                      type="text"
                      name="ville"
                      autoComplete="off"
                      value={place}
                      onChange={(e) => setPlace(e.target.value)}
                      placeholder="Dakar, Saly, Ngor…"
                      className="w-full border-none bg-transparent p-0 text-[0.9375rem] text-foreground outline-none placeholder:text-foreground-faint"
                    />
                  </span>
                </div>

                <span className="mx-1 hidden w-px self-center bg-border sm:block sm:h-8" aria-hidden="true" />

                {(['from', 'to'] as const).map((f, i) => (
                  <span key={f} className="contents">
                    {i === 1 && (
                      <span className="mx-1 hidden w-px self-center bg-border sm:block sm:h-8" aria-hidden="true" />
                    )}
                    <button
                      type="button"
                      onClick={() => setOpenField(openField === f ? null : f)}
                      aria-expanded={openField === f}
                      aria-haspopup="dialog"
                      className={`flex flex-1 items-center gap-2.5 rounded-pill px-4 py-2.5 text-left transition-colors duration-150 hover:bg-white/50 ${openField === f ? 'bg-white/70' : ''
                        }`}
                    >
                      <CalendarDays className="h-4 w-4 shrink-0 text-foreground-muted" aria-hidden="true" />
                      <span className="min-w-0">
                        <span className="block text-[0.6875rem] font-semibold uppercase tracking-wider text-foreground-faint">
                          {f === 'from' ? 'Arrivée' : 'Départ'}
                        </span>
                        <span className={`block truncate text-[0.9375rem] ${(f === 'from' ? range.from : range.to) ? 'text-foreground' : 'text-foreground-faint'
                          }`}>
                          {f === 'from'
                            ? (range.from ? shortLabel.format(range.from) : 'Ajouter')
                            : (range.to ? shortLabel.format(range.to) : 'Ajouter')}
                        </span>
                      </span>
                    </button>
                  </span>
                ))}

                <button type="submit" className="btn-action mt-1.5 justify-center sm:mt-0 sm:!px-6">
                  <Search className="h-4 w-4" aria-hidden="true" />
                  Chercher
                </button>
              </div>

              {openField && (
                <>
                  <div
                    className="fixed inset-0 z-[9998] bg-black/50 backdrop-blur-xs sm:hidden animate-in fade-in"
                    onClick={() => setOpenField(null)}
                  />
                  <div
                    role="dialog"
                    aria-label="Choisir les dates"
                    className="fixed inset-x-0 bottom-0 sm:bottom-auto sm:inset-auto sm:left-0 sm:top-[calc(100%+0.625rem)] z-[9999] p-4 sm:p-0 bg-white sm:bg-transparent rounded-t-[32px] sm:rounded-none border-t sm:border-none border-border shadow-2xl sm:shadow-none animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 sm:animate-none"
                    style={{ isolation: 'isolate' }}
                  >
                    <div className="w-10 h-1.5 rounded-full bg-neutral-300 mx-auto mb-3 sm:hidden" />
                    <DateRangeCalendar
                      value={range}
                      onChange={setRange}
                      focusField={openField}
                      onClose={() => setOpenField(null)}
                    />
                  </div>
                </>
              )}
            </form>

            <div
              className="klef-rise mt-5 flex flex-wrap items-center gap-2"
              style={{ '--rise-delay': '240ms' } as React.CSSProperties}
            >
              <span className="text-[0.8125rem] text-foreground-muted">Populaire&nbsp;:</span>
              {POPULAR.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => {
                    setPlace(v);
                    router.push(`/explorer?ville=${encodeURIComponent(v)}`);
                  }}
                  aria-label={`Rechercher à ${v}`}
                  className="rounded-pill border border-border bg-background-card px-3 py-1.5 text-[0.8125rem] font-medium text-foreground-muted transition-colors duration-150 hover:border-forest-300 hover:text-forest-700 active:scale-95"
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          {/* -- Colonne visuelle,desktop ------------------------------- */}
          <div className="relative hidden h-[30rem] lg:block">
            {featured[1] && (
              <ListingCard
                listing={featured[1]}
                className="klef-rise absolute right-4 top-2 w-60 rotate-[3deg] opacity-95"
                style={{ '--rise-delay': '300ms' } as React.CSSProperties}
              />
            )}
            {featured[0] && (
              <ListingCard
                listing={featured[0]}
                priority
                className="klef-rise absolute bottom-2 left-2 z-10 w-[19rem] rotate-[-2deg]"
                style={{ '--rise-delay': '360ms' } as React.CSSProperties}
              />
            )}
          </div>
        </div>
      </div>

      {/* ── Modale Bottom Sheet Mobile Ultra-Premium (Design Tokens Klef) ── */}
      {mounted && isMobileSearchOpen && createPortal(
        <>
          {/* Backdrop sombre flouté avec effet de profondeur */}
          <div
            className="fixed inset-0 z-[99998] bg-forest-950/60 backdrop-blur-md sm:hidden animate-in fade-in duration-300"
            onClick={() => setIsMobileSearchOpen(false)}
          />

          {/* Bottom Sheet Flottant avec coins arrondis premium */}
          <div className="fixed inset-x-0 bottom-0 top-12 z-[99999] flex flex-col rounded-t-[32px] bg-neutral-50 border-t border-white/40 shadow-[0_-16px_48px_rgba(4,25,18,0.30)] overflow-hidden sm:hidden animate-in slide-in-from-bottom duration-300 ease-out">

            {/* Poignée tactile de glissement (Drag Handle) */}
            <div className="shrink-0 pt-2.5 pb-1 flex justify-center bg-white">
              <div className="w-12 h-1 rounded-full bg-neutral-300" />
            </div>

            {/* En-tête de la modale */}
            <div className="shrink-0 z-20 flex items-center justify-between border-b border-border bg-white px-5 py-3 shadow-2xs">
              <button
                type="button"
                onClick={() => setIsMobileSearchOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 text-forest-900 transition-all hover:bg-neutral-200 active:scale-90"
              >
                <X className="h-4 w-4" />
              </button>

              <span className="text-xs font-black text-forest-950 uppercase tracking-[0.15em]">
                Rechercher un séjour
              </span>

              <button
                type="button"
                onClick={() => {
                  setPlace('');
                  setRange({ from: null, to: null });
                }}
                className="text-xs font-bold text-forest-700 hover:text-forest-900 underline underline-offset-4 transition-colors"
              >
                Effacer
              </button>
            </div>

            {/* Corps défilable délimité */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-28">

              {/* 1. Bloc "Où ?" (Destination) */}
              <div
                className={`rounded-2xl border transition-all duration-200 overflow-hidden ${mobileTab === 'where'
                    ? 'border-forest-600 bg-white shadow-md ring-4 ring-forest-500/10 p-4'
                    : 'border-border bg-white p-3.5 hover:border-border-hover'
                  }`}
              >
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => setMobileTab('where')}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${mobileTab === 'where' ? 'bg-forest-900 text-lime-400 shadow-xs' : 'bg-neutral-100 text-forest-800'}`}>
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase text-foreground-muted tracking-wider">Destination</p>
                      <p className="text-sm font-bold text-forest-950">
                        {place.trim() ? place : 'Où allez-vous ?'}
                      </p>
                    </div>
                  </div>
                  {mobileTab !== 'where' && (
                    <span className="text-xs font-bold text-forest-600 bg-forest-50 px-2.5 py-1 rounded-full border border-forest-100">
                      Modifier
                    </span>
                  )}
                </div>

                {mobileTab === 'where' && (
                  <div className="mt-4 pt-3.5 border-t border-border space-y-4 animate-in fade-in duration-200">
                    <div className="relative">
                      <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-forest-600" />
                      <input
                        type="text"
                        autoFocus
                        value={place}
                        onChange={(e) => setPlace(e.target.value)}
                        placeholder="Saisissez une ville (Dakar, Saly, Ngor...)"
                        className="w-full rounded-xl border border-border bg-neutral-50 py-3 pl-10 pr-10 text-sm font-semibold text-foreground outline-none focus:border-forest-600 focus:bg-white focus:ring-2 focus:ring-forest-500/20 transition-all"
                      />
                      {place && (
                        <button
                          type="button"
                          onClick={() => setPlace('')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 p-1"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div>
                      <p className="text-[11px] font-black text-foreground-muted uppercase tracking-wider mb-2.5">
                        Destinations recommandées au Sénégal
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { name: 'Dakar', desc: 'Capitale & vie nocturne' },
                          { name: 'Saly', desc: 'Station balnéaire & plages' },
                          { name: 'Ngaparou', desc: 'Calme & villas piscine' },
                          { name: 'Somone', desc: 'Lagune & nature' },
                          { name: 'Almadies', desc: 'Restaurants & vue mer' },
                          { name: 'Ngor', desc: 'Île & surf' },
                        ].map((item) => {
                          const active = place === item.name;
                          return (
                            <button
                              key={item.name}
                              type="button"
                              onClick={() => {
                                setPlace(item.name);
                                setMobileTab('dates');
                              }}
                              className={`flex flex-col text-left p-3 rounded-xl border transition-all duration-150 cursor-pointer ${active
                                  ? 'border-forest-600 bg-forest-50/80 shadow-xs ring-1 ring-forest-500/30'
                                  : 'border-border bg-neutral-50 hover:bg-neutral-100 hover:border-border-hover'
                                }`}
                            >
                              <span className="text-xs font-extrabold text-forest-900 flex items-center justify-between">
                                {item.name}
                                {active && <Check className="w-3.5 h-3.5 text-forest-600" />}
                              </span>
                              <span className="text-[10px] text-foreground-muted leading-tight mt-0.5 font-medium">
                                {item.desc}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 2. Bloc "Quand ?" (Dates) */}
              <div
                className={`rounded-2xl border transition-all duration-200 overflow-hidden ${mobileTab === 'dates'
                    ? 'border-forest-600 bg-white shadow-md ring-4 ring-forest-500/10 p-4'
                    : 'border-border bg-white p-3.5 hover:border-border-hover'
                  }`}
              >
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => setMobileTab('dates')}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${mobileTab === 'dates' ? 'bg-forest-900 text-lime-400 shadow-xs' : 'bg-neutral-100 text-forest-800'}`}>
                      <CalendarDays className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase text-foreground-muted tracking-wider">Séjour / Dates</p>
                      <p className="text-sm font-bold text-forest-950">
                        {range.from
                          ? `${shortLabel.format(range.from)} - ${range.to ? shortLabel.format(range.to) : 'Sélectionnez départ'}`
                          : 'Ajouter des dates'}
                      </p>
                    </div>
                  </div>
                  {mobileTab !== 'dates' && (
                    <span className="text-xs font-bold text-forest-600 bg-forest-50 px-2.5 py-1 rounded-full border border-forest-100">
                      {range.from ? 'Modifier' : 'Sélectionner'}
                    </span>
                  )}
                </div>

                {mobileTab === 'dates' && (
                  <div className="mt-4 pt-3.5 border-t border-border space-y-3 animate-in fade-in duration-200 flex flex-col items-center">
                    <DateRangeCalendar
                      value={range}
                      onChange={setRange}
                      focusField="from"
                      className="w-full max-w-full border-none shadow-none p-0 bg-transparent"
                    />
                  </div>
                )}
              </div>

            </div>

            {/* Pied de modale fixe de haute conversion (Trois Voix Klef : Bouton Lime) */}
            <div className="shrink-0 z-30 flex items-center justify-between gap-3 border-t border-border bg-white/95 backdrop-blur-md p-3.5 shadow-[0_-8px_30px_rgba(4,25,18,0.12)]">
              <button
                type="button"
                onClick={() => {
                  setPlace('');
                  setRange({ from: null, to: null });
                }}
                className="flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium text-foreground-muted hover:text-foreground active:scale-95 transition-all shrink-0 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Réinitialiser</span>
              </button>

              <button
                type="button"
                onClick={(e) => {
                  setIsMobileSearchOpen(false);
                  submit(e);
                }}
                className="flex-1 min-w-0 flex items-center justify-center gap-2 rounded-full bg-lime-400 hover:bg-lime-500 px-4 py-3 text-xs sm:text-sm font-semibold text-forest-950 shadow-md hover:shadow-lg transition-all active:scale-[0.98] cursor-pointer"
              >
                <Search className="w-4 h-4 text-forest-950 shrink-0" />
                <span className="truncate whitespace-nowrap">
                  {(() => {
                    const parts = [];
                    if (place.trim()) parts.push(place.trim());
                    if (range.from && range.to) {
                      const n = Math.max(1, Math.round((range.to.getTime() - range.from.getTime()) / 86400000));
                      parts.push(`${n} nuit${n > 1 ? 's' : ''}`);
                    }
                    if (parts.length > 0) return `Rechercher (${parts.join(' · ')})`;
                    return 'Rechercher les hébergements';
                  })()}
                </span>
              </button>
            </div>
          </div>
        </>,
        document.body
      )}

    </section>
  );
}

/* -- Carte d'annonce ------------------------------------------------------ */

function ListingCard({
  listing, className = '', priority = false, style,
}: {
  listing: Listing;
  className?: string;
  priority?: boolean;
  style?: React.CSSProperties;
}) {
  const raw = listing.photos?.[0] as unknown;
  const src = typeof raw === 'string' ? raw : (raw as { url?: string } | undefined)?.url;

  const price =
    (listing as { prixBase?: number }).prixBase ??
    (listing as { prixMensuel?: number }).prixMensuel;

  const derniereMinuteActive = Boolean((listing as { derniereMinuteActive?: boolean }).derniereMinuteActive);
  const prixPublicNum = price ? getPrixPublic(price) : 0;
  const prixDerniereMinute = formatPrixDerniereMinute(prixPublicNum);

  const verified = Boolean((listing as { verifie?: boolean }).verifie);
  const slug = (listing as { slug?: string }).slug ?? listing.id;

  return (
    <Link
      href={`/explorer/${slug}`}
      style={style}
      className={`block overflow-hidden rounded-card border border-white/70 bg-neutral-100 shadow-lg transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 motion-reduce:transition-none ${className}`}
    >
      <div className="relative aspect-[3/4]">
        {src ? (
          <Image
            src={src}
            // alt reprenait le titre, deja affiche juste en dessous : un
            // lecteur d'ecran l'entendait deux fois.
            alt=""
            fill
            sizes="(max-width: 1024px) 70vw, 320px"
            className="object-cover"
            priority={priority}
          />
        ) : (
          <div className="grid h-full place-items-center text-sm text-neutral-400">
            Photo à venir
          </div>
        )}

        {verified && (
          <span className="badge-verified absolute right-3 top-3 !mb-0">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            Vérifié
          </span>
        )}

        <div className="glass-dark absolute inset-x-3 bottom-3 rounded-inner px-3 py-2.5">
          <p className="truncate text-xs text-forest-100">{listing.titre}</p>
          {derniereMinuteActive && prixPublicNum > 0 ? (
            <div className="mt-0.5 flex flex-col">
              <span className="text-[11px] font-medium text-white/65 line-through tabular-nums leading-none">
                {formatPrixPublic(price)} FCFA
              </span>
              <p className="text-base font-black tabular-nums text-amber-300">
                {prixDerniereMinute}
                <span className="ml-1 text-xs font-normal text-forest-200">FCFA / nuit</span>
              </p>
            </div>
          ) : (
            <p className="mt-0.5 text-base font-semibold tabular-nums text-neutral-50">
              {price ? formatPrixPublic(price) : '—'}
              <span className="ml-1 text-xs font-normal text-forest-200">FCFA / nuit</span>
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}