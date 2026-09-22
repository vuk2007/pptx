'use client';

import { useEffect, useRef, useState } from 'react';
import { XGO_RADIO, XGO_SIGURNOST } from '@/config/cinjenice';
import { Komponenta, SilkTekst, Strelica, Vod } from '@/components/ploca/primitivi';
import { Antena, Mikrofon, Pas, RadioLukovi } from '@/components/ilustracije/oblici';
import { useAnimacija } from '@/lib/animacija';
import {
  BAJTOVI_SJEDI,
  BAJTOVI_SU_ILUSTRATIVNI,
  napraviSerijskiPaket,
  racunChecksuma,
  uHeks,
} from '@/lib/xgo-paket';
import { OkvirDemonstracije } from './OkvirDemonstracije';
import stil from './demo.module.css';

/*
  Put jedne riječi od mikrofona do noge. Na svakoj karici poruka promijeni
  oblik: tekst, pa radio poruka, pa serijski paket, pa uglovi zglobova.

  Ništa se usput ne gubi — samo se prevodi.
*/

const Y_RED1 = 170;
const Y_RED2 = 350;
const SIRINA = 160;
const VISINA = 92;

const SERIJSKI = napraviSerijskiPaket(BAJTOVI_SJEDI.komanda, BAJTOVI_SJEDI.adresa, BAJTOVI_SJEDI.podaci);
const RACUN = racunChecksuma(
  SERIJSKI[2],
  BAJTOVI_SJEDI.komanda,
  BAJTOVI_SJEDI.adresa,
  BAJTOVI_SJEDI.podaci,
);

type Karika = {
  naziv: string;
  oznaka?: string;
  boja: string;
  x: number;
  y: number;
  /** Kako poruka izgleda kad stigne dovde. */
  oblik: string;
  opisOblika: string;
};

const KARIKE: Karika[] = [
  { naziv: 'JARVIS', boja: 'var(--odluci)', x: 60, y: Y_RED1, oblik: '„sjedi”', opisOblika: 'izgovorena riječ' },
  { naziv: 'HUB', oznaka: 'laptop', boja: 'var(--odluci)', x: 300, y: Y_RED1, oblik: 'komanda: sjedi', opisOblika: 'poruka u programu' },
  { naziv: 'micro:bit', oznaka: 'most', boja: 'var(--odluci)', x: 540, y: Y_RED1, oblik: 'radio.send("sjedi")', opisOblika: 'preko USB-a' },
  { naziv: 'RADIO', oznaka: `grupa ${XGO_RADIO.grupa}`, boja: 'var(--bakar-struja)', x: 780, y: Y_RED1, oblik: `${XGO_RADIO.mhz} MHz`, opisOblika: 'kroz vazduh' },
  { naziv: 'micro:bit', oznaka: 'u psu', boja: 'var(--odluci)', x: 780, y: Y_RED2, oblik: 'primljeno: sjedi', opisOblika: 'ista riječ, drugi uređaj' },
  { naziv: 'SERIJSKA', oznaka: 'veza', boja: 'var(--bakar-struja)', x: 540, y: Y_RED2, oblik: `${SERIJSKI.length} bajta`, opisOblika: 'paket sa checksumom' },
  { naziv: 'ESP32', oznaka: 'računa', boja: 'var(--odluci)', x: 300, y: Y_RED2, oblik: 'uglovi za 12 zglobova', opisOblika: 'kinematika' },
  { naziv: 'MOTORI', boja: 'var(--djeluj)', x: 60, y: Y_RED2, oblik: 'pas sjeda', opisOblika: 'pokret' },
];

/** Sekundi po jednoj karici. */
const PO_KARICI = 0.85;

