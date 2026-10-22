import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../shared/api/api-client';
import type { OwnerOverviewResponse } from '../../owner-home/types';

/** Toutes les clés de l'espace gestionnaire : jamais partagées avec l'espace hôte (données différentes). */
export const managerKeys = {
  all: ['manager'] as const,
  listings: ['manager', 'listings'] as const,
  reservations: ['manager', 'reservations'] as const,
  leads: ['manager', 'leads'] as const,
  overview: ['manager', 'overview'] as const,
  owners: ['manager', 'owners'] as const,
};

const unwrap = <T,>(data: any): T => (data?.data ?? data) as T;

export interface ManagedListing {
  id: string;
  titre: string;
  ville?: string | null;
  quartier?: string | null;
  statut: string;
  prixBase?: number | string;
  derniereMinuteActive?: boolean;
  note?: number | string;
  totalAvis?: number;
  rejectionReason?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  proprietaireId: string;
  gestionnaireId?: string | null;
  proprietaire?: { id: string; prenom: string; nom: string; telephone?: string | null } | null;
  photos?: Array<{ url: string }>;
}

export interface ManagerReservation {
  id: string;
  statut: string;
  dateDebut: string;
  dateFin: string;
  nbNuits: number;
  nbPersonnes?: number;
  logementId: string;
  proprietaireId: string;
  delaiConfirmation?: string | null;
  typePaiement?: string | null;
  montantSoldeRestant?: number | string | null;
  totalLocataire?: number | string | null;
  netProprietaire?: number | string | null;
  montantCommission?: number | string | null;
  creeLe?: string;
  checkinProprioLe?: string | null;
  checkinLocataireLe?: string | null;
  checkoutProprioLe?: string | null;
  locataire?: { prenom?: string | null; nom?: string | null; telephone?: string | null; avatarUrl?: string | null } | null;
  logement?: { id?: string; titre?: string | null; quartier?: string | null; photos?: Array<{ url: string }> } | null;
}

export interface ManagedLead {
  id: string;
  prenom: string;
  nom: string;
  telephone: string;
  ville?: string | null;
  typeBien?: string | null;
  nombreLogements?: number;
  statut: 'NOUVEAU' | 'CONTACTE' | 'CONVERTI' | 'ARCHIVE';
  creeLe: string;
}

export function useManagedListings() {
  return useQuery({
    queryKey: managerKeys.listings,
    queryFn: async () => unwrap<ManagedListing[]>((await apiClient.get('/gestionnaire/logements')).data) ?? [],
    staleTime: 5 * 60_000,
  });
}

export function useManagerReservations() {
  return useQuery({
    queryKey: managerKeys.reservations,
    queryFn: async () => unwrap<ManagerReservation[]>((await apiClient.get('/reservations/me')).data) ?? [],
    staleTime: 30_000,
  });
}

/** Occupation réelle sur 30 jours (même calcul que l'espace hôte, sur le parc géré). */
export function useManagerOverview() {
  return useQuery({
    queryKey: managerKeys.overview,
    queryFn: async () => unwrap<OwnerOverviewResponse>((await apiClient.get('/dashboard/owner/overview')).data),
    staleTime: 5 * 60_000,
  });
}

export function useManagerLeads() {
  return useQuery({
    queryKey: managerKeys.leads,
    queryFn: async () =>
      unwrap<ManagedLead[]>((await apiClient.get('/gestionnaire/demandes-managed', { params: { statut: 'NOUVEAU' } })).data) ?? [],
    staleTime: 60_000,
  });
}

export interface ManagedOwnerWallet {
  id: string;
  prenom: string;
  nom: string;
  telephone?: string | null;
  soldeDisponible: number;
  logementsCount: number;
}

/** Propriétaires gérés et leur solde (wallet). */
export function useManagedOwners() {
  return useQuery({
    queryKey: managerKeys.owners,
    queryFn: async () => unwrap<ManagedOwnerWallet[]>((await apiClient.get('/gestionnaire/proprietaires')).data) ?? [],
    staleTime: 60_000,
  });
}
