'use client';

import { useRef, useState } from 'react';
import { broj } from '@/lib/format';
import { iznos, projekcija, skalarni, ugao, v3 } from '@/lib/fizika/vektori';
import { Ocitavanja, Ocitavanje, StatusLinija, Taster } from '@/components/instrument/Okvir';
import { Laboratorija, RedDugmadi } from '@/components/faks/Laboratorija';
import { usePrevlacenje, type Tacka } from '@/components/faks/prevlacenje';
import { Strelica, doIvice } from '@/components/faks/svg';
import s from '@/components/faks/sema.module.css';
import f from '@/components/faks/faks.module.css';

/*
  Sila F i pomak s iz istog početka; vrhovi se prevlače. Projekcija F na
  pravac s je duž na pravcu s; rad W = F·s = F s cos α. Jedan podiok
  crteža (60 px) je 1 N za silu i 1 m za pomak.
*/

const W = 1000;
const H = 560;
const O = { x: 420, y: 330 };
const PX = 60;

const PRIMJERI: { natpis: string; F: Tacka; s: Tacka }[] = [
  { natpis: 'Pod 90°', F: { x: O.x, y: O.y - 3 * PX }, s: { x: O.x + 4 * PX, y: O.y } },
  { natpis: 'Suprotno', F: { x: O.x - 2.5 * PX, y: O.y - 0.6 * PX }, s: { x: O.x + 4 * PX, y: O.y } },
  { natpis: 'Isti smjer', F: { x: O.x + 3 * PX, y: O.y }, s: { x: O.x + 4 * PX, y: O.y } },
];

