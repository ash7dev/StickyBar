import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { RedisModule } from '../../infrastructure/redis/redis.module';
import { PaymentDomainModule } from '../../domain/payment/payment.domain.module';

import { AdminListingsController } from './admin-listings.controller';
import { AdminListingsService } from './admin-listings.service';

import { AdminDashboardController } from './admin-dashboard.controller';
import { AdminDashboardService } from './admin-dashboard.service';

import { AdminUsersController } from './admin-users.controller';
import { AdminUsersService } from './admin-users.service';

import { AdminReservationsController } from './admin-reservations.controller';
import { AdminReservationsService } from './admin-reservations.service';

import { AdminFinanceController } from './admin-finance.controller';
import { AdminFinanceService } from './admin-finance.service';

import { AdminEquipementsController } from './admin-equipements.controller';
import { AdminEquipementsService } from './admin-equipements.service';

import { AdminReviewsController } from './admin-reviews.controller';
import { AdminReviewsService } from './admin-reviews.service';

import { AdminNotificationsController } from './admin-notifications.controller';
import { AdminNotificationsService } from './admin-notifications.service';

@Module({
  imports: [PrismaModule, RedisModule, PaymentDomainModule],
  controllers: [
    AdminListingsController,
    AdminDashboardController,
    AdminUsersController,
    AdminReservationsController,
    AdminFinanceController,
    AdminEquipementsController,
    AdminReviewsController,
    AdminNotificationsController,
  ],
  providers: [
    AdminListingsService,
    AdminDashboardService,
    AdminUsersService,
    AdminReservationsService,
    AdminFinanceService,
    AdminEquipementsService,
    AdminReviewsService,
    AdminNotificationsService,
  ],
})
export class AdminModule {}
