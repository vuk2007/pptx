import type { Metadata, Viewport } from 'next';
import { Barlow_Condensed, JetBrains_Mono } from 'next/font/google';
import { RegistracijaServiceWorkera } from '@/components/RegistracijaServiceWorkera';
import { Analitika } from '@/components/Analitika';
import './globals.css';

/* Oba fonta nose latin-ext, to je podskup u kojem žive č ć đ š ž. */
const tekst = Barlow_Condensed({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-tekst',
  display: 'swap',
});

const mono = JetBrains_Mono({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '700'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Praktikum elektronike',
  description: 'Osjeti, odluči, djeluj — tri robota i principi iza njih.',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: 'Praktikum',
    statusBarStyle: 'black-translucent',
  },
  icons: {
    icon: [{ url: '/icons/ikona-192.png', sizes: '192x192', type: 'image/png' }],
    apple: [{ url: '/icons/ikona-180.png', sizes: '180x180', type: 'image/png' }],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#061a13',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="cnr" className={`${tekst.variable} ${mono.variable}`}>
      <body>
        {children}
        <RegistracijaServiceWorkera />
        <Analitika />
      </body>
    </html>
  );
}
