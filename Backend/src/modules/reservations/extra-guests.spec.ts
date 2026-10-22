import { BadRequestException, ConflictException } from '@nestjs/common';
import { computeExtraGuests, ExtraGuestsInput } from './extra-guests';

const NOW = new Date('2026-10-22T10:00:00Z');

function reservation(over: Partial<ExtraGuestsInput> = {}): ExtraGuestsInput {
  return {
    statut: 'CHECKED_IN',
    nbPersonnes: 2,
    nbNuits: 4,
    dateDebut: new Date('2026-10-20T14:00:00Z'),
    dateFin: new Date('2026-10-24T12:00:00Z'),
    logement: {
      capaciteMax: 6,
      personnesBase: 2,
      tarifsPersonnes: [
        { personnesMin: 3, personnesMax: 4, supplement: 5000 },
        { personnesMin: 5, personnesMax: 6, supplement: 9000 },
      ],
    },
    demandesFrais: [],
    ...over,
  };
}

describe('computeExtraGuests', () => {
  it('calcule (supplément nouveau − prévu) × nuits restantes', () => {
    expect(computeExtraGuests(reservation(), 4, NOW)).toEqual({
      prevus: 2,
      nbVoyageurs: 4,
      capacite: 6,
      parNuit: 5000,
      nuits: 2,
      montant: 10000,
    });
  });

  it('déduit le supplément déjà payé à la réservation', () => {
    expect(computeExtraGuests(reservation({ nbPersonnes: 4 }), 6, NOW).parNuit).toBe(4000);
  });

  it('compte toutes les nuits le jour de l’arrivée', () => {
    const r = reservation({
      statut: 'CONFIRMED',
      nbNuits: 3,
      dateDebut: new Date('2026-10-22T14:00:00Z'),
      dateFin: new Date('2026-10-25T12:00:00Z'),
    });
    expect(computeExtraGuests(r, 3, NOW).nuits).toBe(3);
  });

  it('compte au moins une nuit le jour du départ', () => {
    expect(computeExtraGuests(reservation(), 4, new Date('2026-10-24T09:00:00Z')).nuits).toBe(1);
  });

  it('refuse au-delà de la capacité', () => {
    expect(() => computeExtraGuests(reservation(), 7, NOW)).toThrow(/maximum/);
  });

  it('refuse un nombre inférieur ou égal à celui prévu', () => {
    expect(() => computeExtraGuests(reservation(), 2, NOW)).toThrow(BadRequestException);
  });

  it('refuse sans grille tarifaire par voyageur', () => {
    const r = reservation();
    r.logement.tarifsPersonnes = [];
    expect(() => computeExtraGuests(r, 4, NOW)).toThrow(/grille/);
  });

  it('refuse avant l’ouverture de l’arrivée, après le départ ou hors séjour confirmé', () => {
    const early = reservation({ statut: 'CONFIRMED', dateDebut: new Date('2026-10-22T16:00:00Z') });
    expect(() => computeExtraGuests(early, 4, NOW)).toThrow(BadRequestException);
    expect(() => computeExtraGuests(reservation(), 4, new Date('2026-10-24T13:00:00Z'))).toThrow(BadRequestException);
    expect(() => computeExtraGuests(reservation({ statut: 'COMPLETED' }), 4, NOW)).toThrow(BadRequestException);
  });

  it('un seul supplément actif par séjour, un nouveau possible après contestation', () => {
    expect(() => computeExtraGuests(reservation({ demandesFrais: [{ statut: 'EN_ATTENTE' }] }), 4, NOW)).toThrow(ConflictException);
    expect(() => computeExtraGuests(reservation({ demandesFrais: [{ statut: 'PAYE' }] }), 4, NOW)).toThrow(ConflictException);
    expect(computeExtraGuests(reservation({ demandesFrais: [{ statut: 'CONTESTE' }] }), 4, NOW).montant).toBe(10000);
  });
});
