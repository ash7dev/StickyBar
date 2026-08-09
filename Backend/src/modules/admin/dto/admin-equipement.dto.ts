import { IsEnum, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CategorieEquipement } from '@prisma/client';

export class CreateEquipementDto {
  @ApiProperty({ example: 'Climatisation Inverter' })
  @IsString()
  nom!: string;

  @ApiProperty({ enum: CategorieEquipement, example: CategorieEquipement.CONFORT })
  @IsEnum(CategorieEquipement)
  categorie!: CategorieEquipement;
}

export class UpdateEquipementDto {
  @ApiProperty({ example: 'Climatisation Inverter Pro' })
  @IsString()
  nom?: string;

  @ApiProperty({ enum: CategorieEquipement, example: CategorieEquipement.CONFORT })
  @IsEnum(CategorieEquipement)
  categorie?: CategorieEquipement;
}
