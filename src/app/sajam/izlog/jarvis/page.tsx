import type { Metadata } from 'next';
import { Izlog } from '@/components/izlog/Izlog';
import { izlogEksponata } from '@/sadrzaj/slajdovi';

export const metadata: Metadata = { title: 'Izlog: Jarvis — Praktikum elektronike' };

export default function Strana() {
  return <Izlog slajdovi={izlogEksponata('jarvis')} putanja="Izlog · Jarvis" />;
}
