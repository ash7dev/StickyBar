import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma, StatutReservation, TypeTransactionWallet } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { parseDay, toDay, monthStart } from '../calendar/day-range';
import { ownedLogements } from '../owner-scope';

const REVENUE_STATUSES: StatutReservation[] = [
  StatutReservation.CONFIRMED,
  StatutReservation.CHECKED_IN,
  StatutReservation.COMPLETED,
];

/**
 * La validation d'un retrait par l'admin crée une seconde transaction DEBIT_RETRAIT
 * qui ne modifie pas le solde (process-withdrawal.use-case). Elle reste visible dans
 * l'historique, mais marquée comme simple trace pour ne pas être lue comme un débit.
 */
const WITHDRAWAL_VALIDATION_PREFIX = 'Retrait validé';

const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;
export const MAX_TRANSACTIONS_PAGE = 50;

export interface StatementStay {
  reservationId: string;
  arrivee: string;
  nbNuits: number;
  locataire: string;
  logementTitre: string;
  /** Payé par le voyageur (prix du séjour + commission Paixi) */
  paye: number;
  commission: number;
  net: number;
}

export interface OwnerStatementResponse {
  month: string;
  range: { start: string; end: string };
  owner: { prenom: string; nom: string };
  stays: StatementStay[];
  totals: { paye: number; commission: number; net: number };
  wallet: {
    opening: number;
    credits: number;
    /** Dettes et pénalités prélevées sur le solde */
    deductions: number;
    withdrawals: number;
    /** Remboursements (dont retraits refusés recrédités) */
    refunds: number;
    closing: number;
  };
}

export interface OwnerTransactionsResponse {
  items: Array<{
    id: string;
    type: TypeTransactionWallet;
    sens: 'CREDIT' | 'DEBIT';
    montant: number;
    soldeApres: number;
    description: string | null;
    reservationId: string | null;
    creeLe: string;
    /** Trace de validation d'un retrait : aucun mouvement de solde */
    isTrace: boolean;
  }>;
  nextCursor: string | null;
}

@Injectable()
export class OwnerStatementService {
  constructor(private readonly prisma: PrismaService) {}

  async getStatement(userId: string, month: string, now: Date = new Date()): Promise<OwnerStatementResponse> {
    if (!MONTH_PATTERN.test(month)) throw new BadRequestException('month doit être au format YYYY-MM');
    const start = `${month}-01`;
    if (start > monthStart(toDay(now))) throw new BadRequestException('Ce mois n’est pas encore commencé');
    const end = monthStart(start, 1);
    const [from, to] = [parseDay(start), parseDay(end)];

    const sumOfType = (types: TypeTransactionWallet[]) =>
      this.prisma.transactionWallet.aggregate({
        where: { wallet: { utilisateurId: userId }, type: { in: types }, creeLe: { gte: from, lt: to } },
        _sum: { montant: true },
      });

    const [owner, reservations, openingTx, closingTx, credits, deductions, refunds, withdrawals] = await Promise.all([
      this.prisma.utilisateur.findUnique({ where: { id: userId }, select: { prenom: true, nom: true } }),
      this.prisma.reservation.findMany({
        where: {
          logement: ownedLogements(userId),
          statut: { in: REVENUE_STATUSES },
          dateDebut: { gte: from, lt: to },
        },
        orderBy: { dateDebut: 'asc' },
        select: {
          id: true,
          dateDebut: true,
          nbNuits: true,
          totalLocataire: true,
          montantCommission: true,
          netProprietaire: true,
          locataire: { select: { prenom: true, nom: true } },
          logement: { select: { titre: true } },
        },
      }),
      this.lastTransactionBefore(userId, from),
      this.lastTransactionBefore(userId, to),
      sumOfType([TypeTransactionWallet.CREDIT_LOCATION]),
      sumOfType([TypeTransactionWallet.DEBIT_DETTE, TypeTransactionWallet.DEBIT_PENALITE]),
      sumOfType([TypeTransactionWallet.REMBOURSEMENT]),
      // Tous les retraits demandés dans le mois, même refusés : un refus est recrédité
      // via une transaction REMBOURSEMENT, comptée dans `refunds`.
      this.prisma.retrait.aggregate({
        where: { wallet: { utilisateurId: userId }, demandeeLe: { gte: from, lt: to } },
        _sum: { montant: true },
      }),
    ]);

    const stays: StatementStay[] = reservations.map((r) => ({
      reservationId: r.id,
      arrivee: toDay(r.dateDebut),
      nbNuits: r.nbNuits,
      locataire: `${r.locataire.prenom} ${r.locataire.nom ? `${r.locataire.nom.charAt(0)}.` : ''}`.trim(),
      logementTitre: r.logement.titre,
      paye: Number(r.totalLocataire),
      commission: Number(r.montantCommission),
      net: Number(r.netProprietaire),
    }));

    const opening = Number(openingTx?.soldeApres ?? 0);
    return {
      month,
      range: { start, end },
      owner: { prenom: owner?.prenom ?? '', nom: owner?.nom ?? '' },
      stays,
      totals: {
        paye: stays.reduce((s, x) => s + x.paye, 0),
        commission: stays.reduce((s, x) => s + x.commission, 0),
        net: stays.reduce((s, x) => s + x.net, 0),
      },
      wallet: {
        opening,
        credits: Number(credits._sum.montant ?? 0),
        deductions: Number(deductions._sum.montant ?? 0),
        withdrawals: Number(withdrawals._sum.montant ?? 0),
        refunds: Number(refunds._sum.montant ?? 0),
        closing: closingTx ? Number(closingTx.soldeApres) : opening,
      },
    };
  }

