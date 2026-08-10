import { Module } from '@nestjs/common';
import { CreditWalletUseCase } from './use-cases/credit-wallet.use-case';
import { RequestWithdrawalUseCase } from './use-cases/request-withdrawal.use-case';
import { ProcessWithdrawalUseCase } from './use-cases/process-withdrawal.use-case';
import { SystemLedgerService } from '../system-ledger/system-ledger.service';

const SERVICES = [
  CreditWalletUseCase,
  RequestWithdrawalUseCase,
  ProcessWithdrawalUseCase,
  SystemLedgerService,
];

@Module({
  providers: SERVICES,
  exports: SERVICES,
})
export class WalletDomainModule {}
