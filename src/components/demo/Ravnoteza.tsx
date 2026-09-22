'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Komponenta, SilkTekst, Strelica, Vod } from '@/components/ploca/primitivi';
import { Pas } from '@/components/ilustracije/oblici';
import { useAnimacija } from '@/lib/animacija';
import { Klizac, OkvirDemonstracije, PrekidacRezima } from './OkvirDemonstracije';
import stil from './demo.module.css';

/*
  Povratna sprega: izmjeri, izračunaj ispravku, pomjeri, pa opet izmjeri.

  Noge se ne pomjere trenutno — imaju masu. Zbog te inercije premalo
  pojačanje ispravlja sporo, a preveliko pretjera pa se vrati pa opet
  pretjera. To je ono što se na grafiku vidi kao oscilacija.
*/

const PLATFORMA_X = 390;
const PLATFORMA_Y = 300;
const PLATFORMA_POLA = 250;

const MAX_NAGIB = 26;
/** Preko ovoga pas pada. */
const UGAO_PADA = 21;

/** Prigušenje u nogama. Sa njim malo pojačanje znači sporo, a veliko oscilaciju. */
const PRIGUSENJE = 3.2;

const GRAFIK_X = 850;
const GRAFIK_Y = 400;
const GRAFIK_S = 560;
const GRAFIK_V = 150;
const UZORAKA = 190;

/** useSyncExternalStore traži stabilnu referencu, a ovdje nema šta da se mijenja. */
function prazanUpis() {
  return () => {};
}

function imaSenzorZaNagib() {
  const dogadjaj = window.DeviceOrientationEvent as typeof window.DeviceOrientationEvent & {
    requestPermission?: () => Promise<string>;
  };
  if (typeof dogadjaj?.requestPermission !== 'function') return false;
  return navigator.maxTouchPoints > 0 && window.matchMedia('(pointer: coarse)').matches;
}

