import { useState } from 'react';
import { apiClient } from '../../../shared/api/api-client';
import { useAuthStore } from '../stores/auth.store';
import { AuthTokensResponse, AuthUser } from '../../../shared/contracts';

export function useAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { setSession, setUser, logout: clearStoreSession, user, isAuthenticated } = useAuthStore();

  // 1. Envoi OTP SMS
  const sendPhoneOtp = async (telephone: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await apiClient.post('/auth/login/phone/send', { telephone });
      setLoading(false);
      return true;
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Erreur lors de l’envoi du SMS OTP';
      setError(msg);
      setLoading(false);
      return false;
    }
  };

  // 2. Vérification OTP SMS (Login Téléphone)
  const verifyPhoneOtp = async (telephone: string, otp: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.post<AuthTokensResponse>('/auth/login/phone/verify', {
        telephone,
        otp,
      });

      const { accessToken, refreshToken, user } = res.data;
      await setSession(accessToken, refreshToken, user);
      setLoading(false);
      return true;
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Code OTP invalide ou expiré';
      setError(msg);
      setLoading(false);
      return false;
    }
  };

  // 3. Vérification OTP Email après Inscription (`POST /auth/register/verify-otp`)
  const verifyRegisterEmailOtp = async (email: string, token: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.post<AuthTokensResponse>('/auth/register/verify-otp', {
        email,
        token,
        type: 'EMAIL',
      });

      const { accessToken, refreshToken, user } = res.data;
      await setSession(accessToken, refreshToken, user);
      setLoading(false);
      return true;
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Code de vérification email invalide ou expiré';
      setError(msg);
      setLoading(false);
      return false;
    }
  };

  // 4. Connexion Email + Mot de passe
  const loginEmail = async (email: string, password: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.post<AuthTokensResponse>('/auth/login/email', {
        email,
        password,
      });

      const { accessToken, refreshToken, user } = res.data;
      await setSession(accessToken, refreshToken, user);
      setLoading(false);
      return true;
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Email ou mot de passe incorrect';
      setError(msg);
      setLoading(false);
      return false;
    }
  };

  // 5. Inscription Email/Passe
  const register = async (payload: {
    email: string;
    password: string;
    prenom: string;
    nom: string;
    telephone?: string;
  }): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await apiClient.post('/auth/register', payload);
      setLoading(false);
      return true;
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Erreur lors de l’inscription';
      setError(msg);
      setLoading(false);
      return false;
    }
  };

  // 6. Récupération du profil courant `/auth/me`
  const fetchCurrentUser = async (): Promise<AuthUser | null> => {
    try {
      const res = await apiClient.get<AuthUser>('/auth/me');
      setUser(res.data);
      return res.data;
    } catch (err) {
      console.warn('[useAuth] Error fetching /auth/me:', err);
      return null;
    }
  };

  // 7. Déconnexion
  const logout = async () => {
    try {
      await apiClient.post('/auth/logout').catch(() => {});
    } finally {
      await clearStoreSession();
    }
  };

  return {
    user,
    isAuthenticated,
    loading,
    error,
    sendPhoneOtp,
    verifyPhoneOtp,
    verifyRegisterEmailOtp,
    loginEmail,
    register,
    fetchCurrentUser,
    logout,
  };
}
