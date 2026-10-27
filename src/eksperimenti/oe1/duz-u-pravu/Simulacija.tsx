'use client';

import { useId, useState } from 'react';
import { broj } from '@/lib/format';
import { K } from '@/lib/fizika/elektrostatika';
import { duzKomadi, duzPolje, pravaPolje } from '@/lib/fizika/duz';
import { Klizac, Ocitavanja, Ocitavanje, StatusLinija } from '@/components/instrument/Okvir';
import { Laboratorija } from '@/components/faks/Laboratorija';
import { Ose, kriva, skala, type Okvir, type Raspon } from '@/components/faks/Graf';
import { Strelica } from '@/components/faks/svg';
import s from '@/components/faks/sema.module.css';
import f from '@/components/faks/faks.module.css';

/*
  Duž dužine 2l uspravno, tačka T na simetrali na rastojanju ρ. Iz T
  izlaze doprinosi 16 komada i njihov zbir; isprekidano je polje
  beskonačne prave. Graf desno: E/E_prave u zavisnosti od l, po
  logaritamskoj skali, za trenutno ρ.
*/

const W = 1000;
const H = 560;
const PX_PO_CM = 15;
const O = { x: 120, y: 280 };
const GRAF: Okvir = { x: 690, y: 50, w: 280, h: 380 };
const q = 10e-9;
const PX_PO_V = 0.12;
const NAJDUZA = 260;
const KOMADA = 16;
const LOG_MAX = 3;

export default function Simulacija() {
  const [polozaj, postaviPolozaj] = useState(0.2);
  const [rhoCm, postaviRho] = useState(10);
  const id = `d${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const lCm = 10 ** (LOG_MAX * polozaj);
  const l = lCm / 100;
  const rho = rhoCm / 100;

  const E = duzPolje(q, l, rho, 0).rho;
  const Eprava = pravaPolje(q, rho);
  const Etacka = (K * 2 * l * q) / (rho * rho);
  const odnos = E / Eprava;
  const { komadi } = duzKomadi(q, l, rho, 0, KOMADA);

  const T = { x: O.x + rhoCm * PX_PO_CM, y: O.y };
  const duzinaStrelice = (v: number) => Math.min(NAJDUZA, v * PX_PO_V);
  const pola = lCm * PX_PO_CM;

  const xr: Raspon = [0, LOG_MAX];
  const yr: Raspon = [0, 1.1];
  const sk = skala(GRAF, xr, yr);

  return (
    <Laboratorija
      crtez={
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Duž od ${broj(2 * lCm, 0)} cm; polje na ${broj(rhoCm, 0)} cm je ${broj(odnos * 100, 1)} % polja beskonačne prave.`}>
          <defs>
            <clipPath id={id}>
              <rect x={20} y={20} width={600} height={H - 40} />
            </clipPath>
          </defs>
          <g clipPath={`url(#${id})`}>
            <line x1={O.x} y1={O.y - pola} x2={O.x} y2={O.y + pola} className={f.duz} />
            {komadi.map((k, i) => {
              const y = O.y - k.zp * 100 * PX_PO_CM;
              const dx = k.dE.rho * PX_PO_V * 2.5;
              const dy = -k.dE.z * PX_PO_V * 2.5;
              return (
                <g key={i}>
                  <circle cx={O.x} cy={y} r={5} className={s.plus} />
                  <line x1={T.x} y1={T.y} x2={T.x + dx} y2={T.y + dy} className={f.doprinos} />
                </g>
              );
            })}
          </g>
          <line x1={O.x} y1={O.y} x2={T.x} y2={T.y} className={s.isprekidana} />
          <text x={(O.x + T.x) / 2} y={O.y + 34} textAnchor="middle" className={`${s.tih} ${f.naCrtezu}`}>
            ρ = {broj(rhoCm, 0)} cm
          </text>
          {pola < 250 && (
            <text x={O.x + 14} y={O.y - pola + 8} className={`${s.tih} ${f.naCrtezu}`}>
              l = {broj(lCm, lCm < 10 ? 1 : 0)} cm
            </text>
          )}

          <line x1={T.x} y1={T.y + 26} x2={T.x + duzinaStrelice(Eprava)} y2={T.y + 26} className={f.kotaIsprekidana} />
          <text x={T.x + duzinaStrelice(Eprava)} y={T.y + 56} textAnchor="end" className={`${s.tih} ${f.naCrtezu}`}>
            prava
          </text>
          <Strelica x1={T.x} y1={T.y} x2={T.x + Math.max(10, duzinaStrelice(E))} y2={T.y} boja="polje" velicina={18} debljina={5} />
          <circle cx={T.x} cy={T.y} r={6} className={s.neutralno} />
          <text x={T.x} y={T.y - 18} textAnchor="middle" className={`${s.tekst} ${f.naCrtezu}`}>
            T
          </text>

          <Ose okvir={GRAF} xr={xr} yr={yr} xNatpis="log₁₀(l / cm)" yNatpis="E / E prave" xCilj={3}>
            <line x1={GRAF.x} y1={sk.y(1)} x2={GRAF.x + GRAF.w} y2={sk.y(1)} className={s.isprekidana} />
            <polyline points={kriva((lg) => 10 ** lg / Math.hypot(10 ** lg, rhoCm), sk, 0, LOG_MAX)} className={f.kriva} />
            <circle cx={sk.x(Math.log10(lCm))} cy={sk.y(odnos)} r={7} className={s.polje} />
          </Ose>
        </svg>
      }
      kontrole={
        <>
          <Klizac id="l" natpis="pola dužine l" vrijednost={polozaj} prikaz={`${broj(lCm, lCm < 10 ? 1 : 0)} cm`} min={0} max={1} korak={0.01} boja="naboj-plus" onPromjena={postaviPolozaj} />
          <Klizac id="rho" natpis="rastojanje ρ" vrijednost={rhoCm} prikaz={`${broj(rhoCm, 0)} cm`} min={2} max={24} korak={1} boja="text" onPromjena={postaviRho} />
        </>
      }
      ocitavanja={
        <Ocitavanja>
          <Ocitavanje natpis="Polje duži" vrijednost={broj(E, 0)} jedinica="V/m" pod="na simetrali" />
          <Ocitavanje natpis="Polje prave" vrijednost={broj(Eprava, 0)} jedinica="V/m" pod="q/(2πε₀ρ)" />
          <Ocitavanje natpis="Duž / prava" vrijednost={broj(odnos * 100, 1)} jedinica="%" pod="l/√(l² + ρ²)" />
          <Ocitavanje natpis="Kao tačka 2lq" vrijednost={broj(Etacka, 0)} jedinica="V/m" pod="važi za l ≪ ρ" />
        </Ocitavanja>
      }
      status={
        <StatusLinija
          sta={`Polje duži je ${broj(odnos * 100, 1)} % polja beskonačne prave.`}
          zasto={
            lCm > 10 * rhoCm
              ? 'Duž je mnogo duža od ρ: dalji komadi su daleko i koso, pa skoro ništa ne dodaju. Za tačku T duž je već prava.'
              : lCm < rhoCm / 5
                ? 'Duž je mnogo kraća od ρ: iz T izgleda kao tačka sa nabojem 2lq, a ne kao prava.'
                : 'Produži duž: polje raste, ali sve sporije, i staje na q/(2πε₀ρ).'
          }
        />
      }
    />
  );
}
