'use client';

import { useMemo, useRef, useState } from 'react';
import { broj } from '@/lib/format';
import { duzina, linijePolja, polje, poljeOd, type Naboj } from '@/lib/fizika/elektrostatika';
import { Klizac, Ocitavanja, Ocitavanje, StatusLinija, Taster } from '@/components/instrument/Okvir';
import { Laboratorija, RedDugmadi } from '@/components/faks/Laboratorija';
import { usePrevlacenje, type Tacka } from '@/components/faks/prevlacenje';
import { NabojTacka, Strelica } from '@/components/faks/svg';
import s from '@/components/faks/sema.module.css';
import f from '@/components/faks/faks.module.css';

/*
  Do četiri naboja i tačka T koja se prevlače. U T se crta ukupno polje
  (puna strelica) i doprinos svakog naboja (isprekidano, sa indeksom).
  Linije polja se računaju iz istog polja kojim se mjeri u T.
*/

const W = 1000;
const H = 560;
const PX_PO_CM = 20;
const POLJE = { x0: 30, y0: 30, x1: 970, y1: 530 };
/** Piksela strelice po kV/m. */
const PX_PO_KV = 10;
const NAJDUZA = 230;
const INDEKS = ['₁', '₂', '₃', '₄'];

type Stavka = Tacka & { Q: number };

const PRIMJERI: { id: string; natpis: string; naboji: Stavka[]; T: Tacka }[] = [
  {
    id: 'dipol',
    natpis: '+Q i −Q',
    naboji: [
      { x: 340, y: 280, Q: 5 },
      { x: 660, y: 280, Q: -5 },
    ],
    T: { x: 500, y: 280 },
  },
  {
    id: 'isti',
    natpis: '+Q i +Q',
    naboji: [
      { x: 340, y: 280, Q: 5 },
      { x: 660, y: 280, Q: 5 },
    ],
    T: { x: 500, y: 280 },
  },
  {
    id: 'cetiri',
    natpis: 'Četiri naboja',
    naboji: [
      { x: 300, y: 160, Q: 4 },
      { x: 700, y: 160, Q: -3 },
      { x: 300, y: 400, Q: -2 },
      { x: 700, y: 400, Q: 5 },
    ],
    T: { x: 520, y: 300 },
  },
];

const uSI = (p: Tacka) => ({ x: p.x / PX_PO_CM / 100, y: p.y / PX_PO_CM / 100 });
const uPx = (p: Tacka) => ({ x: p.x * 100 * PX_PO_CM, y: p.y * 100 * PX_PO_CM });

function strelica(T: Tacka, E: Tacka) {
  const d = (duzina(E) / 1000) * PX_PO_KV;
  const L = Math.min(d, NAJDUZA);
  const u = duzina(E) === 0 ? { x: 0, y: 0 } : { x: E.x / duzina(E), y: E.y / duzina(E) };
  return { x1: T.x, y1: T.y, x2: T.x + u.x * L, y2: T.y + u.y * L, skraceno: d > NAJDUZA, L };
}

