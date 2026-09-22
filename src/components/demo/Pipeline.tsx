'use client';

import { useEffect, useRef, useState } from 'react';
import { SilkTekst } from '@/components/ploca/primitivi';
import { Zvucnik } from '@/components/ilustracije/oblici';
import { useAnimacija } from '@/lib/animacija';
import { fazaU, napraviRaspored, type Faza, type Traka } from '@/lib/pipeline';
import { PIPELINE_GDJE, PIPELINE_VREMENA } from '@/config/cinjenice';
import { OkvirDemonstracije } from './OkvirDemonstracije';
import stil from './demo.module.css';

/*
  Dvije trake, iste faze, isti posao. Razlika je samo u tome kad zvučnik
  smije da progovori. Zato su obje na istoj vremenskoj osi — poređenje
  se vidi kao razmak, ne kao dva odvojena broja.
*/

const X0 = 300;
const X1 = 1420;
const Y_OSA = 570;

const RED = { cekanje: 168, streaming: 388 };
const VISINA = 74;
/** Traka pozadinskog posla stoji ispod glavne, u istom redu. */
const POMAK_POZADINE = VISINA + 16;
const VISINA_POZADINE = 40;

const raspored = napraviRaspored(PIPELINE_VREMENA);
/** Malo vazduha desno, da „zvučnik govori” ima gdje da se nastavi. */
const OSA_MAX = raspored.ukupno + 0.9;
const SKALA = (X1 - X0) / OSA_MAX;

const uX = (t: number) => X0 + t * SKALA;
const sek = (t: number) => `${t.toFixed(1).replace('.', ',')} s`;

/** Kratka imena, da stanu u traku. Duže objašnjenje ide u rečenicu ispod. */
const IME: Record<string, string> = {
  budjenje: 'budi se',
  'glas-u-tekst': 'glas→tekst',
  mozak: 'mozak',
  'mozak-ostatak': 'mozak piše dalje',
  'tekst-u-glas': 'tekst→glas',
};

/** Puna rečenica za svaku fazu — kratko ime u traci ne objašnjava ništa samo. */
const OPIS_FAZE: Record<string, string> = {
  budjenje: 'Prvi program čeka samo riječ „Jarvis”.',
  'glas-u-tekst': 'Tvoj glas se pretvara u tekst.',
  mozak: 'Mozak piše odgovor — streaming čeka samo prvu rečenicu.',
  'tekst-u-glas': 'Tekst se pretvara nazad u glas.',
};

/** Gdje se faza izvršava, ako je to uopšte provjereno. */
const GDJE: Record<string, 'lokalno' | 'oblak' | null> = {
  budjenje: PIPELINE_GDJE.budjenje,
  'glas-u-tekst': PIPELINE_GDJE.glasUTekst,
  mozak: PIPELINE_GDJE.mozak,
  'mozak-ostatak': PIPELINE_GDJE.mozak,
  'tekst-u-glas': PIPELINE_GDJE.tekstUGlas,
};

const NAPOMENA =
  'Vremena su ilustrativna i teku u stvarnoj brzini. Faza bez oznake „lokalno” ili „oblak” znači da to još nije provjereno.';

/** Gruba procjena širine mono teksta — dovoljna da se odluči staje li natpis u traku. */
const procijeniSirinu = (tekst: string, velicina: number) => tekst.length * velicina * 0.72;

