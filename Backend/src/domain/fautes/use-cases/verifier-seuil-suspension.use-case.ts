import { Injectable, Logger } from '@nestjs/common';
import { TypeFaute } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';

const SEUIL: Partial<Record<TypeFaute, number>> = {
  [TypeFaute.ANNULATION_APRES_CONFIRMATION]: 3,
  [TypeFaute.ABSENCE_JOUR_J]: 2,
  [TypeFaute.NON_CONFORMITE_LOGEMENT]: 3,
  [TypeFaute.DEPASSEMENT_PERSONNES]: 5,
};

@Injectable()
export class VerifierSeuilSuspensionUseCase {
  private readonly logger = new Logger(VerifierSeuilSuspensionUseCase.name);

  constructor(private readonly prisma: PrismaService) {}

  async execute(utilisateurId: string, type: TypeFaute): Promise<boolean> {
    const seuil = SEUIL[type];
    if (!seuil) return false;

    const since = new Date();
    since.setFullYear(since.getFullYear() - 1);

    const count = await this.prisma.compteurFaute.count({
      where: { utilisateurId, type, creeLe: { gte: since } },
    });

    if (count >= seuil) {
      await this.prisma.utilisateur.update({
        where: { id: utilisateurId },
        data: { actif: false },
      });
      this.logger.warn(`[VerifierSeuil] Utilisateur ${utilisateurId} suspendu (${count} fautes ${type})`);
      return true;
    }

    return false;
  }
}
