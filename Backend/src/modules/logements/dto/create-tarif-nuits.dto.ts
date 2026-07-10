import { IsInt, IsNumber, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTarifNuitsDto {
  @ApiProperty({ minimum: 1 })
  @IsInt()
  @Min(1)
  nuitsMin!: number;

  @ApiPropertyOptional({ minimum: 1, description: 'null = open-ended (pas de borne supérieure)' })
  @IsOptional()
  @IsInt()
  @Min(1)
  nuitsMax?: number;

  @ApiProperty({ minimum: 0 })
  @IsNumber()
  @Min(0)
  prix!: number;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  position?: number;
}
