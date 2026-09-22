import type { Metadata } from 'next';
import { Ulaz } from '@/components/ulaz/Ulaz';

export const metadata: Metadata = { title: 'Praktikum elektronike — Prona' };

export default function Strana() {
  return <Ulaz />;
}
