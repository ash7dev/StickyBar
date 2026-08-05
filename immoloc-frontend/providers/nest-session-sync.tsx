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

  // ── Auto-switch vers PROPRIETAIRE pour /dashboard ─────────────────────────
  useEffect(() => {
    if (pathname?.startsWith('/dashboard') && activeRole !== 'PROPRIETAIRE') {
      setRole('PROPRIETAIRE');
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
        // MAIS seulement pour TOKEN_REFRESHED, pas pour INITIAL_SESSION
        // (car INITIAL_SESSION peut venir d'un nouveau callback OAuth)
        const storeState = useRoleStore.getState();
        const hasValidToken = storeState.nestToken && !isTokenExpired(storeState.tokenExpiresAt);

        if (hasValidToken && event === 'TOKEN_REFRESHED') {
          console.log('[NestSessionSync] ⚡ Token refreshed but session already valid in cache');
          return;
        }

        // Pour INITIAL_SESSION, toujours synchroniser pour s'assurer qu'on a la bonne session
        if (event === 'INITIAL_SESSION') {
          console.log('[NestSessionSync] INITIAL_SESSION detected, synchronizing with backend');
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
            // Token Supabase rejeté (normal pendant INITIAL_SESSION si expiré)
            // Supabase va rafraîchir le token automatiquement
            console.warn('[NestSessionSync] Token rejected by backend (will retry with fresh token)');
          } else if (error?.status === 404) {
            // Endpoint non trouvé - backend probablement non démarré ou route manquante
            // Ignorer silencieusement pour ne pas polluer la console en développement
            console.warn('[NestSessionSync] Backend endpoint not found (404) - backend may not be running');
          } else {
            // Autre erreur (réseau, backend down, etc.)
            console.error('[NestSessionSync] Failed to sync session:', error);
          }
          // Ne pas clearSession immédiatement pour éviter les boucles infinies
        }
      }
      // ── Cas 2 : Utilisateur déconnecté ─────────────────────────────────────
      else if (event === 'SIGNED_OUT') {
        clearSession();
        console.log('[NestSessionSync] ✅ Session cleared (signed out)');
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase, setSession, clearSession, setNeedsOnboarding]);

  return null;
}
