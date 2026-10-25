import AsyncStorage from '@react-native-async-storage/async-storage';
import { QueryClient, type Query } from '@tanstack/react-query';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';

const DAY = 24 * 60 * 60 * 1000;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5, // 5 minutes
      // Gardé au moins aussi longtemps que la copie sur le téléphone, sinon elle serait vidée à la sauvegarde
      gcTime: DAY,
    },
  },
});

/** Dernier état des écrans, sauvegardé sur le téléphone : l'app s'ouvre remplie, même sans réseau. */
export const queryPersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'paixi_query_cache_v1',
  throttleTime: 2000,
});

// Jamais resservis depuis le téléphone : un prix ou un montant à payer doit toujours venir du serveur
const NOT_PERSISTED = new Set(['price-preview', 'listing-checkout', 'kyc']);

export const persistOptions = {
  persister: queryPersister,
  maxAge: DAY,
  // À changer quand la forme des réponses change : l'ancienne copie est alors ignorée
  buster: 'paixi-1',
  dehydrateOptions: {
    shouldDehydrateQuery: (q: Query) => q.state.status === 'success' && !NOT_PERSISTED.has(String(q.queryKey[0])),
  },
};

/** À la déconnexion : rien du compte précédent ne doit rester en mémoire ni sur le téléphone. */
export async function resetQueryCache() {
  queryClient.clear();
  await queryPersister.removeClient();
}
