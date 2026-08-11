import { IsNotEmpty, IsString, IsEnum, IsOptional, IsNumber, Min, Max, MaxLength } from 'class-validator';
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

  @IsOptional()
  @IsNumber({}, { message: 'Le taux de remboursement doit être un nombre' })
  @Min(0, { message: 'Le taux de remboursement ne peut pas être négatif' })
  @Max(100, { message: 'Le taux de remboursement ne peut pas dépasser 100%' })
  tauxRemboursement?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Le montant de compensation doit être un nombre' })
  @Min(0, { message: 'Le montant de compensation ne peut pas être négatif' })
  montantCompensation?: number;
}
