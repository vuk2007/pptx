'use client';

import { useState } from 'react';
import { broj } from '@/lib/format';
import { K } from '@/lib/fizika/elektrostatika';
import { komadiPrstena, maksimumNaOsi, prstenNaOsi, tackaNaOsi, type V3 } from '@/lib/fizika/prsten';
import { Klizac, Ocitavanja, Ocitavanje, StatusLinija } from '@/components/instrument/Okvir';
import { Laboratorija } from '@/components/faks/Laboratorija';
import { Ose, kriva, skala, stegni, type Okvir, type Raspon } from '@/components/faks/Graf';
import { Strelica } from '@/components/faks/svg';
import s from '@/components/faks/sema.module.css';
import f from '@/components/faks/faks.module.css';

/*
  Prsten u ravni xy, osa z vodoravno. Kosi pogled: x ide u dubinu, pa se
  prsten vidi kao uska elipsa. Iz tačke T na osi izlazi dE svakog komada;
  jedan par suprotnih komada je istaknut, sa poprečnim komponentama koje
  se poništavaju. Ispod je E_z(z), sa isprekidanim Q/(4πε₀z²).
*/

const W = 1000;
const H = 820;
const O = { x: 500, y: 250 };
const PX_PO_CM = 13;
const DUBINA = 0.38;
const GRAF: Okvir = { x: 110, y: 560, w: 860, h: 190 };
const Q = 10e-9;
/** Piksela strelice po V/m. */
const PX_PO_V = 0.1;
const NAJDUZA = 330;

function projekcija(p: V3) {
  return { x: O.x + PX_PO_CM * 100 * (p.z + DUBINA * p.x), y: O.y - PX_PO_CM * 100 * (p.y - 0.12 * p.x) };
}

/** Projekcija vektora (bez pomaka), za strelice polja. */
function smjer(v: V3) {
  return { x: PX_PO_V * (v.z + DUBINA * v.x), y: -PX_PO_V * (v.y - 0.12 * v.x) };
}