export function Pipeline() {
  const [ide, postaviIde] = useState(false);
  const [vrijeme, postaviVrijeme] = useState(0);

  const t = useRef(0);
  const ideRef = useRef(false);

  const pokazivacRef = useRef<SVGLineElement | null>(null);
  const odsjecakRef = useRef<SVGRectElement | null>(null);
  const satRef = useRef<SVGTextElement | null>(null);
  const zvucnikRef = useRef<Record<'cekanje' | 'streaming', SVGGElement | null>>({
    cekanje: null,
    streaming: null,
  });

  useEffect(() => {
    ideRef.current = ide;
  }, [ide]);

  useAnimacija((dt) => {
    if (!ideRef.current) return;

    t.current = Math.min(OSA_MAX, t.current + dt);
    if (t.current >= OSA_MAX) postaviIde(false);

    /* Stanje koje mijenja rečenicu ispod ide kroz React, ali samo u desetinkama. */
    const zaokruzeno = Math.round(t.current * 10) / 10;
    postaviVrijeme((prethodno) => (prethodno === zaokruzeno ? prethodno : zaokruzeno));

    nacrtaj(t.current);
  }, ide);

  function nacrtaj(sada: number) {
    const x = uX(sada);
    pokazivacRef.current?.setAttribute('x1', String(x));
    pokazivacRef.current?.setAttribute('x2', String(x));
    odsjecakRef.current?.setAttribute('width', String(Math.max(0, x - X0)));
    if (satRef.current) {
      satRef.current.setAttribute('x', String(x));
      satRef.current.textContent = sek(sada);
    }

    for (const traka of [raspored.cekanje, raspored.streaming]) {
      zvucnikRef.current[traka.id]?.setAttribute('opacity', sada >= traka.prviZvuk ? '1' : '0.22');
    }
  }

  function pokreni() {
    if (t.current >= OSA_MAX) t.current = 0;
    postaviIde(true);
  }

  function resetuj() {
    postaviIde(false);
    t.current = 0;
    postaviVrijeme(0);
    nacrtaj(0);
  }

  const tekuca = ide ? fazaU(raspored.streaming, vrijeme) : null;
  const poruka = ide
    ? tekuca
      ? (OPIS_FAZE[tekuca.id] ?? tekuca.naziv)
      : vrijeme >= raspored.cekanje.prviZvuk
        ? 'Obje su progovorile. Streaming je bio prvi.'
        : 'Streaming već govori, a mozak još piše ostatak odgovora.'
    : vrijeme === 0
      ? 'Pritisni „Pokreni” pa gledaj kad se u kojoj traci čuje prva riječ.'
      : `Streaming je progovorio ${sek(raspored.ustedjeno)} ranije, a mozak je u obje trake radio isto.`;

  return (
    <OkvirDemonstracije
      naslov="Pipeline i brzina"
      oznaka="JARVIS · zašto ne čeka cio odgovor"
      nazadPutanja="/jarvis"
      nazadNaziv="Jarvis"
      poruka={poruka}
      napomena={NAPOMENA}
      onResetuj={resetuj}
      kontrole={
        <button className={stil.dugme} onClick={pokreni} disabled={ide}>
          {ide ? 'Ide…' : 'Pokreni'}
        </button>
      }
    >
      <svg viewBox="0 0 1480 640" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
        <defs>
          {/* Sve što je lijevo od pokazivača je već odrađeno — zato je puno. */}
          <clipPath id="pipeline-proteklo">
            <rect ref={odsjecakRef} x={X0} y={0} width={0} height={640} />
          </clipPath>
          <linearGradient id="pipeline-govor" x1="0" x2="1">
            <stop offset="0" stopColor="var(--djeluj)" stopOpacity="0.5" />
            <stop offset="1" stopColor="var(--djeluj)" stopOpacity="0" />
          </linearGradient>
        </defs>

        <Osa />

        {[raspored.cekanje, raspored.streaming].map((traka) => (
          <Red
            key={traka.id}
            traka={traka}
            y={RED[traka.id]}
            postaviZvucnik={(el) => {
              zvucnikRef.current[traka.id] = el;
            }}
          />
        ))}

        <Razlika />

        {/* Pokazivač vremena ide preko svega. */}
        <line
          ref={pokazivacRef}
          x1={X0}
          x2={X0}
          y1={104}
          y2={Y_OSA}
          stroke="var(--bakar-struja)"
          strokeWidth={3}
        />
        <text
          ref={satRef}
          x={X0}
          y={92}
          textAnchor="middle"
          fontSize={26}
          fontWeight={700}
          fill="var(--bakar-struja)"
          style={{ fontFamily: 'var(--font-mono), ui-monospace, monospace' }}
        >
          0,0 s
        </text>
      </svg>
    </OkvirDemonstracije>
  );
}

function Osa() {
  const podioci: number[] = [];
  for (let k = 0; k * 0.5 <= OSA_MAX; k++) podioci.push(k * 0.5);

  return (
    <g>
      <line x1={X0} y1={Y_OSA} x2={X1} y2={Y_OSA} stroke="var(--ivica)" strokeWidth={3} />
      {podioci.map((s) => (
        <g key={s}>
          <line x1={uX(s)} y1={Y_OSA} x2={uX(s)} y2={Y_OSA + 12} stroke="var(--ivica)" strokeWidth={3} />
          <line x1={uX(s)} y1={120} x2={uX(s)} y2={Y_OSA} stroke="var(--ivica)" strokeWidth={1.5} opacity={0.45} />
          <SilkTekst x={uX(s)} y={Y_OSA + 36} sredina velicina={16} boja="var(--silkscreen-tih)" debljina={400}>
            {s.toFixed(1).replace('.', ',')}
          </SilkTekst>
        </g>
      ))}
      <SilkTekst x={X1} y={Y_OSA + 62} desno velicina={16} boja="var(--silkscreen-tih)" debljina={400}>
        sekundi od kad si rekao „jarvis”
      </SilkTekst>
    </g>
  );
}

