'use client';

import { useCallback, useMemo } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import type { SearchFilters } from './filters-schema';
import { countActiveFilters, parseSearchParams } from './filters-schema';

/**
 * Hook de gestion des filtres de recherche
 * Encapsule toute la logique de sérialisation/désérialisation d'URL
 * Aucun composant ne manipule URLSearchParams directement
 */
export function useSearchFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  /**
   * Filtres actuels parsés depuis l'URL
   */
  const filters = useMemo<SearchFilters>(() => {
    const raw: Record<string, string | string[] | undefined> = {};
    searchParams.forEach((value, key) => {
      raw[key] = value;
    });
    return parseSearchParams(raw);
  }, [searchParams]);

  /**
   * Nombre de filtres actifs
   */
  const activeCount = useMemo(() => countActiveFilters(filters), [filters]);

  /**
   * Construit une nouvelle URL avec les filtres modifiés
   */
  const buildURL = useCallback((updates: Partial<SearchFilters>) => {
    const params = new URLSearchParams(searchParams.toString());

    // Appliquer les mises à jour
    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') {
        // Retirer le paramètre vide
        params.delete(key);
      } else if (Array.isArray(value)) {
        // Joindre les tableaux par virgule
        if (value.length === 0) {
          params.delete(key);
        } else {
          params.set(key, value.join(','));
        }
      } else if (typeof value === 'boolean') {
        // Boolean true = '1', false = retirer
        if (value) {
          params.set(key, '1');
        } else {
          params.delete(key);
        }
      } else {
        params.set(key, String(value));
      }
    });

    // Toujours remettre page à 1 si ce n'est pas un changement de page
    if (!('page' in updates)) {
      params.set('page', '1');
    }

    return `${pathname}?${params.toString()}`;
  }, [pathname, searchParams]);

  /**
   * Met à jour un ou plusieurs filtres
   * Utilise replace (pas push) pour éviter de polluer l'historique
   * EXCEPTION : changements majeurs (ville, dates) utilisent push
   */
  const setFilter = useCallback((updates: Partial<SearchFilters>) => {
    const url = buildURL(updates);

    // Changements majeurs : ville ou dates
    const isMajorChange = 'ville' in updates || 'arrivee' in updates || 'depart' in updates;

    if (isMajorChange) {
      router.push(url, { scroll: false });
    } else {
      router.replace(url, { scroll: false });
    }
  }, [buildURL, router]);

  /**
   * Retire un filtre spécifique
   */
  const removeFilter = useCallback((key: keyof SearchFilters) => {
    const updates: Partial<SearchFilters> = { [key]: undefined };

    // Cas spécial pour les dates : retirer les deux ensemble
    if (key === 'arrivee' || key === 'depart') {
      updates.arrivee = undefined;
      updates.depart = undefined;
    }

    setFilter(updates);
  }, [setFilter]);

  /**
   * Efface tous les filtres (garde uniquement le tri par défaut)
   */
  const clearAll = useCallback(() => {
    router.push(pathname, { scroll: false });
  }, [pathname, router]);

  /**
   * Met à jour un filtre avec debounce (pour les champs texte et curseurs)
   * Retourne une fonction de nettoyage
   */
  const setFilterDebounced = useCallback((
    key: keyof SearchFilters,
    value: unknown,
    delay = 300
  ) => {
    const timeoutId = setTimeout(() => {
      setFilter({ [key]: value });
    }, delay);

    return () => clearTimeout(timeoutId);
  }, [setFilter]);

  return {
    /** Filtres actuels parsés */
    filters,

    /** Nombre de filtres actifs (hors tri et page) */
    activeCount,

    /** Met à jour un ou plusieurs filtres */
    setFilter,

    /** Retire un filtre spécifique */
    removeFilter,

    /** Efface tous les filtres */
    clearAll,

    /** Met à jour avec debounce */
    setFilterDebounced,

    /** Construit une URL avec des modifications (pour Link) */
    buildURL,
  };
}
