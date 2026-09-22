import type { Metadata } from 'next';
import { Noga } from '@/components/demo/Noga';

export const metadata: Metadata = { title: 'Noga — Praktikum elektronike' };

export default function Strana() {
  return <Noga />;
}