export function Komanda() {
  const [korak, postaviKorak] = useState(-1);
  const [ide, postaviIde] = useState(false);

  const napredak = useRef(0);
  const ideRef = useRef(ide);
  useEffect(() => {
    ideRef.current = ide;
  }, [ide]);

  const iskraRef = useRef<SVGGElement | null>(null);

  useAnimacija((dt) => {
    if (!ideRef.current) return;
    napredak.current += dt / PO_KARICI;

    const noviKorak = Math.floor(napredak.current);
    if (noviKorak >= KARIKE.length) {
      postaviKorak(KARIKE.length - 1);
      postaviIde(false);
      return;
    }
    postaviKorak(noviKorak);

    /* Iskra putuje od karike do karike. */
    const od = KARIKE[noviKorak];
    const do_ = KARIKE[Math.min(KARIKE.length - 1, noviKorak + 1)];
    const t = napredak.current - noviKorak;
    const x = od.x + SIRINA / 2 + (do_.x - od.x) * t;
    const y = od.y + VISINA / 2 + (do_.y - od.y) * t;
    iskraRef.current?.setAttribute('transform', `translate(${x} ${y})`);
  });

  function posalji() {
    napredak.current = 0;
    postaviKorak(0);
    postaviIde(true);
  }

  function resetuj() {
    napredak.current = 0;
    postaviKorak(-1);
    postaviIde(false);
  }

  const tekuca = korak >= 0 ? KARIKE[korak] : null;
  const poruka = tekuca
    ? `${tekuca.naziv}: ${tekuca.oblik} — ${tekuca.opisOblika}.`
    : 'Jedna riječ pređe osam karika dok ne postane pokret. Pošalji je i gledaj u šta se pretvara.';

  return (
    <OkvirDemonstracije
      naslov="Put komande"
      oznaka="XGO · od riječi do pokreta"
      nazadPutanja="/xgo"
      nazadNaziv="XGO psi"
      poruka={poruka}
      napomena={
        BAJTOVI_SU_ILUSTRATIVNI
          ? 'Okvir paketa i račun checksuma su pravi; same vrijednosti bajtova su ilustrativne dok se ne potvrde.'
          : undefined
      }
      onResetuj={resetuj}
      kontrole={
        <button className={stil.dugme} onClick={posalji} disabled={ide}>
          <span aria-hidden="true">▶</span> Pošalji „sjedi”
        </button>
      }
    >
      <svg viewBox="0 0 1480 640" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
        {/* --- vodovi između karika --- */}
        {KARIKE.slice(0, -1).map((od, i) => {
          const do_ = KARIKE[i + 1];
          const aktivan = korak > i;
          const vodoravno = od.y === do_.y;
          const tacke = vodoravno
            ? `${Math.min(od.x, do_.x) + SIRINA},${od.y + VISINA / 2} ${Math.max(od.x, do_.x)},${od.y + VISINA / 2}`
            : `${od.x + SIRINA / 2},${od.y + VISINA} ${od.x + SIRINA / 2},${do_.y}`;
          return (
            <g key={od.naziv + i}>
              <Vod tacke={tacke} debljina={5} struja={aktivan ? 'naprijed' : false} brzina={0.6} />
              {vodoravno && (
                <Strelica
                  x={(od.x + SIRINA + Math.max(od.x, do_.x)) / 2 + (do_.x > od.x ? 0 : -SIRINA)}
                  y={od.y + VISINA / 2}
                  ugao={do_.x > od.x ? 0 : 180}
                />
              )}
            </g>
          );
        })}

        {/* radio skok kroz vazduh */}
        <RadioLukovi x={KARIKE[3].x + SIRINA / 2} y={KARIKE[3].y + VISINA + 34} broj={3} razmak={20}
          smjer={1} boja="var(--bakar-struja)" opacity={korak >= 3 ? 1 : 0.25} />

        {/* --- karike --- */}
        {KARIKE.map((k, i) => {
          const aktivna = korak === i;
          const prosla = korak > i;
          return (
            <g key={k.naziv + i} opacity={korak < 0 || prosla || aktivna ? 1 : 0.4}>
              <Komponenta
                x={k.x}
                y={k.y}
                w={SIRINA}
                h={VISINA}
                natpis={k.naziv}
                oznaka={k.oznaka}
                boja={aktivna ? 'var(--bakar-struja)' : k.boja}
                noge={2}
              />
              {aktivna && (
                <rect x={k.x - 8} y={k.y - 8} width={SIRINA + 16} height={VISINA + 16} rx={8}
                  fill="none" stroke="var(--bakar-struja)" strokeWidth={3} />
              )}
              <SilkTekst x={k.x + SIRINA / 2} y={k.y + VISINA + 30} sredina velicina={15}
                boja={aktivna ? 'var(--bakar-struja)' : 'var(--silkscreen-tih)'} debljina={400}>
                {k.oblik}
              </SilkTekst>
            </g>
          );
        })}

        {/* mikrofon i pas na krajevima lanca */}
        <Mikrofon x={KARIKE[0].x + SIRINA / 2} y={KARIKE[0].y - 66} skala={0.5} />
        <Antena x={KARIKE[3].x + SIRINA / 2} y={KARIKE[3].y} visina={40} />
        <Antena x={KARIKE[4].x + SIRINA / 2} y={KARIKE[4].y} visina={40} />
        <Pas x={KARIKE[7].x + SIRINA / 2} y={KARIKE[7].y + VISINA + 66} skala={0.36}
          boja={korak === 7 ? 'var(--djeluj)' : 'var(--silkscreen-tih)'} />

        {/* iskra koja putuje */}
        <g ref={iskraRef} opacity={ide ? 1 : 0}>
          <circle r={13} fill="var(--bakar-struja)" />
          <circle r={26} fill="var(--bakar-struja)" opacity={0.25} />
        </g>

        {/* --- serijski paket i njegov checksum --- */}
        <SerijskiPaket istaknut={korak >= 5} />

        {/* --- sigurnosni slojevi --- */}
        <SigurnosniSlojevi />
      </svg>
    </OkvirDemonstracije>
  );
}

