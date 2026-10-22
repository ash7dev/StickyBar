import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { Role } from '@shared/types/jwt-payload.type';

export class SwitchRoleDto {
  @ApiProperty({ enum: [Role.LOCATAIRE, Role.PROPRIETAIRE, Role.GESTIONNAIRE] })
  @IsEnum([Role.LOCATAIRE, Role.PROPRIETAIRE, Role.GESTIONNAIRE], { message: 'Rôle invalide' })
  role!: Role.LOCATAIRE | Role.PROPRIETAIRE | Role.GESTIONNAIRE;
}
