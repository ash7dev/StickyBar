'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export const MAX_ZONES = 5;
export const MAX_SOUS_TYPES = 3;

export const AVAILABLE_ZONES = [
  // Dakar et environs
  'Almadies', 'Ngor', 'Virage', 'Les Mamelles', 'Mermoz', 'Point E',
  'Fann Résidence', 'Plateau', 'Médina', 'Ouakam', 'Sacré-Cœur',
  'Cité Keur Gorgui', 'Nord Foire', 'Ouest Foire', 'Sud Foire', 'Yoff',
  'Hann Maristes', 'Liberté 6', 'Parcelles Assainies', 'Keur Massar',
  'Guédiawaye', 'Pikine', 'Rufisque', 'Diamniadio',

  // Petite Côte
  'Saly', 'Saly Portudal', 'Saly Niakh Niakhal', 'Ngaparou', 'Somone',
  'Popenguine', 'Toubab Dialaw', 'Ndayane', 'Mbour', 'Warang', 'Nianing',
  'Pointe Sarène', 'Mbodiène', 'Joal-Fadiouth',

  // Régions
  'Saint-Louis', 'Cap Skirring', 'Ziguinchor', 'Gorée', 'Lac Rose',
  'Thiès', 'Lompoul',
] as const;

export const AVAILABLE_SOUS_TYPES = [
  'Villa avec piscine', 'Penthouse', 'Loft', 'Villa bord de mer',
  'Suite meublée', 'Villa de luxe', 'Villa familiale', 'Villa pour événement',
  'Appartement F2', 'Appartement F3', 'Appartement F4+', 'Studio',
  'Maison entière', 'Résidence hôtelière', 'Duplex',
  'Riad / Maison traditionnelle', 'Cabane / Logement atypique',
] as const;

export type Zone = (typeof AVAILABLE_ZONES)[number];
export type SousType = (typeof AVAILABLE_SOUS_TYPES)[number];

export interface HomePreferences {
  zones: string[];
  sousTypes: string[];
  hasCompletedOnboarding: boolean;
}

const STORAGE_KEY = 'klef_home_preferences_v1';

const DEFAULT_PREFERENCES: HomePreferences = {
  zones: [],
  sousTypes: [],
  hasCompletedOnboarding: false,
};

/* Les valeurs stockées sont filtrées contre les listes courantes. Sans ça,
   renommer une zone laisse des préférences pointant sur un libellé qui
   n'existe plus : l'accueil se vide sans que l'utilisateur comprenne. Les
   doublons sont également écartés. */
const sanitize = (values: unknown, allowed: readonly string[], max: number): string[] => {
  if (!Array.isArray(values)) return [];
  return [...new Set(values.filter((v): v is string => typeof v === 'string' && allowed.includes(v)))]
    .slice(0, max);
};

const parseStored = (raw: string | null): HomePreferences => {
  if (!raw) return DEFAULT_PREFERENCES;
  try {
    const parsed = JSON.parse(raw) as Partial<HomePreferences>;
    return {
      zones: sanitize(parsed.zones, AVAILABLE_ZONES, MAX_ZONES),
      sousTypes: sanitize(parsed.sousTypes, AVAILABLE_SOUS_TYPES, MAX_SOUS_TYPES),
      hasCompletedOnboarding: Boolean(parsed.hasCompletedOnboarding),
    };
  } catch {
    return DEFAULT_PREFERENCES;
  }
};