export function Ravnoteza() {
  const [nagibPlatforme, postaviNagib] = useState(0);
  const [spregaUkljucena, postaviSpregu] = useState(true);
  const [pojacanje, postaviPojacanje] = useState(8);
  const [pao, postaviPao] = useState(false);
  const [senzorUkljucen, postaviSenzorUkljucen] = useState(false);

  const [senzorCuti, postaviSenzorCuti] = useState(false);

  /*
    Dugme za nagib uređaja ne smije da se pojavi na TV-u ni na laptopu.
    Sama provjera dozvole nije dovoljna: Chrome na desktopu takođe ima
    requestPermission, pa se traži i da uređaj bude na dodir.
  */
  const senzorMoguc = useSyncExternalStore(prazanUpis, imaSenzorZaNagib, () => false);

  const stigloSaSenzora = useRef(false);
  const ispravka = useRef(0);
  const brzinaIspravke = useRef(0);
  const istorija = useRef<{ izmjereni: number }[]>(
    Array.from({ length: UZORAKA }, () => ({ izmjereni: 0 })),
  );

  const pasRef = useRef<SVGGElement | null>(null);
  const grafikRef = useRef<SVGPolygonElement | null>(null);
  const linijaRef = useRef<SVGPolylineElement | null>(null);
  const greskaTekstRef = useRef<SVGTextElement | null>(null);

  const nagibRef = useRef(nagibPlatforme);
  const spregaRef = useRef(spregaUkljucena);
  const pojacanjeRef = useRef(pojacanje);
  const paoRef = useRef(pao);
  useEffect(() => {
    nagibRef.current = nagibPlatforme;
    spregaRef.current = spregaUkljucena;
    pojacanjeRef.current = pojacanje;
    paoRef.current = pao;
  }, [nagibPlatforme, spregaUkljucena, pojacanje, pao]);

  useAnimacija((dt) => {
    const platforma = nagibRef.current;

    if (spregaRef.current) {
      /*
        Izmjereni nagib tijela je ono što IMU vidi. P regulator iz njega
        pravi komandu, a noge je izvršavaju sa zakašnjenjem.
      */
      const izmjereni = platforma - ispravka.current;
      const komanda = pojacanjeRef.current * izmjereni;
      brzinaIspravke.current += (komanda - PRIGUSENJE * brzinaIspravke.current) * dt;
      ispravka.current += brzinaIspravke.current * dt;
    } else {
      ispravka.current = 0;
      brzinaIspravke.current = 0;
    }

    const tijelo = spregaRef.current ? platforma - ispravka.current : platforma;

    if (!spregaRef.current && Math.abs(tijelo) > UGAO_PADA && !paoRef.current) postaviPao(true);
    if ((spregaRef.current || Math.abs(tijelo) <= UGAO_PADA) && paoRef.current) postaviPao(false);

    istorija.current.push({ izmjereni: tijelo });
    if (istorija.current.length > UZORAKA) istorija.current.shift();

    const prikazaniNagib = paoRef.current ? Math.sign(tijelo) * 74 : tijelo;
    pasRef.current?.setAttribute(
      'transform',
      `rotate(${prikazaniNagib} ${PLATFORMA_X} ${PLATFORMA_Y})`,
    );

    const tacke = istorija.current.map((u, i) => {
      const x = GRAFIK_X + (i / (UZORAKA - 1)) * GRAFIK_S;
      const y = GRAFIK_Y - (Math.max(-MAX_NAGIB, Math.min(MAX_NAGIB, u.izmjereni)) / MAX_NAGIB) * GRAFIK_V;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });
    linijaRef.current?.setAttribute('points', tacke.join(' '));
    /* Razmak do željene nule je greška — zato je osjenčena. */
    grafikRef.current?.setAttribute(
      'points',
      `${tacke.join(' ')} ${GRAFIK_X + GRAFIK_S},${GRAFIK_Y} ${GRAFIK_X},${GRAFIK_Y}`,
    );
    if (greskaTekstRef.current) {
      greskaTekstRef.current.textContent = `${tijelo >= 0 ? '' : '−'}${Math.abs(tijelo).toFixed(1)}°`;
    }
  });

  /* Nagib iPada: dozvola se mora tražiti iz dodira, ne iz efekta. */
  async function ukljuciSenzor() {
    const dogadjaj = window.DeviceOrientationEvent as typeof window.DeviceOrientationEvent & {
      requestPermission?: () => Promise<string>;
    };
    try {
      const odgovor = await dogadjaj.requestPermission?.();
      if (odgovor !== 'granted') return;
    } catch {
      return;
    }

    window.addEventListener('deviceorientation', naOrijentaciju);
    postaviSenzorUkljucen(true);
    postaviSenzorCuti(false);

    /* Dozvola ne znači da senzor postoji. Ako ništa ne javi, to se kaže. */
    stigloSaSenzora.current = false;
    setTimeout(() => {
      if (!stigloSaSenzora.current) {
        window.removeEventListener('deviceorientation', naOrijentaciju);
        postaviSenzorUkljucen(false);
        postaviSenzorCuti(true);
      }
    }, 1500);
  }

  function naOrijentaciju(dogadjaj: DeviceOrientationEvent) {
    const { beta, gamma } = dogadjaj;
    if (beta === null || gamma === null) return;
    stigloSaSenzora.current = true;

    /*
      beta i gamma su vezani za uređaj, ne za ekran. U landscape-u se
      nagib koji korisnik vidi kao lijevo-desno nalazi u beta, sa znakom
      koji zavisi od toga na koju je stranu ekran okrenut.
    */
    const ugaoEkrana = window.screen.orientation?.angle ?? 0;
    const nagib =
      ugaoEkrana === 90 ? beta : ugaoEkrana === 270 ? -beta : ugaoEkrana === 180 ? -gamma : gamma;

    postaviNagib(Math.max(-MAX_NAGIB, Math.min(MAX_NAGIB, nagib)));
  }

  useEffect(() => () => window.removeEventListener('deviceorientation', naOrijentaciju), []);

  function resetuj() {
    postaviNagib(0);
    postaviSpregu(true);
    postaviPojacanje(8);
    postaviPao(false);
    ispravka.current = 0;
    brzinaIspravke.current = 0;
    istorija.current = Array.from({ length: UZORAKA }, () => ({ izmjereni: 0 }));
  }

  const poruka = !spregaUkljucena
    ? pao
      ? 'Bez povratne sprege tijelo ide zajedno sa platformom — i pas je pao.'
      : 'Povratna sprega je isključena. Tijelo se naginje koliko i platforma.'
    : pojacanje < 4
      ? 'Premalo pojačanje: pas ispravlja, ali sporo stiže do vodoravnog.'
      : pojacanje > 20
        ? 'Preveliko pojačanje: pas pretjera, vrati se, pa opet pretjera — oscilira.'
        : 'Izmjeri, izračunaj ispravku, pomjeri, pa opet izmjeri. Noge drže tijelo vodoravno.';

  return (
    <OkvirDemonstracije
      naslov="Povratna sprega"
      oznaka="XGO · izmjeri, ispravi, pa opet"
      nazadPutanja="/xgo"
      nazadNaziv="XGO psi"
      poruka={poruka}
      alarm={pao}
      napomena={
        senzorCuti
          ? 'Senzor nagiba se ne javlja na ovom uređaju — koristi klizač. Pravi pas koristi složeniji regulator, ali ideja je ista.'
          : senzorUkljucen
            ? 'Nagib dolazi sa uređaja. Pravi pas koristi složeniji regulator, ali ideja je ista.'
            : 'Pravi pas koristi složeniji regulator, ali ideja je ista.'
      }
      onResetuj={resetuj}
      kontrole={
        <>
          <Klizac
            natpis="Nagib"
            vrijednost={Math.round(nagibPlatforme)}
            prikaz={`${Math.round(nagibPlatforme)}°`}
            min={-MAX_NAGIB}
            max={MAX_NAGIB}
            onPromjena={postaviNagib}
          />
          <Klizac
            natpis="Pojačanje"
            vrijednost={pojacanje}
            prikaz={`${pojacanje}`}
            min={1}
            max={30}
            onPromjena={postaviPojacanje}
          />
          <PrekidacRezima ukljucen={spregaUkljucena} onPromjena={postaviSpregu}>
            Povratna sprega
          </PrekidacRezima>
          {senzorMoguc && !senzorUkljucen && !senzorCuti && (
            <button className={stil.dugme} onClick={ukljuciSenzor}>
              Koristi nagib iPada
            </button>
          )}
        </>
      }
    >
      <svg viewBox="0 0 1480 640" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
        {/* --- platforma i pas --- */}
        <g transform={`rotate(${nagibPlatforme} ${PLATFORMA_X} ${PLATFORMA_Y})`}>
          <rect
            x={PLATFORMA_X - PLATFORMA_POLA}
            y={PLATFORMA_Y}
            width={PLATFORMA_POLA * 2}
            height={18}
            rx={5}
            fill="var(--maska-svijetla)"
            stroke="var(--bakar)"
            strokeWidth={4}
          />
        </g>

        <g ref={pasRef}>
          <Pas x={PLATFORMA_X} y={PLATFORMA_Y - 98} skala={0.92} boja={pao ? 'var(--alarm)' : 'var(--silkscreen)'} />
        </g>

        {/* oslonac platforme */}
        <polygon
          points={`${PLATFORMA_X},${PLATFORMA_Y + 16} ${PLATFORMA_X - 34},${PLATFORMA_Y + 82} ${PLATFORMA_X + 34},${PLATFORMA_Y + 82}`}
          fill="var(--maska-svijetla)"
          stroke="var(--bakar)"
          strokeWidth={4}
        />
        <Vod tacke={`${PLATFORMA_X - 260},${PLATFORMA_Y + 82} ${PLATFORMA_X + 260},${PLATFORMA_Y + 82}`} debljina={5} />

        {pao && (
          <SilkTekst x={PLATFORMA_X + 280} y={PLATFORMA_Y - 150} velicina={28} boja="var(--alarm)">
            pao je
          </SilkTekst>
        )}

        {/* --- petlja u tri boje --- */}
        <Petlja spregaUkljucena={spregaUkljucena} />

        {/* --- grafik --- */}
        <SilkTekst x={GRAFIK_X} y={GRAFIK_Y - GRAFIK_V - 46} velicina={22} boja="var(--silkscreen)">
          nagib tijela kroz vrijeme
        </SilkTekst>

        {/* željeni nagib je nula — sve iznad i ispod je greška */}
        <line x1={GRAFIK_X} y1={GRAFIK_Y} x2={GRAFIK_X + GRAFIK_S} y2={GRAFIK_Y}
          stroke="var(--odluci)" strokeWidth={3} strokeDasharray="12 8" />
        <SilkTekst x={GRAFIK_X + GRAFIK_S} y={GRAFIK_Y - 12} desno velicina={17} boja="var(--odluci)">
          željeno 0°
        </SilkTekst>

        <polygon ref={grafikRef} points="" fill="var(--alarm)" opacity={0.2} />
        <polyline ref={linijaRef} points="" fill="none" stroke="var(--osjeti)" strokeWidth={4}
          strokeLinejoin="round" strokeLinecap="round" />

        {[MAX_NAGIB, -MAX_NAGIB].map((v) => (
          <g key={v}>
            <line x1={GRAFIK_X} y1={GRAFIK_Y - (v / MAX_NAGIB) * GRAFIK_V} x2={GRAFIK_X + GRAFIK_S}
              y2={GRAFIK_Y - (v / MAX_NAGIB) * GRAFIK_V} stroke="var(--ivica)" strokeWidth={2} strokeDasharray="4 8" />
            <SilkTekst x={GRAFIK_X - 14} y={GRAFIK_Y - (v / MAX_NAGIB) * GRAFIK_V + 6} desno velicina={15}
              boja="var(--silkscreen-tih)" debljina={400}>
              {v > 0 ? `+${v}°` : `${v}°`}
            </SilkTekst>
          </g>
        ))}

        <SilkTekst x={GRAFIK_X} y={GRAFIK_Y - GRAFIK_V - 16} velicina={17} boja="var(--osjeti)" debljina={400}>
          izmjereni nagib
        </SilkTekst>
        <SilkTekst x={GRAFIK_X + 200} y={GRAFIK_Y - GRAFIK_V - 16} velicina={17} boja="var(--alarm)" debljina={400}>
          osjenčeno = greška
        </SilkTekst>

        <text
          ref={greskaTekstRef}
          x={GRAFIK_X + GRAFIK_S}
          y={GRAFIK_Y - GRAFIK_V - 12}
          textAnchor="end"
          fontSize={30}
          fontWeight={700}
          fill="var(--osjeti)"
          style={{ fontFamily: 'var(--font-mono), ui-monospace, monospace' }}
        />
      </svg>
    </OkvirDemonstracije>
  );
}

