import { Injectable, Logger } from '@nestjs/common';
import { StatutPaiement, StatutReservation } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { ReservationStateMachine } from '../reservation.state-machine';
import { QueueService } from '../../../infrastructure/queue/queue.service';

/**
 * Auto-check-in système.
 *
 * Déclenché automatiquement `dateDebut + 6h` si la réservation est toujours
 * en statut CONFIRMED et qu'aucune annulation ni litige n'a été déclaré.
 *
 * Cela garantit que :
 * - Les fonds ne restent jamais gelés en séquestre indéfiniment
 * - Le propriétaire est crédité même si le locataire oublie de confirmer le check-in
 * - L'auto-clôture peut s'enchaîner normalement à dateFin + 24h
 */
@Injectable()
export class AutoCheckinUseCase {
  private readonly logger = new Logger(AutoCheckinUseCase.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly stateMachine: ReservationStateMachine,
    private readonly queue: QueueService,
  ) {}

  async execute(reservationId: string) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id: reservationId },
      include: { paiement: true, litige: true },
    });

    if (!reservation) {
      this.logger.warn(`Auto-checkin ignoré : réservation [${reservationId}] introuvable`);
      return;
    }

    // ── Garde-fous ────────────────────────────────────────────────────────

    // 1. Ne traiter que les réservations encore CONFIRMED
    if (reservation.statut !== StatutReservation.CONFIRMED) {
      this.logger.log(
        `Auto-checkin ignoré [${reservationId}] : statut actuel [${reservation.statut}], pas CONFIRMED`,
      );
      return;
    }

    // 2. Ne pas agir si un litige est déjà ouvert
    if (reservation.litige) {
      this.logger.log(`Auto-checkin ignoré [${reservationId}] : litige en cours`);
      return;
    }

    // 3. Vérifier que dateDebut + 6h est bien passée
    const MS_6H = 6 * 60 * 60 * 1000;
    const seuilAutoCheckin = new Date(reservation.dateDebut.getTime() + MS_6H);
    if (Date.now() < seuilAutoCheckin.getTime()) {
      this.logger.log(`Auto-checkin ignoré [${reservationId}] : seuil de 6h non atteint`);
      return;
    }

    // 4. Valider la transition via la state machine
    try {
      this.stateMachine.transition(reservation.statut, StatutReservation.CHECKED_IN);
    } catch {
      this.logger.log(`Auto-checkin ignoré [${reservationId}] : transition interdite`);
      return;
    }

    // ── Exécution ─────────────────────────────────────────────────────────

    const now = new Date();

    await this.prisma.$transaction(async (tx) => {
      await tx.reservation.update({
        where: { id: reservationId },
        data: {
          statut: StatutReservation.CHECKED_IN,
          // Positionner les timestamps de check-in système (garder les existants si le proprio avait déjà uploadé)
          checkinProprioLe: reservation.checkinProprioLe ?? now,
          checkinLocataireLe: reservation.checkinLocataireLe ?? now,
          updatedBySystem: true,
        },
      });

      // Confirmer le paiement si pas encore fait
      if (reservation.paiement && reservation.paiement.statut === StatutPaiement.EN_ATTENTE) {
        await tx.paiement.update({
          where: { reservationId },
          data: { statut: StatutPaiement.CONFIRME },
        });
      }

      await tx.reservationHistorique.create({
        data: {
          reservationId,
          ancienStatut: StatutReservation.CONFIRMED,
          nouveauStatut: StatutReservation.CHECKED_IN,
          modifiePar: 'SYSTEM_AUTO_CHECKIN',
          raison:
            'Check-in automatique par le système : aucune action des parties 6h après le début du séjour, aucune annulation ni litige déclaré.',
        },
      });
    }, { isolationLevel: 'Serializable' });

    // ── Effets post-transaction ───────────────────────────────────────────

    // Créditer le wallet du propriétaire
    await this.queue.scheduleCreditWallet(reservationId);

    // Programmer l'auto-clôture à dateFin + 24h
    await this.queue.scheduleAutoClose(reservationId, reservation.dateFin);

    // Notifier les deux parties
    await this.queue.enqueueNotification(reservation.proprietaireId, 'AUTO_CHECKIN_SYSTEME', {
      reservationId,
      logementId: reservation.logementId,
      message: 'Le check-in a été validé automatiquement par le système.',
    });
    await this.queue.enqueueNotification(reservation.locataireId, 'AUTO_CHECKIN_SYSTEME', {
      reservationId,
      logementId: reservation.logementId,
      message: 'Le check-in a été validé automatiquement par le système.',
    });

    this.logger.log(
      `✅ Auto-checkin effectué [${reservationId}]. Wallet crédité. Auto-clôture programmée.`,
    );
  }
}
