import { IsInt, IsNumber, IsOptional, Min, ValidateIf } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTarifPersonnesDto {
  @ApiProperty({ minimum: 1 })
  @IsInt()
  @Min(1)
  personnesMin!: number;

  @ApiProperty({ minimum: 1 })
  @IsInt()
  @Min(1)
  personnesMax!: number;

  @ApiProperty({ minimum: 0, description: 'Supplément en FCFA' })
  @IsNumber()
  @Min(0)
  supplement!: number;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  position?: number;
}
