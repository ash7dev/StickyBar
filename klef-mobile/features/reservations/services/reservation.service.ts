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
    const res = await apiClient.patch(`/reservations/${id}/refuse`, payload);
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

async function uploadPhotoToCloudinary(uploadParams: any, uri: string, filename: string): Promise<string> {
  if (!uri || uri.startsWith('http://') || uri.startsWith('https://')) {
    return uri;
  }
  return new Promise((resolve) => {
    const formData = new FormData();
    formData.append('file', {
      uri,
      name: filename,
      type: 'image/jpeg',
    } as any);
    formData.append('folder', uploadParams.folder);
    formData.append('signature', uploadParams.signature);
    formData.append('timestamp', String(uploadParams.timestamp));
    formData.append('api_key', uploadParams.apiKey);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', uploadParams.uploadUrl);
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const res = JSON.parse(xhr.responseText);
          resolve(res.secure_url || uri);
        } catch {
          resolve(uri);
        }
      } else {
        resolve(uri);
      }
    };
    xhr.onerror = () => resolve(uri);
    xhr.ontimeout = () => resolve(uri);
    xhr.timeout = 30000;
    xhr.send(formData);
  });
}

export async function submitCheckinProprio(
  id: string,
  photos: Array<{ uri: string; categorie: string }>
): Promise<any> {
  // 1. Tenter l'upload Cloudinary direct si des photos locales existent
  let photoUrls: string[] = photos.map((p) => p.uri);
  try {
    const paramsRes = await apiClient.get(`/reservations/${id}/etat-lieux/upload-params`);
    const params = paramsRes.data?.data || paramsRes.data;
    if (params && params.uploadUrl) {
      photoUrls = await Promise.all(
        photos.map((p, idx) => uploadPhotoToCloudinary(params, p.uri, `checkin_${id}_${idx}.jpg`))
      );
    }
  } catch {
    // Si les params d'upload ne sont pas dispos, on continue avec les URIs fournies
  }

  // 2. Transmettre le tableau de photos au serveur
  try {
    const resUpload = await apiClient.post(`/reservations/${id}/checkin/upload`, { photos: photoUrls });
    try {
      await apiClient.post(`/reservations/${id}/checkin-proprio`);
    } catch {
      // Confirmation déjà traitée par l'upload
    }
    return resUpload.data;
  } catch {
    const formData = new FormData();
    photos.forEach((p, index) => {
      formData.append('photos', {
        uri: photoUrls[index] || p.uri,
        type: 'image/jpeg',
        name: `checkin_photo_${index}.jpg`,
      } as any);
      formData.append('categories', p.categorie);
    });

    const res = await apiClient.post(`/reservations/${id}/checkin-proprio`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  }
}

export async function submitCheckoutProprio(
  id: string,
  photos: Array<{ uri: string; categorie: string }>
): Promise<any> {
  // 1. Tenter l'upload Cloudinary direct si des photos locales existent
  let photoUrls: string[] = photos.map((p) => p.uri);
  try {
    const paramsRes = await apiClient.get(`/reservations/${id}/etat-lieux/upload-params`);
    const params = paramsRes.data?.data || paramsRes.data;
    if (params && params.uploadUrl) {
      photoUrls = await Promise.all(
        photos.map((p, idx) => uploadPhotoToCloudinary(params, p.uri, `checkout_${id}_${idx}.jpg`))
      );
    }
  } catch {
    // Si les params d'upload ne sont pas dispos, on continue avec les URIs fournies
  }

  // 2. Transmettre le tableau de photos au serveur
  try {
    const resUpload = await apiClient.post(`/reservations/${id}/checkout/upload`, { photos: photoUrls });
    try {
      await apiClient.post(`/reservations/${id}/checkout-proprio`);
    } catch {
      // Confirmation déjà traitée par l'upload
    }
    return resUpload.data;
  } catch {
    const formData = new FormData();
    photos.forEach((p, index) => {
      formData.append('photos', {
        uri: photoUrls[index] || p.uri,
        type: 'image/jpeg',
        name: `checkout_photo_${index}.jpg`,
      } as any);
      formData.append('categories', p.categorie);
    });

    const res = await apiClient.post(`/reservations/${id}/checkout-proprio`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  }
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