export default function Simulacija() {
  const [n, postaviN] = useState(8);
  const [zCm, postaviZ] = useState(8);
  const [aCm, postaviA] = useState(10);
  const a = aCm / 100;
  const z = zCm / 100;

  const { komadi, ukupno } = komadiPrstena(Q, a, z, n);
  const tacno = prstenNaOsi(Q, a, z);
  const tacka = tackaNaOsi(Q, z);
  const poprecno = Math.hypot(ukupno.x, ukupno.y);
  const T = projekcija({ x: 0, y: 0, z });
  /* Istaknut je par suprotnih komada; kod neparnog n samo prvi komad. */
  const par = n % 2 === 0 ? [0, n / 2] : [0];

  const xr: Raspon = [-30, 30];
  const Emax = prstenNaOsi(Q, a, maksimumNaOsi(a));
  const yr: Raspon = [-1.3 * Emax, 1.3 * Emax];
  const sk = skala(GRAF, xr, yr);
  const zMax = maksimumNaOsi(a) * 100;

  const elipsa = Array.from({ length: 73 }, (_, k) => {
    const fi = (2 * Math.PI * k) / 72;
    const p = projekcija({ x: a * Math.cos(fi), y: a * Math.sin(fi), z: 0 });
    return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
  }).join(' ');

  /* Zbir se skraćuje na NAJDUZA px da ne izađe iz crteža blizu maksimuma. */
  const tPun = smjer(ukupno);
  const tDuz = Math.hypot(tPun.x, tPun.y);
  const tSum = tDuz > NAJDUZA ? { x: (tPun.x / tDuz) * NAJDUZA, y: (tPun.y / tDuz) * NAJDUZA } : tPun;
  /* Kriva tačkastog naboja se crta tek odakle stane u graf. */
  const zTacka = Math.sqrt((K * Q) / yr[1]) * 100;

  let poruka: { sta: string; zasto: string };
  if (zCm === 0) {
    poruka = {
      sta: 'U centru prstena polje je nula.',
      zasto: 'Svaki komad ima svoj par sa suprotne strane, a duž ose nema komponente jer je z = 0.',
    };
  } else if (n === 1) {
    poruka = {
      sta: 'Jedan komad nema para, pa mu poprečna komponenta ostaje.',
      zasto: 'Povećaj broj komada: već za dva komada poprečne komponente se poništavaju.',
    };
  } else {
    poruka = {
      sta: `Komponente duž ose se sabiraju u ${broj(ukupno.z, 0)} V/m, poprečne daju ${broj(poprecno, 0)} V/m.`,
      zasto:
        Math.abs(zCm) > 3 * aCm
          ? `Daleko od prstena polje je skoro kao od tačke: Q/(4πε₀z²) = ${broj(tacka, 0)} V/m.`
          : `Svaki komad doprinosi istu komponentu duž ose, a poprečne se poništavaju u parovima. Najjače je u z = a/√2 = ${broj(zMax, 1)} cm.`,
    };
  }

  return (
    <Laboratorija
      crtez={
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Prsten od ${n} komada; u tački T na osi na ${broj(zCm, 1)} cm polje je ${broj(ukupno.z, 0)} V/m.`}>
          <line x1={40} y1={O.y} x2={W - 40} y2={O.y} className={s.tanka} />
          <text x={40} y={O.y - 12} className={s.tih}>
            osa z
          </text>
          <polyline points={elipsa} className={s.linija} />
          {/* Poluprečnik a, do najvišeg komada. */}
          <line x1={O.x} y1={O.y} x2={projekcija({ x: 0, y: a, z: 0 }).x} y2={projekcija({ x: 0, y: a, z: 0 }).y} className={s.isprekidana} />
          <text x={O.x - 12} y={(O.y + projekcija({ x: 0, y: a, z: 0 }).y) / 2} textAnchor="end" className={`${s.tih} ${f.naCrtezu}`}>
            a
          </text>

          {komadi.map((k, i) => {
            const p = projekcija(k.polozaj);
            const istaknut = par.includes(i);
            const d = smjer(k.dE);
            return (
              <g key={i}>
                <line x1={p.x} y1={p.y} x2={T.x} y2={T.y} className={f.mreza} />
                <line x1={T.x} y1={T.y} x2={T.x + d.x} y2={T.y + d.y} className={istaknut ? f.doprinosIstaknut : f.doprinos} />
                {istaknut && (
                  <>
                    {/* Poprečni dio ovog dE: isti vektor bez komponente duž ose. */}
                    <line
                      x1={T.x + PX_PO_V * k.dE.z}
                      y1={T.y}
                      x2={T.x + d.x}
                      y2={T.y + d.y}
                      className={f.komponenta}
                    />
                  </>
                )}
              </g>
            );
          })}
          {komadi.map((k, i) => {
            const p = projekcija(k.polozaj);
            return <circle key={`k${i}`} cx={p.x} cy={p.y} r={par.includes(i) ? 9 : 7} className={s.plus} />;
          })}

          {Math.hypot(tSum.x, tSum.y) > 4 && (
            <Strelica x1={T.x} y1={T.y} x2={T.x + tSum.x} y2={T.y + tSum.y} boja="polje" velicina={20} debljina={5} />
          )}
          <circle cx={T.x} cy={T.y} r={6} className={s.neutralno} />
          <text x={T.x} y={T.y + 40} textAnchor="middle" className={`${s.tekst} ${f.naCrtezu}`}>
            T
          </text>
          <text x={T.x + tSum.x + (tSum.x >= 0 ? 12 : -12)} y={T.y + tSum.y - 14} textAnchor={tSum.x >= 0 ? 'start' : 'end'} className={`${s.simbol} ${s.polje} ${f.naCrtezu}`}>
            E
          </text>

          <Ose okvir={GRAF} xr={xr} yr={yr} xNatpis="z / cm" yNatpis={
              <>
                E<tspan baselineShift="sub" fontSize="0.7em">z</tspan> / (V/m)
              </>
            } yCilj={4}>
            <polyline points={kriva((x) => tackaNaOsi(Q, x / 100), sk, zTacka, 30)} className={f.kotaIsprekidana} />
            <polyline points={kriva((x) => tackaNaOsi(Q, x / 100), sk, -30, -zTacka)} className={f.kotaIsprekidana} />
            <polyline points={kriva((x) => prstenNaOsi(Q, a, x / 100), sk, -30, 30, 400)} className={f.kriva} />
            <circle cx={sk.x(zCm)} cy={sk.y(stegni(tacno, yr))} r={7} className={s.polje} />
          </Ose>
        </svg>
      }
      kontrole={
        <>
          <Klizac id="z" natpis="tačka T na osi, z" vrijednost={zCm} prikaz={`${broj(zCm, 1)} cm`} min={-30} max={30} korak={0.5} boja="polje" onPromjena={postaviZ} />
          <Klizac id="n" natpis="broj komada n" vrijednost={n} prikaz={String(n)} min={1} max={24} korak={1} boja="naboj-plus" onPromjena={postaviN} />
          <Klizac id="a" natpis="poluprečnik a" vrijednost={aCm} prikaz={`${broj(aCm, 0)} cm`} min={5} max={15} korak={1} boja="text" onPromjena={postaviA} />
        </>
      }
      ocitavanja={
        <Ocitavanja>
          <Ocitavanje natpis={<>Zbir komada, E<sub>z</sub></>} vrijednost={broj(ukupno.z, 0)} jedinica="V/m" pod={`formula ${broj(tacno, 0)} V/m`} />
          <Ocitavanje natpis="Poprečno" vrijednost={broj(poprecno, 0)} jedinica="V/m" pod={n >= 2 ? 'parovi se poništavaju' : 'jedan komad, bez para'} />
          <Ocitavanje natpis="Kao tačka" vrijednost={broj(tacka, 0)} jedinica="V/m" pod="Q/(4πε₀z²)" />
          <Ocitavanje natpis="Prsten / tačka" vrijednost={zCm === 0 ? '—' : broj((tacno / tacka) * 100, 1)} jedinica={zCm === 0 ? '' : '%'} pod="daleko teži 100 %" />
        </Ocitavanja>
      }
      status={<StatusLinija sta={poruka.sta} zasto={poruka.zasto} />}
    />
  );
}
