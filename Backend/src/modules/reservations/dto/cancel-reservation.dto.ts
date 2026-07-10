import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class CancelReservationDto {
  @ApiProperty({ example: 'Changement de plans' })
  @IsString()
  @IsNotEmpty({ message: 'La raison de l\'annulation est obligatoire' })
  @MaxLength(500)
  raison!: string;
}
