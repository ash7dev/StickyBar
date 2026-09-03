/**
 * Utilitaire de normalisation et de recherche intelligente des numéros de téléphone.
 * Supporte le Sénégal (+221) ainsi que la diaspora internationale (France +33, USA/Canada +1, etc.).
 */

/**
 * Nettoie et formate un numéro de téléphone au format E.164 international (+221771234567).
 */
export function normalizePhoneNumber(rawPhone: string, defaultPrefix = '+221'): string {
  if (!rawPhone) return '';

  // Conserver uniquement les chiffres et le signe + initial
  let cleaned = rawPhone.trim().replace(/[^\d+]/g, '');

  if (cleaned.startsWith('00')) {
    cleaned = '+' + cleaned.slice(2);
  }

  if (cleaned.startsWith('+')) {
    return cleaned;
  }

  // Si commence par 221 et comporte 12 chiffres (ex: 221782734723)
  if (cleaned.startsWith('221') && cleaned.length === 12) {
    return '+' + cleaned;
  }

  // Si numéro sénégalais local à 9 chiffres (ex: 771234567, 782734723, 70..., 76..., 33...)
  if (cleaned.length === 9 && /^(77|78|70|76|75|33)/.test(cleaned)) {
    return defaultPrefix + cleaned;
  }

  // Par défaut, si pas de +, ajouter le préfixe par défaut
  return defaultPrefix.startsWith('+') ? `${defaultPrefix}${cleaned}` : `+${defaultPrefix}${cleaned}`;
}

/**
 * Génère toutes les variantes possibles d'un numéro pour une recherche intelligente en base de données.
 * Exemple pour +221782734723 -> ['+221782734723', '221782734723', '782734723']
 */
export function getPhoneSearchVariants(rawPhone: string): string[] {
  if (!rawPhone || !rawPhone.trim()) return [];

  const variants = new Set<string>();

  const rawClean = rawPhone.trim();
  const digitsOnly = rawClean.replace(/\D/g, '');

  // 1. Chaîne brute telle quelle
  variants.add(rawClean);

  // 2. Chiffres uniquement
  if (digitsOnly) variants.add(digitsOnly);

  // 3. Format E.164 normé avec +
  const e164 = normalizePhoneNumber(rawClean);
  if (e164) variants.add(e164);

  // 4. Sans le signe +
  if (e164.startsWith('+')) {
    variants.add(e164.substring(1));
  }

  // 5. Pour les numéros Sénégal (+221) : extraire les 9 chiffres locaux (ex: 782734723)
  if (digitsOnly.length === 12 && digitsOnly.startsWith('221')) {
    const localPart = digitsOnly.slice(3);
    variants.add(localPart);
    // Ajouter avec espaces possibles
    variants.add(`${localPart.slice(0, 2)} ${localPart.slice(2, 5)} ${localPart.slice(5, 7)} ${localPart.slice(7, 9)}`);
  } else if (digitsOnly.length === 9) {
    // Si la recherche est faite avec 9 chiffres, ajouter la version +221 et 221
    variants.add(`+221${digitsOnly}`);
    variants.add(`221${digitsOnly}`);
  }

  return Array.from(variants).filter((v) => v.length > 0);
}