export function useHomePreferences() {
  const [preferences, setPreferences] = useState<HomePreferences>(DEFAULT_PREFERENCES);
  const [isLoaded, setIsLoaded] = useState(false);
  const hydrated = useRef(false);

  useEffect(() => {
    try {
      setPreferences(parseStored(localStorage.getItem(STORAGE_KEY)));
    } catch {
      /* localStorage indisponible : navigation privée sur certains Safari,
         ou cookies tiers bloqués. Le hook reste fonctionnel en mémoire. */
    } finally {
      hydrated.current = true;
      setIsLoaded(true);
    }
  }, []);

  /* La persistance vit dans un effet, plus dans l'updater de setState :
     React peut rejouer un updater (StrictMode le fait toujours en dev), ce
     qui produisait des écritures dupliquées et, sur un rendu abandonné, une
     écriture ne correspondant à aucun état affiché. */
  useEffect(() => {
    if (!hydrated.current) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    } catch (e) {
      console.error('[HomePreferences] Sauvegarde impossible', e);
    }
  }, [preferences]);

  /* Synchronisation entre onglets : sans ça, modifier ses préférences dans
     un onglet laissait les autres sur des valeurs périmées. */
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return;
      setPreferences(parseStored(e.newValue));
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const savePreferences = useCallback((next: Partial<HomePreferences>) => {
    setPreferences((prev) => ({
      zones: next.zones !== undefined
        ? sanitize(next.zones, AVAILABLE_ZONES, MAX_ZONES)
        : prev.zones,
      sousTypes: next.sousTypes !== undefined
        ? sanitize(next.sousTypes, AVAILABLE_SOUS_TYPES, MAX_SOUS_TYPES)
        : prev.sousTypes,
      hasCompletedOnboarding: next.hasCompletedOnboarding ?? prev.hasCompletedOnboarding,
    }));
  }, []);

  /* Toggles en forme fonctionnelle : la version précédente lisait
     `preferences` depuis la closure, donc deux clics rapides dans le même
     cycle de rendu — courant sur une grille de chips tactile — faisaient
     perdre le premier. */
  const toggleZone = useCallback((zone: string) => {
    setPreferences((prev) => {
      if (prev.zones.includes(zone)) {
        return { ...prev, zones: prev.zones.filter((z) => z !== zone) };
      }
      if (prev.zones.length >= MAX_ZONES) return prev;
      if (!AVAILABLE_ZONES.includes(zone as Zone)) return prev;
      return { ...prev, zones: [...prev.zones, zone] };
    });
  }, []);

  const toggleSousType = useCallback((sousType: string) => {
    setPreferences((prev) => {
      if (prev.sousTypes.includes(sousType)) {
        return { ...prev, sousTypes: prev.sousTypes.filter((s) => s !== sousType) };
      }
      if (prev.sousTypes.length >= MAX_SOUS_TYPES) return prev;
      if (!AVAILABLE_SOUS_TYPES.includes(sousType as SousType)) return prev;
      return { ...prev, sousTypes: [...prev.sousTypes, sousType] };
    });
  }, []);

  const resetPreferences = useCallback(() => {
    setPreferences(DEFAULT_PREFERENCES);
  }, []);

  /* `hasCompletedOnboarding` restait à false après un reset alors que
     l'utilisateur avait déjà vu l'onboarding : il lui était reproposé au
     rechargement suivant. Vider ses filtres n'est pas revenir à zéro. */
  const clearFilters = useCallback(() => {
    setPreferences((prev) => ({ ...prev, zones: [], sousTypes: [] }));
  }, []);

  const completeOnboarding = useCallback((zones?: string[], sousTypes?: string[]) => {
    setPreferences((prev) => ({
      zones: zones !== undefined ? sanitize(zones, AVAILABLE_ZONES, MAX_ZONES) : prev.zones,
      sousTypes: sousTypes !== undefined
        ? sanitize(sousTypes, AVAILABLE_SOUS_TYPES, MAX_SOUS_TYPES)
        : prev.sousTypes,
      hasCompletedOnboarding: true,
    }));
  }, []);

  return {
    preferences,
    isLoaded,
    toggleZone,
    toggleSousType,
    savePreferences,
    resetPreferences,
    clearFilters,
    completeOnboarding,
    hasActivePreferences: preferences.zones.length > 0 || preferences.sousTypes.length > 0,
    canAddZone: preferences.zones.length < MAX_ZONES,
    canAddSousType: preferences.sousTypes.length < MAX_SOUS_TYPES,
  };
}