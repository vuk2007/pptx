'use client';

import { useEffect, useRef, useState } from 'react';
import { SilkTekst } from '@/components/ploca/primitivi';
import { useAnimacija } from '@/lib/animacija';
import { duzinaUCm, prolazKrozZid, uTacke, uzorkujTalas } from '@/lib/talasi';
import { RADIO_VEZE } from '@/config/cinjenice';
import { OkvirDemonstracije, PrekidacRezima } from './OkvirDemonstracije';

/*
  Tri radija na štandu, nacrtana istim lenjirom.

  Sva tri putuju istom brzinom — zato se šara pomjera istom brzinom u
  pikselima, a razlikuje se samo dužina jednog talasa. Zid pokazuje
  smjer: duži talas prolazi lakše. Koliko tačno, to zavisi od zida i
  ovdje se ne tvrdi nikakvim brojem.
*/

const X0 = 250;
const X1 = 1450;
/** Koliko centimetara stane u širinu crteža. */
const SIRINA_CM = 118;
const PX_PO_CM = (X1 - X0) / SIRINA_CM;

const REDOVI = [140, 310, 480];
const AMPLITUDA = 42;

const ZID_CM = 62;
const ZID_X = X0 + ZID_CM * PX_PO_CM;
const ZID_SIRINA = 26;

const Y_LENJIR = 575;

/** Sve šare putuju istom brzinom, u pikselima po sekundi. */
const BRZINA_PX = 130;

const VEZE = RADIO_VEZE.map((v) => {
  const cm = duzinaUCm(v.mhz);
  return { ...v, cm, duzinaPx: cm * PX_PO_CM, prolaz: prolazKrozZid(cm) };
});

const najduzi = VEZE.reduce((a, b) => (a.cm >= b.cm ? a : b));
const najkraci = VEZE.reduce((a, b) => (a.cm <= b.cm ? a : b));
const ODNOS = (najduzi.cm / najkraci.cm).toFixed(1).replace('.', ',');

const cm = (v: number) => `${v.toFixed(1).replace('.', ',')} cm`;

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

      /* Iza zida talas ide dalje, samo slabiji. Faza se ne prekida. */
      const prigusenje = zidRef.current ? veza.prolaz : 1;
      const amplituda = (x: number) => (x < ZID_X ? AMPLITUDA : AMPLITUDA * prigusenje);

      const tacke = uzorkujTalas({
        x0: X0,
        x1: X1,
        y: REDOVI[i],
        amplituda,
        duzinaPx: veza.duzinaPx,
        faza: (2 * Math.PI * pomak.current) / veza.duzinaPx,
        korak: 3,
      });
      linija.setAttribute('points', uTacke(tacke));
    });
  }

  useAnimacija((dt) => {
    pomak.current += BRZINA_PX * dt;
    nacrtaj();
  });

  function resetuj() {
    postaviZid(false);
    pomak.current = 0;
    nacrtaj();
  }

  const poruka = zid
    ? 'Isti zid, tri različita talasa: duži prođe gotovo neometano, kraći osjetno oslabi.'
    : `Sva tri putuju istom brzinom — razlikuje se dužina. Najduži je ${ODNOS} puta duži od najkraćeg.`;

  return (
    <OkvirDemonstracije
      naslov="Tri radija na štandu"
      oznaka="ZAJEDNIČKO · duži talas prolazi, kraći nosi više"
      nazadPutanja="/jarvis"
      nazadNaziv="Jarvis"
      poruka={poruka}
      napomena="Talasne dužine su računate iz frekvencija (λ = c / f) i nacrtane u razmjeri. Slabljenje na zidu je nacrtano samo da se vidi smjer — koliko tačno oslabi zavisi od zida i to se ovdje ne tvrdi."
      onResetuj={resetuj}
      kontrole={
        <PrekidacRezima ukljucen={zid} onPromjena={postaviZid}>
          Zid
        </PrekidacRezima>
      }
    >
      <svg viewBox="0 0 1480 640" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
        <defs>
          <pattern id="zid-sara" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="14" stroke="var(--silkscreen-tih)" strokeWidth="5" opacity="0.5" />
          </pattern>
        </defs>

        {zid && <Zid />}

        {VEZE.map((veza, i) => (
          <Red
            key={veza.mhz}
            veza={veza}
            y={REDOVI[i]}
            zid={zid}
            prvi={i === 0}
            postaviLiniju={(el) => {
              linije.current[i] = el;
            }}
          />
        ))}

        <Lenjir />
      </svg>
    </OkvirDemonstracije>
  );
}

