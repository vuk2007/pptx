'use client';

import { useState } from 'react';
import { broj } from '@/lib/format';
import { FUNKCIJE, raspon } from '@/lib/fizika/racun';
import { pravougaonici, riemannSuma, tackaUzorka, type Pravilo } from '@/lib/fizika/riemann';
import { Klizac, Ocitavanja, Ocitavanje, StatusLinija, Taster } from '@/components/instrument/Okvir';
import { Laboratorija, RedDugmadi } from '@/components/faks/Laboratorija';
import { Ose, kriva, skala, type Okvir, type Raspon } from '@/components/faks/Graf';
import s from '@/components/faks/sema.module.css';
import f from '@/components/faks/faks.module.css';

/*
  Struja i(t) i m pravougaonika ispod nje, od t₁ do t₂. Zbir njihovih
  površina je približni naboj; integral je tačan ΔQ = Q(t₂) − Q(t₁).
  Funkcije su struje iz eksperimenta o izvodu, pa je tačan rezultat poznat.
*/

const W = 1000;
const H = 500;
const GRAF: Okvir = { x: 110, y: 40, w: 860, h: 380 };
const PRAVILA: { id: Pravilo; natpis: string }[] = [
  { id: 'lijevo', natpis: 'Lijevi kraj' },
  { id: 'sredina', natpis: 'Sredina' },
  { id: 'desno', natpis: 'Desni kraj' },
];

/** Klizač m ide po logaritamskoj skali, od 1 do 200. */
const mZaPolozaj = (p: number) => Math.max(1, Math.round(200 ** p));

