import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, IsUrl, Min } from 'class-validator';
import { CategoriePhotoLogement } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddPhotoDto {
  @ApiProperty()
  @IsUrl()
  url!: string;

  @ApiProperty()
  @IsString()
  publicId!: string;

  @ApiProperty({ enum: CategoriePhotoLogement })
  @IsEnum(CategoriePhotoLogement)
  categorie!: CategoriePhotoLogement;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  position?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  estPrincipale?: boolean;
}
