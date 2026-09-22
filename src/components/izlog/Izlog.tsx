'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { IZLOG_PAUZA_SEKUNDE, IZLOG_SEKUNDE_PO_SLAJDU } from '@/config/cinjenice';
import { BOJA, NAZIV, OZNAKA_LED, type BojaPetlje } from '@/components/ploca/primitivi';
import type { SlajdUIzlogu } from '@/sadrzaj/slajdovi';
import { PrikazSlajda } from './PrikazSlajda';
import stil from './izlog.module.css';

const SVE_BOJE: BojaPetlje[] = ['osjeti', 'odluci', 'djeluj'];

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
      className={stil.okvir}
      onPointerDown={naPritisak}
      onPointerUp={naOtpustanje}
      aria-roledescription="prezentacija"
      aria-label={`${putanja}, slajd ${indeks + 1} od ${ukupno}`}
    >
      <span className={`${stil.rupa} ${stil.rupaGL}`} aria-hidden="true" />
      <span className={`${stil.rupa} ${stil.rupaGD}`} aria-hidden="true" />
      <span className={`${stil.rupa} ${stil.rupaDL}`} aria-hidden="true" />
      <span className={`${stil.rupa} ${stil.rupaDD}`} aria-hidden="true" />

      <h1 className="samo-za-citace">
        Praktikum elektronike — {putanja}
      </h1>

      <header>
        <div className={stil.letvaGore}>
          <div className={stil.putanja}>
            <span className="oznaka" style={{ color: 'var(--bakar-struja)' }}>
              {putanja}
            </span>
            <span className="oznaka">
              {slajd.nazivBloka} · {indeks + 1}/{ukupno}
            </span>
          </div>

          <div className={stil.ledovi}>
            {SVE_BOJE.map((b) => {
              const aktivan = naglasak === undefined || naglasak === b;
              return (
                <span
                  key={b}
                  className={`${stil.led} ${aktivan ? stil.ledAktivan : ''}`}
                  style={{ ['--boja-led' as string]: BOJA[b] }}
                >
                  <span className={stil.ledTacka} />
                  {OZNAKA_LED[b]} {NAZIV[b]}
                </span>
              );
            })}
          </div>
        </div>

        <div className={stil.sinaNapretka}>
          <div
            key={`${indeks}-${pauzirano}-${biljeskeOtvorene}`}
            className={stil.strujaNapretka}
            style={{
              ['--trajanje' as string]: `${IZLOG_SEKUNDE_PO_SLAJDU}s`,
              animationDuration: `${IZLOG_SEKUNDE_PO_SLAJDU}s`,
              animationPlayState: pauzirano || biljeskeOtvorene ? 'paused' : 'running',
            }}
          />
        </div>
      </header>

      <PrikazSlajda slajd={slajd} />

      <div className={stil.letvaDolje}>
        <div className={stil.tacke}>
          {slajdovi.map((s, i) => (
            <button
              key={s.id}
              className={stil.tackaDugme}
              onClick={() => skoci(i)}
              aria-label={`Slajd ${i + 1}: ${s.recenica}`}
              aria-current={i === indeks ? 'true' : undefined}
            >
              <span className={`${stil.tacka} ${i === indeks ? stil.tackaAktivna : ''}`} />
            </button>
          ))}
        </div>

        <div className={stil.savjeti}>
          {(pauzirano || biljeskeOtvorene) && <span className={`${stil.savjet} ${stil.pauza}`}>auto pauziran</span>}

          {/*
            Na iPadu nema tastature, pa spisak tastera tamo samo zbunjuje.
            Umjesto njega stoji ono što na dodir zaista radi.
          */}
          <span className={`${stil.savjet} ${stil.samoDodir}`}>prevuci za sljedeći slajd</span>

          <span className={`${stil.savjet} ${stil.samoTaster}`}>
            <span className={stil.taster}>←</span>
            <span className={stil.taster}>→</span>
            slajd
          </span>
          <span className={`${stil.savjet} ${stil.samoTaster}`}>
            <span className={stil.taster}>N</span>
            bilješke
          </span>
          <span className={`${stil.savjet} ${stil.samoTaster}`}>
            <span className={stil.taster}>ESC</span>
            početna
          </span>
        </div>
      </div>

      {biljeskeOtvorene && (
        <aside className={stil.biljeske}>
          <div className={stil.zaglavljeBiljezaka}>
            <span className="oznaka" style={{ color: 'var(--bakar-struja)' }}>
              Bilješke · {slajd.nazivBloka}
            </span>
            <button className={stil.savjet} onClick={() => postaviBiljeske(false)}>
              <span className={stil.taster}>N</span>
              zatvori
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