function Red({
  traka,
  y,
  postaviZvucnik,
}: {
  traka: Traka;
  y: number;
  postaviZvucnik: (el: SVGGElement | null) => void;
}) {
  const xZvuk = uX(traka.prviZvuk);

  return (
    <g>
      <SilkTekst x={X0 - 28} y={y + 30} desno velicina={26} boja="var(--silkscreen)">
        {traka.naziv}
      </SilkTekst>
      <SilkTekst x={X0 - 28} y={y + 58} desno velicina={17} boja="var(--silkscreen-tih)" debljina={400}>
        {traka.id === 'cekanje' ? 'progovori na kraju' : 'progovori usput'}
      </SilkTekst>

      {traka.faze.map((f) => (
        <FazaUTraci key={f.id} faza={f} y={y} />
      ))}

      {/* Zvučnik govori od prve riječi nadalje — koliko to traje, ne tvrdimo. */}
      <rect x={xZvuk} y={y + 14} width={X1 - xZvuk} height={VISINA - 28} fill="url(#pipeline-govor)" />

      <line
        x1={xZvuk}
        y1={y - 52}
        x2={xZvuk}
        y2={y + VISINA + 10}
        stroke="var(--djeluj)"
        strokeWidth={3}
        strokeDasharray="10 7"
      />
      <g ref={postaviZvucnik} opacity={0.22}>
        <Zvucnik x={xZvuk + 48} y={y + VISINA / 2} skala={0.6} />
      </g>
      <SilkTekst x={xZvuk} y={y - 60} sredina velicina={20} boja="var(--djeluj)">
        {`prva riječ · ${sek(traka.prviZvuk)}`}
      </SilkTekst>
    </g>
  );
}

function FazaUTraci({ faza, y }: { faza: Faza; y: number }) {
  const x = uX(faza.pocetak);
  const sirina = uX(faza.kraj) - x;
  const pozadinska = faza.upozadini === true;

  const gornji = pozadinska ? y + POMAK_POZADINE : y;
  const visina = pozadinska ? VISINA_POZADINE : VISINA;
  const boja = `var(--${faza.boja})`;

  const ime = IME[faza.id] ?? faza.naziv;
  const velicina = pozadinska ? 18 : 21;
  const staje = procijeniSirinu(ime, velicina) + 24 < sirina;

  const gdje = pozadinska ? null : GDJE[faza.id];

  return (
    <g>
      {/* Obris stoji uvijek, ispuna dolazi tek kad pokazivač prođe. */}
      <rect
        x={x}
        y={gornji}
        width={sirina}
        height={visina}
        rx={6}
        fill="none"
        stroke={boja}
        strokeWidth={pozadinska ? 2.5 : 3}
        strokeDasharray={pozadinska ? '9 7' : undefined}
        opacity={pozadinska ? 0.75 : 1}
      />
      <g clipPath="url(#pipeline-proteklo)">
        <rect x={x} y={gornji} width={sirina} height={visina} rx={6} fill={boja} opacity={pozadinska ? 0.16 : 0.3} />
      </g>

      {staje ? (
        <SilkTekst x={x + sirina / 2} y={gornji + visina / 2 + 7} sredina velicina={velicina} boja={boja}>
          {ime}
        </SilkTekst>
      ) : (
        <>
          <SilkTekst x={x + sirina / 2} y={gornji - 16} sredina velicina={velicina} boja={boja}>
            {ime}
          </SilkTekst>
          <line x1={x + sirina / 2} y1={gornji - 10} x2={x + sirina / 2} y2={gornji} stroke={boja} strokeWidth={2} />
        </>
      )}

      {gdje && (
        <SilkTekst
          x={x + sirina / 2}
          y={gornji - (staje ? 12 : 42)}
          sredina
          velicina={15}
          boja="var(--silkscreen-tih)"
          debljina={400}
        >
          {gdje}
        </SilkTekst>
      )}
    </g>
  );
}

/** Razmak između dvije prve riječi — to je cijela poenta. */
function Razlika() {
  const a = uX(raspored.streaming.prviZvuk);
  const b = uX(raspored.cekanje.prviZvuk);
  const y = 292;

  return (
    <g>
      <line x1={a} y1={y} x2={b} y2={y} stroke="var(--bakar-struja)" strokeWidth={3} />
      <line x1={a} y1={y - 10} x2={a} y2={y + 10} stroke="var(--bakar-struja)" strokeWidth={3} />
      <line x1={b} y1={y - 10} x2={b} y2={y + 10} stroke="var(--bakar-struja)" strokeWidth={3} />
      <SilkTekst x={(a + b) / 2} y={y - 18} sredina velicina={24} boja="var(--bakar-struja)">
        {`${sek(raspored.ustedjeno)} ranije`}
      </SilkTekst>
    </g>
  );
}
