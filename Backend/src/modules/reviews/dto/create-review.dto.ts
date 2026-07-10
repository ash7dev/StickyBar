import { IsNotEmpty, IsString, IsInt, Min, Max, IsOptional, MaxLength } from 'class-validator';

export class CreateReviewDto {
  @IsNotEmpty({ message: 'L\'identifiant de la réservation est requis' })
  @IsString()
  reservationId!: string;

  @IsNotEmpty({ message: 'La note est obligatoire' })
  @IsInt({ message: 'La note doit être un nombre entier' })
  @Min(1, { message: 'La note minimale est 1' })
  @Max(5, { message: 'La note maximale est 5' })
  note!: number;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Le commentaire ne peut pas dépasser 500 caractères' })
  commentaire?: string;
}
