import { IsOptional, IsString, Matches } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ConfirmReservationDto {
  @ApiPropertyOptional({
    description: "Heure de début du séjour au format HH:mm (ex: 14:00). L'heure de fin sera automatiquement fixée à heureDebut + 1h.",
    example: '14:00',
  })
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: "heureDebut doit être au format HH:mm (ex: 14:00)" })
  heureDebut?: string;
}
