import { computeOccupancy, freeNights, nightsInWindow } from './occupancy';

const OCTOBER = { start: '2026-10-01', end: '2026-11-01' }; // 31 nuits

describe('occupancy', () => {
  it('ne compte que les nuits dans la fenêtre', () => {
    const nights = nightsInWindow([{ start: '2026-09-29', end: '2026-10-03' }], OCTOBER);
    expect([...nights]).toEqual(['2026-10-01', '2026-10-02']);
  });

  it('calcule réservées ÷ (période − bloquées)', () => {
    const occupancy = computeOccupancy(
      [{ start: '2026-10-10', end: '2026-10-20' }], // 10 nuits
      [{ start: '2026-10-25', end: '2026-10-26' }], // 1 nuit bloquée
      OCTOBER,
    );
    expect(occupancy).toEqual({ bookedNights: 10, availableNights: 30, rate: 10 / 30 });
  });

  it('ne retire pas une nuit réservée qui est aussi bloquée', () => {
    const occupancy = computeOccupancy(
      [{ start: '2026-10-10', end: '2026-10-12' }],
      [{ start: '2026-10-11', end: '2026-10-13' }],
      OCTOBER,
    );
    expect(occupancy.bookedNights).toBe(2);
    expect(occupancy.availableNights).toBe(30); // seule la nuit du 12 est retirée
  });

  it('renvoie 0 quand tout est bloqué', () => {
    expect(computeOccupancy([], [OCTOBER], OCTOBER)).toEqual({ bookedNights: 0, availableNights: 0, rate: 0 });
  });

  it('dédoublonne les réservations qui se chevauchent', () => {
    expect(
      computeOccupancy(
        [
          { start: '2026-10-01', end: '2026-10-05' },
          { start: '2026-10-03', end: '2026-10-06' },
        ],
        [],
        OCTOBER,
      ).bookedNights,
    ).toBe(5);
  });

  it('freeNights compte les nuits ni réservées ni bloquées', () => {
    const window = { start: '2026-10-19', end: '2026-11-02' }; // 14 nuits
    expect(
      freeNights(
        [{ start: '2026-10-21', end: '2026-10-24' }],
        [{ start: '2026-10-23', end: '2026-10-27' }],
        window,
      ),
    ).toBe(14 - 6);
  });
});
