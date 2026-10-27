'use client';

import { useId, useState } from 'react';
import { broj } from '@/lib/format';
import { DT_MAX, FUNKCIJE, dtZaPolozaj, integral, raspon, sjecica } from '@/lib/fizika/racun';
import { Klizac, Ocitavanja, Ocitavanje, StatusLinija, Taster } from '@/components/instrument/Okvir';
import { Laboratorija, RedDugmadi } from '@/components/faks/Laboratorija';
import { Ose, kriva, povrsinaIspod, skala, stegni, type Okvir, type Raspon } from '@/components/faks/Graf';
import s from '@/components/faks/sema.module.css';
import f from '@/components/faks/faks.module.css';

/*
  Gore Q(t) sa sječicom i tangentom, dolje i(t) sa površinom od t₁ do t₂.
  Nagib gore je visina dolje (izvod); površina dolje je promjena gore
  (integral). Nema animacije: sve se mijenja samo klizačima.
*/

const W = 1000;
const H = 800;
const GORE: Okvir = { x: 110, y: 52, w: 860, h: 268 };
const DOLJE: Okvir = { x: 110, y: 472, w: 860, h: 258 };

function siriRaspon([a, b]: Raspon, dodatak: number): Raspon {
  const r = b - a || 1;
  return [a - dodatak - r * 0.08, b + dodatak + r * 0.08];
}

