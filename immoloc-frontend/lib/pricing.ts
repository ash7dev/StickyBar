import { useCurrencyStore } from '@/stores/currency.store';

/**
 * Taux de commission locataire appliqué aux prix de base (7%).
 * ⚠️ SOURCE DE VÉRITÉ FRONTEND POUR LE PRIX PUBLIC LOCATAIRE.
 * Tout composant destiné au locataire (carte, fiche, map, checkout, carrousel)
 * doit appliquer ce taux pour garantir la cohérence stricte des montants.
 */
export const TENANT_COMMISSION_MARKUP = 1.07;

/**
 * Calcule le prix public nuitée pour le locataire (prix de base + 7%).
 */
export function getPrixPublic(prixBase: number | string | null | undefined): number {
  if (prixBase === null || prixBase === undefined) return 0;
  const num = typeof prixBase === 'string' ? parseFloat(prixBase) : prixBase;
  if (Number.isNaN(num) || num <= 0) return 0;
  return Math.round(num * TENANT_COMMISSION_MARKUP);
}

/**
 * Formate un prix public locataire dans la devise active (FCFA, EUR, USD, etc.).
 */
export function formatPrixPublic(prixBase: number | string | null | undefined): string {
  const prixPublic = getPrixPublic(prixBase);
  if (prixPublic <= 0) return '—';
  return useCurrencyStore.getState().formatAmount(prixPublic);
}

/**
 * Remise Dernière Minute (15%).
 */
export const LAST_MINUTE_DISCOUNT = 0.15;

/**
 * Calcule le prix réduit "Dernière Minute" pour le locataire (Prix public avec -15%).
 */
export function getPrixDerniereMinute(prixPublic: number): number {
  return Math.round(prixPublic * (1 - LAST_MINUTE_DISCOUNT));
}

/**
 * Formate le prix réduit "Dernière Minute" dans la devise active.
 */
export function formatPrixDerniereMinute(prixPublic: number): string {
  const reduced = getPrixDerniereMinute(prixPublic);
  return reduced <= 0 ? '—' : useCurrencyStore.getState().formatAmount(reduced);
}

/**
 * Formate un montant en tenant compte de la devise active (FCFA, EUR, USD, GBP, CAD).
 */
export function formatPriceWithCurrency(priceInFcfa: number | string | null | undefined): string {
  const num = typeof priceInFcfa === 'string' ? parseFloat(priceInFcfa) : priceInFcfa;
  if (!num || Number.isNaN(num) || num <= 0) return '—';
  return useCurrencyStore.getState().formatAmount(num);
}
