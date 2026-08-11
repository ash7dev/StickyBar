import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, Length, Matches } from 'class-validator';

export enum OtpChannelType {
  SMS = 'SMS',
  EMAIL = 'EMAIL',
}

export class VerifyRegisterOtpDto {
  @ApiProperty({ example: 'amadou@example.com', required: false })
  @IsOptional()
  @IsEmail({}, { message: 'Adresse email invalide' })
  email?: string;

  @ApiProperty({ example: '+221771234567', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: '123456', description: 'Code OTP à 6 chiffres' })
  @IsString()
  @IsNotEmpty({ message: 'Code OTP obligatoire' })
  @Length(6, 6, { message: 'Le code OTP doit comporter exactement 6 chiffres' })
  @Matches(/^\d{6}$/, { message: 'Chiffres uniquement pour le code OTP' })
  token!: string;

  @ApiProperty({ enum: OtpChannelType, example: OtpChannelType.SMS })
  @IsEnum(OtpChannelType, { message: 'Canal invalide (SMS ou EMAIL)' })
  type!: OtpChannelType;
}
