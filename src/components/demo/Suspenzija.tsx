'use client';

import { useRef, useState } from 'react';
import { SilkTekst, Vod } from '@/components/ploca/primitivi';
import { Tocak } from '@/components/ilustracije/oblici';
import { useAnimacija } from '@/lib/animacija';
import { OkvirDemonstracije, PrekidacRezima } from './OkvirDemonstracije';
import stil from './demo.module.css';

/*
  Rocker sa diferencijalom. Perjanik ima ČETIRI točka: po jednu polugu sa dva
  točka sa svake strane, i diferencijal koji drži tijelo na prosjeku dvije poluge.

  Bez suspenzije je tijelo kruto: kad jedan točak stane na kamen, jedan drugi
  ostane u vazduhu i vrti se u prazno.
*/

const TLO_BLIZU = 452;
const DUBINA_X = 86;
const DUBINA_Y = 46;
const TLO_DALEKO = TLO_BLIZU - DUBINA_Y;

const X_ROVERA = 520;
const POLA_POLUGE = 118;
const R_TOCKA = 44;

const VISINA_KAMENA = 56;
const POLA_KAMENA = 76;
const RAMPA = 18;
const X_KAMEN_MIN = 250;
const X_KAMEN_MAX = 900;

/* Prikaz odnaprijed: diferencijal i dvije poluge. */
const INSET_X = 1150;
const INSET_Y = 300;

/** Visina tla na datom mjestu: nula, osim ispod kamena. */
function visinaTla(x: number, xKamena: number) {
  const d = Math.abs(x - xKamena);
  if (d >= POLA_KAMENA) return 0;
  if (d > POLA_KAMENA - RAMPA) return (VISINA_KAMENA * (POLA_KAMENA - d)) / RAMPA;
  return VISINA_KAMENA;
}

