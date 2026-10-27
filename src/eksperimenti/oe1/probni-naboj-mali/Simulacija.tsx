'use client';

import { useMemo, useRef, useState } from 'react';
import { useAnimacija } from '@/lib/animacija';
import { broj } from '@/lib/format';
import { izmjeri, jednoliko, opusti, poljeProvodnika, type Provodnik } from '@/lib/fizika/probni';
import { Klizac, Ocitavanja, Ocitavanje, StatusLinija } from '@/components/instrument/Okvir';
import { Laboratorija } from '@/components/faks/Laboratorija';
import { Ose, skala, type Okvir, type Raspon } from '@/components/faks/Graf';
import { NabojTacka, Strelica } from '@/components/faks/svg';
import s from '@/components/faks/sema.module.css';
import f from '@/components/faks/faks.module.css';

/*
  Nabijena kugla (u presjeku krug) sa 24 slobodna naboja i probni naboj
  δQ pored nje. Naboji se kadar po kadar primiču ravnoteži uz probni
  naboj; prazni kružići su raspored bez njega. Graf desno je odstupanje
  izmjerenog F/δQ od pravog polja, za svaki δQ.
*/

const W = 1000;
const H = 560;
const PX_PO_CM = 20;
const CENTAR = { x: 170, y: 280 };
const R0_CM = 5;
const Q_NC = 20;
const N = 24;
const P: Provodnik = { cx: 0, cy: 0, R0: R0_CM / 100, Q: Q_NC * 1e-9, N };
const GRAF: Okvir = { x: 700, y: 50, w: 270, h: 380 };
const LOG_MIN = -3;
const LOG_MAX = Math.log10(20);
const PX_PO_KV = 3;

const dQZa = (p: number) => 10 ** (LOG_MIN + (LOG_MAX - LOG_MIN) * p);
const uPx = (x: number, y: number) => ({ x: CENTAR.x + x * 100 * PX_PO_CM, y: CENTAR.y + y * 100 * PX_PO_CM });

