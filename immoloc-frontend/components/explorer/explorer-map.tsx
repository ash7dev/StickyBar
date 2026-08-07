'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Listing } from '@/lib/nestjs/types';
import { RefreshCw, Compass } from 'lucide-react';
import { formatPrixPublic } from '@/lib/pricing';

import { colors } from '@/lib/theme/colors';

interface ExplorerMapProps {
  listings: Listing[];
}

const CITY_COORDINATES: Record<string, [number, number]> = {
  dakar: [14.7167, -17.4677],
  almadies: [14.7478, -17.5256],
  ngor: [14.7553, -17.5186],
  yoff: [14.7594, -17.4647],
  mermoz: [14.7081, -17.4722],
  plateau: [14.6678, -17.4372],
  saly: [14.4442, -17.0203],
  somone: [14.4842, -17.0805],
  mbour: [14.4225, -16.9639],
  thies: [14.7910, -16.9256],
  'saint-louis': [16.0326, -16.4818],
  'cap skirring': [12.3736, -16.7442],
  ziguinchor: [12.5833, -16.2719],
};

export function ExplorerMap({ listings }: ExplorerMapProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showSearchHereButton, setShowSearchHereButton] = useState(false);
  const [isSearchingHere, setIsSearchingHere] = useState(false);

  const latParam = searchParams.get('lat');
  const lngParam = searchParams.get('lng');
  const userLat = latParam ? parseFloat(latParam) : null;
  const userLng = lngParam ? parseFloat(lngParam) : null;

  const handleSearchCurrentArea = () => {
    if (!leafletMapRef.current) return;
    setIsSearchingHere(true);
    const center = leafletMapRef.current.getCenter();
    const params = new URLSearchParams(searchParams.toString());
    params.set('lat', center.lat.toFixed(6));
    params.set('lng', center.lng.toFixed(6));
    params.set('rayon', '20');
    params.delete('ville');
    params.delete('quartier');
    params.set('page', '1');
    router.push(`/explorer?${params.toString()}`);
    setTimeout(() => {
      setIsSearchingHere(false);
      setShowSearchHereButton(false);
    }, 800);
  };

  useEffect(() => {
    if (typeof window === 'undefined' || !mapRef.current) return;

    let isMounted = true;

    const loadLeaflet = async () => {
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      const L = (await import('leaflet')).default;

      // Correctif défensif contre l'erreur Leaflet `_leaflet_pos` lors des transitions de zoom pendant un unmount
      if (L?.DomUtil && typeof L.DomUtil.getPosition === 'function') {
        const origGetPosition = L.DomUtil.getPosition;
        L.DomUtil.getPosition = function (el: any) {
          if (!el) return new L.Point(0, 0);
          try {
            return origGetPosition.call(L.DomUtil, el);
          } catch {
            return new L.Point(0, 0);
          }
        };
      }

      if (!isMounted || !mapRef.current) return;

      if (leafletMapRef.current) {
        try {
          leafletMapRef.current.off();
          leafletMapRef.current.remove();
        } catch {}
        leafletMapRef.current = null;
      }

      const initialCenter: [number, number] =
        userLat !== null && userLng !== null ? [userLat, userLng] : [14.7167, -17.4677];

      const map = L.map(mapRef.current, {
        zoomControl: false,
      }).setView(initialCenter, userLat !== null ? 13 : 12);

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        maxZoom: 19,
      }).addTo(map);

      leafletMapRef.current = map;
      setIsLoaded(true);

      // Écouter le mouvement de la carte pour afficher "Rechercher ici"
      map.on('moveend', () => {
        if (isMounted) {
          setShowSearchHereButton(true);
        }
      });

      // ── Marker Position GPS Utilisateur ("Vous êtes ici") ──
      if (userLat !== null && userLng !== null) {
        const userIcon = L.divIcon({
          className: 'custom-user-gps-pin',
          html: `<div style="position: relative; width: 26px; height: 26px;">
                  <div style="position: absolute; inset: 0; border-radius: 9999px; background-color: ${colors.lime[400]}; opacity: 0.65; animation: pulse 2s infinite;"></div>
                  <div style="position: absolute; inset: 3px; border-radius: 9999px; background-color: ${colors.forest[950]}; border: 2.5px solid #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center;">
                    <div style="width: 8px; height: 8px; border-radius: 9999px; background-color: ${colors.lime[400]};"></div>
                  </div>
                </div>`,
          iconSize: [26, 26],
          iconAnchor: [13, 13],
        });

        const userMarker = L.marker([userLat, userLng], { icon: userIcon, zIndexOffset: 1000 }).addTo(map);
        userMarker.bindPopup(`<strong style="font-size: 12px; color: ${colors.forest[950]};">📍 Votre position GPS</strong>`);
      }

      // ── Placer les marqueurs de prix des logements ──
      if (listings && listings.length > 0) {
        const bounds: [number, number][] = [];
        if (userLat !== null && userLng !== null) {
          bounds.push([userLat, userLng]);
        }

        listings.forEach((listing, index) => {
          let lat = 14.7167;
          let lng = -17.4677;

          if (listing.latitude && listing.longitude) {
            lat = Number(listing.latitude);
            lng = Number(listing.longitude);
          } else {
            const key = (listing.quartier || listing.ville || '').toLowerCase().trim();
            const foundCity = Object.keys(CITY_COORDINATES).find((c) => key.includes(c));

            if (foundCity) {
              [lat, lng] = CITY_COORDINATES[foundCity];
            }
            const offsetLat = (Math.sin(index * 2.5) * 0.015) + (index * 0.003);
            const offsetLng = (Math.cos(index * 2.5) * 0.015) - (index * 0.002);
            lat += offsetLat;
            lng += offsetLng;
          }

          bounds.push([lat, lng]);

          const priceText = listing.prixBase ? `${formatPrixPublic(listing.prixBase)} F` : 'Prix n/d';
          const isPromo = listing.derniereMinuteActive;

          const priceIcon = L.divIcon({
            className: 'custom-price-pin',
            html: `<div style="background-color: ${isPromo ? colors.lime[400] : colors.forest[950]}; color: ${isPromo ? colors.forest[800] : '#ffffff'}; font-weight: 800; font-size: 11px; padding: 5px 10px; border-radius: 9999px; border: 1.5px solid #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.25); text-align: center; whitespace: nowrap; cursor: pointer;">${isPromo ? '⚡ ' : ''}${priceText}</div>`,
            iconSize: [85, 28],
            iconAnchor: [42, 14],
          });

          const marker = L.marker([lat, lng], { icon: priceIcon }).addTo(map);

          const popupContent = `
            <div style="font-family: system-ui, sans-serif; padding: 4px; max-width: 190px;">
              <strong style="font-size: 13px; color: ${colors.forest[950]}; display: block; margin-bottom: 2px;">${listing.titre}</strong>
              <span style="font-size: 11px; color: #666; display: block; margin-bottom: 4px;">${listing.ville}${listing.quartier ? ` · ${listing.quartier}` : ''}</span>
              ${listing.distanceKm !== undefined && listing.distanceKm !== null ? `<span style="font-size: 10px; font-weight: 700; color: ${colors.forest[600]}; display: block; margin-bottom: 4px;">📍 À ${(listing.distanceKm as number).toFixed(1)} km de vous</span>` : ''}
              <span style="font-size: 14px; font-weight: 800; color: ${colors.forest[950]};">${priceText}</span>
              <a href="/explorer/${listing.id}" style="display: block; margin-top: 6px; text-align: center; background-color: ${colors.forest[950]}; color: ${colors.lime[300]}; padding: 5px 8px; border-radius: 8px; text-decoration: none; font-size: 11px; font-weight: 800;">Voir l'annonce</a>
            </div>
          `;
          marker.bindPopup(popupContent);
        });

        if (bounds.length > 0 && userLat === null) {
          map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
        }
      }
    };

    loadLeaflet();

    return () => {
      isMounted = false;
      if (leafletMapRef.current) {
        try {
          leafletMapRef.current.off();
          leafletMapRef.current.remove();
        } catch {}
        leafletMapRef.current = null;
      }
    };
  }, [listings, userLat, userLng]);

  return (
    <div className="relative w-full h-full min-h-[400px] overflow-hidden bg-neutral-100 rounded-[24px]">
      {/* Conteneur de la carte Leaflet */}
      <div ref={mapRef} className="w-full h-full z-0" />

      {/* Bouton supérieur : Rechercher dans cette zone */}
      {(showSearchHereButton || userLat !== null) && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 animate-in fade-in zoom-in-95">
          <button
            onClick={handleSearchCurrentArea}
            disabled={isSearchingHere}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-forest-950 text-on-inverse-marker hover:bg-forest-900 font-extrabold text-xs shadow-xl backdrop-blur-md transition-all active:scale-95 border border-action-edge"
          >
            <RefreshCw className={isSearchingHere ? 'w-3.5 h-3.5 animate-spin text-lime-400' : 'w-3.5 h-3.5 text-lime-400'} />
            <span>Rechercher dans cette zone</span>
          </button>
        </div>
      )}

      {/* Fallback pendant le chargement */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-neutral-100 flex items-center justify-center text-foreground-muted text-xs font-semibold">
          Chargement de la carte...
        </div>
      )}
    </div>
  );
}
