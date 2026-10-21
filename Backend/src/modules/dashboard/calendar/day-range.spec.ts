import {
  addDays,
  coveringRange,
  daysBetween,
  parseDay,
  rangesOverlap,
  rangesTouch,
  toDay,
} from './day-range';

describe('day-range', () => {
  describe('parseDay / toDay', () => {
    it('fait un aller-retour sans décalage horaire', () => {
      expect(toDay(parseDay('2026-10-19'))).toBe('2026-10-19');
    });

    it.each(['2026-13-01', '2026-02-30', '19/10/2026', '2026-10-19T10:00:00Z', ''])(
      'rejette "%s"',
      (input) => expect(() => parseDay(input)).toThrow(RangeError),
    );
  });

  it('addDays traverse les fins de mois et d’année', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('daysBetween compte les nuits (fin exclue)', () => {
    expect(daysBetween('2026-10-01', '2026-10-04')).toBe(3);
    expect(daysBetween('2026-10-01', '2026-10-01')).toBe(0);
  });

  describe('rangesOverlap', () => {
    const a = { start: '2026-10-10', end: '2026-10-15' };

    it('détecte un chevauchement partiel', () => {
      expect(rangesOverlap(a, { start: '2026-10-14', end: '2026-10-20' })).toBe(true);
    });

    it('accepte un départ et une arrivée le même jour', () => {
      expect(rangesOverlap(a, { start: '2026-10-15', end: '2026-10-18' })).toBe(false);
      expect(rangesOverlap(a, { start: '2026-10-05', end: '2026-10-10' })).toBe(false);
    });
  });

  it('rangesTouch inclut les plages adjacentes', () => {
    const a = { start: '2026-10-10', end: '2026-10-15' };
    expect(rangesTouch(a, { start: '2026-10-15', end: '2026-10-18' })).toBe(true);
    expect(rangesTouch(a, { start: '2026-10-16', end: '2026-10-18' })).toBe(false);
  });

  it('coveringRange renvoie l’enveloppe des plages', () => {
    expect(
      coveringRange([
        { start: '2026-10-10', end: '2026-10-12' },
        { start: '2026-10-08', end: '2026-10-11' },
        { start: '2026-10-11', end: '2026-10-20' },
      ]),
    ).toEqual({ start: '2026-10-08', end: '2026-10-20' });
  });
});
