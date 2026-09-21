import type { Metadata } from 'next';
import { HMost } from '@/components/demo/HMost';

export const metadata: Metadata = { title: 'H-most — Praktikum elektronike' };

export default function Strana() {
  return <HMost />;
}
