import { Module } from '@nestjs/common';
import { CreateReservationUseCase } from './use-cases/create-reservation.use-case';
import { ConfirmReservationUseCase } from './use-cases/confirm-reservation.use-case';
import { CancelReservationUseCase } from './use-cases/cancel-reservation.use-case';
import { CheckInUploadPhotosUseCase } from './use-cases/checkin-upload-photos.use-case';
import { CheckInConfirmUseCase } from './use-cases/checkin-confirm.use-case';
import { CheckInRefuseUseCase } from './use-cases/checkin-refuse.use-case';
import { ProprioAbsentUseCase } from './use-cases/proprio-absent.use-case';
import { ExpirePendingUseCase } from './use-cases/expire-pending.use-case';
import { ProprioAbsentExpireUseCase } from './use-cases/proprio-absent-expire.use-case';
import { CheckOutUploadPhotosUseCase } from './use-cases/checkout-upload-photos.use-case';
import { ReservationStateMachine } from './reservation.state-machine';
import { CheckoutUseCase } from './use-cases/checkout.use-case';
import { AutoClotureUseCase } from './use-cases/auto-cloture.use-case';
import { AutoCheckinUseCase } from './use-cases/auto-checkin.use-case';
import { ExpireConfirmationUseCase } from './use-cases/expire-confirmation.use-case';
import { FermerFenetreAvisUseCase } from './use-cases/fermer-fenetre-avis.use-case';
import { RappelJourJUseCase } from './use-cases/rappel-jour-j.use-case';
import { RecalculerNotesUseCase } from './use-cases/recalculer-notes.use-case';
import { CleanupEtatLieuxPhotosUseCase } from './use-cases/cleanup-etat-lieux-photos.use-case';
import { AddEtatLieuxPhotoUseCase } from './use-cases/add-etat-lieux-photo.use-case';
import { CheckinProprioUseCase } from './use-cases/checkin-proprio.use-case';
import { CheckoutProprioUseCase } from './use-cases/checkout-proprio.use-case';
import { PricingModule } from '../../shared/pricing/pricing.module';
import { QueueModule } from '../../infrastructure/queue/queue.module';
import { WalletDomainModule } from '../wallet/wallet.domain.module';
import { PaymentDomainModule } from '../payment/payment.domain.module';
import { ContratModule } from '../../infrastructure/contrat/contrat.module';

const USE_CASES = [
  CreateReservationUseCase,
  ConfirmReservationUseCase,
  CancelReservationUseCase,
  CheckInUploadPhotosUseCase,
  CheckInConfirmUseCase,
  CheckInRefuseUseCase,
  ProprioAbsentUseCase,
  ExpirePendingUseCase,
  ProprioAbsentExpireUseCase,
  CheckOutUploadPhotosUseCase,
  CheckoutUseCase,
  AutoClotureUseCase,
  AutoCheckinUseCase,
  ExpireConfirmationUseCase,
  FermerFenetreAvisUseCase,
  RappelJourJUseCase,
  RecalculerNotesUseCase,
  CleanupEtatLieuxPhotosUseCase,
  AddEtatLieuxPhotoUseCase,
  CheckinProprioUseCase,
  CheckoutProprioUseCase,
  ReservationStateMachine,
];

@Module({
  imports: [
    PricingModule,
    QueueModule,
    WalletDomainModule,
    PaymentDomainModule,
    ContratModule,
  ],
  providers: [...USE_CASES],
  exports: [...USE_CASES],
})
export class ReservationDomainModule {}
