'use client';

import { useState, useEffect, useCallback } from 'react';

const RECENTLY_VIEWED_KEY = 'klef_recently_viewed';
const MAX_ITEMS = 6;
const EVENT_NAME = 'klef-recently-viewed-updated';

export interface RecentlyViewedItem {
  id: string;
  titre: string;
  type: string;
  ville: string;
  quartier?: string | null;
  prixBase: number;
  photoUrl?: string | null;
  slug?: string;
  viewedAt: string;
}

export function useRecentlyViewed() {
  const [items, setItems] = useState<RecentlyViewedItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const loadItems = useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem(RECENTLY_VIEWED_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setItems(parsed);
        }
      }
    } catch (e) {
      console.warn('Erreur lecture récemment vus:', e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    loadItems();

    const handleUpdate = () => loadItems();
    window.addEventListener(EVENT_NAME, handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener(EVENT_NAME, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [loadItems]);

  const addRecentlyViewed = useCallback((item: Omit<RecentlyViewedItem, 'viewedAt'>) => {
    if (typeof window === 'undefined' || !item.id) return;

    try {
      const stored = localStorage.getItem(RECENTLY_VIEWED_KEY);
      let current: RecentlyViewedItem[] = [];
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) current = parsed;
      }

      // Enlever s'il existe déjà
      const filtered = current.filter((x) => x.id !== item.id);

      const newItem: RecentlyViewedItem = {
        ...item,
        viewedAt: new Date().toISOString(),
      };

      const updated = [newItem, ...filtered].slice(0, MAX_ITEMS);
      localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(updated));
      setItems(updated);

      window.dispatchEvent(new Event(EVENT_NAME));
    } catch (e) {
      console.warn('Erreur sauvegarde récemment vus:', e);
    }
  }, []);

  const clearRecentlyViewed = useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(RECENTLY_VIEWED_KEY);
      setItems([]);
      window.dispatchEvent(new Event(EVENT_NAME));
    } catch (e) {
      console.warn('Erreur suppression récemment vus:', e);
    }
  }, []);

  return {
    recentlyViewed: items,
    addRecentlyViewed,
    clearRecentlyViewed,
    isLoaded,
  };
}

export default useRecentlyViewed;
