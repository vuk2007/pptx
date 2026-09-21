'use client';

import { useEffect, useRef, useState } from 'react';
import { NAPON } from '@/config/cinjenice';
import { Pad, SilkTekst, Vod } from '@/components/ploca/primitivi';
import { Tocak } from '@/components/ilustracije/oblici';
import { primakni, useAnimacija } from '@/lib/animacija';
import { Klizac, OkvirDemonstracije, PrekidacRezima } from './OkvirDemonstracije';

/*
  PWM: motor se ne „prigušuje", nego se pali i gasi toliko brzo da se
  ne vidi. Koliko je dugo upaljen, tolika je srednja vrijednost napona.

  Ovdje je sve usporeno da se vidi, i to piše na ekranu.
*/

/* --- geometrija --- */

/* Odnos stranica je blizak TV-u, da crtež popuni ekran umjesto da se stisne. */
const SIRINA = 1480;
const VISINA = 640;

const X_SIGNAL = 130;
const SIRINA_SIGNAL = 700;
const Y_SIGNAL = 140;
const VISINA_SIGNAL = 130;
const PERIODA = 140; // piksela po jednoj periodi na ekranu

const MOTOR_X = 1120;
const MOTOR_Y = 230;
const R_TOCKA = 96;

const Y_GRAFIK = 580;
const VISINA_GRAFIK = 190;
const BROJ_UZORAKA = 150;

/** Iznad ove struje napajanje popušta i Arduino se može resetovati. */
const PRAG_STRUJE = 0.62;
/** Koliko duty smije da se promijeni u sekundi kad je rampa uključena. */
const RAMPA_PO_SEKUNDI = 0.55;

