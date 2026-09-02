import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { StatutDemandeManaged } from '@prisma/client';

export interface CreateLeadDto {
  prenom: string;
  nom: string;
  telephone: string;
  email?: string;
  ville?: string;
  typeBien?: string;
  nombreLogements?: number;
}

export interface UpdateLeadDto {
  statut?: StatutDemandeManaged;
  notesGestionnaire?: string;
}

@Injectable()
export class ConciergeLeadsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Créer une demande de gestion Klef Managed (public)
   */
  async createLead(dto: CreateLeadDto) {
    if (!dto.prenom || !dto.nom || !dto.telephone) {
      throw new BadRequestException('Le prénom, le nom et le téléphone sont obligatoires.');
    }

    return this.prisma.demandeManaged.create({
      data: {
        prenom: dto.prenom.trim(),
        nom: dto.nom.trim(),
        telephone: dto.telephone.trim(),
        email: dto.email ? dto.email.trim().toLowerCase() : null,
        ville: dto.ville ? dto.ville.trim() : 'Dakar',
        typeBien: dto.typeBien ? dto.typeBien.trim() : 'Appartement',
        nombreLogements: dto.nombreLogements && dto.nombreLogements > 0 ? Number(dto.nombreLogements) : 1,
        statut: 'NOUVEAU',
      },
    });
  }

  /**
   * Récupérer toutes les demandes pour le gestionnaire
   */
  async findAllLeads(statut?: StatutDemandeManaged, query?: string) {
    const where: any = {};

    if (statut) {
      where.statut = statut;
    }

    if (query && query.trim()) {
      const q = query.trim().toLowerCase();
      where.OR = [
        { prenom: { contains: q, mode: 'insensitive' } },
        { nom: { contains: q, mode: 'insensitive' } },
        { telephone: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { ville: { contains: q, mode: 'insensitive' } },
      ];
    }

    return this.prisma.demandeManaged.findMany({
      where,
      orderBy: { creeLe: 'desc' },
    });
  }

  /**
   * Mettre à jour le statut ou les notes d'une demande
   */
  async updateLead(id: string, dto: UpdateLeadDto) {
    const lead = await this.prisma.demandeManaged.findUnique({ where: { id } });
    if (!lead) {
      throw new NotFoundException('Demande non trouvée.');
    }

    return this.prisma.demandeManaged.update({
      where: { id },
      data: {
        statut: dto.statut ?? lead.statut,
        notesGestionnaire: dto.notesGestionnaire !== undefined ? dto.notesGestionnaire : lead.notesGestionnaire,
      },
    });
  }

  /**
   * Convertir une demande prospect en Propriétaire Partenaire en 1 clic
   */
  async convertLeadToOwner(id: string) {
    const lead = await this.prisma.demandeManaged.findUnique({ where: { id } });
    if (!lead) {
      throw new NotFoundException('Demande non trouvée.');
    }

    // Vérifier si l'utilisateur existe déjà avec ce téléphone ou cet email
    let user = await this.prisma.utilisateur.findFirst({
      where: {
        OR: [
          { telephone: lead.telephone },
          ...(lead.email ? [{ email: lead.email }] : []),
        ],
      },
    });

    if (!user) {
      // Créer un compte d'ombre bailleur partenaire
      const generatedEmail = lead.email || `bailleur.${Date.now()}@klef.sn`;
      user = await this.prisma.utilisateur.create({
        data: {
          userId: `shadow_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          prenom: lead.prenom,
          nom: lead.nom,
          telephone: lead.telephone,
          email: generatedEmail,
          estProprietaire: true,
          isShadowAccount: true,
          estGestionnaire: false,
        },
      });
    } else {
      // Marquer comme propriétaire si pas encore le cas
      if (!user.estProprietaire) {
        user = await this.prisma.utilisateur.update({
          where: { id: user.id },
          data: { estProprietaire: true },
        });
      }
    }

    // Mettre à jour la demande
    const updatedLead = await this.prisma.demandeManaged.update({
      where: { id },
      data: {
        statut: 'CONVERTI',
        proprietaireId: user.id,
      },
    });

    return {
      lead: updatedLead,
      owner: user,
    };
  }
}
