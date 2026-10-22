import { apiClient } from '../../../shared/api/api-client';
import { ReservationDetail } from '../types/reservation-detail.types';

export async function getReservationDetail(id: string): Promise<ReservationDetail> {
  const res = await apiClient.get(`/reservations/${id}`);
  return res.data?.data || res.data;
}

export async function updateReservationStatus(
  id: string,
  action: 'CONFIRM' | 'REFUSE' | 'NOSHOW' | 'CANCEL' | 'REOPEN_LATE_CHECKIN' | 'COMPLETE' | string,
  payload?: any
): Promise<any> {
  if (action === 'CONFIRM') {
    const heureDebut = payload?.heureDebut || payload?.checkinHeure || '14:00';
    const heureFin = payload?.heureFin || payload?.checkoutHeure || '12:00';
    const res = await apiClient.patch(`/reservations/${id}/confirm`, {
      heureDebut,
      heureFin,
    });
    return res.data;
  }
  if (action === 'REFUSE') {
    // L'API n'expose pas de /refuse : refuser une demande payée = l'annuler avant confirmation (sans pénalité)
    const res = await apiClient.patch(`/reservations/${id}/cancel`, { raison: payload?.raison || 'Refusée par l’hôte' });
    return res.data;
  }
  if (action === 'NOSHOW') {
    const res = await apiClient.post(`/reservations/${id}/signal-noshow`, payload);
    return res.data;
  }
  if (action === 'REOPEN_LATE_CHECKIN') {
    const res = await apiClient.post(`/reservations/${id}/reopen-late-checkin`);
    return res.data;
  }
  if (action === 'COMPLETE') {
    const res = await apiClient.patch(`/reservations/${id}/checkout/complete`);
    return res.data;
  }
  if (action === 'CANCEL') {
    const res = await apiClient.patch(`/reservations/${id}/cancel`, payload);
    return res.data;
  }
  const res = await apiClient.patch(`/reservations/${id}/status`, { action, ...payload });
  return res.data;
}

interface EtatLieuxUploadParams {
  uploadUrl: string;
  folder: string;
  signature: string;
  timestamp: number;
  apiKey: string;
  transformation?: string;
}

/**
 * Envoie une photo à Cloudinary et renvoie son adresse publique (https).
 * Échoue franchement : une adresse locale (file://…) n'est visible que sur ce téléphone,
 * elle ne doit jamais être enregistrée côté serveur.
 */
function uploadPhotoToCloudinary(params: EtatLieuxUploadParams, uri: string, filename: string): Promise<string> {
  if (uri.startsWith('https://')) return Promise.resolve(uri);
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('file', { uri, name: filename, type: 'image/jpeg' } as any);
    formData.append('folder', params.folder);
    formData.append('signature', params.signature);
    formData.append('timestamp', String(params.timestamp));
    formData.append('api_key', params.apiKey);
    // Signé côté serveur avec la transformation : l'omettre rend la signature invalide
    if (params.transformation) formData.append('transformation', params.transformation);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', params.uploadUrl);
    xhr.timeout = 60_000;
    xhr.onload = () => {
      try {
        const res = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300 && typeof res.secure_url === 'string') return resolve(res.secure_url);
        reject(new Error(res?.error?.message || `Envoi refusé (${xhr.status})`));
      } catch {
        reject(new Error(`Envoi refusé (${xhr.status})`));
      }
    };
    xhr.onerror = () => reject(new Error('Connexion perdue pendant l’envoi de la photo.'));
    xhr.ontimeout = () => reject(new Error('L’envoi de la photo a pris trop de temps.'));
    xhr.send(formData);
  });
}

/** Envoie toutes les photos d'un état des lieux, puis les enregistre sur la réservation. */
async function submitEtatLieux(id: string, kind: 'checkin' | 'checkout', photos: Array<{ uri: string; categorie: string }>) {
  const paramsRes = await apiClient.get(`/reservations/${id}/etat-lieux/upload-params`);
  const params: EtatLieuxUploadParams = paramsRes.data?.data || paramsRes.data;
  if (!params?.uploadUrl) throw new Error('Le service photo est indisponible. Réessayez dans un instant.');

  let urls: string[];
  try {
    urls = await Promise.all(photos.map((p, idx) => uploadPhotoToCloudinary(params, p.uri, `${kind}_${id}_${idx}.jpg`)));
  } catch (err) {
    throw new Error(`Les photos n’ont pas pu être envoyées. ${(err as Error).message} Réessayez.`);
  }

  const res = await apiClient.post(`/reservations/${id}/${kind}/upload`, { photos: urls });
  // La confirmation peut déjà avoir été faite par l'enregistrement des photos
  await apiClient.post(`/reservations/${id}/${kind}-proprio`).catch(() => {});
  return res.data;
}

export function submitCheckinProprio(id: string, photos: Array<{ uri: string; categorie: string }>): Promise<any> {
  return submitEtatLieux(id, 'checkin', photos);
}

export function submitCheckoutProprio(id: string, photos: Array<{ uri: string; categorie: string }>): Promise<any> {
  return submitEtatLieux(id, 'checkout', photos);
}

export async function submitDispute(
  id: string,
  motif: string,
  description: string
): Promise<any> {
  const res = await apiClient.post(`/disputes`, {
    reservationId: id,
    motif,
    description,
  });
  return res.data;
}

export async function submitRating(
  id: string,
  note: number,
  commentaire: string
): Promise<any> {
  const res = await apiClient.post(`/reservations/${id}/rate-tenant`, {
    note,
    commentaire,
  });
  return res.data;
}
