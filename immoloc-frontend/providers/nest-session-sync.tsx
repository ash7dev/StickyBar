'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { authApi } from '@/lib/nestjs';
import { useRoleStore, getPersistedActiveRole } from '@/stores/role.store';

export function NestSessionSync() {
  const supabase = createClient();
  const { setSession, clearSession, setNeedsOnboarding, activeRole, setRole } = useRoleStore();
  const pathname = usePathname();

  useEffect(() => {
    if (pathname?.startsWith('/dashboard') && activeRole !== 'PROPRIETAIRE') {
      setRole('PROPRIETAIRE');
    }
  }, [pathname, activeRole, setRole]);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        // Éviter de synchroniser avec un token Supabase expiré ou sur le point de l'être
        const isExpired = session.expires_at && (session.expires_at * 1000 < Date.now() + 5000);
        if (isExpired) return;

        // Si on a déjà un token NestJS et que c'est un simple event INITIAL_SESSION ou SIGNED_IN sans changement majeur,
        // on pourrait éviter le refetch, mais pour la solidité au refresh (F5), on fetch /auth/me.
        try {
          // Utiliser le rôle persisté si disponible, sinon laisser le backend décider
          const persistedRole = getPersistedActiveRole();
          const result = await authApi.meSupabase(session.access_token, persistedRole);

          if ('onboardingRequired' in result) {
            setNeedsOnboarding(true);
            return;
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
        } catch (error: any) {
          // Si c'est une 401, c'est que le token Supabase a été rejeté par le backend
          // (souvent pendant INITIAL_SESSION si le token est périmé).
          // On ignore l'erreur silencieusement, Supabase finira par rafraîchir le token.
          if (error?.status !== 401) {
            console.error('[NestSessionSync] Error syncing session:', error);
          }
          // Ne pas clearSession immédiatement ici pour éviter les boucles
        }
      } else if (event === 'SIGNED_OUT') {
        clearSession();
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase, setSession, clearSession]);

  return null;
}
