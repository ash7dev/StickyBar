// ─────────────────────────────────────────────────────────────────────────────
// Klef — Theme Config
// Typographie : Fraunces (display) + Inter (interface)
// Marque : Vert Forêt #14654C · Action : Lime #D3F26E · Statut : Or #C9A24B
// ─────────────────────────────────────────────────────────────────────────────
//
// ⚠️  radius et shadows sont définis dans ./colors, PAS ici.
//     Les redéfinir créait deux sources pour la même valeur et un conflit
//     de nom au moment du `export *`. Ce fichier ne fait que les réexporter.
//
// ─────────────────────────────────────────────────────────────────────────────

export {
  colors,
  semanticColors,
  inverseColors,
  gradients,
  glass,
  radius,
  shadows,
  luminance,
  contrastRatio,
  assertReadable,
  CONTRAST_CONTRACT,
} from './colors';

export type { ColorScale, SemanticColors, InverseColors } from './colors';

// ── Espacements ─────────────────────────────────────────────────────────────
// Échelle 4px. Les clés numériques permettent l'interpolation dans les
// composants (space[6]) ; les alias t-shirt restent pour la lisibilité.

export const space = {
  0:  '0',
  1:  '0.25rem',   // 4
  2:  '0.5rem',    // 8
  3:  '0.75rem',   // 12
  4:  '1rem',      // 16
  5:  '1.25rem',   // 20
  6:  '1.5rem',    // 24
  8:  '2rem',      // 32
  10: '2.5rem',    // 40
  12: '3rem',      // 48
  16: '4rem',      // 64
  20: '5rem',      // 80
  24: '6rem',      // 96
} as const;

export const spacing = {
  xs:   space[1],
  sm:   space[2],
  md:   space[4],
  lg:   space[6],
  xl:   space[8],
  '2xl': space[12],
  '3xl': space[16],
} as const;

// ── Rythme vertical & gouttières ───────────────────────────────────────────
// Ce qui manquait : les valeurs de mise en page globale, qui se retrouvaient
// codées en dur dans chaque page.

export const layout = {
  gutter:      'clamp(1rem, 4vw, 3rem)',   // padding latéral des conteneurs
  maxWidth:    '1120px',                   // largeur du contenu
  sectionY:    'clamp(3rem, 7vw, 5rem)',   // rythme vertical entre sections
  heroY:       'clamp(3.5rem, 9vw, 6.5rem)',
  navOffset:   '1rem',                     // détachement de la navbar flottante
  bottomNavH:  '4rem',                     // hauteur de TenantBottomNav
} as const;

// ── Échelle typographique ──────────────────────────────────────────────────
// Fraunces sur h1–h3 en 600. Au-delà de 600 le serif s'empâte.
// Interlignage serré sur les titres, ouvert sur le corps.

export const typography = {
  display: {
    h1: { size: 'clamp(2.1rem, 5.4vw, 3.4rem)', lh: '1.04', ls: '-0.022em', weight: 600 },
    h2: { size: 'clamp(1.6rem, 3.4vw, 2.35rem)', lh: '1.12', ls: '-0.02em',  weight: 600 },
    h3: { size: 'clamp(1.25rem, 2vw, 1.5rem)',   lh: '1.28', ls: '-0.015em', weight: 600 },
  },
  ui: {
    title:   { size: '1.0625rem', lh: '1.35', ls: '-0.005em', weight: 600 },
    body:    { size: '1rem',      lh: '1.62', ls: '0',        weight: 400 },
    small:   { size: '0.875rem',  lh: '1.55', ls: '0',        weight: 400 },
    caption: { size: '0.8125rem', lh: '1.45', ls: '0',        weight: 400 },
    button:  { size: '0.9375rem', lh: '1',    ls: '0',        weight: 600 },
    eyebrow: { size: '0.8125rem', lh: '1.4',  ls: '0.16em',   weight: 600 },
  },
} as const;

// ── Transitions ─────────────────────────────────────────────────────────────
// Courbe alignée sur globals.css : cubic-bezier(0.22, 1, 0.36, 1).
// L'ancienne (0.4, 0, 0.2, 1) est la courbe Material — elle divergeait du CSS,
// donc un bouton animé en JS ne bougeait pas comme le même bouton animé en CSS.

export const easing = {
  out:    'cubic-bezier(0.22, 1, 0.36, 1)',
  inOut:  'cubic-bezier(0.65, 0, 0.35, 1)',
} as const;

export const duration = {
  fast:   '120ms',
  normal: '200ms',
  slow:   '320ms',
} as const;

export const transitions = {
  fast:   `${duration.fast} ${easing.out}`,
  normal: `${duration.normal} ${easing.out}`,
  slow:   `${duration.slow} ${easing.out}`,
} as const;

// ⛔ `bounce` a été retiré.
//    Un overshoot (0.34, 1.56, 0.64, 1) sur 500 ms fait rebondir l'élément
//    au-delà de sa position finale. C'est ludique — et donc à contre-emploi
//    sur une plateforme qui bloque plusieurs centaines de milliers de FCFA.
//    Si un accusé de réception visuel est nécessaire, utiliser un scale
//    0.98 → 1 sur `duration.fast`, sans dépassement.

// ── Élévation — quand utiliser quelle ombre ────────────────────────────────
// Règle : pas de glow, SAUF sur l'action. `semanticColors.actionGlow` est
// la seule ombre colorée du système, et c'est ce qui la rend lisible comme
// signal plutôt que comme décoration.

export const elevation = {
  flat:     'none',
  card:     'sm',        // cartes au repos
  cardHover:'md',        // cartes au survol
  floating: 'float',     // navbar, éléments en glass
  modal:    'xl',
} as const;

// ── Points de rupture ───────────────────────────────────────────────────────

export const breakpoints = {
  sm: '640px',
  md: '768px',    // au-delà : background-attachment fixed réactivé
  lg: '1024px',
  xl: '1280px',
} as const;

// ── Z-index — centralisé pour éviter les z-[9999] éparpillés ──────────────

export const zIndex = {
  base:      0,
  raised:    10,
  bottomNav: 40,
  nav:       50,
  overlay:   60,
  modal:     70,
  toast:     80,
} as const;