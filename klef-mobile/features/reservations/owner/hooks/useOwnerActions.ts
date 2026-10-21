import { useState } from 'react';
import { Alert } from 'react-native';
import * as Haptics from 'expo-haptics';
import { apiClient } from '../../../../shared/api/api-client';
import { submitCheckinProprio, submitCheckoutProprio } from '../../services/reservation.service';

export type OwnerAction =
  | 'accept'
  | 'refuse'
  | 'cancel'
  | 'checkin'
  | 'checkout'
  | 'complete'
  | 'noshow'
  | 'reopen'
  | 'rate'
  | 'dispute'
  | 'fee'
  | 'fee-cash';

/** Motifs de refus d'une demande (envoyés en texte libre à PATCH /cancel). */
export const REFUSE_REASONS = [
  { key: 'dates', label: 'Dates plus disponibles', hint: 'Le logement est déjà occupé' },
  { key: 'maintenance', label: 'Logement en maintenance', hint: 'Travaux ou réparation en cours' },
  { key: 'capacity', label: 'Trop de voyageurs', hint: 'Au-delà de la capacité du logement' },
  { key: 'other', label: 'Autre raison', hint: 'Précisez en un mot' },
] as const;

export const CANCEL_REASONS = [
  { key: 'unavailable', label: 'Logement indisponible' },
  { key: 'problem', label: 'Problème dans le logement' },
  { key: 'emergency', label: 'Urgence personnelle' },
  { key: 'other', label: 'Autre raison' },
] as const;

/** Motifs d'un litige ouvert par l'hôte (enum MotifLitige). */
export const HOST_DISPUTE_MOTIFS = [
  { key: 'DOMMAGES', label: 'Dégâts' },
  { key: 'DEPASSEMENT_PERSONNES', label: 'Voyageurs en plus' },
  { key: 'NON_PAIEMENT', label: 'Supplément impayé' },
  { key: 'AUTRE', label: 'Autre' },
] as const;

/** Types de supplément proposés (titre envoyé à POST /frais). */
export const FEE_TYPES = [
  'Voyageurs en plus',
  'Départ tardif',
  'Électricité / eau',
  'Ménage ou dégâts',
  'Autre',
] as const;

function message(err: unknown, fallback: string): string {
  const raw = (err as { response?: { data?: { message?: unknown } } })?.response?.data?.message;
  if (Array.isArray(raw)) return raw.join(' · ');
  return typeof raw === 'string' && raw ? raw : fallback;
}

/**
 * Toutes les actions de l'hôte sur une réservation.
 * Chaque action renvoie `true` en cas de succès ; l'erreur est déjà affichée.
 */
export function useOwnerActions(reservationId: string, onDone: () => void) {
  const [pending, setPending] = useState<OwnerAction | null>(null);

  async function run(action: OwnerAction, call: () => Promise<unknown>, success: string | null, fallback: string) {
    setPending(action);
    try {
      await call();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      if (success) Alert.alert(success.split('|')[0], success.split('|')[1]);
      onDone();
      return true;
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      Alert.alert('Erreur', message(err, fallback));
      return false;
    } finally {
      setPending(null);
    }
  }

  const base = `/reservations/${reservationId}`;

  return {
    pending,
    accept: (heureDebut: string, heureFin: string) =>
      run('accept', () => apiClient.patch(`${base}/confirm`, { heureDebut, heureFin }), 'Réservation acceptée|Le voyageur reçoit l’adresse et vos horaires.', 'Impossible d’accepter la demande.'),
    // Refuser une demande payée = l'annuler avant confirmation : aucune pénalité côté API
    refuse: (raison: string) =>
      run('refuse', () => apiClient.patch(`${base}/cancel`, { raison }), 'Demande refusée|Le voyageur est remboursé intégralement.', 'Impossible de refuser la demande.'),
    cancel: (raison: string) =>
      run('cancel', () => apiClient.patch(`${base}/cancel`, { raison }), 'Réservation annulée|Le voyageur est remboursé intégralement.', 'Impossible d’annuler la réservation.'),
    submitCheckin: (photos: Array<{ uri: string; categorie: string }>) =>
      run('checkin', () => submitCheckinProprio(reservationId, photos), 'État des lieux envoyé|Le voyageur le valide en arrivant.', 'L’envoi des photos a échoué.'),
    submitCheckout: (photos: Array<{ uri: string; categorie: string }>) =>
      run('checkout', () => submitCheckoutProprio(reservationId, photos), 'État des lieux de sortie enregistré|Vous pouvez clôturer le séjour.', 'L’envoi des photos a échoué.'),
    complete: () =>
      run('complete', () => apiClient.patch(`${base}/checkout/complete`), 'Séjour clôturé|Merci ! Pensez à noter votre voyageur.', 'Impossible de clôturer le séjour.'),
    signalNoshow: (commentaire?: string) =>
      run(
        'noshow',
        () => apiClient.post(`${base}/signal-noshow`, { commentaire: commentaire?.trim() || undefined }),
        'Absence signalée|Le voyageur est prévenu. Sans arrivée de sa part, le séjour est clôturé en no-show.',
        'Impossible de signaler l’absence.',
      ),
    reopen: () =>
      run('reopen', () => apiClient.post(`${base}/reopen-late-checkin`), 'Arrivée rouverte|Le séjour reprend normalement.', 'Impossible de rouvrir l’arrivée.'),
    rateGuest: (note: number, commentaire: string) =>
      run('rate', () => apiClient.post(`${base}/rate-tenant`, { note, commentaire: commentaire.trim() || undefined }), 'Merci !|Votre avis est publié.', 'Impossible de publier votre avis.'),
    openDispute: (motif: string, description: string) =>
      run(
        'dispute',
        () => apiClient.post('/disputes', { reservationId, motif, description: description.trim() }),
        'Litige ouvert|L’équipe Paixi examine le dossier avec vos photos d’état des lieux.',
        'Impossible d’ouvrir le litige.',
      ),
    /** Crée un supplément ; s'il a déjà été encaissé en espèces, le marque payé dans la foulée. */
    createFee: (titre: string, montant: number, description: string, paidCash: boolean) =>
      run(
        'fee',
        async () => {
          const res = await apiClient.post(`${base}/frais`, { titre, montant, description: description.trim() || undefined });
          const id = (res.data?.data ?? res.data)?.id as string | undefined;
          if (paidCash && id) await apiClient.post(`${base}/frais/${id}/payer-liquide`);
        },
        paidCash ? 'Supplément enregistré|Il apparaît comme payé en espèces.' : 'Supplément envoyé|Le voyageur peut le payer ou le contester.',
        'Impossible d’envoyer le supplément.',
      ),
    markFeeCash: (feeId: string) =>
      run('fee-cash', () => apiClient.post(`${base}/frais/${feeId}/payer-liquide`), 'Supplément encaissé|Marqué comme payé en espèces.', 'Impossible de mettre à jour le supplément.'),
  };
}

export type OwnerActions = ReturnType<typeof useOwnerActions>;
