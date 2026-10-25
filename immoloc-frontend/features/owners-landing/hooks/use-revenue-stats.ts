'use client';

import { useEffect, useState } from 'react';
import { nestFetch } from '@/lib/nestjs/api-client';
import { NEST_API } from '@/lib/nestjs/endpoints';

/** Prix par nuit fixés par les propriétaires, regroupés par ville et type de bien. */
export interface PriceGroup {
  ville: string;
  type: string;
  count: number;
  avg: number;
  min: number;
  max: number;
}

interface SearchItem {
  ville?: string | null;
  type?: string | null;
  prixBase?: number | string | null;
}

interface SearchPage {
  data?: SearchItem[];
  meta?: { totalPages?: number };
}

const PAGE_SIZE = 50;
const MAX_PAGES = 4;

function group(items: SearchItem[]): PriceGroup[] {
  const map = new Map<string, { ville: string; type: string; prices: number[] }>();
  for (const it of items) {
    const prix = Number(it.prixBase);
    const ville = it.ville?.trim();
    if (!ville || !it.type || !(prix > 0)) continue;
    const key = `${ville.toLowerCase()}|${it.type}`;
    const g = map.get(key) ?? { ville, type: it.type, prices: [] };
    g.prices.push(prix);
    map.set(key, g);
  }
  return [...map.values()].map(({ ville, type, prices }) => ({
    ville,
    type,
    count: prices.length,
    avg: Math.round(prices.reduce((s, p) => s + p, 0) / prices.length),
    min: Math.min(...prices),
    max: Math.max(...prices),
  }));
}

/**
 * Les vraies annonces publiées servent de base au calculateur : on ne montre
 * jamais de prix inventé. Pas de données (ou erreur) → le calculateur se cache.
 */
export function useRevenueStats() {
  const [groups, setGroups] = useState<PriceGroup[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const items: SearchItem[] = [];
        for (let page = 1; page <= MAX_PAGES; page++) {
          const res = await nestFetch<SearchPage>(`${NEST_API.LISTINGS.SEARCH}?limit=${PAGE_SIZE}&page=${page}`, {
            skipAutoToken: true,
            retryAttempts: 1,
          });
          items.push(...(res.data ?? []));
          if (page >= (res.meta?.totalPages ?? 1)) break;
        }
        if (!cancelled) setGroups(group(items));
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { groups, failed };
}
