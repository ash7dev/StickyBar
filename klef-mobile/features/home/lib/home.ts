import AsyncStorage from '@react-native-async-storage/async-storage';
import { getPrixPublic } from '../../../shared/components/ui/TenantPriceDisplay';
import type { ListingItem } from '../../../shared/components/ui/TenantListingCard';
import { toLocalISODate } from '../../booking/lib/booking';

// ── Mémoire locale de l'accueil (dernière visite, dernière escale, réponses) ─────

const LAST_VISIT_KEY = 'paixi_home_last_visit_v1';
const LAST_ESCALE_KEY = 'paixi_home_last_escale_v1';
const ANSWERS_KEY = 'paixi_home_answers_v1';

export type When = 'soir' | 'weekend' | 'mois' | 'flexible';
export type Who = 'seul' | 'couple' | 'famille' | 'amis';
export interface Answers {
  escale: string;
  when?: When;
  who?: Who;
  savedAt: string;
}

export const WHEN_OPTIONS: Array<{ key: When; label: string }> = [
  { key: 'soir', label: 'Ce soir' },
  { key: 'weekend', label: 'Ce week-end' },
  { key: 'mois', label: 'Le mois prochain' },
  { key: 'flexible', label: 'Je regarde' },
];
export const WHO_OPTIONS: Array<{ key: Who; label: string; guests: number }> = [
  { key: 'seul', label: 'Seul·e', guests: 1 },
  { key: 'couple', label: 'À deux', guests: 2 },
  { key: 'famille', label: 'En famille', guests: 4 },
  { key: 'amis', label: 'Entre amis', guests: 6 },
];

export const homeMemory = {
  async read() {
    const [visit, escale, answers] = await Promise.all([
      AsyncStorage.getItem(LAST_VISIT_KEY),
      AsyncStorage.getItem(LAST_ESCALE_KEY),
      AsyncStorage.getItem(ANSWERS_KEY),
    ]).catch(() => [null, null, null] as const);
    let parsed: Answers | null = null;
    try {
      parsed = answers ? (JSON.parse(answers) as Answers) : null;
    } catch {
      parsed = null;
    }
    return { lastVisit: visit, lastEscale: escale, answers: parsed };
  },
  markVisit: () => AsyncStorage.setItem(LAST_VISIT_KEY, new Date().toISOString()).catch(() => {}),
  saveEscale: (key: string) => AsyncStorage.setItem(LAST_ESCALE_KEY, key).catch(() => {}),
  saveAnswers: (a: Answers) => AsyncStorage.setItem(ANSWERS_KEY, JSON.stringify(a)).catch(() => {}),
};

// ── Dates à partir d'une réponse ─────────────────────────────────────────────

function nextWeekend(from = new Date()): { start: string; end: string } {
  const d = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const day = d.getDay();
  const toSat = day === 6 ? 0 : day === 0 ? 6 : 6 - day;
  const sat = new Date(d.getFullYear(), d.getMonth(), d.getDate() + toSat);
  const sun = new Date(sat.getFullYear(), sat.getMonth(), sat.getDate() + 1);
  return { start: toLocalISODate(sat), end: toLocalISODate(sun) };
}

/** Dates de recherche pour « Ce soir », « Ce week-end », « Le mois prochain » (premier week-end). */
export function datesFor(when?: When): { start: string; end: string } | null {
  const now = new Date();
  if (when === 'soir') {
    const t = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    return { start: toLocalISODate(now), end: toLocalISODate(t) };
  }
  if (when === 'weekend') return nextWeekend(now);
  if (when === 'mois') return nextWeekend(new Date(now.getFullYear(), now.getMonth() + 1, 1));
  return null;
}

/** true si les réponses enregistrées visent des dates déjà passées. */
export function answersExpired(a: Answers | null): boolean {
  if (!a?.savedAt || !a.when || a.when === 'flexible') return false;
  const d = datesFor(a.when);
  const saved = new Date(a.savedAt);
  // « ce week-end » / « ce soir » enregistrés il y a plus de 2 jours : le moment est passé
  return !!d && Date.now() - saved.getTime() > 2 * 86_400_000;
}

// ── Escales : regrouper les vrais logements par lieu, du nord au sud ───────────

interface EscaleText {
  label: string;
  region: string;
  tagline: string;
  order: number;
}

