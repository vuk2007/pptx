'use client';

import { useMemo, useState } from 'react';
import { broj } from '@/lib/format';
import { K } from '@/lib/fizika/elektrostatika';
import { fluksKrozKomadic, fluksSfere } from '@/lib/fizika/fluks';
import { Klizac, Ocitavanja, Ocitavanje, StatusLinija, Taster } from '@/components/instrument/Okvir';
import { Laboratorija, RedDugmadi } from '@/components/faks/Laboratorija';
import { NabojTacka, Strelica } from '@/components/faks/svg';
import s from '@/components/faks/sema.module.css';
import f from '@/components/faks/faks.module.css';

/*
  Bočni pogled: naboj lijevo, kvadratni komadić a × a na udaljenosti r,
  nagnut za θ. Isprekidane linije su ivice konusa pod kojim se komadić
  vidi. Režim „Isti ugao" povećava komadić sa r, pa konus ostaje isti;
  režim „Ista površina" drži a, pa se konus sužava.
*/

const W = 1000;
const H = 560;
const PX_PO_CM = 15;
const NABOJ = { x: 110, y: 280 };
const Q = 2e-9;
const R0_CM = 15;
const A0_CM = 8;
const LINIJA = 30;

type Rezim = 'ugao' | 'povrsina';

/** Gdje zrak iz p u smjeru u izlazi iz okvira crteža (sa marginom). */
function doIvice(p: { x: number; y: number }, u: { x: number; y: number }, m = 6) {
  const kand: number[] = [];
  if (u.x > 0) kand.push((W - m - p.x) / u.x);
  if (u.x < 0) kand.push((m - p.x) / u.x);
  if (u.y > 0) kand.push((H - m - p.y) / u.y);
  if (u.y < 0) kand.push((m - p.y) / u.y);
  const t = Math.min(...kand.filter((x) => x > 0));
  return { x: p.x + u.x * t, y: p.y + u.y * t };
}

