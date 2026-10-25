import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { CreditWalletUseCase } from '../../domain/wallet/use-cases/credit-wallet.use-case';
import { RequestWithdrawalUseCase } from '../../domain/wallet/use-cases/request-withdrawal.use-case';
import { ProcessWithdrawalUseCase, ProcessWithdrawalInput } from '../../domain/wallet/use-cases/process-withdrawal.use-case';
import { RequestWithdrawalDto } from './dto/withdrawal.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class WalletService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly creditUseCase: CreditWalletUseCase,
    private readonly requestWithdrawalUseCase: RequestWithdrawalUseCase,
    private readonly processWithdrawalUseCase: ProcessWithdrawalUseCase,
    private readonly notifications: NotificationsService,
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
      return { soldeDisponible: 0, soldeGeleLitige: 0, soldeRetirable: 0, dettePenalites: 0, transactions: [] };
    }

    // Calcul du solde gelé à titre conservatoire pour litiges en cours
    const litigesEnAttente = await this.prisma.litige.findMany({
      where: {
        statut: 'EN_ATTENTE',
        reservation: { proprietaireId: userId },
      },
      include: {
        reservation: {
          select: {
            netProprietaire: true,
            typePaiement: true,
            montantAcompte: true,
            montantCommission: true,
          },
        },
      },
    });

    let soldeGeleLitige = 0;
    for (const litige of litigesEnAttente) {
      const r = litige.reservation;
      const isDeposit = r.typePaiement?.toUpperCase() === 'DEPOSIT';
      const commNum = Number(r.montantCommission || 0);
      soldeGeleLitige += isDeposit
        ? Math.max(0, Number(r.montantAcompte || 0) - commNum)
        : Number(r.netProprietaire || 0);
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

    const soldeDisponibleNum = Number(wallet.soldeDisponible || 0);
    const dettePenalitesNum = Number(wallet.dettePenalites || 0);
    const soldeRetirable = Math.max(0, soldeDisponibleNum - soldeGeleLitige - dettePenalitesNum);

    return {
      ...wallet,
      soldeDisponible: soldeDisponibleNum,
      soldeGeleLitige,
      soldeRetirable,
      soldeProprietaire,
      soldeLocataire,
      dettePenalites: dettePenalitesNum,
      transactions: transactionsEnriched,
    };
  }

  async requestWithdrawal(userId: string, dto: RequestWithdrawalDto) {
    const res = await this.requestWithdrawalUseCase.execute(userId, dto);
    this.notifications.sendWalletPush(
      userId,
      dto.montant,
      false,
      `Demande de retrait via ${dto.methode}`
    ).catch(() => {});
    return res;
  }

  async processWithdrawal(retraitId: string, adminId: string, input: ProcessWithdrawalInput) {
    return this.processWithdrawalUseCase.execute(retraitId, adminId, input);
  }

  /**
   * Contrôle admin : qui a demandé le retrait (propriétaire ou gestionnaire) et s'il part
   * vers un autre numéro que celui du titulaire. Ce sont les retraits à vérifier en priorité.
   */
  private async withRequester<T extends { demandeParId: string | null; destinataire: string; wallet: { utilisateurId: string; utilisateur: { telephone: string | null } | null } }>(rows: T[]) {
    const ids = [...new Set(rows.map((r) => r.demandeParId).filter((id): id is string => !!id))];
    const people = ids.length
      ? await this.prisma.utilisateur.findMany({ where: { id: { in: ids } }, select: { id: true, prenom: true, nom: true } })
      : [];
    const byId = new Map(people.map((p) => [p.id, p]));
    const digits = (v?: string | null) => (v ?? '').split(' (')[0].replace(/\D/g, '').replace(/^221/, '');
    return rows.map((r) => {
      const parGestionnaire = !!r.demandeParId && r.demandeParId !== r.wallet.utilisateurId;
      return {
        ...r,
        demandePar: r.demandeParId ? byId.get(r.demandeParId) ?? null : null,
        parGestionnaire,
        versTiers: !!r.wallet.utilisateur?.telephone && digits(r.destinataire) !== digits(r.wallet.utilisateur.telephone),
      };
    });
  }

  async getPendingWithdrawals() {
    const rows = await this.prisma.retrait.findMany({
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
    return this.withRequester(rows);
  }

  async getWithdrawalsHistoryForAdmin(statut?: any) {
    const rows = await this.prisma.retrait.findMany({
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
    return this.withRequester(rows);
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

    // Récupérer les litiges en cours pour tous ces propriétaires
    const activeDisputes = await this.prisma.litige.findMany({
      where: {
        statut: 'EN_ATTENTE',
        reservation: { proprietaireId: { in: ownerIds } },
      },
      select: {
        reservation: {
          select: {
            proprietaireId: true,
            netProprietaire: true,
            typePaiement: true,
            montantAcompte: true,
            montantCommission: true,
          },
        },
      },
    });

    const geleMap = new Map<string, number>();
    for (const d of activeDisputes) {
      const r = d.reservation;
      const ownerId = r.proprietaireId;
      const isDeposit = r.typePaiement?.toUpperCase() === 'DEPOSIT';
      const commNum = Number(r.montantCommission || 0);
      const montantImpacte = isDeposit
        ? Math.max(0, Number(r.montantAcompte || 0) - commNum)
        : Number(r.netProprietaire || 0);

      const currentGele = geleMap.get(ownerId) || 0;
      geleMap.set(ownerId, currentGele + montantImpacte);
    }

    return owners.map((owner) => {
      const listings = managedListings.filter((l) => l.proprietaireId === owner.id);
      const soldeDispoNum = Number(owner.wallet?.soldeDisponible || 0);
      const dettePenalitesNum = Number(owner.wallet?.dettePenalites || 0);
      const soldeGeleLitige = geleMap.get(owner.id) || 0;
      const soldeRetirable = Math.max(0, soldeDispoNum - soldeGeleLitige - dettePenalitesNum);

      return {
        ...owner,
        soldeDisponible: soldeDispoNum,
        soldeGeleLitige,
        soldeRetirable,
        dettePenalites: dettePenalitesNum,
        logementsCount: listings.length,
        logements: listings,
      };
    });
  }

  async requestWithdrawalForOwner(managerId: string, ownerId: string, dto: RequestWithdrawalDto) {
    // Vérifier que le gestionnaire gère au moins un bien de ce propriétaire
    const isManagerOfOwner = await this.prisma.logement.findFirst({
      where: { gestionnaireId: managerId, proprietaireId: ownerId, archiveLe: null },
      select: { id: true },
    });
    if (!isManagerOfOwner) {
      throw new ForbiddenException('Vous n’êtes pas le gestionnaire enregistré pour ce propriétaire');
    }

    // Plafond : le solde retirable (hors fonds gelés par un litige et pénalités dues)
    const [owner] = await this.getManagedProprietairesAndWallets(managerId).then((all) => all.filter((o) => o.id === ownerId));
    if (owner && dto.montant > owner.soldeRetirable) {
      throw new BadRequestException(
        `Montant supérieur au solde retirable (${owner.soldeRetirable.toLocaleString('fr-FR')} FCFA)`,
      );
    }

    // Un autre numéro que celui du propriétaire (un proche, par exemple) est permis, mais nommé :
    // c'est le seul cas où l'argent ne va pas au titulaire, le propriétaire doit savoir à qui.
    const digits = (v?: string | null) => (v ?? '').replace(/\D/g, '').replace(/^221/, '');
    const toOwner = !!owner?.telephone && digits(owner.telephone) === digits(dto.destinataire);
    const beneficiaire = dto.beneficiaire?.trim();
    if (!toOwner && dto.methode !== 'VIREMENT' && !beneficiaire) {
      throw new BadRequestException('Indiquez le nom du bénéficiaire : ce numéro n’est pas celui du propriétaire');
    }
    const destinataire = toOwner || !beneficiaire ? dto.destinataire : `${dto.destinataire} (${beneficiaire})`;

    const retrait = await this.requestWithdrawalUseCase.execute(ownerId, {
      montant: dto.montant,
      methode: dto.methode,
      destinataire,
      demandeParId: managerId,
    });

    const via = dto.methode === 'WAVE' ? 'Wave' : dto.methode === 'ORANGE_MONEY' ? 'Orange Money' : 'virement';
    const masked = `${digits(dto.destinataire).slice(0, 2)} ••• •• ${digits(dto.destinataire).slice(-2)}`;
    this.notifications
      .sendReservationPush(
        ownerId,
        'Reversement demandé par votre gestionnaire',
        toOwner
          ? `${dto.montant.toLocaleString('fr-FR')} FCFA vont être versés sur votre ${via}.`
          : `${dto.montant.toLocaleString('fr-FR')} FCFA vont être versés via ${via} à ${beneficiaire} (${masked}). Pas d’accord ? Contactez Paixi.`,
        '/(owner)/wallet',
      )
      .catch(() => {});

    return retrait;
  }

  /** Fiche d'un propriétaire géré : solde et derniers reversements (avec leur auteur). */
  async getManagedOwnerDetail(managerId: string, ownerId: string) {
    const managed = await this.getManagedProprietairesAndWallets(managerId);
    const owner = managed.find((o) => o.id === ownerId);
    if (!owner) throw new ForbiddenException('Vous n’êtes pas le gestionnaire enregistré pour ce propriétaire');

    const [user, retraits] = await Promise.all([
      this.prisma.utilisateur.findUnique({ where: { id: ownerId }, select: { creeLe: true } }),
      this.prisma.retrait.findMany({
        where: { wallet: { utilisateurId: ownerId } },
        orderBy: { demandeeLe: 'desc' },
        take: 10,
        select: { id: true, montant: true, methode: true, destinataire: true, statut: true, demandeeLe: true, traiteLe: true, demandeParId: true },
      }),
    ]);

    return {
      ...owner,
      creeLe: user?.creeLe ?? null,
      retraits: retraits.map((r) => ({ ...r, montant: Number(r.montant) })),
    };
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