export function Pwm() {
  const [zadati, postaviZadati] = useState(35);
  const [rampa, postaviRampu] = useState(false);
  const [saPadom, postaviPad] = useState(false);

  /* Sve što se mijenja svaki kadar živi u ref-ovima, da se SVG ne prerenderuje 60 puta u sekundi. */
  const primijenjeni = useRef(0.35);
  const brzinaMotora = useRef(0.35);
  const struja = useRef(0);
  const pomak = useRef(0);
  const istorija = useRef<number[]>(new Array(BROJ_UZORAKA).fill(0));

  const signalRef = useRef<SVGPolylineElement | null>(null);
  const srednjiRef = useRef<SVGLineElement | null>(null);
  const srednjiTekstRef = useRef<SVGTextElement | null>(null);
  const povrsinaRef = useRef<SVGPolygonElement | null>(null);
  const tocakRef = useRef<SVGGElement | null>(null);
  const grafikRef = useRef<SVGPolylineElement | null>(null);
  const upozorenjeRef = useRef<SVGGElement | null>(null);
  const strujaTekstRef = useRef<SVGTextElement | null>(null);

  /* Petlja animacije čita najsvježije vrijednosti kontrola kroz ref-ove. */
  const zadatiRef = useRef(zadati);
  const rampaRef = useRef(rampa);
  useEffect(() => {
    zadatiRef.current = zadati;
    rampaRef.current = rampa;
  }, [zadati, rampa]);

  /* Poruka se mijenja rijetko, pa smije kroz state. */
  const posljednjiPad = useRef(false);
  function postaviPadAkoTreba(preko: boolean) {
    if (preko === posljednjiPad.current) return;
    posljednjiPad.current = preko;
    postaviPad(preko);
  }

  useAnimacija((dt) => {
    const cilj = zadatiRef.current / 100;

    /* Bez rampe klizač odmah stiže na motor. Sa rampom se penje ograničenom brzinom. */
    if (rampaRef.current) {
      const korak = RAMPA_PO_SEKUNDI * dt;
      const razlika = cilj - primijenjeni.current;
      primijenjeni.current += Math.sign(razlika) * Math.min(Math.abs(razlika), korak);
    } else {
      primijenjeni.current = cilj;
    }

    /* Motor ne može da skoči na novu brzinu — ima masu. */
    brzinaMotora.current = primakni(brzinaMotora.current, primijenjeni.current, 1.5, dt);

    /*
      Struja kroz motor zavisi od razlike između napona koji dobija i onoga
      koji sam pravi dok se vrti. Kad duty naglo skoči, ta razlika je velika,
      i to je šiljak koji obara napajanje.
    */
    const razlika = Math.max(0, primijenjeni.current - brzinaMotora.current);
    const trenutna = razlika * 2.1 + brzinaMotora.current * 0.16;
    struja.current = primakni(struja.current, trenutna, 14, dt);

    istorija.current.push(struja.current);
    if (istorija.current.length > BROJ_UZORAKA) istorija.current.shift();

    /* --- crtanje --- */

    pomak.current = (pomak.current + 46 * dt) % PERIODA;
    const tackeTalasa = tackeSignala(primijenjeni.current, pomak.current);
    signalRef.current?.setAttribute('points', tackeTalasa);

    /*
      Osjenčena površina ispod signala je bukvalno ono što motor dobije.
      Za razliku od oznake na fiksnom mjestu, ova je tačna i dok signal klizi.
    */
    const dno = Y_SIGNAL + VISINA_SIGNAL;
    povrsinaRef.current?.setAttribute(
      'points',
      `${tackeTalasa} ${X_SIGNAL + SIRINA_SIGNAL},${dno} ${X_SIGNAL},${dno}`,
    );

    const ySrednji = Y_SIGNAL + VISINA_SIGNAL - primijenjeni.current * VISINA_SIGNAL;
    srednjiRef.current?.setAttribute('y1', String(ySrednji));
    srednjiRef.current?.setAttribute('y2', String(ySrednji));
    if (srednjiTekstRef.current) {
      srednjiTekstRef.current.textContent = `srednji napon ${(primijenjeni.current * NAPON.ulaz).toFixed(1)} V`;
    }

    const ugao = (Number(tocakRef.current?.dataset.ugao ?? 0) + brzinaMotora.current * 520 * dt) % 360;
    if (tocakRef.current) {
      tocakRef.current.dataset.ugao = String(ugao);
      tocakRef.current.setAttribute('transform', `rotate(${ugao} ${MOTOR_X} ${MOTOR_Y})`);
    }

    grafikRef.current?.setAttribute('points', tackeGrafika(istorija.current));
    if (strujaTekstRef.current) strujaTekstRef.current.textContent = `${struja.current.toFixed(2)} A`;

    const preko = struja.current > PRAG_STRUJE;
    upozorenjeRef.current?.setAttribute('opacity', preko ? '1' : '0');
    postaviPadAkoTreba(preko);
  });

  function resetuj() {
    postaviZadati(35);
    postaviRampu(false);
    primijenjeni.current = 0.35;
    brzinaMotora.current = 0.35;
    struja.current = 0;
    istorija.current = new Array(BROJ_UZORAKA).fill(0);
    posljednjiPad.current = false;
    postaviPad(false);
  }

  const poruka = saPadom
    ? 'Nagli skok vuče veliku struju. Napon pada i Arduino se može resetovati.'
    : rampa
      ? 'Sa rampom brzina raste postepeno, pa struja ostaje umjerena.'
      : zadati === 0
        ? 'Duty je 0 %: signal je stalno ugašen i motor stoji.'
        : zadati === 100
          ? 'Duty je 100 %: signal je stalno upaljen i motor ima pun napon.'
          : `Signal je upaljen ${zadati} % vremena, pa motor osjeća ${((zadati / 100) * NAPON.ulaz).toFixed(1)} V.`;

  return (
    <OkvirDemonstracije
      naslov="PWM"
      oznaka="Perjanik · brzina motora"
      nazadPutanja="/perjanik"
      nazadNaziv="Perjanik"
      poruka={poruka}
      alarm={saPadom}
      napomena="Pravi signal se pali i gasi oko 490 puta u sekundi — ovdje je usporeno da se vidi."
      onResetuj={resetuj}
      kontrole={
        <>
          <Klizac
            natpis="Duty"
            vrijednost={zadati}
            prikaz={`${zadati} %`}
            onPromjena={postaviZadati}
          />
          <PrekidacRezima ukljucen={rampa} onPromjena={postaviRampu}>
            Rampa
          </PrekidacRezima>
        </>
      }
    >
      <svg viewBox={`0 0 ${SIRINA} ${VISINA}`} preserveAspectRatio="xMidYMid meet" aria-hidden="true">
        {/* --- pravougaoni signal --- */}
        <SilkTekst x={X_SIGNAL} y={Y_SIGNAL - 40} velicina={22} boja="var(--silkscreen)">
          signal na pinu
        </SilkTekst>

        {/* nivoi */}
        <line x1={X_SIGNAL} y1={Y_SIGNAL} x2={X_SIGNAL + SIRINA_SIGNAL} y2={Y_SIGNAL}
          stroke="var(--ivica)" strokeWidth={2} strokeDasharray="6 8" />
        <line x1={X_SIGNAL} y1={Y_SIGNAL + VISINA_SIGNAL} x2={X_SIGNAL + SIRINA_SIGNAL} y2={Y_SIGNAL + VISINA_SIGNAL}
          stroke="var(--ivica)" strokeWidth={2} strokeDasharray="6 8" />
        <SilkTekst x={X_SIGNAL - 16} y={Y_SIGNAL + 8} desno velicina={18} boja="var(--silkscreen-tih)">
          {NAPON.ulaz} V
        </SilkTekst>
        <SilkTekst x={X_SIGNAL - 16} y={Y_SIGNAL + VISINA_SIGNAL + 8} desno velicina={18} boja="var(--silkscreen-tih)">
          0 V
        </SilkTekst>

        {/* ono što je upaljeno, osjenčeno — to je ono što motor stvarno dobije */}
        <polygon ref={povrsinaRef} points="" fill="var(--bakar-struja)" opacity={0.17} />

        <polyline ref={signalRef} points="" fill="none" stroke="var(--bakar-struja)"
          strokeWidth={5} strokeLinejoin="miter" strokeLinecap="square" />

        {/* mjerilo: kolika je jedna perioda */}
        <g stroke="var(--silkscreen-tih)" strokeWidth={2} fill="none">
          <line x1={X_SIGNAL} y1={Y_SIGNAL + VISINA_SIGNAL + 18} x2={X_SIGNAL} y2={Y_SIGNAL + VISINA_SIGNAL + 30} />
          <line x1={X_SIGNAL + PERIODA} y1={Y_SIGNAL + VISINA_SIGNAL + 18} x2={X_SIGNAL + PERIODA} y2={Y_SIGNAL + VISINA_SIGNAL + 30} />
          <line x1={X_SIGNAL} y1={Y_SIGNAL + VISINA_SIGNAL + 24} x2={X_SIGNAL + PERIODA} y2={Y_SIGNAL + VISINA_SIGNAL + 24} />
        </g>
        <SilkTekst x={X_SIGNAL + PERIODA + 14} y={Y_SIGNAL + VISINA_SIGNAL + 30} velicina={16}
          boja="var(--silkscreen-tih)" debljina={400}>
          jedna perioda
        </SilkTekst>

        {/* srednja vrijednost — ono što motor stvarno osjeti */}
        <line ref={srednjiRef} x1={X_SIGNAL} y1={Y_SIGNAL} x2={X_SIGNAL + SIRINA_SIGNAL} y2={Y_SIGNAL}
          stroke="var(--djeluj)" strokeWidth={4} strokeDasharray="14 10" />
        <text ref={srednjiTekstRef} x={X_SIGNAL + SIRINA_SIGNAL} y={Y_SIGNAL - 26} textAnchor="end"
          fontSize={24} fontWeight={700} fill="var(--djeluj)"
          style={{ fontFamily: 'var(--font-mono), ui-monospace, monospace' }} />

        {/* --- motor --- */}
        <Vod tacke={`${X_SIGNAL + SIRINA_SIGNAL},${MOTOR_Y} ${MOTOR_X - R_TOCKA},${MOTOR_Y}`} debljina={6} struja="naprijed" />
        <g ref={tocakRef} data-ugao="0">
          <Tocak x={MOTOR_X} y={MOTOR_Y} r={R_TOCKA} boja="var(--djeluj)" />
        </g>
        <Pad x={MOTOR_X - R_TOCKA} y={MOTOR_Y} r={10} />
        <SilkTekst x={MOTOR_X} y={MOTOR_Y + R_TOCKA + 44} sredina velicina={22} boja="var(--djeluj)">
          motor
        </SilkTekst>

        {/* --- grafik struje --- */}
        <SilkTekst x={X_SIGNAL} y={Y_GRAFIK - VISINA_GRAFIK - 22} velicina={22} boja="var(--silkscreen)">
          struja kroz motor
        </SilkTekst>

        <Vod tacke={`${X_SIGNAL},${Y_GRAFIK} ${X_SIGNAL + SIRINA_SIGNAL},${Y_GRAFIK}`} debljina={3} />
        <line
          x1={X_SIGNAL}
          y1={Y_GRAFIK - PRAG_STRUJE * VISINA_GRAFIK}
          x2={X_SIGNAL + SIRINA_SIGNAL}
          y2={Y_GRAFIK - PRAG_STRUJE * VISINA_GRAFIK}
          stroke="var(--alarm)"
          strokeWidth={2}
          strokeDasharray="8 8"
          opacity={0.7}
        />
        <SilkTekst x={X_SIGNAL - 16} y={Y_GRAFIK - PRAG_STRUJE * VISINA_GRAFIK + 6} desno velicina={16}
          boja="var(--alarm)" debljina={400}>
          granica
        </SilkTekst>

        <polyline ref={grafikRef} points="" fill="none" stroke="var(--osjeti)" strokeWidth={4}
          strokeLinejoin="round" strokeLinecap="round" />

        <text ref={strujaTekstRef} x={X_SIGNAL + SIRINA_SIGNAL} y={Y_GRAFIK - VISINA_GRAFIK - 22}
          textAnchor="end" fontSize={26} fontWeight={700} fill="var(--osjeti)"
          style={{ fontFamily: 'var(--font-mono), ui-monospace, monospace' }} />

        {/* upozorenje kad struja pređe granicu */}
        <g ref={upozorenjeRef} opacity={0}>
          <rect x={MOTOR_X - 200} y={Y_GRAFIK - 120} width={400} height={104} rx={8}
            fill="var(--alarm)" fillOpacity={0.14} stroke="var(--alarm)" strokeWidth={3} />
          <SilkTekst x={MOTOR_X} y={Y_GRAFIK - 78} sredina velicina={22} boja="var(--alarm)">
            napon pada
          </SilkTekst>
          <SilkTekst x={MOTOR_X} y={Y_GRAFIK - 46} sredina velicina={19} boja="var(--alarm)" debljina={400}>
            Arduino se može resetovati
          </SilkTekst>
        </g>
      </svg>
    </OkvirDemonstracije>
  );
}

