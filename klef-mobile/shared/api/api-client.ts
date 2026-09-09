import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { useRoleStore } from '../stores/role.store';

// URL de base de l'API NestJS (Render / Production / Dev local)
// En dev local Android emulator: 10.0.2.2:4000, iOS simulator: localhost:4000
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://stickybar-backend.onrender.com/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Intercepteur de Requêtes (Injection du Bearer Token & du Rôle Actif) ────────

apiClient.interceptors.request.use(
  async (config) => {
    try {
      // 1. Récupération du Token de Session chiffré depuis le Keychain / Keystore du téléphone
      const token = await SecureStore.getItemAsync('klef_auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // 2. Récupération du Rôle Actif (LOCATAIRE, PROPRIETAIRE, GESTIONNAIRE)
      const activeRole = useRoleStore.getState().activeRole;
      if (activeRole) {
        config.headers['X-Active-Role'] = activeRole;
      }

      // 3. Identification de la plateforme d'origine pour le serveur NestJS
      config.headers['X-Client-Platform'] = Platform.OS === 'ios' ? 'IOS' : 'ANDROID';
    } catch (error) {
      console.warn('[ApiClient] Erreur lors de la lecture des jetons de session :', error);
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ── Intercepteur de Réponses (Gestion Globale des Erreurs HTTP) ─────────────

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      console.warn('[ApiClient] Session expirée ou non autorisée. Nettoyage...');
      await SecureStore.deleteItemAsync('klef_auth_token').catch(() => {});
    }
    return Promise.reject(error);
  },
);