export default function Simulacija() {
  const [naboji, postaviNaboje] = useState<Stavka[]>(PRIMJERI[0].naboji);
  const [T, postaviT] = useState<Tacka>(PRIMJERI[0].T);
  const [doprinosi, postaviDoprinose] = useState(true);
  const svg = useRef<SVGSVGElement>(null);

  const { tacka } = usePrevlacenje({
    svg,
    granice: POLJE,
    naPomak: (i, p) => {
      if (i === 99) postaviT(p);
      else postaviNaboje((n) => n.map((x, j) => (j === i ? { ...x, ...p } : x)));
    },
  });

  const siNaboji: Naboj[] = naboji.map((n) => ({ Q: n.Q * 1e-9, ...uSI(n) }));
  const ET = polje(siNaboji, uSI(T));
  const ukupno = strelica(T, ET);

  const linije = useMemo(() => {
    const si: Naboj[] = naboji.map((n) => ({ Q: n.Q * 1e-9, ...uSI(n) }));
    return linijePolja(si, {
      poJedinici: 3,
      jedinica: 1e-9,
      poluprecnik: 0.009,
      korak: 0.0025,
      granice: { x0: 0, y0: 0, x1: W / PX_PO_CM / 100, y1: H / PX_PO_CM / 100 },
      maxKoraka: 700,
    }).map((l) => l.map(uPx).map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' '));
  }, [naboji]);

  function dodaj() {
    if (naboji.length >= 4) return;
    const mjesta = [
      { x: 200, y: 120 },
      { x: 800, y: 120 },
      { x: 200, y: 440 },
      { x: 800, y: 440 },
    ];
    const slobodno = mjesta.find((m) => naboji.every((n) => Math.hypot(n.x - m.x, n.y - m.y) > 60)) ?? mjesta[0];
    postaviNaboje([...naboji, { ...slobodno, Q: naboji.length % 2 === 0 ? 3 : -3 }]);
  }

  const Ekv = duzina(ET) / 1000;
  /* Na ekranu y raste naniže, a u očitavanjima naviše, kao u matematici. */
  const Ex = ET.x / 1000;
  const Ey = -ET.y / 1000;
  const blizuNule = Ekv < 0.05;

  return (
    <Laboratorija
      crtez={
        <svg ref={svg} viewBox={`0 0 ${W} ${H}`} className={s.dodir} role="img" aria-label={`${naboji.length} naboja; polje u tački T je ${broj(Ekv, 2)} kV/m.`}>
          <rect x={10} y={10} width={W - 20} height={H - 20} className={s.okvir} />
          {linije.map((l, i) => (
            <polyline key={i} points={l} className={s.linijaPolja} />
          ))}

          {doprinosi &&
            naboji.map((n, i) => {
              const Ek = poljeOd({ Q: n.Q * 1e-9, ...uSI(n) }, uSI(T));
              const a = strelica(T, Ek);
              if (a.L < 6) return null;
              return (
                <g key={i}>
                  <line x1={a.x1} y1={a.y1} x2={a.x2} y2={a.y2} className={f.doprinos} />
                  <text x={a.x2 + 6} y={a.y2 + 6} className={`${s.tih} ${f.naCrtezu}`}>
                    E{INDEKS[i]}
                  </text>
                </g>
              );
            })}

          {!blizuNule && (
            <>
              {/* Komponente: projekcije ukupnog polja na ose. */}
              <line x1={ukupno.x1} y1={ukupno.y1} x2={ukupno.x2} y2={ukupno.y1} className={f.komponenta} />
              <line x1={ukupno.x2} y1={ukupno.y1} x2={ukupno.x2} y2={ukupno.y2} className={f.komponenta} />
              <Strelica x1={ukupno.x1} y1={ukupno.y1} x2={ukupno.x2} y2={ukupno.y2} boja="polje" velicina={20} debljina={5} />
              <text x={ukupno.x2 + 10} y={ukupno.y2 - 12} className={`${s.simbol} ${s.polje} ${f.naCrtezu}`}>
                E{ukupno.skraceno ? ' (skraćeno)' : ''}
              </text>
            </>
          )}

          {naboji.map((n, i) => (
            <NabojTacka
              key={i}
              x={n.x}
              y={n.y}
              Q={n.Q}
              natpis={`Q${INDEKS[i]}`}
              aria-label={`Naboj Q${INDEKS[i]}, ${broj(n.Q, 0)} nC; prevuci ga ili pomjeri strelicama`}
              {...tacka(i, n)}
            />
          ))}

          <g transform={`translate(${T.x} ${T.y})`} className={s.rucka} aria-label="Tačka T; prevuci je ili pomjeri strelicama" {...tacka(99, T)}>
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
          <RedDugmadi opis="Primjeri">
            {PRIMJERI.map((p) => (
              <Taster
                key={p.id}
                onClick={() => {
                  postaviNaboje(p.naboji);
                  postaviT(p.T);
                }}
              >
                {p.natpis}
              </Taster>
            ))}
          </RedDugmadi>
          {naboji.map((n, i) => (
            <Klizac
              key={i}
              id={`q${i}`}
              natpis={`naboj Q${INDEKS[i]}`}
              vrijednost={n.Q}
              prikaz={`${broj(n.Q, 0)} nC`}
              min={-5}
              max={5}
              korak={1}
              boja={n.Q >= 0 ? 'naboj-plus' : 'naboj-minus'}
              onPromjena={(Q) => postaviNaboje(naboji.map((x, j) => (j === i ? { ...x, Q } : x)))}
            />
          ))}
          <RedDugmadi opis="Naboji">
            <Taster disabled={naboji.length >= 4} onClick={dodaj}>
              Dodaj naboj
            </Taster>
            <Taster disabled={naboji.length <= 1} onClick={() => postaviNaboje(naboji.slice(0, -1))}>
              Ukloni zadnji
            </Taster>
            <Taster pritisnut={doprinosi} onClick={() => postaviDoprinose(!doprinosi)}>
              Doprinosi
            </Taster>
          </RedDugmadi>
        </>
      }
      ocitavanja={
        <Ocitavanja>
          <Ocitavanje natpis="|E| u tački T" vrijednost={broj(Ekv, 2)} jedinica="kV/m" />
          <Ocitavanje natpis="Naboja" vrijednost={String(naboji.length)} jedinica="" pod="najviše 4" />
          <Ocitavanje natpis={<>E<sub>x</sub></>} vrijednost={broj(Ex, 2)} jedinica="kV/m" pod="udesno +" />
          <Ocitavanje natpis={<>E<sub>y</sub></>} vrijednost={broj(Ey, 2)} jedinica="kV/m" pod="naviše +" />
        </Ocitavanja>
      }
      status={
        <StatusLinija
          sta={blizuNule ? 'Polje u tački T je skoro nula.' : `Ukupno polje u T je ${broj(Ekv, 2)} kV/m.`}
          zasto={
            blizuNule
              ? 'Doprinosi naboja su ovdje jednaki po iznosu i suprotni po smjeru, pa se poništavaju.'
              : 'Ukupno polje je vektorski zbir doprinosa svakog naboja: strelice se sabiraju, ne njihove dužine.'
          }
        />
      }
    />
  );
}
