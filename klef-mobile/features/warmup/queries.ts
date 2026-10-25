import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '../../shared/api/api-client';

/**
 * Requêtes des onglets les plus visités, partagées entre l'écran et la préparation en fond :
 * même clé, même chargement, donc l'onglet s'ouvre déjà rempli.
 */

export const TENANT_TRIPS_CACHE_KEY = 'klef_tenant_reservations_cache_v1';
export const OWNER_LISTINGS_CACHE_KEY = 'klef_owner_listings_cache_v1';
export const OWNER_RESERVATIONS_CACHE_KEY = 'klef_owner_reservations_cache_v1';

export const tenantTripsKey = ['tenant', 'reservations'] as const;
export async function fetchTenantTrips<T = unknown>(): Promise<T[]> {
  const res = await apiClient.get('/reservations/me');
  const d = res.data?.data ?? res.data?.items ?? res.data;
  const list = Array.isArray(d) ? (d as T[]) : [];
  AsyncStorage.setItem(TENANT_TRIPS_CACHE_KEY, JSON.stringify(list)).catch(() => {});
  return list;
}

export const ownerListingsKey = ['listings', 'mine'] as const;
export async function fetchOwnerListings<T = unknown>(): Promise<T[]> {
  const response = await apiClient.get<T[]>('/listings/me');
  const list = Array.isArray(response.data) ? response.data : [];
  if (list.length > 0) AsyncStorage.setItem(OWNER_LISTINGS_CACHE_KEY, JSON.stringify(list)).catch(() => {});
  return list;
}

export const ownerReservationsKey = ['reservations', 'mine'] as const;
export async function fetchOwnerReservations<T = unknown>(): Promise<T[]> {
  let res: any = null;
  try {
    res = await apiClient.get<any[]>('/reservations/me');
  } catch {
    res = await apiClient.get<any[]>('/reservations/owner');
  }
  const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : res?.reservations ?? [];
  if (list.length > 0) AsyncStorage.setItem(OWNER_RESERVATIONS_CACHE_KEY, JSON.stringify(list)).catch(() => {});
  return list;
}
