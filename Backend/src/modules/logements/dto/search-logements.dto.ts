import { IsDateString, IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { TypeLogement } from '@prisma/client';

export class SearchLogementsDto {
  @ApiPropertyOptional({ example: 'dakar' })
  @IsOptional()
  @IsString()
  ville?: string;

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
