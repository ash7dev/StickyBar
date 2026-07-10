import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { CloudinaryService } from '../../../infrastructure/cloudinary/cloudinary.service';

@Injectable()
export class CleanupEtatLieuxPhotosUseCase {
  private readonly logger = new Logger(CleanupEtatLieuxPhotosUseCase.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinary: CloudinaryService,
  ) {}

  async execute(): Promise<void> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 15);

    const photos = await this.prisma.photoEtatLieu.findMany({
      where: {
        publicId: { not: null },
        reservation: { dateFin: { lt: cutoff } },
      },
      select: { id: true, publicId: true },
    });

    if (photos.length === 0) {
      this.logger.log('[cleanup-etat-lieux] Aucune photo à supprimer');
      return;
    }

    this.logger.log(`[cleanup-etat-lieux] ${photos.length} photo(s) à supprimer`);

    const results = await Promise.allSettled(
      photos.map(p => this.cloudinary.deleteFile(p.publicId!)),
    );

    const deleted = results.filter(r => r.status === 'fulfilled').length;
    const failed  = results.filter(r => r.status === 'rejected').length;

    if (failed > 0) {
      this.logger.warn(`[cleanup-etat-lieux] ${failed} suppression(s) Cloudinary échouée(s)`);
    }

    await this.prisma.photoEtatLieu.deleteMany({
      where: { id: { in: photos.map(p => p.id) } },
    });

    this.logger.log(`[cleanup-etat-lieux] ${deleted} supprimé(s) sur Cloudinary, ${photos.length} enregistrement(s) DB supprimé(s)`);
  }
}
