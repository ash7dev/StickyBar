import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@infrastructure/prisma/prisma.service';
import { CreateIndisponibiliteDto } from './dto/indisponibilite.dto';

@Injectable()
export class CalendrierService {
  constructor(private readonly prisma: PrismaService) {}

  async getCalendrier(logementId: string) {
    const [indisponibilites, reservations] = await Promise.all([
      this.prisma.indisponibiliteLogement.findMany({
        where: { logementId },
        orderBy: { dateDebut: 'asc' },
        select: { id: true, dateDebut: true, dateFin: true, motif: true },
      }),
      this.prisma.reservation.findMany({
        where: {
          logementId,
          statut: { in: ['PENDING', 'PAID', 'CONFIRMED', 'CHECKED_IN'] },
        },
        select: { id: true, dateDebut: true, dateFin: true, statut: true },
      }),
    ]);

    return { indisponibilites, reservations };
  }

  async createIndisponibilite(logementId: string, userId: string, dto: CreateIndisponibiliteDto) {
    await this.assertOwner(logementId, userId);

    const debut = new Date(dto.dateDebut);
    const fin   = new Date(dto.dateFin);

    if (fin < debut) {
      throw new ForbiddenException('La date de fin doit être après la date de début');
    }

    return this.prisma.indisponibiliteLogement.create({
      data: {
        logementId,
        dateDebut: debut,
        dateFin:   fin,
        motif:     dto.motif,
      },
      select: { id: true, dateDebut: true, dateFin: true, motif: true },
    });
  }

  async deleteIndisponibilite(logementId: string, indispoId: string, userId: string) {
    await this.assertOwner(logementId, userId);

    const indispo = await this.prisma.indisponibiliteLogement.findFirst({
      where: { id: indispoId, logementId },
    });
    if (!indispo) throw new NotFoundException('Indisponibilité introuvable');

    await this.prisma.indisponibiliteLogement.delete({ where: { id: indispoId } });
    return { message: 'Indisponibilité supprimée' };
  }

  private async assertOwner(logementId: string, userId: string) {
    const logement = await this.prisma.logement.findUnique({
      where: { id: logementId },
      select: { proprietaireId: true },
    });
    if (!logement) throw new NotFoundException('Logement introuvable');
    if (logement.proprietaireId !== userId) throw new ForbiddenException('Accès refusé');
    return logement;
  }
}
