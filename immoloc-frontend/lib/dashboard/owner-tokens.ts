// ---------------------------------------------------------------------------
// Klef — Tokens et helpers du tableau de bord hôte
//
// Ce fichier existe parce que les mêmes valeurs étaient réécrites à la main
// dans chaque composant : la commission (0.85) apparaissait trois fois, les
// couleurs de statut mélangeaient amber / emerald / rose bruts, et la palette
// du donut contenait trois hex (#38bdf8, #a78bfa, #fbbf24) absents du système.
// ---------------------------------------------------------------------------

/**
 * Commission Klef : 7% ajoutée au prix de base du propriétaire.
 * Ex: Si le propriétaire demande 75 000 FCFA, le locataire paie 75 000 + 7% = 80 250 FCFA.
 * Le propriétaire reçoit 75 000 FCFA (netProprietaire), Klef garde 5 250 FCFA.
 */
export const COMMISSION_RATE = 0.07;

export const fcfa = (n: number) =>
  new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(Math.round(n));

export const fmtDateShort = (d: string) =>
  new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });

export const fmtMonthShort = (d: Date) =>
  new Intl.DateTimeFormat('fr-FR', { month: 'short' }).format(d);

/** Note formatée en français : 4,7 et non 4.7. toFixed produisait un point. */
export const fmtNote = (n: unknown): string => {
  const v = Number(n);
  return Number.isFinite(v) && v > 0
    ? new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(v)
    : '—';
};

export const TYPE_LABELS: Record<string, string> = {
  APPARTEMENT: 'Appartement',
  VILLA: 'Villa',
  CHAMBRE: 'Chambre',
  AUTRES: 'Autres',
};

// ---------------------------------------------------------------------------
// Statuts de réservation
//
// Les classes sont pensées pour un fond SOMBRE (forest-950/900).
// Avant : amber, emerald et rose bruts, soit trois familles chromatiques
// étrangères au système sur un même écran.
//
// Après, la sémantique porte le sens :
//   attente   -> warning     paiement -> success
//   actif     -> lime        terminé  -> neutre forest
//   problème  -> error
// ---------------------------------------------------------------------------

export interface StatutConfig {
  label: string;
  bg: string;
  text: string;
  border: string;
  dot: string;
}

export const STATUT_CFG: Record<string, StatutConfig> = {
  PENDING: {
    label: 'En attente',
    bg: 'bg-amber-500/15', text: 'text-amber-400',
    border: 'border-amber-500/30', dot: 'bg-amber-500',
  },
  PAID: {
    label: 'Payée',
    bg: 'bg-emerald-500/15', text: 'text-emerald-400',
    border: 'border-emerald-500/30', dot: 'bg-emerald-500',
  },
  CONFIRMED: {
    label: 'Confirmée',
    bg: 'bg-blue-500/15', text: 'text-blue-400',
    border: 'border-blue-500/30', dot: 'bg-blue-500',
  },
  CHECKED_IN: {
    label: 'En séjour',
    bg: 'bg-emerald-500/20', text: 'text-emerald-300',
    border: 'border-emerald-400/40',
    dot: 'bg-emerald-400 animate-pulse',
  },
  COMPLETED: {
    label: 'Terminée',
    bg: 'bg-slate-900/60', text: 'text-slate-300',
    border: 'border-slate-700', dot: 'bg-slate-400',
  },
  CANCELLED: {
    label: 'Annulée',
    bg: 'bg-rose-500/15', text: 'text-rose-400',
    border: 'border-rose-500/30', dot: 'bg-rose-500',
  },
  EXPIRED: {
    label: 'Expirée',
    bg: 'bg-neutral-800/60', text: 'text-neutral-400',
    border: 'border-neutral-700', dot: 'bg-neutral-500',
  },
  DISPUTED: {
    label: 'Litige',
    bg: 'bg-error-500/25', text: 'text-error-400',
    border: 'border-error-500/40', dot: 'bg-error-500',
  },
};

// ---------------------------------------------------------------------------
// Palette du donut — tirée des tokens, plus d'hex arbitraires.
// Un seul segment porte le lime : celui qui compte, les séjours terminés.
// ---------------------------------------------------------------------------

export const DONUT_SEGMENTS = [
  { key: 'COMPLETED',  label: 'Terminées',  color: 'var(--lime-400)'   },
  { key: 'CHECKED_IN', label: 'En cours',   color: 'var(--forest-300)' },
  { key: 'CONFIRMED',  label: 'Confirmées', color: 'var(--forest-500)' },
  { key: 'PAID',       label: 'Payées',     color: 'var(--gold-400)'   },
] as const;

// ---------------------------------------------------------------------------
// Revenus mensuels réels
//
// Remplace le tableau de mois codé en dur et la progression fabriquée
// [0, 0.05, 0.12, 0.25, 0.5, 1] qui était simplement multipliée par le
// revenu total. Ici, chaque barre est la somme réelle des réservations
// du mois concerné.
// ---------------------------------------------------------------------------

export interface MonthlyPoint {
  label: string;
  value: number;
  isCurrent: boolean;
}

export function buildMonthlyRevenue<
  T extends { statut: string; dateDebut: string; netProprietaire?: number; totalLocataire?: number },
