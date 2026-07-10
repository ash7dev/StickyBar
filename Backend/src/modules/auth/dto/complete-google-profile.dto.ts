import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength, Matches } from 'class-validator';

const E164 = /^\+[1-9]\d{6,14}$/;

export class CompleteGoogleProfileDto {
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

  @ApiProperty({ example: '+221771234567' })
  @Matches(E164, { message: 'Numéro de téléphone invalide' })
  telephone!: string;
}
