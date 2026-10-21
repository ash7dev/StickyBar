import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../shared/api/api-client';

/** Détail de prix calculé par l'API (GET /listings/:id/price-preview), seule source de vérité. */
export interface PriceBreakdown {
  nbNuits: number;
  prixBase: number;
  supplementPersonnes: number;
  prixNuitEffectif: number;
  reductionNuits: number;
  totalBase: number;
  tauxCommission: number;
  montantCommission: number;
  totalLocataire: number;
}

/**
 * « 2026-10-24 » à partir d'une date locale. Ne pas passer par toISOString() :
 * en UTC+1/+2 (diaspora en Europe), minuit local tombe la veille en UTC.
 */
export function toLocalISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Date locale à partir de « 2026-10-24 » (évite le décalage UTC de new Date(iso)). */
export function fromLocalISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function nightsBetween(start?: string | null, end?: string | null): number {
  if (!start || !end) return 0;
  const n = Math.round((fromLocalISODate(end).getTime() - fromLocalISODate(start).getTime()) / 86_400_000);
  return n > 0 ? n : 0;
}

const MONTHS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
const DAYS = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'];

/** « ven. 24 → lun. 27 oct. » */
export function rangeLabel(start: string, end: string, withDay = true): string {
  const a = fromLocalISODate(start);
  const b = fromLocalISODate(end);
  const left = `${withDay ? `${DAYS[a.getDay()]} ` : ''}${a.getDate()}${a.getMonth() !== b.getMonth() ? ` ${MONTHS[a.getMonth()]}` : ''}`;
  return `${left} → ${withDay ? `${DAYS[b.getDay()]} ` : ''}${b.getDate()} ${MONTHS[b.getMonth()]}`;
}

/** Acompte encaissé en ligne, même arrondi que create-reservation. null si pas d'acompte. */
export function depositOf(total: number, pct?: number | null): number | null {
  const p = Number(pct) || 30;
  if (p >= 100) return null;
  return Math.round(total * (p / 100));
}

/** Remboursements du voyageur s'il annule (cancel-reservation, branche locataire). */
export function cancellationTiers(p?: PriceBreakdown | null) {
  return [
    { pct: '100 %', when: 'Plus de 3 jours avant', amount: p ? p.totalBase : null, note: 'les nuits, hors frais de service' },
    { pct: '75 %', when: 'Entre 24 h et 3 jours', amount: p ? Math.round(p.totalLocataire * 0.75) : null, note: 'du montant payé' },
    { pct: '50 %', when: 'Moins de 24 h', amount: p ? Math.round(p.totalLocataire * 0.5) : null, note: 'du montant payé' },
  ];
}

export function apiMessage(err: unknown, fallback: string): string {
  const raw = (err as { response?: { data?: { message?: unknown; details?: unknown } } })?.response?.data;
  if (Array.isArray(raw?.details) && raw.details.length) return raw.details.join(' · ');
  if (Array.isArray(raw?.message)) return raw.message.join(' · ');
  return typeof raw?.message === 'string' && raw.message ? raw.message : fallback;
}

/** Prix exact pour des dates et un nombre de voyageurs (séjour minimum vérifié par l'API). */
export function usePricePreview(listingId: string | undefined, start?: string | null, end?: string | null, guests = 1) {
  const enabled = Boolean(listingId && start && end && nightsBetween(start, end) > 0);
  return useQuery<PriceBreakdown, unknown>({
    queryKey: ['price-preview', listingId, start, end, guests],
    queryFn: async () => {
      const res = await apiClient.get(`/listings/${listingId}/price-preview`, {
        params: { dateDebut: start, dateFin: end, nbPersonnes: guests },
      });
      const d = res.data?.data ?? res.data;
      return Object.fromEntries(Object.entries(d).map(([k, v]) => [k, typeof v === 'string' && !Number.isNaN(Number(v)) ? Number(v) : v])) as unknown as PriceBreakdown;
    },
    enabled,
    staleTime: 60_000,
    retry: false,
  });
}
