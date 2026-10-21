import { Controller, Get, Header, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { TypeTransactionWallet } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsIn, IsInt, IsOptional, IsString, IsUUID, Matches, Max, Min } from 'class-validator';
import { CurrentUser } from '@shared/decorators/current-user.decorator';
import { Roles } from '@shared/decorators/roles.decorator';
import { AuthUser, Role } from '@shared/types/jwt-payload.type';
import { OwnerRevenueService } from './owner-revenue.service';
import { MAX_TRANSACTIONS_PAGE, OwnerStatementService } from './owner-statement.service';
import { REVENUE_PERIODS, RevenuePeriod } from './revenue-period';

class RevenueQueryDto {
  @IsOptional()
  @IsIn(Object.keys(REVENUE_PERIODS))
  period?: RevenuePeriod;
}

class StatementQueryDto {
  @IsString()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, { message: 'month doit être au format YYYY-MM' })
  month!: string;
}

class TransactionsQueryDto {
  @IsOptional()
  @IsUUID()
  cursor?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_TRANSACTIONS_PAGE)
  limit?: number;

  @IsOptional()
  @IsEnum(TypeTransactionWallet)
  type?: TypeTransactionWallet;
}

@ApiTags('Dashboard propriétaire — Revenus')
@ApiBearerAuth()
@Controller('dashboard/owner/revenue')
@Roles(Role.PROPRIETAIRE, Role.GESTIONNAIRE)
export class OwnerRevenueController {
  constructor(
    private readonly revenue: OwnerRevenueService,
    private readonly statement: OwnerStatementService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Indicateurs de la période, historique 12 mois, par bien, wallet et versements' })
  getRevenue(@CurrentUser() user: AuthUser, @Query() query: RevenueQueryDto) {
    return this.revenue.getRevenue(user.id, query.period ?? 'month');
  }

  @Get('statement')
  @ApiOperation({ summary: 'Relevé mensuel : séjours, totaux et mouvements du wallet' })
  getStatement(@CurrentUser() user: AuthUser, @Query() query: StatementQueryDto) {
    return this.statement.getStatement(user.id, query.month);
  }

  @Get('statement/csv')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @ApiOperation({ summary: 'Relevé mensuel au format CSV' })
  getStatementCsv(@CurrentUser() user: AuthUser, @Query() query: StatementQueryDto) {
    return this.statement.getStatementCsv(user.id, query.month);
  }

  @Get('transactions')
  @ApiOperation({ summary: 'Historique du wallet, paginé par curseur' })
  getTransactions(@CurrentUser() user: AuthUser, @Query() query: TransactionsQueryDto) {
    return this.statement.getTransactions(user.id, query);
  }
}
