import { Module } from '@nestjs/common';
import { PrismaModule } from '@infrastructure/prisma/prisma.module';
import { PricingModule } from '@shared/pricing/pricing.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { LogementsController } from './logements.controller';
import { LogementsService } from './logements.service';

@Module({
  imports: [PrismaModule, PricingModule, NotificationsModule],
  controllers: [LogementsController],
  providers: [LogementsService],
  exports: [LogementsService],
})
export class LogementsModule {}
