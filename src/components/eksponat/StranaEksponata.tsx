'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BOJA, NAZIV, OZNAKA_LED } from '@/components/ploca/primitivi';
import { PrikazSlajda } from '@/components/izlog/PrikazSlajda';
import { blok, type BlokId } from '@/sadrzaj/slajdovi';
import { eksponat, type EksponatId } from '@/lib/rute';
import stil from './eksponat.module.css';

/**
 * Strana jednog eksponata: slajdovi kojima se upravlja ručno i meni
 * demonstracija. Za razliku od izloga, ovdje ništa ne prelazi samo —
 * ovo je strana za nekoga ko stoji ispred štanda i sam bira.
 */
export function StranaEksponata({ id }: { id: EksponatId }) {
  const router = useRouter();
  const podaci = eksponat(id);
  const slajdovi = blok(id as BlokId).slajdovi;
  const [indeks, postaviIndeks] = useState(0);

  const pomjeri = useCallback(
    (pomak: number) => postaviIndeks((i) => (i + pomak + slajdovi.length) % slajdovi.length),
    [slajdovi.length],
  );

  useEffect(() => {
    function naTaster(dogadjaj: KeyboardEvent) {
      switch (dogadjaj.key) {
        case 'ArrowRight':
        case 'PageDown':
          dogadjaj.preventDefault();
          pomjeri(1);
          break;
        case 'ArrowLeft':
        case 'PageUp':
          dogadjaj.preventDefault();
          pomjeri(-1);
          break;
        case 'Escape':
          router.push('/robotika');
          break;
      }
    }
    window.addEventListener('keydown', naTaster);
    return () => window.removeEventListener('keydown', naTaster);
  }, [pomjeri, router]);

  /* Povlačenje prstom mijenja slajd i na iPadu. */
  const pocetak = useRef<{ x: number; y: number } | null>(null);

  function naPritisak(dogadjaj: React.PointerEvent) {
    if ((dogadjaj.target as HTMLElement).closest('a, button')) {
      pocetak.current = null;
      return;
    }
    pocetak.current = { x: dogadjaj.clientX, y: dogadjaj.clientY };
  }

  function naOtpustanje(dogadjaj: React.PointerEvent) {
    const p = pocetak.current;
    pocetak.current = null;
    if (!p) return;
    const dx = dogadjaj.clientX - p.x;
    const dy = dogadjaj.clientY - p.y;
    if (Math.abs(dx) > 44 && Math.abs(dx) > Math.abs(dy)) pomjeri(dx < 0 ? 1 : -1);
  }

  const slajd = slajdovi[indeks];
  const boja = BOJA[podaci.naglasak];

  return (
    <main className={stil.ploca} onPointerDown={naPritisak} onPointerUp={naOtpustanje}>
      <span className={`${stil.rupa} ${stil.rupaGL}`} aria-hidden="true" />
      <span className={`${stil.rupa} ${stil.rupaGD}`} aria-hidden="true" />

      <header className={stil.zaglavlje}>
        <div className={stil.naslovnaGrupa}>
          <h1 className={stil.naslov}>{podaci.naziv}</h1>
          <span className={stil.uloga} style={{ ['--boja' as string]: boja }}>
            {OZNAKA_LED[podaci.naglasak]} {NAZIV[podaci.naglasak]}
          </span>
        </div>

        <div className={stil.akcije}>
          <Link href={`/izlog/${id}`} className={stil.dugme}>
            <span aria-hidden="true">▶</span>
            Pusti u petlji
          </Link>
          <Link href="/robotika" className={stil.dugme}>
            Početna
          </Link>
        </div>
      </header>

      <div className={stil.pojas}>
        <button className={stil.strelica} onClick={() => pomjeri(-1)} aria-label="Prethodni slajd">
          ←
        </button>

        <div className={stil.scena}>
          <PrikazSlajda slajd={slajd} />
        </div>

        <button className={stil.strelica} onClick={() => pomjeri(1)} aria-label="Sljedeći slajd">
          →
        </button>
      </div>

      <div className={stil.podnozje}>
        <div className={stil.brojac}>
          <div className={stil.tacke}>
            {slajdovi.map((s, i) => (
              <button
                key={s.id}
                className={stil.tackaDugme}
                onClick={() => postaviIndeks(i)}
                aria-label={`Slajd ${i + 1}: ${s.recenica}`}
                aria-current={i === indeks ? 'true' : undefined}
              >
                <span className={`${stil.tacka} ${i === indeks ? stil.tackaAktivna : ''}`} />
              </button>
            ))}
          </div>
          <span className="oznaka">
            Slajd {indeks + 1} od {slajdovi.length}
          </span>
        </div>

        <nav className={stil.meni} aria-label="Demonstracije">
          {podaci.demonstracije.map((d) => (
            <Link
              key={d.putanja}
              href={d.putanja}
              className={`${stil.demo} ${slajd.demo?.putanja === d.putanja ? stil.demoAktivan : ''}`}
            >
              <span className={stil.nazivDemo}>{d.naziv}</span>
              <span className={stil.opisDemo}>{d.opis}</span>
            </Link>
          ))}
        </nav>
      </div>
    </main>
  );
}
