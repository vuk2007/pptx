'use client';

import { useEffect, useRef, useState } from 'react';
import { PIPELINE_GDJE, PIPELINE_VREMENA } from '@/config/cinjenice';
import { useAnimacija } from '@/lib/animacija';
import { ms, napraviRaspored, porukaPipelinea, type Faza, type Traka } from '@/lib/pipeline';
import {
  Napomena,
  Ocitavanja,
  Ocitavanje,
  Okvir,
  PanelKontrola,
  StatusLinija,
  Taster,
  instrumentStil,
} from '@/components/instrument/Okvir';
import stil from './sema.module.css';
import pl from './pipeline.module.css';

/*
  Gantov dijagram u milisekundama: dvije trake, iste faze, isti posao.
  Razlika je samo u tome kad zvučnik smije da progovori, zato su obje
  na istoj vremenskoj osi i razlika se vidi kao kota između dvije prve riječi.
*/

const raspored = napraviRaspored(PIPELINE_VREMENA);

/** Osa ide do prve pune pola sekunde poslije kraja, da „zvučnik govori" ima gdje da se nastavi. */
const KORAK_MS = 500;
const OSA_MS = Math.ceil((raspored.ukupno * 1000 + 300) / KORAK_MS) * KORAK_MS;

const X0 = 200;
const X1 = 970;
const uX = (s: number) => X0 + ((s * 1000) / OSA_MS) * (X1 - X0);

const RED = { cekanje: 130, streaming: 330 } as const;
const VISINA = 58;
const POMAK_POZADINE = VISINA + 12;
const VISINA_POZADINE = 30;
const Y_OSA = 480;

const IME: Record<string, string> = {
  budjenje: 'budi se',
  'glas-u-tekst': 'glas→tekst',
  mozak: 'mozak',
  'mozak-ostatak': 'mozak piše dalje',
  'tekst-u-glas': 'tekst→glas',
};

const GDJE: Record<string, 'lokalno' | 'oblak' | null> = {
  budjenje: PIPELINE_GDJE.budjenje,
  'glas-u-tekst': PIPELINE_GDJE.glasUTekst,
  mozak: PIPELINE_GDJE.mozak,
  'tekst-u-glas': PIPELINE_GDJE.tekstUGlas,
};

const KLASA: Record<Faza['boja'], string> = { osjeti: pl.osjeti, odluci: pl.odluci, djeluj: pl.djeluj };

