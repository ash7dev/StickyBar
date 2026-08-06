import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { CreateTicketDto, AddTicketMessageDto, UpdateTicketStatusDto } from './dto/support.dto';
import { StatutTicket, RoleLitige } from '@prisma/client';

@Injectable()
export class SupportService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Créer un nouveau ticket de support utilisateur
   */
  async createTicket(userId: string, dto: CreateTicketDto) {
    const user = await this.prisma.utilisateur.findUnique({ where: { userId } });
    if (!user) {
      throw new NotFoundException('Utilisateur introuvable.');
    }

    // Générer un code unique (ex: TCK-84920)
    let code = `TCK-${Math.floor(10000 + Math.random() * 90000)}`;
    let exists = await this.prisma.ticketSupport.findUnique({ where: { code } });
    while (exists) {
      code = `TCK-${Math.floor(10000 + Math.random() * 90000)}`;
      exists = await this.prisma.ticketSupport.findUnique({ where: { code } });
    }

    return this.prisma.ticketSupport.create({
      data: {
        code,
        utilisateurId: user.id,
        sujet: dto.sujet,
        categorie: dto.categorie,
        priorite: dto.priorite,
        reservationId: dto.reservationId,
        logementId: dto.logementId,
        statut: StatutTicket.OUVERT,
        messages: {
          create: {
            auteurId: user.id,
            estAdmin: false,
            message: dto.message,
          },
        },
      },
      include: {
        messages: {
          include: {
            auteur: {
              select: { id: true, prenom: true, nom: true, avatarUrl: true },
            },
          },
        },
      },
    });
  }

  /**
   * Récupérer les tickets de l'utilisateur connecté
   */
  async getTicketsForUser(userId: string) {
    const user = await this.prisma.utilisateur.findUnique({ where: { userId } });
    if (!user) return [];

    return this.prisma.ticketSupport.findMany({
      where: { utilisateurId: user.id },
      orderBy: { creeLe: 'desc' },
      include: {
        messages: {
          orderBy: { creeLe: 'asc' },
          include: {
            auteur: {
              select: { id: true, prenom: true, nom: true, avatarUrl: true },
            },
          },
        },
      },
    });
  }

  /**
   * Détails d'un ticket (avec vérification d'accès)
   */
  async getTicketDetails(ticketId: string, userId: string, isAdmin = false) {
    const ticket = await this.prisma.ticketSupport.findUnique({
      where: { id: ticketId },
      include: {
        utilisateur: {
          select: { id: true, prenom: true, nom: true, email: true, telephone: true, avatarUrl: true },
        },
        messages: {
          orderBy: { creeLe: 'asc' },
          include: {
            auteur: {
              select: { id: true, prenom: true, nom: true, avatarUrl: true },
            },
          },
        },
      },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket introuvable.');
    }

    if (!isAdmin) {
      const user = await this.prisma.utilisateur.findUnique({ where: { userId } });
      if (!user || ticket.utilisateurId !== user.id) {
        throw new ForbiddenException('Vous n\'avez pas accès à ce ticket.');
      }
    }

    return ticket;
  }

  /**
   * Ajouter un message à un ticket
   */
  async addMessage(ticketId: string, userId: string, dto: AddTicketMessageDto, isAdmin = false) {
    const ticket = await this.getTicketDetails(ticketId, userId, isAdmin);
    const user = await this.prisma.utilisateur.findUnique({ where: { userId } });
    if (!user) throw new NotFoundException('Utilisateur non identifié.');

    const newMessage = await this.prisma.ticketMessage.create({
      data: {
        ticketId: ticket.id,
        auteurId: user.id,
        estAdmin: isAdmin,
        message: dto.message,
      },
      include: {
        auteur: {
          select: { id: true, prenom: true, nom: true, avatarUrl: true },
        },
      },
    });

    // Mettre à jour le statut du ticket si réponse admin ou utilisateur
    const newStatut = isAdmin ? StatutTicket.EN_ATTENTE_UTILISATEUR : StatutTicket.EN_COURS;
    await this.prisma.ticketSupport.update({
      where: { id: ticket.id },
      data: {
        statut: ticket.statut === StatutTicket.RESOLU || ticket.statut === StatutTicket.FERME ? ticket.statut : newStatut,
        misAJourLe: new Date(),
      },
    });

    return newMessage;
  }

  /**
   * [ADMIN] Lister tous les tickets avec filtres
   */
  async getAllTicketsAdmin(query: {
    statut?: StatutTicket;
    categorie?: string;
    search?: string;
  }) {
    const where: any = {};

    if (query.statut) {
      where.statut = query.statut;
    }
    if (query.categorie) {
      where.categorie = query.categorie;
    }
    if (query.search) {
      where.OR = [
        { code: { contains: query.search, mode: 'insensitive' } },
        { sujet: { contains: query.search, mode: 'insensitive' } },
        { utilisateur: { nom: { contains: query.search, mode: 'insensitive' } } },
        { utilisateur: { prenom: { contains: query.search, mode: 'insensitive' } } },
        { utilisateur: { email: { contains: query.search, mode: 'insensitive' } } },
      ];
    }

    return this.prisma.ticketSupport.findMany({
      where,
      orderBy: { misAJourLe: 'desc' },
      include: {
        utilisateur: {
          select: { id: true, prenom: true, nom: true, email: true, telephone: true, avatarUrl: true },
        },
        messages: {
          orderBy: { creeLe: 'asc' },
          include: {
            auteur: {
              select: { id: true, prenom: true, nom: true, avatarUrl: true },
            },
          },
        },
      },
    });
  }

  /**
   * [ADMIN] Modifier le statut d'un ticket (Résoudre / Fermer)
   */
  async updateTicketStatusAdmin(ticketId: string, dto: UpdateTicketStatusDto) {
    const ticket = await this.prisma.ticketSupport.findUnique({ where: { id: ticketId } });
    if (!ticket) throw new NotFoundException('Ticket introuvable.');

    const data: any = {
      statut: dto.statut,
      misAJourLe: new Date(),
    };

    if (dto.priorite) {
      data.priorite = dto.priorite;
    }
    if (dto.statut === StatutTicket.RESOLU && !ticket.resoluLe) {
      data.resoluLe = new Date();
    }

    return this.prisma.ticketSupport.update({
      where: { id: ticketId },
      data,
      include: {
        utilisateur: {
          select: { id: true, prenom: true, nom: true, email: true },
        },
      },
    });
  }
}