/** Textes éditoriaux par escale (à relire par l'équipe Paixi). Ordre = le long de la côte, du nord au sud. */
const ESCALES: Record<string, EscaleText> = {
  'saint-louis': { label: 'Saint-Louis', region: 'LE NORD · LE FLEUVE', tagline: 'L’île coloniale, le pont Faidherbe et le fleuve à perte de vue.', order: 0 },
  yoff: { label: 'Yoff', region: 'DAKAR · CÔTE NORD', tagline: 'Le village de pêcheurs, la plage et l’aéroport à deux pas.', order: 1 },
  ngor: { label: 'Ngor', region: 'PRESQU’ÎLE DU CAP-VERT', tagline: 'L’île en face, les vagues des surfeurs, la ville à 10 minutes.', order: 2 },
  almadies: { label: 'Almadies', region: 'DAKAR · LA POINTE', tagline: 'La pointe la plus à l’ouest de l’Afrique, ses restaurants et l’océan.', order: 3 },
  ouakam: { label: 'Ouakam', region: 'DAKAR', tagline: 'Les Mamelles, le phare et la corniche ouest.', order: 4 },
  mermoz: { label: 'Mermoz', region: 'DAKAR · CORNICHE', tagline: 'Résidentiel et calme, entre corniche et centre-ville.', order: 5 },
  plateau: { label: 'Plateau', region: 'DAKAR · CENTRE', tagline: 'Le cœur de Dakar : affaires, marchés et vue sur Gorée.', order: 6 },
  dakar: { label: 'Dakar', region: 'LA CAPITALE', tagline: 'Une capitale au bord de l’océan, vivante jour et nuit.', order: 7 },
  'toubab dialaw': { label: 'Toubab Dialaw', region: 'PETITE CÔTE', tagline: 'Falaises ocre, ateliers d’artistes et plages tranquilles.', order: 8 },
  popenguine: { label: 'Popenguine', region: 'PETITE CÔTE', tagline: 'Réserve naturelle et criques au calme.', order: 9 },
  somone: { label: 'Somone', region: 'PETITE CÔTE', tagline: 'La lagune, les pélicans et les couchers de soleil.', order: 10 },
  ngaparou: { label: 'Ngaparou', region: 'PETITE CÔTE', tagline: 'Villas les pieds dans le sable, à côté de Saly.', order: 11 },
  saly: { label: 'Saly', region: 'PETITE CÔTE · 1 H 15 DE DAKAR', tagline: 'Piscines, plages et couchers de soleil sur l’Atlantique.', order: 12 },
  mbour: { label: 'Mbour', region: 'PETITE CÔTE', tagline: 'Le grand port de pêche et son marché animé.', order: 13 },
  'cap skirring': { label: 'Cap Skirring', region: 'CASAMANCE', tagline: 'Plages immenses bordées de palmiers, tout au sud.', order: 14 },
};

const norm = (s?: string | null) =>
  (s ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[-_]/g, ' ')
    .trim();

function escaleKey(l: ListingItem): string {
  const q = norm(l.quartier);
  const v = norm(l.ville);
  const known = Object.keys(ESCALES).find((k) => q.includes(norm(k)) || v.includes(norm(k)));
  return known ?? (q || v || 'senegal');
}

export interface Escale {
  key: string;
  label: string;
  region: string;
  tagline: string;
  order: number;
  listings: ListingItem[];
  videos: number;
  fromPrice: number;
  cover?: string;
  videoUrl?: string | null;
}

const nightly = (l: ListingItem) => getPrixPublic(l.prixBase);
export const coverOf = (l?: ListingItem) => {
  const p = l?.photos?.[0] as unknown;
  return typeof p === 'string' ? p : (p as { url?: string } | undefined)?.url;
};

export function buildEscales(listings: ListingItem[]): Escale[] {
  const groups = new Map<string, ListingItem[]>();
  for (const l of listings) {
    const k = escaleKey(l);
    groups.set(k, [...(groups.get(k) ?? []), l]);
  }
  return [...groups.entries()]
    .map(([key, ls]) => {
      const t = ESCALES[key];
      const filmed = ls.filter((l) => !!l.videoUrl);
      const label = t?.label ?? (ls[0].quartier || ls[0].ville || key);
      return {
        key,
        label,
        region: t?.region ?? (ls[0].ville || 'SÉNÉGAL').toUpperCase(),
        tagline: t?.tagline ?? `${ls.length} logement${ls.length > 1 ? 's' : ''} vérifié${ls.length > 1 ? 's' : ''} à ${label}.`,
        order: t?.order ?? 50,
        listings: ls,
        videos: filmed.length,
        fromPrice: Math.min(...ls.map(nightly)),
        cover: coverOf(filmed[0] ?? ls[0]),
        videoUrl: filmed[0]?.videoUrl ?? null,
      };
    })
    .sort((a, b) => a.order - b.order || b.listings.length - a.listings.length);
}

/** Moment de la journée à Dakar (UTC+0) : teinte la fenêtre. */
export function dayTint(now = new Date()): string {
  const h = now.getUTCHours();
  if (h >= 5 && h < 8) return 'rgba(64,38,30,0.92)'; // aube
  if (h >= 8 && h < 17) return 'rgba(4,25,18,0.92)'; // jour
  if (h >= 17 && h < 20) return 'rgba(70,32,14,0.92)'; // coucher de soleil
  return 'rgba(6,16,30,0.94)'; // nuit
}

/** « MAGATH » ou « magath » → « Magath » (prénoms saisis en majuscules). */
export const nameCase = (s?: string | null) =>
  s ? s.toLowerCase().replace(/(^|[\s'-])(\p{L})/gu, (_, sep: string, ch: string) => sep + ch.toUpperCase()) : s ?? undefined;

/** « Nanga def » le matin, puis en français. */
export function greeting(now = new Date()): string {
  const h = now.getUTCHours();
  if (h < 11) return 'Nanga def';
  if (h < 18) return 'Bonjour';
  return 'Bonsoir';
}
