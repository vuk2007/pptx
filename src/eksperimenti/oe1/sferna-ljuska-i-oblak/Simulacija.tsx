'use client';

import { useState } from 'react';
import { broj } from '@/lib/format';
import { EPS0 } from '@/lib/fizika/elektrostatika';
import { slucajno } from '@/lib/fizika/slucajno';
import { obuhvaceno, poljeSferno, type Model, type Raspored } from '@/lib/fizika/sferno';
import { Klizac, Ocitavanja, Ocitavanje, StatusLinija, Taster } from '@/components/instrument/Okvir';
import { Laboratorija, RedDugmadi } from '@/components/faks/Laboratorija';
import { Ose, kriva, skala, type Okvir, type Raspon } from '@/components/faks/Graf';
import { Strelica } from '@/components/faks/svg';
import s from '@/components/faks/sema.module.css';
import f from '@/components/faks/faks.module.css';

/*
  Presjek sferno simetričnog naboja i Gaussove sfere koja se širi.
  Strelice na sferi su E, iste dužine svuda po sferi (simetrija); graf
  desno je E(r) sa tačkom na trenutnom poluprečniku.
*/

const W = 1000;
const H = 560;
const PX_PO_CM = 20;
const C = { x: 260, y: 280 };
const Q = 4e-9;
const R_CM = 5;
const B_CM = 10;
const GRAF: Okvir = { x: 620, y: 50, w: 350, h: 380 };
const PX_PO_KV = 9;

const MODELI: { id: Model; natpis: string }[] = [
  { id: 'ljuska', natpis: 'Ljuska' },
  { id: 'oblak', natpis: 'Oblak' },
  { id: 'kondenzator', natpis: 'Sferni kondenzator' },
];

/* Tačke oblaka: jednoliko po krugu presjeka, sa sjemenom. */
const OBLAK = (() => {
  const r = slucajno(12);
  const t: { x: number; y: number }[] = [];
  while (t.length < 220) {
    const x = (r() * 2 - 1) * R_CM;
    const y = (r() * 2 - 1) * R_CM;
    if (x * x + y * y < R_CM * R_CM) t.push({ x, y });
  }
  return t;
})();