export default function Simulacija() {
  const [Fv, postaviF] = useState<Tacka>({ x: O.x + 2.4 * PX, y: O.y - 2.2 * PX });
  const [Sv, postaviS] = useState<Tacka>({ x: O.x + 4 * PX, y: O.y - 0.5 * PX });
  const svg = useRef<SVGSVGElement>(null);
  const { tacka } = usePrevlacenje({
    svg,
    granice: { x0: 30, y0: 30, x1: 970, y1: 530 },
    naPomak: (i, p) => (i === 0 ? postaviF(p) : postaviS(p)),
  });

  /* U očitavanjima y raste naviše. */
  const F = v3((Fv.x - O.x) / PX, -(Fv.y - O.y) / PX);
  const sv = v3((Sv.x - O.x) / PX, -(Sv.y - O.y) / PX);
  const rad = skalarni(F, sv);
  const alfa = ugao(F, sv);
  const alfaSt = (alfa * 180) / Math.PI;
  const proj = projekcija(F, sv);
  const nS = iznos(sv);
  const us = nS === 0 ? { x: 0, y: 0 } : { x: sv.x / nS, y: sv.y / nS };
  const P = { x: O.x + proj * us.x * PX, y: O.y - proj * us.y * PX };

  /* Luk ugla α od pravca s ka pravcu F. */
  const uS = Math.atan2(-(Sv.y - O.y), Sv.x - O.x);
  const uF = Math.atan2(-(Fv.y - O.y), Fv.x - O.x);
  let d = uF - uS;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  const R = 46;
  const lukKraj = { x: O.x + R * Math.cos(uS + d), y: O.y - R * Math.sin(uS + d) };
  const lukPocetak = { x: O.x + R * Math.cos(uS), y: O.y - R * Math.sin(uS) };
  const sredinaLuka = { x: O.x + (R + 22) * Math.cos(uS + d / 2), y: O.y - (R + 22) * Math.sin(uS + d / 2) };

  const znak = Math.abs(rad) < 0.05 ? 0 : Math.sign(rad);

  return (
    <Laboratorija
      crtez={
        <svg ref={svg} viewBox={`0 0 ${W} ${H}`} className={s.dodir} role="img" aria-label={`Ugao ${broj(alfaSt, 0)}°; rad F·s = ${broj(rad, 2)} J.`}>
          <rect x={10} y={10} width={W - 20} height={H - 20} className={s.okvir} />
          {/* Pravac pomaka, produžen u oba smjera, da se vidi i negativna projekcija. */}
          {nS > 0 && (
            <line
              x1={doIvice(O, { x: -us.x, y: us.y }, W, H, 12).x}
              y1={doIvice(O, { x: -us.x, y: us.y }, W, H, 12).y}
              x2={doIvice(O, { x: us.x, y: -us.y }, W, H, 12).x}
              y2={doIvice(O, { x: us.x, y: -us.y }, W, H, 12).y}
              className={f.pravac}
            />
          )}
          <line x1={Fv.x} y1={Fv.y} x2={P.x} y2={P.y} className={s.isprekidana} />
          <line x1={O.x} y1={O.y} x2={P.x} y2={P.y} className={znak < 0 ? f.projekcijaMinus : f.projekcija} />
          <path d={`M ${lukPocetak.x} ${lukPocetak.y} A ${R} ${R} 0 0 ${d > 0 ? 0 : 1} ${lukKraj.x} ${lukKraj.y}`} className={s.linija} />
          <text x={sredinaLuka.x} y={sredinaLuka.y + 8} textAnchor="middle" className={`${s.tekst} ${f.naCrtezu}`}>
            α
          </text>

          <Strelica x1={O.x} y1={O.y} x2={Sv.x} y2={Sv.y} boja="neutralno" velicina={18} debljina={4} />
          <Strelica x1={O.x} y1={O.y} x2={Fv.x} y2={Fv.y} boja="sila" velicina={18} debljina={4} />
          <g className={s.rucka} aria-label="Vrh sile F; prevuci ga ili pomjeri strelicama" {...tacka(0, Fv)}>
            <circle cx={Fv.x} cy={Fv.y} r={16} className={f.rucicaVrha} />
            <text x={Fv.x + 18} y={Fv.y - 14} className={`${s.simbol} ${f.naCrtezu}`}>
              F
            </text>
          </g>
          <g className={s.rucka} aria-label="Vrh pomaka s; prevuci ga ili pomjeri strelicama" {...tacka(1, Sv)}>
            <circle cx={Sv.x} cy={Sv.y} r={16} className={f.rucicaVrha} />
            <text x={Sv.x + 18} y={Sv.y - 14} className={`${s.simbol} ${f.naCrtezu}`}>
              s
            </text>
          </g>
          <text x={P.x} y={P.y + 36} textAnchor="middle" className={`${s.tih} ${f.naCrtezu}`}>
            F cos α = {broj(proj, 2)} N
          </text>
        </svg>
      }
      kontrole={
        <>
          <RedDugmadi opis="Primjeri">
            {PRIMJERI.map((p) => (
              <Taster
                key={p.natpis}
                onClick={() => {
                  postaviF(p.F);
                  postaviS(p.s);
                }}
              >
                {p.natpis}
              </Taster>
            ))}
          </RedDugmadi>
          <p className={f.uputa}>Prevuci vrhove strelica F i s.</p>
        </>
      }
      ocitavanja={
        <Ocitavanja>
          <Ocitavanje natpis="Sila F" vrijednost={broj(iznos(F), 2)} jedinica="N" />
          <Ocitavanje natpis="Pomak s" vrijednost={broj(nS, 2)} jedinica="m" />
          <Ocitavanje natpis="Ugao α" vrijednost={broj(alfaSt, 0)} jedinica="°" pod={`cos α = ${broj(Math.cos(alfa), 3)}`} />
          <Ocitavanje natpis="Rad W = F·s" vrijednost={broj(rad, 2)} jedinica="J" pod="zbir proizvoda komponenti" />
        </Ocitavanja>
      }
      status={
        <StatusLinija
          sta={`F·s = ${broj(iznos(F), 2)} N · ${broj(nS, 2)} m · cos ${broj(alfaSt, 0)}° = ${broj(rad, 2)} J.`}
          zasto={
            znak === 0
              ? 'Sila je okomita na pomak: projekcija je nula, pa sila ne vrši rad, ma koliko bila velika.'
              : znak > 0
                ? 'Ugao je manji od 90°: projekcija sile gleda u smjeru pomaka, pa je proizvod pozitivan.'
                : 'Ugao je veći od 90°: projekcija gleda suprotno od pomaka, pa je proizvod negativan; sila koči.'
          }
        />
      }
    />
  );
}
