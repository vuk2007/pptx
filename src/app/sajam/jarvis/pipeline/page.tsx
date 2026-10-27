import type { Metadata } from 'next';
import { Pipeline } from '@/components/demo/Pipeline';

export const metadata: Metadata = { title: 'Pipeline i brzina — Praktikum elektronike' };

export default function Strana() {
  return <Pipeline />;
}
