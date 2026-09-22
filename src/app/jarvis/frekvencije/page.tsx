import type { Metadata } from 'next';
import { Frekvencije } from '@/components/demo/Frekvencije';

export const metadata: Metadata = { title: 'Tri radija na štandu — Praktikum elektronike' };

export default function Strana() {
  return <Frekvencije />;
}
