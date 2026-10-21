import { Prisma, StatutReservation } from '@prisma/client';
import { OwnerOverviewService } from './owner-overview.service';

const NOW = new Date('2026-10-19T09:00:00Z');
const A = 'logement-a';
const B = 'logement-b';
const d = (day: string) => new Date(`${day}T00:00:00Z`);
const dec = (n: number) => new Prisma.Decimal(n);

function stay(logementId: string, start: string, end: string, net: number, statut: StatutReservation, nbNuits = 1) {
  return { logementId, dateDebut: d(start), dateFin: d(end), statut, netProprietaire: dec(net), nbNuits };
}

function createPrisma(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    logement: {
      findMany: jest.fn().mockResolvedValue([
        { id: A, titre: 'Villa Saly', ville: 'Saly', statut: 'PUBLISHED', photos: [{ url: 'a.jpg' }] },
        { id: B, titre: 'Appart Plateau', ville: 'Dakar', statut: 'PUBLISHED', photos: [] },
      ]),
    },
    reservation: {
      findMany: jest
        .fn()
        // 1er appel : séjours de la période
        .mockResolvedValueOnce(
          overrides.stays ?? [
            stay(A, '2026-09-10', '2026-09-12', 100_000, 'COMPLETED', 2),
            stay(A, '2026-10-02', '2026-10-05', 150_000, 'COMPLETED', 3),
            stay(A, '2026-10-21', '2026-10-24', 255_000, 'CONFIRMED', 3),
            stay(B, '2026-10-02', '2026-10-05', 90_000, 'COMPLETED', 3),
            stay(B, '2026-10-23', '2026-10-27', 168_000, 'PAID', 4), // demande : pas de revenu
          ],
        )
        // 2e appel : versements à venir (confirmées)
        .mockResolvedValueOnce([
          {
            id: 'resa-full',
            dateDebut: d('2026-10-21'),
            typePaiement: 'FULL',
            netProprietaire: dec(255_000),
            montantAcompte: null,
            montantCommission: dec(30_000),
            locataire: { prenom: 'Awa' },
            logement: { titre: 'Villa Saly' },
          },
          {
            id: 'resa-deposit',
            dateDebut: d('2026-11-02'),
            typePaiement: 'DEPOSIT',
            netProprietaire: dec(200_000),
            montantAcompte: dec(70_000),
            montantCommission: dec(15_000),
            locataire: { prenom: 'Omar' },
            logement: { titre: 'Appart Plateau' },
          },
        ]),
    },
    indisponibiliteLogement: { findMany: jest.fn().mockResolvedValue([]) },
    wallet: { findUnique: jest.fn().mockResolvedValue({ soldeDisponible: dec(412_500) }) },
    avis: {
      aggregate: jest.fn().mockResolvedValue({ _avg: { note: 4.86 }, _count: { _all: 7 } }),
      findFirst: jest.fn().mockResolvedValue({
        note: 5,
        commentaire: 'Parfait',
        creeLe: d('2026-10-17'),
        auteur: { prenom: 'Khady' },
        logement: { titre: 'Villa Saly' },
      }),
    },
  };
}

describe('OwnerOverviewService', () => {
  it('agrège revenus, occupation, versements, réputation et conseils', async () => {
    const prisma = createPrisma();
    const result = await new OwnerOverviewService(prisma as never).getOverview('owner-1', NOW);

    expect(result.today).toBe('2026-10-19');

    // Revenus par mois d'arrivée : octobre = 150k + 255k + 90k (la demande PAID est exclue)
    expect(result.revenue.monthly.map((m) => m.month)).toEqual([
      '2026-05', '2026-06', '2026-07', '2026-08', '2026-09', '2026-10',
    ]);
    expect(result.revenue.currentMonth).toBe(495_000);
    expect(result.revenue.previousMonth).toBe(100_000);
    expect(result.revenue.changePct).toBe(395);

    // Villa Saly en octobre : 3 + 3 nuits sur 31, 405k sur 6 nuits
    const villa = result.logements.find((l) => l.id === A)!;
    expect(villa.occupancy).toEqual({ bookedNights: 6, availableNights: 31, rate: 6 / 31 });
    expect(villa.revenueNet).toBe(405_000);
    expect(villa.netPerNight).toBe(67_500);
    expect(villa.photoUrl).toBe('a.jpg');

    // Occupation 30 derniers jours (19 sept. → 19 oct.) : 3 nuits par bien, 30 nuits par bien
    expect(result.occupancy).toEqual({ bookedNights: 6, availableNights: 60, rate: 0.1, windowDays: 30 });

    // Séquestre : totalité pour FULL, acompte − commission pour DEPOSIT
    expect(result.wallet).toEqual({
      available: 412_500,
      upcomingTotal: 255_000 + 55_000,
      upcomingPayouts: [
        { reservationId: 'resa-full', date: '2026-10-21', amount: 255_000, locatairePrenom: 'Awa', logementTitre: 'Villa Saly' },
        { reservationId: 'resa-deposit', date: '2026-11-02', amount: 55_000, locatairePrenom: 'Omar', logementTitre: 'Appart Plateau' },
      ],
    });

    expect(result.reputation).toEqual({
      averageRating: 4.9,
      totalReviews: 7,
      lastReview: {
        note: 5,
        commentaire: 'Parfait',
        auteurPrenom: 'Khady',
        logementTitre: 'Villa Saly',
        creeLe: '2026-10-17T00:00:00.000Z',
      },
    });

    // 14 prochaines nuits : Villa 3 occupées → 11 libres ; Plateau 4 (demande) → 10 libres
    expect(result.tips).toEqual([
      { kind: 'LOW_OCCUPANCY', logementId: A, logementTitre: 'Villa Saly', freeNights: 11, horizonDays: 14 },
      { kind: 'LOW_OCCUPANCY', logementId: B, logementTitre: 'Appart Plateau', freeNights: 10, horizonDays: 14 },
    ]);
  });

  it('gère un propriétaire sans historique', async () => {
    const prisma = createPrisma({ stays: [] });
    prisma.reservation.findMany.mockReset().mockResolvedValue([]);
    prisma.wallet.findUnique.mockResolvedValue(null);
    prisma.avis.aggregate.mockResolvedValue({ _avg: { note: null }, _count: { _all: 0 } });
    prisma.avis.findFirst.mockResolvedValue(null);

    const result = await new OwnerOverviewService(prisma as never).getOverview('owner-1', NOW);

    expect(result.revenue.currentMonth).toBe(0);
    expect(result.revenue.changePct).toBeNull();
    expect(result.wallet).toEqual({ available: 0, upcomingTotal: 0, upcomingPayouts: [] });
    expect(result.reputation).toEqual({ averageRating: null, totalReviews: 0, lastReview: null });
    expect(result.logements[0].netPerNight).toBeNull();
  });
});
