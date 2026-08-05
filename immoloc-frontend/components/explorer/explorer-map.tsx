'use client';

import { useEffect, useRef, useState } from 'react';
import type { Listing } from '@/lib/nestjs/types';
import { Search, RefreshCw } from 'lucide-react';

import { formatPrixPublic } from '@/lib/pricing';

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

/**
 * Carte interactive Leaflet / OpenStreetMap pour l'explorateur (Style Gunôor)
 */
export function ExplorerMap({ listings }: ExplorerMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSearchingHere, setIsSearchingHere] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !mapRef.current) return;

    let isMounted = true;

    // Charger dynamiquement Leaflet et ses CSS
    const loadLeaflet = async () => {
      // Injecter CSS Leaflet si non présent
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      const L = (await import('leaflet')).default;

      if (!isMounted || !mapRef.current) return;

      // Nettoyer si la carte existe déjà
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
      }

      // Centre par défaut : Dakar (14.7167, -17.4677)
      const defaultCenter: [number, number] = [14.7167, -17.4677];
      const map = L.map(mapRef.current, {
        zoomControl: false,
      }).setView(defaultCenter, 12);

      // Ajouter le contrôle de zoom en bas à droite
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Fond de carte clair OpenStreetMap / CartoDB
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        maxZoom: 19,
      }).addTo(map);

      leafletMapRef.current = map;
      setIsLoaded(true);

      // Placer les marqueurs de prix
      if (listings && listings.length > 0) {
        const bounds: [number, number][] = [];

        listings.forEach((listing, index) => {
          let lat = 14.7167;
          let lng = -17.4677;

          // Récupérer les coordonnées par ville / quartier
          const key = (listing.quartier || listing.ville || '').toLowerCase().trim();
          const foundCity = Object.keys(CITY_COORDINATES).find((c) => key.includes(c));

          if (foundCity) {
            [lat, lng] = CITY_COORDINATES[foundCity];
          }

          // Décalage pour disperser les logements dans la même ville
          const offsetLat = (Math.sin(index * 2.5) * 0.015) + (index * 0.003);
          const offsetLng = (Math.cos(index * 2.5) * 0.015) - (index * 0.002);
          const finalLat = lat + offsetLat;
          const finalLng = lng + offsetLng;

          bounds.push([finalLat, finalLng]);

          const priceText = listing.prixBase ? `${formatPrixPublic(listing.prixBase)} F` : 'Prix n/d';

          // Marqueur pastille de prix personnalisé (Style Gunôor)
          const priceIcon = L.divIcon({
            className: 'custom-price-pin',
            html: `<div style="background-color: #0f2d22; color: #ffffff; font-weight: 700; font-size: 11px; padding: 5px 10px; border-radius: 9999px; border: 1.5px solid #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.25); text-align: center; whitespace: nowrap; cursor: pointer;">${priceText}</div>`,
            iconSize: [80, 28],
            iconAnchor: [40, 14],
          });

          const marker = L.marker([finalLat, finalLng], { icon: priceIcon }).addTo(map);

          // Popup d'information au clic
          const popupContent = `
            <div style="font-family: system-ui, sans-serif; padding: 4px; max-width: 180px;">
              <strong style="font-size: 13px; color: #0f2d22; display: block; margin-bottom: 2px;">${listing.titre}</strong>
              <span style="font-size: 11px; color: #666; display: block; margin-bottom: 4px;">${listing.ville}</span>
              <span style="font-size: 14px; font-weight: 800; color: #0f2d22;">${priceText}</span>
              <a href="/explorer/${listing.id}" style="display: block; margin-top: 6px; text-align: center; background-color: #0f2d22; color: #c4f74d; padding: 4px 8px; border-radius: 8px; text-decoration: none; font-size: 11px; font-weight: 700;">Voir l'annonce</a>
            </div>
          `;
          marker.bindPopup(popupContent);
        });

        // Ajuster la vue pour englober tous les logements
        if (bounds.length > 0) {
          map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
        }
      }
    };

    loadLeaflet();

    return () => {
      isMounted = false;
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, [listings]);

  return (
    <div className="relative w-full h-full min-h-[400px] overflow-hidden bg-neutral-100 rounded-[24px]">
      {/* Conteneur de la carte Leaflet */}
      <div ref={mapRef} className="w-full h-full z-0" />

      {/* Bouton supérieur : Rechercher ici (Style Gunôor) */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
        <button
          onClick={() => setIsSearchingHere(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-forest-950 text-white hover:bg-forest-900 font-bold text-xs shadow-lg backdrop-blur-md transition-all active:scale-95 border border-white/20"
        >
          <RefreshCw className={isSearchingHere ? 'w-3.5 h-3.5 animate-spin' : 'w-3.5 h-3.5'} />
          <span>Rechercher ici</span>
        </button>
      </div>

      {/* Fallback pendant le chargement */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-neutral-100 flex items-center justify-center text-foreground-muted text-xs font-semibold">
          Chargement de la carte...
        </div>
      )}
    </div>
  );
}
