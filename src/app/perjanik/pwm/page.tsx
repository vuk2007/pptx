import type { Metadata } from 'next';
import { Pwm } from '@/components/demo/Pwm';

export const metadata: Metadata = { title: 'PWM — Praktikum elektronike' };

export default function Strana() {
  return <Pwm />;
}
