'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  SlidersHorizontal, X, ChevronDown, MapPin, CalendarDays,
  Users, Banknote, Check, RotateCcw, Building2, ShieldCheck, Plus, Minus,
  Compass, Zap, Loader2
} from 'lucide-react';
import type { SearchFilters } from '@/lib/explorer/filters-schema';
import { TYPE_LOGEMENT_VALUES } from '@/lib/explorer/filters-schema';
import { cn } from '@/lib/utils/cn';

interface FilterBarProps {
  filters: SearchFilters;
}

const VILLES = [
  'Dakar', 'Saly', 'Ngor', 'Almadies', 'Somone', 'Saint-Louis', 'Mbour', 'Thiès', 'Cap Skirring',
];

const QUARTIERS_POPULAIRES = [
  'Almadies', 'Ngor', 'Mermoz', 'Virage', 'Plateau', 'Fann', 'Mamelles', 'Saly', 'Somone', 'Popenguine',
];

const PRIX_PRESETS = [
  { label: '≤ 25 000 F', max: 25000 },
  { label: '≤ 50 000 F', max: 50000 },
  { label: '≤ 100 000 F', max: 100000 },
  { label: '≤ 200 000 F', max: 200000 },
];

/**
 * Barre de filtres ultra-soignée (Design System Klef)
 * - Translucide sticky sous la navbar (`backdrop-blur-xl bg-background/85`)
 * - Masquage ABSOLU de la barre de défilement horizontale (`scrollbarWidth: none`)
 * - Popovers flottants positionnés en `fixed` sans tronquage
 */
