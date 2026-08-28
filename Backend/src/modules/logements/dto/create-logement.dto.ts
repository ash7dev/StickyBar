import {
  IsString,
  IsEnum,
  IsNumber,
  IsBoolean,
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

  @ApiPropertyOptional({ minimum: 10, maximum: 100, default: 30, description: "Pourcentage d'acompte à la réservation" })
  @IsOptional()
  @IsInt()
  @Min(10)
  @Max(100)
  acomptePourcentage?: number;

  @ApiPropertyOptional({ description: "Activer les réductions Dernière Minute (-15% si réservation sous 48h)" })
  @IsOptional()
  @IsBoolean()
  derniereMinuteActive?: boolean;

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

  @ApiPropertyOptional({ maxLength: 100, description: "Nom du réseau Wi-Fi" })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  nomReseauWifi?: string;

  @ApiPropertyOptional({ maxLength: 100, description: "Mot de passe Wi-Fi" })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  codeWifi?: string;

  @ApiPropertyOptional({ maxLength: 500, description: "Instructions Digicode ou accès clés" })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  instructionsDigicode?: string;

  @ApiPropertyOptional({ description: "Régime de prise en charge de l'électricité (INCLUS, FORFAIT_RECHARGE, WOYOFAL_LOCATAIRE)" })
  @IsOptional()
  @IsString()
  regimeElectricite?: string;

  @ApiPropertyOptional({ maxLength: 500, description: "Détails / Précisions sur l'électricité et Woyofal" })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  detailsElectricite?: string;

  @ApiPropertyOptional({ description: "Activer la réservation instantanée sans validation manuelle" })
  @IsOptional()
  @IsBoolean()
  isInstantBooking?: boolean;

  @ApiPropertyOptional({ description: "URL de la vidéo de présentation (Reels 30s)" })
  @IsOptional()
  @IsString()
  videoUrl?: string;

  @ApiPropertyOptional({ description: "Public ID Cloudinary de la vidéo de présentation" })
  @IsOptional()
  @IsString()
  videoPublicId?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  equipementIds?: string[];
}
