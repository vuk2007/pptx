import type { Metadata } from 'next';
import { Suspenzija } from '@/components/demo/Suspenzija';

export const metadata: Metadata = { title: 'Suspenzija — Praktikum elektronike' };

export default function Strana() {
  return <Suspenzija />;
}
