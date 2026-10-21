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
