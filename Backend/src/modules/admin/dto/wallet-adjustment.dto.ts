import { IsEnum, IsNumber, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { SensTransaction } from '@prisma/client';

export class WalletAdjustmentDto {
  @ApiProperty({ description: 'UUID de l\'utilisateur' })
  @IsString()
  utilisateurId!: string;

  @ApiProperty({ example: 10000, description: 'Montant en FCFA' })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  montant!: number;

  @ApiProperty({ enum: SensTransaction, example: SensTransaction.CREDIT })
  @IsEnum(SensTransaction)
  sens!: SensTransaction;

  @ApiProperty({ example: 'Geste commercial suite incident technique', description: 'Libellé explicatif de la régularisation' })
  @IsString()
  description!: string;
}
