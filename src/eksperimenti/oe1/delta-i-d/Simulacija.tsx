'use client';

import { useState } from 'react';
import { broj } from '@/lib/format';
import { DT_MAX, FUNKCIJE, dtZaPolozaj, raspon, sjecica } from '@/lib/fizika/racun';
import { KORACI_TABELE, tabela, zakrivljenost } from '@/lib/fizika/delta';
import { Klizac, Ocitavanja, Ocitavanje, StatusLinija, Taster } from '@/components/instrument/Okvir';
import { Laboratorija, RedDugmadi } from '@/components/faks/Laboratorija';
import { Ose, kriva, skala, type Okvir, type Raspon } from '@/components/faks/Graf';
import s from '@/components/faks/sema.module.css';
import f from '@/components/faks/faks.module.css';

/*
  Lijevo cijela kriva Q(t) sa okvirom oko komadića [t₀, t₀ + δt]; desno
  isti komadić pod lupom, razvučen na cijeli kvadrat. Kad δt postane mali,
  komadić pod lupom je prava i poklapa se sa sječicom. Ispod je tabela
  δQ/δt za sve manje δt.
*/

const W = 1000;
const H = 520;
const LIJEVO: Okvir = { x: 90, y: 40, w: 400, h: 400 };
const LUPA: Okvir = { x: 580, y: 40, w: 380, h: 400 };

