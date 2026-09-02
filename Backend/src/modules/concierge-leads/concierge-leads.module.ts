import { Module } from '@nestjs/common';
import { ConciergeLeadsController } from './concierge-leads.controller';
import { ConciergeLeadsService } from './concierge-leads.service';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ConciergeLeadsController],
  providers: [ConciergeLeadsService],
  exports: [ConciergeLeadsService],
})
export class ConciergeLeadsModule {}
