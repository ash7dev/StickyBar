import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, MaxLength, Matches, IsNotEmpty } from 'class-validator';

// E.164 : +[1-9][6-14 chiffres] — format international, pas limité au Sénégal
const E164 = /^\+[1-9]\d{6,14}$/;

export class RegisterDto {
  @ApiProperty({ example: 'Amadou' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  prenom!: string;

  @ApiProperty({ example: 'Diallo' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  nom!: string;

  @ApiProperty({ example: '+221771234567', description: 'Format E.164 international' })
  @Matches(E164, { message: 'Numéro de téléphone invalide. Format attendu : +[indicatif][numéro]' })
  telephone!: string;

  @ApiProperty({ example: 'amadou@example.com' })
  @IsEmail({}, { message: 'Adresse email invalide' })
  email!: string;

  @ApiProperty({ example: 'MotDePasse123!', minLength: 8 })
  @IsString()
  @MinLength(8, { message: 'Mot de passe : 8 caractères minimum' })
  password!: string;
}
