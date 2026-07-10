import { Module } from '@nestjs/common';
import { WalletDomainModule } from '../../domain/wallet/wallet.domain.module';
import { WalletController } from './wallet.controller';
import { WalletAdminController } from './wallet-admin.controller';
import { WalletService } from './wallet.service';

@Module({
  imports: [WalletDomainModule],
  controllers: [WalletController, WalletAdminController],
  providers: [WalletService],
  exports: [WalletService],
})
export class WalletModule {}