function SerijskiPaket({ istaknut }: { istaknut: boolean }) {
  const X = 960;
  const Y = 150;
  const CELIJA = 52;

  /* Indeksi: 0-1 zaglavlje, 2 dužina, 3 komanda, 4 adresa, pa podaci, checksum, rep. */
  const uloga = (i: number) => {
    if (i < 2) return 'zaglavlje';
    if (i === 2) return 'dužina';
    if (i === 3) return 'komanda';
    if (i === 4) return 'adresa';
    if (i >= SERIJSKI.length - 2) return 'rep';
    if (i === SERIJSKI.length - 3) return 'checksum';
    return 'podaci';
  };

  /* Puni naziv ne staje ispod ćelije od 52 piksela, pa ide skraćeno. */
  const kratko = (i: number) =>
    ({ zaglavlje: 'zagl', dužina: 'duž', komanda: 'kom', adresa: 'adr', podaci: 'pod', checksum: 'chk', rep: 'rep' })[
      uloga(i)
    ];
  const boja = (i: number) => {
    const u = uloga(i);
    if (u === 'zaglavlje' || u === 'rep') return 'var(--silkscreen-tih)';
    if (u === 'checksum') return 'var(--osjeti)';
    return 'var(--bakar-struja)';
  };

  return (
    <g opacity={istaknut ? 1 : 0.42}>
      <SilkTekst x={X} y={Y - 26} velicina={20} boja="var(--silkscreen)">
        serijski paket
      </SilkTekst>

      {SERIJSKI.map((bajt, i) => (
        <g key={i}>
          <rect x={X + i * CELIJA} y={Y} width={CELIJA - 5} height={46} rx={4}
            fill="var(--maska-svijetla)" stroke={boja(i)} strokeWidth={2.5} />
          <text
            x={X + i * CELIJA + (CELIJA - 5) / 2}
            y={Y + 31}
            textAnchor="middle"
            fontSize={17}
            fontWeight={700}
            fill={boja(i)}
            style={{ fontFamily: 'var(--font-mono), ui-monospace, monospace' }}
          >
            {uHeks(bajt)}
          </text>
          <text
            x={X + i * CELIJA + (CELIJA - 5) / 2}
            y={Y + 66}
            textAnchor="middle"
            fontSize={12}
            fill="var(--silkscreen-tih)"
            style={{ fontFamily: 'var(--font-mono), ui-monospace, monospace' }}
          >
            {kratko(i)}
          </text>
        </g>
      ))}

      {/* račun checksuma */}
      <SilkTekst x={X} y={Y + 128} velicina={19} boja="var(--osjeti)">
        checksum
      </SilkTekst>
      <text
        x={X}
        y={Y + 164}
        fontSize={19}
        fill="var(--silkscreen-tih)"
        style={{ fontFamily: 'var(--font-mono), ui-monospace, monospace' }}
      >
        {RACUN.sabirci.map((s) => s.vrijednost).join(' + ')} = {RACUN.zbir}
      </text>
      <text
        x={X}
        y={Y + 194}
        fontSize={19}
        fill="var(--silkscreen-tih)"
        style={{ fontFamily: 'var(--font-mono), ui-monospace, monospace' }}
      >
        najniži bajt: {uHeks(RACUN.najniziBajt)}
      </text>
      <text
        x={X}
        y={Y + 226}
        fontSize={21}
        fontWeight={700}
        fill="var(--osjeti)"
        style={{ fontFamily: 'var(--font-mono), ui-monospace, monospace' }}
      >
        invertovano: {uHeks(RACUN.checksum)}
      </text>
      <SilkTekst x={X} y={Y + 256} velicina={15} boja="var(--silkscreen-tih)" debljina={400}>
        zbir + checksum uvijek daju 0xFF
      </SilkTekst>
    </g>
  );
}

/** Tri sloja koji zaustave psa i kad AI, laptop ili radio zakažu. */
function SigurnosniSlojevi() {
  const slojevi = [
    { tekst: `pas staje ako ${XGO_SIGURNOST.pasStajeBezKomande} ms nema komande`, x: 210 },
    { tekst: `most šalje stop ako laptop ćuti ${XGO_SIGURNOST.mostSaljeStopAkoLaptopCuti / 1000} s`, x: 640 },
    { tekst: 'fizički taster za stop, mimo AI-ja', x: 1060 },
  ];

  return (
    <g>
      <SilkTekst x={60} y={604} velicina={19} boja="var(--alarm)">
        tri kočnice
      </SilkTekst>
      {slojevi.map((s) => (
        <g key={s.tekst}>
          <rect x={s.x} y={590} width={16} height={16} rx={3} fill="none" stroke="var(--alarm)" strokeWidth={3} />
          <SilkTekst x={s.x + 28} y={604} velicina={16} boja="var(--silkscreen-tih)" debljina={400}>
            {s.tekst}
          </SilkTekst>
        </g>
      ))}
    </g>
  );
}
