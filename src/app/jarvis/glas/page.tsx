import type { Metadata } from 'next';
import { Glas } from '@/components/demo/Glas';

export const metadata: Metadata = { title: 'Tvoj glas uživo — Praktikum elektronike' };

export default function Strana() {
  return <Glas />;
}
