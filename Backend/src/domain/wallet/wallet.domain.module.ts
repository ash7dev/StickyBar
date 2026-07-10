import { Module } from '@nestjs/common';
import { CreditWalletUseCase } from './use-cases/credit-wallet.use-case';
import { RequestWithdrawalUseCase } from './use-cases/request-withdrawal.use-case';
import { ProcessWithdrawalUseCase } from './use-cases/process-withdrawal.use-case';

const USE_CASES = [
  CreditWalletUseCase,
  RequestWithdrawalUseCase,
  ProcessWithdrawalUseCase,
];

@Module({
  providers: USE_CASES,
  exports: USE_CASES,
})
export class WalletDomainModule {}
