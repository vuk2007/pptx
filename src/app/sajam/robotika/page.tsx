import Link from 'next/link';
import { Sema } from '@/components/slajdovi/crtezi';
import { EKSPONATI } from '@/lib/rute';
import stil from '@/components/pocetna/pocetna.module.css';

/*
  Redosljed eksponata prati petlju iznad njih: osjeti, odluči, djeluj.
  Zato psi stoje ispod senzora, Jarvis ispod mozga, a rover ispod motora.
*/
const PO_PETLJI = ['xgo', 'jarvis', 'perjanik'] as const;
const RIJEC = { osjeti: 'osjeti', odluci: 'odluči', djeluj: 'djeluj' } as const;

export default function Robotika() {
  const eksponati = PO_PETLJI.map((id) => EKSPONATI.find((e) => e.id === id)!);

  return (
    <main className={stil.strana}>
      <header className={stil.zaglavlje}>
        <div>
          <Link href="/sajam" className={stil.putanja}>
            <span aria-hidden="true">←</span>
            Prona
          </Link>
          <h1 className={stil.naslov}>Robotika</h1>
          <p className={stil.uvod}>Svaki robot radi tri stvari: osjeti, odluči i djeluje.</p>
        </div>
        <Link href="/sajam/izlog" className={stil.dugme}>
          Pokreni izlog
        </Link>
      </header>

      <figure className={stil.petlja}>
        <Sema kljuc="petlja-siroka" opis="Petlja: senzor, mozak, motor, pa opet iz početka" />
      </figure>

      <nav className={stil.eksponati} aria-label="Eksponati">
        {eksponati.map((e) => (
          <Link key={e.id} href={`/sajam/${e.id}`} className={stil.eksponat} style={{ ['--boja' as string]: `var(--${e.naglasak})` }}>
            <span className={stil.uloga}>{RIJEC[e.naglasak]}</span>
            <span className={stil.ime}>{e.naziv}</span>
            <span className={stil.opis}>{e.podnaslov}</span>
            <span className={stil.broj}>
              {e.demonstracije.length} {rijecDemonstracija(e.demonstracije.length)} koje možeš dirati →
            </span>
          </Link>
        ))}
      </nav>

      <footer className={stil.podnozje}>
        <Link href="/sajam/pocni">Kako da počneš i ti</Link>
        <Link href="/sajam/jarvis/frekvencije">Tri radija na štandu</Link>
        <Link href="/sajam/izlog/perjanik">Izlog samo za rover</Link>
        <Link href="/sajam/izlog/xgo">Izlog samo za pse</Link>
        <Link href="/sajam/izlog/jarvis">Izlog samo za Jarvisa</Link>
      </footer>
    </main>
  );
}

/*
  Broj eksponatovih demonstracija se mijenja kako sajt raste, pa oblik
  riječi ne smije biti zakucan: dvije, tri i četiri traže „demonstracije",
  pet i više „demonstracija".
*/
function rijecDemonstracija(broj: number): string {
  const desetice = broj % 100;
  if (desetice >= 11 && desetice <= 14) return 'demonstracija';
  const jedinica = broj % 10;
  if (jedinica === 1) return 'demonstracija';
  if (jedinica >= 2 && jedinica <= 4) return 'demonstracije';
  return 'demonstracija';
}