export default function Simulacija() {
  const [fid, postaviF] = useState('t2');
  const fn = FUNKCIJE.find((x) => x.id === fid) ?? FUNKCIJE[0];
  const [t0, postaviT0] = useState(1);
  const [polozaj, postaviPolozaj] = useState(0.2);
  const dt = dtZaPolozaj(polozaj);
  const T0 = Math.min(t0, fn.tMax - DT_MAX);
  const izvod = fn.i(T0);
  const kolicnik = sjecica(fn.Q, T0, dt);
  const dQ = fn.Q(T0 + dt) - fn.Q(T0);
  const redovi = tabela(fn.Q, izvod, T0);
  const blizi = KORACI_TABELE.reduce((a, b) => (Math.abs(Math.log(b / dt)) < Math.abs(Math.log(a / dt)) ? b : a));
  const zak = zakrivljenost(fn.Q, T0, dt);

  const xr: Raspon = [0, fn.tMax];
  const qr0 = raspon(fn.Q, 0, fn.tMax);
  const qr: Raspon = [qr0[0] - 0.08 * (qr0[1] - qr0[0]), qr0[1] + 0.08 * (qr0[1] - qr0[0])];
  const sk = skala(LIJEVO, xr, qr);

  /* Lupa: komadić razvučen na cijeli okvir, sa malo prostora oko njega. */
  const lx: Raspon = [T0 - 0.1 * dt, T0 + 1.1 * dt];
  const lq0 = raspon(fn.Q, lx[0], lx[1], 80);
  const lpad = Math.max(1e-9, 0.15 * (lq0[1] - lq0[0]));
  const lq: Raspon = [lq0[0] - lpad, lq0[1] + lpad];
  const skL = skala(LUPA, lx, lq);

  const okvir = {
    x: sk.x(T0),
    y: sk.y(Math.max(fn.Q(T0), fn.Q(T0 + dt))),
    w: Math.max(3, sk.x(T0 + dt) - sk.x(T0)),
    h: Math.max(3, Math.abs(sk.y(fn.Q(T0 + dt)) - sk.y(fn.Q(T0)))),
  };

  return (
    <Laboratorija
      crtez={
        <>
          <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Komadić δt = ${broj(dt, 3)} s na krivoj ${fn.tekst}; δQ/δt = ${broj(kolicnik, 3)} A.`}>
            <Ose okvir={LIJEVO} xr={xr} yr={qr} xNatpis="t / s" yNatpis="Q / C" xCilj={5}>
              <polyline points={kriva(fn.Q, sk, 0, fn.tMax)} className={f.kriva} />
              <rect x={okvir.x - 6} y={okvir.y - 6} width={okvir.w + 12} height={okvir.h + 12} className={f.lupaOkvir} />
            </Ose>
            <line x1={okvir.x + okvir.w + 6} y1={okvir.y - 6} x2={LUPA.x} y2={LUPA.y} className={s.tanka} />
            <line x1={okvir.x + okvir.w + 6} y1={okvir.y + okvir.h + 6} x2={LUPA.x} y2={LUPA.y + LUPA.h} className={s.tanka} />
            <Ose okvir={LUPA} xr={lx} yr={lq} xNatpis="t / s (lupa)" yNatpis="Q / C" xCilj={3} yCilj={3}>
              <rect x={LUPA.x} y={LUPA.y} width={LUPA.w} height={LUPA.h} className={f.lupaPozadina} />
              <line x1={skL.x(T0)} y1={skL.y(fn.Q(T0))} x2={skL.x(T0 + dt)} y2={skL.y(fn.Q(T0 + dt))} className={f.sjecica} />
              <polyline points={kriva(fn.Q, skL, lx[0], lx[1], 160)} className={f.kriva} />
              <circle cx={skL.x(T0)} cy={skL.y(fn.Q(T0))} r={7} className={s.neutralno} />
              <circle cx={skL.x(T0 + dt)} cy={skL.y(fn.Q(T0 + dt))} r={7} className={s.struja} />
            </Ose>
          </svg>
          <table className={f.tabela}>
            <caption>δQ/δt za sve manje komadiće, u t₀ = {broj(T0, 2)} s</caption>
            <thead>
              <tr>
                <th scope="col">δt</th>
                <th scope="col">δQ</th>
                <th scope="col">δQ/δt</th>
                <th scope="col">razlika od dQ/dt</th>
              </tr>
            </thead>
            <tbody>
              {redovi.map((r) => (
                <tr key={r.dt} className={r.dt === blizi ? f.redIstaknut : undefined}>
                  <th scope="row">{broj(r.dt, r.dt < 0.01 ? 3 : r.dt < 0.1 ? 2 : 1)} s</th>
                  <td>{broj(r.dQ, 5)} C</td>
                  <td>{broj(r.kolicnik, 4)} A</td>
                  <td>{broj(r.razlika, 4)} A</td>
                </tr>
              ))}
              <tr className={f.zbirRed}>
                <th scope="row">→ 0</th>
                <td>→ 0</td>
                <td>{broj(izvod, 4)} A</td>
                <td>0</td>
              </tr>
            </tbody>
          </table>
        </>
      }
      kontrole={
        <>
          <RedDugmadi opis="Funkcija Q(t)">
            {FUNKCIJE.map((x) => (
              <Taster
                key={x.id}
                pritisnut={x.id === fid}
                onClick={() => {
                  postaviF(x.id);
                  postaviT0((t) => Math.min(t, x.tMax - DT_MAX));
                }}
              >
                {x.tekst}
              </Taster>
            ))}
          </RedDugmadi>
          <Klizac id="t0" natpis="trenutak t₀" vrijednost={T0} prikaz={`${broj(T0, 2)} s`} min={0} max={fn.tMax - DT_MAX} korak={0.05} boja="text" onPromjena={postaviT0} />
          <Klizac id="dt" natpis="komadić δt" vrijednost={polozaj} prikaz={`${broj(dt, dt < 0.1 ? 3 : 2)} s`} min={0} max={1} korak={0.01} boja="current" onPromjena={postaviPolozaj} />
        </>
      }
      ocitavanja={
        <Ocitavanja>
          <Ocitavanje natpis="δQ/δt" vrijednost={broj(kolicnik, 3)} jedinica="A" pod="prosjek na komadiću" />
          <Ocitavanje natpis="dQ/dt" vrijednost={broj(izvod, 3)} jedinica="A" pod="granica, u trenutku t₀" />
          <Ocitavanje natpis="δQ" vrijednost={broj(dQ, 4)} jedinica="C" pod={`na δt = ${broj(dt, 3)} s`} />
          <Ocitavanje natpis="Zakrivljenost" vrijednost={broj(zak * 100, 2)} jedinica="%" pod="odmak krive od sječice" />
        </Ocitavanja>
      }
      status={
        <StatusLinija
          sta={`Na komadiću od ${broj(dt, 3)} s prosjek je ${broj(kolicnik, 3)} A, a u trenutku t₀ ${broj(izvod, 3)} A.`}
          zasto={
            zak < 0.01
              ? 'Pod lupom se komadić više ne razlikuje od prave: tu δ postaje d, a prosjek postaje trenutna vrijednost.'
              : 'Komadić je još zakrivljen, pa je δQ/δt prosjek, a ne vrijednost u jednoj tački. Smanji δt.'
          }
        />
      }
    />
  );
}