export function Suspenzija() {
  const [xKamena, postaviKamen] = useState(700);
  const [kruto, postaviKruto] = useState(false);

  const ugaoTocka = useRef(0);
  const blizuNazadRef = useRef<SVGGElement | null>(null);
  const blizuNaprijedRef = useRef<SVGGElement | null>(null);
  const dalekoNazadRef = useRef<SVGGElement | null>(null);
  const dalekoNaprijedRef = useRef<SVGGElement | null>(null);

  /* --- geometrija zavisi samo od položaja kamena i režima --- */

  /*
    Ugao poluge zavisi od visine tla ispod točkova, ali se i sami točkovi
    pomjere vodoravno kad se poluga zarotira. Zato se rješava u nekoliko
    prolaza: bez toga točak na ivici kamena ispadne par piksela iznad tla
    i pogrešno se prijavi kao da visi.
  */
  let ugaoBlizu = 0;
  let hNazad = 0;
  let hNaprijed = 0;
  for (let prolaz = 0; prolaz < 4; prolaz++) {
    hNazad = visinaTla(X_ROVERA - POLA_POLUGE * Math.cos(ugaoBlizu), xKamena);
    hNaprijed = visinaTla(X_ROVERA + POLA_POLUGE * Math.cos(ugaoBlizu), xKamena);
    ugaoBlizu = Math.asin(
      Math.max(-0.6, Math.min(0.6, (hNazad - hNaprijed) / (2 * POLA_POLUGE))),
    );
  }

  /* Osovina se podigne za prosjek visina ispod dva točka. */
  const yOsovineBlizu = TLO_BLIZU - R_TOCKA - (hNazad + hNaprijed) / 2;

  /*
    Sa suspenzijom daleka strana ostaje ravna, jer je na ravnom tlu.
    Bez suspenzije je sve zavareno, pa daleka strana nosi isti ugao i njen
    prednji točak ode iznad svoje podloge.
  */
  const ugaoDaleko = kruto ? ugaoBlizu : 0;
  /*
    Kruta daleka strana se spusti taman dok njen NIŽI točak ne dodirne tlo.
    Onaj drugi onda ostane gore — to je točak koji se vrti u prazno.
  */
  const yOsovineDaleko = kruto
    ? TLO_DALEKO - R_TOCKA - POLA_POLUGE * Math.abs(Math.sin(ugaoBlizu))
    : TLO_DALEKO - R_TOCKA;

  /*
    Sa suspenzijom tijelo sjedi na prosjeku dvije poluge — to radi diferencijal.
    Bez nje je tijelo zavareno za polugu, pa nosi njen puni ugao.
  */
  const ugaoTijela = kruto ? ugaoBlizu : (ugaoBlizu + 0) / 2;

  const tocakBlizu = (smjer: -1 | 1) => ({
    x: X_ROVERA + smjer * POLA_POLUGE * Math.cos(ugaoBlizu),
    y: yOsovineBlizu + smjer * POLA_POLUGE * Math.sin(ugaoBlizu),
  });

  const tocakDaleko = (smjer: -1 | 1) => ({
    x: X_ROVERA - DUBINA_X + smjer * POLA_POLUGE * Math.cos(ugaoDaleko),
    y: yOsovineDaleko + smjer * POLA_POLUGE * Math.sin(ugaoDaleko),
  });

  const bz = tocakBlizu(-1);
  const bn = tocakBlizu(1);
  const dz = tocakDaleko(-1);
  const dn = tocakDaleko(1);

  /* Koliko je koji točak iznad svoje podloge. */
  const zazor = (tocak: { x: number; y: number }, tlo: number, saKamenom: boolean) => {
    const visina = saKamenom ? visinaTla(tocak.x, xKamena) : 0;
    return Math.max(0, tlo - visina - R_TOCKA - tocak.y);
  };

  const zazori = [
    zazor(bz, TLO_BLIZU, true),
    zazor(bn, TLO_BLIZU, true),
    zazor(dz, TLO_DALEKO, false),
    zazor(dn, TLO_DALEKO, false),
  ];
  const uVazduhu = zazori.map((z) => z > 8);
  const brojUVazduhu = uVazduhu.filter(Boolean).length;

  /* Točak koji ne dodiruje tlo vrti se u prazno. */
  useAnimacija((dt) => {
    ugaoTocka.current = (ugaoTocka.current + 300 * dt) % 360;
    const parovi: [SVGGElement | null, boolean][] = [
      [blizuNazadRef.current, uVazduhu[0]],
      [blizuNaprijedRef.current, uVazduhu[1]],
      [dalekoNazadRef.current, uVazduhu[2]],
      [dalekoNaprijedRef.current, uVazduhu[3]],
    ];
    const centri = [bz, bn, dz, dn];
    parovi.forEach(([element, prazno], i) => {
      if (!element) return;
      element.setAttribute(
        'transform',
        prazno ? `rotate(${ugaoTocka.current} ${centri[i].x} ${centri[i].y})` : '',
      );
    });
  });

  /* --- prevlačenje kamena --- */
  const svgRef = useRef<SVGSVGElement | null>(null);
  const vuceSe = useRef(false);

  function uKoordinateSvg(klijentX: number) {
    const svg = svgRef.current;
    if (!svg) return null;
    const okvir = svg.getBoundingClientRect();
    /* viewBox je 1480 širok i uklapa se po visini, pa računamo stvarnu razmjeru. */
    const razmjera = Math.min(okvir.width / 1480, okvir.height / 640);
    const lijevo = okvir.left + (okvir.width - 1480 * razmjera) / 2;
    return (klijentX - lijevo) / razmjera;
  }

  function pomjeriKamen(klijentX: number) {
    const x = uKoordinateSvg(klijentX);
    if (x === null) return;
    postaviKamen(Math.max(X_KAMEN_MIN, Math.min(X_KAMEN_MAX, x)));
  }

  function resetuj() {
    postaviKamen(700);
    postaviKruto(false);
  }

  const poruka = kruto
    ? brojUVazduhu > 0
      ? 'Bez suspenzije tijelo je kruto: jedan točak visi u vazduhu i vrti se u prazno.'
      : 'Bez suspenzije, na ravnom, sve izgleda u redu. Provuci kamen ispod nekog točka.'
    : brojUVazduhu > 0
      ? 'Poluga se nagnula, ali jedan točak je i dalje gore.'
      : hNazad > 4 || hNaprijed > 4
        ? 'Poluga se nagnula taman toliko da oba njena točka ostanu na zemlji, a tijelo sjedi na prosjeku.'
        : 'Provuci kamen ispod nekog točka i gledaj šta radi poluga.';

  return (
    <OkvirDemonstracije
      naslov="Suspenzija"
      oznaka="Perjanik · rocker sa diferencijalom"
      nazadPutanja="/perjanik"
      nazadNaziv="Perjanik"
      poruka={poruka}
      alarm={kruto && brojUVazduhu > 0}
      napomena="Pojednostavljeno. NASA ima tri točka po strani; mi imamo dva — jeftinije, a i dalje sva četiri na zemlji."
      onResetuj={resetuj}
      kontrole={
        <PrekidacRezima ukljucen={kruto} onPromjena={postaviKruto}>
          Bez suspenzije
        </PrekidacRezima>
      }
    >
      <svg
        ref={svgRef}
        viewBox="0 0 1480 640"
        preserveAspectRatio="xMidYMid meet"
        onPointerDown={(e) => {
          vuceSe.current = true;
          (e.target as Element).setPointerCapture?.(e.pointerId);
          pomjeriKamen(e.clientX);
        }}
        onPointerMove={(e) => vuceSe.current && pomjeriKamen(e.clientX)}
        onPointerUp={() => {
          vuceSe.current = false;
        }}
        onPointerCancel={() => {
          vuceSe.current = false;
        }}
      >
        {/* --- daleka strana, prigušena, sa svojim tlom --- */}
        <g opacity={0.42}>
          <Vod tacke={`${120 - DUBINA_X},${TLO_DALEKO} ${1000 - DUBINA_X},${TLO_DALEKO}`} debljina={5} />
          <line x1={dz.x} y1={dz.y} x2={dn.x} y2={dn.y} stroke="var(--silkscreen)" strokeWidth={9} strokeLinecap="round" />
          <g ref={dalekoNazadRef}>
            <Tocak x={dz.x} y={dz.y} r={R_TOCKA} boja={uVazduhu[2] ? 'var(--alarm)' : 'var(--silkscreen)'} />
          </g>
          <g ref={dalekoNaprijedRef}>
            <Tocak x={dn.x} y={dn.y} r={R_TOCKA} boja={uVazduhu[3] ? 'var(--alarm)' : 'var(--silkscreen)'} />
          </g>
        </g>

        {/* --- tlo sa kamenom --- */}
        <Vod
          tacke={[
            `120,${TLO_BLIZU}`,
            `${xKamena - POLA_KAMENA},${TLO_BLIZU}`,
            `${xKamena - POLA_KAMENA + RAMPA},${TLO_BLIZU - VISINA_KAMENA}`,
            `${xKamena + POLA_KAMENA - RAMPA},${TLO_BLIZU - VISINA_KAMENA}`,
            `${xKamena + POLA_KAMENA},${TLO_BLIZU}`,
            `1000,${TLO_BLIZU}`,
          ].join(' ')}
          debljina={6}
        />

        {/* kamen je meta za prst, pa ima i nevidljivu veliku ručku */}
        <g className={stil.prekidacSvg} role="slider" tabIndex={0}
          aria-label="Položaj kamena"
          aria-valuemin={X_KAMEN_MIN}
          aria-valuemax={X_KAMEN_MAX}
          aria-valuenow={Math.round(xKamena)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowLeft') { e.preventDefault(); postaviKamen((x) => Math.max(X_KAMEN_MIN, x - 24)); }
            if (e.key === 'ArrowRight') { e.preventDefault(); postaviKamen((x) => Math.min(X_KAMEN_MAX, x + 24)); }
          }}
        >
          <rect x={xKamena - POLA_KAMENA - 12} y={TLO_BLIZU - VISINA_KAMENA - 12} width={POLA_KAMENA * 2 + 24} height={VISINA_KAMENA + 82} fill="transparent" />
          <rect className={stil.okvirFokusa} x={xKamena - POLA_KAMENA - 12} y={TLO_BLIZU - VISINA_KAMENA - 12} width={POLA_KAMENA * 2 + 24} height={VISINA_KAMENA + 82} rx={6}
            fill="none" stroke="var(--bakar-struja)" strokeWidth={3} />
          <SilkTekst x={xKamena} y={TLO_BLIZU + 34} sredina velicina={19} boja="var(--bakar-struja)">
            kamen
          </SilkTekst>
          <SilkTekst x={xKamena} y={TLO_BLIZU + 58} sredina velicina={15} boja="var(--silkscreen-tih)" debljina={400}>
            prevuci me
          </SilkTekst>
        </g>

        {/* --- bliža poluga i točkovi --- */}
        <line x1={bz.x} y1={bz.y} x2={bn.x} y2={bn.y} stroke="var(--silkscreen)" strokeWidth={11} strokeLinecap="round" />
        <circle cx={X_ROVERA} cy={yOsovineBlizu} r={13} fill="var(--maska-duboka)" stroke="var(--bakar)" strokeWidth={5} />
        <g ref={blizuNazadRef}>
          <Tocak x={bz.x} y={bz.y} r={R_TOCKA} boja={uVazduhu[0] ? 'var(--alarm)' : 'var(--silkscreen)'} />
        </g>
        <g ref={blizuNaprijedRef}>
          <Tocak x={bn.x} y={bn.y} r={R_TOCKA} boja={uVazduhu[1] ? 'var(--alarm)' : 'var(--silkscreen)'} />
        </g>

        {/* nosači od tijela do obje osovine */}
        {(() => {
          const dnoTijela = (yOsovineBlizu + yOsovineDaleko) / 2 - 98;
          return (
            <g stroke="var(--silkscreen)" strokeWidth={8} strokeLinecap="round">
              <line x1={X_ROVERA} y1={dnoTijela} x2={X_ROVERA} y2={yOsovineBlizu} />
              <line x1={X_ROVERA - DUBINA_X} y1={dnoTijela} x2={X_ROVERA - DUBINA_X} y2={yOsovineDaleko} opacity={0.42} />
            </g>
          );
        })()}

        {/* --- tijelo: sjedi na prosjeku dvije poluge --- */}
        {(() => {
          const cx = X_ROVERA - DUBINA_X / 2;
          /* Tijelo stoji iznad točkova, dovoljno visoko da ih ne prekriva. */
          const cy = (yOsovineBlizu + yOsovineDaleko) / 2 - 136;
          const stepeni = (ugaoTijela * 180) / Math.PI;
          return (
            <g transform={`rotate(${stepeni} ${cx} ${cy})`}>
              <rect x={cx - 132} y={cy - 38} width={264} height={76} rx={12}
                fill="var(--maska-svijetla)" stroke="var(--silkscreen)" strokeWidth={5} />
              <SilkTekst x={cx} y={cy + 8} sredina velicina={21} boja="var(--silkscreen)">
                PERJANIK
              </SilkTekst>
            </g>
          );
        })()}

        {/* oznaka točka koji visi */}
        {uVazduhu.map((prazno, i) => {
          if (!prazno) return null;
          const centar = [bz, bn, dz, dn][i];
          return (
            <g key={i}>
              <SilkTekst x={centar.x} y={centar.y - R_TOCKA - 20} sredina velicina={17} boja="var(--alarm)">
                vrti se u prazno
              </SilkTekst>
            </g>
          );
        })}

        {/* --- prikaz odnaprijed: diferencijal --- */}
        <PrikazOdnaprijed ugaoBlizu={ugaoBlizu} ugaoDaleko={ugaoDaleko} kruto={kruto} />
      </svg>
    </OkvirDemonstracije>
  );
}

