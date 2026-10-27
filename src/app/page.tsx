import type { Metadata } from 'next';
import Link from 'next/link';
import { gotoviPredmeta, rijecEksperimenata } from '@/sadrzaj/eksperimenti';
import stil from '@/components/glavna/glavna.module.css';

export const metadata: Metadata = { title: 'Faks i sajam' };

/*
  Zajednička početna: dvije cjeline koje žive na istom sajtu.
  Faks je za učenje kod kuće, sajam za štand. Ništa od sajma se ovdje
  ne mijenja; samo mu je adresa sada /sajam.
*/
export default function Pocetna() {
  const oe1 = gotoviPredmeta('oe1').length;

  return (
    <main className={stil.strana}>
      {/* Dvije cjeline su same po sebi naslov; h1 postoji za čitače ekrana. */}
      <h1 className="samo-za-citace">Faks i sajam</h1>
      <nav className={stil.cjeline} aria-label="Cjeline">
        <Link href="/faks" className={stil.cjelina}>
          <span className={stil.ime}>Faks</span>
          <span className={stil.opis}>Interaktivni eksperimenti za prvu godinu elektrotehnike.</span>
          <span className={stil.detalj}>Osnove elektrotehnike I: {oe1} {rijecEksperimenata(oe1)}, ostali u izradi</span>
        </Link>
        <Link href="/sajam" className={stil.cjelina}>
          <span className={stil.ime}>Sajam</span>
          <span className={stil.opis}>Praktikum elektronike: Perjanik, XGO psi i Jarvis.</span>
          <span className={stil.detalj}>Izlog za TV i demonstracije za štand</span>
        </Link>
      </nav>
    </main>
  );
}
