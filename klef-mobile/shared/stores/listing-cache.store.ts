import { create } from 'zustand';

export interface CachedFeedSection {
  id: string;
  listings: any[];
}

interface ListingCacheState {
  feedSections: CachedFeedSection[] | null;
  feedTimestamp: number;
  detailsMap: Record<string, { data: any; timestamp: number; isPartial?: boolean }>;

  setFeed: (sections: CachedFeedSection[]) => void;
  getFeed: () => CachedFeedSection[] | null;

  setDetail: (id: string, detail: any, isPartial?: boolean) => void;
  getDetail: (id: string) => { data: any; isPartial?: boolean } | null;

  prefillFromFeed: (sections: CachedFeedSection[]) => void;
  invalidateFeed: () => void;
  invalidateDetail: (id: string) => void;
  clearAll: () => void;
}

const FEED_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const DETAIL_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

export const useListingCacheStore = create<ListingCacheState>((set, get) => ({
  feedSections: null,
  feedTimestamp: 0,
  detailsMap: {},

  setFeed: (sections) => {
    set({
      feedSections: sections,
      feedTimestamp: Date.now(),
    });
    get().prefillFromFeed(sections);
  },

  getFeed: () => {
    const { feedSections, feedTimestamp } = get();
    if (!feedSections || Date.now() - feedTimestamp > FEED_CACHE_TTL) {
      return null;
    }
    return feedSections;
  },

  setDetail: (id, detail, isPartial = false) => {
    set((state) => ({
      detailsMap: {
        ...state.detailsMap,
        [id]: {
          data: detail,
          timestamp: Date.now(),
          isPartial,
        },
      },
    }));
  },

  getDetail: (id) => {
    const cached = get().detailsMap[id];
    if (!cached) return null;

    // Un cache partiel (venant du feed) a un TTL de 30 min, un full detail de 10 min
    const ttl = cached.isPartial ? 30 * 60 * 1000 : DETAIL_CACHE_TTL;
    if (Date.now() - cached.timestamp > ttl) {
      return null;
    }
    return { data: cached.data, isPartial: cached.isPartial };
  },

  prefillFromFeed: (sections) => {
    if (!Array.isArray(sections)) return;
    const newDetailsMap = { ...get().detailsMap };
    let hasChanges = false;

    sections.forEach((sec) => {
      if (Array.isArray(sec.listings)) {
        sec.listings.forEach((item) => {
          if (item?.id) {
            const existing = newDetailsMap[item.id];
            // Ne pas écraser un full detail existant par du partial
            if (!existing || existing.isPartial) {
              const photoArray = Array.isArray(item.photos)
                ? item.photos
                : typeof item.photos === 'string'
                ? [{ url: item.photos, estPrincipale: true }]
                : [];

              newDetailsMap[item.id] = {
                data: {
                  ...item,
                  photos: photoArray,
                  description:
                    item.description ||
                    `${item.type || 'Logement'} d'exception situé à ${item.ville || 'Dakar'}${
                      item.quartier ? ` (${item.quartier})` : ''
                    }. Cadre idéal pour vos séjours et vacances.`,
                  note: item.note ?? 4.8,
                  totalSejours: item.totalSejours ?? 1,
                  equipements: Array.isArray(item.equipements) ? item.equipements : [],
                  indisponibilites: existing?.data?.indisponibilites || [],
                  reservations: existing?.data?.reservations || [],
                  avis: existing?.data?.avis || [],
                  proprietaire: existing?.data?.proprietaire || null,
                },
                timestamp: Date.now(),
                isPartial: true,
              };
              hasChanges = true;
            }
          }
        });
      }
    });

    if (hasChanges) {
      set({ detailsMap: newDetailsMap });
    }
  },

  invalidateFeed: () => {
    set({ feedSections: null, feedTimestamp: 0 });
  },

  invalidateDetail: (id) => {
    set((state) => {
      const nextMap = { ...state.detailsMap };
      delete nextMap[id];
      return { detailsMap: nextMap };
    });
  },

  clearAll: () => {
    set({ feedSections: null, feedTimestamp: 0, detailsMap: {} });
  },
}));
