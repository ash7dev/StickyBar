import { Module } from '@nestjs/common';
import { RefundPaymentUseCase } from './use-cases/refund-payment.use-case';
import { OrphanPaymentUseCase } from './use-cases/orphan-payment.use-case';

@Module({
  providers: [RefundPaymentUseCase, OrphanPaymentUseCase],
  exports: [RefundPaymentUseCase, OrphanPaymentUseCase],
})
export class PaymentDomainModule {}
