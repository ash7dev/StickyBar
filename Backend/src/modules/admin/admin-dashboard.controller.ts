import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { Roles } from '../../shared/decorators/roles.decorator';
import { Role } from '../../shared/types/jwt-payload.type';
import { AdminDashboardService } from './admin-dashboard.service';

@ApiTags('Admin — Dashboard & Metrics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin/dashboard')
export class AdminDashboardController {
  constructor(private readonly service: AdminDashboardService) {}

  @Get('stats')
  @ApiOperation({ summary: 'KPIs Globaux de la plateforme (GMV, Commissions, Utilisateurs, Hôtes)' })
  getStats() {
    return this.service.getStats();
  }

  @Get('pending-summary')
  @ApiOperation({ summary: 'Résumé des actions urgentes en attente (KYC, Annonces, Retraits, Litiges)' })
  getPendingSummary() {
    return this.service.getPendingSummary();
  }

  @Get('revenue-chart')
  @ApiOperation({ summary: 'Historique mensuel des revenus et du volume brut de réservation' })
  getRevenueChart() {
    return this.service.getRevenueChart();
  }

  @Get('recent-activity')
  @ApiOperation({ summary: 'Fil des activités récentes (Nouveaux utilisateurs, Réservations, Litiges, Support)' })
  getRecentActivity() {
    return this.service.getRecentActivity();
  }

  @Get('geographic-stats')
  @ApiOperation({ summary: 'Répartition géographique des annonces au Sénégal' })
  getGeographicStats() {
    return this.service.getGeographicStats();
  }

  @Get('top-performers')
  @ApiOperation({ summary: 'Classement des hôtes principaux' })
  getTopPerformers() {
    return this.service.getTopPerformers();
  }

  @Get('pending-withdrawals')
  @ApiOperation({ summary: 'Demandes de retraits en attente de validation' })
  getPendingWithdrawalsList() {
    return this.service.getPendingWithdrawalsList();
  }

  @Get('pending-disputes')
  @ApiOperation({ summary: 'Litiges en attente de résolution' })
  getPendingDisputesList() {
    return this.service.getPendingDisputesList();
  }

  @Get('audit-logs')
  @ApiOperation({ summary: 'Journal d’audit et de sécurité de la plateforme' })
  getAuditLogs() {
    return this.service.getAuditLogs();
  }
}
