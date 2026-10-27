'use client';

import { useEffect, useRef, useState } from 'react';
import { broj } from '@/lib/format';
import { useAnimacija } from '@/lib/animacija';
import { GEOMETRIJA, PRAG_VISI, rijesi, stepeni, type Poluga, type Suspenzija as Rjesenje } from '@/lib/suspenzija';
import type { Poruka } from '@/lib/h-most';
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
import stil from './sema.module.css';
import sus from './suspenzija.module.css';

/* ------------------------------------------------ geometrija crteža */

const OSOVINA = 330;
/** Tlo lijeve strane (sa kamenom) i desne strane, svaka u svom bočnom pogledu. */
const TLO_L = 236;
const TLO_D = 470;
const R = GEOMETRIJA.rTocka;
const KAMEN_MIN = OSOVINA - 280;
const KAMEN_MAX = OSOVINA + 280;
const POCETNI_KAMEN = OSOVINA + 118;
const X_TLA = [24, 700] as const;

/* Tijelo i diferencijal, desno od dva pogleda. */
const TIJELO = { x: 838, y: 150, pola: 92, visina: 44 };
const DIFERENCIJAL = { x: 838, y: 390 };

/** Podignutost u jedinicama crteža → y u SVG-u (y raste naniže). */
const yOd = (tlo: number, podignutost: number) => tlo - R - podignutost;

const REZIMI = [
  { id: 'diferencijal', natpis: 'Sa diferencijalom' },
  { id: 'kruto', natpis: 'Bez suspenzije' },
] as const;

const ugao = (rad: number) => `${broj(stepeni(rad), 1)}°`;

function porukaZa(r: Rjesenje, kruto: boolean): Poruka {
  const naTlu = r.tockovi.filter((t) => t.zazor <= PRAG_VISI).length;
  const nagnuta = Math.abs(stepeni(r.lijeva.ugao)) > 0.2;
  if (kruto) {
    if (naTlu < 4) {
      return {
        sta: 'Bez suspenzije tijelo je kruto: jedan točak desne strane visi u vazduhu.',
        zasto: 'Taj točak nema oslonac, pa se vrti u prazno i ne gura rover.',
      };
    }
    return {
      sta: 'Bez suspenzije, na ravnom, sva četiri točka su na tlu.',
      zasto: 'Provuci kamen ispod lijevog točka i gledaj desnu stranu.',
    };
  }
  if (nagnuta) {
    return {
      sta: `Lijeva poluga se nagnula ${ugao(r.lijeva.ugao)}, a oba njena točka su i dalje na tlu.`,
      zasto: `Diferencijal drži tijelo na prosjeku dvije poluge, pa je tijelo nagnuto samo ${ugao(r.tijelo)}.`,
    };
  }
  return {
    sta: 'Sva četiri točka su na tlu i tijelo je vodoravno.',
    zasto: 'Provuci kamen ispod lijevog točka: poluga se nagne, a diferencijal podijeli nagib na pola.',
  };
}

