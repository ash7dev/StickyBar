import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { StatutKyc } from '@prisma/client';

export class AdminUsersQueryDto {
  @ApiPropertyOptional({ description: 'Recherche par nom, prénom, email ou téléphone' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: StatutKyc })
  @IsOptional()
  @IsEnum(StatutKyc)
  statutKyc?: StatutKyc;

  @ApiPropertyOptional({ description: 'Filtrer les utilisateurs propriétaires uniquement' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  estProprietaire?: boolean;

  @ApiPropertyOptional({ description: 'Filtrer les comptes actifs/bloqués' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  actif?: boolean;

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

export class BlockUserDto {
  @ApiPropertyOptional({ default: false, description: 'True pour bloquer le compte, False pour débloquer' })
  @IsBoolean()
  bloquer!: boolean;

  @ApiPropertyOptional({ description: 'Raison ou motif du blocage / déblocage' })
  @IsOptional()
  @IsString()
  raison?: string;
}

export class UpdateUserRoleDto {
  @ApiPropertyOptional({ default: true, description: 'Statut hôte/propriétaire' })
  @IsOptional()
  @IsBoolean()
  estProprietaire?: boolean;
}
