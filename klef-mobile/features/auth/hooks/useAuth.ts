import { useState } from 'react';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { apiClient } from '../../../shared/api/api-client';
import { useAuthStore } from '../stores/auth.store';
import { AuthTokensResponse, AuthUser } from '../../../shared/contracts';
import { supabase } from '../../../shared/supabase/client';

WebBrowser.maybeCompleteAuthSession();

export function useAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { setSession, setUser, logout: clearStoreSession, user, isAuthenticated } = useAuthStore();

  // 1. Envoi OTP SMS
  const sendPhoneOtp = async (telephone: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await apiClient.post('/auth/login/phone/send', { phone: telephone });
      setLoading(false);
      return true;
    } catch (err: any) {
      const rawMsg = err.response?.data?.message;
      const msg = Array.isArray(rawMsg) ? rawMsg.join(', ') : (rawMsg || 'Erreur lors de l’envoi du SMS OTP');
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
        phone: telephone,
        token: otp,
      });

      const { accessToken, refreshToken, user } = res.data;
      await setSession(accessToken, refreshToken, user);
      setLoading(false);
      return true;
    } catch (err: any) {
      const rawMsg = err.response?.data?.message;
      const msg = Array.isArray(rawMsg) ? rawMsg.join(', ') : (rawMsg || 'Code OTP invalide ou expiré');
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
      const rawMsg = err.response?.data?.message;
      const msg = Array.isArray(rawMsg) ? rawMsg.join(', ') : (rawMsg || 'Code de vérification email invalide ou expiré');
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
      const rawMsg = err.response?.data?.message;
      const msg = Array.isArray(rawMsg) ? rawMsg.join(', ') : (rawMsg || 'Email ou mot de passe incorrect');
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
      const rawMsg = err.response?.data?.message;
      const msg = Array.isArray(rawMsg) ? rawMsg.join(', ') : (rawMsg || 'Erreur lors de l’inscription');
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

  // 7. Connexion / Inscription via Google OAuth (ou Supabase Token)
  const loginGoogle = async (supabaseToken?: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      let activeToken = supabaseToken;

      if (!activeToken) {
        // Utiliser une URL propre 'callback' sans parenthèses '(auth)' pour éviter le blocage Cloudflare WAF sur Supabase
        const redirectUrl = Linking.createURL('callback');
        const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: redirectUrl,
            skipBrowserRedirect: true,
          },
        });

        if (oauthError) throw oauthError;

        if (data?.url) {
          const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
          if (result.type === 'success' && result.url) {
            const rawUrl = result.url;
            let tokenFromUrl: string | null = null;

            if (rawUrl.includes('#')) {
              const hashString = rawUrl.split('#')[1];
              const params = new URLSearchParams(hashString);
              tokenFromUrl = params.get('access_token');
            } else if (rawUrl.includes('?')) {
              const queryString = rawUrl.split('?')[1];
              const params = new URLSearchParams(queryString);
              tokenFromUrl = params.get('access_token');
            }

            if (tokenFromUrl) {
              activeToken = tokenFromUrl;
            } else {
              const { data: sessionData } = await supabase.auth.getSession();
              activeToken = sessionData.session?.access_token;
            }
          } else {
            setLoading(false);
            return false;
          }
        }
      }

      if (!activeToken) {
        throw new Error("Impossible d'obtenir le token de connexion Google");
      }

      const res = await apiClient.get<AuthTokensResponse>('/auth/me/supabase', {
        headers: {
          Authorization: `Bearer ${activeToken}`,
        },
      });

      const { accessToken, refreshToken, user } = res.data;
      await setSession(accessToken, refreshToken, user);
      setLoading(false);
      return true;
    } catch (err: any) {
      const rawMsg = err.response?.data?.message;
      const msg = Array.isArray(rawMsg) ? rawMsg.join(', ') : (err.message || 'Erreur lors de la connexion Google');
      setError(msg);
      setLoading(false);
      return false;
    }
  };

  // 8. Déconnexion
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
    loginGoogle,
    fetchCurrentUser,
    logout,
  };
}
