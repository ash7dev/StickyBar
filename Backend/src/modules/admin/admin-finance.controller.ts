import { Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { Roles } from '../../shared/decorators/roles.decorator';
import { Role } from '../../shared/types/jwt-payload.type';
import { AdminFinanceService } from './admin-finance.service';
import { AdminFinanceQueryDto, AdminFinanceStatsQueryDto, AdminRefundsQueryDto, AdminWebhooksQueryDto } from './dto/admin-finance-query.dto';
import { Body } from '@nestjs/common';
import { WalletAdjustmentDto } from './dto/wallet-adjustment.dto';

@ApiTags('Admin — Financial Ledger & Webhooks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin/finance')
export class AdminFinanceController {
  constructor(private readonly service: AdminFinanceService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Statistiques avancées des gains et revenus nets Klef (commissions, pénalités)' })
  getFinancialStats(@Query() dto: AdminFinanceStatsQueryDto) {
    return this.service.getFinancialStats(dto);
  }

  @Get('transactions')
  @ApiOperation({ summary: 'Audit global des transactions wallet de la plateforme' })
  listTransactions(@Query() dto: AdminFinanceQueryDto) {
    return this.service.listTransactions(dto);
  }

  @Get('refunds')
  @ApiOperation({ summary: 'Liste et suivi des remboursements (locataires/hôtes)' })
  listRefunds(@Query() dto: AdminRefundsQueryDto) {
    return this.service.listRefunds(dto);
  }

  @Post('refunds/:id/retry')
  @ApiOperation({ summary: 'Relancer manuellement un remboursement en échec' })
  @ApiParam({ name: 'id', description: 'UUID du remboursement' })
  retryRefund(@Param('id') id: string) {
    return this.service.retryRefund(id);
  }

  @Get('webhooks')
  @ApiOperation({ summary: 'Inspection des logs des webhooks de paiement (PayDunya, Stripe, Wave)' })
  listWebhookLogs(@Query() dto: AdminWebhooksQueryDto) {
    return this.service.listWebhookLogs(dto);
  }

  @Post('wallet-adjustment')
  @ApiOperation({ summary: 'Créditer ou débiter manuellement le portefeuille d\'un utilisateur' })
  adjustWalletBalance(@Body() dto: WalletAdjustmentDto) {
    return this.service.adjustWalletBalance(dto);
  }
}