/** Pravougaoni signal koji klizi ulijevo, sa zadatim udjelom „upaljeno". */
function tackeSignala(duty: number, pomak: number) {
  const dno = Y_SIGNAL + VISINA_SIGNAL;
  const tacke: string[] = [];
  const stisni = (x: number) => Math.min(X_SIGNAL + SIRINA_SIGNAL, Math.max(X_SIGNAL, x));

  let y = duty > 0 ? Y_SIGNAL : dno;
  tacke.push(`${X_SIGNAL},${y}`);

  for (let i = -1; i * PERIODA - pomak < SIRINA_SIGNAL + PERIODA; i++) {
    const pocetak = X_SIGNAL + i * PERIODA - pomak;
    const prekid = pocetak + duty * PERIODA;
    const kraj = pocetak + PERIODA;

    if (duty > 0 && duty < 1) {
      tacke.push(`${stisni(pocetak)},${Y_SIGNAL}`, `${stisni(prekid)},${Y_SIGNAL}`);
      tacke.push(`${stisni(prekid)},${dno}`, `${stisni(kraj)},${dno}`);
      tacke.push(`${stisni(kraj)},${Y_SIGNAL}`);
      y = Y_SIGNAL;
    } else {
      y = duty >= 1 ? Y_SIGNAL : dno;
      tacke.push(`${stisni(pocetak)},${y}`, `${stisni(kraj)},${y}`);
    }
  }

  tacke.push(`${X_SIGNAL + SIRINA_SIGNAL},${y}`);
  return tacke.join(' ');
}

function tackeGrafika(uzorci: number[]) {
  const korak = SIRINA_SIGNAL / (BROJ_UZORAKA - 1);
  return uzorci
    .map((v, i) => {
      const y = Y_GRAFIK - Math.min(1.1, v) * VISINA_GRAFIK;
      return `${(X_SIGNAL + i * korak).toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
}
