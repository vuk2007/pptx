'use client';

import { useEffect, useRef, useState } from 'react';
import { SilkTekst, Vod } from '@/components/ploca/primitivi';
import { primakni, useAnimacija } from '@/lib/animacija';
import { Klizac, OkvirDemonstracije, PrekidacRezima } from './OkvirDemonstracije';

/*
  Dva servoa postavljena kao ogledalo, sa zajedničkom osovinom.

  Servo B je okrenut suprotno, pa isti broj stepeni kod njega znači suprotan
  smjer. Da bi obojica vukla osovinu na istu stranu, B mora dobiti 180 − A.
  Ako obojica dobiju isti ugao, guraju jedan protiv drugog i peku se.
*/

const OSOVINA_X = 620;
const OSOVINA_Y = 290;
const DUZINA_RUKE = 168;

const SERVO_A = { x: 396, y: 230, w: 134, h: 120 };
const SERVO_B = { x: 710, y: 230, w: 134, h: 120 };

const MJERAC_X = 1050;

/* Impulsi */
const X_IMPULSA = 70;
const PX_PO_MS = 150;
const Y_A = 512;
const Y_B = 604;
const VISINA_IMPULSA = 54;

/** Širina impulsa u milisekundama za dati ugao: 0° → 1 ms, 180° → 2 ms. */
function sirinaImpulsa(ugao: number) {
  return 1 + ugao / 180;
}

