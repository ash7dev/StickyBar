import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ContratService {
  private readonly logger = new Logger(ContratService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Mock generation of a rental contract PDF.
   * Simulates generation delay, updates the reservation in the database with mock Cloudinary URLs, and returns the result.
   */
  async generateContract(reservationId: string): Promise<{ url: string; publicId: string }> {
    this.logger.log(`[ContratService] Génération du contrat PDF mock pour la réservation ${reservationId}`);

    // Simuler le temps de génération (ex: compilation de template + upload)
    await new Promise((resolve) => setTimeout(resolve, 300));

    const mockUrl = `https://res.cloudinary.com/immoloc/image/upload/v12345678/contrats/contrat_${reservationId}.pdf`;
    const mockPublicId = `contrats/contrat_${reservationId}`;

    // Mise à jour de la réservation
    await this.prisma.reservation.update({
      where: { id: reservationId },
      data: {
        contratUrl: mockUrl,
        contratPublicId: mockPublicId,
      },
    });

    this.logger.log(`[ContratService] Contrat généré avec succès : ${mockUrl}`);

    return { url: mockUrl, publicId: mockPublicId };
  }
}
