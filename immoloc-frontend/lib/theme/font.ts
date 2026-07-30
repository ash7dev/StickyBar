// ─────────────────────────────────────────────────────────────────────────────
// Klef — Polices (Next.js 16, next/font)
// Fraunces : titres (display). Inter : interface, corps, prix.
// ─────────────────────────────────────────────────────────────────────────────

import { Fraunces, Inter } from 'next/font/google';

// ── Fraunces ────────────────────────────────────────────────────────────────
//
// Correction : `weight: ['500','600']` demandait DEUX fichiers statiques et
// supprimait l'axe variable. Or Fraunces est une variable font dont tout
// l'intérêt tient à ses axes :
//
//   opsz  optical size — épaissit les fûts et resserre le crénage aux petites
//         tailles, affine aux grandes. Sans lui, un h1 à 54px paraît lourd
//         et un h3 à 20px paraît fragile.
//   SOFT  adoucit les angles. À 0 la fonte est sèche ; monter un peu la rend
//         moins austère à côté du lime.
//   WONK  active les formes asymétriques (le « g », le « y »). C'est la
//         signature de Fraunces — et ce qui empêche Klef de ressembler
//         à n'importe quel produit en serif générique.
//
// En omettant `weight`, on récupère la plage variable complète en un seul
// fichier : plus léger que deux statiques, et on peut écrire font-weight: 560.

export const fraunces = Fraunces({
  subsets: ['latin'],
  axes: ['SOFT', 'WONK', 'opsz'],
  variable: '--font-fraunces',
  display: 'swap',
  preload: true,
  fallback: ['Georgia', 'Times New Roman', 'serif'],
});

// ── Inter ───────────────────────────────────────────────────────────────────
//
// Même correction : sans `weight`, on obtient la plage 100–900 variable.
// `adjustFontFallback` (actif par défaut) synthétise une police de repli
// aux métriques ajustées, ce qui supprime le décalage de mise en page au
// moment du swap — important sur une connexion mobile à Dakar.

export const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  preload: true,
  fallback: ['system-ui', 'Segoe UI', 'Helvetica Neue', 'Arial', 'sans-serif'],
});

// ─────────────────────────────────────────────────────────────────────────────
// Réglages Fraunces à poser dans globals.css :
//
//   h1, h2, h3 {
//     font-family: var(--font-fraunces), Georgia, serif;
//     font-weight: 600;
//     font-variation-settings: 'SOFT' 25, 'WONK' 1;
//   }
//
// SOFT 25 sur 0–100 : perceptible sans devenir mou.
// WONK 1 : formes asymétriques activées.
// opsz est piloté automatiquement par le navigateur selon font-size.
//
// ─────────────────────────────────────────────────────────────────────────────
// Dans app/layout.tsx :
//
//   import { fraunces, inter } from '@/lib/theme/font';
//
//   <html lang="fr" className={`${fraunces.variable} ${inter.variable}`}>
//
// ⚠️  Le commentaire précédent indiquait '@/lib/design/fonts' alors que le
//     fichier vit dans '@/lib/theme/font'. Chemin corrigé.
// ─────────────────────────────────────────────────────────────────────────────