export function Servo() {
  const [ugaoA, postaviUgaoA] = useState(40);
  const [greska, postaviGresku] = useState(false);

  const ugaoB = greska ? ugaoA : 180 - ugaoA;

  /* Svaki servo hoće svoj ugao osovine. B je okrenut, pa mu se ugao ogleda. */
  const zeljaA = ugaoA;
  const zeljaB = 180 - ugaoB;
  const neslaganje = Math.abs(zeljaA - zeljaB);

  /* Kad se ne slažu, osovina stoji na sredini i nijedan ne pobjeđuje. */
  const ciljOsovine = neslaganje < 1 ? zeljaA : (zeljaA + zeljaB) / 2;

  const osovina = useRef(40);
  const struja = useRef(0);
  const temperatura = useRef(0);
  const vrijeme = useRef(0);
  const [dimi, postaviDim] = useState(false);
  const dimiRef = useRef(false);

  const rukaRef = useRef<SVGGElement | null>(null);
  const strujaRef = useRef<SVGRectElement | null>(null);
  const strujaTekstRef = useRef<SVGTextElement | null>(null);
  const tempRef = useRef<SVGRectElement | null>(null);
  const tempTekstRef = useRef<SVGTextElement | null>(null);
  const dimRef = useRef<SVGGElement | null>(null);

  /* Petlja animacije čita najsvježije vrijednosti kroz ref-ove. */
  const ciljRef = useRef(ciljOsovine);
  const neslaganjeRef = useRef(neslaganje);
  useEffect(() => {
    ciljRef.current = ciljOsovine;
    neslaganjeRef.current = neslaganje;
  }, [ciljOsovine, neslaganje]);

  useAnimacija((dt) => {
    vrijeme.current += dt;

    osovina.current = primakni(osovina.current, ciljRef.current, 6, dt);
    rukaRef.current?.setAttribute('transform', `rotate(${-osovina.current} ${OSOVINA_X} ${OSOVINA_Y})`);

    /*
      Struja je mala dok servoi samo drže teret. Čim se posvađaju oko ugla,
      obojica guraju punom snagom u suprotne strane i struja skoči.
    */
    const borba = neslaganjeRef.current / 180;
    const cilj = 0.12 + borba * 0.88;
    struja.current = primakni(struja.current, cilj, 5, dt);

    /* Toplota se skuplja dok struja stoji visoko, i polako odlazi kad padne. */
    const grijanje = (struja.current - 0.3) * 0.5;
    temperatura.current = Math.max(0, Math.min(1, temperatura.current + grijanje * dt));

    strujaRef.current?.setAttribute('width', String(struja.current * 300));
    tempRef.current?.setAttribute('width', String(temperatura.current * 300));
    if (strujaTekstRef.current) strujaTekstRef.current.textContent = `${(struja.current * 2.4).toFixed(2)} A`;
    if (tempTekstRef.current) {
      tempTekstRef.current.textContent = `${Math.round(25 + temperatura.current * 95)} °C`;
    }

    const treba = temperatura.current > 0.68;
    if (treba !== dimiRef.current) {
      dimiRef.current = treba;
      postaviDim(treba);
    }

    if (dimRef.current) {
      dimRef.current.setAttribute('opacity', treba ? String(Math.min(1, (temperatura.current - 0.68) * 5)) : '0');
      const podizanje = (vrijeme.current * 34) % 70;
      dimRef.current.setAttribute('transform', `translate(0 ${-podizanje})`);
    }
  });

  function resetuj() {
    postaviUgaoA(40);
    postaviGresku(false);
    osovina.current = 40;
    struja.current = 0;
    temperatura.current = 0;
    dimiRef.current = false;
    postaviDim(false);
  }

  const poruka = greska
    ? neslaganje < 1
      ? 'Na 90° se slučajno slažu, pa ništa ne gori. Pomjeri klizač i vidi šta biva.'
      : dimi
        ? 'Isti ugao na ogledalo-postavljenim servoima = borba = pregoreli motori. Rješenje: B = 180 − A.'
        : 'Servoi guraju jedan protiv drugog. Osovina stoji, a struja i temperatura rastu.'
    : `B = 180 − A, pa oba servoa okreću osovinu na istu stranu. Ruka je na ${Math.round(ugaoA)}°.`;

  return (
    <OkvirDemonstracije
      naslov="Dvostruki servo"
      oznaka="Perjanik · rame robotske ruke"
      nazadPutanja="/perjanik"
      nazadNaziv="Perjanik"
      poruka={poruka}
      alarm={greska && neslaganje >= 1}
      napomena="Struja i temperatura su ilustrativne. Servo očekuje impuls svakih 20 ms; širina impulsa, otprilike 1 do 2 ms, određuje ugao."
      onResetuj={resetuj}
      kontrole={
        <>
          <Klizac natpis="Ugao A" vrijednost={ugaoA} prikaz={`${ugaoA}°`} min={0} max={180} onPromjena={postaviUgaoA} />
          <PrekidacRezima ukljucen={greska} onPromjena={postaviGresku}>
            Greška: B = A
          </PrekidacRezima>
        </>
      }
    >
      <svg viewBox="0 0 1480 640" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
        {/* --- dva servoa, okrenuta jedan prema drugom --- */}
        {[
          { kutija: SERVO_A, naziv: 'SERVO A', ugao: ugaoA, boja: 'var(--osjeti)', strelicaLijevo: false },
          { kutija: SERVO_B, naziv: 'SERVO B', ugao: ugaoB, boja: 'var(--odluci)', strelicaLijevo: true },
        ].map((servo) => (
          <g key={servo.naziv}>
            <rect
              x={servo.kutija.x}
              y={servo.kutija.y}
              width={servo.kutija.w}
              height={servo.kutija.h}
              rx={8}
              fill="var(--maska-svijetla)"
              stroke={greska && neslaganje >= 1 ? 'var(--alarm)' : servo.boja}
              strokeWidth={4}
            />
            <SilkTekst x={servo.kutija.x + servo.kutija.w / 2} y={servo.kutija.y + 44} sredina velicina={19} boja={servo.boja}>
              {servo.naziv}
            </SilkTekst>
            <text
              x={servo.kutija.x + servo.kutija.w / 2}
              y={servo.kutija.y + 88}
              textAnchor="middle"
              fontSize={34}
              fontWeight={700}
              fill={servo.boja}
              style={{ fontFamily: 'var(--font-mono), ui-monospace, monospace' }}
            >
              {Math.round(servo.ugao)}°
            </text>
            {/* strelica koja pokazuje kako je servo okrenut */}
            <path
              d={
                servo.strelicaLijevo
                  ? `M${servo.kutija.x + 26},${servo.kutija.y + servo.kutija.h - 18} l22,0 l-11,-14 Z`
                  : `M${servo.kutija.x + servo.kutija.w - 26},${servo.kutija.y + servo.kutija.h - 18} l-22,0 l11,-14 Z`
              }
              fill={servo.boja}
              opacity={0.7}
            />
          </g>
        ))}

        <SilkTekst x={(SERVO_A.x + SERVO_B.x + SERVO_B.w) / 2} y={SERVO_A.y + SERVO_A.h + 30} sredina velicina={17}
          boja="var(--silkscreen-tih)" debljina={400}>
          okrenuti jedan prema drugom
        </SilkTekst>

        {/* zajednička osovina */}
        <rect x={SERVO_A.x + SERVO_A.w} y={OSOVINA_Y - 11} width={SERVO_B.x - (SERVO_A.x + SERVO_A.w)} height={22}
          rx={6} fill="var(--maska-duboka)" stroke="var(--bakar)" strokeWidth={4} />
        <SilkTekst x={OSOVINA_X} y={OSOVINA_Y + 42} sredina velicina={16} boja="var(--bakar-struja)">
          zajednička osovina
        </SilkTekst>

        {/* šta koji servo HOĆE — vidi se tek kad se ne slažu */}
        {greska && neslaganje >= 1 && (
          <g opacity={0.55}>
            <ZeljaServa ugao={zeljaA} boja="var(--osjeti)" />
            <ZeljaServa ugao={zeljaB} boja="var(--odluci)" />
          </g>
        )}

        {/* ruka */}
        <g ref={rukaRef}>
          <line x1={OSOVINA_X} y1={OSOVINA_Y} x2={OSOVINA_X + DUZINA_RUKE} y2={OSOVINA_Y}
            stroke={greska && neslaganje >= 1 ? 'var(--alarm)' : 'var(--djeluj)'} strokeWidth={13} strokeLinecap="round" />
          <line x1={OSOVINA_X + DUZINA_RUKE} y1={OSOVINA_Y} x2={OSOVINA_X + DUZINA_RUKE + 30} y2={OSOVINA_Y - 22}
            stroke={greska && neslaganje >= 1 ? 'var(--alarm)' : 'var(--djeluj)'} strokeWidth={9} strokeLinecap="round" />
          <line x1={OSOVINA_X + DUZINA_RUKE} y1={OSOVINA_Y} x2={OSOVINA_X + DUZINA_RUKE + 30} y2={OSOVINA_Y + 22}
            stroke={greska && neslaganje >= 1 ? 'var(--alarm)' : 'var(--djeluj)'} strokeWidth={9} strokeLinecap="round" />
        </g>
        <circle cx={OSOVINA_X} cy={OSOVINA_Y} r={16} fill="var(--maska-duboka)" stroke="var(--bakar)" strokeWidth={5} />

        {/* dim kad pregori */}
        <g ref={dimRef} opacity={0}>
          {[SERVO_A, SERVO_B].map((kutija, i) => (
            <g key={i}>
              {[0, 1, 2].map((j) => (
                <circle
                  key={j}
                  cx={kutija.x + kutija.w / 2 + (j - 1) * 16}
                  cy={kutija.y - 16 - j * 26}
                  r={14 + j * 6}
                  fill="var(--silkscreen-tih)"
                  opacity={0.4 - j * 0.1}
                />
              ))}
            </g>
          ))}
        </g>

        {/* --- mjerači --- */}
        <Mjerac
          x={MJERAC_X}
          y={170}
          naziv="struja"
          boja="var(--alarm)"
          trakaRef={strujaRef}
          tekstRef={strujaTekstRef}
        />
        <Mjerac
          x={MJERAC_X}
          y={300}
          naziv="temperatura"
          boja="var(--djeluj)"
          trakaRef={tempRef}
          tekstRef={tempTekstRef}
        />
        {dimi && (
          <SilkTekst x={MJERAC_X} y={396} velicina={22} boja="var(--alarm)">
            motori se peku
          </SilkTekst>
        )}

        {/* --- impulsi --- */}
        <SilkTekst x={X_IMPULSA} y={Y_A - VISINA_IMPULSA - 44} velicina={20} boja="var(--silkscreen)">
          impuls koji ide servou
        </SilkTekst>

        <Impuls y={Y_A} naziv="A" ugao={ugaoA} boja="var(--osjeti)" />
        <Impuls y={Y_B} naziv="B" ugao={ugaoB} boja="var(--odluci)" sOznakama />

        <SilkTekst x={980} y={Y_A - 30} velicina={18} boja="var(--silkscreen-tih)" debljina={400}>
          impuls stiže svakih 20 ms
        </SilkTekst>
        <SilkTekst x={980} y={Y_A + 2} velicina={18} boja="var(--silkscreen-tih)" debljina={400}>
          širina, oko 1 do 2 ms,
        </SilkTekst>
        <SilkTekst x={980} y={Y_A + 34} velicina={18} boja="var(--silkscreen-tih)" debljina={400}>
          određuje ugao
        </SilkTekst>
        <SilkTekst x={980} y={Y_B + 20} velicina={16} boja="var(--silkscreen-tih)" debljina={400}>
          uvećano: vide se prva 3 ms
        </SilkTekst>
      </svg>
    </OkvirDemonstracije>
  );
}

