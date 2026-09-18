import type { Metadata, Viewport } from 'next';
import './globals.css';
import { OfflineBanner } from '@/components/shared/offline-banner';

export const metadata: Metadata = {
  title: 'CAREGRID: Rural Healthcare Access & Care Coordination',
  description:
    'Rural public healthcare coordination platform for ASHAs, PHCs, and citizens in Maharashtra. SIH26133 - Government of Maharashtra.',
  manifest: '/manifest.json',
  icons: {
    icon: '/icons/icon-192x192.png',
    apple: '/icons/icon-192x192.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#0284c7',
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
    <html lang="mr">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased flex flex-col font-sans">
        <OfflineBanner locale="mr" />
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