function Zid() {
  return (
    <g>
      <rect x={ZID_X} y={70} width={ZID_SIRINA} height={490} fill="url(#zid-sara)" />
      <rect
        x={ZID_X}
        y={70}
        width={ZID_SIRINA}
        height={490}
        fill="none"
        stroke="var(--silkscreen-tih)"
        strokeWidth={3}
      />
      <SilkTekst x={ZID_X + ZID_SIRINA / 2} y={54} sredina velicina={22} boja="var(--silkscreen)">
        zid
      </SilkTekst>
    </g>
  );
}

function Red({
  veza,
  y,
  zid,
  prvi,
  postaviLiniju,
}: {
  veza: (typeof VEZE)[number];
  y: number;
  zid: boolean;
  /** Natpis uz mjeru stoji samo na prvom redu — dužina i tako piše desno. */
  prvi: boolean;
  postaviLiniju: (el: SVGPolylineElement | null) => void;
}) {
  const boja = `var(--${veza.boja})`;
  const krajTalasa = X0 + veza.duzinaPx;

  return (
    <g>
      <SilkTekst x={X0} y={y - 64} velicina={22} boja={boja}>
        {veza.naziv}
      </SilkTekst>
      <SilkTekst x={X1} y={y - 64} desno velicina={22} boja="var(--silkscreen)">
        {`${veza.mhz} MHz · λ ${cm(veza.cm)}`}
      </SilkTekst>

      {/* Nulta linija, da se vidi koliko je talas iza zida spljošten. */}
      <line x1={X0} y1={y} x2={X1} y2={y} stroke="var(--ivica)" strokeWidth={2} opacity={0.7} />

      <polyline
        ref={postaviLiniju}
        points=""
        fill="none"
        stroke={boja}
        strokeWidth={4}
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* Mjera jednog talasa, istim lenjirom kao i ostali redovi. */}
      <g>
        <line x1={X0} y1={y + 54} x2={krajTalasa} y2={y + 54} stroke={boja} strokeWidth={2.5} opacity={0.8} />
        <line x1={X0} y1={y + 46} x2={X0} y2={y + 62} stroke={boja} strokeWidth={2.5} opacity={0.8} />
        <line x1={krajTalasa} y1={y + 46} x2={krajTalasa} y2={y + 62} stroke={boja} strokeWidth={2.5} opacity={0.8} />
        {prvi && (
          <SilkTekst x={krajTalasa + 14} y={y + 61} velicina={18} boja={boja} debljina={400}>
            jedan talas
          </SilkTekst>
        )}
      </g>

      {zid && (
        <SilkTekst x={ZID_X + ZID_SIRINA + 24} y={y - 26} velicina={20} boja={boja}>
          {veza.prolaz > 0.5 ? 'prolazi' : 'oslabi'}
        </SilkTekst>
      )}
    </g>
  );
}

function Lenjir() {
  const podioci: number[] = [];
  for (let c = 0; c <= SIRINA_CM; c += 10) podioci.push(c);

  return (
    <g>
      <line x1={X0} y1={Y_LENJIR} x2={X1} y2={Y_LENJIR} stroke="var(--ivica)" strokeWidth={3} />
      {podioci.map((c) => (
        <g key={c}>
          <line x1={X0 + c * PX_PO_CM} y1={Y_LENJIR} x2={X0 + c * PX_PO_CM} y2={Y_LENJIR + 12} stroke="var(--ivica)" strokeWidth={3} />
          <SilkTekst x={X0 + c * PX_PO_CM} y={Y_LENJIR + 36} sredina velicina={16} boja="var(--silkscreen-tih)" debljina={400}>
            {c}
          </SilkTekst>
        </g>
      ))}
      <SilkTekst x={X1} y={Y_LENJIR + 60} desno velicina={16} boja="var(--silkscreen-tih)" debljina={400}>
        centimetri · svi talasi su na istom lenjiru
      </SilkTekst>
    </g>
  );
}
