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
import { SubmitKycDto, RejectKycDto, SubmitSelfieDto } from './dto/kyc.dto';

import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class KycService {
  private readonly logger = new Logger(KycService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinary: CloudinaryService,
    private readonly notifications: NotificationsService,
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

  /**
   * Soumission du selfie KYC par l'utilisateur
   */
  async submitSelfie(userId: string, dto: SubmitSelfieDto) {
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

    if (utilisateur.statutKyc !== StatutKyc.EN_ATTENTE) {
      throw new ConflictException('Veuillez d\'abord soumettre vos documents CNI');
    }

    const updated = await this.prisma.utilisateur.update({
      where: { userId },
      data: {
        kycSelfieUrl: dto.kycSelfieUrl,
        kycSelfiePublicId: dto.kycSelfiePublicId,
        selfieFaceDetected: dto.selfieFaceDetected,
        selfieMatchScore: dto.selfieMatchScore ?? null,
        selfieVerifiedAt: new Date(),
        statutKyc: StatutKyc.VERIFIE,
      },
    });

    this.logger.log(`Selfie KYC soumis et validé pour l'utilisateur [${userId}]`);
    return {
      message: 'Selfie KYC validé avec succès, votre compte est maintenant vérifié',
      statut: updated.statutKyc,
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
   * Fiche détaillée d'un KYC pour l'admin avec toutes les URLs signées et métriques selfie
   */
  async getKycDetailsForAdmin(id: string) {
    const user = await this.prisma.utilisateur.findUnique({
      where: { id },
      include: {
        profile: true,
      },
    });

    if (!user) throw new NotFoundException('Utilisateur introuvable');

    return {
      ...user,
      kycDocumentUrl: user.kycDocumentPublicId
        ? this.cloudinary.generateSignedUrl(user.kycDocumentPublicId)
        : user.kycDocumentUrl,
      kycVersoUrl: user.kycVersoPublicId
        ? this.cloudinary.generateSignedUrl(user.kycVersoPublicId)
        : user.kycVersoUrl,
      kycSelfieUrl: user.kycSelfiePublicId
        ? this.cloudinary.generateSignedUrl(user.kycSelfiePublicId)
        : user.kycSelfieUrl,
    };
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
    
    // Notification Push à l'utilisateur
    this.notifications.sendKycPush(user.userId, true)
      .catch((err) => this.logger.error(`Erreur Push KYC verify: ${err.message}`));

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
    
    // Notification Push à l'utilisateur
    this.notifications.sendKycPush(user.userId, false, dto.reason)
      .catch((err) => this.logger.error(`Erreur Push KYC reject: ${err.message}`));

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
    
    // Notification Push à l'utilisateur
    this.notifications.sendKycPush(user.userId, false, 'Votre pièce d\'identité a expiré. Veuillez mettre à jour votre dossier.')
      .catch((err) => this.logger.error(`Erreur Push KYC renewal: ${err.message}`));

    return { message: 'Utilisateur marqué pour renouvellement KYC' };
  }
}