/* ------------------------------------------------------------------ dijelovi */

/** Ugao koji jedan servo pokušava da nametne osovini. */
function ZeljaServa({ ugao, boja }: { ugao: number; boja: string }) {
  const rad = (-ugao * Math.PI) / 180;
  return (
    <g>
      <line
        x1={OSOVINA_X}
        y1={OSOVINA_Y}
        x2={OSOVINA_X + Math.cos(rad) * DUZINA_RUKE}
        y2={OSOVINA_Y + Math.sin(rad) * DUZINA_RUKE}
        stroke={boja}
        strokeWidth={6}
        strokeDasharray="12 9"
        strokeLinecap="round"
      />
    </g>
  );
}

function Mjerac({
  x,
  y,
  naziv,
  boja,
  trakaRef,
  tekstRef,
}: {
  x: number;
  y: number;
  naziv: string;
  boja: string;
  trakaRef: React.Ref<SVGRectElement>;
  tekstRef: React.Ref<SVGTextElement>;
}) {
  return (
    <g>
      <SilkTekst x={x} y={y - 18} velicina={20} boja="var(--silkscreen-tih)">
        {naziv}
      </SilkTekst>
      <rect x={x} y={y} width={300} height={34} rx={5} fill="var(--maska-duboka)" stroke="var(--bakar)" strokeWidth={2} />
      <rect ref={trakaRef} x={x} y={y} width={0} height={34} rx={5} fill={boja} opacity={0.8} />
      <text
        ref={tekstRef}
        x={x + 320}
        y={y + 26}
        fontSize={28}
        fontWeight={700}
        fill={boja}
        style={{ fontFamily: 'var(--font-mono), ui-monospace, monospace' }}
      />
    </g>
  );
}

