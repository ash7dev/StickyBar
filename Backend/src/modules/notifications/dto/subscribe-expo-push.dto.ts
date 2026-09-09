import { IsNotEmpty, IsOptional, IsString, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SubscribeExpoPushDto {
  @ApiProperty({ example: 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]' })
  @IsString()
  @IsNotEmpty()
  expoPushToken!: string;

  @ApiPropertyOptional({ example: 'IOS', description: 'Plateforme mobile (IOS, ANDROID)' })
  @IsOptional()
  @IsString()
  @IsIn(['IOS', 'ANDROID', 'WEB'])
  platform?: string;

  @ApiPropertyOptional({ description: 'ID optionnel de l\'utilisateur' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({ description: 'Modèle ou type d\'appareil (ex: iPhone 14 Pro, Samsung S23)' })
  @IsOptional()
  @IsString()
  deviceType?: string;
}
