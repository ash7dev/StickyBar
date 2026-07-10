// ── ImmoLoc — Design Tokens : Couleurs ──────────────────────────────────────
// Primaire : Vert Forêt #14654C (confiance, séquestre)
// Accent   : Terracotta #C75B23 (CTA — un seul par écran)
// Premium  : Or #C9A24B (badge Vérifié, étoiles — usage rare)
// Neutres  : Sable chaud

export const colors = {
  // ── Primaire — Vert Forêt ────────────────────────────────────────────────
  primary: {
    50:  '#E9F4EF',
    100: '#CFE7DC',
    200: '#A5D2BD',
    300: '#74B89A',
    400: '#439B77',
    500: '#1F7F5C',
    600: '#14654C',   // ★ COULEUR PRINCIPALE
    700: '#0F503D',
    800: '#0B3D2E',   // header, footer
    900: '#072A20',
    950: '#041912',
  },

  // ── Accent — Or Premium ──────────────────────────────────────────────────
  accent: {
    50:  '#FEF7E8',
    100: '#FDECC4',
    200: '#FBE09C',
    300: '#F9D474',
    400: '#F7CA56',
    500: '#F5C038',   // ★ CTA "Réserver" (texte blanc ≥ 15px / weight 500)
    600: '#F3BA32',   // hover CTA — ou base si texte petit (< 15px)
    700: '#F1B22B',
    800: '#EFAA24',
    900: '#EC9C17',
  },

  // ── Premium — Or ─────────────────────────────────────────────────────────
  gold: {
    50:  '#FBF5E6',
    100: '#F5E8C7',
    200: '#EAD394',
    300: '#DDBB65',
    400: '#C9A24B',   // ★ Badge "Vérifié ImmoLoc", étoiles de notation
    500: '#A88336',
    600: '#856527',
    700: '#624A1B',
    800: '#423110',   // texte sur fond or clair
  },

  // ── Neutres — Sable chaud ────────────────────────────────────────────────
  neutral: {
    0:   '#FFFFFF',
    50:  '#FAF6F0',   // fond de page
    100: '#F2ECE2',
    200: '#E5DDD1',
    300: '#D0C6B6',
    400: '#A99F8F',
    500: '#8A8072',
    600: '#6B6255',
    700: '#4F483E',
    800: '#38332B',
    900: '#26221C',
    950: '#171410',
  },

  // ── Sémantiques ──────────────────────────────────────────────────────────
  success: {
    50:  '#ecfdf5',
    100: '#d1fae5',
    500: '#10b981',
    600: '#059669',
    700: '#047857',
  },
  warning: {
    50:  '#fffbeb',
    100: '#fef3c7',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
  },
  error: {
    50:  '#fef2f2',
    100: '#fee2e2',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
  },
  info: {
    50:  '#eff6ff',
    100: '#dbeafe',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
  },
} as const;

// ── Raccourcis sémantiques ─────────────────────────────────────────────────
// Règle de contraste : jamais de blanc sur or, jamais de terracotta sur vert.

export const semanticColors = {
  background: colors.neutral[50],        // page sable
  backgroundAlt: colors.neutral[100],
  backgroundCard: colors.neutral[0],     // cartes BLANCHES sur fond sable

  textPrimary: colors.neutral[900],
  textSecondary: colors.neutral[600],    // 500 était limite en AA — 600 est sûr
  textMuted: colors.neutral[400],
  textOnPrimary: '#ffffff',              // blanc sur vert 600 : ~7:1 ✓
  textOnAccent: '#ffffff',               // blanc sur terracotta 500 : ~4.2:1 (texte ≥ 15px)
  textOnGold: colors.gold[800],          // JAMAIS de blanc sur or (2:1 ✗)

  border: colors.neutral[200],
  borderHover: colors.neutral[300],
  borderFocus: colors.primary[500],

  // Boutons vert = actions structurantes (confirmer, valider, naviguer)
  buttonPrimary: colors.primary[600],
  buttonPrimaryHover: colors.primary[700],
  buttonPrimaryActive: colors.primary[800],
  buttonSecondary: colors.primary[50],   // fond doux, texte primary-700
  buttonSecondaryHover: colors.primary[100],

  // CTA terracotta = l'action de conversion (Réserver, Payer) — un seul par écran
  ctaAccent: colors.accent[500],
  ctaAccentHover: colors.accent[600],
  ctaAccentActive: colors.accent[700],

  // Badge premium
  badgeVerifiedBg: colors.gold[100],
  badgeVerifiedText: colors.gold[800],
  ratingStar: colors.gold[400],

  link: colors.primary[600],
  linkHover: colors.primary[700],

  overlay: 'rgba(7, 42, 32, 0.5)',
  overlayLight: 'rgba(20, 101, 76, 0.12)',
} as const;

export type ColorScale = typeof colors.primary;
export type SemanticColors = typeof semanticColors;