import type { Metadata } from 'next';
import { Izlog } from '@/components/izlog/Izlog';
import { izlogEksponata } from '@/sadrzaj/slajdovi';

export const metadata: Metadata = { title: 'Izlog: XGO psi — Praktikum elektronike' };

export default function Strana() {
  return <Izlog slajdovi={izlogEksponata('xgo')} putanja="Izlog · XGO psi" />;
}
