import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsInt, IsNotEmpty, IsUUID, Min } from 'class-validator';

export class CreateReservationDto {
  @ApiProperty({ example: 'uuid-du-logement' })
  @IsUUID()
  @IsNotEmpty()
  logementId!: string;

  @ApiProperty({ example: '2026-06-01' })
  @Type(() => Date)
  @IsDate()
  @IsNotEmpty()
  dateDebut!: Date;

  @ApiProperty({ example: '2026-06-05' })
  @Type(() => Date)
  @IsDate()
  @IsNotEmpty()
  dateFin!: Date;

  @ApiProperty({ example: 2 })
  @IsInt()
  @Min(1)
  nbPersonnes!: number;
}
