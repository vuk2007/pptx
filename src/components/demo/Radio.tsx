'use client';

import { useEffect, useRef, useState } from 'react';
import { FAILSAFE_MS } from '@/config/cinjenice';
import { Komponenta, SilkTekst, Vod } from '@/components/ploca/primitivi';
import { Antena, RadioLukovi } from '@/components/ilustracije/oblici';
import { useAnimacija } from '@/lib/animacija';
import {
  dvijeMunje,
  FORMAT_JE_ILUSTRATIVAN,
  jednaMunja,
  napraviPaket,
  POLJA,
  provjeraProlazi,
  uBinarno,
  xor,
  type Udar,
} from '@/lib/paket';
import { OkvirDemonstracije, PrekidacRezima } from './OkvirDemonstracije';
import stil from './demo.module.css';

/* --- geometrija --- */

const Y_LINIJA = 236;
/* Paket je širok, pa mu putanja mora stati između palice i rovera. */
const X_POCETAK = 246;
const X_KRAJ = 840;
const SIRINA_BITA = 9;
const RAZMAK_BITA = 1.5;
const RAZMAK_BAJTA = 12;
const SIRINA_BAJTA = 8 * (SIRINA_BITA + RAZMAK_BITA);

/** Koliko sekundi traje jedan let na ekranu. Stvarno je 40 ms. */
const TRAJANJE_LETA = 1.3;
const PAUZA = 0.45;

/* Panel sa računom */
const X_NATPIS = 330;
const X_BITOVI = 370;
const CELIJA = 34;
const RAZMAK_CELIJE = 4;
const Y_RED = 392;
const VISINA_REDA = 46;

type Ishod = 'uLetu' | 'prihvacen' | 'odbacen' | 'pokvarenProsao';

type Paket = {
  poslati: number[];
  primljeni: number[];
  udar: Udar | null;
};

function noviPaket(): Paket {
  /* Gas i skretanje se mijenjaju, da svaki paket ne izgleda isto. */
  const gas = 90 + Math.floor(Math.random() * 60);
  const skretanje = 100 + Math.floor(Math.random() * 56);
  const poslati = napraviPaket(gas, skretanje);
  return { poslati, primljeni: [...poslati], udar: null };
}

