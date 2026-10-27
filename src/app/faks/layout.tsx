import type { Metadata } from 'next';
import stil from '@/components/faks/faks.module.css';
import './katex.css';

export const metadata: Metadata = {
  title: { default: 'Faks', template: '%s · Faks' },
  description: 'Interaktivni eksperimenti za prvu godinu elektrotehnike.',
};

export default function FaksLayout({ children }: { children: React.ReactNode }) {
  return <div className={stil.svitak}>{children}</div>;
}
