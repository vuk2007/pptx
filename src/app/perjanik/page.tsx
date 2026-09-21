import type { Metadata } from 'next';
import { StranaEksponata } from '@/components/eksponat/StranaEksponata';

export const metadata: Metadata = { title: 'Perjanik — Praktikum elektronike' };

export default function Strana() {
  return <StranaEksponata id="perjanik" />;
}
