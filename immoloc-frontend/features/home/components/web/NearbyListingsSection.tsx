'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertCircle, Compass, Loader2, MapPin, Navigation, RotateCw } from 'lucide-react';
import { listingsApi } from '@/lib/nestjs/listings.api';
import type { Listing } from '@/lib/nestjs/types';
import { cn } from '@/lib/utils/cn';
import { ListingCard, ListingCardSkeleton } from './ListingCard';

type Status = 'idle' | 'locating' | 'loading' | 'success' | 'error' | 'denied';

const RADII = [5, 10, 20, 50] as const;

export function NearbyListingsSection() {
  const [status, setStatus] = useState<Status>('idle');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [radiusKm, setRadiusKm] = useState<number>(10);
  const [listings, setListings] = useState<Listing[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  /* Sans cette garde, une reponse lente arrivant apres un changement de rayon
     ecrasait les resultats du rayon courant. */
  const requestId = useRef(0);
  const alive = useRef(true);
  useEffect(() => () => { alive.current = false; }, []);

  const fetchNearby = useCallback(async (lat: number, lng: number, radius: number) => {
    const id = ++requestId.current;
    setStatus('loading');
    setMessage(null);
    try {
      const res = await listingsApi.search({ lat, lng, radiusKm: radius, limit: 6, page: 1 });
      if (!alive.current || id !== requestId.current) return;
      setListings(res.data ?? []);
      setStatus('success');
    } catch {
      if (!alive.current || id !== requestId.current) return;
      // console.error laissait l'echec dans la console ; l'ecran, lui,
      // affiche desormais un bouton pour reessayer.
      setMessage('Impossible de récupérer les logements à proximité.');
      setStatus('error');
    }
  }, []);

  const locate = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setMessage('Votre navigateur ne prend pas en charge la géolocalisation.');
      setStatus('error');
      return;
    }
    setStatus('locating');
    setMessage(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setCoords({ lat, lng });
        fetchNearby(lat, lng, radiusKm);
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setStatus('denied');
          setMessage('L’accès à votre position a été refusé.');
        } else if (err.code === err.TIMEOUT) {
          // TIMEOUT n'etait pas distingue : l'utilisateur lisait « impossible
          // de determiner votre position » alors qu'un nouvel essai marche
          // souvent.
          setStatus('error');
          setMessage('La localisation a pris trop de temps.');
        } else {
          setStatus('error');
          setMessage('Impossible de déterminer votre position.');
        }
      },
      {
        /* enableHighAccuracy: true activait le GPS materiel : plusieurs
           secondes de plus et une consommation de batterie nettement
           superieure. Pour un rayon de 5 a 50 km, la position reseau suffit. */
        enableHighAccuracy: false,
        timeout: 12_000,
        maximumAge: 300_000,
      },
    );
  }, [fetchNearby, radiusKm]);

  function changeRadius(r: number) {
    setRadiusKm(r);
    if (coords) fetchNearby(coords.lat, coords.lng, r);
  }

  const busy = status === 'locating' || status === 'loading';

  return (
    <section className="mx-auto max-w-[1120px] px-6 py-12">
      {/* Le fond etait un degrade from-forest-950/5 via-background-card
          to-emerald-950/5 — emerald n'existe pas dans les tokens, et un
          degrade a 5% n'est pas perceptible. */}
      <div className="rounded-card border border-border bg-background-card p-6 shadow-sm sm:p-8">

        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-2 rounded-pill bg-neutral-100 px-3 py-1 text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-forest-700">
              <Compass className="h-3.5 w-3.5" aria-hidden="true" />
              Autour de vous
            </span>
            <h2 className="mt-3 font-display text-[clamp(1.5rem,3.5vw,2rem)] font-semibold tracking-[-0.02em] text-forest-900">
              Logements près de chez vous
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-foreground-muted">
              Votre position sert uniquement à trier les résultats. Elle n’est ni
              enregistrée, ni transmise aux propriétaires.
            </p>
          </div>

          <button
            type="button"
            onClick={locate}
            disabled={busy}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-pill bg-forest-600 px-5 py-3 text-sm font-semibold text-white transition-colors duration-150 hover:bg-forest-700 disabled:opacity-60"
          >
            {busy
              ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              : <Navigation className="h-4 w-4" aria-hidden="true" />}
            {status === 'locating' ? 'Localisation…'
              : status === 'loading' ? 'Recherche…'
                : coords ? 'Actualiser ma position'
                  : 'Me localiser'}
          </button>
        </header>

        {/*
          Le selecteur de rayon n'apparaissait qu'en status === 'success' : on
          ne pouvait pas le regler avant de lancer, ni apres un echec — alors
          que le message d'etat vide conseille justement d'elargir.
          Il est desormais toujours visible.
        */}
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <span className="text-xs text-foreground-muted">Rayon :</span>
          <div role="group" aria-label="Rayon de recherche" className="flex flex-wrap gap-1.5">
            {RADII.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => changeRadius(r)}
                disabled={busy}
                aria-pressed={radiusKm === r}
                className={cn(
                  'rounded-pill border px-3 py-1.5 text-xs font-medium transition-colors duration-150 disabled:opacity-50',
                  radiusKm === r
                    ? 'border-forest-600 bg-forest-100 text-forest-800'
                    : 'border-border bg-background-card text-foreground-muted hover:border-border-hover hover:text-foreground',
                )}
              >
                {r} km
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8" aria-live="polite">
          {status === 'idle' && (
            <div className="flex flex-col items-center rounded-card border border-dashed border-border bg-background-alt p-8 text-center">
              <span className="grid h-11 w-11 place-items-center rounded-inner bg-neutral-100 text-forest-700">
                <MapPin className="h-5 w-5" aria-hidden="true" />
              </span>
              <h3 className="mt-3 text-base font-semibold text-forest-900">
                Trouvez un logement à proximité
              </h3>
              <p className="mt-1.5 max-w-md text-sm leading-relaxed text-foreground-muted">
                Autorisez l’accès à votre position pour voir les biens disponibles
                dans un rayon de {radiusKm} km.
              </p>
              <button
                type="button"
                onClick={locate}
                className="mt-4 inline-flex items-center gap-2 rounded-pill border border-border bg-background-card px-4 py-2.5 text-sm font-semibold text-forest-800 transition-colors duration-150 hover:bg-neutral-100"
              >
                <Navigation className="h-4 w-4" aria-hidden="true" />
                Me localiser
              </button>
            </div>
          )}

          {busy && (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2].map((i) => <ListingCardSkeleton key={i} />)}
            </div>
          )}

          {status === 'success' && (
            listings.length > 0 ? (
              <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {listings.map((item) => (
                  <li key={item.id} className="relative">
                    {/* Le badge etait en z-30 par-dessus la carte, donc il
                        recouvrait la zone du lien etire et bloquait le clic
                        sur le coin superieur gauche. z-20 et pointer-events
                        desactives. */}
                    {item.distanceKm != null && (
                      <span className="glass-dark pointer-events-none absolute left-3 top-3 z-20 inline-flex items-center gap-1 rounded-pill px-2.5 py-1 text-[0.6875rem] font-semibold text-neutral-50">
                        <MapPin className="h-3 w-3" aria-hidden="true" />
                        {/* distanceKm sortait brut : « à 3.7241 km ». */}
                        à {new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 }).format(item.distanceKm)} km
                      </span>
                    )}
                    <ListingCard
                      id={item.id}
                      titre={item.titre}
                      type={item.type}
                      sousType={item.sousType ?? undefined}
                      ville={item.ville}
                      quartier={item.quartier ?? undefined}
                      prixBase={item.prixBase}
                      note={item.note ?? null}
                      totalSejours={item.totalSejours || 0}
                      photos={item.photos || []}
                      derniereMinuteActive={item.derniereMinuteActive}
                    />
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex flex-col items-center rounded-card border border-border bg-background-alt p-8 text-center">
                <span className="grid h-11 w-11 place-items-center rounded-inner bg-neutral-100 text-foreground-muted">
                  <Compass className="h-5 w-5" aria-hidden="true" />
                </span>
                <p className="mt-3 text-sm font-medium text-forest-900">
                  Aucun logement dans un rayon de {radiusKm} km
                </p>
                {/* Le message conseillait d'elargir a 20 km sans proposer de
                    le faire, et le conseil restait affiche a 20 km. */}
                {radiusKm < RADII[RADII.length - 1] && (
                  <button
                    type="button"
                    onClick={() => changeRadius(RADII[RADII.indexOf(radiusKm as typeof RADII[number]) + 1] ?? 50)}
                    className="mt-3 inline-flex items-center gap-1.5 rounded-pill border border-border bg-background-card px-4 py-2 text-xs font-semibold text-forest-800 transition-colors duration-150 hover:bg-neutral-100"
                  >
                    Élargir la recherche
                  </button>
                )}
              </div>
            )
          )}

          {(status === 'error' || status === 'denied') && (
            // amber-* n'existe pas dans les tokens : c'est warning.
            <div role="alert" className="flex flex-col gap-3 rounded-card border border-warning-500/30 bg-warning-50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-warning-700" aria-hidden="true" />
                <div>
                  <p className="text-sm font-medium text-warning-700">{message}</p>
                  <p className="mt-1 text-xs leading-relaxed text-warning-600">
                    {status === 'denied'
                      ? 'Autorisez la localisation dans les réglages de votre navigateur, ou recherchez par ville.'
                      : 'Réessayez, ou recherchez directement par ville.'}
                  </p>
                </div>
              </div>

              {/* Un ecran d'erreur sans action est une impasse. */}
              <div className="flex shrink-0 gap-2">
                {status === 'error' && (
                  <button
                    type="button"
                    onClick={coords ? () => fetchNearby(coords.lat, coords.lng, radiusKm) : locate}
                    className="inline-flex items-center gap-1.5 rounded-pill border border-warning-500/30 bg-background-card px-3.5 py-2 text-xs font-semibold text-warning-700 transition-colors hover:bg-warning-50"
                  >
                    <RotateCw className="h-3.5 w-3.5" aria-hidden="true" />
                    Réessayer
                  </button>
                )}
                <a
                  href="/explorer"
                  className="inline-flex items-center rounded-pill border border-border bg-background-card px-3.5 py-2 text-xs font-semibold text-forest-800 transition-colors hover:bg-neutral-100"
                >
                  Chercher par ville
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}