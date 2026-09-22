import type { Metadata } from 'next';
import { Ravnoteza } from '@/components/demo/Ravnoteza';

export const metadata: Metadata = { title: 'Povratna sprega — Praktikum elektronike' };

export default function Strana() {
  return <Ravnoteza />;
}
