'use client';

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

/**
 * Configuration optimisée de React Query
 * Documentation: https://tanstack.com/query/latest/docs/framework/react/guides/important-defaults
 */
function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Temps pendant lequel les données sont considérées comme fraîches
        // 5 minutes pour les données qui changent peu
        staleTime: 5 * 60 * 1000,

        // Durée de conservation en cache (garbage collection)
        // 10 minutes pour libérer la mémoire
        gcTime: 10 * 60 * 1000,

        // Tentatives de retry en cas d'échec
        retry: (failureCount, error: any) => {
          // Ne pas retry les erreurs 4xx (erreurs client)
          if (error?.status >= 400 && error?.status < 500) {
            return false;
          }
          // Retry max 2 fois pour les erreurs 5xx
          return failureCount < 2;
        },

        // Délai entre les retries (backoff exponentiel)
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

        // Refetch automatique quand la fenêtre reprend le focus
        refetchOnWindowFocus: false,

        // Refetch automatique lors de la reconnexion
        refetchOnReconnect: true,

        // Refetch automatique lors du mount
        refetchOnMount: true,
      },

      mutations: {
        // Retry pour les mutations (désactivé par défaut)
        retry: false,

        // Callback global en cas d'erreur de mutation
        onError: (error: any) => {
          console.error('[React Query] Mutation error:', error);
        },
      },
    },
  });
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  // Créer le client une seule fois
  const [queryClient] = useState(() => createQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* DevTools uniquement en développement */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} position="bottom" />
      )}
    </QueryClientProvider>
  );
}
