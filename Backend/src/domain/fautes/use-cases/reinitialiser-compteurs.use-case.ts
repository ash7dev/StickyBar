import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';

@Injectable()
export class ReinitialiserCompteursUseCase {
  private readonly logger = new Logger(ReinitialiserCompteursUseCase.name);

  constructor(private readonly prisma: PrismaService) {}

  async execute(): Promise<void> {
    const cutoff = new Date();
    cutoff.setFullYear(cutoff.getFullYear() - 1);

    const { count } = await this.prisma.compteurFaute.deleteMany({
      where: { creeLe: { lt: cutoff } },
    });

    this.logger.log(`[ReinitialiserCompteurs] ${count} faute(s) > 12 mois supprimée(s)`);

    // Réactiver les comptes suspendus dont toutes les fautes récentes ont disparu
    const suspendedUsers = await this.prisma.utilisateur.findMany({
      where: { actif: false, bloqueJusqua: null },
      select: { id: true },
    });

    let reactivated = 0;
    for (const { id } of suspendedUsers) {
      const remaining = await this.prisma.compteurFaute.count({
        where: { utilisateurId: id, creeLe: { gte: cutoff } },
      });
      if (remaining === 0) {
        await this.prisma.utilisateur.update({ where: { id }, data: { actif: true } });
        reactivated++;
      }
    }

    if (reactivated > 0) {
      this.logger.log(`[ReinitialiserCompteurs] ${reactivated} compte(s) réactivé(s)`);
    }
  }
}