export function Radio() {
  const [paket, postaviPaket] = useState<Paket>(noviPaket);
  const [ishod, postaviIshod] = useState<Ishod>('uLetu');
  const [dvijeMunjeRezim, postaviDvijeMunjeRezim] = useState(false);
  const [signalPrekinut, postaviPrekid] = useState(false);
  const [roverStao, postaviRoverStao] = useState(false);

  const t = useRef(0);
  const bezSignala = useRef(0);
  const bljesak = useRef(0);

  const paketRef = useRef(paket);
  const ishodRef = useRef(ishod);
  const prekidRef = useRef(signalPrekinut);
  const staoRef = useRef(roverStao);
  useEffect(() => {
    paketRef.current = paket;
    ishodRef.current = ishod;
    prekidRef.current = signalPrekinut;
    staoRef.current = roverStao;
  }, [paket, ishod, signalPrekinut, roverStao]);

  const paketGRef = useRef<SVGGElement | null>(null);
  const bljesakRef = useRef<SVGGElement | null>(null);
  const tajmerTekstRef = useRef<SVGTextElement | null>(null);
  const tajmerTrakaRef = useRef<SVGRectElement | null>(null);

  useAnimacija((dt) => {
    /* Munja svijetli kratko poslije udara. */
    if (bljesak.current > 0) {
      bljesak.current = Math.max(0, bljesak.current - dt);
      bljesakRef.current?.setAttribute('opacity', String(Math.min(1, bljesak.current * 3)));
    }

    if (prekidRef.current) {
      bezSignala.current += dt * 1000;
      const udio = Math.min(1, bezSignala.current / FAILSAFE_MS);
      if (tajmerTekstRef.current) {
        tajmerTekstRef.current.textContent = `${Math.min(FAILSAFE_MS, Math.round(bezSignala.current))} ms`;
      }
      tajmerTrakaRef.current?.setAttribute('width', String(udio * 260));
      if (udio >= 1 && !staoRef.current) postaviRoverStao(true);
      return;
    }

    t.current += dt / TRAJANJE_LETA;

    if (t.current >= 1 && ishodRef.current === 'uLetu') {
      const p = paketRef.current;
      const prolazi = provjeraProlazi(p.primljeni);
      postaviIshod(prolazi ? (p.udar ? 'pokvarenProsao' : 'prihvacen') : 'odbacen');
    }

    if (t.current >= 1 + PAUZA / TRAJANJE_LETA) {
      t.current = 0;
      postaviPaket(noviPaket());
      postaviIshod('uLetu');
    }

    const x = X_POCETAK + Math.min(1, t.current) * (X_KRAJ - X_POCETAK);
    paketGRef.current?.setAttribute('transform', `translate(${x - X_POCETAK} 0)`);
  });

  function udariMunja() {
    if (signalPrekinut || ishod !== 'uLetu' || paket.udar) return;
    /* Udar ima smisla samo dok je paket stvarno u letu. */
    if (t.current < 0.12 || t.current > 0.84) return;

    const rezultat = dvijeMunjeRezim
      ? dvijeMunje(paket.primljeni, Math.random)
      : jednaMunja(paket.primljeni, Math.random);

    postaviPaket({ ...paket, primljeni: rezultat.paket, udar: rezultat.udar });
    bljesak.current = 0.5;
  }

  function prekiniSignal() {
    postaviPrekid(true);
    bezSignala.current = 0;
    postaviRoverStao(false);
  }

  function resetuj() {
    postaviPrekid(false);
    postaviRoverStao(false);
    postaviDvijeMunjeRezim(false);
    bezSignala.current = 0;
    t.current = 0;
    bljesak.current = 0;
    postaviPaket(noviPaket());
    postaviIshod('uLetu');
  }

  const podaci = paket.primljeni.slice(0, -1);
  const primljeniChecksum = paket.primljeni[paket.primljeni.length - 1];
  const izracunati = xor(podaci);

  const poruka = signalPrekinut
    ? roverStao
      ? `Nema signala ${FAILSAFE_MS} ms. Rover je stao sam.`
      : 'Paketi su prestali. Rover broji koliko je dugo bez komande.'
    : ishod === 'odbacen'
      ? 'XOR se ne slaže. Rover je bacio paket i ignorisao komandu.'
      : ishod === 'pokvarenProsao'
        ? 'Paket je pokvaren, a XOR se ipak slaže. XOR ovo ne vidi — zato postoje jače provjere, kao CRC.'
        : ishod === 'prihvacen'
          ? 'XOR se slaže. Rover prihvata komandu i pomjera motore.'
          : dvijeMunjeRezim
            ? 'Munja će sad pokvariti isti bit u dva bajta. Gledaj šta XOR na to kaže.'
            : 'Paket putuje 25 puta u sekundi. Pogodi ga munjom dok je u letu.';

  const alarm = ishod === 'odbacen' || ishod === 'pokvarenProsao' || roverStao;

  return (
    <OkvirDemonstracije
      naslov="Radio paket"
      oznaka="Perjanik · provjera i failsafe"
      nazadPutanja="/perjanik"
      nazadNaziv="Perjanik"
      poruka={poruka}
      alarm={alarm}
      napomena={
        FORMAT_JE_ILUSTRATIVAN
          ? 'Format paketa je ilustrativan dok se pravi ne potvrdi. Let je usporen — stvarno traje oko 40 ms.'
          : 'Let je usporen — stvarno traje oko 40 ms.'
      }
      onResetuj={resetuj}
      kontrole={
        <>
          <button className={stil.dugme} onClick={udariMunja} disabled={signalPrekinut}>
            <span aria-hidden="true">⚡</span> Munja
          </button>
          <PrekidacRezima ukljucen={dvijeMunjeRezim} onPromjena={postaviDvijeMunjeRezim}>
            Dvije munje na istom bitu
          </PrekidacRezima>
          <button className={stil.dugme} onClick={prekiniSignal}>
            Prekini signal
          </button>
        </>
      }
    >
      <svg viewBox="0 0 1480 640" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
        {/* --- palica --- */}
        <Komponenta x={40} y={186} w={170} h={110} natpis="PALICA" oznaka="TX" boja="var(--osjeti)" />
        <Antena x={125} y={186} visina={52} />
        {!signalPrekinut && <RadioLukovi x={125} y={128} broj={3} razmak={22} smjer={1} boja="var(--osjeti)" />}

        {/* --- veza --- */}
        <Vod
          tacke={`218,${Y_LINIJA} 1246,${Y_LINIJA}`}
          debljina={5}
          struja={signalPrekinut ? false : 'naprijed'}
          boja={signalPrekinut ? 'var(--silkscreen-tih)' : 'var(--bakar)'}
        />
        {signalPrekinut && (
          <g stroke="var(--alarm)" strokeWidth={9} strokeLinecap="round">
            <line x1={700} y1={Y_LINIJA - 34} x2={766} y2={Y_LINIJA + 34} />
            <line x1={766} y1={Y_LINIJA - 34} x2={700} y2={Y_LINIJA + 34} />
          </g>
        )}

        <SilkTekst x={732} y={136} sredina velicina={19} boja="var(--silkscreen-tih)">
          25 paketa u sekundi
        </SilkTekst>

        {/* --- paket u letu --- */}
        {!signalPrekinut && (
          <g ref={paketGRef}>
            <PaketUletu paket={paket} ishod={ishod} />
            <g ref={bljesakRef} opacity={0}>
              <Munja x={X_POCETAK + (POLJA.length * (SIRINA_BAJTA + RAZMAK_BAJTA)) / 2} y={Y_LINIJA - 66} />
            </g>
          </g>
        )}

        {/* --- rover --- */}
        <Komponenta x={1246} y={186} w={194} h={110} natpis="PERJANIK" oznaka="RX" boja="var(--silkscreen)" />
        <Antena x={1343} y={186} visina={52} />

        {/* odluka prijemnika */}
        {!signalPrekinut && ishod !== 'uLetu' && (
          <ZnakOdluke x={1343} y={330} ishod={ishod} />
        )}

        {/* failsafe tajmer */}
        {signalPrekinut && (
          <g>
            <SilkTekst x={1214} y={334} velicina={18} boja="var(--alarm)">
              bez komande
            </SilkTekst>
            <rect x={1214} y={346} width={260} height={22} rx={4} fill="var(--maska-duboka)" stroke="var(--alarm)" strokeWidth={2} />
            <rect ref={tajmerTrakaRef} x={1214} y={346} width={0} height={22} rx={4} fill="var(--alarm)" opacity={0.7} />
            <text
              ref={tajmerTekstRef}
              x={1214}
              y={400}
              fontSize={30}
              fontWeight={700}
              fill="var(--alarm)"
              style={{ fontFamily: 'var(--font-mono), ui-monospace, monospace' }}
            >
              0 ms
            </text>
            <SilkTekst x={1344} y={400} velicina={18} boja="var(--silkscreen-tih)">
              od {FAILSAFE_MS} ms
            </SilkTekst>
            {roverStao && (
              <SilkTekst x={1214} y={446} velicina={26} boja="var(--alarm)">
                Nema signala, stajem
              </SilkTekst>
            )}
          </g>
        )}

        {/* --- račun XOR-a, korak po korak --- */}
        <RacunXor paket={paket} izracunati={izracunati} primljeni={primljeniChecksum} ishod={ishod} />
      </svg>
    </OkvirDemonstracije>
  );
}

