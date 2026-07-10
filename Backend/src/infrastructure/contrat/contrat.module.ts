import { Module } from '@nestjs/common';
import { ContratService } from './contrat.service';

@Module({
  providers: [ContratService],
  exports: [ContratService],
})
export class ContratModule {}
