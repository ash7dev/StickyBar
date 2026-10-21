import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SearchParams } from '../components/layout/TenantSearchModal';
import { ListingItem } from '../components/ui/TenantListingCard';

export interface SavedSearchItem extends SearchParams {
  timestamp: number;
}

interface SearchHistoryState {
  latestSearch: SavedSearchItem | null;
  searchHistory: SavedSearchItem[];
  recentListings: ListingItem[];
  saveSearch: (params: SearchParams) => void;
  addRecentListing: (listing: ListingItem) => void;
  clearHistory: () => void;
}

export const useSearchHistoryStore = create<SearchHistoryState>()(
  persist(
    (set) => ({
      latestSearch: null,
      searchHistory: [],
      recentListings: [],

      saveSearch: (params) => {
        // Ignorer si tous les champs sont vides
        if (
          !params.ville &&
          !params.arrivee &&
          !params.depart &&
          !params.nbPersonnes &&
          !params.nombreChambres
        ) {
          return;
        }

        const newItem: SavedSearchItem = {
          ...params,
          timestamp: Date.now(),
        };

        set((state) => {
          // Filtrer les doublons récents (même ville, mêmes dates, mêmes personnes/chambres)
          const filteredHistory = state.searchHistory.filter((item) => {
            return !(
              item.ville === params.ville &&
              item.arrivee === params.arrivee &&
              item.depart === params.depart &&
              item.nbPersonnes === params.nbPersonnes &&
              item.nombreChambres === params.nombreChambres
            );
          });

          return {
            latestSearch: newItem,
            searchHistory: [newItem, ...filteredHistory].slice(0, 5),
          };
        });
      },

      addRecentListing: (listing) => {
        set((state) => {
          const filtered = state.recentListings.filter((item) => item.id !== listing.id);
          return {
            recentListings: [listing, ...filtered].slice(0, 8),
          };
        });
      },

      clearHistory: () => {
        set({
          latestSearch: null,
          searchHistory: [],
          recentListings: [],
        });
      },
    }),
    {
      name: 'klef_search_history_storage_v1',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
