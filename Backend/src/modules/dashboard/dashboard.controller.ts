import { 
  Controller, 
  Get, 
  Query,
  UseGuards 
} from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { OwnerOverviewService } from './overview/owner-overview.service';
import { Roles } from '@shared/decorators/roles.decorator';
import { Role } from '@shared/types/jwt-payload.type';
import { JwtAuthGuard } from '@shared/guards/jwt-auth.guard';
import { CurrentUser } from '@shared/decorators/current-user.decorator';
import { AuthUser } from '@shared/types/jwt-payload.type';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(
    private readonly dashboardService: DashboardService,
    private readonly overviewService: OwnerOverviewService,
  ) {}

  /**
   * Accueil hôte : revenus 6 mois, occupation, performance par bien,
   * versements à venir, réputation et conseils — en un seul appel.
   */
  @Get('owner/overview')
  @Roles(Role.PROPRIETAIRE, Role.GESTIONNAIRE)
  getOverview(@CurrentUser() user: AuthUser) {
    return this.overviewService.getOverview(user.id);
  }

  /**
   * Stats globales du dashboard propriétaire avec filtre temporel optionnel
   */
  @Get('owner/stats')
  async getOwnerStats(
    @CurrentUser() user: AuthUser,
    @Query('timeframe') timeframe?: string,
  ) {
    return this.dashboardService.getOwnerStats(user.id, timeframe);
  }

  /**
   * Actions nécessitant une attention immédiate
   */
  @Get('owner/pending-actions')
  async getPendingActions(@CurrentUser() user: AuthUser) {
    return this.dashboardService.getPendingActions(user.id);
  }

  /**
   * Activité récente (dernières réservations)
   */
  @Get('owner/recent-activity')
  async getRecentActivity(@CurrentUser() user: AuthUser) {
    return this.dashboardService.getRecentActivity(user.id);
  }

  /**
   * Prochains événements (Check-in/Check-out 48h)
   */
  @Get('owner/upcoming-events')
  async getUpcomingEvents(@CurrentUser() user: AuthUser) {
    return this.dashboardService.getUpcomingEvents(user.id);
  }
}
