import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useRoleStore } from '@/stores/role.store';
import { nestFetch, NEST_API } from '@/lib/nestjs';

interface User {
  email?: string;
  prenom?: string;
  nom?: string;
}

/**
 * Hook optimisé pour récupérer les données de l'utilisateur connecté.
 * Utilise React Query pour le caching et évite les requêtes multiples.
 *
 * Stratégie :
 * 1. Essaie d'abord l'API NestJS si nestToken existe
 * 2. Fallback sur Supabase user_metadata
 * 3. Cache pendant 5 minutes (staleTime)
 */
export function useCurrentUser() {
  const nestToken = useRoleStore((s) => s.nestToken);
  const supabase = createClient();

  return useQuery<User>({
    queryKey: ['user', 'current', nestToken],
    queryFn: async () => {
      try {
        // Essayer l'API NestJS d'abord
        if (nestToken) {
          const apiUser = await nestFetch<User>(NEST_API.USERS.ME);
          return apiUser;
        }
      } catch (e) {
        console.error('Erreur API users/me:', e);
      }

      // Fallback Supabase
      const { data } = await supabase.auth.getUser();
      return {
        email: data.user?.email,
        prenom: data.user?.user_metadata?.prenom,
        nom: data.user?.user_metadata?.nom,
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - données rarement changeantes
    gcTime: 10 * 60 * 1000, // 10 minutes en cache
    refetchOnWindowFocus: false, // Pas de refetch au retour sur la page
    refetchOnMount: false, // Utilise le cache si disponible
  });
}
