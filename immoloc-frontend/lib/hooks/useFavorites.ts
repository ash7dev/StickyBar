'use client';

import { useState, useEffect, useCallback } from 'react';

const FAVORITES_KEY = 'klef_favorites';
const EVENT_NAME = 'klef-favorites-updated';

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const loadFavorites = useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem(FAVORITES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setFavorites(parsed);
        }
      }
    } catch (e) {
      console.warn('Erreur lecture favoris localStorage:', e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    loadFavorites();

    const handleUpdate = () => {
      loadFavorites();
    };

    window.addEventListener(EVENT_NAME, handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener(EVENT_NAME, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [loadFavorites]);

  const isFavorite = useCallback(
    (id: string) => {
      return favorites.includes(id);
    },
    [favorites]
  );

  const toggleFavorite = useCallback(
    (id: string) => {
      if (typeof window === 'undefined' || !id) return;

      try {
        const stored = localStorage.getItem(FAVORITES_KEY);
        let current: string[] = [];
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) current = parsed;
        }

        let updated: string[];
        if (current.includes(id)) {
          updated = current.filter((item) => item !== id);
        } else {
          updated = [id, ...current];
        }

        localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
        setFavorites(updated);

        // Notifier tous les composants de l'application
        window.dispatchEvent(new Event(EVENT_NAME));
      } catch (e) {
        console.warn('Erreur sauvegarde favoris:', e);
      }
    },
    []
  );

  return {
    favorites,
    favoritesCount: favorites.length,
    isFavorite,
    toggleFavorite,
    isLoaded,
  };
}

export default useFavorites;
