import type { Metadata } from 'next';
import Link from 'next/link';
import { existsSync, readFileSync } from 'node:fs';
import { KLUBOVI_TEKST, QR_URL } from '@/config/cinjenice';
import { Ilustracija } from '@/components/ilustracije/registar';
import stil from '@/components/pocni/pocni.module.css';

export const metadata: Metadata = { title: 'Kako da počneš — Praktikum elektronike' };

/*
  Alati su opisani onim što o njima pouzdano znamo. Nema izmišljenih adresa —
  jedini put napolje je QR kod, i on postoji samo ako je QR_URL popunjen.
*/
const ALATI = [
  {
    naziv: 'micro:bit i MakeCode',
    opis: 'Besplatno i radi u browseru. Ne treba ti ništa da instaliraš.',
    oznaka: 'A1',
  },
  {
    naziv: 'Arduino',
    opis: 'Mali računar koji pokreće Perjanika. Isti onaj sa slajda.',
    oznaka: 'U1',
  },
  {
    naziv: 'Tinkercad Circuits',
    opis: 'Besplatan simulator kola. Spajaš žice na ekranu i odmah vidiš da li radi.',
    oznaka: 'S1',
  },
];

/** QR se pravi pri buildu u public/qr/pocni.svg. Ako ga nema, strana ide bez njega. */
function qrKod(): string | null {
  const putanja = 'public/qr/pocni.svg';
  if (!QR_URL || !existsSync(putanja)) return null;
  return readFileSync(putanja, 'utf8');
}

export default function Pocni() {
  const qr = qrKod();

  return (
    <main className={stil.ploca}>
      <span className={`${stil.rupa} ${stil.rupaGL}`} aria-hidden="true" />
      <span className={`${stil.rupa} ${stil.rupaGD}`} aria-hidden="true" />

      <header className={stil.zaglavlje}>
        <h1 className={stil.naslov}>Kako da počneš</h1>
        <Link href="/" className={stil.dugme}>
          Početna
        </Link>
      </header>

      <p className={stil.recenica}>
        Sve ovo je počelo sa jednim micro:bitom ili Arduinom i nekoliko žica.
      </p>

      <div className={stil.sredina}>
        <div className={stil.crtez}>
          <Ilustracija kljuc="zatvaranje" />
        </div>

        <div className={stil.desno}>
          <nav className={stil.alati} aria-label="Odakle da kreneš">
            {ALATI.map((a) => (
              <div key={a.naziv} className={stil.alat}>
                <span className={stil.oznakaAlata}>{a.oznaka}</span>
                <span className={stil.nazivAlata}>{a.naziv}</span>
                <span className={stil.opisAlata}>{a.opis}</span>
              </div>
            ))}

            {KLUBOVI_TEKST && (
              <div className={stil.alat}>
                <span className={stil.oznakaAlata}>K1</span>
                <span className={stil.nazivAlata}>Klubovi kod nas</span>
                <span className={stil.opisAlata}>{KLUBOVI_TEKST}</span>
              </div>
            )}
          </nav>

          {qr ? (
            <figure className={stil.qr}>
              <div className={stil.kodQr} dangerouslySetInnerHTML={{ __html: qr }} />
              <figcaption className={stil.natpisQr}>Slikaj telefonom</figcaption>
            </figure>
          ) : (
            <p className={stil.bezQr}>Pitaj nekoga za štandom da ti pokaže odakle da kreneš.</p>
          )}
        </div>
      </div>

      <footer className={stil.podnozje}>
        <span className="mikro">Jedna pločica, nekoliko žica, i jedna LED koja se upali kad treba.</span>
        <Link href="/izlog" className={stil.veza}>
          Nazad na izlog
        </Link>
      </footer>
    </main>
  );
}
