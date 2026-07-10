/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Hook pour les mises à jour optimistes avec React Query
 * Améliore l'UX en mettant à jour l'UI immédiatement avant la réponse serveur
 */

import { useQueryClient, useMutation, type UseMutationOptions } from '@tanstack/react-query';

interface OptimisticUpdateOptions<TData, TVariables> extends UseMutationOptions<TData, Error, TVariables> {
  /**
   * Clés des queries à invalider après succès
   */
  invalidateKeys?: string[][];

  /**
   * Fonction pour mettre à jour le cache de manière optimiste
   */
  optimisticUpdate?: (queryClient: any, variables: TVariables) => void;

  /**
   * Fonction pour rollback en cas d'erreur
   */
  rollback?: (queryClient: any, context: any) => void;
}

/**
 * Hook pour les mutations avec mise à jour optimiste
 */
export function useOptimisticMutation<TData = unknown, TVariables = void>(
  options: OptimisticUpdateOptions<TData, TVariables>
) {
  const queryClient = useQueryClient();

  return useMutation<TData, Error, TVariables>({
    ...options,

    onMutate: async (variables) => {
      // Annuler les refetch en cours pour éviter les conflits
      if (options.invalidateKeys) {
        await Promise.all(
          options.invalidateKeys.map((key) => queryClient.cancelQueries({ queryKey: key }))
        );
      }

      // Sauvegarder l'état actuel pour rollback
      const previousData = options.invalidateKeys?.reduce((acc, key) => {
        acc[key.join('/')] = queryClient.getQueryData(key);
        return acc;
      }, {} as Record<string, unknown>);

      // Mise à jour optimiste du cache
      if (options.optimisticUpdate) {
        options.optimisticUpdate(queryClient, variables);
      }

      // Appeler le onMutate custom si fourni
      const customContext = options.onMutate ? await (options.onMutate as any)(variables) : undefined;

      return { previousData, ...customContext };
    },

    onError: (error, variables, context: any) => {
      // Rollback en cas d'erreur
      if (context?.previousData && options.invalidateKeys) {
        options.invalidateKeys.forEach((key) => {
          const keyStr = key.join('/');
          if (context.previousData[keyStr] !== undefined) {
            queryClient.setQueryData(key, context.previousData[keyStr]);
          }
        });
      }

      // Rollback custom si fourni
      if (options.rollback) {
        options.rollback(queryClient, context);
      }

      // Appeler le onError custom si fourni
      if (options.onError) {
        (options.onError as any)(error, variables, context);
      }
    },

    onSuccess: (data, variables, context) => {
      // Invalider les queries pour refetch les données du serveur
      if (options.invalidateKeys) {
        options.invalidateKeys.forEach((key) => {
          queryClient.invalidateQueries({ queryKey: key });
        });
      }

      // Appeler le onSuccess custom si fourni
      if (options.onSuccess) {
        (options.onSuccess as any)(data, variables, context);
      }
    },

    onSettled: (data, error, variables, context: any) => {
      // Appeler le onSettled custom si fourni
      if (options.onSettled) {
        (options.onSettled as any)(data, error, variables, context);
      }
    },
  });
}

/**
 * Helper pour créer une fonction d'update optimiste pour une liste
 */
export function createListOptimisticUpdate<TItem extends { id: string }>(queryKey: string[]) {
  return {
    add: (queryClient: any, newItem: TItem) => {
      queryClient.setQueryData(queryKey, (old: TItem[] = []) => [...old, newItem]);
    },

    remove: (queryClient: any, itemId: string) => {
      queryClient.setQueryData(queryKey, (old: TItem[] = []) =>
        old.filter((item) => item.id !== itemId)
      );
    },

    update: (queryClient: any, itemId: string, updates: Partial<TItem>) => {
      queryClient.setQueryData(queryKey, (old: TItem[] = []) =>
        old.map((item) => (item.id === itemId ? { ...item, ...updates } : item))
      );
    },
  };
}