/* ------------------------------------------------------------------ dijelovi */

function PaketUletu({ paket, ishod }: { paket: Paket; ishod: Ishod }) {
  const boja =
    ishod === 'odbacen' ? 'var(--alarm)' : ishod === 'pokvarenProsao' ? 'var(--alarm)' : 'var(--bakar-struja)';

  return (
    <g>
      {paket.primljeni.map((bajt, indeksBajta) => {
        const x0 = X_POCETAK + indeksBajta * (SIRINA_BAJTA + RAZMAK_BAJTA);
        const udaren = paket.udar?.bajtovi.includes(indeksBajta) ?? false;
        return (
          <g key={indeksBajta}>
            {uBinarno(bajt)
              .split('')
              .map((znak, indeksBita) => {
                const pozicija = 7 - indeksBita;
                const pogodjen = udaren && paket.udar?.bit === pozicija;
                return (
                  <rect
                    key={indeksBita}
                    x={x0 + indeksBita * (SIRINA_BITA + RAZMAK_BITA)}
                    y={Y_LINIJA - 17}
                    width={SIRINA_BITA}
                    height={34}
                    rx={1.5}
                    fill={znak === '1' ? (pogodjen ? 'var(--alarm)' : boja) : 'var(--maska-duboka)'}
                    stroke={pogodjen ? 'var(--alarm)' : boja}
                    strokeWidth={pogodjen ? 2 : 1}
                  />
                );
              })}
            <SilkTekst x={x0} y={Y_LINIJA + 36} velicina={13} boja="var(--silkscreen-tih)" debljina={400}>
              {POLJA[indeksBajta]?.naziv ?? ''}
            </SilkTekst>
          </g>
        );
      })}
    </g>
  );
}

