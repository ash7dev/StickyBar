import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { CreditWalletUseCase } from '../../domain/wallet/use-cases/credit-wallet.use-case';
import { RequestWithdrawalUseCase } from '../../domain/wallet/use-cases/request-withdrawal.use-case';
import { ProcessWithdrawalUseCase, ProcessWithdrawalInput } from '../../domain/wallet/use-cases/process-withdrawal.use-case';
import { RequestWithdrawalDto } from './dto/withdrawal.dto';

@Injectable()
export class WalletService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly creditUseCase: CreditWalletUseCase,
    private readonly requestWithdrawalUseCase: RequestWithdrawalUseCase,
    private readonly processWithdrawalUseCase: ProcessWithdrawalUseCase,
  ) {}

  async getMyWallet(userId: string) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { utilisateurId: userId },
      select: {
        id: true,
        soldeDisponible: true,
        dettePenalites: true,
        misAJourLe: true,
        transactions: {
          orderBy: { creeLe: 'desc' },
          take: 20,
          select: {
            id: true,
            type: true,
            montant: true,
            sens: true,
            soldeApres: true,
            description: true,
            reservationId: true,
            creeLe: true,
          },
        },
      },
    });

    // Wallet non encore créé (propriétaire sans réservation)
    if (!wallet) {
      return { soldeDisponible: 0, dettePenalites: 0, transactions: [] };
    }

    const reservationIds = wallet.transactions
      .map((t) => t.reservationId)
      .filter((id): id is string => Boolean(id));

    const reservationsMap = new Map<
      string,
      { typePaiement: string; montantAcompte: number; netProprietaire: number; montantSoldeRestant: number }
    >();

    if (reservationIds.length > 0) {
      const reservations = await this.prisma.reservation.findMany({
        where: { id: { in: reservationIds } },
        select: {
          id: true,
          typePaiement: true,
          montantAcompte: true,
          netProprietaire: true,
          montantSoldeRestant: true,
        },
      });

      for (const r of reservations) {
        reservationsMap.set(r.id, {
          typePaiement: r.typePaiement,
          montantAcompte: Number(r.montantAcompte || 0),
          netProprietaire: Number(r.netProprietaire || 0),
          montantSoldeRestant: Number(r.montantSoldeRestant || 0),
        });
      }
    }

    const transactionsEnriched = wallet.transactions.map((t) => ({
      ...t,
      montant: Number(t.montant || 0),
      soldeApres: Number(t.soldeApres || 0),
      reservation: t.reservationId ? reservationsMap.get(t.reservationId) ?? null : null,
    }));

    // Récupérer toutes les transactions pour ventiler le solde Hôte (revenus) et le solde Client (remboursements)
    const allTransactions = await this.prisma.transactionWallet.findMany({
      where: { walletId: wallet.id },
      select: { type: true, montant: true, sens: true },
    });

    let soldeProprietaire = 0;
    let soldeLocataire = 0;

    for (const t of allTransactions) {
      const m = Number(t.montant || 0);
      if (t.type === 'CREDIT_LOCATION') {
        soldeProprietaire += m;
      } else if (t.type === 'DEBIT_RETRAIT' || t.type === 'DEBIT_PENALITE' || t.type === 'DEBIT_DETTE') {
        soldeProprietaire -= m;
      } else if (t.type === 'REMBOURSEMENT') {
        soldeLocataire += (t.sens === 'CREDIT' ? m : -m);
      }
    }

    soldeProprietaire = Math.max(0, soldeProprietaire);
    soldeLocataire = Math.max(0, soldeLocataire);

    return {
      ...wallet,
      soldeDisponible: Number(wallet.soldeDisponible || 0),
      soldeProprietaire,
      soldeLocataire,
      dettePenalites: Number(wallet.dettePenalites || 0),
      transactions: transactionsEnriched,
    };
  }

  async requestWithdrawal(userId: string, dto: RequestWithdrawalDto) {
    return this.requestWithdrawalUseCase.execute(userId, dto);
  }

  async processWithdrawal(retraitId: string, adminId: string, input: ProcessWithdrawalInput) {
    return this.processWithdrawalUseCase.execute(retraitId, adminId, input);
  }

  async getPendingWithdrawals() {
    return this.prisma.retrait.findMany({
      where: { statut: 'EN_ATTENTE' },
      orderBy: { demandeeLe: 'asc' },
      include: {
        wallet: {
          select: {
            utilisateurId: true,
            utilisateur: {
              select: { id: true, nom: true, prenom: true, telephone: true },
            },
          },
        },
      },
    });
  }

  async getWithdrawalsHistoryForAdmin(statut?: any) {
    return this.prisma.retrait.findMany({
      where: statut ? { statut } : {},
      orderBy: { demandeeLe: 'desc' },
      include: {
        wallet: {
          select: {
            utilisateurId: true,
            utilisateur: {
              select: { id: true, nom: true, prenom: true, telephone: true, email: true },
            },
          },
        },
      },
    });
  }

  async getManagedProprietairesAndWallets(managerId: string) {
    const managedListings = await this.prisma.logement.findMany({
      where: { gestionnaireId: managerId, archiveLe: null },
      select: {
        id: true,
        titre: true,
        ville: true,
        type: true,
        statut: true,
        prixBase: true,
        proprietaireId: true,
        photos: { where: { estPrincipale: true }, select: { url: true }, take: 1 },
      },
    });

    const ownerIds = Array.from(new Set(managedListings.map((l) => l.proprietaireId)));

    if (ownerIds.length === 0) {
      return [];
    }

    const owners = await this.prisma.utilisateur.findMany({
      where: { id: { in: ownerIds } },
      select: {
        id: true,
        prenom: true,
        nom: true,
        telephone: true,
        email: true,
        isShadowAccount: true,
        wallet: {
          select: {
            id: true,
            soldeDisponible: true,
            dettePenalites: true,
            misAJourLe: true,
          },
        },
      },
    });

    return owners.map((owner) => {
      const listings = managedListings.filter((l) => l.proprietaireId === owner.id);
      return {
        ...owner,
        soldeDisponible: Number(owner.wallet?.soldeDisponible || 0),
        dettePenalites: Number(owner.wallet?.dettePenalites || 0),
        logementsCount: listings.length,
        logements: listings,
      };
    });
  }

  async requestWithdrawalForOwner(managerId: string, ownerId: string, dto: RequestWithdrawalDto) {
    // Vérifier que le gestionnaire gère au moins un bien de ce propriétaire
    const isManagerOfOwner = await this.prisma.logement.findFirst({
      where: { gestionnaireId: managerId, proprietaireId: ownerId, archiveLe: null },
    });

    if (!isManagerOfOwner) {
      throw new Error('Vous n’êtes pas le gestionnaire enregistré pour ce propriétaire');
    }

    return this.requestWithdrawalUseCase.execute(ownerId, dto);
  }

  async getAllProprietaires() {
    const owners = await this.prisma.utilisateur.findMany({
      where: {
        logements: {
          some: {
            archiveLe: null,
          },
        },
      },
      select: {
        id: true,
        prenom: true,
        nom: true,
        telephone: true,
        email: true,
        _count: {
          select: { logements: true },
        },
      },
      orderBy: { prenom: 'asc' },
    });

    return owners.map((o) => ({
      id: o.id,
      prenom: o.prenom,
      nom: o.nom,
      telephone: o.telephone,
      email: o.email,
      logementsCount: o._count.logements,
    }));
  }
}
