import { IsString, IsNotEmpty, MinLength, IsDateString } from 'class-validator';

export class UpdateProfileDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  prenom!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  nom!: string;

  @IsDateString()
  @IsNotEmpty()
  dateNaissance!: string;
}

