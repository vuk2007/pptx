import type { Metadata } from 'next';
import { Simulator } from '@/components/simulator/Simulator';

export const metadata: Metadata = { title: 'Simulator letenja — Praktikum elektronike' };

export default function Strana() {
  return <Simulator />;
}
