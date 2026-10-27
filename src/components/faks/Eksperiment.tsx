import Link from 'next/link';
import type { Eksperiment as Zapis, Poglavlje, Predmet } from '@/sadrzaj/eksperimenti';
import type { SadrzajEksperimenta } from './tipovi';
import { Formula, M } from './Formula';
import { Predvidi } from './Predvidi';
import stil from './faks.module.css';

/*
  Svaka strana eksperimenta ima isti raspored, istim redom:
  naslov i poglavlje, predviđanje, interaktivni dio, šta gledaš,
  veza sa formulom, česta greška.
*/
export function Eksperiment({
  zapis,
  predmet,
  poglavlje,
  sadrzaj,
  prethodni,
  sljedeci,
}: {
  zapis: Zapis;
  predmet: Predmet;
  poglavlje?: Poglavlje;
  sadrzaj: SadrzajEksperimenta;
  prethodni?: Zapis;
  sljedeci?: Zapis;
}) {
  const { predvidi, Simulacija, staGledas, formula, greska } = sadrzaj;
  const listaPredmeta = `/faks/${predmet.id}`;

  return (
    <main className={stil.strana}>
      <nav className={stil.putanja} aria-label="Putanja">
        <Link href="/faks">Faks</Link>
        <span aria-hidden="true">/</span>
        <Link href={listaPredmeta}>{predmet.id.toUpperCase()}</Link>
      </nav>

      <header className={stil.zaglavlje}>
        <p className={stil.poglavlje}>
          <span className={stil.paragraf}>{zapis.poglavlje === 'alati' ? 'Alat' : zapis.poglavlje}</span>
          {poglavlje && (
            <>
              {poglavlje.naziv}
              {poglavlje.slovenski && (
                <>
                  {' '}
                  (<i>{poglavlje.slovenski}</i>)
                </>
              )}
            </>
          )}
        </p>
        <h1 className={stil.naslov}>{zapis.naslov}</h1>
        <p className={stil.opis}>{zapis.opis}</p>
      </header>

      <Predvidi pitanje={predvidi.pitanje} opcije={predvidi.opcije} tacna={predvidi.tacna} objasnjenje={predvidi.objasnjenje}>
        <Simulacija />
      </Predvidi>

      <div className={stil.tekst}>
        <section aria-labelledby="sta-gledas">
          <h2 id="sta-gledas" className={stil.oznakaSekcije}>
            Šta gledaš
          </h2>
          <ul className={stil.stavke}>
            {staGledas.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="formula">
          <h2 id="formula" className={stil.oznakaSekcije}>
            Veza s formulom
          </h2>
          <Formula tex={formula.tex} />
          <dl className={stil.veze}>
            {formula.veze.map((v) => (
              <div key={v.simbol}>
                <dt>
                  <M tex={v.simbol} />
                </dt>
                <dd>{v.opis}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section aria-labelledby="greska" className={stil.greska}>
          <h2 id="greska" className={stil.oznakaSekcije}>
            Česta greška
          </h2>
          <p>{greska}</p>
        </section>
      </div>

      <footer className={stil.susjedi}>
        {prethodni ? (
          <Link href={`${listaPredmeta}/${prethodni.slug}`} className={stil.susjed}>
            <span>← Prethodni</span>
            {prethodni.naslov}
          </Link>
        ) : (
          <span />
        )}
        {sljedeci && (
          <Link href={`${listaPredmeta}/${sljedeci.slug}`} className={`${stil.susjed} ${stil.desno}`}>
            <span>Sljedeći →</span>
            {sljedeci.naslov}
          </Link>
        )}
      </footer>
    </main>
  );
}
