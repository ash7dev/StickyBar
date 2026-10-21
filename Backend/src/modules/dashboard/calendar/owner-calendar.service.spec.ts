import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma, StatutReservation } from '@prisma/client';
import { addDays, parseDay, toDay } from './day-range';
import { OwnerCalendarService } from './owner-calendar.service';

const OWNER = 'owner-1';
const LOGEMENT_A = '11111111-1111-4111-8111-111111111111';
const LOGEMENT_B = '22222222-2222-4222-8222-222222222222';

const today = toDay(new Date());
const day = (offset: number) => addDays(today, offset);

function createPrismaMock() {
  const prisma = {
    logement: { findMany: jest.fn() },
    reservation: { findMany: jest.fn() },
    indisponibiliteLogement: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };
  prisma.$transaction.mockImplementation((fn: (tx: typeof prisma) => unknown) => fn(prisma));
  prisma.indisponibiliteLogement.create.mockImplementation(({ data }) =>
    Promise.resolve({ id: 'new-block', ...data }),
  );
  return prisma;
}

describe('OwnerCalendarService', () => {
  let prisma: ReturnType<typeof createPrismaMock>;
  let service: OwnerCalendarService;

  beforeEach(() => {
    prisma = createPrismaMock();
    service = new OwnerCalendarService(prisma as never);
  });

  describe('getCalendar', () => {
    it('limite toutes les lectures aux logements de l’utilisateur (propriétaire ou gestionnaire)', async () => {
      prisma.logement.findMany.mockResolvedValue([]);
      prisma.reservation.findMany.mockResolvedValue([]);
      prisma.indisponibiliteLogement.findMany.mockResolvedValue([]);
      const scope = { archiveLe: null, OR: [{ proprietaireId: OWNER }, { gestionnaireId: OWNER }] };

      const result = await service.getCalendar(OWNER, { from: '2026-10-01', to: '2026-11-01' });

      expect(result).toEqual({ range: { start: '2026-10-01', end: '2026-11-01' }, logements: [], events: [] });
      expect(prisma.logement.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: scope }));
      expect(prisma.reservation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ logement: scope }) }),
      );
      expect(prisma.indisponibiliteLogement.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ logement: scope }) }),
      );
    });

    it('renvoie des jours YYYY-MM-DD et masque le nom de famille du locataire', async () => {
      prisma.logement.findMany.mockResolvedValue([
        {
          id: LOGEMENT_A,
          titre: 'Villa Saly',
          ville: 'Saly',
          statut: 'PUBLISHED',
          prixBase: new Prisma.Decimal(45000),
          photos: [{ url: 'https://img/a.jpg' }],
        },
      ]);
      prisma.reservation.findMany.mockResolvedValue([
        {
          id: 'resa-1',
          logementId: LOGEMENT_A,
          dateDebut: new Date('2026-10-10T14:00:00Z'),
          dateFin: new Date('2026-10-13T11:00:00Z'),
          statut: StatutReservation.CONFIRMED,
          nbNuits: 3,
          nbPersonnes: 2,
          netProprietaire: new Prisma.Decimal(121500),
          locataire: { prenom: 'Awa', nom: 'Ndiaye', avatarUrl: null },
        },
      ]);
      prisma.indisponibiliteLogement.findMany.mockResolvedValue([
        {
          id: 'block-1',
          logementId: LOGEMENT_A,
          dateDebut: parseDay('2026-10-20'),
          dateFin: parseDay('2026-10-22'),
          motif: 'Travaux',
        },
      ]);

      const result = await service.getCalendar(OWNER, { from: '2026-10-01', to: '2026-11-01' });

      expect(result.logements).toEqual([
        {
          id: LOGEMENT_A,
          titre: 'Villa Saly',
          ville: 'Saly',
          statut: 'PUBLISHED',
          prixBase: 45000,
          photoUrl: 'https://img/a.jpg',
        },
      ]);
      expect(result.events).toEqual([
        expect.objectContaining({
          kind: 'RESERVATION',
          start: '2026-10-10',
          end: '2026-10-13',
          netProprietaire: 121500,
          locataire: { prenom: 'Awa', nomInitiale: 'N.', avatarUrl: null },
        }),
        { kind: 'BLOCK', id: 'block-1', logementId: LOGEMENT_A, start: '2026-10-20', end: '2026-10-22', motif: 'Travaux' },
      ]);
    });

    it.each([
      ['fin avant début', '2026-10-10', '2026-10-01'],
      ['période vide', '2026-10-10', '2026-10-10'],
      ['période trop longue', '2026-01-01', '2026-06-01'],
      ['date impossible', '2026-02-30', '2026-03-10'],
    ])('rejette une période invalide (%s)', async (_label, from, to) => {
      await expect(service.getCalendar(OWNER, { from, to })).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('createBlocks', () => {
    const ownedLogements = [
      { id: LOGEMENT_A, titre: 'Villa Saly' },
      { id: LOGEMENT_B, titre: 'Studio Almadies' },
    ];

    beforeEach(() => {
      prisma.logement.findMany.mockResolvedValue(ownedLogements);
      prisma.reservation.findMany.mockResolvedValue([]);
      prisma.indisponibiliteLogement.findMany.mockResolvedValue([]);
    });

    it('crée un blocage par logement', async () => {
      const result = await service.createBlocks(OWNER, {
        logementIds: [LOGEMENT_A, LOGEMENT_B],
        dateDebut: day(10),
        dateFin: day(15),
        motif: '  Travaux  ',
      });

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({ kind: 'BLOCK', start: day(10), end: day(15), motif: 'Travaux' });
      expect(prisma.indisponibiliteLogement.create).toHaveBeenCalledTimes(2);
    });

    it('refuse tout (409) si un des logements est réservé sur la période', async () => {
      prisma.reservation.findMany.mockResolvedValue([
        { logementId: LOGEMENT_B, dateDebut: parseDay(day(12)), dateFin: parseDay(day(14)) },
      ]);

      await expect(
        service.createBlocks(OWNER, { logementIds: [LOGEMENT_A, LOGEMENT_B], dateDebut: day(10), dateFin: day(15) }),
      ).rejects.toThrow(new ConflictException(`Dates déjà réservées : Studio Almadies (${day(12)} → ${day(14)})`));
      expect(prisma.indisponibiliteLogement.create).not.toHaveBeenCalled();
    });

    it('accepte un blocage qui commence le jour du départ d’un locataire', async () => {
      prisma.reservation.findMany.mockResolvedValue([
        { logementId: LOGEMENT_A, dateDebut: new Date(`${day(5)}T14:00:00Z`), dateFin: new Date(`${day(10)}T11:00:00Z`) },
      ]);

      await expect(
        service.createBlocks(OWNER, { logementIds: [LOGEMENT_A, LOGEMENT_B], dateDebut: day(10), dateFin: day(12) }),
      ).resolves.toHaveLength(2);
    });

    it('fusionne avec les blocages adjacents ou chevauchants et conserve leur motif', async () => {
      prisma.logement.findMany.mockResolvedValue([ownedLogements[0]]);
      prisma.indisponibiliteLogement.findMany.mockResolvedValue([
        { id: 'old-1', dateDebut: parseDay(day(5)), dateFin: parseDay(day(10)), motif: 'Famille' },
        { id: 'old-2', dateDebut: parseDay(day(14)), dateFin: parseDay(day(20)), motif: null },
      ]);

      const [block] = await service.createBlocks(OWNER, {
        logementIds: [LOGEMENT_A],
        dateDebut: day(10),
        dateFin: day(15),
      });

      expect(prisma.indisponibiliteLogement.deleteMany).toHaveBeenCalledWith({
        where: { id: { in: ['old-1', 'old-2'] } },
      });
      expect(block).toMatchObject({ start: day(5), end: day(20), motif: 'Famille' });
    });

    it('refuse un logement qui n’appartient pas à l’utilisateur', async () => {
      prisma.logement.findMany.mockResolvedValue([ownedLogements[0]]);

      await expect(
        service.createBlocks(OWNER, { logementIds: [LOGEMENT_A, LOGEMENT_B], dateDebut: day(10), dateFin: day(15) }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('refuse des dates passées', async () => {
      await expect(
        service.createBlocks(OWNER, { logementIds: [LOGEMENT_A], dateDebut: day(-2), dateFin: day(3) }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('deleteBlock', () => {
    it('supprime un blocage d’un logement géré par l’utilisateur', async () => {
      prisma.indisponibiliteLogement.findFirst.mockResolvedValue({ id: 'block-1' });

      await expect(service.deleteBlock(OWNER, 'block-1')).resolves.toEqual({ id: 'block-1' });
      expect(prisma.indisponibiliteLogement.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'block-1',
          logement: { archiveLe: null, OR: [{ proprietaireId: OWNER }, { gestionnaireId: OWNER }] },
        },
        select: { id: true },
      });
    });

    it('renvoie 404 pour le blocage d’un autre propriétaire', async () => {
      prisma.indisponibiliteLogement.findFirst.mockResolvedValue(null);

      await expect(service.deleteBlock(OWNER, 'block-1')).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.indisponibiliteLogement.delete).not.toHaveBeenCalled();
    });
  });
});