/** Ista petlja kao na slajdovima, u tri boje, sa oznakama uloga. */
function Petlja({ spregaUkljucena }: { spregaUkljucena: boolean }) {
  /* Petlja stoji ispod platforme, da se ne sudara sa psom. */
  const y = 476;
  const pola = 84;
  const visina = 72;
  const vrh = y - visina / 2;
  const dno = y + visina / 2;

  const stanice = [
    { x: 140, boja: 'osjeti', natpis: 'IMU', uloga: 'osjeti' },
    { x: 400, boja: 'odluci', natpis: 'PROCESOR', uloga: 'odluči' },
    { x: 660, boja: 'djeluj', natpis: 'MOTORI', uloga: 'djeluj' },
  ];

  return (
    <g opacity={spregaUkljucena ? 1 : 0.32}>
      {stanice.slice(0, -1).map((s, i) => (
        <g key={s.natpis}>
          <Vod
            tacke={`${s.x + pola},${y} ${stanice[i + 1].x - pola},${y}`}
            debljina={5}
            struja={spregaUkljucena ? 'naprijed' : false}
            brzina={0.7}
          />
          <Strelica x={(s.x + pola + stanice[i + 1].x - pola) / 2} y={y} />
        </g>
      ))}

      {/* povratak: motor pomjeri tijelo, senzor to odmah izmjeri */}
      <Vod
        tacke={`660,${dno} 660,${dno + 36} 628,${dno + 60} 172,${dno + 60} 140,${dno + 36} 140,${dno}`}
        debljina={5}
        struja={spregaUkljucena ? 'naprijed' : false}
        brzina={1.1}
      />
      <Strelica x={400} y={dno + 60} ugao={180} />
      <SilkTekst x={400} y={dno + 90} sredina velicina={16} boja="var(--silkscreen-tih)" debljina={400}>
        pa opet izmjeri
      </SilkTekst>

      {stanice.map((s) => (
        <g key={s.natpis}>
          <Komponenta x={s.x - pola} y={vrh} w={pola * 2} h={visina} natpis={s.natpis} boja={`var(--${s.boja})`} noge={2} />
          <SilkTekst x={s.x} y={vrh - 16} sredina velicina={17} boja={`var(--${s.boja})`}>
            {s.uloga}
          </SilkTekst>
        </g>
      ))}
    </g>
  );
}
