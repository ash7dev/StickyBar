import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class SignalTenantNoshowDto {
  @ApiProperty({
    example: 'Aucune réponse aux appels, SMS non lus depuis 2h',
    required: false
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  commentaire?: string;
}
