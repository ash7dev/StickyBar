'use client';

import { useEffect, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { authApi } from '@/lib/nestjs';
import { useRoleStore, getPersistedActiveRole, isTokenExpired } from '@/stores/role.store';

/**
 * NestSessionSync - Provider propre pour la synchronisation Supabase ↔ NestJS
 *
 * Architecture propre avec séparation des responsabilités :
 *
 * 1. Écoute les changements d'auth Supabase
 * 2. Synchronise avec le backend NestJS (obtient les tokens JWT)
 * 3. Met à jour le store local
 * 4. Cross-tab sync automatique via BroadcastChannel (géré par TokenManager)
 *
 * Features:
 * - ✅ Auto-switch /dashboard → PROPRIETAIRE
 * - ✅ Gestion d'erreur propre (pas de crash)
 * - ✅ Skip tokens expirés
 * - ✅ Persistance du rôle entre sessions
 * - ✅ Zero spaghetti code
 */
export function NestSessionSync() {
  const supabase = useMemo(() => createClient(), []);
  const { setSession, clearSession, setNeedsOnboarding, activeRole, setRole } = useRoleStore();
  const pathname = usePathname();

  // ── Auto-switch vers PROPRIETAIRE pour /dashboard & ADMIN pour /admin ──────
  useEffect(() => {
    if (pathname?.startsWith('/dashboard') && activeRole !== 'PROPRIETAIRE') {
      setRole('PROPRIETAIRE');
    } else if (pathname?.startsWith('/admin') && activeRole !== 'ADMIN') {
      setRole('ADMIN');
    }
  }, [pathname, activeRole, setRole]);

  // ── Synchronisation Supabase Auth → NestJS ────────────────────────────────
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      // ── Cas 1 : Utilisateur connecté ─────────────────────────────────────
      if (session) {
        // Skip si la session NestJS est déjà valide et non expirée en cache
        const storeState = useRoleStore.getState();
        const hasValidToken = storeState.nestToken && !isTokenExpired(storeState.tokenExpiresAt);

        if (hasValidToken && (event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION')) {
          console.log('[NestSessionSync] ⚡ Token already valid in cache, skipping Supabase overwrite');
          return;
        }

        // Skip si le token Supabase est expiré ou sur le point de l'être
        const isExpired = session.expires_at && session.expires_at * 1000 < Date.now() + 5000;
        if (isExpired) {
          console.warn('[NestSessionSync] Skipping expired Supabase token');
          return;
        }

        try {
          // Récupérer le rôle persisté (localStorage) pour le passer au backend
          const persistedRole = getPersistedActiveRole();

          // Appeler le backend NestJS pour obtenir les tokens JWT
          const result = await authApi.meSupabase(session.access_token, persistedRole);

          // ── Cas 1a : Onboarding requis ─────────────────────────────────
          if ('onboardingRequired' in result) {
            setNeedsOnboarding(true);
            return;
          }

          // ── Cas 1b : Session complète → Mettre à jour le store ─────────
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

          console.log('[NestSessionSync] ✅ Session synced successfully');
        } catch (error: any) {
          // ── Gestion d'erreur propre (pas de spam console) ────────────────
          if (error?.status === 401) {
            console.warn('[NestSessionSync] Token rejected by backend (will retry with fresh token)');
          } else if (error?.status === 404) {
            console.warn('[NestSessionSync] Backend endpoint not found (404) - backend may not be running');
          } else {
            console.error('[NestSessionSync] Failed to sync session:', error);
          }
        }
      }
      // ── Cas 2 : Utilisateur déconnecté ─────────────────────────────────────
      else if (event === 'SIGNED_OUT') {
        const storeState = useRoleStore.getState();
        const hasValidToken = storeState.nestToken && !isTokenExpired(storeState.tokenExpiresAt);
        if (!hasValidToken) {
          clearSession();
          console.log('[NestSessionSync] ✅ Session cleared (signed out)');
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase, setSession, clearSession, setNeedsOnboarding]);

  return null;
}
