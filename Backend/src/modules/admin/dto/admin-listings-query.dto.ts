import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { StatutLogement } from '@prisma/client';

export class AdminListingsQueryDto {
  @ApiPropertyOptional({ enum: StatutLogement, default: StatutLogement.PENDING_REVIEW })
  @IsOptional()
  @IsEnum(StatutLogement)
  statut?: StatutLogement;

  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;
}
