import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { RedisService } from '../../infrastructure/redis/redis.service';
import { AdminUsersQueryDto, BlockUserDto } from './dto/admin-users-query.dto';
import { Prisma, StatutLogement } from '@prisma/client';

@Injectable()
export class AdminUsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async listUsers(dto: AdminUsersQueryDto) {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 20;

    const where: Prisma.UtilisateurWhereInput = {
      ...(dto.statutKyc && { statutKyc: dto.statutKyc }),
      ...(dto.estProprietaire !== undefined && { estProprietaire: dto.estProprietaire }),
      ...(dto.actif !== undefined && { actif: dto.actif }),
      ...(dto.search && {
        OR: [
          { prenom: { contains: dto.search, mode: 'insensitive' } },
          { nom: { contains: dto.search, mode: 'insensitive' } },
          { email: { contains: dto.search, mode: 'insensitive' } },
          { telephone: { contains: dto.search, mode: 'insensitive' } },
        ],
      }),
    };

    const [total, users] = await Promise.all([
      this.prisma.utilisateur.count({ where }),
      this.prisma.utilisateur.findMany({
        where,
        select: {
          id: true,
          userId: true,
          prenom: true,
          nom: true,
          email: true,
          telephone: true,
          avatarUrl: true,
          statutKyc: true,
          actif: true,
          bloqueJusqua: true,
          estProprietaire: true,
          nbAnnulations: true,
          nbAbsencesJourJ: true,
          nbNonConformites: true,
          creeLe: true,
          _count: {
            select: {
              logements: true,
              reservationsLocataire: true,
              reservationsProprietaire: true,
            },
          },
        },
        orderBy: { creeLe: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      data: users,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getUserDetails(id: string) {
    const user = await this.prisma.utilisateur.findUnique({
      where: { id },
      include: {
        profile: true,
        wallet: true,
        logements: {
          select: {
            id: true,
            titre: true,
            type: true,
            ville: true,
            prixBase: true,
            statut: true,
            rejectionReason: true,
            creeLe: true,
          },
        },
        compteursFautes: {
          orderBy: { creeLe: 'desc' },
          take: 20,
        },
      },
    });

    if (!user) throw new NotFoundException(`Utilisateur ${id} introuvable`);
    return user;
  }

  async updateUserStatus(id: string, dto: BlockUserDto) {
    const user = await this.prisma.utilisateur.findUnique({ where: { id } });
    if (!user) throw new NotFoundException(`Utilisateur ${id} introuvable`);

    const updated = await this.prisma.utilisateur.update({
      where: { id },
      data: {
        actif: !dto.bloquer,
        bloqueJusqua: dto.bloquer ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) : null,
      },
    });

    return {
      id: updated.id,
      actif: updated.actif,
      bloqueJusqua: updated.bloqueJusqua,
      message: dto.bloquer ? 'Compte utilisateur bloqué' : 'Compte utilisateur réactivé',
    };
  }

  async resetUserFaults(id: string) {
    const user = await this.prisma.utilisateur.findUnique({ where: { id } });
    if (!user) throw new NotFoundException(`Utilisateur ${id} introuvable`);

    // 1. Réinitialiser les compteurs de fautes et réactiver le compte de l'utilisateur
    await this.prisma.utilisateur.update({
      where: { id },
      data: {
        nbAnnulations: 0,
        nbAbsencesJourJ: 0,
        nbNonConformites: 0,
        actif: true,
        bloqueJusqua: null,
      },
    });

    // 2. Marquer les lignes CompteurFaute comme traitées
    await this.prisma.compteurFaute.updateMany({
      where: { utilisateurId: id, traitee: false },
      data: { traitee: true },
    });

    // 3. Réactiver les logements suspendus de cet hôte
    const updatedLogements = await this.prisma.logement.updateMany({
      where: { proprietaireId: id, statut: StatutLogement.SUSPENDED },
      data: {
        statut: StatutLogement.PUBLISHED,
        rejectionReason: null,
      },
    });

    // 4. Invalider le cache de recherche et d'accueil Redis
    try {
      await this.redis.getClient().incr('listings:search:version');
      await this.redis.del('listings:feed:all');
    } catch {
      // Ignorer si Redis indisponible
    }

    return {
      success: true,
      utilisateurId: id,
      logementsReactives: updatedLogements.count,
      message: 'Compteurs de fautes réinitialisés et logements réactivés avec succès.',
    };
  }

  async updateUserRole(id: string, estProprietaire?: boolean) {
    const user = await this.prisma.utilisateur.findUnique({ where: { id } });
    if (!user) throw new NotFoundException(`Utilisateur ${id} introuvable`);

    const updated = await this.prisma.utilisateur.update({
      where: { id },
      data: {
        ...(estProprietaire !== undefined && { estProprietaire }),
      },
    });

    return {
      id: updated.id,
      estProprietaire: updated.estProprietaire,
      message: 'Rôle de l\'utilisateur mis à jour avec succès',
    };
  }
}
