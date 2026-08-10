import { Module } from '@nestjs/common';
import { TerangaClubController } from './teranga-club.controller';
import { TerangaClubService } from './teranga-club.service';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TerangaClubController],
  providers: [TerangaClubService],
  exports: [TerangaClubService],
})
export class TerangaClubModule {}
