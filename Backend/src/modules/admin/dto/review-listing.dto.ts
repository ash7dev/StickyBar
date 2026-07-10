import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ReviewListingDto {
  @ApiPropertyOptional({ example: 'Photos non conformes à la réalité du logement' })
  @IsOptional()
  @IsString()
  @MinLength(10)
  @MaxLength(500)
  raison?: string;
}
