'use client';

import { useEffect, useRef } from 'react';
import { useAnimacija } from '@/lib/animacija';
import stil from './instrument.module.css';

/*
  Osciloskop: mreža 10 × 8 podjela, jedan ili dva kanala, nula na sredini.
  Skala se zadaje po podjeli („4 V/pod."), pa pola visine ekrana nosi
  četiri podjele. Boje se čitaju iz CSS varijabli i čitaju se ponovo kad
  se tema promijeni.
*/

export type Kanal = {
  /** Ime CSS varijable bez crtica, npr. 'ch1' ili 'current'. */
  boja: string;
  /** Tekst legende, npr. „CH1 napon na motoru, 4 V/pod.". */
  natpis: string;
  /** Vrijednost jedne podjele, u jedinici kanala. */
  skala: number;
  /** Stepenasto crtanje, za signale koji skaču (napon sa prekidača). */
  stepenasto?: boolean;
  /** Gdje je nula kanala, u podjelama iznad sredine. Kao ručica „position" na pravom osciloskopu. */
  nula?: number;
};

export type Uzorak = { t: number; v: readonly number[]; greska: boolean };

/** Uzorci za posljednjih nekoliko sekundi. Puni ih demonstracija, čita osciloskop. */
export class Snimak {
  uzorci: Uzorak[] = [];
  sada = 0;

  constructor(readonly prozor: number) {}

  dodaj(t: number, v: readonly number[], greska = false) {
    this.sada = t;
    this.uzorci.push({ t, v, greska });
    const granica = t - this.prozor - 0.1;
    let izbaci = 0;
    while (izbaci < this.uzorci.length && this.uzorci[izbaci].t < granica) izbaci++;
    if (izbaci) this.uzorci.splice(0, izbaci);
  }

  ocisti() {
    this.uzorci.length = 0;
  }

  /**
    Cijeli ekran odjednom, za signal koji se ponavlja: osciloskop „okine"
    na ivici impulsa i uvijek crta istu periodu, umjesto da je vuče ulijevo.
  */
  zamijeni(uzorci: Uzorak[], sada: number) {
    this.uzorci = uzorci;
    this.sada = sada;
  }
}

const PODJELA_X = 10;
const PODJELA_Y = 8;