/**
 * Dijagram diferencijala, gledan odnaprijed i mjeren U ODNOSU NA TIJELO.
 *
 * Greda je pričvršćena za tijelo u sredini, a krajevima za dvije poluge.
 * Kad jedna poluga ide gore, druga mora dolje — a tijelo ostaje na sredini,
 * to jest na prosjeku dva ugla. Bez diferencijala grede nema i tijelo nema
 * na čemu da se izravna.
 */
function PrikazOdnaprijed({
  ugaoBlizu,
  ugaoDaleko,
  kruto,
}: {
  ugaoBlizu: number;
  ugaoDaleko: number;
  kruto: boolean;
}) {
  const pola = 126;
  const OKVIR = { x: INSET_X - pola - 58, y: INSET_Y - 124, w: (pola + 58) * 2, h: 252 };

  /* Poluge se ovdje mjere u odnosu na tijelo, pa su tačno suprotne. */
  const razlika = (ugaoBlizu - ugaoDaleko) / 2;
  const otklon = kruto ? 0 : -Math.sin(razlika) * 150;

  return (
    <g>
      <SilkTekst x={OKVIR.x} y={OKVIR.y - 16} velicina={20} boja="var(--silkscreen)">
        odnaprijed
      </SilkTekst>

      <rect x={OKVIR.x} y={OKVIR.y} width={OKVIR.w} height={OKVIR.h} rx={10}
        fill="var(--maska-duboka)" stroke="var(--ivica)" strokeWidth={2} />

      {/* tijelo je referenca: uvijek vodoravno u ovom prikazu */}
      <rect x={INSET_X - 96} y={INSET_Y - 86} width={192} height={54} rx={8}
        fill="var(--maska-svijetla)" stroke="var(--silkscreen)" strokeWidth={4} />
      <SilkTekst x={INSET_X} y={INSET_Y - 52} sredina velicina={17} boja="var(--silkscreen)">
        tijelo
      </SilkTekst>

      {/* osovina grede, pričvršćena za tijelo */}
      <line x1={INSET_X} y1={INSET_Y - 32} x2={INSET_X} y2={INSET_Y} stroke="var(--silkscreen)" strokeWidth={6} />

      {kruto ? (
        <>
          {/* nema grede: obje strane su zavarene za tijelo */}
          <rect x={INSET_X - pola} y={INSET_Y - 10} width={pola * 2} height={20} rx={4}
            fill="var(--maska-svijetla)" stroke="var(--silkscreen-tih)" strokeWidth={4} />
          <g stroke="var(--alarm)" strokeWidth={5} strokeLinecap="round">
            <line x1={INSET_X - 16} y1={INSET_Y - 16} x2={INSET_X + 16} y2={INSET_Y + 16} />
            <line x1={INSET_X + 16} y1={INSET_Y - 16} x2={INSET_X - 16} y2={INSET_Y + 16} />
          </g>
        </>
      ) : (
        <>
          <line x1={INSET_X - pola} y1={INSET_Y + otklon} x2={INSET_X + pola} y2={INSET_Y - otklon}
            stroke="var(--bakar-struja)" strokeWidth={10} strokeLinecap="round" />
          <circle cx={INSET_X} cy={INSET_Y} r={11}
            fill="var(--maska-duboka)" stroke="var(--bakar)" strokeWidth={5} />
        </>
      )}

      {[
        { x: INSET_X - pola, y: kruto ? 0 : otklon, natpis: 'bliža' },
        { x: INSET_X + pola, y: kruto ? 0 : -otklon, natpis: 'dalja' },
      ].map((kraj) => (
        <g key={kraj.natpis}>
          <circle cx={kraj.x} cy={INSET_Y + kraj.y} r={10} fill="var(--bakar)" />
          <SilkTekst x={kraj.x} y={INSET_Y + kraj.y + 38} sredina velicina={15}
            boja="var(--silkscreen-tih)" debljina={400}>
            {kraj.natpis}
          </SilkTekst>
          <SilkTekst x={kraj.x} y={INSET_Y + kraj.y + 58} sredina velicina={15}
            boja="var(--silkscreen-tih)" debljina={400}>
            poluga
          </SilkTekst>
        </g>
      ))}

      {(kruto ? ['nema grede,', 'nema izravnavanja'] : ['jedna gore, druga dolje —', 'tijelo ostaje na sredini']).map(
        (red, i) => (
          <SilkTekst
            key={red}
            x={OKVIR.x}
            y={OKVIR.y + OKVIR.h + 30 + i * 26}
            velicina={17}
            boja={kruto ? 'var(--alarm)' : 'var(--silkscreen-tih)'}
            debljina={400}
          >
            {red}
          </SilkTekst>
        ),
      )}
    </g>
  );
}
