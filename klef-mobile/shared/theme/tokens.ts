// =============================================================================
// Klef Mobile — Design Tokens & Thème Visuel Officiel
// Identité visuelle 100% conforme à la plateforme web Klef (Immoloc)
// =============================================================================

export const colors = {
  // Vert Forêt Signature Klef (Fonds sombres, luxe, confiance)
  forest: {
    950: '#04221d',
    900: '#062822',
    800: '#0b382f',
    700: '#114a3e',
    600: '#185d4f',
    500: '#227362',
    100: '#e1f5f0',
    50: '#f0faf7',
  },

  // Vert Lime Action (Boutons CTA d'action principale & montants nets)
  action: {
    default: '#d9f99d',
    hover: '#bef264',
    border: '#a3e635',
    text: '#04221d',
  },

  // Or Teranga (Club, notations ⭐, badges certifiés)
  gold: {
    600: '#d97706',
    500: '#f59e0b',
    400: '#fbbf24',
    100: '#fef3c7',
    50: '#fffbeb',
  },

  // Neutres & Surfaces Claires / Sombres
  background: {
    default: '#f4f5f6',
    card: '#ffffff',
    alt: '#f9fafb',
    inverse: '#04221d',
    inverseCard: '#062822',
  },

  // Textes & Contrastes
  text: {
    primary: '#0f172a',
    secondary: '#475569',
    muted: '#64748b',
    inverse: '#ffffff',
    inverseMuted: '#94a3b8',
    inverseMarker: '#d9f99d',
  },

  // Frontières & Lignes
  border: {
    default: '#e2e8f0',
    hover: '#cbd5e1',
    inverse: 'rgba(255, 255, 255, 0.12)',
  },

  // États Sémantiques
  success: { default: '#22c55e', bg: '#f0fdf4', border: '#bbf7d0', text: '#15803d' },
  error: { default: '#ef4444', bg: '#fef2f2', border: '#fecaca', text: '#b91c1c' },
  warning: { default: '#f59e0b', bg: '#fffbeb', border: '#fde68a', text: '#b45309' },
};

export const radius = {
  pill: 9999, // Boutons ovales signature
  card: 20,   // Cartes principales
  inner: 12,  // Sous-éléments, badges et conteneurs
  sm: 8,
};

export const typography = {
  fontDisplay: 'System', // Sera raccordé à la police Display (Outfit / Serif)
  fontBody: 'System',
  sizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
  },
};
