import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { StatutLogement } from '@prisma/client';

export class AdminListingsQueryDto {
  @ApiPropertyOptional({ enum: StatutLogement })
  @IsOptional()
  @IsEnum(StatutLogement)
  statut?: StatutLogement;

  @ApiPropertyOptional({ description: 'Recherche par titre, ville, quartier ou nom du propriétaire' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filtrer par type de logement (ex: APPARTEMENT, VILLA)' })
  @IsOptional()
  @IsString()
  type?: string;

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
