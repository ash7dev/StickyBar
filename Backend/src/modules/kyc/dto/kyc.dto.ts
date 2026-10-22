import { IsBoolean, IsIn, IsNotEmpty, IsString, IsOptional, ValidateIf } from 'class-validator';

/** Pièces acceptées : CNI (recto + verso) ou passeport (page avec la photo). */
export const KYC_DOCUMENT_TYPES = ['CNI', 'PASSEPORT'] as const;
export type KycDocumentType = (typeof KYC_DOCUMENT_TYPES)[number];

export class SubmitKycDto {
  @IsOptional()
  @IsIn(KYC_DOCUMENT_TYPES, { message: 'Pièce acceptée : CNI ou passeport' })
  typeDocument?: KycDocumentType;

  @IsNotEmpty({ message: 'La photo de la pièce est requise' })
  @IsString()
  kycDocumentUrl!: string;

  @IsNotEmpty({ message: 'La photo de la pièce est requise' })
  @IsString()
  kycDocumentPublicId!: string;

  // Le verso n'existe que pour la CNI (type absent = CNI, pour les anciennes versions de l'app)
  @ValidateIf((o: SubmitKycDto) => o.typeDocument !== 'PASSEPORT')
  @IsNotEmpty({ message: 'Le verso de la CNI est requis' })
  @IsString()
  kycVersoUrl?: string;

  @ValidateIf((o: SubmitKycDto) => o.typeDocument !== 'PASSEPORT')
  @IsNotEmpty({ message: 'Le verso de la CNI est requis' })
  @IsString()
  kycVersoPublicId?: string;

  // Selfie envoyé avec la pièce (obligatoire dès que le type est précisé : nouvelles versions des apps)
  @ValidateIf((o: SubmitKycDto) => !!o.typeDocument || !!o.kycSelfieUrl)
  @IsNotEmpty({ message: 'Le selfie est requis' })
  @IsString()
  kycSelfieUrl?: string;

  @ValidateIf((o: SubmitKycDto) => !!o.typeDocument || !!o.kycSelfieUrl)
  @IsNotEmpty({ message: 'Le selfie est requis' })
  @IsString()
  kycSelfiePublicId?: string;

  /** Résultat de la détection de visage faite à l'envoi du selfie (indicatif pour l'admin). */
  @IsOptional()
  @IsBoolean()
  selfieFaceDetected?: boolean;
}

export class RejectKycDto {
  @IsNotEmpty({ message: 'La raison du rejet est obligatoire' })
  @IsString()
  reason!: string;
}

export class SubmitSelfieDto {
  @IsNotEmpty({ message: "L'URL du selfie est requise" })
  @IsString()
  kycSelfieUrl!: string;

  @IsNotEmpty({ message: "Le Public ID du selfie est requis" })
  @IsString()
  kycSelfiePublicId!: string;

  @IsNotEmpty()
  selfieFaceDetected!: boolean;

  @IsOptional()
  selfieMatchScore?: number;
}
