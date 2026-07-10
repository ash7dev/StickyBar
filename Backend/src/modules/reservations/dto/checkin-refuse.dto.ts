import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class CheckinRefuseDto {
  @ApiProperty({ example: 'NON_CONFORMITE', description: 'Motif principal du refus' })
  @IsString()
  @IsNotEmpty()
  motif!: string;

  @ApiProperty({ example: 'L\'état du logement ne correspond pas aux photos de l\'annonce' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  commentaire!: string;
}
