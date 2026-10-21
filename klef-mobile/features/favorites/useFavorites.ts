import { useCallback } from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../shared/api/api-client';
import { useAuthStore } from '../auth/stores/auth.store';

// Clés par utilisateur : le cache React Query survit à la déconnexion
const idsKey = (userId?: string) => ['favorites', 'ids', userId ?? 'anon'] as const;
const listKey = (userId?: string) => ['favorites', 'list', userId ?? 'anon'] as const;

export interface FavoriteItem {
  logementId: string;
  creeLe: string;
  logement: {
    id: string;
    titre: string;
    ville: string;
    quartier?: string | null;
    type: string;
    prixBase: number | string;
    capaciteMax: number;
    nombreChambres: number;
    nombreSallesBain?: number | null;
    note?: number | string | null;
    totalAvis?: number | null;
    videoUrl?: string | null;
    derniereMinuteActive: boolean;
    statut: string;
    photos: Array<{ url: string }>;
  };
}

const unwrap = <T,>(res: { data?: unknown }): T => ((res.data as { data?: T })?.data ?? res.data) as T;

/** Identifiants des logements gardés, partagés par tous les cœurs de l'app. */
export function useFavoriteIds() {
  const token = useAuthStore((s) => s.token);
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery<string[]>({
    queryKey: idsKey(userId),
    queryFn: async () => unwrap<string[]>(await apiClient.get('/favorites/ids')) ?? [],
    enabled: !!token,
    staleTime: 5 * 60_000,
  });
}

export function useFavoritesList() {
  const token = useAuthStore((s) => s.token);
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery<FavoriteItem[]>({
    queryKey: listKey(userId),
    queryFn: async () => unwrap<FavoriteItem[]>(await apiClient.get('/favorites')) ?? [],
    enabled: !!token,
  });
}

/**
 * [gardé ?, basculer] pour un logement. Le cœur change tout de suite ;
 * en cas d'échec réseau il revient à son état et on prévient.
 */
export function useFavorite(listingId?: string | null): [boolean, () => void] {
  const qc = useQueryClient();
  const token = useAuthStore((s) => s.token);
  const userId = useAuthStore((s) => s.user?.id);
  const { data } = useFavoriteIds();
  const isFavorite = !!listingId && !!data?.includes(listingId);

  const toggle = useCallback(() => {
    if (!listingId) return;
    if (!token) {
      Alert.alert('Gardez vos coups de cœur', 'Connectez-vous pour retrouver vos logements gardés sur tous vos appareils.', [
        { text: 'Plus tard', style: 'cancel' },
        { text: 'Se connecter', onPress: () => router.push(`/(auth)/login?next=${encodeURIComponent(`/listing/${listingId}`)}` as never) },
      ]);
      return;
    }
    const key = idsKey(userId);
    const prev = qc.getQueryData<string[]>(key) ?? [];
    const next = prev.includes(listingId) ? prev.filter((id) => id !== listingId) : [listingId, ...prev];
    const adding = next.length > prev.length;
    qc.setQueryData(key, next);
    Haptics.impactAsync(adding ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light).catch(() => {});

    (adding ? apiClient.put(`/favorites/${listingId}`) : apiClient.delete(`/favorites/${listingId}`))
      .then(() => qc.invalidateQueries({ queryKey: listKey(userId) }))
      .catch(() => {
        qc.setQueryData(key, prev);
        Alert.alert('Oups', 'Impossible de mettre à jour vos gardés. Vérifiez votre connexion.');
      });
  }, [listingId, token, userId, qc]);

  return [isFavorite, toggle];
}
