// =============================================================================
// Klef Mobile — Design Tokens & Thème Visuel Officiel v2.1
// SOURCE DE VÉRITÉ : 100% Miroir exact de immoloc-frontend/app/globals.css
// =============================================================================

export const colors = {
  // ── Forest (Structure, marque, surfaces sombres) ─────────────────────────
  forest: {
    50: '#ECF6F1',
    100: '#D2EADF',
    200: '#A8D5C1',
    300: '#77BB9E', // texte secondaire sur fond sombre
    400: '#479C79',
    500: '#22805D',
    600: '#14654C', // ★ Couleur de marque Klef — contrast 7.01:1 avec blanc
    700: '#0F503D',
    800: '#0B3D2E', // ★ Texte sur Lime (9.70:1)
    900: '#072A20', // ★ Surface sombre
    950: '#041912', // ★ Le "Noir" vert du système
  },

  // ── Lime (L'Action — CTA principal) ───────────────────────────────────────
  lime: {
    50: '#F7FCE9',
    100: '#EEF9CE',
    200: '#E4F7B8',
    300: '#DFF5A4', // marqueur sur fond sombre (13.03:1)
    400: '#D3F26E', // ★ CTA Action principal
    500: '#BCE04A', // hover
    600: '#9BC22C', // active
    700: '#74941C',
    800: '#556D15', // texte lime courant sur fond clair (5.61:1)
    900: '#3A4A0E',
  },

  // ── Gold (Le Statut — Badge Vérifié, Étoiles) ────────────────────────────
  gold: {
    50: '#FBF6E9',
    100: '#F4E9CB',
    200: '#E9D398',
    300: '#DABB68',
    400: '#C9A24B', // ★ Badge Vérifié / Étoiles de notation
    500: '#A88336',
    600: '#856527',
    700: '#63491B', // ★ Texte sur gold-50 (7.79:1)
    800: '#423110',
  },

  // ── Neutres (Blanc vert froid) ───────────────────────────────────────────
  neutral: {
    0: '#FFFFFF',
    50: '#F8FBF4',  // ★ Fond de page clair principal
    100: '#F1F6EA', // Fond alternatif / cartes secondaires
    200: '#E4EBDB', // Bordures
    300: '#CDD6C3',
    400: '#A3AE99',
    500: '#7D8975',
    600: '#5F6B59', // ★ Texte secondaire (5.38:1)
    700: '#475041',
    800: '#333A2F',
    900: '#22271F', // ★ Texte principal (14.58:1)
    950: '#141812',
  },

  // ── Sémantiques Retonalisés Klef ──────────────────────────────────────────
  success: {
    50: '#E9F6EC',
    100: '#D1FAE5',
    200: '#A7F3D0',
    500: '#2E9E52',
    600: '#1F7D3E',
    700: '#175E2F',
    800: '#065F46',
  },
  warning: {
    50: '#FDF4E3',
    100: '#FEF3C7',
    200: '#FDE68A',
    500: '#D99A22',
    600: '#B47B14',
    700: '#8A5D0E',
    800: '#92400E',
  },
  error: {
    50: '#FBEDEB',
    100: '#FADCD9',
    200: '#F7BAB5',
    500: '#D64B3C',
    600: '#B33628',
    700: '#8A281D',
    800: '#621B13',
  },
  info: {
    50: '#E9F2F5',
    100: '#D1E5ED',
    200: '#A3CBDB',
    500: '#3A7D95',
    600: '#2A6076',
    700: '#1E4757',
    800: '#15333E',
  },

  // ── Abstractions Sémantiques (Composants UI) ─────────────────────────────
  background: {
    default: '#F8FBF4',      // var(--background)
    alt: '#F1F6EA',          // var(--background-alt)
    card: '#FFFFFF',         // var(--background-card)
    inverse: '#072A20',      // var(--surface-inverse)
    inverseAlt: '#041912',   // var(--surface-inverse-alt)
  },

  text: {
    primary: '#22271F',       // var(--foreground)
    secondary: '#5F6B59',     // var(--foreground-muted)
    faint: '#A3AE99',         // var(--foreground-faint)
    inverse: '#F8FBF4',       // var(--on-inverse)
    inverseDisplay: '#F8FBF4',// var(--on-inverse-display)
    inverseMuted: '#A8D5C1',  // var(--on-inverse-muted)
    inverseMarker: '#DFF5A4', // var(--on-inverse-marker)
    onAction: '#0B3D2E',      // var(--on-action) — JAMAIS DE BLANC SUR LIME
    onPrimary: '#FFFFFF',     // var(--on-button-primary)
  },

  action: {
    default: '#D3F26E', // var(--action)
    hover: '#BCE04A',   // var(--action-hover)
    active: '#9BC22C',  // var(--action-active)
    edge: 'rgba(122, 158, 26, 0.30)', // var(--action-edge)
    text: '#0B3D2E',
  },

  buttonPrimary: {
    default: '#14654C', // var(--button-primary)
    hover: '#0F503D',   // var(--button-primary-hover)
    active: '#0B3D2E',  // var(--button-primary-active)
    text: '#FFFFFF',
  },

  marker: {
    bg: 'rgba(211, 242, 110, 0.30)', // var(--marker-bg)
    icon: '#0B3D2E',                 // var(--marker-icon)
  },

  border: {
    default: '#E4EBDB',              // var(--border)
    hover: '#CDD6C3',                // var(--border-hover)
    inverse: 'rgba(255, 255, 255, 0.09)',      // var(--border-inverse)
    inverseStrong: 'rgba(255, 255, 255, 0.22)',// var(--border-inverse-strong)
  },

  ratingStar: '#C9A24B',
  link: '#14654C',
  overlay: 'rgba(4, 25, 18, 0.55)',
};

export const radius = {
  pill: 9999, // --radius-pill (interactif : boutons, badges, inputs, chips)
  card: 20,   // --radius-card (cartes, modales, sheets)
  inner: 12,  // --radius-inner (squircles d'icônes, images encastrées)
  field: 14,  // --radius-field (champs de formulaires)
  sm: 8,
};

export const shadows = {
  xs: {
    shadowColor: '#141812',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  sm: {
    shadowColor: '#141812',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#141812',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
  },
  lg: {
    shadowColor: '#141812',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 32,
    elevation: 8,
  },
  float: {
    shadowColor: '#0B3D2E',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.07,
    shadowRadius: 32,
    elevation: 6,
  },
  action: {
    shadowColor: '#9BC22C',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.30,
    shadowRadius: 20,
    elevation: 5,
  },
};

export const typography = {
  fontDisplay: 'Fraunces_700Bold',
  fontDisplaySemiBold: 'Fraunces_600SemiBold',
  fontBody: 'Inter_400Regular',
  fontBodyMedium: 'Inter_500Medium',
  fontBodySemiBold: 'Inter_600SemiBold',
  fontBodyBold: 'Inter_700Bold',
  fontBodyExtraBold: 'Inter_800ExtraBold',
  sizes: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
  },
};
