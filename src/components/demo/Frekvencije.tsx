'use client';

import { useEffect, useRef, useState } from 'react';
import { RADIO_VEZE } from '@/config/cinjenice';
import { useAnimacija } from '@/lib/animacija';
import { broj } from '@/lib/format';
import { C, duzinaUCm, prolazKrozZid, uTacke, uzorkujTalas } from '@/lib/talasi';
import {
  Napomena,
  Ocitavanja,
  Ocitavanje,
  Okvir,
  Rezimi,
  StatusLinija,
} from '@/components/instrument/Okvir';
import stil from './sema.module.css';
import fr from './frekvencije.module.css';

/*
  Tri radija na štandu, nacrtana istim lenjirom.

  Sva tri putuju istom brzinom, pa se šare pomjeraju istom brzinom u
  pikselima; razlikuje se samo dužina jednog talasa, i zato duži talas
  i sporije titra (f = c / λ). Zid pokazuje samo smjer: duži talas
  prolazi lakše. Koliko tačno, zavisi od zida i ne tvrdi se brojem.
*/

const X0 = 40;
const X1 = 960;
/** Koliko centimetara stane u širinu crteža. */
const SIRINA_CM = 130;
const PX_PO_CM = (X1 - X0) / SIRINA_CM;

const REDOVI = [120, 270, 420];
const AMPLITUDA = 34;
const ZID_CM = 78;
const ZID_X = X0 + ZID_CM * PX_PO_CM;
const ZID_SIRINA = 22;
const Y_LENJIR = 500;

/** Sve šare putuju istom brzinom, u pikselima po sekundi: jako usporena svjetlost. */
const BRZINA_PX = 110;
/** Koliko pravom talasu treba da pređe širinu crteža, ns. */
const NS_ZA_CRTEZ = ((SIRINA_CM / 100) / C) * 1e9;

const VEZE = RADIO_VEZE.map((v) => {
  const cm = duzinaUCm(v.mhz);
  return { ...v, cm, duzinaPx: cm * PX_PO_CM, prolaz: prolazKrozZid(cm) };
});
const najduzi = VEZE.reduce((a, b) => (a.cm >= b.cm ? a : b));
const najkraci = VEZE.reduce((a, b) => (a.cm <= b.cm ? a : b));
const ODNOS = broj(najduzi.cm / najkraci.cm, 1);

const REZIMI = [
  { id: 'slobodno', natpis: 'Slobodan prostor' },
  { id: 'zid', natpis: 'Kroz zid' },
] as const;

const cm = (v: number) => `${broj(v, 1)} cm`;

