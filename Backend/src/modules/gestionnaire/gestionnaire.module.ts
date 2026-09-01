import { Module } from '@nestjs/common';
import { GestionnaireController } from './gestionnaire.controller';
import { WalletModule } from '../wallet/wallet.module';
import { LogementsModule } from '../logements/logements.module';

@Module({
  imports: [WalletModule, LogementsModule],
  controllers: [GestionnaireController],
})
export class GestionnaireModule {}
