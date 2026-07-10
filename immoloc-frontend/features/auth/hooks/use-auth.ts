'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { authApi } from '@/lib/nestjs';
import { useRoleStore } from '@/stores/role.store';
import type { RoleState } from '@/stores/role.store';
import type { AuthTokensResponse } from '@/lib/nestjs';
import type { LoginInput, RegisterInput, CompleteProfileInput } from '@/schemas/auth.schema';

const SUPABASE_ERRORS: Record<string, string> = {
  'Invalid login credentials':  'Email ou mot de passe incorrect',
  'Email not confirmed':         'Veuillez confirmer votre email avant de vous connecter',
  'User already registered':     'Un compte existe déjà avec cet email',
  'Phone already registered':    'Ce numéro de téléphone est déjà utilisé',
  'Too many requests':           'Trop de tentatives. Réessayez dans quelques minutes',
  'Email rate limit exceeded':   "Trop d'emails envoyés. Réessayez dans une heure",
  'Invalid OTP':                 'Code invalide ou expiré',
  'Token has expired':           'Code expiré. Demandez un nouveau code',
};

export function mapSupabaseError(message: string): string {
  for (const [key, val] of Object.entries(SUPABASE_ERRORS)) {
    if (message.includes(key)) return val;
  }
  return message;
}

const AUTH_PAGES = ['/login', '/register', '/complete-profile', '/verify'];

// Retourne `next` si c'est un chemin interne sûr, sinon le fallback selon le rôle.
function resolveRedirect(user: AuthTokensResponse['user'], next?: string | null): string {
  if (next && next.startsWith('/') && !next.startsWith('//')) {
    if (!AUTH_PAGES.includes(next.split('?')[0])) return next;
  }
  if (user.activeRole === 'PROPRIETAIRE') {
    return user.hasAnnonce ? '/dashboard' : '/become-host';
  }
  return '/';
}

// Persiste la session dans le store Zustand, incluant dateNaissance si fournie.
function persistSession(result: AuthTokensResponse, setSession: RoleState['setSession']) {
  setSession({
    token:            result.accessToken,
    refreshToken:     result.refreshToken,
    expiresIn:        result.expiresIn,
    role:             result.user.activeRole,
    estProprietaire:  result.user.estProprietaire,
    userId:           result.user.id,
    hasAnnonce:       result.user.hasAnnonce,
    profileCompleted: result.user.profileCompleted,
    phoneVerified:    result.user.phoneVerified,
    statutKyc:        result.user.statutKyc,
    dateNaissance:    result.user.dateNaissance,
  });
}

export function useAuth() {
  const router = useRouter();
  const supabase = createClient();
  const { setSession, clearSession } = useRoleStore();

  async function loginEmail(data: LoginInput, next?: string | null) {
    const result = await authApi.loginEmail(data);
    persistSession(result, setSession);
    if (result.supabaseAccessToken && result.supabaseRefreshToken) {
      await supabase.auth.setSession({
        access_token: result.supabaseAccessToken,
        refresh_token: result.supabaseRefreshToken,
      });
    }
    router.push(resolveRedirect(result.user, next));
    router.refresh();
  }

  async function register(data: RegisterInput) {
    await authApi.register(data);
    return { email: data.email };
  }

  async function sendPhoneOtp(phone: string) {
    await authApi.sendOtp({ phone });
  }

  async function verifyPhoneOtp(phone: string, token: string, redirectPath?: string) {
    const result = await authApi.verifyOtp({ phone, token });
    persistSession(result, setSession);
    if (result.supabaseAccessToken && result.supabaseRefreshToken) {
      await supabase.auth.setSession({
        access_token: result.supabaseAccessToken,
        refresh_token: result.supabaseRefreshToken,
      });
    }
    const target = redirectPath && redirectPath.startsWith('/') ? redirectPath : resolveRedirect(result.user);
    router.push(target);
    router.refresh();
  }

  async function loginWithGoogle(next?: string | null) {
    const safeNext = next && next.startsWith('/') && !next.startsWith('//') && !AUTH_PAGES.includes(next.split('?')[0])
      ? next
      : null;
    const callbackUrl = safeNext
      ? `${window.location.origin}/api/auth/callback?next=${encodeURIComponent(safeNext)}`
      : `${window.location.origin}/api/auth/callback`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: callbackUrl },
    });
    if (error) throw new Error(mapSupabaseError(error.message));
  }

  async function completeGoogleProfile(data: CompleteProfileInput, accessToken: string, next?: string | null) {
    await authApi.completeGoogleProfile(data, accessToken);
    const me = await authApi.me(accessToken).catch(() => null);
    if (next && next.startsWith('/') && !next.startsWith('//') && !AUTH_PAGES.includes(next.split('?')[0])) {
      router.push(next);
    } else if (me) {
      router.push(me.hasAnnonce && me.activeRole === 'PROPRIETAIRE' ? '/dashboard' : '/');
    } else {
      router.push('/');
    }
    router.refresh();
  }

  async function logout() {
    await authApi.logout().catch(() => {});
    await supabase.auth.signOut();
    clearSession();
    router.push('/login');
    router.refresh();
  }

  return {
    loginEmail,
    register,
    sendPhoneOtp,
    verifyPhoneOtp,
    loginWithGoogle,
    completeGoogleProfile,
    logout,
  };
}
