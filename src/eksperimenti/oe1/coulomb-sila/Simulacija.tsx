'use client';

import { useRef, useState } from 'react';
import { broj } from '@/lib/format';
import { K, duzina, sila, type Naboj } from '@/lib/fizika/elektrostatika';
import { Klizac, Ocitavanja, Ocitavanje, StatusLinija } from '@/components/instrument/Okvir';
import { Laboratorija } from '@/components/faks/Laboratorija';
import { Ose, kriva, skala, type Okvir, type Raspon } from '@/components/faks/Graf';
import { usePrevlacenje, type Tacka } from '@/components/faks/prevlacenje';
import { NabojTacka, Strelica } from '@/components/faks/svg';
import s from '@/components/faks/sema.module.css';
import f from '@/components/faks/faks.module.css';

/*
  Dva naboja koja se prevlače. Crtež je u centimetrima (20 px = 1 cm),
  račun u SI. Strelice sila su u istoj razmjeri za oba naboja, pa se
  vidi da su jednake; preko 240 px se skrate i to piše uz njih.
*/

const W = 1000;
const H = 800;
const PX_PO_CM = 20;
const POLJE = { x0: 30, y0: 30, x1: 970, y1: 500 };
const GRAF: Okvir = { x: 110, y: 590, w: 860, h: 150 };
/** Koliko piksela strelice je jedan mikronjutn. */
const PX_PO_UN = 24;
const NAJDUZA = 240;
const NAJMANJE_R_CM = 3;

const uSI = (p: Tacka, Q: number): Naboj => ({ Q: Q * 1e-9, x: p.x / PX_PO_CM / 100, y: p.y / PX_PO_CM / 100 });

