import Link from 'next/link';
import { PREDMETI, gotoviPredmeta, rijecEksperimenata } from '@/sadrzaj/eksperimenti';
import stil from '@/components/faks/faks.module.css';

export default function Faks() {
  return (
    <main className={stil.strana}>
      <nav className={stil.putanja} aria-label="Putanja">
        <Link href="/">Početna</Link>
      </nav>

      <header className={stil.zaglavlje}>
        <h1 className={stil.naslov}>Faks</h1>
        <p className={stil.opis}>Interaktivni eksperimenti za prvu godinu elektrotehnike, po predmetima.</p>
      </header>

      <ul className={stil.lista}>
        {PREDMETI.map((p) => {
          const gotovih = gotoviPredmeta(p.id).length;
          const sadrzaj = (
            <>
              <span className={stil.stavkaNaslov}>
                {p.naziv}
                {p.slovenski && p.slovenski !== p.naziv && (
                  <>
                    {' '}
                    (<i>{p.slovenski}</i>)
                  </>
                )}
              </span>
              <span className={stil.stavkaOpis}>{p.opis}</span>
              <span className={stil.stanje}>{gotovih > 0 ? `${gotovih} ${rijecEksperimenata(gotovih)}` : 'u izradi'}</span>
            </>
          );
          return (
            <li key={p.id}>
              {gotovih > 0 ? (
                <Link href={`/faks/${p.id}`} className={stil.stavka}>
                  {sadrzaj}
                </Link>
              ) : (
                <div className={`${stil.stavka} ${stil.uIzradi}`}>{sadrzaj}</div>
              )}
            </li>
          );
        })}
      </ul>
    </main>
  );
}
