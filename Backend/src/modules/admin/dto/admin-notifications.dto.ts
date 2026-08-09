import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CanalNotification, StatutNotification } from '@prisma/client';

export enum CibleNotification {
  ALL = 'ALL',
  HOSTS = 'HOSTS',
  TENANTS = 'TENANTS',
}

export class BroadcastNotificationDto {
  @ApiProperty({ example: 'Nouveau service disponible' })
  @IsString()
  titre!: string;

  @ApiProperty({ example: 'Découvrez la nouvelle fonctionnalité sur Klef !' })
  @IsString()
  message!: string;

  @ApiProperty({ enum: CanalNotification, example: CanalNotification.PUSH })
  @IsEnum(CanalNotification)
  canal!: CanalNotification;

  @ApiProperty({ enum: CibleNotification, example: CibleNotification.ALL })
  @IsEnum(CibleNotification)
  cible!: CibleNotification;
}

export class AdminNotificationsQueryDto {
  @ApiPropertyOptional({ enum: CanalNotification })
  @IsOptional()
  @IsEnum(CanalNotification)
  canal?: CanalNotification;

  @ApiPropertyOptional({ enum: StatutNotification })
  @IsOptional()
  @IsEnum(StatutNotification)
  statut?: StatutNotification;

  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ minimum: 1, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;
}
