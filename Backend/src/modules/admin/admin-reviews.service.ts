import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { AdminReviewsQueryDto } from './dto/admin-reviews-query.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class AdminReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async listReviews(dto: AdminReviewsQueryDto) {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 20;

    const where: Prisma.AvisWhereInput = {
      ...(dto.typeAvis && { typeAvis: dto.typeAvis }),
      ...(dto.minNote && { note: { gte: dto.minNote } }),
      ...(dto.maxNote && { note: { lte: dto.maxNote } }),
      ...(dto.search && {
        OR: [
          { commentaire: { contains: dto.search, mode: 'insensitive' } },
          { auteur: { prenom: { contains: dto.search, mode: 'insensitive' } } },
          { auteur: { nom: { contains: dto.search, mode: 'insensitive' } } },
          { cible: { prenom: { contains: dto.search, mode: 'insensitive' } } },
          { cible: { nom: { contains: dto.search, mode: 'insensitive' } } },
        ],
      }),
    };

    const [total, reviews] = await Promise.all([
      this.prisma.avis.count({ where }),
      this.prisma.avis.findMany({
        where,
        include: {
          auteur: { select: { id: true, prenom: true, nom: true, avatarUrl: true } },
          cible: { select: { id: true, prenom: true, nom: true, avatarUrl: true } },
          logement: { select: { id: true, titre: true, ville: true } },
        },
        orderBy: { creeLe: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      data: reviews,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async deleteReview(id: string) {
    const review = await this.prisma.avis.findUnique({
      where: { id },
    });

    if (!review) throw new NotFoundException(`Avis ${id} introuvable`);

    const { logementId, cibleId } = review;

    await this.prisma.avis.delete({ where: { id } });

    // Recalculer la note moyenne du logement si concerné
    if (logementId) {
      const agg = await this.prisma.avis.aggregate({
        where: { logementId },
        _avg: { note: true },
        _count: { id: true },
      });

      await this.prisma.logement.update({
        where: { id: logementId },
        data: {
          note: agg._avg.note ? Number(agg._avg.note.toFixed(2)) : 0,
          totalAvis: agg._count.id,
        },
      });
    }

    // Recalculer la note moyenne de l'utilisateur cible
    const aggUser = await this.prisma.avis.aggregate({
      where: { cibleId },
      _avg: { note: true },
      _count: { id: true },
    });

    const isCibleHost = (await this.prisma.utilisateur.findUnique({ where: { id: cibleId } }))?.estProprietaire;

    await this.prisma.utilisateur.update({
      where: { id: cibleId },
      data: {
        totalAvis: aggUser._count.id,
        ...(isCibleHost
          ? { noteProprietaire: aggUser._avg.note ? Number(aggUser._avg.note.toFixed(2)) : 0 }
          : { noteLocataire: aggUser._avg.note ? Number(aggUser._avg.note.toFixed(2)) : 0 }),
      },
    });

    return {
      success: true,
      message: `Avis ${id} supprimé et notes dénormalisées réactualisées`,
    };
  }
}