export function Suspenzija() {
  const [xKamena, postaviKamen] = useState(POCETNI_KAMEN);
  const [kruto, postaviKruto] = useState(false);
  const r = rijesi(OSOVINA, xKamena, kruto);
  const poruka = porukaZa(r, kruto);
  const naTlu = r.tockovi.filter((t) => t.zazor <= PRAG_VISI).length;

  /* Točak koji visi vrti se u prazno: motor ga vozi, a ništa ga ne drži. */
  const paociRef = useRef<(SVGGElement | null)[]>([]);
  const ugaoTocka = useRef(0);
  const visi = r.tockovi.map((t) => t.zazor > PRAG_VISI);
  useAnimacija((dt) => {
    ugaoTocka.current = (ugaoTocka.current + 300 * dt) % 360;
    paociRef.current.forEach((g, i) => {
      if (!g) return;
      const t = r.tockovi[i];
      g.setAttribute('transform', visi[i] ? `rotate(${ugaoTocka.current} ${t.x} ${yOd(i < 2 ? TLO_L : TLO_D, t.y)})` : '');
    });
  });

  /* Prevlačenje kamena: pozicija prsta u koordinate crteža. */
  const svgRef = useRef<SVGSVGElement | null>(null);
  const vuce = useRef(false);
  function pomjeri(klijentX: number, klijentY: number) {
    const svg = svgRef.current;
    const matrica = svg?.getScreenCTM();
    if (!svg || !matrica) return;
    const tacka = new DOMPoint(klijentX, klijentY).matrixTransform(matrica.inverse());
    postaviKamen(Math.round(Math.max(KAMEN_MIN, Math.min(KAMEN_MAX, tacka.x))));
  }

  useEffect(() => {
    const naTaster = (e: KeyboardEvent) => {
      const cilj = e.target as HTMLElement | null;
      if (cilj?.tagName === 'INPUT' || e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key.toLowerCase();
      if (k === 'arrowleft') postaviKamen((x) => Math.max(KAMEN_MIN, x - 12));
      else if (k === 'arrowright') postaviKamen((x) => Math.min(KAMEN_MAX, x + 12));
      else if (k === 'm') postaviKruto((v) => !v);
      else if (k === 'r') naResetuj();
      else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', naTaster);
    return () => window.removeEventListener('keydown', naTaster);
  }, []);

  function naResetuj() {
    postaviKamen(POCETNI_KAMEN);
    postaviKruto(false);
  }

  const G = GEOMETRIJA;
  const kamen = [
    [xKamena - G.polaKamena, TLO_L],
    [xKamena - G.polaKamena + G.kosina, TLO_L - G.visinaKamena],
    [xKamena + G.polaKamena - G.kosina, TLO_L - G.visinaKamena],
    [xKamena + G.polaKamena, TLO_L],
  ]
    .map((t) => t.join(','))
    .join(' ');

  return (
    <Okvir
      nazad={{ naziv: 'Perjanik', putanja: '/sajam/perjanik' }}
      naslov="Suspenzija"
      uvod="Dvije poluge i diferencijal drže sva četiri točka na tlu."
      rezimi={<Rezimi opis="Suspenzija" opcije={REZIMI} izabran={kruto ? 'kruto' : 'diferencijal'} onIzbor={(id) => postaviKruto(id === 'kruto')} />}
      onResetuj={naResetuj}
      status={<StatusLinija sta={poruka.sta} zasto={poruka.zasto} greska={kruto && naTlu < 4} />}
      sema={
        <svg
          ref={svgRef}
          viewBox="0 0 960 520"
          role="img"
          aria-label="Dva bočna pogleda na Perjanika: lijeva strana sa kamenom i desna strana na ravnom, pa nagib tijela i diferencijal"
          onPointerDown={(e) => {
            vuce.current = true;
            (e.target as Element).setPointerCapture?.(e.pointerId);
            pomjeri(e.clientX, e.clientY);
          }}
          onPointerMove={(e) => vuce.current && pomjeri(e.clientX, e.clientY)}
          onPointerUp={() => (vuce.current = false)}
          onPointerCancel={() => (vuce.current = false)}
        >
          {/* lijeva strana, sa kamenom */}
          <text x={X_TLA[0]} y={40} className={stil.tekst}>
            lijeva strana
          </text>
          <Tlo tlo={TLO_L} />
          <polygon points={kamen} className={sus.kamen} />
          <PolugaCrtez p={r.lijeva} tlo={TLO_L} visi={[visi[0], visi[1]]} paociRef={paociRef} indeks={0} oznaka="θL" />

          {/* desna strana, na ravnom */}
          <text x={X_TLA[0]} y={TLO_L + 64} className={stil.tekst}>
            desna strana
          </text>
          <Tlo tlo={TLO_D} />
          <PolugaCrtez p={r.desna} tlo={TLO_D} visi={[visi[2], visi[3]]} paociRef={paociRef} indeks={2} oznaka="θD" />

          {/* oznake točkova koji vise */}
          {r.tockovi.map((t, i) =>
            visi[i] ? (
              <text key={i} x={t.x} y={yOd(i < 2 ? TLO_L : TLO_D, t.y) - R - 12} textAnchor="middle" className={stil.greska}>
                visi
              </text>
            ) : null,
          )}

          {/* ručka za kamen: meta za prst i tastaturu */}
          <rect
            x={xKamena - G.polaKamena - 14}
            y={TLO_L - G.visinaKamena - 14}
            width={G.polaKamena * 2 + 28}
            height={G.visinaKamena + 40}
            rx={6}
            className={stil.meta}
            tabIndex={0}
            role="slider"
            aria-label="Položaj kamena"
            aria-valuemin={KAMEN_MIN}
            aria-valuemax={KAMEN_MAX}
            aria-valuenow={xKamena}
          />

          <Tijelo ugao={r.tijelo} />
          <Diferencijal x={DIFERENCIJAL.x} y={DIFERENCIJAL.y} lijeva={r.lijeva.ugao} desna={r.desna.ugao} kruto={kruto} />
        </svg>
      }
      strana={
        <>
          <Ocitavanja>
            <Ocitavanje natpis="Lijeva poluga, θL" vrijednost={broj(stepeni(r.lijeva.ugao), 1)} jedinica="°" pod="strana sa kamenom" />
            <Ocitavanje natpis="Desna poluga, θD" vrijednost={broj(stepeni(r.desna.ugao), 1)} jedinica="°" pod={kruto ? 'zavarena za tijelo' : 'na ravnom'} />
            <Ocitavanje natpis="Tijelo" vrijednost={broj(stepeni(r.tijelo), 1)} jedinica="°" pod={kruto ? 'nosi ugao poluge' : 'prosjek dvije poluge'} />
            <Ocitavanje natpis="Točkova na tlu" vrijednost={String(naTlu)} jedinica="od 4" pod={naTlu < 4 ? 'jedan se vrti u prazno' : ''} vruce={naTlu < 4} />
          </Ocitavanja>

          <PanelKontrola>
            <Klizac
              id="kamen"
              natpis="Položaj kamena"
              vrijednost={xKamena}
              prikaz={broj(xKamena - OSOVINA, 0)}
              min={KAMEN_MIN}
              max={KAMEN_MAX}
              boja="text"
              onPromjena={postaviKamen}
            />
          </PanelKontrola>

          <Napomena>
            Uglovi su izračunati iz geometrije crteža; mjere su ilustrativne. Pozitivan ugao znači prednji točak gore. Kamen možeš i
            prevući prstom po gornjem crtežu.
          </Napomena>
        </>
      }
    />
  );
}

/* ------------------------------------------------------------------ dijelovi */

function Tlo({ tlo }: { tlo: number }) {
  return (
    <g>
      <line x1={X_TLA[0]} y1={tlo} x2={X_TLA[1]} y2={tlo} className={stil.zica} />
      {Array.from({ length: Math.floor((X_TLA[1] - X_TLA[0]) / 20) }, (_, i) => (
        <line key={i} x1={X_TLA[0] + 12 + i * 20} y1={tlo + 2} x2={X_TLA[0] + i * 20} y2={tlo + 14} className={stil.zicaTanka} />
      ))}
    </g>
  );
}

function PolugaCrtez({
  p,
  tlo,
  visi,
  paociRef,
  indeks,
  oznaka,
}: {
  p: Poluga;
  tlo: number;
  visi: [boolean, boolean];
  paociRef: React.RefObject<(SVGGElement | null)[]>;
  indeks: number;
  oznaka: string;
}) {
  const yOs = yOd(tlo, p.podignutost);
  return (
    <g>
      <line x1={p.nazad.x} y1={yOd(tlo, p.nazad.y)} x2={p.naprijed.x} y2={yOd(tlo, p.naprijed.y)} className={sus.poluga} />
      {[p.nazad, p.naprijed].map((t, i) => (
        <g key={i}>
          <circle cx={t.x} cy={yOd(tlo, t.y)} r={R} className={visi[i] ? sus.tocakVisi : sus.tocak} />
          <g
            ref={(el) => {
              paociRef.current[indeks + i] = el;
            }}
          >
            <line x1={t.x} y1={yOd(tlo, t.y) - R + 6} x2={t.x} y2={yOd(tlo, t.y) + R - 6} className={stil.zica} />
          </g>
          <circle cx={t.x} cy={yOd(tlo, t.y)} r={4} className={stil.cvor} />
        </g>
      ))}
      <LukUgla x={OSOVINA} y={yOs} ugao={p.ugao} oznaka={oznaka} />
      <circle cx={OSOVINA} cy={yOs} r={7} className={sus.osovina} />
    </g>
  );
}

/** Luk ugla od vodoravne pomoćne linije do poluge, označen kao na tehničkom crtežu. */
function LukUgla({ x, y, ugao, oznaka }: { x: number; y: number; ugao: number; oznaka: string }) {
  const r = 56;
  const kraj = { x: x + r * Math.cos(ugao), y: y - r * Math.sin(ugao) };
  const vidljiv = Math.abs(stepeni(ugao)) > 0.2;
  /* Oznaka ide iznad lijevo kad prednji kraj ide gore (tamo je poluga niže), inače ispod lijevo. */
  const gore = ugao > 0;
  return (
    <g>
      <line x1={x} y1={y} x2={x + r + 14} y2={y} className={sus.pomocna} />
      {vidljiv && (
        <>
          <path d={`M${x + r},${y} A${r},${r} 0 0 ${ugao > 0 ? 0 : 1} ${kraj.x},${kraj.y}`} className={sus.luk} />
          <text x={x - 16} y={gore ? y - 14 : y + 28} textAnchor="end" className={sus.natpisUgla}>
            {oznaka}
          </text>
        </>
      )}
    </g>
  );
}

/** Tijelo sa strane: koliko je nagnuto u odnosu na vodoravno. */
function Tijelo({ ugao }: { ugao: number }) {
  const { x, y, pola, visina } = TIJELO;
  return (
    <g>
      <text x={x} y={40} textAnchor="middle" className={stil.tekst}>
        tijelo
      </text>
      <line x1={x - pola - 20} y1={y} x2={x + pola + 20} y2={y} className={sus.pomocna} />
      <g transform={`rotate(${-stepeni(ugao)} ${x} ${y})`}>
        <rect x={x - pola} y={y - visina / 2} width={pola * 2} height={visina} rx={4} className={stil.blok} />
        <line x1={x - pola} y1={y} x2={x + pola} y2={y} className={stil.zicaTanka} />
      </g>
      <circle cx={x} cy={y} r={4} className={stil.cvor} />
      <text x={x} y={y + 66} textAnchor="middle" className={stil.tih}>
        nagib tijela
      </text>
    </g>
  );
}

/**
  Diferencijal, šematski: greda na sredini tijela, krajevima vezana za dvije
  poluge. Jedna poluga gore znači drugu dolje, u odnosu na tijelo.
*/
function Diferencijal({ x, y, lijeva, desna, kruto }: { x: number; y: number; lijeva: number; desna: number; kruto: boolean }) {
  const pola = 70;
  const otklon = kruto ? 0 : Math.sin((lijeva - desna) / 2) * 3.2 * pola;
  return (
    <g>
      <text x={x} y={y - 104} textAnchor="middle" className={stil.tekst}>
        diferencijal
      </text>
      <text x={x} y={y - 82} textAnchor="middle" className={stil.tih}>
        šematski, prema tijelu
      </text>
      <rect x={x - pola - 30} y={y - 60} width={(pola + 30) * 2} height={150} rx={4} className={sus.okvirDiferencijala} />
      {kruto ? (
        <>
          <line x1={x - pola} y1={y} x2={x + pola} y2={y} className={sus.gredaKruta} />
          <text x={x} y={y + 50} textAnchor="middle" className={stil.greska}>
            nema grede
          </text>
        </>
      ) : (
        <>
          <line x1={x - pola} y1={y + otklon} x2={x + pola} y2={y - otklon} className={sus.greda} />
          <text x={x - pola} y={y + otklon + 30} textAnchor="middle" className={stil.tih}>
            lijeva
          </text>
          <text x={x + pola} y={y - otklon + 30} textAnchor="middle" className={stil.tih}>
            desna
          </text>
        </>
      )}
      <circle cx={x} cy={y} r={7} className={sus.osovina} />
    </g>
  );
}

