import { Module } from '@nestjs/common';
import { ReservationDomainModule } from '../../domain/reservation/reservation.domain.module';
import { WalletDomainModule } from '../../domain/wallet/wallet.domain.module';
import { FautesDomainModule } from '../../domain/fautes/fautes.domain.module';
import { PaymentDomainModule } from '../../domain/payment/payment.domain.module';
import { NotificationDispatcherModule } from '../notification-dispatcher/notification-dispatcher.module';
import { PendingExpiryJob } from './jobs/pending-expiry.job';
import { AbsenceProprioJob } from './jobs/absence-proprio.job';
import { AutoClotureJob } from './jobs/auto-cloture.job';
import { ConfirmationExpiryJob } from './jobs/confirmation-expiry.job';
import { NotificationJob } from './jobs/notification.job';
import { RappelJourJJob } from './jobs/rappel-jour-j.job';
import { FenetreAvisJob } from './jobs/fenetre-avis.job';
import { ResetCompteursJob } from './jobs/reset-compteurs.job';
import { OrphanPaymentJob } from './jobs/orphan-payment.job';
import { ReconcileNotesJob } from './jobs/reconcile-notes.job';
import { CreditWalletJob } from './jobs/credit-wallet.job';
import { AutoCheckinJob } from './jobs/auto-checkin.job';
import { CheckinReminderJob } from './jobs/checkin-reminder.job';
import { CleanupEtatLieuxPhotosJob } from './jobs/cleanup-etat-lieux-photos.job';

const ALL_JOBS = [
  PendingExpiryJob,
  AbsenceProprioJob,
  AutoClotureJob,
  ConfirmationExpiryJob,
  NotificationJob,
  RappelJourJJob,
  FenetreAvisJob,
  ResetCompteursJob,
  OrphanPaymentJob,
  ReconcileNotesJob,
  CreditWalletJob,
  AutoCheckinJob,
  CheckinReminderJob,
  CleanupEtatLieuxPhotosJob,
];

@Module({
  imports: [ReservationDomainModule, WalletDomainModule, FautesDomainModule, PaymentDomainModule, NotificationDispatcherModule],
  providers: [...ALL_JOBS],
  exports: [...ALL_JOBS],
})
export class ReservationJobsModule {}
