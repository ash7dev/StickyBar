import { Module } from '@nestjs/common';
import { PrismaModule } from '@infrastructure/prisma/prisma.module';
import { CalendrierController } from './calendrier.controller';
import { CalendrierService } from './calendrier.service';

@Module({
  imports: [PrismaModule],
  controllers: [CalendrierController],
  providers: [CalendrierService],
})
export class CalendrierModule {}
