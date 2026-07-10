import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

const MS_30_MIN = 30 * 60 * 1000;
const MS_2H = 2 * 60 * 60 * 1000;
const MS_24H = 24 * 60 * 60 * 1000;

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);

  constructor(
    @InjectQueue('reservation-jobs') private readonly reservationQueue: Queue,
    @InjectQueue('notification-jobs') private readonly notificationQueue: Queue,
    @InjectQueue('absence-jobs') private readonly absenceQueue: Queue,
  ) {}

  // ── Réservations ──────────────────────────────────────────────────────────

  // Expire la réservation si le paiement n'arrive pas dans 30 min
  async scheduleReservationExpiry(reservationId: string, delayMs = MS_30_MIN): Promise<void> {
    await this.reservationQueue.add(
      'expire-pending',
      { reservationId },
      {
        jobId: `expire-${reservationId}`,
        delay: delayMs,
        attempts: 5,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: true,
      },
    );
    this.logger.debug(`Job expire-pending schedulé → ${reservationId} (${delayMs}ms)`);
  }

  // Expire la réservation si le propriétaire ne confirme pas avant delaiConfirmation
  async scheduleConfirmationExpiry(reservationId: string, delaiConfirmation: Date): Promise<void> {
    const delayMs = Math.max(delaiConfirmation.getTime() - Date.now(), 0);
    await this.reservationQueue.add(
      'expire-confirmation',
      { reservationId },
      {
        jobId: `confirm-expiry-${reservationId}`,
        delay: delayMs,
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: true,
      },
    );
    this.logger.debug(`Job expire-confirmation schedulé → ${reservationId} (dans ${Math.round(delayMs / 3_600_000)}h)`);
  }

  // Clôture automatique 24h après la fin du séjour (si le proprio n'a pas fait le checkout)
  async scheduleAutoClose(reservationId: string, dateFin: Date): Promise<void> {
    const delayMs = Math.max(dateFin.getTime() + MS_24H - Date.now(), 0);
    await this.reservationQueue.add(
      'auto-cloture',
      { reservationId },
      {
        jobId: `autoclose-${reservationId}`,
        delay: delayMs,
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: true,
      },
    );
    this.logger.debug(`Job auto-cloture schedulé → ${reservationId} (dans ${Math.round(delayMs / 3_600_000)}h)`);
  }

  // Auto-check-in système 6h après dateDebut si personne n'a agi
  async scheduleAutoCheckin(reservationId: string, dateDebut: Date): Promise<void> {
    const MS_6H = 6 * 60 * 60 * 1000;
    const delayMs = Math.max(dateDebut.getTime() + MS_6H - Date.now(), 0);
    await this.reservationQueue.add(
      'auto-checkin',
      { reservationId },
      {
        jobId: `autocheckin-${reservationId}`,
        delay: delayMs,
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: true,
      },
    );
    this.logger.debug(`Job auto-checkin schedulé → ${reservationId} (dans ${Math.round(delayMs / 3_600_000)}h)`);
  }

  // Rappels check-in : dateDebut, dateDebut+2h, dateDebut+4h
  async scheduleCheckinReminders(reservationId: string, dateDebut: Date): Promise<void> {
    const offsets = [
      { label: 'rappel-checkin-0h', delayMs: 0 },
      { label: 'rappel-checkin-2h', delayMs: 2 * 60 * 60 * 1000 },
      { label: 'rappel-checkin-4h', delayMs: 4 * 60 * 60 * 1000 },
    ];

    for (const { label, delayMs: offsetMs } of offsets) {
      const fireAt = dateDebut.getTime() + offsetMs;
      const delayMs = Math.max(fireAt - Date.now(), 0);
      await this.reservationQueue.add(
        label,
        { reservationId },
        {
          jobId: `${label}-${reservationId}`,
          delay: delayMs,
          attempts: 3,
          backoff: { type: 'exponential', delay: 5000 },
          removeOnComplete: true,
        },
      );
    }
    this.logger.debug(`Jobs rappel-checkin (0h/2h/4h) schedulés → ${reservationId}`);
  }

  // Rappel J-1 à 9h du matin
  async scheduleArrivalReminder(reservationId: string, dateDebut: Date): Promise<void> {
    const reminderDate = new Date(dateDebut);
    reminderDate.setDate(reminderDate.getDate() - 1);
    reminderDate.setHours(9, 0, 0, 0);
    const delayMs = Math.max(reminderDate.getTime() - Date.now(), 0);

    await this.reservationQueue.add(
      'rappel-jour-j',
      { reservationId },
      {
        jobId: `rappel-${reservationId}`,
        delay: delayMs,
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: true,
      },
    );
    this.logger.debug(`Job rappel-jour-j schedulé → ${reservationId} (dans ${Math.round(delayMs / 3_600_000)}h)`);
  }

  // Ferme la fenêtre d'avis 7 jours après la clôture
  async scheduleFenetreAvis(reservationId: string, closeLe: Date): Promise<void> {
    const delayMs = Math.max(closeLe.getTime() + 7 * MS_24H - Date.now(), 0);
    await this.reservationQueue.add(
      'fermer-fenetre-avis',
      { reservationId },
      {
        jobId: `fenetre-avis-${reservationId}`,
        delay: delayMs,
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: true,
      },
    );
    this.logger.debug(`Job fermer-fenetre-avis schedulé → ${reservationId} (dans 7j)`);
  }

  // Annule tous les jobs liés à une réservation (annulation, litige, expiration)
  async cancelReservationJobs(reservationId: string): Promise<void> {
    const reservationJobIds = [
      `expire-${reservationId}`,
      `confirm-expiry-${reservationId}`,
      `autoclose-${reservationId}`,
      `rappel-${reservationId}`,
      `autocheckin-${reservationId}`,
      `rappel-checkin-0h-${reservationId}`,
      `rappel-checkin-2h-${reservationId}`,
      `rappel-checkin-4h-${reservationId}`,
    ];

    await Promise.all(
      reservationJobIds.map(async (id) => {
        const job = await this.reservationQueue.getJob(id);
        if (job) {
          await job.remove();
          this.logger.debug(`Job annulé : ${id}`);
        }
      }),
    );

    // Annuler aussi les jobs d'absence si actifs
    await this.cancelAbsenceJobs(reservationId);
  }

  // Crédite le wallet proprio après check-in (retry automatique en cas de panne)
  async scheduleCreditWallet(reservationId: string): Promise<void> {
    await this.reservationQueue.add(
      'credit-wallet',
      { reservationId },
      {
        jobId: `credit-wallet-${reservationId}`,
        attempts: 5,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: true,
      },
    );
    this.logger.debug(`Job credit-wallet schedulé → ${reservationId}`);
  }

  // ── Absence proprio ───────────────────────────────────────────────────────

  async scheduleAbsenceConfirmation(reservationId: string, attempt = 1): Promise<void> {
    await this.absenceQueue.add(
      'rappel-absence',
      { reservationId, attempt },
      {
        jobId: `absence-${reservationId}`,
        delay: 30 * 60 * 1000,
        removeOnComplete: true,
      },
    );
  }

  async cancelAbsenceJobs(reservationId: string): Promise<void> {
    const job = await this.absenceQueue.getJob(`absence-${reservationId}`);
    if (job) {
      await job.remove();
      this.logger.debug(`Job absence annulé : absence-${reservationId}`);
    }
  }

  // ── Notifications ─────────────────────────────────────────────────────────

  async enqueueNotification(userId: string, type: string, payload: Record<string, unknown>): Promise<void> {
    await this.notificationQueue.add(
      'send-notification',
      { userId, type, payload },
      {
        attempts: 5,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: true,
      },
    );
  }
}