export function Frekvencije() {
  const [zid, postaviZid] = useState(false);
  const zidRef = useRef(zid);
  const pomak = useRef(0);
  const linije = useRef<(SVGPolylineElement | null)[]>([]);

  useEffect(() => {
    zidRef.current = zid;
  }, [zid]);

  function nacrtaj() {
    VEZE.forEach((veza, i) => {
      const linija = linije.current[i];
      if (!linija) return;
      /* Iza zida talas ide dalje, samo slabiji; faza se ne prekida. */
      const prigusenje = zidRef.current ? veza.prolaz : 1;
      const tacke = uzorkujTalas({
        x0: X0,
        x1: X1,
        y: REDOVI[i],
        amplituda: (x: number) => (x < ZID_X ? AMPLITUDA : AMPLITUDA * prigusenje),
        duzinaPx: veza.duzinaPx,
        faza: (2 * Math.PI * pomak.current) / veza.duzinaPx,
        korak: 2,
      });
      linija.setAttribute('points', uTacke(tacke));
    });
  }

  useAnimacija((dt) => {
    pomak.current += BRZINA_PX * dt;
    nacrtaj();
  });

  useEffect(() => {
    const naTaster = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key.toLowerCase();
      if (k === 'm') postaviZid((z) => !z);
      else if (k === 'r') naResetuj();
      else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', naTaster);
    return () => window.removeEventListener('keydown', naTaster);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function naResetuj() {
    postaviZid(false);
    pomak.current = 0;
    nacrtaj();
  }

  const poruka = zid
    ? {
        sta: 'Isti zid, tri talasa: duži talas prolazi lakše, a kraći osjetno oslabi.',
        zasto: 'Koliko tačno oslabi zavisi od zida, pa ovdje nema broja; crtež pokazuje samo smjer.',
      }
    : {
        sta: `Sva tri talasa putuju istom brzinom, a najduži je ${ODNOS} puta duži od najkraćeg.`,
        zasto: 'Talasna dužina je brzina svjetlosti kroz frekvenciju: λ = c / f. Zato duži talas i sporije titra.',
      };

  return (
    <Okvir
      nazad={{ naziv: 'Jarvis', putanja: '/jarvis' }}
      naslov="Tri radija na štandu"
      uvod="Tri radio veze nacrtane istim lenjirom: razlikuje se samo dužina talasa."
      rezimi={<Rezimi opis="Prepreka" opcije={REZIMI} izabran={zid ? 'zid' : 'slobodno'} onIzbor={(id) => postaviZid(id === 'zid')} />}
      onResetuj={naResetuj}
      status={<StatusLinija sta={poruka.sta} zasto={poruka.zasto} />}
      sema={
        <svg viewBox="0 0 1000 560" role="img" aria-label="Tri radio talasa u razmjeri, sa kotama talasnih dužina i lenjirom u centimetrima">
          <defs>
            <pattern id="zid-srafura" width={10} height={10} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1={0} y1={0} x2={0} y2={10} className={fr.srafura} />
            </pattern>
          </defs>

          {zid && (
            <g>
              <rect x={ZID_X} y={40} width={ZID_SIRINA} height={420} fill="url(#zid-srafura)" className={fr.zid} />
              <text x={ZID_X + ZID_SIRINA / 2} y={30} textAnchor="middle" className={stil.tekst}>
                zid
              </text>
            </g>
          )}

          {VEZE.map((veza, i) => (
            <Red
              key={veza.mhz}
              veza={veza}
              y={REDOVI[i]}
              zid={zid}
              postaviLiniju={(el) => {
                linije.current[i] = el;
              }}
            />
          ))}

          <Lenjir />
        </svg>
      }
      strana={
        <>
          <Ocitavanja>
            {VEZE.map((v) => (
              <Ocitavanje key={v.mhz} natpis={v.naziv} vrijednost={broj(v.cm, 1)} jedinica="cm" pod={`${v.mhz} MHz, λ/4 = ${cm(v.cm / 4)}`} />
            ))}
            <Ocitavanje natpis="Brzina talasa" vrijednost="299 792" jedinica="km/s" pod="ista za sva tri" />
          </Ocitavanja>
          <Napomena>
            Talasne dužine su računate iz frekvencija (λ = c / f) i nacrtane u razmjeri. Talasi su usporeni: pravi talas pređe ovih{' '}
            {SIRINA_CM} cm za {broj(NS_ZA_CRTEZ, 1)} ns. Slabljenje na zidu pokazuje samo smjer, ne iznos.
          </Napomena>
        </>
      }
    />
  );
}

const KLASA: Record<string, string> = { djeluj: fr.djeluj, osjeti: fr.osjeti, odluci: fr.odluci };

function Red({
  veza,
  y,
  zid,
  postaviLiniju,
}: {
  veza: (typeof VEZE)[number];
  y: number;
  zid: boolean;
  postaviLiniju: (el: SVGPolylineElement | null) => void;
}) {
  const kraj = X0 + veza.duzinaPx;
  const yKote = y + AMPLITUDA + 22;
  const siroka = veza.duzinaPx > 170;
  return (
    <g className={KLASA[veza.boja]}>
      <text x={X0} y={y - AMPLITUDA - 18} className={fr.naziv}>
        {veza.naziv}
      </text>
      <text x={X1} y={y - AMPLITUDA - 18} textAnchor="end" className={fr.frekvencija}>
        {veza.mhz} MHz
      </text>

      <line x1={X0} y1={y} x2={X1} y2={y} className={fr.nula} />
      <polyline ref={postaviLiniju} points="" className={fr.talas} />

      {/* kota jedne talasne dužine */}
      <line x1={X0} y1={y + 6} x2={X0} y2={yKote + 6} className={fr.pomocna} />
      <line x1={kraj} y1={y + 6} x2={kraj} y2={yKote + 6} className={fr.pomocna} />
      <line x1={X0} y1={yKote} x2={kraj} y2={yKote} className={fr.kota} />
      <polygon points={`${X0},${yKote} ${X0 + 10},${yKote - 4} ${X0 + 10},${yKote + 4}`} className={fr.vrh} />
      <polygon points={`${kraj},${yKote} ${kraj - 10},${yKote - 4} ${kraj - 10},${yKote + 4}`} className={fr.vrh} />
      <text
        x={siroka ? (X0 + kraj) / 2 : kraj + 10}
        y={siroka ? yKote - 6 : yKote + 5}
        textAnchor={siroka ? 'middle' : 'start'}
        className={fr.natpisKote}
      >
        λ = {cm(veza.cm)}
      </text>

      {zid && (
        <text x={ZID_X + ZID_SIRINA + 14} y={y - AMPLITUDA - 18} className={fr.naziv}>
          {veza.prolaz > 0.5 ? 'prolazi' : 'oslabi'}
        </text>
      )}
    </g>
  );
}

function Lenjir() {
  const podioci: number[] = [];
  for (let c = 0; c <= SIRINA_CM; c += 10) podioci.push(c);
  return (
    <g>
      <line x1={X0} y1={Y_LENJIR} x2={X1} y2={Y_LENJIR} className={stil.zica} />
      {Array.from({ length: SIRINA_CM + 1 }, (_, c) => (
        <line
          key={c}
          x1={X0 + c * PX_PO_CM}
          y1={Y_LENJIR}
          x2={X0 + c * PX_PO_CM}
          y2={Y_LENJIR + (c % 10 === 0 ? 12 : c % 5 === 0 ? 8 : 4)}
          className={stil.zicaTanka}
        />
      ))}
      {podioci.map((c) => (
        <text key={c} x={X0 + c * PX_PO_CM} y={Y_LENJIR + 32} textAnchor={c === 0 ? 'start' : 'middle'} className={fr.oznaka}>
          {c}
        </text>
      ))}
      <text x={X1} y={Y_LENJIR + 54} textAnchor="end" className={stil.tih}>
        centimetri, isti lenjir za sva tri talasa
      </text>
    </g>
  );
}
