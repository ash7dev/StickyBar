import { IsOptional, IsString, Matches } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ConfirmReservationDto {
  @ApiPropertyOptional({
    description: "Heure de début (check-in) au format HH:mm (ex: 14:00).",
    example: '14:00',
  })
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: "heureDebut doit être au format HH:mm (ex: 14:00)" })
  heureDebut?: string;

  @ApiPropertyOptional({
    description: "Heure de fin (check-out) au format HH:mm (ex: 12:00).",
    example: '12:00',
  })
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: "heureFin doit être au format HH:mm (ex: 12:00)" })
  heureFin?: string;
}
