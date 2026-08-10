import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { StatutRefund, FournisseurPaiement } from '@prisma/client';

export class AdminFinanceQueryDto {
  @ApiPropertyOptional({ description: 'Recherche par ID de réservation ou de wallet' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ minimum: 1, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;
}

export class AdminRefundsQueryDto {
  @ApiPropertyOptional({ enum: StatutRefund })
  @IsOptional()
  @IsEnum(StatutRefund)
  statut?: StatutRefund;

  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ minimum: 1, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;
}

export class AdminWebhooksQueryDto {
  @ApiPropertyOptional({ enum: FournisseurPaiement })
  @IsOptional()
  @IsEnum(FournisseurPaiement)
  provider?: FournisseurPaiement;

  @ApiPropertyOptional({ description: 'Filtrer les webhooks valides/invalides' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isValid?: boolean;

  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ minimum: 1, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;
}

export class AdminFinanceStatsQueryDto {
  @ApiPropertyOptional({ description: 'Date de début (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Date de fin (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Filtrer par ville' })
  @IsOptional()
  @IsString()
  ville?: string;

  @ApiPropertyOptional({ description: 'Filtrer par type de logement' })
  @IsOptional()
  @IsString()
  type?: string;
}
