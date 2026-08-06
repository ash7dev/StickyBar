import type { Metadata, Viewport } from 'next';
import { Toaster } from 'sonner';
import { BRAND } from '@/lib/config';
import { fraunces, inter } from '@/lib/theme/font';
import { ThemeProvider } from '@/providers/theme-provider';
import { NestSessionSync } from '@/providers/nest-session-sync';
import { QueryProvider } from '@/providers/query-provider';
import { PWARegister } from '@/components/pwa-register';
import { CookieConsentModal } from '@/components/cookies/CookieConsentModal';
import { InstallAppModal } from '@/components/pwa/InstallAppModal';
import { KlefAssistantWidget } from '@/components/assistant/KlefAssistantWidget';
import './globals.css';

// ─────────────────────────────────────────────────────────────────────────────
// METADATA
// ─────────────────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  // Sans metadataBase, Next émet un avertissement et les images OG relatives
  // sont résolues sur localhost en production.
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://klef.sn'),

  title: { default: BRAND.name, template: `%s — ${BRAND.name}` },
  description: BRAND.tagline,
  applicationName: BRAND.name,
  manifest: '/manifest.json',

  appleWebApp: {
    capable: true,
    // 'black-translucent' fait passer le contenu SOUS la barre d'état.
    // Il exige viewportFit: 'cover' (plus bas) ET du padding safe-area,
    // sinon le haut de la page est mangé par l'encoche.
    statusBarStyle: 'black-translucent',
    title: BRAND.name,
  },

  icons: {
    icon: [
      { url: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/icon-192x192.png', sizes: '192x192', type: 'image/png' }],
  },

  formatDetection: {
    // Empêche iOS de transformer « 450 000 F » ou une référence de bien
    // en lien téléphonique bleu souligné, ce qui casse la typo des prix.
    telephone: false,
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// VIEWPORT — export séparé
// ─────────────────────────────────────────────────────────────────────────────
// `viewport` et `themeColor` dans `metadata` sont dépréciés depuis Next 14 :
// ils sont ignorés et Next émet « Unsupported metadata ... is configured in
// metadata export ». Les balises n'étaient donc pas rendues.
// ─────────────────────────────────────────────────────────────────────────────

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,

  // ⛔ maximumScale: 1 et userScalable: false ont été RETIRÉS.
  //    Ils bloquaient le zoom pincé — échec WCAG 1.4.4 (Resize Text).
  //    Sur Klef, l'utilisateur lit un bail, un montant de séquestre et des
  //    conditions de rétractation sur un écran de 5 pouces. Lui interdire de
  //    zoomer est un problème d'accès réel, pas une coquetterie de norme.
  //    Le zoom involontaire au focus d'un input se règle par font-size: 16px
  //    sur les champs — c'est déjà fait dans globals.css.

  // Nécessaire pour 'black-translucent' : l'app occupe toute la dalle,
  // encoche comprise. À compenser avec env(safe-area-inset-*) en CSS.
  viewportFit: 'cover',

  // Corrigé : '#166534' était le green-800 de Tailwind, absent du système.
  // La couleur doit correspondre à ce que l'utilisateur voit réellement en
  // haut de l'écran — soit le sommet du dégradé canvas en clair, soit la
  // surface forest en sombre.
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F4FAEA' },
    { media: '(prefers-color-scheme: dark)',  color: '#041912' },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="fr"
      data-scroll-behavior="smooth"
      className={`${fraunces.variable} ${inter.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body
        className="min-h-full flex flex-col bg-background text-foreground font-sans"
        suppressHydrationWarning
      >
        {/* Lien d'évitement — premier élément focusable, visible au Tab.
            Obligatoire dès qu'il y a une navigation persistante. */}
        <a
          href="#contenu"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[80]
                     focus:rounded-full focus:bg-action focus:px-5 focus:py-3
                     focus:text-on-action focus:font-semibold focus:shadow-lg"
        >
          Aller au contenu
        </a>

        <ThemeProvider defaultMode="light">
          <QueryProvider>
            <NestSessionSync />
            <PWARegister />

            <main id="contenu" className="flex-1">
              {children}
            </main>

            {/* ⛔ TenantBottomNav a été retiré du layout racine.
                Il s'affichait sur /login, /inscription, l'espace bailleur et
                l'admin — soit une navigation locataire montrée à des gens qui
                ne sont pas locataires, et un décalage de 4rem en bas de pages
                qui n'en ont pas besoin.

                À déplacer dans le layout du groupe de routes concerné :
                  app/(locataire)/layout.tsx

                Ce layout devra aussi porter le dégagement bas :
                  <div className="pb-[calc(4rem+env(safe-area-inset-bottom))]" />
                sinon la barre fixe recouvre le dernier élément de chaque page. */}

            <Toaster
              // 'top-center' passait sous la navbar flottante (sticky, top: 1rem).
              // 'bottom-center' avec décalage safe-area évite le chevauchement
              // et rapproche le toast du pouce sur mobile.
              position="bottom-center"
              offset="calc(env(safe-area-inset-bottom) + 1rem)"
              richColors
              closeButton
            />

            <CookieConsentModal />
            <InstallAppModal />
            <KlefAssistantWidget />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