export function FilterBar({ filters }: FilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Popover ouvert : 'ville' | 'type' | 'prix' | 'voyageurs' | 'dates' | 'modal' | null
  const [activePopover, setActivePopover] = useState<string | null>(null);
  const [popoverPos, setPopoverPos] = useState<{ top: number; left: number } | null>(null);
  const [mounted, setMounted] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleGpsLocation = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      alert("La géolocalisation n'est pas disponible sur votre appareil.");
      return;
    }

    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsLoading(false);
        updateFilters({
          lat: Number(pos.coords.latitude.toFixed(6)),
          lng: Number(pos.coords.longitude.toFixed(6)),
          rayon: 20,
          ville: null,
          quartier: null,
        });
      },
      () => {
        setGpsLoading(false);
        alert("Impossible d'obtenir votre position GPS. Veuillez autoriser la géolocalisation dans votre navigateur.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fermeture des popovers au clic extérieur ou au scroll
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setActivePopover(null);
      }
    }
    function handleScroll() {
      if (activePopover && activePopover !== 'modal') {
        setActivePopover(null);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [activePopover]);

  // Ouverture sécurisée du popover (Bottom sheet sur mobile, popover flottant sur desktop)
  const togglePopover = (name: string, e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (typeof window !== 'undefined' && window.innerWidth < 640) {
      // Sur mobile, ouvrir le modal / bottom sheet complet
      setActivePopover('modal');
      return;
    }

    if (activePopover === name) {
      setActivePopover(null);
      setPopoverPos(null);
    } else {
      const rect = e.currentTarget.getBoundingClientRect();
      const popupWidth = 260;
      // Empêche le débordement à droite de l'écran
      const calculatedLeft = Math.min(rect.left, window.innerWidth - popupWidth - 16);
      
      setPopoverPos({
        top: rect.bottom + 8,
        left: Math.max(16, calculatedLeft),
      });
      setActivePopover(name);
    }
  };

  // Met à jour l'URL avec les nouveaux filtres
  const updateFilters = (updates: Record<string, string | number | null | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === undefined || value === '') {
        params.delete(key);
      } else {
        params.set(key, String(value));
      }
    });
    params.set('page', '1');
    router.push(`/explorer?${params.toString()}`);
  };

  // Réinitialiser tous les filtres
  const resetAllFilters = () => {
    router.push('/explorer');
    setActivePopover(null);
  };

  // Suppression d'un filtre individuel via la pastille ✕
  const removeFilter = (key: string) => {
    if (key === 'dates') {
      updateFilters({ arrivee: null, depart: null });
    } else if (key === 'prix') {
      updateFilters({ min: null, max: null });
    } else {
      updateFilters({ [key]: null });
    }
  };

  // Calcul des filtres actifs
  const activeCount = [
    filters.ville,
    filters.arrivee && filters.depart,
    filters.voyageurs && filters.voyageurs > 1,
    filters.type && filters.type.length > 0,
    filters.min !== undefined || filters.max !== undefined,
    filters.verifie,
  ].filter(Boolean).length;

  return (
    <div
      ref={containerRef}
      className="sticky top-14 sm:top-20 z-30 w-full bg-background/85 backdrop-blur-xl border-b border-border py-1.5 sm:py-2.5 px-3 sm:px-4 transition-all duration-300"
    >
      <div className="max-w-[1920px] mx-auto flex items-center justify-between gap-3">
        
        {/* ── Gauche : Listes des Pastilles Actives & Dropdowns (Sans aucune barre de défilement) ── */}
        <div
          className="flex items-center gap-2 overflow-x-auto no-scrollbar [&::-webkit-scrollbar]:hidden py-1 flex-1 min-w-0"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          
          {/* 0. BOUTON GPS AUTOUR DE MOI */}
          {filters.lat !== undefined && filters.lng !== undefined ? (
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-forest-950 text-lime-300 text-xs font-bold shadow-xs shrink-0 animate-in fade-in">
              <Compass className="w-3.5 h-3.5 text-lime-300 animate-spin" style={{ animationDuration: '4s' }} />
              <span>Autour de vous (GPS)</span>
              <button
                onClick={() => updateFilters({ lat: null, lng: null, rayon: null })}
                className="hover:bg-forest-800 rounded-full p-0.5 transition-colors ml-0.5"
                aria-label="Réinitialiser position GPS"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          ) : (
            <button
              onClick={handleGpsLocation}
              disabled={gpsLoading}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold border border-forest-600/40 bg-forest-50 hover:bg-forest-100 text-forest-800 transition-all shadow-xs shrink-0 active:scale-95"
            >
              {gpsLoading ? (
                <Loader2 className="w-3.5 h-3.5 text-forest-600 animate-spin" />
              ) : (
                <Compass className="w-3.5 h-3.5 text-forest-600" />
              )}
              <span>Autour de moi</span>
            </button>
          )}

          {/* 0.5. PASTILLE DERNIÈRE MINUTE -15% */}
          <button
            onClick={() => updateFilters({ derniereMinute: filters.derniereMinute ? null : '1' })}
            className={cn(
              'inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs transition-all shadow-xs shrink-0 active:scale-95',
              filters.derniereMinute
                ? 'bg-lime-400 text-forest-950 border border-lime-400 font-black shadow-sm'
                : 'border border-lime-500/40 bg-lime-50/60 hover:bg-lime-100 text-forest-950 font-bold'
            )}
          >
            <Zap className={cn('w-3.5 h-3.5', filters.derniereMinute ? 'text-forest-950 fill-forest-950' : 'text-forest-900')} />
            <span>-15% Dernière minute</span>
            {filters.derniereMinute && (
              <X className="w-3.5 h-3.5 ml-0.5 hover:opacity-75" />
            )}
          </button>

          {/* 1. PASTILLE VILLE (Si active : Saly ✕) */}
          {filters.ville ? (
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-forest-950 text-lime-300 text-xs font-bold shadow-xs shrink-0 animate-in fade-in">
              <MapPin className="w-3.5 h-3.5 text-lime-300" />
              {filters.ville}
              <button
                onClick={() => removeFilter('ville')}
                className="hover:bg-forest-800 rounded-full p-0.5 transition-colors ml-0.5"
                aria-label="Supprimer ville"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          ) : (
            <button
              onClick={(e) => togglePopover('ville', e)}
              className={cn(
                'inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border border-border bg-background-card hover:bg-white text-foreground transition-all shadow-xs shrink-0',
                activePopover === 'ville' && 'border-forest-600 ring-2 ring-forest-600/20 bg-white font-bold'
              )}
            >
              <MapPin className="w-3.5 h-3.5 text-forest-600" />
              <span>Ville</span>
              <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
            </button>
          )}

          {/* 2. PASTILLE DATES (Si actives : 12-15 août ✕) */}
          {filters.arrivee && filters.depart ? (
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-forest-950 text-lime-300 text-xs font-bold shadow-xs shrink-0 animate-in fade-in">
              <CalendarDays className="w-3.5 h-3.5 text-lime-300" />
              {new Date(filters.arrivee).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} – {new Date(filters.depart).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
              <button
                onClick={() => removeFilter('dates')}
                className="hover:bg-forest-800 rounded-full p-0.5 transition-colors ml-0.5"
                aria-label="Supprimer dates"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          ) : (
            <button
              onClick={(e) => togglePopover('dates', e)}
              className={cn(
                'inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border border-border bg-background-card hover:bg-white text-foreground transition-all shadow-xs shrink-0',
                activePopover === 'dates' && 'border-forest-600 ring-2 ring-forest-600/20 bg-white font-bold'
              )}
            >
              <CalendarDays className="w-3.5 h-3.5 text-forest-600" />
              <span>Dates</span>
              <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
            </button>
          )}

          {/* 3. PASTILLE VOYAGEURS (Si > 1 : 4 voyageurs ✕) */}
          {filters.voyageurs && filters.voyageurs > 1 ? (
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-forest-950 text-lime-300 text-xs font-bold shadow-xs shrink-0 animate-in fade-in">
              <Users className="w-3.5 h-3.5 text-lime-300" />
              {filters.voyageurs} voyageurs
              <button
                onClick={() => removeFilter('voyageurs')}
                className="hover:bg-forest-800 rounded-full p-0.5 transition-colors ml-0.5"
                aria-label="Supprimer voyageurs"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          ) : (
            <button
              onClick={(e) => togglePopover('voyageurs', e)}
              className={cn(
                'inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border border-border bg-background-card hover:bg-white text-foreground transition-all shadow-xs shrink-0',
                activePopover === 'voyageurs' && 'border-forest-600 ring-2 ring-forest-600/20 bg-white font-bold'
              )}
            >
              <Users className="w-3.5 h-3.5 text-forest-600" />
              <span>Voyageurs</span>
              <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
            </button>
          )}

          {/* 4. PASTILLE PRIX (Si actif : ≤ 50 000 F ✕) */}
          {filters.max !== undefined || filters.min !== undefined ? (
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-forest-950 text-lime-300 text-xs font-bold shadow-xs shrink-0 animate-in fade-in">
              <Banknote className="w-3.5 h-3.5 text-lime-300" />
              {filters.min !== undefined && filters.max !== undefined
                ? `${filters.min.toLocaleString('fr-FR')} – ${filters.max.toLocaleString('fr-FR')} F`
                : filters.max !== undefined
                  ? `≤ ${filters.max.toLocaleString('fr-FR')} F`
                  : `≥ ${filters.min?.toLocaleString('fr-FR')} F`}
              <button
                onClick={() => removeFilter('prix')}
                className="hover:bg-forest-800 rounded-full p-0.5 transition-colors ml-0.5"
                aria-label="Supprimer filtre prix"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          ) : (
            <button
              onClick={(e) => togglePopover('prix', e)}
              className={cn(
                'inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border border-border bg-background-card hover:bg-white text-foreground transition-all shadow-xs shrink-0',
                activePopover === 'prix' && 'border-forest-600 ring-2 ring-forest-600/20 bg-white font-bold'
              )}
            >
              <Banknote className="w-3.5 h-3.5 text-forest-600" />
              <span>Prix max</span>
              <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
            </button>
          )}

          {/* 5. PASTILLE TYPE (Si actif : Villa, Appart ✕) */}
          {filters.type && filters.type.length > 0 ? (
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-forest-950 text-lime-300 text-xs font-bold shadow-xs shrink-0 animate-in fade-in">
              <Building2 className="w-3.5 h-3.5 text-lime-300" />
              {filters.type.map((t) => t.charAt(0).toUpperCase() + t.slice(1)).join(', ')}
              <button
                onClick={() => removeFilter('type')}
                className="hover:bg-forest-800 rounded-full p-0.5 transition-colors ml-0.5"
                aria-label="Supprimer type"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          ) : (
            <button
              onClick={(e) => togglePopover('type', e)}
              className={cn(
                'inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border border-border bg-background-card hover:bg-white text-foreground transition-all shadow-xs shrink-0',
                activePopover === 'type' && 'border-forest-600 ring-2 ring-forest-600/20 bg-white font-bold'
              )}
            >
              <Building2 className="w-3.5 h-3.5 text-forest-600" />
              <span>Type</span>
              <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
            </button>
          )}

          {/* Bouton Effacer Tout si filtres actifs */}
          {activeCount > 0 && (
            <button
              onClick={resetAllFilters}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-foreground-muted hover:text-rose-600 transition-colors shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Tout effacer</span>
            </button>
          )}

        </div>

        {/* ── Droite : Bouton Global ⚙ Filtres Puissants ───────────────────── */}
        <button
          onClick={() => setActivePopover('modal')}
          className={cn(
            'inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all shadow-xs active:scale-95 shrink-0',
            activeCount > 0
              ? 'bg-forest-950 text-lime-300 hover:bg-forest-900 shadow-md'
              : 'bg-background-card border border-border text-foreground hover:border-forest-400'
          )}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>Filtres</span>
          {activeCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-lime-400 text-forest-950 text-[10px] font-black flex items-center justify-center">
              {activeCount}
            </span>
          )}
        </button>

      </div>

      {/* ── POPOVERS FLOTTANTS (Rendus via Portal sur document.body) ── */}

      {/* Popover Ville */}
      {activePopover === 'ville' && popoverPos && mounted && createPortal(
        <div
          style={{ top: popoverPos.top, left: popoverPos.left }}
          className="fixed w-56 p-2 rounded-2xl bg-white border border-border shadow-2xl z-[100] animate-in fade-in zoom-in-95"
        >
          <div className="text-[11px] font-bold text-foreground-muted uppercase tracking-wider px-2 py-1.5">
            Sélectionner une ville
          </div>
          <div className="space-y-0.5 max-h-60 overflow-y-auto">
            {VILLES.map((v) => (
              <button
                key={v}
                onClick={() => {
                  updateFilters({ ville: v });
                  setActivePopover(null);
                }}
                className="w-full text-left px-3 py-2 text-xs font-semibold text-foreground hover:bg-neutral-100 rounded-xl transition-colors flex items-center justify-between"
              >
                <span>{v}</span>
                {filters.ville === v && <Check className="w-3.5 h-3.5 text-forest-600" />}
              </button>
            ))}
          </div>
        </div>,
        document.body
      )}

      {/* Popover Dates */}
      {activePopover === 'dates' && popoverPos && mounted && createPortal(
        <div
          style={{ top: popoverPos.top, left: popoverPos.left }}
          className="fixed w-72 p-4 rounded-2xl bg-white border border-border shadow-2xl z-[100] animate-in fade-in zoom-in-95 space-y-3"
        >
          <div className="text-[11px] font-bold text-foreground-muted uppercase tracking-wider">
            Dates de séjour
          </div>
          <div className="space-y-2">
            <div>
              <span className="text-[10px] font-bold text-foreground-muted block mb-1">Arrivée</span>
              <input
                type="date"
                min={new Date().toISOString().split('T')[0]}
                value={filters.arrivee || ''}
                onChange={(e) => updateFilters({ arrivee: e.target.value || null })}
                className="w-full px-3 py-2 text-xs font-semibold bg-neutral-50 border border-border rounded-xl focus:outline-none focus:border-forest-600"
              />
            </div>
            <div>
              <span className="text-[10px] font-bold text-foreground-muted block mb-1">Départ</span>
              <input
                type="date"
                min={filters.arrivee || new Date().toISOString().split('T')[0]}
                value={filters.depart || ''}
                onChange={(e) => updateFilters({ depart: e.target.value || null })}
                className="w-full px-3 py-2 text-xs font-semibold bg-neutral-50 border border-border rounded-xl focus:outline-none focus:border-forest-600"
              />
            </div>
          </div>
          <button
            onClick={() => setActivePopover(null)}
            className="w-full py-2 bg-forest-900 text-lime-300 font-bold text-xs rounded-xl shadow-xs"
          >
            Appliquer
          </button>
        </div>,
        document.body
      )}

      {/* Popover Voyageurs */}
      {activePopover === 'voyageurs' && popoverPos && mounted && createPortal(
        <div
          style={{ top: popoverPos.top, left: popoverPos.left }}
          className="fixed w-64 p-4 rounded-2xl bg-white border border-border shadow-2xl z-[100] animate-in fade-in zoom-in-95"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-foreground">Personnes min.</span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => updateFilters({ voyageurs: Math.max(1, (filters.voyageurs || 1) - 1) })}
                disabled={(filters.voyageurs || 1) <= 1}
                className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-foreground hover:bg-neutral-100 disabled:opacity-30"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="text-sm font-bold text-foreground tabular-nums">{filters.voyageurs || 1}</span>
              <button
                onClick={() => updateFilters({ voyageurs: (filters.voyageurs || 1) + 1 })}
                className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-foreground hover:bg-neutral-100"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Popover Prix */}
      {activePopover === 'prix' && popoverPos && mounted && createPortal(
        <div
          style={{ top: popoverPos.top, left: popoverPos.left }}
          className="fixed w-64 p-3 rounded-2xl bg-white border border-border shadow-2xl z-[100] animate-in fade-in zoom-in-95"
        >
          <div className="text-[11px] font-bold text-foreground-muted uppercase tracking-wider px-2 py-1 mb-1">
            Presets de Prix
          </div>
          <div className="space-y-1">
            {PRIX_PRESETS.map((preset) => (
              <button
                key={preset.max}
                onClick={() => {
                  updateFilters({ max: preset.max, min: null });
                  setActivePopover(null);
                }}
                className="w-full text-left px-3 py-2 text-xs font-semibold text-foreground hover:bg-neutral-100 rounded-xl transition-colors flex items-center justify-between"
              >
                <span>{preset.label}</span>
                {filters.max === preset.max && <Check className="w-3.5 h-3.5 text-forest-600" />}
              </button>
            ))}
          </div>
        </div>,
        document.body
      )}

      {/* Popover Type */}
      {activePopover === 'type' && popoverPos && mounted && createPortal(
        <div
          style={{ top: popoverPos.top, left: popoverPos.left }}
          className="fixed w-56 p-2 rounded-2xl bg-white border border-border shadow-2xl z-[100] animate-in fade-in zoom-in-95"
        >
          <div className="text-[11px] font-bold text-foreground-muted uppercase tracking-wider px-2 py-1.5">
            Type de logement
          </div>
          <div className="space-y-0.5">
            {TYPE_LOGEMENT_VALUES.map((t) => {
              const isSelected = filters.type?.includes(t);
              return (
                <button
                  key={t}
                  onClick={() => {
                    const nextTypes = isSelected
                      ? (filters.type || []).filter((x) => x !== t)
                      : [...(filters.type || []), t];
                    updateFilters({ type: nextTypes.length > 0 ? nextTypes.join(',') : null });
                    setActivePopover(null);
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-semibold text-foreground hover:bg-neutral-100 rounded-xl transition-colors flex items-center justify-between capitalize"
                >
                  <span>{t}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-forest-600" />}
                </button>
              );
            })}
          </div>
        </div>,
        document.body
      )}

      {/* ── MODAL COMPLET ⚙ FILTRES (Rendu via Portal sur document.body) ── */}
      {activePopover === 'modal' && mounted && createPortal(
        <>
          {/* Backdrop avec z-[100] sur tout l'écran */}
          <div
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setActivePopover(null)}
          />

          {/* Modal / Sheet container avec z-[110] centré sur l'écran */}
          <div className="fixed inset-x-0 bottom-0 sm:bottom-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 z-[110] w-full sm:max-w-lg bg-white rounded-t-[32px] sm:rounded-[28px] border border-border shadow-2xl overflow-hidden flex flex-col max-h-[88dvh] sm:max-h-[85vh] animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
            
            {/* Header Modal avec poignée de glissement sur mobile */}
            <div className="p-4 sm:p-5 border-b border-border bg-neutral-50/70">
              <div className="w-10 h-1.5 rounded-full bg-neutral-300 mx-auto mb-3 sm:hidden" />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-forest-50 flex items-center justify-center text-forest-700">
                    <SlidersHorizontal className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="font-display text-base sm:text-lg font-bold text-foreground">Filtres de recherche</h2>
                    {activeCount > 0 && (
                      <p className="text-[11px] font-semibold text-forest-600">
                        {activeCount} filtre{activeCount > 1 ? 's' : ''} actif{activeCount > 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActivePopover(null)}
                  className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center transition-colors"
                  aria-label="Fermer les filtres"
                >
                  <X className="w-4 h-4 text-neutral-600" />
                </button>
              </div>
            </div>

            {/* Corps du Modal avec scroll fluide */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
              
              {/* 0. GPS Autour de moi */}
              <div className="bg-forest-50/70 border border-forest-100 p-3.5 rounded-2xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-forest-900 text-lime-300 flex items-center justify-center shrink-0">
                    <Compass className="w-4 h-4 text-lime-300" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-forest-950">Autour de vous (GPS)</p>
                    <p className="text-[10px] font-medium text-foreground-muted">Rechercher les annonces les plus proches</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGpsLocation}
                  disabled={gpsLoading}
                  className="px-3.5 py-2 bg-forest-900 text-lime-300 text-xs font-extrabold rounded-xl shadow-xs active:scale-95 transition-all flex items-center gap-1.5 shrink-0"
                >
                  {gpsLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Activer GPS'}
                </button>
              </div>

              {/* 1. Ville */}
              <div>
                <label className="block text-xs font-bold text-foreground-muted uppercase tracking-wider mb-2.5">
                  Ville / Destination
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {VILLES.map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => updateFilters({ ville: filters.ville === v ? null : v, lat: null, lng: null })}
                      className={cn(
                        'py-2.5 px-3 rounded-xl text-xs font-semibold border transition-all text-center truncate active:scale-95',
                        filters.ville === v
                          ? 'bg-forest-900 text-lime-300 border-forest-900 font-bold shadow-xs'
                          : 'bg-neutral-50 border-border text-foreground hover:bg-neutral-100'
                      )}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              {/* 1.5. Quartiers Populaires */}
              <div>
                <label className="block text-xs font-bold text-foreground-muted uppercase tracking-wider mb-2.5">
                  Quartiers Prisés
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {QUARTIERS_POPULAIRES.map((q) => {
                    const isSelected = filters.quartier === q;
                    return (
                      <button
                        key={q}
                        type="button"
                        onClick={() => updateFilters({ quartier: isSelected ? null : q, lat: null, lng: null })}
                        className={cn(
                          'py-1.5 px-3 rounded-full text-xs font-semibold border transition-all active:scale-95',
                          isSelected
                            ? 'bg-forest-950 text-lime-300 border-forest-950 font-bold'
                            : 'bg-background-alt border-border text-foreground hover:bg-neutral-100'
                        )}
                      >
                        {q}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Dates de séjour */}
              <div>
                <label className="block text-xs font-bold text-foreground-muted uppercase tracking-wider mb-2.5">
                  Dates de séjour
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[10px] font-bold text-foreground-muted block mb-1">Arrivée</span>
                    <input
                      type="date"
                      min={new Date().toISOString().split('T')[0]}
                      value={filters.arrivee || ''}
                      onChange={(e) => updateFilters({ arrivee: e.target.value || null })}
                      className="w-full px-3 py-2.5 text-xs font-semibold bg-neutral-50 border border-border rounded-xl focus:outline-none focus:border-forest-600"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-foreground-muted block mb-1">Départ</span>
                    <input
                      type="date"
                      min={filters.arrivee || new Date().toISOString().split('T')[0]}
                      value={filters.depart || ''}
                      onChange={(e) => updateFilters({ depart: e.target.value || null })}
                      className="w-full px-3 py-2.5 text-xs font-semibold bg-neutral-50 border border-border rounded-xl focus:outline-none focus:border-forest-600"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Nombre de Voyageurs */}
              <div>
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-xs font-bold text-foreground-muted uppercase tracking-wider">
                      Voyageurs
                    </label>
                    <span className="text-[11px] text-foreground-faint">Nombre de personnes min.</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => updateFilters({ voyageurs: Math.max(1, (filters.voyageurs || 1) - 1) })}
                      disabled={(filters.voyageurs || 1) <= 1}
                      className="w-9 h-9 rounded-full border border-border flex items-center justify-center text-foreground hover:bg-neutral-100 active:scale-95 disabled:opacity-30 transition-all"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="text-base font-bold text-foreground tabular-nums w-4 text-center">
                      {filters.voyageurs || 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateFilters({ voyageurs: (filters.voyageurs || 1) + 1 })}
                      className="w-9 h-9 rounded-full border border-border flex items-center justify-center text-foreground hover:bg-neutral-100 active:scale-95 transition-all"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* 4. Type de bien */}
              <div>
                <label className="block text-xs font-bold text-foreground-muted uppercase tracking-wider mb-2.5">
                  Type de bien
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {TYPE_LOGEMENT_VALUES.map((t) => {
                    const isSelected = filters.type?.includes(t);
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => {
                          const nextTypes = isSelected
                            ? (filters.type || []).filter((x) => x !== t)
                            : [...(filters.type || []), t];
                          updateFilters({ type: nextTypes.length > 0 ? nextTypes.join(',') : null });
                        }}
                        className={cn(
                          'py-2.5 px-3 rounded-xl text-xs font-semibold border transition-all text-center capitalize active:scale-95',
                          isSelected
                            ? 'bg-forest-900 text-lime-300 border-forest-900 font-bold shadow-xs'
                            : 'bg-neutral-50 border-border text-foreground hover:bg-neutral-100'
                        )}
                      >
                        {t}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 5. Intervalle de prix */}
              <div>
                <label className="block text-xs font-bold text-foreground-muted uppercase tracking-wider mb-2.5">
                  Budget max par nuit (FCFA)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {PRIX_PRESETS.map((p) => (
                    <button
                      key={p.max}
                      type="button"
                      onClick={() => updateFilters({ max: filters.max === p.max ? null : p.max, min: null })}
                      className={cn(
                        'py-2.5 px-3 rounded-xl text-xs font-semibold border transition-all text-center active:scale-95',
                        filters.max === p.max
                          ? 'bg-forest-900 text-lime-300 border-forest-900 font-bold shadow-xs'
                          : 'bg-neutral-50 border-border text-foreground hover:bg-neutral-100'
                      )}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Footer Modal Sticky */}
            <div className="p-4 border-t border-border flex items-center justify-between bg-neutral-50/80 backdrop-blur-md">
              <button
                type="button"
                onClick={resetAllFilters}
                className="text-xs font-bold text-foreground-muted hover:text-rose-600 underline transition-colors px-2 py-1"
              >
                Tout réinitialiser
              </button>
              <button
                type="button"
                onClick={() => setActivePopover(null)}
                className="px-6 py-3 bg-forest-900 hover:bg-forest-800 text-lime-300 font-bold text-xs rounded-xl shadow-md transition-all active:scale-95"
              >
                Afficher les résultats
              </button>
            </div>

          </div>
        </>,
        document.body
      )}

    </div>
  );
}