export function Oscilloskop({
  kanali,
  snimak,
  desno,
  opis,
}: {
  kanali: readonly Kanal[];
  snimak: Snimak;
  /** Tekst desno u legendi: vremenska baza i napomene. */
  desno: string;
  /** Opis za čitač ekrana. */
  opis: string;
}) {
  const platnoRef = useRef<HTMLCanvasElement | null>(null);
  const boje = useRef<Record<string, string>>({});
  const dpr = useRef(1);

  /* Boje iz teme, i ponovo kad se tema promijeni. */
  useEffect(() => {
    const procitaj = () => {
      const cs = getComputedStyle(document.documentElement);
      const imena = ['panel-2', 'line-soft', 'line', 'fault', ...kanali.map((k) => k.boja)];
      for (const ime of imena) boje.current[ime] = cs.getPropertyValue(`--${ime}`).trim();
    };
    procitaj();
    const sistem = window.matchMedia('(prefers-color-scheme: dark)');
    sistem.addEventListener('change', procitaj);
    const posmatrac = new MutationObserver(procitaj);
    posmatrac.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => {
      sistem.removeEventListener('change', procitaj);
      posmatrac.disconnect();
    };
  }, [kanali]);

  /* Oštro na svakom ekranu: platno ima onoliko piksela koliko ih ekran stvarno crta. */
  useEffect(() => {
    const platno = platnoRef.current;
    if (!platno) return;
    const dimenzionisi = () => {
      dpr.current = Math.min(2, window.devicePixelRatio || 1);
      const r = platno.getBoundingClientRect();
      platno.width = Math.round(r.width * dpr.current);
      platno.height = Math.round(r.height * dpr.current);
    };
    dimenzionisi();
    const posmatrac = new ResizeObserver(dimenzionisi);
    posmatrac.observe(platno);
    return () => posmatrac.disconnect();
  }, []);

  useAnimacija(() => {
    const platno = platnoRef.current;
    const ctx = platno?.getContext('2d');
    if (!platno || !ctx) return;
    const w = platno.width;
    const h = platno.height;
    if (!w || !h) return;
    const C = boje.current;
    const d = dpr.current;

    ctx.fillStyle = C['panel-2'];
    ctx.fillRect(0, 0, w, h);

    ctx.lineWidth = 1;
    ctx.strokeStyle = C['line-soft'];
    ctx.beginPath();
    for (let i = 1; i < PODJELA_X; i++) {
      const x = Math.round((i * w) / PODJELA_X) + 0.5;
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
    }
    for (let j = 1; j < PODJELA_Y; j++) {
      const y = Math.round((j * h) / PODJELA_Y) + 0.5;
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
    }
    ctx.stroke();

    /* Osa nule sa sitnim podjelama, kao na pravom ekranu. */
    ctx.strokeStyle = C.line;
    ctx.globalAlpha = 0.55;
    ctx.beginPath();
    const sredina = Math.round(h / 2) + 0.5;
    ctx.moveTo(0, sredina);
    ctx.lineTo(w, sredina);
    for (let i = 0; i < PODJELA_X * 5; i++) {
      const x = Math.round((i * w) / (PODJELA_X * 5)) + 0.5;
      ctx.moveTo(x, sredina - 3 * d);
      ctx.lineTo(x, sredina + 3 * d);
    }
    ctx.stroke();
    ctx.globalAlpha = 1;

    const uzorci = snimak.uzorci;
    const t0 = snimak.sada - snimak.prozor;
    const X = (t: number) => ((t - t0) / snimak.prozor) * w;

    /* Greška (kratak spoj) kao traka u boji greške, preko cijele visine. */
    ctx.fillStyle = C.fault;
    ctx.globalAlpha = 0.14;
    for (let k = 0; k < uzorci.length - 1; k++) {
      if (uzorci[k].greska) {
        ctx.fillRect(X(uzorci[k].t), 0, Math.max(1, X(uzorci[k + 1].t) - X(uzorci[k].t)) + 1, h);
      }
    }
    ctx.globalAlpha = 1;

    kanali.forEach((kanal, n) => {
      ctx.strokeStyle = C[kanal.boja];
      ctx.lineWidth = 2.25 * d;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      const polaEkrana = (kanal.skala * PODJELA_Y) / 2;
      const nula = h / 2 - ((kanal.nula ?? 0) / (PODJELA_Y / 2)) * (h / 2);
      let prethodni: number | null = null;
      for (const u of uzorci) {
        const x = X(u.t);
        let y = nula - (u.v[n] / polaEkrana) * (h / 2);
        y = Math.max(2 * d, Math.min(h - 2 * d, y));
        if (prethodni === null) ctx.moveTo(x, y);
        else {
          if (kanal.stepenasto) ctx.lineTo(x, prethodni);
          ctx.lineTo(x, y);
        }
        prethodni = y;
      }
      ctx.stroke();

      /* Oznaka nule na lijevoj ivici, u boji kanala, kad nula nije na sredini. */
      if (kanal.nula) {
        ctx.fillStyle = C[kanal.boja];
        ctx.beginPath();
        ctx.moveTo(0, nula - 6 * d);
        ctx.lineTo(9 * d, nula);
        ctx.lineTo(0, nula + 6 * d);
        ctx.fill();
      }
    });
  });

  return (
    <section className={`${stil.panel} ${stil.osciloskop}`}>
      <div className={stil.legenda}>
        {kanali.map((k) => (
          <span key={k.natpis} className={stil.kljuc}>
            <i style={{ background: `var(--${k.boja})` }} />
            {k.natpis}
          </span>
        ))}
        <span className={stil.legendaDesno}>{desno}</span>
      </div>
      <canvas ref={platnoRef} className={stil.platno} role="img" aria-label={opis} />
    </section>
  );
}
