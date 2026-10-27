import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PREDMETI, POGLAVLJA, eksperimentiPredmeta, gotoviPredmeta, predmet as nadjiPredmet } from '@/sadrzaj/eksperimenti';
import stil from '@/components/faks/faks.module.css';

type Parametri = { params: Promise<{ predmet: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return PREDMETI.filter((p) => gotoviPredmeta(p.id).length > 0).map((p) => ({ predmet: p.id }));
}

export async function generateMetadata({ params }: Parametri): Promise<Metadata> {
  const p = nadjiPredmet((await params).predmet);
  return { title: p ? p.naziv : 'Predmet' };
}

export default async function Predmet({ params }: Parametri) {
  const p = nadjiPredmet((await params).predmet);
  if (!p) notFound();
  const svi = eksperimentiPredmeta(p.id);

  return (
    <main className={stil.strana}>
      <nav className={stil.putanja} aria-label="Putanja">
        <Link href="/faks">Faks</Link>
      </nav>

      <header className={stil.zaglavlje}>
        <h1 className={stil.naslov}>{p.naziv}</h1>
        <p className={stil.opis}>Eksperimenti po poglavljima udžbenika. Svaki počinje pitanjem: prvo predvidi, pa pomjeri.</p>
      </header>

      {POGLAVLJA[p.id].map((pog) => {
        const ovdje = svi.filter((e) => e.poglavlje === pog.oznaka);
        if (ovdje.length === 0) return null;
        return (
          <section key={pog.oznaka} className={stil.grupa} aria-labelledby={`pog-${pog.oznaka}`}>
            <h2 id={`pog-${pog.oznaka}`} className={stil.grupaNaslov}>
              {pog.oznaka !== 'alati' && <span className={stil.paragraf}>{pog.oznaka}</span>}
              {pog.naziv}
              {pog.slovenski && <i>{pog.slovenski}</i>}
            </h2>
            <ul className={stil.lista}>
              {ovdje.map((e) => {
                const sadrzaj = (
                  <>
                    <span className={stil.stavkaNaslov}>{e.naslov}</span>
                    <span className={stil.stavkaOpis}>{e.opis}</span>
                    <span className={stil.stanje}>{e.status === 'gotovo' ? 'otvori →' : 'u izradi'}</span>
                  </>
                );
                return (
                  <li key={e.slug}>
                    {e.status === 'gotovo' ? (
                      <Link href={`/faks/${p.id}/${e.slug}`} className={stil.stavka}>
                        {sadrzaj}
                      </Link>
                    ) : (
                      <div className={`${stil.stavka} ${stil.uIzradi}`}>{sadrzaj}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </main>
  );
}
