import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export enum TypeHoteDto {
  PARTICULIER = 'PARTICULIER',
  AGENCE = 'AGENCE',
}

export class BecomeHostDto {
  @ApiPropertyOptional({ enum: TypeHoteDto, default: 'PARTICULIER' })
  @IsOptional()
  @IsEnum(TypeHoteDto)
  typeHote: TypeHoteDto = TypeHoteDto.PARTICULIER;

  @ApiPropertyOptional({
    example: '12345678901',
    description: 'NINEA (optionnel — des gates frontend guideront vers sa saisie à la création d\'annonce)',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{9,11}[A-Z0-9]{0,2}$/, { message: 'Format NINEA invalide' })
  @MaxLength(20)
  ninea?: string;
}
