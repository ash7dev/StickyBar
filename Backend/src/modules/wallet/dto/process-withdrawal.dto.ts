import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class RejectWithdrawalDto {
  @ApiPropertyOptional({ example: 'Coordonnées incorrectes' })
  @IsString()
  @IsOptional()
  @MinLength(5, { message: 'La raison doit faire au moins 5 caractères' })
  raisonRejet?: string;
}