export function Pipeline() {
  const [t, postaviT] = useState<number | null>(null);
  const [ide, postaviIde] = useState(false);
  const vrijeme = useRef(0);
  const kadar = useRef(0);
  const glavaRef = useRef<SVGGElement | null>(null);
  const odsjecakRef = useRef<SVGRectElement | null>(null);
  const satRef = useRef<SVGTextElement | null>(null);

  function nacrtaj(s: number) {
    const x = uX(s);
    glavaRef.current?.setAttribute('transform', `translate(${x} 0)`);
    odsjecakRef.current?.setAttribute('width', String(Math.max(0, x - X0)));
    if (satRef.current) satRef.current.textContent = ms(s);
  }

  useAnimacija((dt) => {
    const kraj = OSA_MS / 1000;
    vrijeme.current = Math.min(kraj, vrijeme.current + dt);
    nacrtaj(vrijeme.current);
    const gotovo = vrijeme.current >= kraj;
    if (gotovo) postaviIde(false);
    if (gotovo || ++kadar.current % 5 === 0) postaviT(vrijeme.current);
  }, ide);

  function pokreni() {
    vrijeme.current = 0;
    nacrtaj(0);
    postaviT(0);
    postaviIde(true);
  }

  function naResetuj() {
    postaviIde(false);
    vrijeme.current = 0;
    nacrtaj(0);
    postaviT(null);
  }

  const ideRef = useRef(ide);
  useEffect(() => {
    ideRef.current = ide;
  }, [ide]);
  useEffect(() => {
    const naTaster = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key.toLowerCase();
      if (k === 'arrowright' || k === 'pagedown' || k === '1') {
        if (!ideRef.current) pokreni();
      } else if (k === 'r') naResetuj();
      else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', naTaster);
    return () => window.removeEventListener('keydown', naTaster);
    // Slušalac se postavlja jednom; stanje se čita kroz ref.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const poruka = porukaPipelinea(raspored, t);

  return (
    <Okvir
      nazad={{ naziv: 'Jarvis', putanja: '/sajam/jarvis' }}
      naslov="Pipeline i brzina"
      uvod="Jarvis ne čeka cio odgovor: počne da govori čim je gotova prva rečenica."
      onResetuj={naResetuj}
      status={<StatusLinija sta={poruka.sta} zasto={poruka.zasto} />}
      sema={
        <svg viewBox="0 0 1000 540" role="img" aria-label="Gantov dijagram: čeka se sve i streaming, na istoj osi u milisekundama">
          <defs>
            <clipPath id="pipeline-proteklo">
              <rect ref={odsjecakRef} x={X0} y={0} width={0} height={540} />
            </clipPath>
          </defs>

          <Osa />
          {[raspored.cekanje, raspored.streaming].map((traka) => (
            <TrakaCrtez key={traka.id} traka={traka} y={RED[traka.id]} />
          ))}
          <Razlika />

          {/* glava: trenutno vrijeme, prelazi preko svega */}
          <g ref={glavaRef} transform={`translate(${X0} 0)`} visibility={t === null ? 'hidden' : 'visible'}>
            <line x1={0} y1={46} x2={0} y2={Y_OSA} className={pl.glava} />
            <text ref={satRef} x={0} y={36} textAnchor="middle" className={pl.sat}>
              0 ms
            </text>
          </g>
        </svg>
      }
      strana={
        <>
          <Ocitavanja>
            <Ocitavanje natpis="Prva riječ, čeka se sve" vrijednost={String(Math.round(raspored.cekanje.prviZvuk * 1000))} jedinica="ms" pod="poslije cijelog odgovora" />
            <Ocitavanje natpis="Prva riječ, streaming" vrijednost={String(Math.round(raspored.streaming.prviZvuk * 1000))} jedinica="ms" pod="poslije prve rečenice" />
            <Ocitavanje
              natpis="Ušteda"
              vrijednost={String(Math.round(raspored.ustedjeno * 1000))}
              jedinica="ms"
              pod="mozak od prve rečenice do kraja"
            />
            <Ocitavanje
              natpis="Mozak gotov"
              vrijednost={String(Math.round(raspored.streaming.mozakGotov * 1000))}
              jedinica="ms"
              pod="isto u obje trake"
            />
          </Ocitavanja>

          <PanelKontrola>
            <div className={instrumentStil.redTastera}>
              <Taster boja="text" onClick={pokreni} disabled={ide}>
                {t === null ? 'Pokreni' : 'Pokreni ponovo'}
              </Taster>
            </div>
          </PanelKontrola>

          <Napomena>
            Vremena su ilustrativna, a glava ide u stvarnoj brzini. Faza bez oznake lokalno ili oblak znači da to još nije provjereno.
          </Napomena>
        </>
      }
    />
  );
}

function Osa() {
  const podioci: number[] = [];
  for (let m = 0; m <= OSA_MS; m += KORAK_MS) podioci.push(m);
  return (
    <g>
      {podioci.map((m) => {
        const x = uX(m / 1000);
        return (
          <g key={m}>
            <line x1={x} y1={60} x2={x} y2={Y_OSA} className={pl.mreza} />
            <line x1={x} y1={Y_OSA} x2={x} y2={Y_OSA + 8} className={stil.zica} />
            <text x={x} y={Y_OSA + 30} textAnchor="middle" className={pl.oznaka}>
              {m}
            </text>
          </g>
        );
      })}
      <line x1={X0} y1={Y_OSA} x2={X1} y2={Y_OSA} className={stil.zica} />
      <text x={X1} y={Y_OSA + 54} textAnchor="end" className={stil.tih}>
        ms od kad si rekao „Jarvis”
      </text>
    </g>
  );
}

function TrakaCrtez({ traka, y }: { traka: Traka; y: number }) {
  const xZvuk = uX(traka.prviZvuk);
  return (
    <g>
      <text x={X0 - 20} y={y + 26} textAnchor="end" className={stil.tekstVeliki}>
        {traka.naziv}
      </text>
      <text x={X0 - 20} y={y + 48} textAnchor="end" className={stil.tih}>
        {traka.id === 'cekanje' ? 'progovori na kraju' : 'progovori usput'}
      </text>

      {traka.faze.map((f) => (
        <FazaCrtez key={f.id} faza={f} y={y} />
      ))}

      {/* zvučnik govori od prve riječi nadalje; koliko dugo, ne tvrdimo */}
      <line x1={xZvuk} y1={y + VISINA / 2} x2={X1} y2={y + VISINA / 2} className={pl.govor} />
      <text x={xZvuk + 10} y={y + VISINA / 2 - 8} className={pl.govorTekst}>
        zvučnik govori
      </text>

      <line x1={xZvuk} y1={y - 34} x2={xZvuk} y2={y + VISINA + 6} className={pl.prvaRijec} />
      <text x={xZvuk} y={y - 42} textAnchor="middle" className={pl.prvaRijecTekst}>
        prva riječ, {ms(traka.prviZvuk)}
      </text>
    </g>
  );
}

/** Gruba širina teksta u pikselima crteža, dovoljna da se odluči staje li natpis u traku. */
const sirinaTeksta = (tekst: string, velicina: number) => tekst.length * velicina * 0.55;

function FazaCrtez({ faza, y }: { faza: Faza; y: number }) {
  const x = uX(faza.pocetak);
  const sirina = uX(faza.kraj) - x;
  const pozadinska = faza.upozadini === true;
  const gore = pozadinska ? y + POMAK_POZADINE : y;
  const visina = pozadinska ? VISINA_POZADINE : VISINA;
  const ime = IME[faza.id] ?? faza.naziv;
  const gdje = pozadinska ? null : GDJE[faza.id];
  const trajanje = `${Math.round((faza.kraj - faza.pocetak) * 1000)} ms${gdje ? `, ${gdje}` : ''}`;
  const klasa = KLASA[faza.boja];

  /* Ime ide u traku krupno, pa sitnije, a tek kad ni tako ne staje, iznad nje. */
  const imeKrupno = sirinaTeksta(ime, 17) + 12 < sirina;
  const imeUnutra = imeKrupno || sirinaTeksta(ime, 13) + 8 < sirina;
  const trajanjeUnutra = sirinaTeksta(trajanje, 13) + 8 < sirina;

  return (
    <g className={klasa}>
      <rect x={x} y={gore} width={sirina} height={visina} rx={3} className={pozadinska ? pl.pozadina : pl.okvir} />
      <g clipPath="url(#pipeline-proteklo)">
        <rect x={x} y={gore} width={sirina} height={visina} rx={3} className={pl.ispuna} />
      </g>
      {pozadinska ? (
        <text x={x + 10} y={gore + visina / 2 + 5} className={pl.imeMalo}>
          {ime}, {trajanje}
        </text>
      ) : (
        <>
          <text
            x={imeUnutra ? x + sirina / 2 : x}
            y={imeUnutra ? gore + 26 : gore - 10}
            textAnchor={imeUnutra ? 'middle' : 'start'}
            className={imeKrupno || !imeUnutra ? pl.ime : pl.imeSitno}
          >
            {ime}
          </text>
          {trajanjeUnutra && (
            <text x={x + sirina / 2} y={gore + (imeUnutra ? 46 : visina / 2 + 5)} textAnchor="middle" className={pl.trajanje}>
              {trajanje}
            </text>
          )}
        </>
      )}
    </g>
  );
}

/** Kota između dvije prve riječi: to je cijela poenta. */
function Razlika() {
  const a = uX(raspored.streaming.prviZvuk);
  const b = uX(raspored.cekanje.prviZvuk);
  const y = 262;
  return (
    <g>
      <line x1={a} y1={y} x2={b} y2={y} className={pl.kota} />
      <polygon points={`${a},${y} ${a + 11},${y - 5} ${a + 11},${y + 5}`} className={pl.vrh} />
      <polygon points={`${b},${y} ${b - 11},${y - 5} ${b - 11},${y + 5}`} className={pl.vrh} />
      <text x={(a + b) / 2} y={y - 10} textAnchor="middle" className={pl.kotaTekst}>
        {ms(raspored.ustedjeno)} ranije
      </text>
    </g>
  );
}
