import { useState } from 'react';
import { Alert } from 'react-native';
import * as Haptics from 'expo-haptics';
import { apiClient } from '../../../../shared/api/api-client';

export type TenantAction =
  | 'confirm-checkin'
  | 'refuse-checkin'
  | 'report-absent'
  | 'extend-absent'
  | 'rate-owner'
  | 'open-dispute'
  | 'pay-fee'
  | 'contest-fee';

/** Motifs acceptés par POST /reservations/:id/checkin/refuse. */
export const REFUSE_MOTIFS = [
  { key: 'ACCES_IMPOSSIBLE', label: 'Accès impossible', hint: 'Clés absentes, code faux, porte fermée' },
  { key: 'NON_CONFORMITE', label: 'Non conforme', hint: 'Différent des photos ou de l’annonce' },
  { key: 'DEGATS', label: 'Dégâts constatés', hint: 'Non signalés par l’hôte' },
  { key: 'AUTRE', label: 'Autre', hint: 'Un autre problème empêche l’entrée' },
] as const;

/** Motifs acceptés par POST /disputes (pendant ou après le séjour). */
export const DISPUTE_MOTIFS = [
  { key: 'LOGEMENT_NON_CONFORME', label: 'Logement non conforme' },
  { key: 'LOGEMENT_INACCESSIBLE', label: 'Accès ou clés' },
  { key: 'DOMMAGES', label: 'Propreté ou dégradation' },
  { key: 'DEPASSEMENT_PERSONNES', label: 'Nuisances' },
  { key: 'NON_PAIEMENT', label: 'Frais supplémentaires' },
  { key: 'AUTRE', label: 'Autre' },
] as const;

function message(err: unknown, fallback: string): string {
  const raw = (err as { response?: { data?: { message?: unknown } } })?.response?.data?.message;
  if (Array.isArray(raw)) return raw.join(' · ');
  return typeof raw === 'string' && raw ? raw : fallback;
}

/**
 * Toutes les actions du locataire sur une réservation (mêmes endpoints que l'ancien écran).
 * Chaque action renvoie `true` en cas de succès ; l'erreur est déjà affichée.
 */
export function useTenantActions(reservationId: string, onDone: () => void) {
  const [pending, setPending] = useState<TenantAction | null>(null);

  async function run(action: TenantAction, call: () => Promise<unknown>, success: string | null, fallback: string) {
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
    confirmCheckin: () =>
      run('confirm-checkin', () => apiClient.post(`${base}/checkin/confirm`), 'Bienvenue !|Votre séjour commence. Bon séjour.', 'Impossible de valider votre arrivée.'),
    refuseCheckin: (motif: string, commentaire: string) =>
      run(
        'refuse-checkin',
        () => apiClient.post(`${base}/checkin/refuse`, { motif, commentaire }),
        'Signalement envoyé|Votre paiement reste bloqué pendant l’examen par l’équipe Paixi.',
        'Le signalement n’a pas pu être envoyé.',
      ),
    reportAbsent: () =>
      run(
        'report-absent',
        () => apiClient.post(`${base}/absent`),
        'Absence signalée|L’hôte a 2 h pour réagir. Sinon, la réservation est annulée et remboursée.',
        'Impossible de signaler l’absence.',
      ),
    extendAbsent: () =>
      run('extend-absent', () => apiClient.post(`${base}/extend-absent-timeout`), 'Délai prolongé|2 heures de plus accordées à l’hôte.', 'Impossible de prolonger le délai.'),
    rateOwner: (note: number, commentaire: string) =>
      run(
        'rate-owner',
        () => apiClient.post(`${base}/rate-owner`, { note, commentaire: commentaire.trim() || undefined }),
        'Merci !|Votre avis est publié.',
        'Impossible de publier votre avis.',
      ),
    openDispute: (motif: string, description: string) =>
      run(
        'open-dispute',
        () => apiClient.post('/disputes', { reservationId, motif, description: description.trim() }),
        'Signalement envoyé|L’équipe Paixi examine votre dossier. Les fonds restent gelés pendant l’examen.',
        'Impossible d’ouvrir le signalement.',
      ),
    payFee: (feeId: string, methodePaiement: string, telephone: string) =>
      run(
        'pay-fee',
        () => apiClient.post(`${base}/frais/${feeId}/payer`, { methodePaiement, telephone: telephone || undefined }),
        'Supplément réglé|Merci, l’hôte est prévenu.',
        'Impossible de régler ce supplément.',
      ),
    contestFee: (feeId: string, titre: string) =>
      run(
        'contest-fee',
        () => apiClient.post(`${base}/frais/${feeId}/refuser`, { raison: `Contestation du supplément ${titre}` }),
        'Contestation envoyée|L’équipe Paixi examine la demande. Vous ne payez rien en attendant.',
        'Impossible de contester ce supplément.',
      ),
  };
}

export type TenantActions = ReturnType<typeof useTenantActions>;
