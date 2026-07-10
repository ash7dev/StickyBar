import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { AdminListingsController } from './admin-listings.controller';
import { AdminListingsService } from './admin-listings.service';

@Module({
  imports: [PrismaModule],
  controllers: [AdminListingsController],
  providers: [AdminListingsService],
})
export class AdminModule {}
