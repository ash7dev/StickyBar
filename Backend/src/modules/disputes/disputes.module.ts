import { Module } from '@nestjs/common';
import { DisputesService } from './disputes.service';
import { DisputesController } from './disputes.controller';
import { DisputesAdminController } from './disputes-admin.controller';
import { RefundPaymentUseCase } from '../../domain/payment/use-cases/refund-payment.use-case';
import { SystemLedgerService } from '../../domain/system-ledger/system-ledger.service';

@Module({
  controllers: [DisputesController, DisputesAdminController],
  providers: [DisputesService, RefundPaymentUseCase, SystemLedgerService],
  exports: [DisputesService],
})
export class DisputesModule {}

