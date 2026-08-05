// ─────────────────────────────────────────────────────────────────────────────
// Klef — Design Tokens : Couleurs  ·  v2.1
// ─────────────────────────────────────────────────────────────────────────────
//
// ⚠️  SOURCE DE VÉRITÉ : globals.css
//     Ce fichier en est un MIROIR. Toute modification part de globals.css et
//     descend ici, jamais l'inverse. Utiliser ces valeurs uniquement là où le
//     CSS n'est pas accessible : canvas, meta theme-color, images OG,
//     React Native / Flutter, e-mails transactionnels.
//     Dans le DOM, préférer TOUJOURS var(--token) plutôt que ces constantes.
//
// ─────────────────────────────────────────────────────────────────────────────
// TROIS VOIX, JAMAIS PLUS
//
//   forest  #14654C → #041912   Structure, texte, surfaces sombres
//   lime    #D3F26E             ACTION — un seul CTA plein par écran
//   gold    #C9A24B             STATUT — badge Vérifié, étoiles. Jamais cliquable.
//
// ─────────────────────────────────────────────────────────────────────────────
// LA RÈGLE QUI TIENT LE SYSTÈME
//
//   L'accent ne porte JAMAIS de texte lisible.
//   Il marque : icône, point, bordure, remplissage de bouton, UN mot dans un
//   titre. Si vous écrivez une phrase en lime, vous l'avez dégradé en couleur
//   de contenu, et la hiérarchie s'effondre.
//
//   Corollaire 1 : sur un fond lime, le texte est textOnAction (#0B3D2E).
//   JAMAIS de blanc — 1.26:1. Sur gold, blanc = 2.40:1, tout aussi interdit.
//
//   Corollaire 2 : sur une surface sombre, le TITRE est neutre (#F8FBF4).
//   Institutionnaliser le lime comme couleur de titre le vide de son sens
//   d'action — surtout s'il y a un CTA lime dans la même section.
//
//   Tous les ratios de ce fichier sont calculés, pas estimés, et vérifiés par
//   CONTRAST_CONTRACT en bas de fichier. Un commentaire ne vérifie rien.
// ─────────────────────────────────────────────────────────────────────────────

