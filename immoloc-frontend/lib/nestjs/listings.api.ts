// ── Service Listings ──────────────────────────────────────────────────────────
// Toutes les fonctions d'appel API liées aux annonces immobilières.
// Pas de logique React ici — uniquement des appels réseau typés.

import { nestFetch } from './api-client';
import { NEST_API } from './endpoints';
import type {
  Listing,
  Equipement,
  ListingPhoto,
  PhotoUploadParams,
  CreateListingPayload,
  UpdateListingPayload,
  SearchListingsParams,
  SearchListingsResponse,
  FeedResponse,
  AddPhotoPayload,
  SetEquipementsPayload,
  SetTarifsPersonnesPayload,
  SetTarifsNuitsPayload,
  PricePreviewResponse,
} from './types';

export const listingsApi = {
  // ── CRUD ──────────────────────────────────────────────────────────────────

  /** Créer une nouvelle annonce (draft) */
  create: (payload: CreateListingPayload) =>
    nestFetch<Listing>(NEST_API.LISTINGS.CREATE, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  /** Récupérer les annonces de l'utilisateur connecté */
  listMine: () =>
    nestFetch<Listing[]>(NEST_API.LISTINGS.LIST_MINE),

  /** Feed home — toutes les sections en un seul appel (cache 5 min côté backend) */
  feed: () =>
    nestFetch<FeedResponse>(NEST_API.LISTINGS.FEED, { skipAutoToken: true }),

  /** Rechercher des annonces publiques avec filtres */
  search: (params: SearchListingsParams = {}) => {
    const query = new URLSearchParams(
      Object.entries(params)
        .filter(([, v]) => v !== undefined && v !== null)
        .map(([k, v]) => [k, String(v)]),
    ).toString();
    const url = query
      ? `${NEST_API.LISTINGS.SEARCH}?${query}`
      : NEST_API.LISTINGS.SEARCH;
    return nestFetch<SearchListingsResponse>(url, { skipAutoToken: true });
  },

  /** Récupérer une annonce par son ID */
  findOne: (id: string) =>
    nestFetch<Listing>(NEST_API.LISTINGS.FIND_ONE(id), { skipAutoToken: true }),

  /** Mettre à jour les informations d'une annonce */
  update: (id: string, payload: UpdateListingPayload) =>
    nestFetch<Listing>(NEST_API.LISTINGS.UPDATE(id), {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  /** Soumettre l'annonce pour validation */
  submit: (id: string) =>
    nestFetch<Listing>(NEST_API.LISTINGS.SUBMIT(id), { method: 'PATCH' }),

  /** Mettre en pause une annonce active */
  pause: (id: string) =>
    nestFetch<Listing>(NEST_API.LISTINGS.PAUSE(id), { method: 'PATCH' }),

  /** Archiver (supprimer logiquement) une annonce */
  archive: (id: string) =>
    nestFetch<void>(NEST_API.LISTINGS.ARCHIVE(id), { method: 'DELETE' }),

  // ── Photos ─────────────────────────────────────────────────────────────────

  /** Obtenir les paramètres signés pour l'upload Cloudinary */
  getPhotoUploadParams: (id: string) =>
    nestFetch<PhotoUploadParams>(NEST_API.LISTINGS.PHOTO_UPLOAD_PARAMS(id)),

  /** Enregistrer une photo uploadée sur Cloudinary */
  addPhoto: (id: string, payload: AddPhotoPayload) =>
    nestFetch<ListingPhoto>(NEST_API.LISTINGS.ADD_PHOTO(id), {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  /** Supprimer une photo d'une annonce */
  removePhoto: (id: string, photoId: string) =>
    nestFetch<void>(NEST_API.LISTINGS.REMOVE_PHOTO(id, photoId), {
      method: 'DELETE',
    }),

  // ── Équipements ────────────────────────────────────────────────────────────

  /** Récupérer la liste complète des équipements disponibles */
  listEquipements: () =>
    nestFetch<Equipement[]>(NEST_API.LISTINGS.LIST_EQUIPEMENTS, {
      skipAutoToken: true,
    }),

  /** Définir les équipements d'une annonce */
  setEquipements: (id: string, payload: SetEquipementsPayload) =>
    nestFetch<Listing>(NEST_API.LISTINGS.SET_EQUIPEMENTS(id), {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  // ── Tarifs ─────────────────────────────────────────────────────────────────

  /** Définir les suppléments selon le nombre de personnes */
  setTarifsPersonnes: (id: string, payload: SetTarifsPersonnesPayload) =>
    nestFetch<Listing>(NEST_API.LISTINGS.SET_TARIFS_PERSONNES(id), {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  /** Définir les tarifs dégressifs selon le nombre de nuits */
  setTarifsNuits: (id: string, payload: SetTarifsNuitsPayload) =>
    nestFetch<Listing>(NEST_API.LISTINGS.SET_TARIFS_NUITS(id), {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  /** Simuler le prix total pour des critères donnés */
  getPricePreview: (id: string, params: { dateDebut: string; dateFin: string; nbPersonnes: number }) => {
    const query = new URLSearchParams(
      Object.entries(params).map(([k, v]) => [k, String(v)]),
    ).toString();
    return nestFetch<PricePreviewResponse>(
      `${NEST_API.LISTINGS.PRICE_PREVIEW(id)}?${query}`,
    );
  },
};
