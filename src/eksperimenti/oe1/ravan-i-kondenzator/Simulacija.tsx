'use client';

import { useRef, useState } from 'react';
import { broj } from '@/lib/format';
import { EPS0, duzina } from '@/lib/fizika/elektrostatika';
import { kondenzatorPolje, ravanPolje, trakaPolje } from '@/lib/fizika/ravan';
import { Klizac, Ocitavanja, Ocitavanje, StatusLinija, Taster } from '@/components/instrument/Okvir';
import { Laboratorija, RedDugmadi } from '@/components/faks/Laboratorija';
import { usePrevlacenje, type Tacka } from '@/components/faks/prevlacenje';
import { Strelica } from '@/components/faks/svg';
import s from '@/components/faks/sema.module.css';
import f from '@/components/faks/faks.module.css';

/*
  Presjek: ravni okomite na crtež vide se kao uspravne duži, a tačke na
  njima su prave od kojih je ravan sastavljena. Mreža strelica pokazuje
  polje; dužina je srazmjerna |E| do σ/ε₀, pa se vidi gdje polja nema.
*/

const W = 1000;
const H = 560;
const PX_PO_CM = 25;
const O = { x: 500, y: 280 };
const SIGMA = 10e-9;
const D_CM = 8;
const KORAK_MREZE = 50;
const NAJDUZA = 38;

type Rezim = 'ravan' | 'kondenzator';

const uSI = (p: Tacka) => ({ x: (p.x - O.x) / PX_PO_CM / 100, y: -(p.y - O.y) / PX_PO_CM / 100 });