  /** Relevé au format CSV (séparateur « ; » et BOM UTF-8 : s'ouvre proprement dans Excel en français). */
  async getStatementCsv(userId: string, month: string, now: Date = new Date()): Promise<string> {
    const statement = await this.getStatement(userId, month, now);
    const rows: Array<Array<string | number>> = [
      ['Arrivée', 'Voyageur', 'Bien', 'Nuits', 'Payé par le voyageur (FCFA)', 'Commission Paixi (FCFA)', 'Revenu net (FCFA)'],
      ...statement.stays.map((s) => [s.arrivee, s.locataire, s.logementTitre, s.nbNuits, s.paye, s.commission, s.net]),
      [],
      ['Total', '', '', '', statement.totals.paye, statement.totals.commission, statement.totals.net],
      [],
      ['Solde au début du mois', statement.wallet.opening],
      ['Revenus crédités', statement.wallet.credits],
      ['Dettes et pénalités', -statement.wallet.deductions],
      ['Retraits demandés', -statement.wallet.withdrawals],
      ['Remboursements', statement.wallet.refunds],
      ['Solde en fin de période', statement.wallet.closing],
    ];
    const escape = (v: string | number) => {
      const text = String(v);
      return /[;"\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
    };
    return '﻿' + rows.map((row) => row.map(escape).join(';')).join('\r\n');
  }

  async getTransactions(
    userId: string,
    { cursor, limit = 20, type }: { cursor?: string; limit?: number; type?: TypeTransactionWallet },
  ): Promise<OwnerTransactionsResponse> {
    const take = Math.min(Math.max(limit, 1), MAX_TRANSACTIONS_PAGE);
    const where: Prisma.TransactionWalletWhereInput = {
      wallet: { utilisateurId: userId },
      ...(type ? { type } : {}),
    };
    const rows = await this.prisma.transactionWallet.findMany({
      where,
      orderBy: [{ creeLe: 'desc' }, { id: 'desc' }],
      take: take + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      select: {
        id: true,
        type: true,
        sens: true,
        montant: true,
        soldeApres: true,
        description: true,
        reservationId: true,
        creeLe: true,
      },
    });

    const page = rows.slice(0, take);
    return {
      items: page.map((t) => ({
        id: t.id,
        type: t.type,
        sens: t.sens,
        montant: Number(t.montant),
        soldeApres: Number(t.soldeApres),
        description: t.description,
        reservationId: t.reservationId,
        creeLe: t.creeLe.toISOString(),
        isTrace:
          t.type === TypeTransactionWallet.DEBIT_RETRAIT &&
          (t.description ?? '').startsWith(WITHDRAWAL_VALIDATION_PREFIX),
      })),
      nextCursor: rows.length > take ? page[page.length - 1].id : null,
    };
  }

  private lastTransactionBefore(userId: string, before: Date) {
    return this.prisma.transactionWallet.findFirst({
      where: { wallet: { utilisateurId: userId }, creeLe: { lt: before } },
      orderBy: [{ creeLe: 'desc' }, { id: 'desc' }],
      select: { soldeApres: true },
    });
  }
}
