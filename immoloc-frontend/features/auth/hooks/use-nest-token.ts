'use client';

import { useCallback } from 'react';
import { useRoleStore } from '@/stores/role.store';
import { nestFetch } from '@/lib/nestjs/api-client';
import { NEST_API } from '@/lib/nestjs/endpoints';
import { createClient } from '@/lib/supabase/client';
import type { StatutKyc } from '@/lib/nestjs/types';
import { authApi } from '@/lib/nestjs';

export function useNestToken() {
  const supabase = createClient();
  const { nestToken, refreshToken, tokenExpiresAt, setSession, clearSession, setNeedsOnboarding, activeRole, estProprietaire, userId, hasAnnonce, profileCompleted, phoneVerified, statutKyc } = useRoleStore();

  const isExpired = () => {
    if (!tokenExpiresAt) return true;
    // On prend une marge de 30 secondes pour éviter les erreurs de latence
    return Date.now() > tokenExpiresAt - 30000;
  };

  const refreshIfNeeded = useCallback(async () => {
    if (!refreshToken) return null;

    if (isExpired()) {
      try {
        const result = await nestFetch<{
          accessToken: string;
          refreshToken: string;
          expiresIn: number;
        }>(NEST_API.AUTH.REFRESH, {
          method: 'POST',
          body: JSON.stringify({ refreshToken }),
        });

        // Préserver tous les champs du store pendant le refresh
        const currentStore = useRoleStore.getState();
        setSession({
          token: result.accessToken,
          refreshToken: result.refreshToken,
          expiresIn: result.expiresIn,
          role: activeRole,
          estProprietaire,
          userId: userId!,
          hasAnnonce,
          profileCompleted,
          phoneVerified,
          statutKyc,
          dateNaissance: currentStore.dateNaissance,
          selfieFaceDetected: currentStore.selfieFaceDetected,
          selfieMatchScore: currentStore.selfieMatchScore,
        });

        return result.accessToken;
      } catch (error) {
        console.error('[useNestToken] Refresh failed:', error);
        clearSession();
        return null;
      }
    }

    return nestToken;
  }, [
    refreshToken,
    tokenExpiresAt,
    nestToken,
    setSession,
    clearSession,
    activeRole,
    estProprietaire,
    userId,
    hasAnnonce,
    profileCompleted,
    phoneVerified,
    statutKyc,
  ]);

  const syncFromSupabaseSession = useCallback(async () => {
    try {
      const { data, error } = await supabase.auth.getSession();
      const session = data.session;

      if (error || !session?.access_token) {
        return null;
      }

      const result = await authApi.meSupabase(session.access_token);

      if ('onboardingRequired' in result) {
        setNeedsOnboarding(true);
        return null;
      }

      setSession({
        token: result.accessToken,
        refreshToken: result.refreshToken,
        expiresIn: result.expiresIn,
        role: result.user.activeRole,
        estProprietaire: result.user.estProprietaire,
        userId: result.user.id,
        hasAnnonce: result.user.hasAnnonce,
        profileCompleted: result.user.profileCompleted,
        phoneVerified: result.user.phoneVerified,
        statutKyc: result.user.statutKyc,
        dateNaissance: result.user.dateNaissance,
        selfieFaceDetected: result.user.selfieFaceDetected,
        selfieMatchScore: result.user.selfieMatchScore,
      });

      return result.accessToken;
    } catch (error) {
      console.error('[useNestToken] Silent Supabase sync failed:', error);
      return null;
    }
  }, [supabase, setSession, setNeedsOnboarding]);

  return {
    token: nestToken,
    isExpired: isExpired(),
    refreshIfNeeded,
    syncFromSupabaseSession,
  };
}
