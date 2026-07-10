import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { CategoriePhotoEtatLieu, TypeEtatLieu } from '@prisma/client';

export class AddEtatLieuxPhotoDto {
  @IsEnum(TypeEtatLieu)
  type!: TypeEtatLieu;

  @IsEnum(CategoriePhotoEtatLieu)
  categorie!: CategoriePhotoEtatLieu;

  @IsNotEmpty()
  @IsString()
  url!: string;

  @IsOptional()
  @IsString()
  publicId?: string;
}
