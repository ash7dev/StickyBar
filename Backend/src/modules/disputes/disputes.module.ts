import { Module } from '@nestjs/common';
import { DisputesService } from './disputes.service';
import { DisputesController } from './disputes.controller';
import { DisputesAdminController } from './disputes-admin.controller';
import { RefundPaymentUseCase } from '../../domain/payment/use-cases/refund-payment.use-case';

@Module({
  controllers: [DisputesController, DisputesAdminController],
  providers: [DisputesService, RefundPaymentUseCase],
  exports: [DisputesService],
})
export class DisputesModule {}
