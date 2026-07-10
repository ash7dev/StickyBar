import { IsNotEmpty, IsString, IsEnum, IsOptional, MaxLength } from 'class-validator';
import { MotifLitige, StatutLitige } from '@prisma/client';

export class CreateDisputeDto {
  @IsNotEmpty({ message: 'L\'identifiant de la réservation est requis' })
  @IsString()
  reservationId!: string;

  @IsNotEmpty({ message: 'Le motif du litige est obligatoire' })
  @IsEnum(MotifLitige, { message: 'Motif de litige invalide' })
  motif!: MotifLitige;

  @IsNotEmpty({ message: 'La description est obligatoire' })
  @IsString()
  @MaxLength(1000, { message: 'La description ne peut pas dépasser 1000 caractères' })
  description!: string;
}

export class ResolveDisputeDto {
  @IsNotEmpty({ message: 'Le statut de résolution est obligatoire' })
  @IsEnum([StatutLitige.FONDE, StatutLitige.NON_FONDE], { message: 'Statut de résolution invalide' })
  statut!: StatutLitige;

  @IsNotEmpty({ message: 'La décision admin est obligatoire' })
  @IsString()
  @MaxLength(2000, { message: 'La décision ne peut pas dépasser 2000 caractères' })
  decisionAdmin!: string;
}
