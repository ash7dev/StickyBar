import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthUser, UserRole } from '../../../shared/contracts';

const TOKEN_KEY = 'klef_auth_token';
const REFRESH_TOKEN_KEY = 'klef_refresh_token';
const ONBOARDING_KEY = 'klef_has_seen_onboarding';

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasSeenOnboarding: boolean;

  // Actions
  setSession: (token: string, refreshToken: string, user: AuthUser) => Promise<void>;
  setUser: (user: AuthUser) => void;
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

  setUser: (user: AuthUser) => {
    set({ user });
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
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
      set({
        token: null,
        refreshToken: null,
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    } catch (e) {
      console.error('[AuthStore] Error clearing session:', e);
    }
  },

  hydrate: async () => {
    set({ isLoading: true });
    try {
      const storedToken = await SecureStore.getItemAsync(TOKEN_KEY);
      const storedRefreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
      const storedOnboarding = await AsyncStorage.getItem(ONBOARDING_KEY);

      const hasSeenOnboarding = storedOnboarding === 'true';

      if (storedToken) {
        set({
          token: storedToken,
          refreshToken: storedRefreshToken,
          isAuthenticated: true,
          hasSeenOnboarding,
          isLoading: false,
        });
      } else {
        set({
          token: null,
          refreshToken: null,
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
