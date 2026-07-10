import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';

const E164 = /^\+[1-9]\d{6,14}$/;

export class CompleteOnboardingDto {
  @ApiProperty({ example: 'Mamadou' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  prenom!: string;

  @ApiProperty({ example: 'Diallo' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  nom!: string;

  @ApiProperty({ example: '1998-06-15' })
  @IsDateString()
  dateNaissance!: string;

  @ApiProperty({ example: '+221771234567' })
  @Matches(E164, { message: 'Numéro de téléphone invalide' })
  phone!: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @Matches(/^\d{6}$/, { message: 'Code OTP invalide (6 chiffres attendus)' })
  token!: string;
}
