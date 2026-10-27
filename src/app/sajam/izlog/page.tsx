import type { Metadata } from 'next';
import { Izlog } from '@/components/izlog/Izlog';
import { SVI_SLAJDOVI } from '@/sadrzaj/slajdovi';

export const metadata: Metadata = { title: 'Izlog — Praktikum elektronike' };

export default function Strana() {
  return <Izlog slajdovi={SVI_SLAJDOVI} putanja="Izlog" />;
}
