import type { Metadata } from 'next';
import { Komanda } from '@/components/demo/Komanda';

export const metadata: Metadata = { title: 'Put komande — Praktikum elektronike' };

export default function Strana() {
  return <Komanda />;
}