>(reservations: T[], monthsBack = 6): MonthlyPoint[] {
  const COUNTED = ['COMPLETED', 'CHECKED_IN', 'CONFIRMED', 'PAID'];
  const now = new Date();
  const points: MonthlyPoint[] = [];

  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = reservations
      .filter((r) => {
        if (!COUNTED.includes(r.statut)) return false;
        const rd = new Date(r.dateDebut);
        return rd.getFullYear() === d.getFullYear() && rd.getMonth() === d.getMonth();
      })
      .reduce((sum, r) => sum + Number(r.netProprietaire ?? r.totalLocataire ?? 0), 0);

    points.push({ label: fmtMonthShort(d), value, isCurrent: i === 0 });
  }
  return points;
}

/** Variation entre le premier et le dernier mois non nul. null si incalculable. */
export function trendPercent(points: MonthlyPoint[]): number | null {
  const firstNonZero = points.find((p) => p.value > 0);
  const last = points[points.length - 1];
  if (!firstNonZero || firstNonZero === last || firstNonZero.value === 0) return null;
  return Math.round(((last.value - firstNonZero.value) / firstNonZero.value) * 100);
}

// ---------------------------------------------------------------------------
// Donut — le chemin d'arc dégénérait quand un seul statut existait :
// avec un balayage de 2π, le point de départ et le point d'arrivée sont
// confondus et le navigateur ne rend rien. On borne le balayage.
// ---------------------------------------------------------------------------

export function buildDonutPath(
  cx: number, cy: number, R: number, r: number, sa: number, ea: number,
) {
  const sweep = Math.min(ea - sa, 2 * Math.PI - 0.0001);
  const end = sa + sweep;
  const x1 = cx + R * Math.cos(sa),  y1 = cy + R * Math.sin(sa);
  const x2 = cx + R * Math.cos(end), y2 = cy + R * Math.sin(end);
  const x3 = cx + r * Math.cos(end), y3 = cy + r * Math.sin(end);
  const x4 = cx + r * Math.cos(sa),  y4 = cy + r * Math.sin(sa);
  const large = sweep > Math.PI ? 1 : 0;
  return `M ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2} L ${x3} ${y3} A ${r} ${r} 0 ${large} 0 ${x4} ${y4} Z`;
}

// ---------------------------------------------------------------------------
// Catégories d'équipements
// ---------------------------------------------------------------------------

export const CAT_ORDER = [
  'CONFORT', 'CUISINE', 'CONNECTIVITE', 'SECURITE', 'EXTERIEUR', 'ACCESSIBILITE',
] as const;

export const CAT_LABELS: Record<string, string> = {
  CONFORT: 'Confort',
  CUISINE: 'Cuisine',
  CONNECTIVITE: 'Connectivité',
  SECURITE: 'Sécurité',
  EXTERIEUR: 'Extérieur',
  ACCESSIBILITE: 'Accessibilité',
};

/** indexOf renvoie -1, jamais undefined : le `?? 99` d'origine ne servait
 *  à rien et les catégories inconnues remontaient en tête de liste. */
export const catRank = (c: string) => {
  const i = (CAT_ORDER as readonly string[]).indexOf(c);
  return i === -1 ? 99 : i;
};

// ---------------------------------------------------------------------------
// Statuts sur fond CLAIR
//
// STATUT_CFG plus haut est calibré pour les surfaces forest-950/900.
// Cette variante sert aux cartes posées sur le canvas. Les deux existent
// parce que le même token d'opacité ne donne pas le même contraste selon
// le fond — pas parce qu'on a dupliqué par inadvertance.
//
// Distinct visual identities:
// - PENDING: Amber / Yellow
// - PAID: Emerald / Green
// - CONFIRMED: Blue
// - CHECKED_IN: Emerald / Lime vibrant (en séjour)
// - COMPLETED: Slate / Gray soft
// - CANCELLED: Rose / Red soft
// - EXPIRED: Neutral Gray
// - DISPUTED: Error Red alert
// ---------------------------------------------------------------------------

export interface StatutConfigLight {
  label: string;
  cls: string;
  dot: string;
}

export const STATUT_CFG_LIGHT: Record<string, StatutConfigLight> = {
  PENDING:    { label: 'En attente',   cls: 'bg-amber-50 text-amber-800 border border-amber-200/80 font-semibold',        dot: 'bg-amber-500' },
  PAID:       { label: 'Payée',        cls: 'bg-emerald-50 text-emerald-800 border border-emerald-200/80 font-semibold',    dot: 'bg-emerald-500' },
  CONFIRMED:  { label: 'Confirmée',    cls: 'bg-blue-50 text-blue-800 border border-blue-200/80 font-semibold',          dot: 'bg-blue-600'    },
  CHECKED_IN: { label: 'En séjour',    cls: 'bg-emerald-100 text-emerald-900 border border-emerald-300 ring-2 ring-emerald-400/30 font-bold', dot: 'bg-emerald-600 animate-pulse' },
  COMPLETED:  { label: 'Terminée',     cls: 'bg-slate-100 text-slate-700 border border-slate-200/80 font-medium',        dot: 'bg-slate-400' },
  CANCELLED:  { label: 'Annulée',      cls: 'bg-rose-50 text-rose-700 border border-rose-200/80 font-medium',          dot: 'bg-rose-500' },
  EXPIRED:    { label: 'Expirée',      cls: 'bg-neutral-100 text-neutral-500 border border-neutral-200/80 font-medium', dot: 'bg-neutral-400' },
  DISPUTED:   { label: 'Litige',       cls: 'bg-error-50 text-error-800 border border-error-300 font-bold', dot: 'bg-error-600'   },
};