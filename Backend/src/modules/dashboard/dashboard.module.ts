import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { OwnerCalendarController } from './calendar/owner-calendar.controller';
import { OwnerCalendarService } from './calendar/owner-calendar.service';
import { OwnerOverviewService } from './overview/owner-overview.service';
import { OwnerRevenueController } from './revenue/owner-revenue.controller';
import { OwnerRevenueService } from './revenue/owner-revenue.service';
import { OwnerStatementService } from './revenue/owner-statement.service';

@Module({
  controllers: [DashboardController, OwnerCalendarController, OwnerRevenueController],
  providers: [DashboardService, OwnerCalendarService, OwnerOverviewService, OwnerRevenueService, OwnerStatementService],
  exports: [DashboardService],
})
export class DashboardModule {}
