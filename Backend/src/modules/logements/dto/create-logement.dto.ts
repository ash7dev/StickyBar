import {
  IsString,
  IsEnum,
  IsNumber,
  IsInt,
  IsOptional,
  IsArray,
  IsUUID,
  Min,
  Max,
  MaxLength,
  MinLength,
} from 'class-validator';
import { TypeLogement } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateLogementDto {
  @ApiProperty({ maxLength: 150 })
  @IsString()
  @MaxLength(150)
  titre!: string;

  @ApiProperty({ maxLength: 2000 })
  @IsString()
  @MaxLength(2000)
  description!: string;

  @ApiProperty({ enum: TypeLogement })
  @IsEnum(TypeLogement)
  type!: TypeLogement;

  @ApiPropertyOptional({ maxLength: 100, description: 'Sous-catégorie du logement (ex: Studio, Villa avec piscine…)' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  sousType?: string;

  @ApiProperty({ minimum: 1, maximum: 50 })
  @IsInt()
  @Min(1)
  @Max(50)
  capaciteMax!: number;

  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MaxLength(100)
  ville!: string;

  @ApiProperty({ maxLength: 300 })
  @IsString()
  @MaxLength(300)
  adresse!: string;

  @ApiProperty({ minimum: 0 })
  @IsNumber()
  @Min(0)
  prixBase!: number;

  @ApiProperty({ minimum: 1 })
  @IsInt()
  @Min(1)
  personnesBase!: number;

  @ApiPropertyOptional({ minimum: 1, description: 'Surface du logement' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  surface?: number;

  @ApiPropertyOptional({ minimum: 0, maximum: 20 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(20)
  nombreChambres?: number;

  @ApiPropertyOptional({ minimum: 0, maximum: 20 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(20)
  nombreSallesBain?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 50 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  nombrePieces?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  quartier?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 365 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(365)
  nuitesMinimum?: number;

  @ApiPropertyOptional({ minimum: 18, maximum: 99, default: 18, description: "Âge minimum requis pour réserver" })
  @IsOptional()
  @IsInt()
  @Min(18)
  @Max(99)
  ageMin?: number;

  @ApiPropertyOptional({ maxLength: 2000 })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  reglesMaison?: string;

  @ApiPropertyOptional({ maxLength: 1000 })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  instructionsAcces?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  equipementIds?: string[];
}