export default function Simulacija() {
  const [polozaji, postaviPolozaje] = useState<Tacka[]>([
    { x: 360, y: 270 },
    { x: 640, y: 270 },
  ]);
  const [Q1, postaviQ1] = useState(4);
  const [Q2, postaviQ2] = useState(-2);
  const svg = useRef<SVGSVGElement>(null);

  const { tacka } = usePrevlacenje({
    svg,
    granice: POLJE,
    naPomak: (i, p) =>
      postaviPolozaje((stari) => {
        const drugi = stari[1 - i];
        /* Naboji se ne smiju preklopiti: sila bi bila beskonačna. */
        if (Math.hypot(p.x - drugi.x, p.y - drugi.y) < NAJMANJE_R_CM * PX_PO_CM) return stari;
        return stari.map((x, j) => (j === i ? p : x));
      }),
  });

  const n1 = uSI(polozaji[0], Q1);
  const n2 = uSI(polozaji[1], Q2);
  const F1 = sila(n2, n1);
  const F2 = sila(n1, n2);
  const iznos = duzina(F1) * 1e6;
  const R = Math.hypot(n2.x - n1.x, n2.y - n1.y);
  const Rcm = R * 100;
  const zbirF = Math.hypot(F1.x + F2.x, F1.y + F2.y) * 1e6;
  const odbijaju = Q1 * Q2 > 0;

  function strelicaSile(p: Tacka, F: { x: number; y: number }) {
    const d = duzina(F) * 1e6 * PX_PO_UN;
    const L = Math.min(d, NAJDUZA);
    const u = duzina(F) === 0 ? { x: 0, y: 0 } : { x: F.x / duzina(F), y: F.y / duzina(F) };
    return { x1: p.x + u.x * 22, y1: p.y + u.y * 22, x2: p.x + u.x * (22 + L), y2: p.y + u.y * (22 + L), skraceno: d > NAJDUZA };
  }
  const s1 = strelicaSile(polozaji[0], F1);
  const s2 = strelicaSile(polozaji[1], F2);

  /* Graf |F|(R) za ova dva naboja: gornja granica je četiri puta trenutna sila. */
  const Fod = (rcm: number) => ((K * Math.abs(n1.Q * n2.Q)) / (rcm / 100) ** 2) * 1e6;
  const xr: Raspon = [0, 50];
  const yr: Raspon = [0, Math.max(1, 4 * iznos)];
  const sk = skala(GRAF, xr, yr);
  const sredina = { x: (polozaji[0].x + polozaji[1].x) / 2, y: (polozaji[0].y + polozaji[1].y) / 2 };

  return (
    <Laboratorija
      crtez={
        <svg ref={svg} viewBox={`0 0 ${W} ${H}`} className={s.dodir} role="img" aria-label={`Dva naboja na rastojanju ${broj(Rcm, 1)} cm; sila na svaki je ${broj(iznos, 1)} µN.`}>
          <rect x={POLJE.x0 - 20} y={POLJE.y0 - 20} width={POLJE.x1 - POLJE.x0 + 40} height={POLJE.y1 - POLJE.y0 + 40} className={s.okvir} />
          <line x1={polozaji[0].x} y1={polozaji[0].y} x2={polozaji[1].x} y2={polozaji[1].y} className={s.isprekidana} />
          <text x={sredina.x} y={sredina.y + 44} textAnchor="middle" className={`${s.tih} ${f.naCrtezu}`}>
            R = {broj(Rcm, 1)} cm
          </text>

          {Q1 !== 0 && Q2 !== 0 && (
            <>
              <Strelica x1={s1.x1} y1={s1.y1} x2={s1.x2} y2={s1.y2} boja="sila" velicina={18} debljina={4} />
              <Strelica x1={s2.x1} y1={s2.y1} x2={s2.x2} y2={s2.y2} boja="sila" velicina={18} debljina={4} />
              <text x={(s1.x1 + s1.x2) / 2} y={(s1.y1 + s1.y2) / 2 - 22} textAnchor="middle" className={`${s.simbol} ${f.naCrtezu}`}>
                F₁{s1.skraceno ? ' (skraćeno)' : ''}
              </text>
              <text x={(s2.x1 + s2.x2) / 2} y={(s2.y1 + s2.y2) / 2 - 22} textAnchor="middle" className={`${s.simbol} ${f.naCrtezu}`}>
                F₂{s2.skraceno ? ' (skraćeno)' : ''}
              </text>
            </>
          )}

          <NabojTacka x={polozaji[0].x} y={polozaji[0].y} Q={Q1} natpis="Q₁" aria-label={`Naboj Q₁, ${broj(Q1, 0)} nC; prevuci ga ili pomjeri strelicama`} {...tacka(0, polozaji[0])} />
          <NabojTacka x={polozaji[1].x} y={polozaji[1].y} Q={Q2} natpis="Q₂" aria-label={`Naboj Q₂, ${broj(Q2, 0)} nC; prevuci ga ili pomjeri strelicama`} {...tacka(1, polozaji[1])} />

          <Ose okvir={GRAF} xr={xr} yr={yr} xNatpis="R / cm" yNatpis="|F| / µN" yCilj={3}>
            {Q1 !== 0 && Q2 !== 0 && (
              <>
                <polyline points={kriva((r) => Math.min(Fod(r), yr[1] * 1.05), sk, Math.max(1, Math.sqrt((K * Math.abs(n1.Q * n2.Q) * 1e6) / (yr[1] * 1.05)) * 100), 50)} className={f.kriva} />
                <circle cx={sk.x(Math.min(Rcm, 50))} cy={sk.y(Math.min(iznos, yr[1]))} r={7} className={s.neutralno} />
              </>
            )}
          </Ose>
        </svg>
      }
      kontrole={
        <>
          <Klizac id="q1" natpis="naboj Q₁" vrijednost={Q1} prikaz={`${broj(Q1, 0)} nC`} min={-10} max={10} korak={1} boja={Q1 >= 0 ? 'naboj-plus' : 'naboj-minus'} onPromjena={postaviQ1} />
          <Klizac id="q2" natpis="naboj Q₂" vrijednost={Q2} prikaz={`${broj(Q2, 0)} nC`} min={-10} max={10} korak={1} boja={Q2 >= 0 ? 'naboj-plus' : 'naboj-minus'} onPromjena={postaviQ2} />
          <p className={f.uputa}>Prevuci naboje po crtežu, ili ih izaberi tabom i pomjeraj strelicama.</p>
        </>
      }
      ocitavanja={
        <Ocitavanja>
          <Ocitavanje natpis="Rastojanje R" vrijednost={broj(Rcm, 1)} jedinica="cm" />
          <Ocitavanje natpis="|F₁| = |F₂|" vrijednost={broj(iznos, 1)} jedinica="µN" pod="K·|Q₁Q₂|/R²" />
          <Ocitavanje natpis="|F₁ + F₂|" vrijednost={broj(zbirF, 1)} jedinica="µN" pod="uvijek nula" />
          <Ocitavanje natpis="Sila puta R²" vrijednost={broj(iznos * Rcm * Rcm, 0)} jedinica="µN·cm²" pod="ne zavisi od R" />
        </Ocitavanja>
      }
      status={
        <StatusLinija
          sta={
            Q1 === 0 || Q2 === 0
              ? 'Jedan naboj je nula, pa sile nema.'
              : `Naboji se ${odbijaju ? 'odbijaju' : 'privlače'} silom od ${broj(iznos, 1)} µN.`
          }
          zasto={
            Q1 === 0 || Q2 === 0
              ? 'Sila je srazmjerna proizvodu Q₁Q₂.'
              : 'Sila na Q₁ i sila na Q₂ su jednake po iznosu i suprotne po smjeru, bez obzira na to koji je naboj veći. Dvostruko rastojanje daje četiri puta manju silu.'
          }
        />
      }
    />
  );
}
