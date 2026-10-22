import { IsEnum, IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';
import { CategoriePhotoEtatLieu, TypeEtatLieu } from '@prisma/client';

export class AddEtatLieuxPhotoDto {
  @IsEnum(TypeEtatLieu)
  type!: TypeEtatLieu;

  @IsEnum(CategoriePhotoEtatLieu)
  categorie!: CategoriePhotoEtatLieu;

  @IsNotEmpty()
  @IsString()
  @Matches(/^https:\/\//, { message: 'La photo doit être une adresse https (serveur d’images), pas un fichier du téléphone.' })
  url!: string;

  @IsOptional()
  @IsString()
  publicId?: string;
}
