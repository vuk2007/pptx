'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { IZLOG_PAUZA_SEKUNDE, IZLOG_SEKUNDE_PO_SLAJDU } from '@/config/cinjenice';
import type { BojaPetlje, SlajdUIzlogu } from '@/sadrzaj/slajdovi';
import { PrikazSlajda } from './PrikazSlajda';
import stil from './izlog.module.css';

const ULOGE: { id: BojaPetlje; rijec: string }[] = [
  { id: 'osjeti', rijec: 'osjeti' },
  { id: 'odluci', rijec: 'odluči' },
  { id: 'djeluj', rijec: 'djeluj' },
];

/**
 * Automatska prezentacija. Sama prelazi na sljedeći slajd, a svaka ručna
 * radnja (strelice, kliker, dodir) pauzira auto-prelaz na 30 sekundi,
 * da posjetilac ne ostane bez slajda usred rečenice.
 */
export function Izlog({ slajdovi, putanja }: { slajdovi: SlajdUIzlogu[]; putanja: string }) {
  const router = useRouter();
  const [indeks, postaviIndeks] = useState(0);
  const [pauzirano, postaviPauzirano] = useState(false);
  const [biljeskeOtvorene, postaviBiljeske] = useState(false);
  const [interakcija, postaviInterakciju] = useState(0);

  const slajd = slajdovi[indeks];
  const ukupno = slajdovi.length;

  const rucno = useCallback(
    (pomak: number) => {
      postaviIndeks((i) => (i + pomak + ukupno) % ukupno);
      postaviPauzirano(true);
      postaviInterakciju((n) => n + 1);
    },
    [ukupno],
  );

  const skoci = useCallback((na: number) => {
    postaviIndeks(na);
    postaviPauzirano(true);
    postaviInterakciju((n) => n + 1);
  }, []);

  /* Auto-prelaz. Stoji dok je pauzirano ili dok su bilješke otvorene. */
  useEffect(() => {
    if (pauzirano || biljeskeOtvorene) return;
    const tajmer = setTimeout(() => {
      postaviIndeks((i) => (i + 1) % ukupno);
    }, IZLOG_SEKUNDE_PO_SLAJDU * 1000);
    return () => clearTimeout(tajmer);
  }, [indeks, pauzirano, biljeskeOtvorene, ukupno]);

  /* Poslije 30 sekundi bez diranja, izlog se sam vraća u auto režim. */
  useEffect(() => {
    if (!pauzirano) return;
    const tajmer = setTimeout(() => postaviPauzirano(false), IZLOG_PAUZA_SEKUNDE * 1000);
    return () => clearTimeout(tajmer);
  }, [pauzirano, interakcija]);

  /* Tastatura i prezenter kliker (klikeri šalju strelice i PageUp/PageDown). */
  useEffect(() => {
    function naTaster(dogadjaj: KeyboardEvent) {
      switch (dogadjaj.key) {
        case 'ArrowRight':
        case 'ArrowDown':
        case 'PageDown':
        case ' ':
          dogadjaj.preventDefault();
          rucno(1);
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
        case 'PageUp':
          dogadjaj.preventDefault();
          rucno(-1);
          break;
        case 'n':
        case 'N':
          postaviBiljeske((b) => !b);
          break;
        case 'Escape':
          router.push('/robotika');
          break;
      }
    }
    window.addEventListener('keydown', naTaster);
    return () => window.removeEventListener('keydown', naTaster);
  }, [rucno, router]);

  /* Dodir i miš: povlačenje lijevo/desno mijenja slajd, tap uz ivicu isto. */
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

    if (Math.abs(dx) > 44 && Math.abs(dx) > Math.abs(dy)) {
      rucno(dx < 0 ? 1 : -1);
      return;
    }

    if (Math.abs(dx) < 16 && Math.abs(dy) < 16) {
      const udio = dogadjaj.clientX / window.innerWidth;
      if (udio < 0.35) rucno(-1);
      else if (udio > 0.65) rucno(1);
    }
  }

  const naglasak = slajd.naglasak;

  return (
    <main
      className={stil.izlog}
      onPointerDown={naPritisak}
      onPointerUp={naOtpustanje}
      aria-roledescription="prezentacija"
      aria-label={`${putanja}, slajd ${indeks + 1} od ${ukupno}`}
    >
      <h1 className="samo-za-citace">Praktikum elektronike, {putanja}</h1>

      <header className={stil.vrh}>
        <span className={stil.putanja}>
          Praktikum elektronike, {putanja}: {slajd.nazivBloka}
        </span>
        {/* Uloga bloka u petlji: istaknuta je ona koju blok naglašava. */}
        <span className={stil.uloge} aria-label={naglasak ? `Naglasak: ${ULOGE.find((u) => u.id === naglasak)?.rijec}` : undefined}>
          {ULOGE.map((u) => (
            <span key={u.id} className={`${stil.uloga} ${naglasak === undefined || naglasak === u.id ? stil.ulogaAktivna : ''}`} style={{ ['--boja' as string]: `var(--${u.id})` }}>
              <i />
              {u.rijec}
            </span>
          ))}
        </span>
        <span className={stil.brojac}>
          {indeks + 1} / {ukupno}
        </span>
      </header>

      {/* Traka do sljedećeg slajda. Stoji dok je izlog pauziran. */}
      <div className={stil.napredak} aria-hidden="true">
        <i
          key={`${indeks}-${pauzirano}-${biljeskeOtvorene}`}
          style={{
            animationDuration: `${IZLOG_SEKUNDE_PO_SLAJDU}s`,
            animationPlayState: pauzirano || biljeskeOtvorene ? 'paused' : 'running',
          }}
        />
      </div>

      <PrikazSlajda slajd={slajd} />

      <footer className={stil.dno}>
        <div className={stil.tacke}>
          {slajdovi.map((s, i) => (
            <button
              key={s.id}
              className={stil.tackaDugme}
              onClick={() => skoci(i)}
              aria-label={`Slajd ${i + 1}: ${s.naslov}`}
              aria-current={i === indeks ? 'true' : undefined}
            >
              <span className={i === indeks ? stil.tackaAktivna : stil.tacka} />
            </button>
          ))}
        </div>

        <div className={stil.savjeti}>
          {(pauzirano || biljeskeOtvorene) && <span className={stil.pauza}>auto pauziran</span>}
          {/* Na iPadu nema tastature, pa spisak tastera tamo samo zbunjuje. */}
          <span className={stil.samoDodir}>prevuci za sljedeći slajd</span>
          <span className={stil.samoTaster}>
            <kbd>←</kbd>
            <kbd>→</kbd> slajd
          </span>
          <span className={stil.samoTaster}>
            <kbd>N</kbd> bilješke
          </span>
          <span className={stil.samoTaster}>
            <kbd>Esc</kbd> početna
          </span>
        </div>
      </footer>

      {biljeskeOtvorene && (
        <aside className={stil.biljeske}>
          <div className={stil.zaglavljeBiljezaka}>
            <span>Bilješke: {slajd.nazivBloka}</span>
            <button className={stil.zatvori} onClick={() => postaviBiljeske(false)}>
              <kbd>N</kbd> zatvori
            </button>
          </div>
          <BiljeskeBloka slajdovi={slajdovi} tekuci={slajd.id} />
        </aside>
      )}
    </main>
  );
}

/**
 * Cijela bilješka bloka, sa istaknutim dijelom koji pripada tekućem slajdu.
 * Bilješke su pisane kao scenario koji teče kroz slajdove, pa se tako i čitaju.
 */
function BiljeskeBloka({ slajdovi, tekuci }: { slajdovi: SlajdUIzlogu[]; tekuci: string }) {
  const tekuciSlajd = slajdovi.find((s) => s.id === tekuci);
  const izIstogBloka = slajdovi.filter((s) => s.blokId === tekuciSlajd?.blokId);
  const imaTeksta = izIstogBloka.some((s) => s.biljeska.length > 0);

  if (!imaTeksta) {
    return <p className={stil.bezBiljeske}>Za ovaj blok nema bilješke.</p>;
  }

  return (
    <p className={stil.tekstBiljeske}>
      {izIstogBloka.flatMap((s) =>
        s.biljeska.map((segment, i) => (
          <span key={`${s.id}-${i}`} className={s.id === tekuci ? stil.segmentAktivan : undefined}>
            {segment}{' '}
          </span>
        )),
      )}
    </p>
  );
}
