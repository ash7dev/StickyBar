import { BadRequestException } from '@nestjs/common';
import { Prisma, StatutReservation } from '@prisma/client';
import { lastMonths, periodMonths } from './revenue-period';
import { metricsFor, OwnerRevenueService } from './owner-revenue.service';
import { OwnerStatementService } from './owner-statement.service';

const NOW = new Date('2026-10-19T09:00:00Z');
const d = (day: string) => new Date(`${day}T00:00:00Z`);
const dec = (n: number) => new Prisma.Decimal(n);

function stay(logementId: string, start: string, end: string, net: number, statut: StatutReservation, nbNuits: number) {
  return { logementId, dateDebut: d(start), dateFin: d(end), statut, netProprietaire: dec(net), nbNuits };
}

describe('revenue-period', () => {
  it('découpe les périodes en mois entiers, période précédente de même durée', () => {
    const { current, previous } = periodMonths('quarter', '2026-10-19');
    expect(current.map((m) => m.month)).toEqual(['2026-08', '2026-09', '2026-10']);
    expect(previous.map((m) => m.month)).toEqual(['2026-05', '2026-06', '2026-07']);
    expect(current[2]).toEqual({ month: '2026-10', start: '2026-10-01', end: '2026-11-01' });
  });

  it('remonte 12 mois en traversant les années', () => {
    const months = lastMonths('2026-02-10', 12);
    expect(months[0].month).toBe('2025-03');
    expect(months[11].month).toBe('2026-02');
  });
});

describe('metricsFor', () => {
  const october = lastMonths('2026-10-19', 1);
  const stays = [
    stay('a', '2026-10-02', '2026-10-06', 340_000, 'COMPLETED', 4),
    stay('a', '2026-09-28', '2026-10-02', 200_000, 'COMPLETED', 4), // arrivée en septembre
    stay('b', '2026-10-10', '2026-10-12', 90_000, 'DISPUTED', 2), // occupe, ne rapporte pas
  ];

  it('compte le revenu au mois d’arrivée et l’occupation nuit par nuit', () => {
    const m = metricsFor(october, ['a', 'b'], stays, [{ logementId: 'b', dateDebut: d('2026-10-20'), dateFin: d('2026-10-25') }]);
    expect(m.revenueNet).toBe(340_000);
    expect(m.stays).toBe(1);
    expect(m.netPerNight).toBe(85_000);
    // a : 1 nuit (1er oct.) + 4 ; b : 2 nuits ; disponibles : 31 + (31 − 5)
    expect(m.occupancy).toEqual({ bookedNights: 7, availableNights: 57, rate: 7 / 57 });
    expect(m.nightsSold).toBe(7);
  });

  it('renvoie un revenu par nuit nul sans séjour', () => {
    expect(metricsFor(october, ['a'], [], []).netPerNight).toBeNull();
  });
});

describe('OwnerRevenueService', () => {
  it('assemble période, historique, wallet et chronologie des versements', async () => {
    const prisma = {
      logement: { findMany: jest.fn().mockResolvedValue([{ id: 'a', titre: 'Villa Bahia', ville: 'Dakar' }]) },
      reservation: {
        findMany: jest
          .fn()
          .mockResolvedValueOnce([stay('a', '2026-10-02', '2026-10-06', 340_000, 'COMPLETED', 4)])
          .mockResolvedValueOnce([
            {
              id: 'r-up',
              dateDebut: d('2026-10-21'),
              typePaiement: 'DEPOSIT',
              netProprietaire: dec(255_000),
              montantAcompte: dec(100_000),
              montantCommission: dec(25_000),
              locataire: { prenom: 'Awa' },
              logement: { titre: 'Villa Bahia' },
            },
          ])
          .mockResolvedValueOnce([{ id: 'r-cr', locataire: { prenom: 'Moussa' }, logement: { titre: 'Villa Bahia' } }]),
      },
      indisponibiliteLogement: { findMany: jest.fn().mockResolvedValue([]) },
      wallet: { findUnique: jest.fn().mockResolvedValue({ id: 'w', soldeDisponible: dec(412_500) }) },
      transactionWallet: {
        findMany: jest.fn().mockResolvedValue([{ reservationId: 'r-cr', montant: dec(186_000), creeLe: d('2026-10-19') }]),
      },
      retrait: {
        findMany: jest.fn().mockResolvedValue([
          { montant: dec(300_000), methode: 'WAVE', statut: 'EFFECTUE', demandeeLe: d('2026-10-12') },
        ]),
        aggregate: jest.fn().mockResolvedValue({ _sum: { montant: dec(300_000) } }),
      },
    };

    const result = await new OwnerRevenueService(prisma as never).getRevenue('owner', 'month', NOW);

    expect(result.range).toEqual({ start: '2026-10-01', end: '2026-11-01' });
    expect(result.current.revenueNet).toBe(340_000);
    expect(result.previous.revenueNet).toBe(0);
    expect(result.history).toHaveLength(12);
    expect(result.history.at(-1)).toMatchObject({ month: '2026-10', revenueNet: 340_000 });
    expect(result.historyPreviousYear[0].month).toBe('2024-11');
    expect(result.wallet).toEqual({ available: 412_500, escrow: 75_000, withdrawnThisMonth: 300_000 });
    expect(result.timeline).toEqual([
      { kind: 'UPCOMING', date: '2026-10-21', amount: 75_000, reservationId: 'r-up', locatairePrenom: 'Awa', logementTitre: 'Villa Bahia' },
      { kind: 'CREDITED', date: '2026-10-19', amount: 186_000, reservationId: 'r-cr', locatairePrenom: 'Moussa', logementTitre: 'Villa Bahia' },
      { kind: 'WITHDRAWAL', date: '2026-10-12', amount: 300_000, methode: 'WAVE', statut: 'EFFECTUE' },
    ]);
  });
});

