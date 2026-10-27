'use client';

import { useEffect, useRef, useState } from 'react';
import { broj } from '@/lib/format';
import { useAnimacija } from '@/lib/animacija';
import type { Poruka } from '@/lib/h-most';
import {
  korakServa,
  PERIOD_MS,
  POCETNO_SERVO,
  pogon,
  S,
  sirinaImpulsa,
  strujaServa,
  STRUJA_ZASTOJA,
  ugaoB,
  zelje,
  type StanjeServa,
} from '@/lib/servo';
import {
  Klizac,
  Napomena,
  Ocitavanja,
  Ocitavanje,
  Okvir,
  PanelKontrola,
  Rezimi,
  StatusLinija,
} from '@/components/instrument/Okvir';
import { Oscilloskop, Snimak, type Kanal, type Uzorak } from '@/components/instrument/Oscilloskop';
import stil from './sema.module.css';
import sv from './servo.module.css';

/** Napon impulsa servo signala, V (logika od 5 V). */
const NAPON_IMPULSA = 5;
/** Okidanje: impuls počinje 1 ms poslije lijeve ivice ekrana. */
const PRIJE_IMPULSA = 1;

const KANALI: readonly Kanal[] = [
  { boja: 'ch1', natpis: 'CH1 impuls za A, 2 V/pod.', skala: 2, stepenasto: true, nula: 1 },
  { boja: 'odluci', natpis: 'CH2 impuls za B, 2 V/pod.', skala: 2, stepenasto: true, nula: -3 },
];

const REZIMI = [
  { id: 'ispravno', natpis: 'B = 180° − A' },
  { id: 'greska', natpis: 'Greška: B = A' },
] as const;

/** Jedna perioda oba signala, kao na ekranu okinutog osciloskopa. */
function uzorciImpulsa(a: number, b: number): Uzorak[] {
  const wa = sirinaImpulsa(a);
  const wb = sirinaImpulsa(b);
  const ivice = [0, PRIJE_IMPULSA, PRIJE_IMPULSA + wa, PRIJE_IMPULSA + wb, PERIOD_MS].sort((x, y) => x - y);
  const nivo = (t: number, w: number) => (t >= PRIJE_IMPULSA && t < PRIJE_IMPULSA + w ? NAPON_IMPULSA : 0);
  return ivice.map((t) => ({ t, v: [nivo(t, wa), nivo(t, wb)], greska: false }));
}

function porukaZa(st: StanjeServa): Poruka {
  const b = ugaoB(st);
  const I = strujaServa(pogon(st).a);
  const borba = st.greska && Math.abs(zelje(st).a - zelje(st).b) >= 1;
  if (!st.greska) {
    return {
      sta: `B dobija 180° − ${Math.round(st.ugaoA)}° = ${Math.round(b)}°, pa oba servoa guraju osovinu na istu stranu.`,
      zasto: `Servo B je okrenut, pa su njegovih ${Math.round(b)}° isto mjesto kao ${Math.round(st.ugaoA)}° servoa A.`,
    };
  }
  if (!borba) {
    return {
      sta: 'Na 90° se isti ugao slučajno poklapa, pa nema borbe.',
      zasto: 'Pomjeri klizač: čim A nije 90°, servoi počnu da guraju jedan protiv drugog.',
    };
  }
  if (st.temperatura > S.granica) {
    return {
      sta: `Servoi guraju jedan protiv drugog punom snagom i zagrijali su se na ${Math.round(st.temperatura)} °C!`,
      zasto: 'Ovako servoi pregore; rješenje je da B dobije 180° − A.',
      greska: true,
    };
  }
  return {
    sta: `Oba servoa dobijaju ${Math.round(st.ugaoA)}°, pa svaki gura osovinu na svoju stranu i osovina stoji.`,
    zasto: `Svaki vuče ${broj(I, 2)} A dok gura, a sva ta snaga odlazi u toplotu.`,
  };
}