export default function Simulacija() {
  const [fid, postaviF] = useState('kvadratna');
  const fn = FUNKCIJE.find((x) => x.id === fid) ?? FUNKCIJE[0];
  const [polozaj, postaviPolozaj] = useState(0.26);
  const [pravilo, postaviPravilo] = useState<Pravilo>('lijevo');
  const [t1, postaviT1] = useState(0.5);
  const [t2, postaviT2] = useState(3.5);
  const m = mZaPolozaj(polozaj);
  const a = Math.min(t1, t2, fn.tMax);
  const b = Math.min(Math.max(t1, t2), fn.tMax);

  const suma = riemannSuma(fn.i, a, b, m, pravilo);
  const tacno = fn.Q(b) - fn.Q(a);
  const greska = suma - tacno;
  const dt = (b - a) / m;

  const xr: Raspon = [0, fn.tMax];
  const ir0 = raspon(fn.i, 0, fn.tMax);
  const ir: Raspon = [Math.min(0, ir0[0]) * 1.1, Math.max(0, ir0[1]) * 1.1 || 1];
  const sk = skala(GRAF, xr, ir);
  const pr = pravougaonici(fn.i, a, b, m, pravilo);

  return (
    <Laboratorija
      crtez={
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${m} pravougaonika ispod i(t); zbir ${broj(suma, 3)} C, integral ${broj(tacno, 3)} C.`}>
          <Ose okvir={GRAF} xr={xr} yr={ir} xNatpis="t / s" yNatpis="i / A" xCilj={6}>
            {pr.map((p, k) => {
              const x0 = sk.x(p.t);
              const x1 = sk.x(p.t + p.dt);
              const y0 = sk.y(0);
              const y1 = sk.y(p.visina);
              return (
                <rect
                  key={k}
                  x={x0}
                  y={Math.min(y0, y1)}
                  width={Math.max(0.5, x1 - x0)}
                  height={Math.abs(y1 - y0)}
                  className={p.visina >= 0 ? f.pravougaonik : f.pravougaonikMinus}
                />
              );
            })}
            {m <= 40 &&
              pr.map((p, k) => (
                <circle key={`t${k}`} cx={sk.x(tackaUzorka(a, dt, k, pravilo))} cy={sk.y(p.visina)} r={m <= 12 ? 5 : 3} className={s.neutralno} />
              ))}
            <polyline points={kriva(fn.i, sk, 0, fn.tMax)} className={f.krivaStruje} />
            <line x1={sk.x(a)} y1={GRAF.y} x2={sk.x(a)} y2={GRAF.y + GRAF.h} className={s.tanka} />
            <line x1={sk.x(b)} y1={GRAF.y} x2={sk.x(b)} y2={GRAF.y + GRAF.h} className={s.tanka} />
            <text x={sk.x(a) - 6} y={GRAF.y + 24} textAnchor="end" className={`${s.tih} ${f.naCrtezu}`}>
              t₁
            </text>
            <text x={sk.x(b) + 6} y={GRAF.y + 24} className={`${s.tih} ${f.naCrtezu}`}>
              t₂
            </text>
          </Ose>
        </svg>
      }
      kontrole={
        <>
          <RedDugmadi opis="Struja i(t)">
            {FUNKCIJE.map((x) => (
              <Taster key={x.id} pritisnut={x.id === fid} onClick={() => postaviF(x.id)}>
                {x.id === 't2' ? 'i = 2t' : x.id === 'linearna' ? 'i = 5' : x.id === 'kvadratna' ? 'i = 6t' : 'i = 4 cos t'}
              </Taster>
            ))}
          </RedDugmadi>
          <Klizac id="m" natpis="broj pravougaonika m" vrijednost={polozaj} prikaz={String(m)} min={0} max={1} korak={0.01} boja="current" onPromjena={postaviPolozaj} />
          <RedDugmadi opis="Visina pravougaonika">
            {PRAVILA.map((p) => (
              <Taster key={p.id} pritisnut={pravilo === p.id} onClick={() => postaviPravilo(p.id)}>
                {p.natpis}
              </Taster>
            ))}
          </RedDugmadi>
          <Klizac id="t1" natpis="od t₁" vrijednost={t1} prikaz={`${broj(a, 1)} s`} min={0} max={fn.tMax} korak={0.1} boja="text" onPromjena={postaviT1} />
          <Klizac id="t2" natpis="do t₂" vrijednost={t2} prikaz={`${broj(b, 1)} s`} min={0} max={fn.tMax} korak={0.1} boja="text" onPromjena={postaviT2} />
        </>
      }
      ocitavanja={
        <Ocitavanja>
          <Ocitavanje natpis="Zbir Σ i·δt" vrijednost={broj(suma, 3)} jedinica="C" pod={`${m} komada po ${broj(dt, 3)} s`} />
          <Ocitavanje natpis="Integral ∫ i dt" vrijednost={broj(tacno, 3)} jedinica="C" pod="Q(t₂) − Q(t₁)" />
          <Ocitavanje natpis="Greška zbira" vrijednost={broj(greska, 4)} jedinica="C" pod={pravilo === 'sredina' ? 'pada kao 1/m²' : 'pada kao 1/m'} />
          <Ocitavanje natpis="Relativno" vrijednost={tacno === 0 ? '—' : broj((Math.abs(greska) / Math.abs(tacno)) * 100, 2)} jedinica={tacno === 0 ? '' : '%'} />
        </Ocitavanja>
      }
      status={
        <StatusLinija
          sta={`Zbir ${m} pravougaonika je ${broj(suma, 3)} C, integral ${broj(tacno, 3)} C.`}
          zasto={
            Math.abs(greska) < 1e-9
              ? 'Za pravu ili konstantu, uz pravougaonike u sredini, zbir je tačan već za jedan komad: višak i manjak se poklope.'
              : pravilo === 'sredina'
                ? 'Visina u sredini komada poništi većinu greške, pa se zbir brže primiče integralu: dvostruko više komada, četiri puta manja greška.'
                : 'Pravougaonici na kraju komada sistematski vire iznad krive ili su ispod nje; dvostruko više komada prepolovi grešku.'
          }
        />
      }
    />
  );
}
