import type { Metadata } from 'next';
import { Toaster } from 'sonner';
import { BRAND } from '@/lib/config';
import { fraunces, inter } from '@/lib/theme/font';
import { ThemeProvider } from '@/providers/theme-provider';
import { NestSessionSync } from '@/providers/nest-session-sync';
import { QueryProvider } from '@/providers/query-provider';
import { TenantBottomNav } from '@/components/layout/tenant-bottom-nav';
import { PWARegister } from '@/components/pwa-register';
import './globals.css';

export const metadata: Metadata = {
  title: { default: BRAND.name, template: `%s — ${BRAND.name}` },
  description: BRAND.tagline,
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  manifest: '/manifest.json',
  themeColor: '#166534',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: BRAND.name,
  },
  applicationName: BRAND.name,
  icons: {
    icon: [
      { url: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="fr"
      className={`${fraunces.variable} ${inter.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body
        className="min-h-full flex flex-col bg-background text-foreground font-sans"
        suppressHydrationWarning
      >
        <ThemeProvider defaultMode="light">
          <QueryProvider>
            <NestSessionSync />
            <PWARegister />
            {children}
            <TenantBottomNav />
            <Toaster position="top-center" richColors closeButton />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}