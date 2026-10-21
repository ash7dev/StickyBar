'use client';

import { useQuery } from '@tanstack/react-query';
import { nestFetch, NEST_API } from '@/lib/nestjs';

/** Demande payée en attente de la décision du propriétaire (statut PAID). */
export interface PendingDecision {
  id: string;
  logementId: string;
  dateDebut: string;
  dateFin: string;
  nbNuits: number;
  nbPersonnes: number;
  netProprietaire: string | number;
  delaiConfirmation: string;
  locataire: { prenom: string; nom: string; avatarUrl: string | null; statutKyc?: string } | null;
  logement: { id: string; titre: string; ville: string } | null;
}

/** Toutes les demandes à décider, quelle que soit leur date d'arrivée — la plus urgente d'abord. */
export function usePendingDecisions() {
  return useQuery({
    queryKey: ['dashboard', 'owner', 'pending-decisions'],
    queryFn: async () => {
      const list = await nestFetch<PendingDecision[]>(NEST_API.RESERVATIONS.MINE('PAID'));
      return [...list].sort((a, b) => a.delaiConfirmation.localeCompare(b.delaiConfirmation));
    },
    staleTime: 30_000,
  });
}
