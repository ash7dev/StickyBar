// ---------------------------------------------------------------------------
// Klef — Tokens et helpers du tableau de bord hôte
//
// Ce fichier existe parce que les mêmes valeurs étaient réécrites à la main
// dans chaque composant : la commission (0.85) apparaissait trois fois, les
// couleurs de statut mélangeaient amber / emerald / rose bruts, et la palette
// du donut contenait trois hex (#38bdf8, #a78bfa, #fbbf24) absents du système.
// ---------------------------------------------------------------------------

/** Part reversée à l'hôte après commission Klef. Source unique. */
export const HOST_SHARE = 0.85;

/** Montant net hôte pour une réservation. */
export const netHost = (totalLocataire: number) => totalLocataire * HOST_SHARE;

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
    bg: 'bg-warning-500/15', text: 'text-warning-500',
    border: 'border-warning-500/30', dot: 'bg-warning-500',
  },
  PAID: {
    label: 'Payée',
    bg: 'bg-success-500/15', text: 'text-success-500',
    border: 'border-success-500/30', dot: 'bg-success-500',
  },
  CONFIRMED: {
    label: 'Confirmée',
    bg: 'bg-lime-400/15', text: 'text-lime-300',
    border: 'border-lime-400/30', dot: 'bg-lime-400',
  },
  CHECKED_IN: {
    label: 'En séjour',
    bg: 'bg-lime-400/20', text: 'text-lime-300',
    border: 'border-lime-400/40',
    // Le point clignotait en boucle. Une animation infinie dans une liste
    // de cinq lignes tire l'oeil en permanence et coûte du compositing.
    dot: 'bg-lime-400',
  },
  COMPLETED: {
    label: 'Terminée',
    bg: 'bg-forest-900', text: 'text-forest-200',
    border: 'border-forest-800', dot: 'bg-forest-400',
  },
  CANCELLED: {
    label: 'Annulée',
    bg: 'bg-error-500/15', text: 'text-error-500',
    border: 'border-error-500/30', dot: 'bg-error-500',
  },
  DISPUTED: {
    label: 'Litige',
    bg: 'bg-error-500/25', text: 'text-error-500',
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
  T extends { statut: string; dateDebut: string; totalLocataire: number },
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
      .reduce((sum, r) => sum + netHost(r.totalLocataire), 0);

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
// CONFIRMED et CHECKED_IN étaient tous deux en lime avec texte forest :
// deux statuts distincts rendus quasi identiques. CHECKED_IN, qui est le
// seul état « en cours », garde le lime ; CONFIRMED passe en forest.
// ---------------------------------------------------------------------------

export interface StatutConfigLight {
  label: string;
  cls: string;
  dot: string;
}

export const STATUT_CFG_LIGHT: Record<string, StatutConfigLight> = {
  PENDING:    { label: 'En attente', cls: 'bg-warning-50 text-warning-700', dot: 'bg-warning-500' },
  PAID:       { label: 'Payée',      cls: 'bg-success-50 text-success-700', dot: 'bg-success-500' },
  CONFIRMED:  { label: 'Confirmée',  cls: 'bg-forest-100 text-forest-800',  dot: 'bg-forest-600'  },
  CHECKED_IN: { label: 'En séjour',  cls: 'bg-lime-100 text-forest-800',    dot: 'bg-lime-600'    },
  COMPLETED:  { label: 'Terminée',   cls: 'bg-neutral-100 text-foreground-muted', dot: 'bg-neutral-400' },
  CANCELLED:  { label: 'Annulée',    cls: 'bg-neutral-100 text-foreground-muted', dot: 'bg-neutral-400' },
  DISPUTED:   { label: 'Litige',     cls: 'bg-error-50 text-error-700',     dot: 'bg-error-500'   },
};