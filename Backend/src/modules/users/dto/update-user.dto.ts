import { IsString, IsOptional, MinLength, IsDateString } from 'class-validator';

export class UpdateProfileDto {
  @IsString()
  @IsOptional()
  @MinLength(2)
  prenom?: string;

  @IsString()
  @IsOptional()
  @MinLength(2)
  nom?: string;

  @IsString()
  @IsOptional()
  avatarUrl?: string;

  @IsString()
  @IsOptional()
  telephone?: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsDateString()
  @IsOptional()
  dateNaissance?: string;
}