export default function Simulacija() {
  const [polozaj, postaviPolozaj] = useState(0.35);
  const [dCm, postaviD] = useState(9);
  const dQ = dQZa(polozaj);
  const T = { x: dCm / 100, y: 0 };

  const uglovi = useRef(jednoliko(P));
  const tacke = useRef<(SVGGElement | null)[]>([]);
  const kadar = useRef(0);
  const [izmjereno, postaviIzmjereno] = useState(() => poljeProvodnika(P, jednoliko(P), T).x);

  const pravo = poljeProvodnika(P, jednoliko(P), T).x;

  useAnimacija(() => {
    uglovi.current = opusti(P, uglovi.current, { Q: dQ * 1e-9, x: T.x, y: T.y }, 3);
    uglovi.current.forEach((u, i) => {
      const p = uPx(P.R0 * Math.cos(u), P.R0 * Math.sin(u));
      tacke.current[i]?.setAttribute('transform', `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})`);
    });
    kadar.current++;
    if (kadar.current % 5 === 0) postaviIzmjereno(poljeProvodnika(P, uglovi.current, T).x);
  });

  /* Kriva odstupanja za trenutno rastojanje: ravnoteža za 14 vrijednosti δQ. */
  const kriva = useMemo(() => {
    const T0 = { x: dCm / 100, y: 0 };
    const E0 = poljeProvodnika(P, jednoliko(P), T0).x;
    const tacke: { lg: number; posto: number }[] = [];
    for (let k = 0; k <= 13; k++) {
      const lg = LOG_MIN + ((LOG_MAX - LOG_MIN) * k) / 13;
      const { E } = izmjeri(P, T0, 10 ** lg * 1e-9, 300);
      tacke.push({ lg, posto: (1 - E.x / E0) * 100 });
    }
    return tacke;
  }, [dCm]);

  const odstupanje = (1 - izmjereno / pravo) * 100;
  const yMax = Math.max(5, ...kriva.map((t) => t.posto)) * 1.1;
  const xr: Raspon = [LOG_MIN, LOG_MAX];
  const yr: Raspon = [0, yMax];
  const sk = skala(GRAF, xr, yr);

  const Tpx = uPx(T.x, T.y);
  const Lpravo = (pravo / 1000) * PX_PO_KV;
  const Lizm = (izmjereno / 1000) * PX_PO_KV;
  const pocetni = jednoliko(P);

  return (
    <Laboratorija
      crtez={
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Probni naboj ${broj(dQ, 3)} nC na ${broj(dCm, 0)} cm od centra kugle; izmjereno polje odstupa ${broj(odstupanje, 1)} %.`}>
          <circle cx={CENTAR.x} cy={CENTAR.y} r={R0_CM * PX_PO_CM} className={f.provodnik} />
          {pocetni.map((u, i) => {
            const p = uPx(P.R0 * Math.cos(u), P.R0 * Math.sin(u));
            return <circle key={`p${i}`} cx={p.x} cy={p.y} r={7} className={f.duh} />;
          })}
          {pocetni.map((u, i) => {
            const p = uPx(P.R0 * Math.cos(u), P.R0 * Math.sin(u));
            return (
              <g
                key={i}
                ref={(el) => {
                  tacke.current[i] = el;
                }}
                transform={`translate(${p.x} ${p.y})`}
                className={s.plus}
              >
                <circle r={6} className={f.nosilac} />
              </g>
            );
          })}
          <text x={CENTAR.x} y={CENTAR.y + R0_CM * PX_PO_CM + 46} textAnchor="middle" className={s.tih}>
            kugla, {broj(Q_NC, 0)} nC
          </text>

          {/* Pravo polje (isprekidano) i izmjereno F/δQ (puno), u istoj razmjeri. */}
          <line x1={Tpx.x} y1={Tpx.y + 28} x2={Tpx.x + Lpravo} y2={Tpx.y + 28} className={f.doprinos} />
          <text x={Tpx.x + Lpravo + 8} y={Tpx.y + 36} className={`${s.tih} ${f.naCrtezu}`}>
            pravo E
          </text>
          <Strelica x1={Tpx.x} y1={Tpx.y} x2={Tpx.x + Math.max(8, Lizm)} y2={Tpx.y} boja="polje" velicina={18} debljina={5} />
          <text x={Tpx.x + Lizm + 10} y={Tpx.y - 10} className={`${s.tih} ${f.naCrtezu}`}>
            F/δQ
          </text>
          <NabojTacka x={Tpx.x} y={Tpx.y} Q={1} r={6 + 10 * polozaj} natpis="δQ" />

          <Ose okvir={GRAF} xr={xr} yr={yr} xNatpis="log₁₀(δQ / nC)" yNatpis="odstupanje / %" xCilj={4} naNuli={false}>
            <polyline points={kriva.map((t) => `${sk.x(t.lg).toFixed(1)},${sk.y(t.posto).toFixed(1)}`).join(' ')} className={f.krivaStruje} />
            <circle cx={sk.x(Math.log10(dQ))} cy={sk.y(Math.min(yMax, Math.max(0, odstupanje)))} r={7} className={s.neutralno} />
          </Ose>
        </svg>
      }
      kontrole={
        <>
          <Klizac id="dq" natpis="probni naboj δQ" vrijednost={polozaj} prikaz={`${broj(dQ, dQ < 0.01 ? 3 : dQ < 1 ? 2 : 1)} nC`} min={0} max={1} korak={0.01} boja="naboj-plus" onPromjena={postaviPolozaj} />
          <Klizac id="d" natpis="rastojanje od centra kugle" vrijednost={dCm} prikaz={`${broj(dCm, 0)} cm`} min={7} max={18} korak={1} boja="text" onPromjena={postaviD} />
        </>
      }
      ocitavanja={
        <Ocitavanja>
          <Ocitavanje natpis="Pravo polje u T" vrijednost={broj(pravo / 1000, 2)} jedinica="kV/m" pod="bez probnog naboja" />
          <Ocitavanje natpis="Izmjereno F/δQ" vrijednost={broj(izmjereno / 1000, 2)} jedinica="kV/m" pod="sa probnim nabojem" />
          <Ocitavanje natpis="Odstupanje" vrijednost={broj(Math.max(0, odstupanje), 2)} jedinica="%" pod="izmjereno ispod pravog" />
          <Ocitavanje natpis="δQ / Q kugle" vrijednost={broj((dQ / Q_NC) * 100, dQ / Q_NC < 0.01 ? 3 : 1)} jedinica="%" />
        </Ocitavanja>
      }
      status={
        <StatusLinija
          sta={
            odstupanje < 0.5
              ? `Izmjereno F/δQ se slaže sa pravim poljem na ${broj(Math.max(0, odstupanje), 2)} %.`
              : `Izmjereno F/δQ je ${broj(odstupanje, 1)} % manje od pravog polja.`
          }
          zasto={
            odstupanje < 0.5
              ? 'Probni naboj je toliko mali da naboje na kugli skoro ne pomjera: mjeri polje kakvo je bilo bez njega.'
              : 'Probni naboj odgurne naboje na kugli od sebe, pa mjeri polje rasporeda koji je sam pokvario. Smanji δQ.'
          }
        />
      }
    />
  );
}
