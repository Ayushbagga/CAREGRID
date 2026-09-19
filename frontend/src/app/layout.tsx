import type { Metadata, Viewport } from 'next';
import './globals.css';
import { OfflineBanner } from '@/components/shared/offline-banner';
import { LanguageProvider } from '@/lib/i18n/context';

export const metadata: Metadata = {
  title: 'CAREGRID: Rural Healthcare Access & Care Coordination',
  description:
    'Rural public healthcare coordination platform for ASHAs, PHCs, and citizens in Maharashtra. SIH26133 - Government of Maharashtra.',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32' },
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: [
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: '#0d9488',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased flex flex-col font-sans">
        <LanguageProvider>
          <OfflineBanner />
          <main className="flex-1">{children}</main>
        </LanguageProvider>
      </body>
    </html>
  );
}
