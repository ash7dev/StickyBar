// ── ImmoLoc — Polices (Next.js 16, next/font) ──────────────────────────────
// Fraunces : titres (display). Inter : interface, corps, prix.
// Sous-ensembles latin uniquement — léger pour la PWA.

import { Fraunces, Inter } from 'next/font/google';

export const fraunces = Fraunces({
  subsets: ['latin'],
  weight: ['500', '600'],
  variable: '--font-fraunces',
  display: 'swap',
});

export const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-inter',
  display: 'swap',
});

// Dans app/layout.tsx :
//
// import { fraunces, inter } from '@/lib/design/fonts';
//
// <html lang="fr" className={`${fraunces.variable} ${inter.variable}`}>
//   <body>{children}</body>
// </html>