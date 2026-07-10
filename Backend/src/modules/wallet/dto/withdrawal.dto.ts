import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';
import { MethodeRetrait } from '@prisma/client';

export class RequestWithdrawalDto {
  @ApiProperty({ example: 50000, description: 'Montant en FCFA (min 10 000)' })
  @IsNumber()
  @Min(10000, { message: 'Montant minimum : 10 000 FCFA' })
  montant!: number;

  @ApiProperty({ enum: MethodeRetrait, example: MethodeRetrait.WAVE })
  @IsEnum(MethodeRetrait)
  methode!: MethodeRetrait;

  @ApiProperty({ example: '77 123 45 67', description: 'Numéro Wave/OM ou IBAN' })
  @IsString()
  @IsNotEmpty()
  destinataire!: string;
}
