import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { StatutKyc } from '@/lib/nestjs/types';
import { API_CONFIG } from '@/lib/config/api';

type Role = 'LOCATAIRE' | 'PROPRIETAIRE' | 'ADMIN';

/**
 * Vérifie si le token est expiré ou sur le point de l'être
 * @param expiresAt Timestamp d'expiration du token
 * @returns true si le token est expiré ou expire dans moins d'1 minute
 */
export function isTokenExpired(expiresAt: number | null): boolean {
  if (!expiresAt) return true;
  return Date.now() >= expiresAt - API_CONFIG.TOKEN_REFRESH_MARGIN;
}

/**
 * Vérifie si le token est complètement expiré (sans marge)
 * @param expiresAt Timestamp d'expiration du token
 * @returns true si le token est expiré
 */
export function isTokenFullyExpired(expiresAt: number | null): boolean {
  if (!expiresAt) return true;
  return Date.now() >= expiresAt;
}

export interface RoleState {
  // ── Tokens ──────────────────────────────────────────────
  nestToken: string | null;
  refreshToken: string | null;
  tokenExpiresAt: number | null;
  hasHydrated: boolean;
  needsOnboarding: boolean;

  // ── Identité ────────────────────────────────────────────
  userId: string | null;
  dateNaissance: string | null;
  activeRole: Role;
  estProprietaire: boolean;
  hasAnnonce: boolean;
  typeHote: 'PARTICULIER' | 'AGENCE' | null;

  // ── Gate statut (chargé au login, mis à jour inline) ────
  profileCompleted: boolean;
  phoneVerified: boolean;
  statutKyc: StatutKyc;
  selfieFaceDetected: boolean;
  selfieMatchScore: number | null;
  onboardingDraft: {
    prenom: string;
    nom: string;
    dateNaissance: string;
  } | null;

  // ── Actions ─────────────────────────────────────────────
  setSession: (params: {
    token: string;
    refreshToken: string;
    expiresIn: number;
    role: Role;
    estProprietaire: boolean;
    userId: string;
    hasAnnonce: boolean;
    profileCompleted?: boolean;
    phoneVerified?: boolean;
    statutKyc?: StatutKyc;
    dateNaissance?: string | null;
    selfieFaceDetected?: boolean;
    selfieMatchScore?: number | null;
  }) => void;
  setRole: (role: Role) => void;
  setHasAnnonce: (value: boolean) => void;
  setGateStatus: (patch: Partial<Pick<RoleState, 'profileCompleted' | 'phoneVerified' | 'statutKyc' | 'dateNaissance' | 'selfieFaceDetected' | 'selfieMatchScore'>>) => void;
  setNeedsOnboarding: (value: boolean) => void;
  setOnboardingDraft: (draft: RoleState['onboardingDraft']) => void;
  setHasHydrated: (value: boolean) => void;
  clearSession: () => void;
}

const INITIAL_STATE = {
  nestToken: null,
  refreshToken: null,
  tokenExpiresAt: null,
  hasHydrated: false,
  needsOnboarding: false,
  userId: null,
  dateNaissance: null,
  activeRole: 'LOCATAIRE' as Role,
  estProprietaire: false,
  hasAnnonce: false,
  typeHote: null,
  profileCompleted: false,
  phoneVerified: false,
  statutKyc: 'NON_VERIFIE' as StatutKyc,
  selfieFaceDetected: false,
  selfieMatchScore: null,
  onboardingDraft: null,
};

export const useRoleStore = create<RoleState>()(
  persist(
    (set) => ({
      ...INITIAL_STATE,

      setSession: ({ token, refreshToken, expiresIn, role, estProprietaire, userId, hasAnnonce, profileCompleted, phoneVerified, statutKyc, dateNaissance, selfieFaceDetected, selfieMatchScore }) =>
        set((prev) => ({
          nestToken: token,
          refreshToken,
          tokenExpiresAt: Date.now() + expiresIn * 1000,
          activeRole: role,
          estProprietaire,
          userId,
          hasAnnonce,
          needsOnboarding: false,
          profileCompleted: profileCompleted ?? prev.profileCompleted,
          phoneVerified: phoneVerified ?? prev.phoneVerified,
          statutKyc: statutKyc ?? prev.statutKyc,
          dateNaissance: dateNaissance !== undefined ? dateNaissance : prev.dateNaissance,
          selfieFaceDetected: selfieFaceDetected ?? prev.selfieFaceDetected,
          selfieMatchScore: selfieMatchScore !== undefined ? selfieMatchScore : prev.selfieMatchScore,
          onboardingDraft: null,
        })),

      setRole: (role) => set({ activeRole: role }),

      setHasAnnonce: (value) => set({ hasAnnonce: value }),

      setGateStatus: (patch) => set(patch),

      setNeedsOnboarding: (value) => set((prev) => value
        ? {
            ...prev,
            nestToken: null,
            refreshToken: null,
            tokenExpiresAt: null,
            userId: null,
            activeRole: 'LOCATAIRE',
            estProprietaire: false,
            hasAnnonce: false,
            needsOnboarding: true,
          }
        : { needsOnboarding: false }),

      setOnboardingDraft: (draft) => set({ onboardingDraft: draft }),

      setHasHydrated: (value) => set({ hasHydrated: value }),

      clearSession: () => set((state) => ({
        ...INITIAL_STATE,
        hasHydrated: state.hasHydrated,
      })),
    }),
    {
      name: 'immoloc-session',
      storage: createJSONStorage(() => sessionStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
        // Nettoyer les tokens expirés au rechargement
        if (state && isTokenFullyExpired(state.tokenExpiresAt)) {
          console.warn('[Role Store] Token expired on rehydration, clearing session');
          state.clearSession();
        }
      },
    },
  ),
);

/**
 * Hook pour vérifier si l'utilisateur est authentifié avec un token valide
 */
export function useIsAuthenticated(): boolean {
  const { nestToken, tokenExpiresAt } = useRoleStore();
  return !!nestToken && !isTokenExpired(tokenExpiresAt);
}

/**
 * Hook pour obtenir le rôle actif de l'utilisateur
 */
export function useActiveRole(): Role {
  return useRoleStore((state) => state.activeRole);
}

/**
 * Hook pour vérifier si l'utilisateur est propriétaire
 */
export function useIsProprietaire(): boolean {
  return useRoleStore((state) => state.estProprietaire);
}