function Munja({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <path
        d={`M${x - 6},${y - 40} L${x + 12},${y - 8} L${x + 1},${y - 8} L${x + 14},${y + 26} L${x - 14},${y - 4} L${x - 1},${y - 4} Z`}
        fill="var(--alarm)"
        stroke="var(--alarm)"
        strokeWidth={3}
        strokeLinejoin="round"
      />
      <circle cx={x} cy={y + 30} r={26} fill="var(--alarm)" opacity={0.2} />
    </g>
  );
}

function ZnakOdluke({ x, y, ishod }: { x: number; y: number; ishod: Ishod }) {
  const dobar = ishod === 'prihvacen';
  const boja = dobar ? 'var(--osjeti)' : 'var(--alarm)';
  return (
    <g>
      <circle cx={x} cy={y} r={30} fill="none" stroke={boja} strokeWidth={5} />
      {dobar ? (
        <polyline points={`${x - 14},${y} ${x - 4},${y + 12} ${x + 15},${y - 12}`} fill="none" stroke={boja} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <g stroke={boja} strokeWidth={6} strokeLinecap="round">
          <line x1={x - 12} y1={y - 12} x2={x + 12} y2={y + 12} />
          <line x1={x + 12} y1={y - 12} x2={x - 12} y2={y + 12} />
        </g>
      )}
      <SilkTekst x={x} y={y + 56} sredina velicina={19} boja={boja}>
        {ishod === 'prihvacen' ? 'prihvaćen' : ishod === 'odbacen' ? 'odbačen' : 'prošao pokvaren'}
      </SilkTekst>
    </g>
  );
}

