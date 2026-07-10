import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';

const E164 = /^\+[1-9]\d{6,14}$/;

export class VerifyCurrentPhoneSendDto {
  @ApiProperty({ example: '+221771234567' })
  @Matches(E164, { message: 'Numéro de téléphone invalide. Format attendu : +[indicatif][numéro]' })
  phone!: string;
}

export class VerifyCurrentPhoneConfirmDto {
  @ApiProperty({ example: '+221771234567' })
  @Matches(E164, { message: 'Numéro de téléphone invalide' })
  phone!: string;

  @ApiProperty({ example: '123456', description: 'Code OTP reçu par SMS' })
  @IsString()
  @Matches(/^\d{6}$/, { message: 'Code OTP invalide (6 chiffres attendus)' })
  token!: string;
}
