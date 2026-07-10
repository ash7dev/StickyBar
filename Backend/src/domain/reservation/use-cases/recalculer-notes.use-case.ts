import { Injectable, Logger } from '@nestjs/common';
import { TypeAvis } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';

@Injectable()
export class RecalculerNotesUseCase {
  private readonly logger = new Logger(RecalculerNotesUseCase.name);

  constructor(private readonly prisma: PrismaService) {}

  async execute(): Promise<void> {
    // noteLocataire = avg des avis laissés par le proprio sur le locataire
    const locataireGroups = await this.prisma.avis.groupBy({
      by: ['cibleId'],
      where: { typeAvis: TypeAvis.PROPRIO_NOTE_LOCATAIRE },
      _avg: { note: true },
    });

    // noteProprietaire = avg des avis laissés par le locataire sur le proprio
    const proprietaireGroups = await this.prisma.avis.groupBy({
      by: ['cibleId'],
      where: { typeAvis: TypeAvis.LOCATAIRE_NOTE_LOGEMENT_ET_PROPRIO },
      _avg: { note: true },
    });

    // note logement = avg des avis associés au logement
    const logementGroups = await this.prisma.avis.groupBy({
      by: ['logementId'],
      where: { logementId: { not: null } },
      _avg: { note: true },
    });

    await Promise.all([
      ...locataireGroups.map(({ cibleId, _avg }) =>
        this.prisma.utilisateur.update({
          where: { id: cibleId },
          data: { noteLocataire: _avg.note ?? 0 },
        }),
      ),
      ...proprietaireGroups.map(({ cibleId, _avg }) =>
        this.prisma.utilisateur.update({
          where: { id: cibleId },
          data: { noteProprietaire: _avg.note ?? 0 },
        }),
      ),
      ...logementGroups
        .filter((g) => g.logementId !== null)
        .map(({ logementId, _avg }) =>
          this.prisma.logement.update({
            where: { id: logementId! },
            data: { note: _avg.note ?? 0 },
          }),
        ),
    ]);

    this.logger.log(
      `[RecalculerNotes] Recalcul terminé — ${locataireGroups.length} locataires, ` +
      `${proprietaireGroups.length} propriétaires, ${logementGroups.length} logements`,
    );
  }
}
