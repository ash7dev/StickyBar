'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useRoleStore } from '@/stores/role.store';
import { nestFetch } from '@/lib/nestjs/api-client';
import { NEST_API } from '@/lib/nestjs/endpoints';
import { useToastError } from '@/lib/hooks/use-toast-error';

const NEW_LISTING = '/dashboard/annonces/nouvelle';

/**
 * « Publier mon logement » depuis la page propriétaires :
 * visiteur → connexion puis retour ici ; déjà hôte → création d'annonce ;
 * sinon on active l'espace propriétaire puis on ouvre la création d'annonce.
 */
export function useBecomeHost() {
  const router = useRouter();
  const setSession = useRoleStore((s) => s.setSession);
  const { showError, showSuccess } = useToastError();
  const [loading, setLoading] = useState(false);

  const start = useCallback(async () => {
    const { nestToken, estProprietaire } = useRoleStore.getState();
    if (!nestToken) {
      router.push(`/login?next=${encodeURIComponent('/proprietaires')}`);
      return;
    }
    if (estProprietaire) {
      router.push(NEW_LISTING);
      return;
    }

    setLoading(true);
    try {
      const result = await nestFetch<{
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
        user: { id: string; activeRole: 'PROPRIETAIRE'; estProprietaire: boolean; hasAnnonce: boolean };
      }>(NEST_API.AUTH.BECOME_HOST, {
        method: 'POST',
        body: JSON.stringify({ typeHote: 'PARTICULIER' }),
      });

      setSession({
        token: result.accessToken,
        refreshToken: result.refreshToken,
        expiresIn: result.expiresIn,
        role: 'PROPRIETAIRE',
        estProprietaire: true,
        userId: result.user.id,
        hasAnnonce: result.user.hasAnnonce,
      });

      showSuccess('Espace propriétaire activé', 'Ajoutez maintenant votre premier logement.');
      router.push(NEW_LISTING);
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      if (/401|403|non authentifi|unauthorized/i.test(message)) {
        router.push(`/login?next=${encodeURIComponent('/proprietaires')}`);
        return;
      }
      showError(error);
      setLoading(false);
    }
  }, [router, setSession, showError, showSuccess]);

  return { start, loading };
}
