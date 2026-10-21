import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';

const DAY_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MESSAGE = 'doit être une date au format YYYY-MM-DD';

/** Nombre maximal de logements traités en une requête. */
export const MAX_LOGEMENTS_PER_REQUEST = 50;

export class OwnerCalendarQueryDto {
  @ApiProperty({ example: '2026-10-01', description: 'Premier jour affiché (inclus)' })
  @Matches(DAY_REGEX, { message: `from ${DAY_MESSAGE}` })
  from!: string;

  @ApiProperty({ example: '2026-11-01', description: 'Jour de fin (exclu). Période max : 93 jours' })
  @Matches(DAY_REGEX, { message: `to ${DAY_MESSAGE}` })
  to!: string;

  @ApiPropertyOptional({
    example: 'uuid-1,uuid-2',
    description: 'Filtre sur certains logements (séparés par des virgules). Par défaut : tous',
  })
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.split(',').map((v) => v.trim()).filter(Boolean) : value,
  )
  @IsArray()
  @ArrayMaxSize(MAX_LOGEMENTS_PER_REQUEST)
  @IsUUID('4', { each: true })
  logementIds?: string[];
}

export class CreateOwnerBlockDto {
  @ApiProperty({ type: [String], description: 'Logements à bloquer (même période pour tous)' })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_LOGEMENTS_PER_REQUEST)
  @ArrayUnique()
  @IsUUID('4', { each: true })
  logementIds!: string[];

  @ApiProperty({ example: '2026-12-20', description: 'Premier jour bloqué (inclus)' })
  @Matches(DAY_REGEX, { message: `dateDebut ${DAY_MESSAGE}` })
  dateDebut!: string;

  @ApiProperty({ example: '2026-12-27', description: 'Jour de fin (exclu), comme un départ' })
  @Matches(DAY_REGEX, { message: `dateFin ${DAY_MESSAGE}` })
  dateFin!: string;

  @ApiPropertyOptional({ example: 'Travaux' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  motif?: string;
}
