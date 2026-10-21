import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../shared/api/api-client';

/** Demande payée en attente de la décision du propriétaire (statut PAID). */
export interface PendingDecision {
  id: string;
  logementId: string;
  dateDebut: string;
  dateFin: string;
  nbNuits: number;
  delaiConfirmation: string;
  locataire: { prenom: string; nom: string } | null;
  logement: { id: string; titre: string } | null;
}

/** Toutes les demandes à décider, quelle que soit leur date d'arrivée — la plus urgente d'abord. */
export function usePendingDecisions() {
  return useQuery({
    queryKey: ['dashboard', 'owner', 'pending-decisions'],
    queryFn: async () => {
      const { data } = await apiClient.get<PendingDecision[]>('/reservations/me', {
        params: { statut: 'PAID' },
      });
      return [...data].sort((a, b) => a.delaiConfirmation.localeCompare(b.delaiConfirmation));
    },
    staleTime: 30_000,
  });
}
