import { IsEnum, IsInt, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { StatutReservation } from '@prisma/client';

export class AdminReservationsQueryDto {
  @ApiPropertyOptional({ enum: StatutReservation })
  @IsOptional()
  @IsEnum(StatutReservation)
  statut?: StatutReservation;

  @ApiPropertyOptional({ description: 'Recherche par ID réservation, nom du locataire, nom du propriétaire ou titre du logement' })
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

export class ForceCancelReservationDto {
  @ApiPropertyOptional({ description: 'Motif de l\'annulation administrative d\'urgence' })
  @IsString()
  raison!: string;

  @ApiPropertyOptional({ default: 100, description: 'Pourcentage de remboursement au locataire (0 à 100%)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  tauxRemboursementLocataire?: number = 100;
}
