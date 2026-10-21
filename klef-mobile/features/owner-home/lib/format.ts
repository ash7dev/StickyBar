/** 412500 → « 412 500 FCFA » (espaces insécables : le montant ne se coupe jamais). */
export function formatFCFA(amount: number | string): string {
  const n = Math.round(Number(amount) || 0);
  const grouped = String(Math.abs(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${n < 0 ? '-' : ''}${grouped} FCFA`;
}

/** Initiales pour les avatars sans photo. */
export function initials(prenom?: string | null, nom?: string | null): string {
  return `${prenom?.charAt(0) ?? ''}${nom?.charAt(0) ?? ''}`.toUpperCase() || '?';
}

const MONTHS_LONG = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
];

/** `2026-10` → « octobre » */
export function monthLong(month: string): string {
  return MONTHS_LONG[Number(month.slice(5, 7)) - 1] ?? month;
}

/** 412500 → « 412 500 » (montant sans devise, pour l'afficher en grand à côté de « FCFA »). */
export function formatAmount(amount: number | string): string {
  return formatFCFA(amount).replace(/\s*FCFA$/, '');
}