export function Servo() {
  const stanje = useRef<StanjeServa>(POCETNO_SERVO);
  const [st, postavi] = useState<StanjeServa>(POCETNO_SERVO);
  const [snimak] = useState(() => new Snimak(PERIOD_MS));
  const kadar = useRef(0);
  const rukaRef = useRef<SVGGElement | null>(null);

  function promijeni(novo: (s: StanjeServa) => StanjeServa) {
    stanje.current = novo(stanje.current);
    postavi(stanje.current);
  }

  useAnimacija((dt) => {
    let s = stanje.current;
    /* Četiri manja koraka: regulator je krut, a kadar zna potrajati. */
    for (let i = 0; i < 4; i++) s = korakServa(s, dt / 4);
    stanje.current = s;
    rukaRef.current?.setAttribute('transform', `rotate(${-s.osovina} ${CX} ${CY})`);
    if (++kadar.current % 5 === 0) postavi(s);
  });

  const b = ugaoB(st);
  useEffect(() => {
    snimak.zamijeni(uzorciImpulsa(st.ugaoA, b), PERIOD_MS);
  }, [snimak, st.ugaoA, b]);

  useEffect(() => {
    const naTaster = (e: KeyboardEvent) => {
      const cilj = e.target as HTMLElement | null;
      if (cilj?.tagName === 'INPUT' || e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key.toLowerCase();
      if (k === 'arrowright' || k === 'arrowup') promijeni((s) => ({ ...s, ugaoA: Math.min(180, s.ugaoA + 5) }));
      else if (k === 'arrowleft' || k === 'arrowdown') promijeni((s) => ({ ...s, ugaoA: Math.max(0, s.ugaoA - 5) }));
      else if (k === 'm') promijeni((s) => ({ ...s, greska: !s.greska }));
      else if (k === 'r') promijeni(() => POCETNO_SERVO);
      else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', naTaster);
    return () => window.removeEventListener('keydown', naTaster);
  }, []);

  const poruka = porukaZa(st);
  const u = pogon(st);
  const I = Math.max(strujaServa(u.a), strujaServa(u.b));
  const z = zelje(st);
  const borba = st.greska && Math.abs(z.a - z.b) >= 1;
  const vruce = st.temperatura > S.granica;

  return (
    <Okvir
      nazad={{ naziv: 'Perjanik', putanja: '/sajam/perjanik' }}
      naslov="Dvostruki servo"
      uvod="Dva servoa okreću jednu osovinu ramena, okrenuti jedan prema drugom."
      rezimi={
        <Rezimi
          opis="Koji ugao dobija servo B"
          opcije={REZIMI}
          izabran={st.greska ? 'greska' : 'ispravno'}
          onIzbor={(id) => promijeni((s) => ({ ...s, greska: id === 'greska' }))}
        />
      }
      onResetuj={() => promijeni(() => POCETNO_SERVO)}
      status={<StatusLinija sta={poruka.sta} zasto={poruka.zasto} greska={poruka.greska} />}
      osciloskop={
        <Oscilloskop
          kanali={KANALI}
          snimak={snimak}
          desno={`${PERIOD_MS} ms na ekranu, 2 ms/pod.: jedan impuls u periodi`}
          opis="Osciloskop: impulsi za servo A i servo B"
        />
      }
      sema={
        <svg viewBox="0 0 960 470" role="img" aria-label="Dva servoa na zajedničkoj osovini i ugao ruke">
          {/* pogled odozgo */}
          <text x={40} y={60} className={stil.tekst}>
            pogled odozgo
          </text>
          <rect x={40} y={110} width={140} height={100} rx={4} className={borba ? sv.servoBorba : stil.blok} />
          <text x={110} y={166} textAnchor="middle" className={sv.imeA}>
            A
          </text>
          <rect x={300} y={110} width={140} height={100} rx={4} className={borba ? sv.servoBorba : stil.blok} />
          <text x={370} y={166} textAnchor="middle" className={sv.imeB}>
            B
          </text>
          <line x1={180} y1={160} x2={300} y2={160} className={sv.osovina} />
          <line x1={240} y1={130} x2={240} y2={190} className={sv.ruka} />
          <text x={240} y={244} textAnchor="middle" className={stil.tih}>
            zajednička osovina
          </text>
          <text x={240} y={266} textAnchor="middle" className={stil.tih}>
            servoi okrenuti jedan prema drugom
          </text>

          {/* pogled duž osovine: uglomjer sa dvije skale */}
          <text x={CX - R_A} y={60} className={stil.tekst}>
            pogled duž osovine
          </text>
          <path d={`M${CX - R_A},${CY} A${R_A},${R_A} 0 0 1 ${CX + R_A},${CY}`} className={sv.skala} />
          <path d={`M${CX - R_B},${CY} A${R_B},${R_B} 0 0 1 ${CX + R_B},${CY}`} className={sv.skala} />
          <line x1={CX - R_A - 10} y1={CY} x2={CX + R_A + 10} y2={CY} className={stil.zicaTanka} />
          {[0, 45, 90, 135, 180].map((ug) => {
            const rad = (ug * Math.PI) / 180;
            const c = Math.cos(rad);
            const s = Math.sin(rad);
            return (
              <g key={ug}>
                <line x1={CX + (R_A - 8) * c} y1={CY - (R_A - 8) * s} x2={CX + (R_A + 8) * c} y2={CY - (R_A + 8) * s} className={stil.zicaTanka} />
                <text x={CX + (R_A + 28) * c} y={CY - (R_A + 28) * s + 5} textAnchor="middle" className={sv.skalaA}>
                  {ug}°
                </text>
                <line x1={CX + (R_B - 8) * c} y1={CY - (R_B - 8) * s} x2={CX + (R_B + 8) * c} y2={CY - (R_B + 8) * s} className={stil.zicaTanka} />
                <text x={CX + (R_B - 30) * c} y={CY - (R_B - 30) * s + 5} textAnchor="middle" className={sv.skalaB}>
                  {180 - ug}°
                </text>
              </g>
            );
          })}
          <text x={CX + R_A + 30} y={CY + 30} textAnchor="end" className={sv.skalaA}>
            skala A
          </text>
          <text x={CX + R_B - 20} y={CY + 30} textAnchor="end" className={sv.skalaB}>
            skala B
          </text>

          {/* gdje koji servo hoće osovinu */}
          <Zelja ugao={z.a} r={R_A - 14} klasa={sv.zeljaA} />
          <Zelja ugao={z.b} r={R_B - 14} klasa={sv.zeljaB} />

          {/* ruka: ugao zadaje fizika */}
          <g ref={rukaRef}>
            <line x1={CX} y1={CY} x2={CX + R_RUKE} y2={CY} className={borba ? sv.rukaBorba : sv.ruka} />
          </g>
          <circle cx={CX} cy={CY} r={10} className={sv.glavcina} />
        </svg>
      }
      strana={
        <>
          <Ocitavanja>
            <Ocitavanje natpis="Ugao osovine" vrijednost={broj(st.osovina, 0)} jedinica="°" pod={borba ? 'stoji, niko ne pobjeđuje' : ''} />
            <Ocitavanje
              natpis="Struja po servou"
              vrijednost={broj(I, 2)}
              jedinica="A"
              pod={I > 0.9 * STRUJA_ZASTOJA ? 'struja zastoja' : 'samo drži položaj'}
              vruce={borba && I > 0.9 * STRUJA_ZASTOJA}
            />
            <Ocitavanje natpis="Temperatura servoa" vrijednost={broj(st.temperatura, 0)} jedinica="°C" pod={vruce ? 'pregrijava se' : ''} vruce={vruce} />
            <Ocitavanje
              natpis="Impuls A i B"
              vrijednost={`${broj(sirinaImpulsa(st.ugaoA), 2)} i ${broj(sirinaImpulsa(b), 2)}`}
              jedinica="ms"
              pod="0° je 1 ms, 180° je 2 ms"
            />
          </Ocitavanja>

          <PanelKontrola>
            <Klizac
              id="ugao-a"
              natpis="Ugao za servo A"
              vrijednost={st.ugaoA}
              prikaz={`${Math.round(st.ugaoA)}°, B dobija ${Math.round(b)}°`}
              min={0}
              max={180}
              boja="ch1"
              onPromjena={(v) => promijeni((s) => ({ ...s, ugaoA: v }))}
            />
          </PanelKontrola>

          <Napomena>
            Struja i temperatura su iz ilustrativnog modela, a zagrijavanje je ubrzano; koji servo pokreće rame još nije potvrđeno.
          </Napomena>
        </>
      }
    />
  );
}

/* ------------------------------------------------ geometrija uglomjera */

const CX = 700;
const CY = 390;
const R_A = 210;
const R_B = 150;
const R_RUKE = 190;

function Zelja({ ugao, r, klasa }: { ugao: number; r: number; klasa: string }) {
  const rad = (ugao * Math.PI) / 180;
  return <line x1={CX} y1={CY} x2={CX + r * Math.cos(rad)} y2={CY - r * Math.sin(rad)} className={klasa} />;
}
