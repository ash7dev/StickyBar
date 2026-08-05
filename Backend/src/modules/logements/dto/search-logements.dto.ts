import { IsDateString, IsEnum, IsInt, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { TypeLogement } from '@prisma/client';

export class SearchLogementsDto {
  @ApiPropertyOptional({ example: 'dakar' })
  @IsOptional()
  @IsString()
  ville?: string;

  @ApiPropertyOptional({ example: 14.7167, description: 'Latitude GPS pour recherche à proximité' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  lat?: number;

  @ApiPropertyOptional({ example: -17.4677, description: 'Longitude GPS pour recherche à proximité' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  lng?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 10, description: 'Rayon de recherche en km' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  radiusKm?: number;

  @ApiPropertyOptional({ example: '2026-08-01' })
  @IsOptional()
  @IsDateString()
  dateDebut?: string;

  @ApiPropertyOptional({ example: '2026-08-05' })
  @IsOptional()
  @IsDateString()
  dateFin?: string;

  @ApiPropertyOptional({ minimum: 1, maximum: 50, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  nbPersonnes?: number;

  @ApiPropertyOptional({ enum: TypeLogement })
  @IsOptional()
  @IsEnum(TypeLogement)
  type?: TypeLogement;

  @ApiPropertyOptional({ minimum: 0, example: 100000 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  prixMax?: number;

  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 50, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;
}