/**
 * Impuls u uvećanom prikazu: vide se prva tri milisekunda, pa prelom,
 * pa početak sljedećeg impulsa — jer prava perioda od 20 ms ne bi stala.
 */
function Impuls({
  y,
  naziv,
  ugao,
  boja,
  sOznakama = false,
}: {
  y: number;
  naziv: string;
  ugao: number;
  boja: string;
  sOznakama?: boolean;
}) {
  const sirina = sirinaImpulsa(ugao);
  const kraj = X_IMPULSA + sirina * PX_PO_MS;
  const prelom = X_IMPULSA + 3 * PX_PO_MS;
  const gore = y - VISINA_IMPULSA;

  return (
    <g>
      <SilkTekst x={X_IMPULSA - 16} y={y - 16} desno velicina={20} boja={boja}>
        {naziv}
      </SilkTekst>

      {/* referentne oznake za 1 ms i 2 ms; ispisane su samo ispod donjeg impulsa */}
      {[1, 2].map((ms) => (
        <g key={ms}>
          <line x1={X_IMPULSA + ms * PX_PO_MS} y1={gore - 10} x2={X_IMPULSA + ms * PX_PO_MS} y2={y + 10}
            stroke="var(--ivica)" strokeWidth={2} strokeDasharray="4 6" />
          {sOznakama && (
            <SilkTekst x={X_IMPULSA + ms * PX_PO_MS} y={y + 30} sredina velicina={15}
              boja="var(--silkscreen-tih)" debljina={400}>
              {ms} ms
            </SilkTekst>
          )}
        </g>
      ))}

      <polyline
        points={`${X_IMPULSA},${y} ${X_IMPULSA},${gore} ${kraj},${gore} ${kraj},${y} ${prelom - 22},${y}`}
        fill="none"
        stroke={boja}
        strokeWidth={5}
        strokeLinejoin="miter"
      />

      {/* prelom: između ovog i sljedećeg impulsa prođe 20 ms */}
      <polyline
        points={`${prelom - 22},${y} ${prelom - 12},${y - 14} ${prelom + 2},${y + 14} ${prelom + 12},${y}`}
        fill="none"
        stroke="var(--silkscreen-tih)"
        strokeWidth={3}
      />
      <polyline
        points={`${prelom + 12},${y} ${prelom + 52},${y} ${prelom + 52},${gore} ${prelom + 96},${gore} ${prelom + 96},${y} ${prelom + 130},${y}`}
        fill="none"
        stroke={boja}
        strokeWidth={5}
        strokeLinejoin="miter"
        opacity={0.5}
      />

      <Vod tacke={`${X_IMPULSA},${y} ${prelom - 22},${y}`} debljina={2} boja="var(--ivica)" />

      <text
        x={kraj + 14}
        y={gore + 22}
        fontSize={22}
        fontWeight={700}
        fill={boja}
        style={{ fontFamily: 'var(--font-mono), ui-monospace, monospace' }}
      >
        {sirina.toFixed(2)} ms
      </text>
    </g>
  );
}
