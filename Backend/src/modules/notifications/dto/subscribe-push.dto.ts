import { IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PushSubscriptionKeysDto {
  @ApiProperty({ example: 'BC8x...key' })
  @IsString()
  @IsNotEmpty()
  p256dh!: string;

  @ApiProperty({ example: 'auth...key' })
  @IsString()
  @IsNotEmpty()
  auth!: string;
}

export class SubscribePushDto {
  @ApiProperty({ example: 'https://fcm.googleapis.com/fcm/send/...' })
  @IsString()
  @IsNotEmpty()
  endpoint!: string;

  @ApiProperty({ type: PushSubscriptionKeysDto })
  @IsObject()
  keys!: PushSubscriptionKeysDto;

  @ApiPropertyOptional({ description: 'ID optionnel de l\'utilisateur' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({ description: 'User agent du navigateur' })
  @IsOptional()
  @IsString()
  userAgent?: string;

  @ApiPropertyOptional({ description: 'Type d\'appareil (desktop, mobile, tablet)' })
  @IsOptional()
  @IsString()
  deviceType?: string;
}
