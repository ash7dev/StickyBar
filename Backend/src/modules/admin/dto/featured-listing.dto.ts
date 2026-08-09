import { IsBoolean, IsInt, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class FeaturedListingDto {
  @ApiPropertyOptional({ default: true, description: 'Mettre en vedette (true) ou retirer (false)' })
  @IsBoolean()
  isFeatured!: boolean;

  @ApiPropertyOptional({ default: 30, description: 'Durée du boost en jours' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  durationDays?: number = 30;
}