export default function Simulacija() {
  const [model, postaviModel] = useState<Model>('ljuska');
  const [rGCm, postaviRG] = useState(3);
  const ras: Raspored = { model, Q, R: R_CM / 100, b: B_CM / 100 };
  const rG = rGCm / 100;
  const Qnot = obuhvaceno(ras, rG);
  const E = poljeSferno(ras, rG);

  const xr: Raspon = [0, 14];
  const Emax = poljeSferno({ ...ras, model: 'ljuska' }, ras.R * 1.0001);
  const yr: Raspon = [0, Emax * 1.15];
  const sk = skala(GRAF, xr, yr);
  const L = Math.min(110, (E / 1000) * PX_PO_KV);

  const obod = (Rcm: number, znak: number, koliko: number) =>
    Array.from({ length: koliko }, (_, k) => {
      const u = (2 * Math.PI * (k + 0.5)) / koliko;
      return <circle key={`${Rcm}-${k}`} cx={C.x + Rcm * PX_PO_CM * Math.cos(u)} cy={C.y + Rcm * PX_PO_CM * Math.sin(u)} r={5} className={znak > 0 ? s.plus : s.minus} />;
    });

  return (
    <Laboratorija
      crtez={
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${model}; Gaussova sfera od ${broj(rGCm, 1)} cm obuhvata ${broj(Qnot * 1e9, 2)} nC, polje ${broj(E, 0)} V/m.`}>
          {model === 'oblak' && <circle cx={C.x} cy={C.y} r={R_CM * PX_PO_CM} className={f.oblak} />}
          {model === 'oblak' && OBLAK.map((t, k) => <circle key={k} cx={C.x + t.x * PX_PO_CM} cy={C.y + t.y * PX_PO_CM} r={3} className={s.plus} />)}
          {model !== 'oblak' && obod(R_CM, 1, 28)}
          {model === 'kondenzator' && obod(B_CM, -1, 44)}

          <circle cx={C.x} cy={C.y} r={rGCm * PX_PO_CM} className={f.gaussSfera} />
          {L > 4 &&
            Array.from({ length: 8 }, (_, k) => {
              const u = (2 * Math.PI * k) / 8 + Math.PI / 8;
              const x = C.x + rGCm * PX_PO_CM * Math.cos(u);
              const y = C.y + rGCm * PX_PO_CM * Math.sin(u);
              return <Strelica key={k} x1={x} y1={y} x2={x + L * Math.cos(u)} y2={y + L * Math.sin(u)} boja="polje" velicina={14} debljina={3} />;
            })}
          <line x1={C.x} y1={C.y} x2={C.x + rGCm * PX_PO_CM} y2={C.y} className={s.tanka} />
          <text x={C.x + (rGCm * PX_PO_CM) / 2} y={C.y - 10} textAnchor="middle" className={`${s.tih} ${f.naCrtezu}`}>
            r
          </text>

          <Ose okvir={GRAF} xr={xr} yr={yr} xNatpis="r / cm" yNatpis="E / (V/m)" xCilj={7}>
            <polyline points={kriva((r) => poljeSferno(ras, r / 100), sk, 0.05, 14, 560)} className={f.kriva} />
            <line x1={sk.x(R_CM)} y1={GRAF.y} x2={sk.x(R_CM)} y2={GRAF.y + GRAF.h} className={s.isprekidana} />
            <text x={sk.x(R_CM) + 6} y={GRAF.y + 22} className={s.tih}>
              {model === 'kondenzator' ? 'a' : 'R'}
            </text>
            {model === 'kondenzator' && (
              <>
                <line x1={sk.x(B_CM)} y1={GRAF.y} x2={sk.x(B_CM)} y2={GRAF.y + GRAF.h} className={s.isprekidana} />
                <text x={sk.x(B_CM) + 6} y={GRAF.y + 22} className={s.tih}>
                  b
                </text>
              </>
            )}
            <circle cx={sk.x(rGCm)} cy={sk.y(E)} r={7} className={s.polje} />
          </Ose>
        </svg>
      }
      kontrole={
        <>
          <RedDugmadi opis="Raspored naboja">
            {MODELI.map((m) => (
              <Taster key={m.id} pritisnut={model === m.id} onClick={() => postaviModel(m.id)}>
                {m.natpis}
              </Taster>
            ))}
          </RedDugmadi>
          <Klizac id="rg" natpis="Gaussova sfera, r" vrijednost={rGCm} prikaz={`${broj(rGCm, 1)} cm`} min={0.5} max={13} korak={0.5} boja="polje" onPromjena={postaviRG} />
        </>
      }
      ocitavanja={
        <Ocitavanja>
          <Ocitavanje natpis="Obuhvaćen naboj" vrijednost={broj(Qnot * 1e9, 2)} jedinica="nC" pod={`od ${broj(Q * 1e9, 0)} nC`} />
          <Ocitavanje natpis="Polje na sferi" vrijednost={broj(E, 0)} jedinica="V/m" pod="isto po cijeloj sferi" />
          <Ocitavanje natpis="E · 4πr²" vrijednost={broj(E * 4 * Math.PI * rG * rG, 1)} jedinica="V·m" pod="fluks kroz sferu" />
          <Ocitavanje natpis={<>Q<sub>not</sub>/ε₀</>} vrijednost={broj(Qnot / EPS0, 1)} jedinica="V·m" pod="Gauss" />
        </Ocitavanja>
      }
      status={
        <StatusLinija
          sta={`Sfera od ${broj(rGCm, 1)} cm obuhvata ${broj(Qnot * 1e9, 2)} nC, pa je polje na njoj ${broj(E, 0)} V/m.`}
          zasto={
            model === 'ljuska'
              ? rGCm < R_CM
                ? 'Unutar ljuske sfera ne obuhvata ništa, pa polja nema, iako je naboj svuda oko nje.'
                : 'Van ljuske sfera obuhvata sav naboj: polje je kao od tačke u centru.'
              : model === 'oblak'
                ? rGCm < R_CM
                  ? 'Unutar oblaka obuhvaćen naboj raste sa r³, a površina sa r², pa polje raste linearno.'
                  : 'Van oblaka obuhvaćen je sav naboj, pa polje opada sa 1/r².'
                : rGCm < R_CM || rGCm > B_CM
                  ? 'Ovdje sfera obuhvata nula naboja (ili +Q i −Q zajedno), pa polja nema.'
                  : 'Između kugli sfera obuhvata samo unutrašnji +Q: polje postoji samo ovdje.'
          }
        />
      }
    />
  );
}
