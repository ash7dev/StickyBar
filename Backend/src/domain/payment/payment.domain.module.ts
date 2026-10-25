import { Module } from '@nestjs/common';
import { RefundPaymentUseCase } from './use-cases/refund-payment.use-case';
import { OrphanPaymentUseCase } from './use-cases/orphan-payment.use-case';
import { SystemLedgerService } from '../system-ledger/system-ledger.service';

@Module({
  providers: [RefundPaymentUseCase, OrphanPaymentUseCase, SystemLedgerService],
  exports: [RefundPaymentUseCase, OrphanPaymentUseCase],
})
export class PaymentDomainModule {}
