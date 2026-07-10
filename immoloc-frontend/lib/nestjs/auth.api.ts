// ── Service Auth ──────────────────────────────────────────────────────────────
// Toutes les fonctions d'appel API liées à l'authentification.
// Pas de logique React ici — uniquement des appels réseau typés.

import { nestFetch } from './api-client';
import { NEST_API } from './endpoints';
import type {
  LoginEmailPayload,
  RegisterPayload,
  SendOtpPayload,
  VerifyOtpPayload,
  VerifyCurrentPhoneSendPayload,
  VerifyCurrentPhoneConfirmPayload,
  VerifyCurrentPhoneResponse,
  CompleteOnboardingPayload,
  MeSupabaseResponse,
  CompleteProfilePayload,
  RefreshPayload,
  SwitchRolePayload,
  AuthTokensResponse,
  RefreshResponse,
  MeResponse,
} from './types';

export const authApi = {
  /** Connexion par email + mot de passe */
  loginEmail: (payload: LoginEmailPayload) =>
    nestFetch<AuthTokensResponse>(NEST_API.AUTH.LOGIN_EMAIL, {
      method: 'POST',
      body: JSON.stringify(payload),
      skipAutoToken: true,
    }),

  /** Inscription d'un nouveau compte */
  register: (payload: RegisterPayload) =>
    nestFetch<void>(NEST_API.AUTH.REGISTER, {
      method: 'POST',
      body: JSON.stringify(payload),
      skipAutoToken: true,
    }),

  /** Envoi du code OTP par SMS */
  sendOtp: (payload: SendOtpPayload) =>
    nestFetch<void>(NEST_API.AUTH.LOGIN_PHONE_SEND, {
      method: 'POST',
      body: JSON.stringify(payload),
      skipAutoToken: true,
    }),

  /** Vérification du code OTP → retourne les tokens */
  verifyOtp: (payload: VerifyOtpPayload) =>
    nestFetch<AuthTokensResponse>(NEST_API.AUTH.LOGIN_PHONE_VERIFY, {
      method: 'POST',
      body: JSON.stringify(payload),
      skipAutoToken: true,
    }),

  sendCurrentPhoneOtp: (payload: VerifyCurrentPhoneSendPayload) =>
    nestFetch<{ message: string; mocked: boolean }>(NEST_API.AUTH.VERIFY_CURRENT_PHONE_SEND, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  verifyCurrentPhoneOtp: (payload: VerifyCurrentPhoneConfirmPayload) =>
    nestFetch<VerifyCurrentPhoneResponse>(NEST_API.AUTH.VERIFY_CURRENT_PHONE_CONFIRM, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  completeOnboarding: (payload: CompleteOnboardingPayload, supabaseToken: string) =>
    nestFetch<AuthTokensResponse>(NEST_API.AUTH.ONBOARDING_COMPLETE, {
      method: 'POST',
      body: JSON.stringify(payload),
      token: supabaseToken,
    }),

  /** Finalisation du profil après connexion Google OAuth */
  completeGoogleProfile: (payload: CompleteProfilePayload, token: string) =>
    nestFetch<void>(NEST_API.AUTH.GOOGLE_COMPLETE_PROFILE, {
      method: 'POST',
      body: JSON.stringify(payload),
      token,
    }),

  /** Renouvellement du access token via le refresh token */
  refresh: (payload: RefreshPayload) =>
    nestFetch<RefreshResponse>(NEST_API.AUTH.REFRESH, {
      method: 'POST',
      body: JSON.stringify(payload),
      skipAutoToken: true,
    }),

  /** Déconnexion côté serveur */
  logout: () =>
    nestFetch<void>(NEST_API.AUTH.LOGOUT, { method: 'POST' }),

  /** Basculement de rôle (LOCATAIRE ↔ PROPRIETAIRE) */
  switchRole: (payload: SwitchRolePayload) =>
    nestFetch<AuthTokensResponse>(NEST_API.AUTH.SWITCH_ROLE, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  /** Passage au rôle PROPRIETAIRE */
  becomeHost: () =>
    nestFetch<AuthTokensResponse>(NEST_API.AUTH.BECOME_HOST, { method: 'POST' }),

  /** Récupération du profil de l'utilisateur connecté */
  me: (token?: string) =>
    nestFetch<MeResponse>(NEST_API.AUTH.ME, { token }),

  meSupabase: (supabaseToken: string) =>
    nestFetch<MeSupabaseResponse>(NEST_API.AUTH.ME_SUPABASE, { token: supabaseToken }),
};
