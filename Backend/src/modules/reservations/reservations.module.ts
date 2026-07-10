import { Module } from '@nestjs/common';
import { ReservationsController } from './reservations.controller';
import { ReservationsService } from './reservations.service';
import { ReservationDomainModule } from '../../domain/reservation/reservation.domain.module';

@Module({
  imports: [ReservationDomainModule],
  controllers: [ReservationsController],
  providers: [ReservationsService],
  exports: [ReservationsService],
})
export class ReservationsModule {}
