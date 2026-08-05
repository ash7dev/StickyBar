'use client';

import { useState } from 'react';
import {
  Wifi, Key, MapPin, Film, Copy, Check, X, Smartphone, Navigation, ShieldCheck
} from 'lucide-react';
import type { ListingDetail } from '@/lib/nestjs/types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  listing: ListingDetail;
}

export function DigitalWelcomeGuideModal({ isOpen, onClose, listing }: Props) {
  const [copiedWifi, setCopiedWifi] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  if (!isOpen) return null;

  const lat = listing.latitude != null ? Number(listing.latitude) : null;
  const lng = listing.longitude != null ? Number(listing.longitude) : null;

  const copyToClipboard = (text: string, type: 'wifi' | 'code') => {
    navigator.clipboard.writeText(text);
    if (type === 'wifi') {
      setCopiedWifi(true);
      setTimeout(() => setCopiedWifi(false), 2000);
    } else {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const googleMapsUrl = lat && lng
    ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${listing.adresse}, ${listing.ville}`)}`;

  const wazeUrl = lat && lng
    ? `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`
    : `https://waze.com/ul?q=${encodeURIComponent(`${listing.adresse}, ${listing.ville}`)}&navigate=yes`;

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-card border border-border bg-background-card p-6 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-inner bg-forest-100 text-forest-700">
              <Smartphone className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
                Livret d&apos;Accueil Digital
                <span className="rounded-pill bg-forest-100 px-2 py-0.5 text-[0.6875rem] font-bold text-forest-800 flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3 text-forest-600" /> Confirmé
                </span>
              </h2>
              <p className="text-xs text-foreground-muted">
                {listing.titre} · {listing.ville}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="grid h-8 w-8 place-items-center rounded-pill text-foreground-muted hover:bg-neutral-100 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Section 1 : Wi-Fi */}
        {(listing.nomReseauWifi || listing.codeWifi) && (
          <div className="space-y-3 rounded-inner border border-forest-600/20 bg-forest-950/5 p-4">
            <div className="flex items-center gap-2 text-sm font-bold text-forest-900">
              <Wifi className="h-4 w-4 text-forest-700" />
              <span>Connexion Wi-Fi du Logement</span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {listing.nomReseauWifi && (
                <div className="rounded-inner border border-border bg-background-card p-3">
                  <span className="text-[11px] font-medium text-foreground-muted block">Nom du réseau</span>
                  <span className="text-xs font-bold text-foreground font-mono select-all block mt-0.5">
                    {listing.nomReseauWifi}
                  </span>
                </div>
              )}

              {listing.codeWifi && (
                <div className="rounded-inner border border-border bg-background-card p-3 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-medium text-foreground-muted block">Mot de passe</span>
                    <span className="text-xs font-bold text-forest-900 font-mono select-all block mt-0.5">
                      {listing.codeWifi}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(listing.codeWifi!, 'wifi')}
                    className="inline-flex items-center gap-1 rounded-pill bg-forest-100 px-3 py-1.5 text-xs font-semibold text-forest-800 hover:bg-forest-200 transition-colors"
                  >
                    {copiedWifi ? <Check className="h-3.5 w-3.5 text-forest-700" /> : <Copy className="h-3.5 w-3.5 text-forest-700" />}
                    <span>{copiedWifi ? 'Copié !' : 'Copier'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Section 2 : Digicode & Accès */}
        {(listing.instructionsDigicode || listing.instructionsAcces) && (
          <div className="space-y-3 rounded-inner border border-border bg-background-alt p-4">
            <div className="flex items-center gap-2 text-sm font-bold text-foreground">
              <Key className="h-4 w-4 text-forest-700" />
              <span>Digicode & Instructions d&apos;Accès</span>
            </div>

            {listing.instructionsDigicode && (
              <div className="rounded-inner border border-border bg-background-card p-3 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-medium text-foreground-muted block">Code Digicode / Boîte à clés</span>
                  <span className="text-sm font-extrabold text-forest-900 font-mono select-all block mt-0.5">
                    {listing.instructionsDigicode}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(listing.instructionsDigicode!, 'code')}
                  className="inline-flex items-center gap-1 rounded-pill bg-neutral-100 px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-neutral-200 transition-colors"
                >
                  {copiedCode ? <Check className="h-3.5 w-3.5 text-forest-600" /> : <Copy className="h-3.5 w-3.5 text-foreground-muted" />}
                  <span>{copiedCode ? 'Copié !' : 'Copier'}</span>
                </button>
              </div>
            )}

            {listing.instructionsAcces && (
              <p className="text-xs text-foreground-muted leading-relaxed whitespace-pre-line bg-background-card p-3 rounded-inner border border-border">
                {listing.instructionsAcces}
              </p>
            )}
          </div>
        )}

        {/* Section 3 : Vidéo d'Accès (si disponible) */}
        {listing.videoUrl && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-foreground">
              <Film className="h-4 w-4 text-forest-700" />
              <span>Visite vidéo du logement</span>
            </div>
            <div className="relative aspect-video w-full overflow-hidden rounded-inner border border-border bg-neutral-100">
              <video src={listing.videoUrl} controls className="h-full w-full object-contain" />
            </div>
          </div>
        )}

        {/* Section 4 : Localisation & Itinéraire 1-clic */}
        <div className="space-y-3 border-t border-border pt-4">
          <div className="flex items-center gap-2 text-xs font-bold text-foreground">
            <MapPin className="h-4 w-4 text-forest-700" />
            <span>Adresse du Logement</span>
          </div>
          <p className="text-xs font-medium text-foreground bg-background-alt p-3 rounded-inner border border-border">
            📍 {listing.adresse}, {listing.quartier ? `${listing.quartier}, ` : ''}{listing.ville}
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-pill border border-border bg-background-card px-4 py-2.5 text-xs font-semibold text-forest-800 transition-colors hover:bg-neutral-100"
            >
              <Navigation className="h-3.5 w-3.5 text-forest-600" />
              <span>Itinéraire Google Maps</span>
            </a>

            <a
              href={wazeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-pill border border-border bg-background-card px-4 py-2.5 text-xs font-semibold text-forest-800 transition-colors hover:bg-neutral-100"
            >
              <Navigation className="h-3.5 w-3.5 text-forest-600" />
              <span>Itinéraire Waze</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