export const colors = {
  // ── Forest — la structure ──────────────────────────────────────────────────
  // Rampe régulière. 600 = couleur de marque. 900/950 = surfaces sombres.
  forest: {
    50: '#ECF6F1',
    100: '#D2EADF',
    200: '#A8D5C1',   // ★ texte secondaire sur fond sombre — 9.52:1
    300: '#77BB9E',
    400: '#479C79',
    500: '#22805D',
    600: '#14654C',   // ★ MARQUE — blanc dessus : 7.01:1
    700: '#0F503D',
    800: '#0B3D2E',   // ★ texte sur lime — 9.70:1
    900: '#072A20',   // ★ surface sombre
    950: '#041912',   // ★ le "noir" du système (il est vert)
  },

  // ── Lime — l'action ────────────────────────────────────────────────────────
  // 400 = CTA. 300 = marqueur sur fond sombre.
  // ⚠ Correction v2.1 : 700 ne passe AA qu'en TEXTE LARGE (3.35:1). Le premier
  //   stop lisible en texte courant sur fond clair est 800 (5.61:1).
  lime: {
    50: '#F7FCE9',
    100: '#EEF9CE',
    200: '#E4F7B8',
    300: '#DFF5A4',   // ★ marqueur sur fond sombre — 13.03:1
    400: '#D3F26E',   // ★ CTA
    500: '#BCE04A',   // hover
    600: '#9BC22C',   // active + teinte de l'ombre portée
    700: '#74941C',   // ⚠ texte LARGE uniquement — 3.35:1
    800: '#556D15',   // ★ texte lime courant sur clair — 5.61:1
    900: '#3A4A0E',   // 9.28:1
  },

  // ── Gold — le statut ───────────────────────────────────────────────────────
  // Usage strict : badge Vérifié, étoiles. Jamais un bouton.
  // Si l'or devient cliquable, l'utilisateur ne distingue plus statut et action.
  gold: {
    50: '#FBF6E9',
    100: '#F4E9CB',
    200: '#E9D398',
    300: '#DABB68',   // ★ badge en mode sombre — 8.29:1 sur forest-900
    400: '#C9A24B',   // ★ Badge Vérifié Klef — blanc dessus : 2.40:1, interdit
    500: '#A88336',
    600: '#856527',
    700: '#63491B',   // ★ texte sur gold-50 — 7.79:1
    800: '#423110',   // ★ texte sur gold-100 — 10.35:1
  },

  // ── Neutres — blanc vert froid ─────────────────────────────────────────────
  // Teinte ~86–100°, alignée sur le forest. L'ancien sable chaud (~50°) était
  // incompatible : il faisait virer le lime au moutarde.
  neutral: {
    0: '#FFFFFF',
    50: '#F8FBF4',   // ★ fond de page + texte sur fond sombre — 14.77:1
    100: '#F1F6EA',
    200: '#E4EBDB',   // bordures
    300: '#CDD6C3',
    400: '#A3AE99',   // ⚠ 2.22:1 — décoratif (séparateurs, icônes inertes).
    //   Ne jamais y mettre de texte, même secondaire.
    500: '#7D8975',
    600: '#5F6B59',   // ★ texte secondaire — 5.38:1
    700: '#475041',
    800: '#333A2F',
    900: '#22271F',   // ★ texte principal — 14.58:1
    950: '#141812',
  },

  // ── Sémantiques — retonalisées vers la famille ─────────────────────────────
  // Les bleus/verts Tailwind bruts juraient avec les neutres verts.
  success: { 50: '#E9F6EC', 500: '#2E9E52', 600: '#1F7D3E', 700: '#175E2F' },
  warning: { 50: '#FDF4E3', 500: '#D99A22', 600: '#B47B14', 700: '#8A5D0E' },
  error: { 50: '#FBEDEB', 500: '#D64B3C', 600: '#B33628', 700: '#8A281D' },
  info: { 50: '#E9F2F5', 500: '#3A7D95', 600: '#2A6076', 700: '#1E4757' },
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// RACCOURCIS SÉMANTIQUES — MODE CLAIR
// ─────────────────────────────────────────────────────────────────────────────

export const semanticColors = {
  background: colors.neutral[50],
  backgroundAlt: colors.neutral[100],
  backgroundCard: colors.neutral[0],

  textPrimary: colors.neutral[900],
  textSecondary: colors.neutral[600],
  textFaint: colors.neutral[400],  // ⚠ décoratif — pas du texte (2.22:1)

  // Texte sur fonds pleins — chaque valeur est vérifiée, ne pas improviser
  textOnPrimary: '#FFFFFF',            // sur forest-600 : 7.01:1  ✓
  textOnAction: colors.forest[800],   // sur lime-400   : 9.70:1  ✓
  textOnGold: colors.gold[800],     // sur gold-100   : 10.35:1 ✓
  // ⛔ JAMAIS '#FFFFFF' sur lime (1.26:1) ni sur gold (2.40:1).

  // Texte lime sur fond clair — le seul stop AA en texte courant
  textLime: colors.lime[800],     // sur neutral-50 : 5.61:1  ✓
  textLimeLarge: colors.lime[700],     // ≥ 18.66px bold ou ≥ 24px : 3.35:1 ✓

  border: colors.neutral[200],
  borderHover: colors.neutral[300],
  borderFocus: colors.forest[500],

  // ── Action de conversion — UN SEUL bouton plein par écran ────────────────
  // actionEdge compense le faible contraste du lime sur fond clair (1.20:1) :
  // le bouton se détache par son contour, pas par sa couleur.
  action: colors.lime[400],
  actionHover: colors.lime[500],
  actionActive: colors.lime[600],
  actionEdge: 'rgba(122, 158, 26, 0.30)',
  actionGlow: '0 6px 20px rgba(155, 194, 44, 0.30)',
  actionGlowHover: '0 8px 26px rgba(155, 194, 44, 0.38)',

  // ── Actions structurantes (confirmer, naviguer) — vert, pas lime ─────────
  // Un formulaire a plusieurs boutons ; un seul peut être lime.
  buttonPrimary: colors.forest[600],
  buttonPrimaryHover: colors.forest[700],
  buttonPrimaryActive: colors.forest[800],
  onButtonPrimary: colors.neutral[0],   // 7.01:1
  buttonSecondary: colors.forest[50],
  buttonSecondaryHover: colors.forest[100],

  // ── Marqueur — le squircle d'icône qui identifie sans écrire ─────────────
  markerBg: 'rgba(211, 242, 110, 0.30)',
  markerIcon: colors.forest[800],

  // ── Statut ───────────────────────────────────────────────────────────────
  badgeVerifiedBg: colors.gold[50],
  badgeVerifiedText: colors.gold[700],
  badgeVerifiedBorder: colors.gold[200],
  ratingStar: colors.gold[400],

  link: colors.forest[600],   // 6.71:1
  linkHover: colors.forest[700],

  overlay: 'rgba(4, 25, 18, 0.55)',
  overlayLight: 'rgba(20, 101, 76, 0.12)',
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// SURFACES INVERSÉES — sections sombres encastrées (mode clair)
// ─────────────────────────────────────────────────────────────────────────────
// Le titre est NEUTRE, jamais lime. C'était la divergence entre globals.css et
// ce fichier en v2 : le CSS colorait les h1/h2/h3 en lime-300, ce fichier
// documentait l'inverse. Arbitré en faveur du titre neutre — cf. Corollaire 2.
// Le lime survit ici comme `marker` : icône, point, ou UN mot dans le titre.

export const inverseColors = {
  surface: colors.forest[900],
  surfaceAlt: colors.forest[950],
  text: colors.neutral[50],   // ★ titres ET corps fort — 14.77:1
  display: colors.neutral[50],   // ★ titres — identique à `text`, explicite
  textMuted: colors.forest[200],   // ★ corps secondaire — 9.52:1
  marker: colors.lime[300],     // ★ icône, point, OU un mot — 13.03:1
  markerBg: 'rgba(211, 242, 110, 0.13)',
  markerEdge: 'rgba(211, 242, 110, 0.20)',
  border: 'rgba(255, 255, 255, 0.09)',
  borderStrong: 'rgba(255, 255, 255, 0.22)',
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// SURFACES INVERSÉES — en MODE SOMBRE, "inverse" devient clair
// ─────────────────────────────────────────────────────────────────────────────
// Piège : lime-400 sur blanc = 1.26:1. Le marqueur doit descendre à lime-800.

export const inverseColorsDark = {
  surface: colors.neutral[0],
  surfaceAlt: colors.neutral[50],
  text: colors.forest[900],   // 15.43:1
  display: colors.forest[900],
  textMuted: colors.neutral[600],  // 5.62:1
  marker: colors.lime[800],     // 5.86:1 — surtout pas lime-400
  markerBg: 'rgba(85, 109, 21, 0.10)',
  markerEdge: 'rgba(85, 109, 21, 0.20)',
  border: 'rgba(4, 25, 18, 0.10)',
  borderStrong: 'rgba(4, 25, 18, 0.22)',
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// GRADIENTS
// ─────────────────────────────────────────────────────────────────────────────

export const gradients = {
  // Canvas — radial ancré en haut-gauche. À poser sur <main>, pas sur <body> :
  // sur une page de listing longue, un dégradé fixe devient une tache.
  canvas: [
    'radial-gradient(115% 85% at 0% 0%, #E8F6C9 0%, rgba(232,246,201,0) 58%)',
    'radial-gradient(90% 70% at 100% 0%, #EDF7E4 0%, rgba(237,247,228,0) 50%)',
    'linear-gradient(165deg, #F4FAEA 0%, #FAFCF6 60%, #FFFFFF 100%)',
  ].join(', '),

  canvasDark: [
    'radial-gradient(115% 85% at 0% 0%, #0D3B2C 0%, rgba(13,59,44,0) 58%)',
    'linear-gradient(165deg, #08251B 0%, #041912 70%)',
  ].join(', '),

  // Halo de la section sombre — c'est lui qui fait le raccord de luminosité
  // avec le canvas clair et évite l'arête franche.
  inverse: [
    'radial-gradient(72% 58% at 50% 0%, #0F503D 0%, rgba(15,80,61,0) 68%)',
    'linear-gradient(180deg, #072A20 0%, #041912 100%)',
  ].join(', '),

  inverseDark: 'linear-gradient(180deg, #FFFFFF 0%, #F8FBF4 100%)',
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// GLASS — uniquement au-dessus d'une photo, d'une carte ou du dégradé
// ─────────────────────────────────────────────────────────────────────────────
// Sur un aplat, backdrop-filter ne produit rien de visible et coûte du GPU.
// Toujours fournir le fallback opaque : Android d'entrée de gamme, et
// prefers-reduced-transparency.

export const glass = {
  blur: 'blur(16px) saturate(155%)',
  blurStrong: 'blur(24px) saturate(165%)',
  lightBg: 'rgba(255, 255, 255, 0.56)',
  lightBgFallback: 'rgba(255, 255, 255, 0.88)',
  lightBorder: 'rgba(255, 255, 255, 0.64)',
  darkBg: 'rgba(7, 42, 32, 0.44)',
  darkBgFallback: 'rgba(7, 42, 32, 0.84)',
  darkBorder: 'rgba(255, 255, 255, 0.14)',
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// RAYONS
// ─────────────────────────────────────────────────────────────────────────────
// Deux de premier plan : pill et card. inner et field sont subordonnés — ils
// n'apparaissent qu'à l'intérieur d'une carte, jamais au premier niveau.

export const radius = {
  pill: '9999px',  // boutons, badges, inputs, chips — tout l'interactif
  card: '20px',    // cartes, modales, sections encastrées — tout le conteneur
  inner: '12px',    // squircles d'icônes, images dans une carte
  field: '14px',    // champs de formulaire non-pill (textarea, select)
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// OMBRES — froides, très diffuses, pas de glow (sauf sur l'action)
// ─────────────────────────────────────────────────────────────────────────────

export const shadows = {
  xs: '0 1px 2px rgba(20,24,18,0.04)',
  sm: '0 1px 3px rgba(20,24,18,0.05), 0 1px 2px rgba(20,24,18,0.03)',
  md: '0 4px 16px rgba(20,24,18,0.06), 0 1px 3px rgba(20,24,18,0.04)',
  lg: '0 12px 32px rgba(20,24,18,0.08), 0 4px 8px rgba(20,24,18,0.04)',
  xl: '0 24px 56px rgba(20,24,18,0.10), 0 8px 16px rgba(20,24,18,0.05)',
  float: '0 8px 32px rgba(11,61,46,0.07)',        // surfaces en glass
  action: '0 6px 20px rgba(155, 194, 44, 0.30)',
  actionHover: '0 8px 26px rgba(155, 194, 44, 0.38)',
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// MOTION
// ─────────────────────────────────────────────────────────────────────────────

export const motion = {
  fast: 120,
  base: 200,
  slow: 320,
  ease: 'cubic-bezier(0.22, 1, 0.36, 1)',
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// GARDE-FOU — empêche les bugs de contraste de réapparaître
// ─────────────────────────────────────────────────────────────────────────────
// La v2 portait trois ratios faux, dont un qui masquait un vrai échec AA
// (lime-700 annoncé « AA » à 4.5, mesuré à 3.35). Un commentaire ne vérifie
// rien. Ceci, si — à condition d'être exécuté en test.

const srgb = (v: number) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);

/** Luminance relative WCAG d'une couleur hex (#RGB ou #RRGGBB). */
export function luminance(hex: string): number {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const [r, g, b] = [0, 2, 4].map((i) => srgb(parseInt(h.slice(i, i + 2), 16) / 255));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Ratio de contraste WCAG entre deux couleurs hex. */
export function contrastRatio(a: string, b: string): number {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

/**
 * Vérifie une paire texte/fond. En dev, log un avertissement si le seuil
 * n'est pas atteint. Appeler dans les composants de bouton/badge.
 *
 * @param size 'normal' = seuil 4.5 · 'large' = seuil 3.0 (≥ 18.66px bold ou ≥ 24px)
 */
export function assertReadable(
  fg: string,
  bg: string,
  label: string,
  size: 'normal' | 'large' = 'normal',
): boolean {
  const ratio = contrastRatio(fg, bg);
  const min = size === 'large' ? 3 : 4.5;
  const ok = ratio >= min;
  if (!ok && process.env.NODE_ENV !== 'production') {
    console.warn(
      `[Klef·contraste] ${label} — ${fg} sur ${bg} = ${ratio.toFixed(2)}:1 ` +
      `(seuil ${min}). Voir la règle : l'accent ne porte jamais de texte.`,
    );
  }
  return ok;
}

type Size = 'normal' | 'large';

/** Paires qui DOIVENT passer. À exécuter dans un test unitaire. */
export const CONTRAST_CONTRACT: ReadonlyArray<{
  fg: string; bg: string; label: string; size: Size;
}> = [
  { fg: semanticColors.textOnAction, bg: semanticColors.action, label: 'texte sur CTA lime', size: 'normal' },
  { fg: semanticColors.textOnPrimary, bg: semanticColors.buttonPrimary, label: 'blanc sur vert forêt', size: 'normal' },
  { fg: semanticColors.textPrimary, bg: semanticColors.background, label: 'texte principal', size: 'normal' },
  { fg: semanticColors.textSecondary, bg: semanticColors.background, label: 'texte secondaire', size: 'normal' },
  { fg: semanticColors.textLime, bg: semanticColors.background, label: 'texte lime sur clair', size: 'normal' },
  { fg: semanticColors.textLimeLarge, bg: semanticColors.background, label: 'titre lime sur clair', size: 'large' },
  { fg: semanticColors.link, bg: semanticColors.background, label: 'lien', size: 'normal' },
  { fg: inverseColors.display, bg: inverseColors.surface, label: 'titre sur fond sombre', size: 'normal' },
  { fg: inverseColors.textMuted, bg: inverseColors.surface, label: 'corps sur fond sombre', size: 'normal' },
  { fg: inverseColors.marker, bg: inverseColors.surface, label: 'marqueur sur fond sombre', size: 'normal' },
  { fg: inverseColorsDark.display, bg: inverseColorsDark.surface, label: 'titre sur inverse clair', size: 'normal' },
  { fg: inverseColorsDark.textMuted, bg: inverseColorsDark.surface, label: 'corps sur inverse clair', size: 'normal' },
  { fg: inverseColorsDark.marker, bg: inverseColorsDark.surface, label: 'marqueur sur inverse clair', size: 'normal' },
  { fg: semanticColors.badgeVerifiedText, bg: semanticColors.badgeVerifiedBg, label: 'badge Vérifié', size: 'normal' },
  { fg: colors.gold[300], bg: colors.forest[900], label: 'badge Vérifié (sombre)', size: 'normal' },
] as const;

/**
 * Paires INTERDITES. Le test doit vérifier qu'elles échouent bien — si l'une
 * se met à passer, c'est qu'une rampe a bougé et que la règle a changé de sens.
 */
export const CONTRAST_FORBIDDEN = [
  { fg: '#FFFFFF', bg: semanticColors.action, label: 'blanc sur lime', measured: 1.26 },
  { fg: '#FFFFFF', bg: colors.gold[400], label: 'blanc sur gold', measured: 2.40 },
  { fg: colors.lime[400], bg: colors.neutral[0], label: 'lime sur blanc', measured: 1.26 },
  { fg: colors.neutral[400], bg: colors.neutral[50], label: 'neutral-400 en texte', measured: 2.22 },
] as const;

export type ColorScale = typeof colors.forest;
export type SemanticColors = typeof semanticColors;
export type InverseColors = typeof inverseColors;