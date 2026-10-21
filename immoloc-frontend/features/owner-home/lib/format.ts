const MONTHS_SHORT = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
const MONTHS_LONG = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
];

/** `2026-10` → « oct. » */
export function monthShort(month: string): string {
  return MONTHS_SHORT[Number(month.slice(5, 7)) - 1] ?? month;
}

/** `2026-10` → « octobre » */
export function monthLong(month: string): string {
  return MONTHS_LONG[Number(month.slice(5, 7)) - 1] ?? month;
}

/** 0.784 → « 78 % » */
export function percent(rate: number): string {
  return `${Math.round(rate * 100)} %`;
}

/** 1 245 000 → « 1,2 M » ; 412 500 → « 412 500 » (pour les tuiles compactes). */
export function compactAmount(amount: number): string {
  if (Math.abs(amount) >= 1_000_000) {
    return `${(amount / 1_000_000).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} M`;
  }
  return Math.round(amount).toLocaleString('fr-FR');
}

/** Initiales d'un prénom (+ nom) pour les avatars sans photo. */
export function initials(prenom: string, nom?: string | null): string {
  return `${prenom.charAt(0)}${nom?.charAt(0) ?? ''}`.toUpperCase() || '?';
}
