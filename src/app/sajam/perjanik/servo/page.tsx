import type { Metadata } from 'next';
import { Servo } from '@/components/demo/Servo';

export const metadata: Metadata = { title: 'Dvostruki servo — Praktikum elektronike' };

export default function Strana() {
  return <Servo />;
}
