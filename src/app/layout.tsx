import type { Metadata, Viewport } from 'next';
import { Archivo, JetBrains_Mono } from 'next/font/google';
import { RegistracijaServiceWorkera } from '@/components/RegistracijaServiceWorkera';
import { Analitika } from '@/components/Analitika';
import './globals.css';

/*
  Archivo je varijabilan i po debljini i po širini: naslovi i velike brojke
  se sužavaju (font-stretch oko 72-78 %), tekst ostaje normalne širine.
  next/font ga preuzme pri buildu i servira sa našeg domena, pa radi offline.
  Oba fonta nose latin-ext, to je podskup u kojem žive č ć đ š ž.
*/
const tekst = Archivo({
  subsets: ['latin', 'latin-ext'],
  axes: ['wdth'],
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
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#edf1f4' },
    { media: '(prefers-color-scheme: dark)', color: '#0e1923' },
  ],
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