export default function Simulacija() {
  const [fid, postaviF] = useState(FUNKCIJE[0].id);
  const fn = FUNKCIJE.find((x) => x.id === fid) ?? FUNKCIJE[0];
  const [t0, postaviT0] = useState(1);
  const [polozaj, postaviPolozaj] = useState(0.15);
  const [C, postaviC] = useState(0);
  const [t1, postaviT1] = useState(1);
  const [t2, postaviT2] = useState(3);
  /* useId daje znakove koje url(#…) u clip-path ne prima. */
  const id = `g${useId().replace(/[^a-zA-Z0-9]/g, '')}`;

  const tMax = fn.tMax;
  const t0Max = tMax - DT_MAX;
  const T0 = Math.min(t0, t0Max);
  const T1 = Math.min(t1, tMax);
  const T2 = Math.min(t2, tMax);
  const dt = dtZaPolozaj(polozaj);
  const Q = (t: number) => fn.Q(t) + C;

  const prosjek = sjecica(Q, T0, dt);
  const tangenta = fn.i(T0);
  const dQ = integral(fn.i, T1, T2);
  const razlikaQ = Q(T2) - Q(T1);

  const xr: Raspon = [0, tMax];
  const qr = siriRaspon(raspon(fn.Q, 0, tMax), 5);
  const ir = siriRaspon(((r) => [Math.min(0, r[0]), Math.max(0, r[1])] as const)(raspon(fn.i, 0, tMax)), 0);
  const skQ = skala(GORE, xr, qr);
  const skI = skala(DOLJE, xr, ir);

  const P0 = { x: skQ.x(T0), y: skQ.y(Q(T0)) };
  const P1 = { x: skQ.x(T0 + dt), y: skQ.y(Q(T0 + dt)) };
  const sir = 0.7;
  const linijaKroz = (nagib: number, od: number, doT: number) => ({
    x1: skQ.x(od),
    y1: skQ.y(Q(T0) + nagib * (od - T0)),
    x2: skQ.x(doT),
    y2: skQ.y(Q(T0) + nagib * (doT - T0)),
  });
  const sjec = linijaKroz(prosjek, Math.max(0, T0 - sir), Math.min(tMax, T0 + dt + sir));
  const tang = linijaKroz(tangenta, Math.max(0, T0 - 1.2), Math.min(tMax, T0 + 1.2));
  const sirokoDt = P1.x - P0.x > 46;

  const razlika = Math.abs(prosjek - tangenta);
  const linearna = fn.id === 'linearna';

  const izaberi = (novi: string) => {
    postaviF(novi);
    const nova = FUNKCIJE.find((x) => x.id === novi) ?? FUNKCIJE[0];
    postaviT0((t) => Math.min(t, nova.tMax - DT_MAX));
    postaviT1((t) => Math.min(t, nova.tMax));
    postaviT2((t) => Math.min(t, nova.tMax));
  };

  return (
    <Laboratorija
      crtez={
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${fn.tekst}: sječica ima nagib ${broj(prosjek, 2)} A, tangenta ${broj(tangenta, 2)} A; površina ispod i(t) od t₁ do t₂ je ${broj(dQ, 2)} C.`}>
          <defs>
            <clipPath id={`${id}g`}>
              <rect x={GORE.x} y={GORE.y} width={GORE.w} height={GORE.h} />
            </clipPath>
            <clipPath id={`${id}d`}>
              <rect x={DOLJE.x} y={DOLJE.y} width={DOLJE.w} height={DOLJE.h} />
            </clipPath>
          </defs>

          {/* ---------- gore: Q(t) ---------- */}
          <Ose okvir={GORE} xr={xr} yr={qr} xNatpis="t / s" yNatpis="Q / C" />
          <g clipPath={`url(#${id}g)`}>
            <line x1={GORE.x} y1={skQ.y(Q(T1))} x2={GORE.x + GORE.w} y2={skQ.y(Q(T1))} className={f.mreza} strokeDasharray="6 6" />
            <line x1={GORE.x} y1={skQ.y(Q(T2))} x2={GORE.x + GORE.w} y2={skQ.y(Q(T2))} className={f.mreza} strokeDasharray="6 6" />
            <polyline points={kriva(Q, skQ, 0, tMax)} className={f.kriva} />
            <line {...tang} className={s.isprekidana} />
            <line {...sjec} className={f.sjecica} />
            <line x1={P0.x} y1={P0.y} x2={P1.x} y2={P0.y} className={s.tanka} />
            <line x1={P1.x} y1={P0.y} x2={P1.x} y2={P1.y} className={s.tanka} />
          </g>
          {sirokoDt && (
            <>
              <text x={(P0.x + P1.x) / 2} y={P0.y + (P1.y > P0.y ? -10 : 28)} textAnchor="middle" className={`${s.tih} ${f.naCrtezu}`}>
                δt
              </text>
              <text x={P1.x + 10} y={(P0.y + P1.y) / 2 + 8} className={`${s.tih} ${f.naCrtezu}`}>
                δQ
              </text>
            </>
          )}
          <circle cx={P0.x} cy={P0.y} r={7} className={s.neutralno} />
          <circle cx={P1.x} cy={P1.y} r={7} className={s.struja} />
          <circle cx={skQ.x(T1)} cy={skQ.y(Q(T1))} r={5} className={s.neutralno} />
          <circle cx={skQ.x(T2)} cy={skQ.y(Q(T2))} r={5} className={s.neutralno} />
          {/* Kota ΔQ uz desnu ivicu: ista promjena koju dolje daje površina. */}
          <line x1={GORE.x + GORE.w - 24} y1={skQ.y(Q(T1))} x2={GORE.x + GORE.w - 24} y2={skQ.y(Q(T2))} className={f.kotaStruje} />
          <text x={GORE.x + GORE.w - 34} y={(skQ.y(Q(T1)) + skQ.y(Q(T2))) / 2 + 8} textAnchor="end" className={`${s.tih} ${f.naCrtezu}`}>
            ΔQ
          </text>

          {/* ---------- veza ---------- */}
          <text x={GORE.x} y={424} className={s.tekst}>
            Q → izvod → i
          </text>
          <text x={W - 30} y={424} textAnchor="end" className={s.tekst}>
            i → integral → ΔQ
          </text>

          {/* ---------- dolje: i(t) ---------- */}
          <Ose okvir={DOLJE} xr={xr} yr={ir} xNatpis="t / s" yNatpis="i / A" />
          <g clipPath={`url(#${id}d)`}>
            <polygon points={povrsinaIspod(fn.i, skI, T1, T2)} className={f.povrsina} />
            <polyline points={kriva(fn.i, skI, 0, tMax)} className={f.krivaStruje} />
            <line x1={skI.x(T1)} y1={DOLJE.y} x2={skI.x(T1)} y2={DOLJE.y + DOLJE.h} className={s.tanka} />
            <line x1={skI.x(T2)} y1={DOLJE.y} x2={skI.x(T2)} y2={DOLJE.y + DOLJE.h} className={s.tanka} />
            <line
              x1={skI.x(T0)}
              y1={skI.y(stegni(prosjek, ir))}
              x2={skI.x(T0 + dt)}
              y2={skI.y(stegni(prosjek, ir))}
              className={f.sjecica}
            />
          </g>
          <text x={skI.x(T1)} y={DOLJE.y + 26} textAnchor="end" dx={-6} className={`${s.tih} ${f.naCrtezu}`}>
            t₁
          </text>
          <text x={skI.x(T2)} y={DOLJE.y + 26} dx={6} className={`${s.tih} ${f.naCrtezu}`}>
            t₂
          </text>
          <circle cx={skI.x(T0)} cy={skI.y(tangenta)} r={7} className={s.neutralno} />
        </svg>
      }
      kontrole={
        <>
          <RedDugmadi opis="Funkcija Q(t)">
            {FUNKCIJE.map((x) => (
              <Taster key={x.id} pritisnut={x.id === fid} onClick={() => izaberi(x.id)}>
                {x.tekst}
              </Taster>
            ))}
          </RedDugmadi>
          <Klizac id="t0" natpis="trenutak t₀" vrijednost={T0} prikaz={`${broj(T0, 2)} s`} min={0} max={t0Max} korak={0.05} boja="text" onPromjena={postaviT0} />
          <Klizac id="dt" natpis="interval δt" vrijednost={polozaj} prikaz={`${broj(dt, dt < 0.1 ? 3 : 2)} s`} min={0} max={1} korak={0.01} boja="current" onPromjena={postaviPolozaj} />
          <Klizac id="C" natpis="konstanta C u Q(t) + C" vrijednost={C} prikaz={`${broj(C, 0)} C`} min={-5} max={5} korak={1} boja="text" onPromjena={postaviC} />
          <Klizac id="t1" natpis="od t₁" vrijednost={T1} prikaz={`${broj(T1, 1)} s`} min={0} max={tMax} korak={0.1} boja="current" onPromjena={postaviT1} />
          <Klizac id="t2" natpis="do t₂" vrijednost={T2} prikaz={`${broj(T2, 1)} s`} min={0} max={tMax} korak={0.1} boja="current" onPromjena={postaviT2} />
        </>
      }
      ocitavanja={
        <Ocitavanja>
          <Ocitavanje natpis="Sječica δQ/δt" vrijednost={broj(prosjek, 2)} jedinica="A" pod="prosjek na [t₀, t₀ + δt]" />
          <Ocitavanje natpis="Tangenta i(t₀)" vrijednost={broj(tangenta, 2)} jedinica="A" pod={`razlika ${broj(razlika, 3)} A`} />
          <Ocitavanje natpis="∫ i dt od t₁ do t₂" vrijednost={broj(dQ, 2)} jedinica="C" pod="površina ispod i(t)" />
          <Ocitavanje natpis="Q(t₂) − Q(t₁)" vrijednost={broj(razlikaQ, 2)} jedinica="C" pod="promjena na gornjem grafu" />
        </Ocitavanja>
      }
      status={
        <StatusLinija
          sta={`Sječica ima nagib ${broj(prosjek, 2)} A, a tangenta ${broj(tangenta, 2)} A.`}
          zasto={
            linearna
              ? 'Q(t) je prava, pa je nagib isti svuda: sječica je jednaka tangenti za svaki δt.'
              : razlika < 0.02
                ? 'Za ovako mali δt sječica se skoro poklapa sa tangentom: to je izvod, i = dQ/dt.'
                : 'Za konačan δt sječica daje prosječnu struju na intervalu, a ne struju u trenutku t₀. Smanji δt.'
          }
        />
      }
    />
  );
}
