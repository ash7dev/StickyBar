import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class SubmitKycDto {
  @IsNotEmpty({ message: 'L\'URL du recto de la CNI est requise' })
  @IsString()
  kycDocumentUrl!: string;

  @IsNotEmpty({ message: 'Le PublicID du recto de la CNI est requis' })
  @IsString()
  kycDocumentPublicId!: string;

  @IsNotEmpty({ message: 'L\'URL du verso de la CNI est requise' })
  @IsString()
  kycVersoUrl!: string;

  @IsNotEmpty({ message: 'Le PublicID du verso de la CNI est requis' })
  @IsString()
  kycVersoPublicId!: string;
}

export class RejectKycDto {
  @IsNotEmpty({ message: 'La raison du rejet est obligatoire' })
  @IsString()
  reason!: string;
}
