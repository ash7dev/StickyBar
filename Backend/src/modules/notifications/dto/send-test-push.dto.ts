import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SendTestPushDto {
  @ApiPropertyOptional({ description: 'ID de l\'utilisateur cible (optionnel, sinon envoie à l\'appareil courant ou tous)' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({ description: 'Endpoint spécifique si test direct' })
  @IsOptional()
  @IsString()
  endpoint?: string;

  @ApiProperty({ example: 'Klef - Notification Test 🚀' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({ example: 'Votre système de notifications Push Web PWA fonctionne à merveille !' })
  @IsString()
  @IsNotEmpty()
  message!: string;

  @ApiPropertyOptional({ example: '/explorer' })
  @IsOptional()
  @IsString()
  url?: string;
}