export default function Simulacija() {
  const [rezim, postaviRezim] = useState<Rezim>('kondenzator');
  const [polozaj, postaviPolozaj] = useState(0.35);
  const [T, postaviT] = useState<Tacka>({ x: 500, y: 200 });
  const svg = useRef<SVGSVGElement>(null);
  const { tacka } = usePrevlacenje({ svg, granice: { x0: 30, y0: 30, x1: 970, y1: 530 }, naPomak: (_, p) => postaviT(p) });

  /* Pola širine ploče, od 2 cm do 2 m, po logaritamskoj skali. */
  const wCm = 2 * 10 ** (2 * polozaj);
  const w = wCm / 100;
  const d = D_CM / 100;
  const poljeU = (p: Tacka) => {
    const t = uSI(p);
    const E = rezim === 'ravan' ? trakaPolje(SIGMA, w, 0, t) : kondenzatorPolje(SIGMA, w, d, t);
    return { x: E.x, y: -E.y };
  };
  const ref = SIGMA / EPS0;

  const ploce = rezim === 'ravan' ? [{ x: O.x, Q: 1 }] : [{ x: O.x - (D_CM / 2) * PX_PO_CM, Q: 1 }, { x: O.x + (D_CM / 2) * PX_PO_CM, Q: -1 }];
  const pola = Math.min(1000, wCm * PX_PO_CM);

  const strelice: { x: number; y: number; dx: number; dy: number }[] = [];
  for (let x = 50; x < W; x += KORAK_MREZE) {
    for (let y = 40; y < H; y += KORAK_MREZE) {
      if (ploce.some((p) => Math.abs(x - p.x) < 12 && Math.abs(y - O.y) <= pola)) continue;
      const E = poljeU({ x, y });
      const L = Math.min(1, duzina(E) / ref) * NAJDUZA;
      if (L < 3) continue;
      strelice.push({ x, y, dx: (E.x / duzina(E)) * L, dy: (E.y / duzina(E)) * L });
    }
  }

  const ET = poljeU(T);
  const ETiznos = duzina(ET);
  const izmedju = rezim === 'kondenzator' && Math.abs(T.x - O.x) < (D_CM / 2) * PX_PO_CM && Math.abs(T.y - O.y) < pola;

  return (
    <Laboratorija
      crtez={
        <svg ref={svg} viewBox={`0 0 ${W} ${H}`} className={s.dodir} role="img" aria-label={`${rezim === 'ravan' ? 'Jedna ravan' : 'Kondenzator'} širine ${broj(2 * wCm, 0)} cm; polje u T je ${broj(ETiznos, 0)} V/m.`}>
          <rect x={10} y={10} width={W - 20} height={H - 20} className={s.okvir} />
          {strelice.map((a, i) => (
            <Strelica key={i} x1={a.x - a.dx / 2} y1={a.y - a.dy / 2} x2={a.x + a.dx / 2} y2={a.y + a.dy / 2} boja="polje" velicina={9} debljina={2} />
          ))}
          {ploce.map((p) => (
            <g key={p.x}>
              <line x1={p.x} y1={Math.max(15, O.y - pola)} x2={p.x} y2={Math.min(H - 15, O.y + pola)} className={p.Q > 0 ? f.plocaPlus : f.plocaMinus} />
              {Array.from({ length: 25 }, (_, k) => O.y + (k - 12) * 20)
                .filter((y) => Math.abs(y - O.y) <= pola && y > 20 && y < H - 20)
                .map((y) => (
                  <circle key={y} cx={p.x} cy={y} r={4} className={p.Q > 0 ? s.plus : s.minus} />
                ))}
              <text x={p.x} y={Math.max(30, O.y - pola - 12)} textAnchor="middle" className={`${s.tekst} ${f.naCrtezu}`}>
                {p.Q > 0 ? '+σ' : '−σ'}
              </text>
            </g>
          ))}

          <g transform={`translate(${T.x} ${T.y})`} className={s.rucka} aria-label="Tačka T; prevuci je ili pomjeri strelicama" {...tacka(0, T)}>
            <circle r={13} className={f.tackaT} />
            <circle r={3} className={s.neutralno} />
            <text x={-16} y={-16} textAnchor="end" className={`${s.tekst} ${f.naCrtezu}`}>
              T
            </text>
          </g>
        </svg>
      }
      kontrole={
        <>
          <RedDugmadi opis="Raspored">
            <Taster pritisnut={rezim === 'ravan'} onClick={() => postaviRezim('ravan')}>
              Jedna ravan
            </Taster>
            <Taster pritisnut={rezim === 'kondenzator'} onClick={() => postaviRezim('kondenzator')}>
              Kondenzator
            </Taster>
          </RedDugmadi>
          <Klizac id="w" natpis="širina ploča" vrijednost={polozaj} prikaz={`${broj(2 * wCm, 0)} cm`} min={0} max={1} korak={0.01} boja="text" onPromjena={postaviPolozaj} />
          <p className={f.uputa}>Prevuci tačku T: između ploča, iza njih i do ruba.</p>
        </>
      }
      ocitavanja={
        <Ocitavanja>
          <Ocitavanje natpis="|E| u tački T" vrijednost={broj(ETiznos, 0)} jedinica="V/m" />
          <Ocitavanje natpis="σ/(2ε₀)" vrijednost={broj(ravanPolje(SIGMA), 0)} jedinica="V/m" pod="jedna beskonačna ravan" />
          <Ocitavanje natpis="σ/ε₀" vrijednost={broj(ref, 0)} jedinica="V/m" pod="između beskonačnih ploča" />
          <Ocitavanje natpis="E u T / (σ/ε₀)" vrijednost={broj((ETiznos / ref) * 100, 1)} jedinica="%" />
        </Ocitavanja>
      }
      status={
        <StatusLinija
          sta={
            rezim === 'ravan'
              ? `Ravan daje ${broj(ETiznos, 0)} V/m u T; beskonačna bi dala ${broj(ravanPolje(SIGMA), 0)} V/m na svakoj udaljenosti.`
              : izmedju
                ? `Između ploča polje je ${broj(ETiznos, 0)} V/m, blizu σ/ε₀ = ${broj(ref, 0)} V/m.`
                : `Van ploča polje je ${broj(ETiznos, 0)} V/m.`
          }
          zasto={
            rezim === 'ravan'
              ? 'Ravan je niz pravih. Daleko od ruba doprinosi pravih se uspravno poništavaju, a vodoravno daju σ/(2ε₀), sa obje strane od ravni.'
              : 'Između ploča se polja dvije ravni sabiraju u σ/ε₀, a vani poništavaju. Na rubu konačnih ploča polje viri van: to se vidi kad ih suziš.'
          }
        />
      }
    />
  );
}
