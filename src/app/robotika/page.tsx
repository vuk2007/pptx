import Link from 'next/link';
import { Ilustracija } from '@/components/ilustracije/registar';
import { BOJA, NAZIV, OZNAKA_LED } from '@/components/ploca/primitivi';
import { EKSPONATI } from '@/lib/rute';
import stil from '@/components/pocetna/pocetna.module.css';

/*
  Redosljed eksponata prati petlju iznad njih: osjeti, odluči, djeluj.
  Zato psi stoje ispod D1, Jarvis ispod D2, a rover ispod D3.
*/
const PO_PETLJI = ['xgo', 'jarvis', 'perjanik'] as const;

export default function Robotika() {
  const eksponati = PO_PETLJI.map((id) => EKSPONATI.find((e) => e.id === id)!);

  return (
    <main className={stil.ploca}>
      <span className={`${stil.rupa} ${stil.rupaGL}`} aria-hidden="true" />
      <span className={`${stil.rupa} ${stil.rupaGD}`} aria-hidden="true" />
      <span className={`${stil.rupa} ${stil.rupaDL}`} aria-hidden="true" />
      <span className={`${stil.rupa} ${stil.rupaDD}`} aria-hidden="true" />

      <header className={stil.zaglavlje}>
        <div>
          <h1 className={stil.naslov}>Praktikum elektronike</h1>
          <p className={stil.podnaslov}>Tri robota, jedna petlja.</p>
        </div>

        <div className={stil.akcijeZaglavlja}>
          <Link href="/izlog" className={stil.dugmeIzlog}>
            <span aria-hidden="true">▶</span>
            Pokreni izlog
          </Link>
          <Link href="/" className={stil.dugmeUlaz}>
            ← Prona
          </Link>
        </div>
      </header>

      <p className={stil.recenica}>Svaki robot radi tri stvari: osjeti, odluči i djeluje.</p>

      <div className={stil.petlja}>
        <Ilustracija kljuc="petlja-siroka" />
      </div>

      <nav className={stil.eksponati}>
        {eksponati.map((e) => (
          <Link
            key={e.id}
            href={`/${e.id}`}
            className={stil.eksponat}
            style={{ ['--boja' as string]: BOJA[e.naglasak] }}
          >
            <div className={stil.zaglavljeEksponata}>
              <span className={stil.nazivEksponata}>{e.naziv}</span>
              <span className={stil.ulogaEksponata}>
                {OZNAKA_LED[e.naglasak]} {NAZIV[e.naglasak]}
              </span>
            </div>
            <p className={stil.opisEksponata}>{e.podnaslov}</p>
            <span className={stil.brojDemo}>
              {e.demonstracije.length} {rijecDemonstracija(e.demonstracije.length)} koje možeš dirati
            </span>
          </Link>
        ))}
      </nav>

      <footer className={stil.podnozje}>
        <Link href="/pocni" className={stil.veza}>
          Kako da počneš i ti
        </Link>
        <Link href="/jarvis/frekvencije" className={stil.veza}>
          Tri radija na štandu
        </Link>
        <Link href="/izlog/perjanik" className={stil.veza}>
          Izlog samo za rover
        </Link>
        <Link href="/izlog/xgo" className={stil.veza}>
          Izlog samo za pse
        </Link>
        <Link href="/izlog/jarvis" className={stil.veza}>
          Izlog samo za Jarvisa
        </Link>
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
