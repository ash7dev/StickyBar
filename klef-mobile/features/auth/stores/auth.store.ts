import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthUser } from '../../../shared/contracts';
import { apiClient } from '../../../shared/api/api-client';
import { useRoleStore } from '../../../shared/stores/role.store';

const TOKEN_KEY = 'klef_auth_token';
const REFRESH_TOKEN_KEY = 'klef_refresh_token';
const USER_KEY = 'klef_auth_user';
const ONBOARDING_KEY = 'klef_has_seen_onboarding';

const USER_CACHE_KEYS = [
  USER_KEY,
  'klef_owner_dashboard_cache_v1',
  'klef_owner_stats_cache_v1',
  'klef_owner_wallet_cache_v1',
  'klef_owner_listings_cache_v1',
  'klef_owner_reservations_cache_v1',
  'klef_tenant_reservations_cache_v1',
  'klef_owner_payout_cache_v1',
  'klef_tenant_payout_cache_v1',
  'klef_tenant_teranga_cache_v1',
];

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasSeenOnboarding: boolean;

  // Actions
  setSession: (token: string, refreshToken: string, user: AuthUser) => Promise<void>;
  setUser: (user: AuthUser) => Promise<void>;
  setHasSeenOnboarding: (seen: boolean) => Promise<void>;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: true,
  hasSeenOnboarding: false,

  setSession: async (token: string, refreshToken: string, user: AuthUser) => {
    try {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
      if (user) {
        await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
      }
      set({
        token,
        refreshToken,
        user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (e) {
      console.error('[AuthStore] Error saving session to SecureStore:', e);
    }
  },

  setUser: async (user: AuthUser) => {
    try {
      if (user) {
        await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
      } else {
        await AsyncStorage.removeItem(USER_KEY);
      }
      set({ user });
    } catch (e) {
      console.error('[AuthStore] Error updating user in storage:', e);
      set({ user });
    }
  },

  setHasSeenOnboarding: async (seen: boolean) => {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, seen ? 'true' : 'false');
      set({ hasSeenOnboarding: seen });
    } catch (e) {
      console.error('[AuthStore] Error saving onboarding state:', e);
    }
  },

  logout: async () => {
    try {
      await Promise.all([
        SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => {}),
        SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY).catch(() => {}),
        AsyncStorage.multiRemove(USER_CACHE_KEYS).catch(() => {}),
      ]);
      useRoleStore.getState().setActiveRole('LOCATAIRE').catch(() => {});
      set({
        token: null,
        refreshToken: null,
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    } catch (e) {
      console.error('[AuthStore] Error clearing session:', e);
      useRoleStore.getState().setActiveRole('LOCATAIRE').catch(() => {});
      set({
        token: null,
        refreshToken: null,
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  hydrate: async () => {
    set({ isLoading: true });
    try {
      const storedToken = await SecureStore.getItemAsync(TOKEN_KEY);
      const storedRefreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
      const storedUserRaw = await AsyncStorage.getItem(USER_KEY);
      const storedOnboarding = await AsyncStorage.getItem(ONBOARDING_KEY);

      const hasSeenOnboarding = storedOnboarding === 'true';
      let storedUser: AuthUser | null = null;

      if (storedUserRaw) {
        try {
          storedUser = JSON.parse(storedUserRaw);
        } catch (parseErr) {
          console.warn('[AuthStore] Error parsing stored user JSON:', parseErr);
        }
      }

      if (storedToken) {
        set({
          token: storedToken,
          refreshToken: storedRefreshToken,
          user: storedUser,
          isAuthenticated: true,
          hasSeenOnboarding,
          isLoading: false,
        });

        // Background refresh: Interroger /auth/me pour garder les infos fraîches à chaque rechargement
        apiClient
          .get<any>('/auth/me')
          .then((res) => {
            const freshUser = res.data?.data || res.data;
            if (freshUser && freshUser.id) {
              get().setUser(freshUser);
            }
          })
          .catch((err) => {
            console.warn('[AuthStore] Background /auth/me sync error:', err?.message);
            if (err.response?.status === 401) {
              get().logout();
            }
          });
      } else {
        set({
          token: null,
          refreshToken: null,
          user: null,
          isAuthenticated: false,
          hasSeenOnboarding,
          isLoading: false,
        });
      }
    } catch (e) {
      console.error('[AuthStore] Error hydrating auth state:', e);
      set({ isLoading: false });
    }
  },
}));
