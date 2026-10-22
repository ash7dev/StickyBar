import { create } from 'zustand';
import { AppState } from 'react-native';
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
  /**
   * Relit le profil complet sur le serveur et le FUSIONNE dans le store (jamais
   * d'écrasement par un objet partiel). Les appels simultanés partagent la même requête.
   */
  refreshUser: () => Promise<AuthUser | null>;
  setHasSeenOnboarding: (seen: boolean) => Promise<void>;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
}

// ── Synchronisation du profil ───────────────────────────────────────────────
let inFlight: Promise<AuthUser | null> | null = null;
let lastRefresh = 0;
let foregroundWatched = false;
/** Au retour au premier plan, on relit le profil s'il date de plus de 2 minutes. */
const FOREGROUND_REFRESH_MS = 2 * 60_000;

function watchForeground(get: () => AuthState) {
  if (foregroundWatched) return;
  foregroundWatched = true;
  AppState.addEventListener('change', (state) => {
    if (state === 'active' && get().token && Date.now() - lastRefresh > FOREGROUND_REFRESH_MS) {
      get().refreshUser();
    }
  });
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
      lastRefresh = Date.now();
      watchForeground(get);
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

  refreshUser: () => {
    if (inFlight) return inFlight;
    inFlight = apiClient
      .get<any>('/users/me')
      .then(async (res) => {
        const fresh = res.data?.data || res.data;
        const current = get().user;
        if (!fresh?.id || !get().token) return current;
        // Ne garder que les champs connus du serveur : null efface, undefined ne touche à rien
        const merged = { ...(current ?? {}), ...fresh } as AuthUser;
        await get().setUser(merged);
        lastRefresh = Date.now();
        return merged;
      })
      .catch((err) => {
        console.warn('[AuthStore] Synchronisation du profil impossible:', err?.message);
        if (err?.response?.status === 401) get().logout();
        return get().user;
      })
      .finally(() => {
        inFlight = null;
      });
    return inFlight;
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

        // Resynchronisation en arrière-plan : le profil en cache peut dater d'une autre session
        get().refreshUser();
        watchForeground(get);
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
