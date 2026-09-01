import { Module } from '@nestjs/common';
import { GestionnaireController } from './gestionnaire.controller';
import { GestionnaireService } from './gestionnaire.service';
import { WalletModule } from '../wallet/wallet.module';
import { LogementsModule } from '../logements/logements.module';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';

@Module({
  imports: [PrismaModule, WalletModule, LogementsModule],
  controllers: [GestionnaireController],
  providers: [GestionnaireService],
  exports: [GestionnaireService],
})
export class GestionnaireModule {}
