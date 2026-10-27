import type { Metadata } from 'next';
import { StranaEksponata } from '@/components/eksponat/StranaEksponata';

export const metadata: Metadata = { title: 'XGO psi — Praktikum elektronike' };

export default function Strana() {
  return <StranaEksponata id="xgo" />;
}
