import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class RateOwnerDto {
  @ApiProperty({ example: 5, description: 'Note sur 5' })
  @IsInt()
  @Min(1, { message: 'La note doit être comprise entre 1 et 5' })
  @Max(5, { message: 'La note doit être comprise entre 1 et 5' })
  note!: number;

  @ApiProperty({ example: 'Logement conforme, excellent accueil', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  commentaire?: string;
}
