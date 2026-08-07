'use client';

import { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation, ExternalLink, ShieldCheck, Compass, Info } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface ListingLocationMapProps {
  ville: string;
  quartier?: string | null;
  adresse?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
}

const CITY_FALLBACKS: Record<string, [number, number]> = {
  dakar: [14.7167, -17.4677],
  almadies: [14.7478, -17.5256],
  ngor: [14.7553, -17.5186],
  yoff: [14.7594, -17.4647],
  mermoz: [14.7081, -17.4722],
  plateau: [14.6678, -17.4372],
  fann: [14.6931, -17.4644],
  mamelles: [14.7333, -17.5111],
  saly: [14.4442, -17.0203],
  somone: [14.4842, -17.0805],
  mbour: [14.4225, -16.9639],
  thies: [14.7910, -16.9256],
  'saint-louis': [16.0326, -16.4818],
  'cap skirring': [12.3736, -16.7442],
  popenguine: [14.5542, -17.1128],
  ngaparou: [14.4642, -17.0503],
};

export function ListingLocationMap({
  ville,
  quartier,
  adresse,
  latitude,
  longitude,
}: ListingLocationMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Déterminer les coordonnées effectives
  let lat = latitude ? Number(latitude) : null;
  let lng = longitude ? Number(longitude) : null;

  if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
    const key = (quartier || ville || '').toLowerCase().trim();
    const match = Object.keys(CITY_FALLBACKS).find((c) => key.includes(c));
    if (match) {
      [lat, lng] = CITY_FALLBACKS[match];
    } else {
      [lat, lng] = [14.7167, -17.4677]; // Dakar fallback
    }
  }

  const locationTitle = [quartier, ville, 'Sénégal'].filter(Boolean).join(', ');

  useEffect(() => {
    if (typeof window === 'undefined' || !mapRef.current) return;

    let isMounted = true;

    const initMap = async () => {
      // Charger CSS Leaflet s'il n'est pas présent
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

      // Initialiser la carte centrée sur la position
      const map = L.map(mapRef.current, {
        zoomControl: false,
        scrollWheelZoom: false, // Évite le scroll intempestif
      }).setView([lat, lng], 14);

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // CartoDB Voyager tiles style moderne & lisible
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        maxZoom: 19,
      }).addTo(map);

      leafletMapRef.current = map;

      // ── Zone d'Emplacement Airbnb (Cercle translucide de quartier + Pin central) ──
      const radius = 350; // 350 mètres de zone
      L.circle([lat, lng], {
        color: '#15803d',
        fillColor: '#a3e635',
        fillOpacity: 0.35,
        weight: 2,
      }).addTo(map);

      const pinIcon = L.divIcon({
        className: 'custom-location-pin',
        html: `<div style="position: relative; width: 42px; height: 42px; display: flex; align-items: center; justify-content: center;">
                <div style="position: absolute; inset: 0; border-radius: 9999px; background-color: #0f2d22; opacity: 0.25; animation: ping 2.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
                <div style="width: 38px; height: 38px; border-radius: 9999px; background-color: #0f2d22; border: 3px solid #ffffff; box-shadow: 0 10px 25px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: #a3e635;">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                </div>
              </div>`,
        iconSize: [42, 42],
        iconAnchor: [21, 21],
      });

      const marker = L.marker([lat, lng], { icon: pinIcon }).addTo(map);
      marker.bindPopup(
        `<div style="font-family: system-ui, sans-serif; padding: 4px; text-align: center;">
          <strong style="font-size: 13px; color: #0f2d22; display: block; margin-bottom: 2px;">${locationTitle}</strong>
          <span style="font-size: 11px; color: #666;">Emplacement exact du logement</span>
        </div>`
      );

      setIsLoaded(true);
    };

    initMap();

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
  }, [lat, lng, locationTitle]);

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

  return (
    <section className="space-y-4 border-t border-border pt-8">
      
      {/* En-tête de section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-semibold tracking-tight text-foreground">
            Où se situe le logement
          </h2>
          <p className="mt-1 text-sm font-medium text-foreground-muted flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-forest-600 dark:text-on-inverse-marker shrink-0" />
            <span>{locationTitle}</span>
          </p>
        </div>

        {/* Bouton ouvrir dans Google Maps */}
        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-pill border border-border bg-background-card hover:bg-background-alt text-xs font-semibold text-foreground transition-all shadow-xs shrink-0 self-start sm:self-auto"
        >
          <Navigation className="w-3.5 h-3.5 text-forest-600 dark:text-on-inverse-marker" />
          <span>Ouvrir dans Google Maps</span>
          <ExternalLink className="w-3 h-3 text-foreground-faint" />
        </a>
      </div>

      {/* Carte interactive */}
      <div className="relative w-full h-[320px] sm:h-[380px] rounded-card overflow-hidden border border-border shadow-md">
        <div ref={mapRef} className="w-full h-full z-0" />

        {!isLoaded && (
          <div className="absolute inset-0 bg-background-alt flex items-center justify-center text-xs font-semibold text-foreground-muted">
            Chargement de la carte du quartier...
          </div>
        )}
      </div>

      {/* Note de confidentialité style Airbnb */}
      <div className="flex items-start gap-3 p-3.5 rounded-inner bg-background-alt border border-border text-xs text-foreground-muted">
        <ShieldCheck className="w-4 h-4 text-forest-600 dark:text-on-inverse-marker shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="font-semibold text-foreground">Confidentialité & Sécurité :</strong> L'emplacement exact dans la zone vous sera automatiquement communiqué avec les instructions d'accès dès la confirmation de votre réservation.
        </p>
      </div>

    </section>
  );
}

export default ListingLocationMap;
