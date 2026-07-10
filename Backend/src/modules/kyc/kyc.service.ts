import { 
  ConflictException, 
  ForbiddenException, 
  Injectable, 
  Logger, 
  NotFoundException, 
  UnprocessableEntityException 
} from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { CloudinaryService } from '../../infrastructure/cloudinary/cloudinary.service';
import { StatutKyc } from '@prisma/client';
import { SubmitKycDto, RejectKycDto } from './dto/kyc.dto';

@Injectable()
export class KycService {
  private readonly logger = new Logger(KycService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinary: CloudinaryService,
  ) {}

  /**
   * Soumission du dossier KYC par l'utilisateur
   */
  async submit(userId: string, dto: SubmitKycDto) {
    const utilisateur = await this.prisma.utilisateur.findUnique({
      where: { userId },
      select: { statutKyc: true },
    });

    if (!utilisateur) {
      throw new NotFoundException('Utilisateur introuvable');
    }

    if (utilisateur.statutKyc === StatutKyc.VERIFIE) {
      throw new ConflictException('Votre compte est déjà vérifié');
    }

    const updated = await this.prisma.utilisateur.update({
      where: { userId },
      data: {
        kycDocumentUrl: dto.kycDocumentUrl,
        kycDocumentPublicId: dto.kycDocumentPublicId,
        kycVersoUrl: dto.kycVersoUrl,
        kycVersoPublicId: dto.kycVersoPublicId,
        statutKyc: StatutKyc.EN_ATTENTE,
        kycRejectionReason: null, // Reset de la raison si nouvelle soumission
      },
    });

    this.logger.log(`KYC soumis pour l'utilisateur [${userId}]`);
    return { 
      message: 'Dossier KYC soumis avec succès, en attente de validation',
      statut: updated.statutKyc 
    };
  }

  async getStatus(userId: string) {
    const utilisateur = await this.prisma.utilisateur.findUnique({
      where: { userId },
      select: {
        statutKyc: true,
        kycRejectionReason: true,
      },
    });

    if (!utilisateur) {
      throw new NotFoundException('Utilisateur introuvable');
    }

    return utilisateur;
  }

  /**
   * Liste des KYC pour l'admin avec URLs signées
   */
  async listForAdmin(statut?: StatutKyc) {
    const users = await this.prisma.utilisateur.findMany({
      where: {
        statutKyc: statut || { not: StatutKyc.NON_VERIFIE },
      },
      select: {
        id: true,
        userId: true,
        prenom: true,
        nom: true,
        email: true,
        telephone: true,
        statutKyc: true,
        kycDocumentUrl: true,
        kycDocumentPublicId: true,
        kycVersoUrl: true,
        kycVersoPublicId: true,
        kycRejectionReason: true,
        creeLe: true,
      },
      orderBy: { misAJourLe: 'desc' },
    });

    // Générer des URLs signées pour les documents
    return users.map(user => ({
      ...user,
      kycDocumentUrl: user.kycDocumentPublicId 
        ? this.cloudinary.generateSignedUrl(user.kycDocumentPublicId) 
        : null,
      kycVersoUrl: user.kycVersoPublicId 
        ? this.cloudinary.generateSignedUrl(user.kycVersoPublicId) 
        : null,
    }));
  }

  /**
   * Valider un KYC
   */
  async verify(id: string) {
    const user = await this.prisma.utilisateur.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Utilisateur introuvable');

    await this.prisma.utilisateur.update({
      where: { id },
      data: { statutKyc: StatutKyc.VERIFIE },
    });

    this.logger.log(`KYC VERIFIE pour l'utilisateur [${id}]`);
    
    // TODO: Envoyer notification WhatsApp
    return { message: 'KYC validé avec succès' };
  }

  /**
   * Rejeter un KYC
   */
  async reject(id: string, dto: RejectKycDto) {
    const user = await this.prisma.utilisateur.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Utilisateur introuvable');

    await this.prisma.utilisateur.update({
      where: { id },
      data: { 
        statutKyc: StatutKyc.REJETE,
        kycRejectionReason: dto.reason,
      },
    });

    this.logger.log(`KYC REJETE pour l'utilisateur [${id}]. Raison: ${dto.reason}`);
    
    // TODO: Envoyer notification WhatsApp
    return { message: 'KYC rejeté avec succès' };
  }

  /**
   * Marquer un KYC pour renouvellement (expiration)
   */
  async flagRenewal(id: string) {
    const user = await this.prisma.utilisateur.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Utilisateur introuvable');

    await this.prisma.utilisateur.update({
      where: { id },
      data: { statutKyc: StatutKyc.A_RENOUVELER },
    });

    this.logger.log(`KYC marqué A_RENOUVELER pour l'utilisateur [${id}]`);
    
    // TODO: Envoyer notification WhatsApp
    return { message: 'Utilisateur marqué pour renouvellement KYC' };
  }
}
