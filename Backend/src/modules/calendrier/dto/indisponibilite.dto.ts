import { IsDateString, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateIndisponibiliteDto {
  @ApiProperty({ example: '2026-06-01', description: 'Date de début (YYYY-MM-DD)' })
  @IsDateString()
  dateDebut!: string;

  @ApiProperty({ example: '2026-06-05', description: 'Date de fin (YYYY-MM-DD)' })
  @IsDateString()
  dateFin!: string;

  @ApiPropertyOptional({ example: 'Travaux' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  motif?: string;
}
