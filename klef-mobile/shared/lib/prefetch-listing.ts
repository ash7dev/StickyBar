import { Image } from 'expo-image';
import { apiClient } from '../api/api-client';
import { useListingCacheStore } from '../stores/listing-cache.store';

const inflight = new Map<string, Promise<any>>();

/**
 * Fiche complète d'un logement (annonce + calendrier), mise en cache.
 * Une seule requête par logement à la fois : l'écran réutilise celle lancée par la préparation.
 */
export function loadListingDetail(id: string): Promise<any> {
  const running = inflight.get(id);
  if (running) return running;
  const request = (async () => {
    const [resListing, resCal] = await Promise.all([
      apiClient.get<any>(`/listings/${id}`),
      apiClient.get<any>(`/calendrier/${id}`).catch(() => null),
    ]);
    const payload = resListing.data?.data ? resListing.data.data : resListing.data;
    const calData = resCal?.data?.data ? resCal.data.data : resCal?.data;
    if (payload && calData) {
      const calIndispos = Array.isArray(calData.indisponibilites) ? calData.indisponibilites : [];
      const calResas = Array.isArray(calData.reservations) ? calData.reservations : [];
      payload.indisponibilites = [...(Array.isArray(payload.indisponibilites) ? payload.indisponibilites : []), ...calIndispos];
      payload.reservations = [...(Array.isArray(payload.reservations) ? payload.reservations : []), ...calResas];
    }
    if (payload) useListingCacheStore.getState().setDetail(id, payload, false);
    return payload;
  })().finally(() => inflight.delete(id));
  inflight.set(id, request);
  return request;
}

const photoUrls = (photos: unknown): string[] =>
  (Array.isArray(photos) ? photos : [])
    .map((p: any) => (typeof p === 'string' ? p : p?.url || p?.uri || ''))
    .filter(Boolean);

/**
 * Le doigt se pose sur une carte : la fiche s'affiche tout de suite avec ce que la carte connaît,
 * le reste (avis, hôte, calendrier) et les premières photos se chargent avant même l'ouverture.
 */
export function prefetchListing(listing?: { id: string; photos?: unknown } | null) {
  if (!listing?.id) return;
  const store = useListingCacheStore.getState();
  const cached = store.getDetail(listing.id);
  if (cached && !cached.isPartial) return;
  if (!cached) store.prefillFromFeed([{ id: 'card', listings: [listing] }]);
  photoUrls(listing.photos).slice(0, 2).forEach((u) => Image.prefetch(u).catch(() => {}));
  loadListingDetail(listing.id)
    .then((d) => photoUrls(d?.photos).slice(0, 4).forEach((u) => Image.prefetch(u).catch(() => {})))
    .catch(() => {});
}
