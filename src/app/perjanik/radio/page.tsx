import type { Metadata } from 'next';
import { Radio } from '@/components/demo/Radio';

export const metadata: Metadata = { title: 'Radio paket — Praktikum elektronike' };

export default function Strana() {
  return <Radio />;
}
