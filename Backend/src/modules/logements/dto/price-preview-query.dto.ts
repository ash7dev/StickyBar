import { IsDateString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class PricePreviewQueryDto {
  @ApiProperty({ example: '2025-08-01', description: 'Date de début (ISO 8601)' })
  @IsDateString()
  dateDebut!: string;

  @ApiProperty({ example: '2025-08-06', description: 'Date de fin (ISO 8601)' })
  @IsDateString()
  dateFin!: string;

  @ApiProperty({ example: 3, minimum: 1, maximum: 50 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  nbPersonnes!: number;
}
