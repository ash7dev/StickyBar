import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateSecurityDto {
  @ApiPropertyOptional({ example: 'proprietaire@example.com', description: 'Nouvelle adresse email' })
  @IsOptional()
  @IsEmail({}, { message: 'Adresse email invalide' })
  email?: string;

  @ApiPropertyOptional({ example: 'MonMotDePasseFort123!', description: 'Nouveau mot de passe (min 8 caractères)' })
  @IsOptional()
  @IsString()
  @MinLength(8, { message: 'Le mot de passe doit contenir au moins 8 caractères' })
  password?: string;
}
