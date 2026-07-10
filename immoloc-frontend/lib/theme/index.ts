// ── ImmoLoc — Theme Config ──────────────────────────────────────────────────
// Typographie : Fraunces (display 500/600) + Inter (interface 400/500/600)
// Couleur principale : Vert Forêt #14654C

export { colors, semanticColors } from './colors';
export type { ColorScale, SemanticColors } from './colors';

// ── Espacements ─────────────────────────────────────────────────────────────

export const spacing = {
  xs: '0.25rem',   // 4px
  sm: '0.5rem',    // 8px
  md: '1rem',      // 16px
  lg: '1.5rem',    // 24px
  xl: '2rem',      // 32px
  '2xl': '3rem',   // 48px
  '3xl': '4rem',   // 64px
} as const;

// ── Rayons de bordure ───────────────────────────────────────────────────────

export const radius = {
  sm: '0.375rem',   // 6px  — badges, tags
  md: '0.5rem',     // 8px  — inputs, petits boutons
  lg: '0.75rem',    // 12px — cartes, modales
  xl: '1rem',       // 16px — grandes cartes
  '2xl': '1.5rem',  // 24px — sections
  full: '9999px',   // pill
} as const;

// ── Ombres — neutres chaudes, subtiles. Pas de glow : anti-premium. ────────

export const shadows = {
  sm: '0 1px 2px rgba(38, 34, 28, 0.05)',
  md: '0 4px 6px -1px rgba(38, 34, 28, 0.07), 0 2px 4px -2px rgba(38, 34, 28, 0.05)',
  lg: '0 10px 15px -3px rgba(38, 34, 28, 0.08), 0 4px 6px -4px rgba(38, 34, 28, 0.04)',
  xl: '0 20px 25px -5px rgba(38, 34, 28, 0.10), 0 8px 10px -6px rgba(38, 34, 28, 0.05)',
} as const;

// ── Transitions ─────────────────────────────────────────────────────────────

export const transitions = {
  fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
  normal: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
  slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
  bounce: '500ms cubic-bezier(0.34, 1.56, 0.64, 1)',
} as const;