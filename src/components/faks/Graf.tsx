import type { ReactNode } from 'react';
import { broj } from '@/lib/format';
import { decimaleZaKorak, korakOse, podioci } from '@/lib/osa';
import s from './sema.module.css';
import f from './faks.module.css';

/*
  Graf u SVG-u: pravougaonik u koordinatama crteža, dvije ose sa okruglim
  podiocima i natpisima sa decimalnim zarezom. Osa stoji na nuli kad je
  nula u rasponu, inače na ivici.
*/

export type Okvir = { x: number; y: number; w: number; h: number };
export type Raspon = readonly [number, number];
export type Skala = { x: (v: number) => number; y: (v: number) => number };

export function skala(okvir: Okvir, xr: Raspon, yr: Raspon): Skala {
  return {
    x: (v) => okvir.x + ((v - xr[0]) / (xr[1] - xr[0])) * okvir.w,
    y: (v) => okvir.y + okvir.h - ((v - yr[0]) / (yr[1] - yr[0])) * okvir.h,
  };
}

/** Tačke krive y = fn(x) za <polyline>, od a do b. */
export function kriva(fn: (x: number) => number, sk: Skala, a: number, b: number, n = 240) {
  const tacke: string[] = [];
  for (let k = 0; k <= n; k++) {
    const x = a + ((b - a) * k) / n;
    tacke.push(`${sk.x(x).toFixed(1)},${sk.y(fn(x)).toFixed(1)}`);
  }
  return tacke.join(' ');
}

/** Površina između krive i nule, od a do b, kao <polygon>. */
export function povrsinaIspod(fn: (x: number) => number, sk: Skala, a: number, b: number, n = 160) {
  const lo = Math.min(a, b);
  const hi = Math.max(a, b);
  return `${sk.x(lo).toFixed(1)},${sk.y(0).toFixed(1)} ${kriva(fn, sk, lo, hi, n)} ${sk.x(hi).toFixed(1)},${sk.y(0).toFixed(1)}`;
}

/** Ograniči vrijednost na raspon, za tačke koje bi izašle iz grafa. */
export function stegni(v: number, r: Raspon) {
  return Math.min(r[1], Math.max(r[0], v));
}

export function Ose({
  okvir,
  xr,
  yr,
  xNatpis,
  yNatpis,
  xCilj = 6,
  yCilj = 4,
  naNuli = true,
  children,
}: {
  okvir: Okvir;
  xr: Raspon;
  yr: Raspon;
  xNatpis: ReactNode;
  yNatpis: ReactNode;
  xCilj?: number;
  yCilj?: number;
  /** Uspravna osa na x = 0; false je stavlja uz lijevu ivicu (za logaritamsku x-osu). */
  naNuli?: boolean;
  children?: ReactNode;
}) {
  const sk = skala(okvir, xr, yr);
  const xKorak = korakOse(xr[0], xr[1], xCilj);
  const yKorak = korakOse(yr[0], yr[1], yCilj);
  const xDec = decimaleZaKorak(xKorak);
  const yDec = decimaleZaKorak(yKorak);
  const xOsaY = sk.y(yr[0] <= 0 && yr[1] >= 0 ? 0 : yr[0]);
  const yOsaX = sk.x(naNuli && xr[0] <= 0 && xr[1] >= 0 ? 0 : xr[0]);
  const desno = okvir.x + okvir.w;
  const dno = okvir.y + okvir.h;

  return (
    <g>
      {podioci(yr[0], yr[1], yCilj).map((v) => (
        <g key={`y${v}`}>
          <line x1={okvir.x} y1={sk.y(v)} x2={desno} y2={sk.y(v)} className={f.mreza} />
          <text x={okvir.x - 10} y={sk.y(v) + 7} textAnchor="end" className={s.tih}>
            {broj(v, yDec)}
          </text>
        </g>
      ))}
      {podioci(xr[0], xr[1], xCilj).map((v) => (
        <g key={`x${v}`}>
          <line x1={sk.x(v)} y1={okvir.y} x2={sk.x(v)} y2={dno} className={f.mreza} />
          <text x={sk.x(v)} y={dno + 28} textAnchor="middle" className={s.tih}>
            {broj(v, xDec)}
          </text>
        </g>
      ))}
      <line x1={okvir.x} y1={xOsaY} x2={desno} y2={xOsaY} className={s.linija} />
      <line x1={yOsaX} y1={okvir.y} x2={yOsaX} y2={dno} className={s.linija} />
      <text x={desno} y={dno + 56} textAnchor="end" className={s.tih}>
        {xNatpis}
      </text>
      <text x={okvir.x - 6} y={okvir.y - 14} className={s.tih}>
        {yNatpis}
      </text>
      {children}
    </g>
  );
}