export default function Simulacija() {
  const [rezim, postaviRezim] = useState<Rezim>('ugao');
  const [rCm, postaviR] = useState(15);
  const [thetaSt, postaviTheta] = useState(0);
  const theta = (thetaSt * Math.PI) / 180;
  const aCm = rezim === 'ugao' ? (A0_CM * rCm) / R0_CM : A0_CM;

  const fluks = useMemo(() => fluksKrozKomadic(Q, aCm / 100, aCm / 100, rCm / 100, theta, 70), [aCm, rCm, theta]);
  const omega = fluks / (K * Q);
  const E = (K * Q) / (rCm / 100) ** 2;

  /* Komadić u bočnom pogledu: duž dužine a, okomita na normalu n = (cos θ, sin θ). */
  const C = { x: NABOJ.x + rCm * PX_PO_CM, y: NABOJ.y };
  const pola = (aCm * PX_PO_CM) / 2;
  const n = { x: Math.cos(theta), y: -Math.sin(theta) };
  const t = { x: -n.y, y: n.x };
  const P1 = { x: C.x + t.x * pola, y: C.y + t.y * pola };
  const P2 = { x: C.x - t.x * pola, y: C.y - t.y * pola };
  const produzi = (P: { x: number; y: number }) => {
    const d = Math.hypot(P.x - NABOJ.x, P.y - NABOJ.y);
    return doIvice(NABOJ, { x: (P.x - NABOJ.x) / d, y: (P.y - NABOJ.y) / d });
  };
  const K1 = produzi(P1);
  const K2 = produzi(P2);

  /* Linije polja u ravni crteža, ravnomjerno po uglu; istaknute su one koje prolaze kroz komadić. */
  const u1 = Math.atan2(P1.y - NABOJ.y, P1.x - NABOJ.x);
  const u2 = Math.atan2(P2.y - NABOJ.y, P2.x - NABOJ.x);
  const [umin, umax] = [Math.min(u1, u2), Math.max(u1, u2)];
  const linije = Array.from({ length: LINIJA }, (_, k) => (2 * Math.PI * (k + 0.5)) / LINIJA - Math.PI);
  const kroz = linije.filter((u) => u >= umin && u <= umax).length;

  return (
    <Laboratorija
      crtez={
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Komadić ${broj(aCm, 1)} cm na ${broj(rCm, 0)} cm, nagnut ${thetaSt}°; fluks ${broj(fluks, 2)} V·m.`}>
          {linije.map((u, k) => {
            const unutra = u >= umin && u <= umax;
            const kraj = doIvice(NABOJ, { x: Math.cos(u), y: Math.sin(u) });
            return (
              <line
                key={k}
                x1={NABOJ.x + 24 * Math.cos(u)}
                y1={NABOJ.y + 24 * Math.sin(u)}
                x2={kraj.x}
                y2={kraj.y}
                className={unutra ? f.linijaKroz : s.linijaPolja}
              />
            );
          })}
          <polygon points={`${NABOJ.x},${NABOJ.y} ${K1.x},${K1.y} ${K2.x},${K2.y}`} className={f.konus} />
          <line x1={NABOJ.x} y1={NABOJ.y} x2={K1.x} y2={K1.y} className={s.isprekidana} />
          <line x1={NABOJ.x} y1={NABOJ.y} x2={K2.x} y2={K2.y} className={s.isprekidana} />

          <line x1={P1.x} y1={P1.y} x2={P2.x} y2={P2.y} className={f.komadic} />
          <Strelica x1={C.x} y1={C.y} x2={C.x + n.x * 70} y2={C.y + n.y * 70} boja="normala" velicina={14} />
          <text x={C.x + n.x * 84} y={C.y + n.y * 84 + 8} className={`${s.simbol} ${s.normala} ${f.naCrtezu}`}>
            n
          </text>
          <text x={C.x} y={Math.max(P1.y, P2.y) + 36} textAnchor="middle" className={`${s.tih} ${f.naCrtezu}`}>
            a = {broj(aCm, 1)} cm
          </text>
          <line x1={NABOJ.x} y1={H - 40} x2={C.x} y2={H - 40} className={s.tanka} />
          <text x={(NABOJ.x + C.x) / 2} y={H - 50} textAnchor="middle" className={s.tih}>
            r = {broj(rCm, 0)} cm
          </text>
          <NabojTacka x={NABOJ.x} y={NABOJ.y} Q={1} natpis="Q" />
        </svg>
      }
      kontrole={
        <>
          <RedDugmadi opis="Šta ostaje isto">
            <Taster pritisnut={rezim === 'ugao'} onClick={() => postaviRezim('ugao')}>
              Isti ugao
            </Taster>
            <Taster pritisnut={rezim === 'povrsina'} onClick={() => postaviRezim('povrsina')}>
              Ista površina
            </Taster>
          </RedDugmadi>
          <Klizac id="r" natpis="udaljenost r" vrijednost={rCm} prikaz={`${broj(rCm, 0)} cm`} min={6} max={36} korak={1} boja="text" onPromjena={postaviR} />
          <Klizac id="th" natpis="nagib θ prema konusu" vrijednost={thetaSt} prikaz={`${thetaSt}°`} min={0} max={85} korak={5} boja="normala" onPromjena={postaviTheta} />
        </>
      }
      ocitavanja={
        <Ocitavanja>
          <Ocitavanje natpis="Fluks kroz komadić" vrijednost={broj(fluks, 2)} jedinica="V·m" pod="∫ E·da" />
          <Ocitavanje natpis="Prostorni ugao Ω" vrijednost={broj(omega, 4)} jedinica="sr" pod={`${broj((omega / (4 * Math.PI)) * 100, 2)} % pune sfere`} />
          <Ocitavanje natpis="Polje u centru" vrijednost={broj(E / 1000, 2)} jedinica="kV/m" pod="opada sa 1/r²" />
          <Ocitavanje natpis="Površina komadića" vrijednost={broj(aCm * aCm, 1)} jedinica="cm²" pod={`sfera: ${broj(fluksSfere(Q), 0)} V·m`} />
        </Ocitavanja>
      }
      status={
        <StatusLinija
          sta={`Kroz komadić prolazi ${broj(fluks, 2)} V·m, ${broj((omega / (4 * Math.PI)) * 100, 2)} % fluksa Q/ε₀; u crtežu ga sijeku ${kroz} od ${LINIJA} linija.`}
          zasto={
            rezim === 'ugao'
              ? 'Polje opada sa 1/r², a površina raste sa r²: fluks zavisi samo od prostornog ugla, ne od udaljenosti.'
              : 'Ista površina dalje od naboja vidi se pod manjim uglom, pa kroz nju prolazi manje fluksa.'
          }
        />
      }
    />
  );
}
