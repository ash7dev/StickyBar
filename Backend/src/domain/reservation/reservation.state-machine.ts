import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { StatutReservation } from '@prisma/client';

@Injectable()
export class ReservationStateMachine {
  /**
   * Map des transitions autorisées.
   * La clé est le statut actuel, la valeur est la liste des statuts suivants possibles.
   */
  private readonly transitions: Record<StatutReservation, StatutReservation[]> = {
    [StatutReservation.PENDING]: [
      StatutReservation.PAID,
      StatutReservation.EXPIRED,
      StatutReservation.CANCELLED,
    ],
    [StatutReservation.PAID]: [
      StatutReservation.CONFIRMED,
      StatutReservation.CANCELLED,
      StatutReservation.EXPIRED, // Cas rare: timeout technique post-paiement
    ],
    [StatutReservation.CONFIRMED]: [
      StatutReservation.CHECKED_IN,
      StatutReservation.CANCELLED,
      StatutReservation.DISPUTED,
      StatutReservation.COMPLETED, // Auto-complétion système si aucune action après dateDebut + 6h → dateFin + 24h
    ],
    [StatutReservation.CHECKED_IN]: [
      StatutReservation.COMPLETED,
      StatutReservation.DISPUTED,
    ],
    [StatutReservation.COMPLETED]: [
      StatutReservation.DISPUTED, // Litige post-séjour (ex: dégradations constatées après sortie)
    ],
    [StatutReservation.CANCELLED]: [], // État terminal
    [StatutReservation.DISPUTED]: [
      StatutReservation.COMPLETED, // Une fois le litige résolu par l'admin
      StatutReservation.CANCELLED,
    ],
    [StatutReservation.EXPIRED]: [], // État terminal
  };

  /**
   * Vérifie si une transition est valide et lève une exception si ce n'est pas le cas.
   * @param current Statut actuel de la réservation
   * @param next Statut cible souhaité
   * @throws UnprocessableEntityException (422) si la transition est interdite
   */
  transition(current: StatutReservation, next: StatutReservation): void {
    if (current === next) return; // Pas de changement, on laisse passer

    const allowed = this.transitions[current] || [];

    if (!allowed.includes(next)) {
      throw new UnprocessableEntityException(
        `Transition de statut invalide : impossible de passer de [${this.formatStatut(current)}] à [${this.formatStatut(next)}].`,
      );
    }
  }

  /**
   * Formate le nom du statut pour des messages d'erreur plus lisibles en français.
   */
  private formatStatut(statut: StatutReservation): string {
    const labels: Record<StatutReservation, string> = {
      [StatutReservation.PENDING]: 'EN ATTENTE DE PAIEMENT',
      [StatutReservation.PAID]: 'PAYÉE',
      [StatutReservation.CONFIRMED]: 'CONFIRMÉE',
      [StatutReservation.CHECKED_IN]: 'EN COURS (CHECKED-IN)',
      [StatutReservation.COMPLETED]: 'TERMINÉE',
      [StatutReservation.CANCELLED]: 'ANNULÉE',
      [StatutReservation.DISPUTED]: 'EN LITIGE',
      [StatutReservation.EXPIRED]: 'EXPIRÉE',
    };
    return labels[statut] || statut;
  }
}
