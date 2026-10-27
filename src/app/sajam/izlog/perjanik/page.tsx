import type { Metadata } from 'next';
import { Izlog } from '@/components/izlog/Izlog';
import { izlogEksponata } from '@/sadrzaj/slajdovi';

export const metadata: Metadata = { title: 'Izlog: Perjanik — Praktikum elektronike' };

export default function Strana() {
  return <Izlog slajdovi={izlogEksponata('perjanik')} putanja="Izlog · Perjanik" />;
}
