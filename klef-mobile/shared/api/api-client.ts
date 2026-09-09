import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { useRoleStore } from '../stores/role.store';
import { useAuthStore } from '../../features/auth/stores/auth.store';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://stickybar-backend.onrender.com/api/v1';

const TOKEN_KEY = 'klef_auth_token';
const REFRESH_TOKEN_KEY = 'klef_refresh_token';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Intercepteur de Requêtes (Injection du Bearer Token & Rôle Actif) ────────

apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      const activeRole = useRoleStore.getState().activeRole;
      if (activeRole) {
        config.headers['X-Active-Role'] = activeRole;
      }

      config.headers['X-Client-Platform'] = Platform.OS === 'ios' ? 'IOS' : 'ANDROID';
    } catch (error) {
      console.warn('[ApiClient] Erreur lors de la lecture des jetons :', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Intercepteur de Réponses (Rafraîchissement Silencieux du Token 401) ──────

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else if (token) {
      promise.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Si l'erreur est un 401 Unauthorized et la requête n'a pas déjà été réessayée
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Si un rafraîchissement est déjà en cours, mettre en attente les requêtes concurrentes
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const storedRefreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
        if (!storedRefreshToken) {
          throw new Error('Refresh token absent');
        }

        // Appel de rafraîchissement NestJS
        const res = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken: storedRefreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } = res.data;

        // Sauvegarde des nouveaux tokens chiffrés
        await SecureStore.setItemAsync(TOKEN_KEY, accessToken);
        if (newRefreshToken) {
          await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, newRefreshToken);
        }

        // Mettre à jour l'en-tête de la requête échouée et dépiler les requêtes en attente
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        processQueue(null, accessToken);
        isRefreshing = false;

        return apiClient(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        isRefreshing = false;

        // Échec du rafraîchissement -> Nettoyage et déconnexion propre
        console.warn('[ApiClient] Échec du rafraîchissement de token. Déconnexion...');
        await useAuthStore.getState().logout();
        return Promise.reject(refreshErr);
      }
    }

    return Promise.reject(error);
  }
);