/** Kako prijemnik računa XOR, red po red, sa istaknutim pokvarenim bitovima. */
function RacunXor({
  paket,
  izracunati,
  primljeni,
  ishod,
}: {
  paket: Paket;
  izracunati: number;
  primljeni: number;
  ishod: Ishod;
}) {
  const podaci = paket.primljeni.slice(0, -1);
  const slaze = izracunati === primljeni;

  const redovi = [
    ...podaci.map((bajt, i) => ({
      naziv: POLJA[i]?.naziv ?? `BAJT ${i}`,
      bajt,
      indeks: i,
      tip: 'podatak' as const,
    })),
    { naziv: 'XOR RAČUNATI', bajt: izracunati, indeks: -1, tip: 'racunati' as const },
    { naziv: 'XOR PRIMLJENI', bajt: primljeni, indeks: podaci.length, tip: 'primljeni' as const },
  ];

  return (
    <g>
      <SilkTekst x={60} y={Y_RED - 34} velicina={22} boja="var(--silkscreen)">
        prijemnik računa XOR
      </SilkTekst>

      {redovi.map((red, i) => {
        const y = Y_RED + i * VISINA_REDA;
        const udaren = paket.udar?.bajtovi.includes(red.indeks) ?? false;
        const jeRezultat = red.tip !== 'podatak';
        const boja = jeRezultat
          ? slaze
            ? 'var(--osjeti)'
            : 'var(--alarm)'
          : udaren
            ? 'var(--alarm)'
            : 'var(--bakar-struja)';

        return (
          <g key={red.naziv}>
            {red.tip === 'racunati' && (
              <line x1={X_BITOVI} y1={y - 30} x2={X_BITOVI + 8 * (CELIJA + RAZMAK_CELIJE)} y2={y - 30}
                stroke="var(--silkscreen-tih)" strokeWidth={2} />
            )}

            <SilkTekst x={X_NATPIS} y={y + 6} desno velicina={19} boja="var(--silkscreen-tih)">
              {red.naziv}
            </SilkTekst>

            {uBinarno(red.bajt)
              .split('')
              .map((znak, indeksBita) => {
                const pozicija = 7 - indeksBita;
                const pogodjen = udaren && paket.udar?.bit === pozicija;
                return (
                  <g key={indeksBita}>
                    <rect
                      x={X_BITOVI + indeksBita * (CELIJA + RAZMAK_CELIJE)}
                      y={y - 20}
                      width={CELIJA}
                      height={CELIJA}
                      rx={3}
                      fill={znak === '1' ? boja : 'var(--maska-duboka)'}
                      stroke={boja}
                      strokeWidth={pogodjen ? 3 : 1.5}
                    />
                    <text
                      x={X_BITOVI + indeksBita * (CELIJA + RAZMAK_CELIJE) + CELIJA / 2}
                      y={y + 4}
                      textAnchor="middle"
                      fontSize={20}
                      fontWeight={700}
                      fill={znak === '1' ? 'var(--maska-duboka)' : boja}
                      style={{ fontFamily: 'var(--font-mono), ui-monospace, monospace' }}
                    >
                      {znak}
                    </text>
                  </g>
                );
              })}

            <text
              x={X_BITOVI + 8 * (CELIJA + RAZMAK_CELIJE) + 24}
              y={y + 6}
              fontSize={22}
              fontWeight={700}
              fill={boja}
              style={{ fontFamily: 'var(--font-mono), ui-monospace, monospace' }}
            >
              {red.bajt.toString().padStart(3, ' ')}
            </text>

            {udaren && (
              <SilkTekst x={X_BITOVI + 8 * (CELIJA + RAZMAK_CELIJE) + 96} y={y + 6} velicina={17} boja="var(--alarm)">
                ← munja
              </SilkTekst>
            )}
          </g>
        );
      })}

      {ishod !== 'uLetu' && (
        <SilkTekst
          x={X_BITOVI + 8 * (CELIJA + RAZMAK_CELIJE) + 96}
          y={Y_RED + (redovi.length - 1) * VISINA_REDA + 6}
          velicina={20}
          boja={slaze ? 'var(--osjeti)' : 'var(--alarm)'}
        >
          {slaze ? '← slaže se' : '← ne slaže se'}
        </SilkTekst>
      )}

    </g>
  );
}