describe('OwnerStatementService', () => {
  function createPrisma() {
    const aggregates = [dec(526_000), dec(10_000), dec(0)]; // crédits, dettes/pénalités, remboursements
    return {
      utilisateur: { findUnique: jest.fn().mockResolvedValue({ prenom: 'Mariama', nom: 'Thiam' }) },
      reservation: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'r1',
            dateDebut: d('2026-10-02'),
            nbNuits: 4,
            totalLocataire: dec(378_000),
            montantCommission: dec(38_000),
            netProprietaire: dec(340_000),
            locataire: { prenom: 'Khady', nom: 'Fall' },
            logement: { titre: 'Villa; Bahia' },
          },
        ]),
      },
      transactionWallet: {
        findFirst: jest
          .fn()
          .mockResolvedValueOnce({ soldeApres: dec(186_500) }) // avant le 1er
          .mockResolvedValueOnce({ soldeApres: dec(402_500) }), // avant le 1er du mois suivant
        aggregate: jest.fn().mockImplementation(() => Promise.resolve({ _sum: { montant: aggregates.shift() } })),
        findMany: jest.fn(),
      },
      retrait: { aggregate: jest.fn().mockResolvedValue({ _sum: { montant: dec(300_000) } }) },
    };
  }

  it('calcule séjours, totaux et mouvements du wallet du mois', async () => {
    const statement = await new OwnerStatementService(createPrisma() as never).getStatement('owner', '2026-10', NOW);

    expect(statement.range).toEqual({ start: '2026-10-01', end: '2026-11-01' });
    expect(statement.stays).toEqual([
      { reservationId: 'r1', arrivee: '2026-10-02', nbNuits: 4, locataire: 'Khady F.', logementTitre: 'Villa; Bahia', paye: 378_000, commission: 38_000, net: 340_000 },
    ]);
    expect(statement.totals).toEqual({ paye: 378_000, commission: 38_000, net: 340_000 });
    expect(statement.wallet).toEqual({
      opening: 186_500,
      credits: 526_000,
      deductions: 10_000,
      withdrawals: 300_000,
      refunds: 0,
      closing: 402_500,
    });
  });

  it('refuse un mois futur ou mal formé', async () => {
    const service = new OwnerStatementService(createPrisma() as never);
    await expect(service.getStatement('owner', '2026-11', NOW)).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.getStatement('owner', '2026-1', NOW)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('produit un CSV lisible par Excel (BOM, « ; », champs échappés)', async () => {
    const service = new OwnerStatementService(createPrisma() as never);
    const csv = await service.getStatementCsv('owner', '2026-10', NOW);
    expect(csv.startsWith('﻿')).toBe(true);
    expect(csv).toContain('2026-10-02;Khady F.;"Villa; Bahia";4;378000;38000;340000');
    expect(csv).toContain('Retraits demandés;-300000');
  });

  it('pagine les transactions et marque la trace de validation d’un retrait', async () => {
    const prisma = createPrisma();
    const tx = (id: string, type: string, description: string) => ({
      id,
      type,
      sens: type.startsWith('DEBIT') ? 'DEBIT' : 'CREDIT',
      montant: dec(1000),
      soldeApres: dec(5000),
      description,
      reservationId: null,
      creeLe: d('2026-10-12'),
    });
    prisma.transactionWallet.findMany.mockResolvedValue([
      tx('t3', 'DEBIT_RETRAIT', 'Retrait validé par admin x via WAVE — 77'),
      tx('t2', 'DEBIT_RETRAIT', 'Demande retrait via WAVE — 77'),
      tx('t1', 'CREDIT_LOCATION', 'Revenu location'),
    ]);

    const page = await new OwnerStatementService(prisma as never).getTransactions('owner', { limit: 2 });

    expect(prisma.transactionWallet.findMany).toHaveBeenCalledWith(expect.objectContaining({ take: 3 }));
    expect(page.items.map((i) => [i.id, i.isTrace])).toEqual([
      ['t3', true],
      ['t2', false],
    ]);
    expect(page.nextCursor).toBe('t2');
  });
});
