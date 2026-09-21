'use client';

import { useEffect, useRef, useState } from 'react';
import { NAPON } from '@/config/cinjenice';
import { Pad, SilkTekst, Vod } from '@/components/ploca/primitivi';
import { Tocak } from '@/components/ilustracije/oblici';
import { primakni, useAnimacija } from '@/lib/animacija';
import {
  kratkaNoga,
  porukaZa,
  prekidaciZaL298N,
  redTabele,
  rezimZa,
  smjerZa,
  SVI_UGASENI,
  TABELA_L298N,
  type Prekidaci,
} from '@/lib/h-most';
import { OkvirDemonstracije, PrekidacRezima } from './OkvirDemonstracije';
import stil from './demo.module.css';

/* --- geometrija šeme --- */

/*
  Odnos stranica crteža je namjerno blizak TV-u (oko 2.3:1), da šema popuni
  ekran umjesto da se stisne u sredinu sa prazninom gore i dolje.
*/
const X_PAD = 180;
const Y_PLUS = 92;
const Y_MASA = 540;
const X_L = 360;
const X_D = 680;
const Y_MOTOR = 316;
const Y_GORE = 196;
const Y_DOLJE = 436;
const MOTOR_X = 520;
const R_TOCKA = 76;
const TERMINAL_L = MOTOR_X - R_TOCKA;
const TERMINAL_D = MOTOR_X + R_TOCKA;
/** Rastojanje od sredine sklopke do njena dva lemna pada. */
const POLA_SKLOPKE = 48;

/* Prsten čipa: sve četiri sklopke su unutra, motor je u rupi — jer je spolja. */
const CIP = { x: 280, y: 112, w: 480, h: 408 };
const RUPA = { x: 438, y: 236, w: 164, h: 160 };

const PANEL_X = 960;
const PANEL_DESNO = 1440;

/* Putanje struje. Motor prekida petlju, pa svaka ide u dva dijela. */
const PUTANJE = {
  naprijed: [
    `${X_PAD},${Y_PLUS} ${X_L},${Y_PLUS} ${X_L},${Y_MOTOR} ${TERMINAL_L},${Y_MOTOR}`,
    `${TERMINAL_D},${Y_MOTOR} ${X_D},${Y_MOTOR} ${X_D},${Y_MASA} ${X_PAD},${Y_MASA}`,
  ],
  nazad: [
    `${X_PAD},${Y_PLUS} ${X_D},${Y_PLUS} ${X_D},${Y_MOTOR} ${TERMINAL_D},${Y_MOTOR}`,
    `${TERMINAL_L},${Y_MOTOR} ${X_L},${Y_MOTOR} ${X_L},${Y_MASA} ${X_PAD},${Y_MASA}`,
  ],
  kratakLijevo: [`${X_PAD},${Y_PLUS} ${X_L},${Y_PLUS} ${X_L},${Y_MASA} ${X_PAD},${Y_MASA}`],
  kratakDesno: [`${X_PAD},${Y_PLUS} ${X_D},${Y_PLUS} ${X_D},${Y_MASA} ${X_PAD},${Y_MASA}`],
  kocenjeGore: [
    `${TERMINAL_L},${Y_MOTOR} ${X_L},${Y_MOTOR} ${X_L},${Y_PLUS} ${X_D},${Y_PLUS} ${X_D},${Y_MOTOR} ${TERMINAL_D},${Y_MOTOR}`,
  ],
  kocenjeDolje: [
    `${TERMINAL_L},${Y_MOTOR} ${X_L},${Y_MOTOR} ${X_L},${Y_MASA} ${X_D},${Y_MASA} ${X_D},${Y_MOTOR} ${TERMINAL_D},${Y_MOTOR}`,
  ],
};

export function HMost() {
  const [prekidaci, postaviPrekidace] = useState<Prekidaci>(SVI_UGASENI);
  const [l298n, postaviL298N] = useState(false);
  const [ulazi, postaviUlaze] = useState({ in1: true, in2: false, en: true });
  const [faza, postaviFazu] = useState<'radi' | 'varnica' | 'izgorjelo'>('radi');
  const [izgorjelaNoga, postaviIzgorjeluNogu] = useState<'lijeva' | 'desna' | null>(null);

  const stvarni = l298n ? prekidaciZaL298N(ulazi.in1, ulazi.in2, ulazi.en) : prekidaci;
  const rezim = rezimZa(stvarni);
  const noga = kratkaNoga(stvarni);

  /*
    Kratak spoj je posljedica klika, pa se odavde i pokreće: varnica, pa
    prekidači izgore, pa se poslije dvije sekunde sve samo vrati na nulu.
  */
  const tajmeri = useRef<number[]>([]);
  useEffect(() => () => tajmeri.current.forEach(clearTimeout), []);

  function ugasiTajmere() {
    tajmeri.current.forEach(clearTimeout);
    tajmeri.current = [];
  }

  function prebaci(koji: keyof Prekidaci) {
    const novi = { ...prekidaci, [koji]: !prekidaci[koji] };
    postaviPrekidace(novi);

    const spojena = kratkaNoga(novi);
    if (!spojena) return;

    ugasiTajmere();
    postaviFazu('varnica');
    tajmeri.current = [
      window.setTimeout(() => {
        postaviFazu('izgorjelo');
        postaviIzgorjeluNogu(spojena);
      }, 700),
      window.setTimeout(() => {
        postaviPrekidace(SVI_UGASENI);
        postaviIzgorjeluNogu(null);
        postaviFazu('radi');
      }, 2000),
    ];
  }

  /* Točak: vrti se dok ima struje, naglo staje na kočenju, polako na praznom hodu. */
  const tocakRef = useRef<SVGGElement | null>(null);
  const varnicaRef = useRef<SVGGElement | null>(null);
  const brzina = useRef(0);
  const ugao = useRef(0);
  const vrijeme = useRef(0);

  const cilj = smjerZa(rezim);
  const prigusenje = rezim === 'kocenjeGore' || rezim === 'kocenjeDolje' ? 8 : cilj !== 0 ? 2.6 : 0.55;

  useAnimacija((dt) => {
    brzina.current = primakni(brzina.current, cilj, prigusenje, dt);
    if (Math.abs(brzina.current) < 0.004) brzina.current = 0;
    ugao.current = (ugao.current + brzina.current * 260 * dt) % 360;
    tocakRef.current?.setAttribute('transform', `rotate(${ugao.current} ${MOTOR_X} ${Y_MOTOR})`);

    vrijeme.current += dt;
    if (varnicaRef.current) {
      const vidljiva = faza === 'varnica' || faza === 'izgorjelo';
      const treperenje = 0.35 + 0.65 * Math.abs(Math.sin(vrijeme.current * 26));
      varnicaRef.current.setAttribute('opacity', vidljiva ? String(treperenje) : '0');
    }
  });

  function resetuj() {
    ugasiTajmere();
    postaviPrekidace(SVI_UGASENI);
    postaviUlaze({ in1: true, in2: false, en: true });
    postaviIzgorjeluNogu(null);
    postaviFazu('radi');
    brzina.current = 0;
  }

  const mozeDaSeDira = !l298n && faza === 'radi';
  const teceKrozMotor = rezim === 'naprijed' || rezim === 'nazad';

  const putanje =
    rezim === 'naprijed'
      ? PUTANJE.naprijed
      : rezim === 'nazad'
        ? PUTANJE.nazad
        : rezim === 'kratakSpoj'
          ? noga === 'lijeva'
            ? PUTANJE.kratakLijevo
            : PUTANJE.kratakDesno
          : rezim === 'kocenjeGore'
            ? PUTANJE.kocenjeGore
            : rezim === 'kocenjeDolje'
              ? PUTANJE.kocenjeDolje
              : [];

  const kociSe = rezim === 'kocenjeGore' || rezim === 'kocenjeDolje';
  const kratak = rezim === 'kratakSpoj';

  return (
    <OkvirDemonstracije
      naslov="H-most"
      oznaka="Perjanik · četiri prekidača"
      nazadPutanja="/perjanik"
      nazadNaziv="Perjanik"
      poruka={l298n ? porukaL298N(ulazi) : porukaZa(prekidaci)}
      alarm={kratak}
      napomena="Naponi su ilustrativni; pad na drajveru zavisi od struje."
      onResetuj={resetuj}
      kontrole={
        <PrekidacRezima ukljucen={l298n} onPromjena={postaviL298N}>
          Kako to radi L298N
        </PrekidacRezima>
      }
    >
      <svg viewBox="0 0 1480 640" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
        {/* prsten čipa: unutra su sklopke, u rupi je motor */}
        {l298n && (
          <>
            {/* Tint sa rupom: motor je u rupi jer je spolja, ali rupa nema svoju ivicu. */}
            <path
              d={`M${CIP.x},${CIP.y} h${CIP.w} v${CIP.h} h${-CIP.w} Z M${RUPA.x},${RUPA.y} h${RUPA.w} v${RUPA.h} h${-RUPA.w} Z`}
              fillRule="evenodd"
              fill="var(--odluci)"
              fillOpacity={0.1}
            />
            <rect
              x={CIP.x}
              y={CIP.y}
              width={CIP.w}
              height={CIP.h}
              fill="none"
              stroke="var(--odluci)"
              strokeWidth={3}
              strokeDasharray="12 9"
            />
            <SilkTekst x={CIP.x + 16} y={CIP.y + 34} velicina={24} boja="var(--odluci)">
              L298N
            </SilkTekst>
          </>
        )}

        {/* napajanje i masa */}
        <Vod tacke={`${X_PAD},${Y_PLUS} ${X_D},${Y_PLUS}`} debljina={6} />
        <Vod tacke={`${X_PAD},${Y_MASA} ${X_D},${Y_MASA}`} debljina={6} />
        <Pad x={X_PAD} y={Y_PLUS} r={12} />
        <Pad x={X_PAD} y={Y_MASA} r={12} />
        <SilkTekst x={X_PAD - 22} y={Y_PLUS - 22} desno velicina={24} boja="var(--bakar-struja)">
          + {NAPON.ulaz} V
        </SilkTekst>
        <g stroke="var(--bakar)" strokeWidth={5} strokeLinecap="round">
          <line x1={X_PAD} y1={Y_MASA} x2={X_PAD} y2={Y_MASA + 30} />
          <line x1={X_PAD - 26} y1={Y_MASA + 30} x2={X_PAD + 26} y2={Y_MASA + 30} />
          <line x1={X_PAD - 16} y1={Y_MASA + 42} x2={X_PAD + 16} y2={Y_MASA + 42} />
          <line x1={X_PAD - 7} y1={Y_MASA + 54} x2={X_PAD + 7} y2={Y_MASA + 54} />
        </g>
        <SilkTekst x={X_PAD - 40} y={Y_MASA + 48} desno velicina={22} boja="var(--silkscreen-tih)">
          masa
        </SilkTekst>

        {/* noge mosta */}
        {[X_L, X_D].map((x) => (
          <g key={x}>
            <Vod tacke={`${x},${Y_PLUS} ${x},${Y_GORE - POLA_SKLOPKE}`} debljina={6} />
            <Vod tacke={`${x},${Y_GORE + POLA_SKLOPKE} ${x},${Y_DOLJE - POLA_SKLOPKE}`} debljina={6} />
            <Vod tacke={`${x},${Y_DOLJE + POLA_SKLOPKE} ${x},${Y_MASA}`} debljina={6} />
          </g>
        ))}
        <Vod tacke={`${X_L},${Y_MOTOR} ${TERMINAL_L},${Y_MOTOR}`} debljina={6} />
        <Vod tacke={`${TERMINAL_D},${Y_MOTOR} ${X_D},${Y_MOTOR}`} debljina={6} />

        {/* struja koja trenutno teče */}
        {putanje.map((tacke) => (
          <Vod
            key={tacke}
            tacke={tacke}
            debljina={7}
            struja={kociSe ? false : 'naprijed'}
            brzina={kratak ? 0.5 : 1.2}
            boja={kratak ? 'var(--alarm)' : 'var(--bakar-struja)'}
            bojaStruje={kratak ? 'var(--alarm)' : undefined}
          />
        ))}

        {/* motor kao točak */}
        <g ref={tocakRef}>
          <Tocak x={MOTOR_X} y={Y_MOTOR} r={R_TOCKA} boja={teceKrozMotor ? 'var(--djeluj)' : 'var(--silkscreen)'} />
        </g>
        <Pad x={TERMINAL_L} y={Y_MOTOR} r={10} />
        <Pad x={TERMINAL_D} y={Y_MOTOR} r={10} />
        <SilkTekst x={MOTOR_X} y={Y_MOTOR + R_TOCKA + 40} sredina velicina={22} boja="var(--djeluj)">
          motor
        </SilkTekst>

        {/* kod kočenja oba kraja motora stoje na istom naponu */}
        {kociSe && (
          <>
            <SilkTekst x={TERMINAL_L - 14} y={Y_MOTOR - 106} desno velicina={20} boja="var(--bakar-struja)">
              {rezim === 'kocenjeGore' ? `${NAPON.ulaz} V` : '0 V'}
            </SilkTekst>
            <SilkTekst x={TERMINAL_D + 14} y={Y_MOTOR - 106} velicina={20} boja="var(--bakar-struja)">
              {rezim === 'kocenjeGore' ? `${NAPON.ulaz} V` : '0 V'}
            </SilkTekst>
            <SilkTekst x={MOTOR_X} y={Y_MOTOR - 106} sredina velicina={28} boja="var(--bakar-struja)">
              =
            </SilkTekst>
          </>
        )}

        {/* četiri sklopke */}
        <Prekidac
          x={X_L} y={Y_GORE} oznaka="S1" natpisLijevo
          zatvoren={stvarni.s1} izgorio={izgorjelaNoga === 'lijeva'}
          interaktivan={mozeDaSeDira}
          onKlik={() => prebaci('s1')}
        />
        <Prekidac
          x={X_D} y={Y_GORE} oznaka="S2"
          zatvoren={stvarni.s2} izgorio={izgorjelaNoga === 'desna'}
          interaktivan={mozeDaSeDira}
          onKlik={() => prebaci('s2')}
        />
        <Prekidac
          x={X_L} y={Y_DOLJE} oznaka="S3" natpisLijevo
          zatvoren={stvarni.s3} izgorio={izgorjelaNoga === 'lijeva'}
          interaktivan={mozeDaSeDira}
          onKlik={() => prebaci('s3')}
        />
        <Prekidac
          x={X_D} y={Y_DOLJE} oznaka="S4"
          zatvoren={stvarni.s4} izgorio={izgorjelaNoga === 'desna'}
          interaktivan={mozeDaSeDira}
          onKlik={() => prebaci('s4')}
        />

        {/* varnice na nozi koja je spojila plus na masu */}
        <g ref={varnicaRef} opacity={0}>
          {noga && (
            <Varnice x={noga === 'lijeva' ? X_L : X_D} />
          )}
        </g>

        {/* ulazi čipa umjesto prstiju */}
        {l298n && (
          <>
            <UlazCipa y={Y_GORE} oznaka="IN1" opis="lijeva noga" vrijednost={ulazi.in1}
              onKlik={() => postaviUlaze((u) => ({ ...u, in1: !u.in1 }))} />
            <UlazCipa y={Y_MOTOR} oznaka="EN" opis="obje noge" vrijednost={ulazi.en}
              onKlik={() => postaviUlaze((u) => ({ ...u, en: !u.en }))} />
            <UlazCipa y={Y_DOLJE} oznaka="IN2" opis="desna noga" vrijednost={ulazi.in2}
              onKlik={() => postaviUlaze((u) => ({ ...u, in2: !u.in2 }))} />
          </>
        )}

        {l298n ? <TabelaL298N ulazi={ulazi} /> : <PanelNapona teceStruja={teceKrozMotor} />}
      </svg>
    </OkvirDemonstracije>
  );
}

/* ------------------------------------------------------------------ dijelovi */

/** Šematska sklopka. Zatvorena je ravna poluga, otvorena je odignuta. */
function Prekidac({
  x,
  y,
  oznaka,
  zatvoren,
  izgorio,
  interaktivan,
  natpisLijevo = false,
  onKlik,
}: {
  x: number;
  y: number;
  oznaka: string;
  zatvoren: boolean;
  izgorio: boolean;
  interaktivan: boolean;
  natpisLijevo?: boolean;
  onKlik: () => void;
}) {
  const gore = y - POLA_SKLOPKE;
  const dolje = y + POLA_SKLOPKE;
  const boja = izgorio ? 'var(--alarm)' : zatvoren ? 'var(--bakar-struja)' : 'var(--bakar)';

  return (
    <g
      className={interaktivan ? stil.prekidacSvg : undefined}
      role={interaktivan ? 'switch' : undefined}
      aria-checked={interaktivan ? zatvoren : undefined}
      aria-label={interaktivan ? `Prekidač ${oznaka}` : undefined}
      tabIndex={interaktivan ? 0 : undefined}
      onClick={interaktivan ? onKlik : undefined}
      onKeyDown={
        interaktivan
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onKlik();
              }
            }
          : undefined
      }
      opacity={interaktivan || izgorio ? 1 : 0.62}
    >
      {/* meta za prst je mnogo veća od onoga što se vidi */}
      <rect x={x - 70} y={y - 72} width={140} height={144} fill="transparent" />
      <rect className={stil.okvirFokusa} x={x - 70} y={y - 72} width={140} height={144} rx={8}
        fill="none" stroke="var(--bakar-struja)" strokeWidth={3} />

      <circle cx={x} cy={gore} r={10} fill={boja} />
      <circle cx={x} cy={dolje} r={10} fill={boja} />

      {izgorio ? (
        <g stroke="var(--alarm)" strokeWidth={9} strokeLinecap="round">
          <line x1={x} y1={dolje} x2={x + 16} y2={y + 6} />
          <line x1={x + 34} y1={y - 22} x2={x + 10} y2={gore + 6} />
        </g>
      ) : (
        <line
          x1={x}
          y1={dolje}
          x2={zatvoren ? x : x + 48}
          y2={zatvoren ? gore : y - 26}
          stroke={boja}
          strokeWidth={9}
          strokeLinecap="round"
        />
      )}

      <SilkTekst
        x={natpisLijevo ? x - 16 : x + 16}
        y={y + POLA_SKLOPKE + 30}
        desno={natpisLijevo}
        velicina={26}
        boja={izgorio ? 'var(--alarm)' : 'var(--silkscreen)'}
      >
        {oznaka}
      </SilkTekst>
    </g>
  );
}

/** Varnica na nozi koja je spojila plus pravo na masu. */
function Varnice({ x }: { x: number }) {
  const mjesta = [Y_GORE, Y_DOLJE];
  /* Zrake pod nepravilnim uglovima, da ne ispadne uredna zvijezda. */
  const uglovi = [18, 62, 128, 166, 214, 256, 302, 340];

  return (
    <g stroke="var(--alarm)" strokeWidth={4} strokeLinecap="round" fill="none">
      {mjesta.map((y) => (
        <g key={y}>
          <circle cx={x} cy={y} r={34} fill="var(--alarm)" opacity={0.2} stroke="none" />
          {uglovi.map((ugao, i) => {
            const rad = (ugao * Math.PI) / 180;
            const unutra = 14 + (i % 3) * 4;
            const vani = 34 + (i % 4) * 11;
            const lom = (unutra + vani) / 2;
            const lomUgao = rad + (i % 2 ? 0.26 : -0.26);
            return (
              <polyline
                key={ugao}
                points={[
                  `${x + Math.cos(rad) * unutra},${y + Math.sin(rad) * unutra}`,
                  `${x + Math.cos(lomUgao) * lom},${y + Math.sin(lomUgao) * lom}`,
                  `${x + Math.cos(rad) * vani},${y + Math.sin(rad) * vani}`,
                ].join(' ')}
              />
            );
          })}
        </g>
      ))}
    </g>
  );
}

/** Ulaz čipa: velika meta, vrijednost se vidi izdaleka. */
function UlazCipa({
  y,
  oznaka,
  opis,
  vrijednost,
  onKlik,
}: {
  y: number;
  oznaka: string;
  opis: string;
  vrijednost: boolean;
  onKlik: () => void;
}) {
  return (
    <g
      className={stil.prekidacSvg}
      role="switch"
      aria-checked={vrijednost}
      aria-label={`Ulaz ${oznaka}`}
      tabIndex={0}
      onClick={onKlik}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onKlik();
        }
      }}
    >
      <rect x={100} y={y - 38} width={150} height={76} rx={8}
        fill="var(--maska-svijetla)" stroke={vrijednost ? 'var(--odluci)' : 'var(--bakar)'} strokeWidth={3} />
      <rect className={stil.okvirFokusa} x={96} y={y - 42} width={158} height={84} rx={10}
        fill="none" stroke="var(--bakar-struja)" strokeWidth={3} />

      <SilkTekst x={114} y={y + 10} velicina={24} boja="var(--silkscreen)">
        {oznaka}
      </SilkTekst>
      <text
        x={236}
        y={y + 14}
        textAnchor="end"
        fontSize={38}
        fontWeight={700}
        fill={vrijednost ? 'var(--odluci)' : 'var(--silkscreen-tih)'}
        style={{ fontFamily: 'var(--font-mono), ui-monospace, monospace' }}
      >
        {vrijednost ? 1 : 0}
      </text>
      <SilkTekst x={100} y={y + 58} velicina={16} boja="var(--silkscreen-tih)" debljina={400}>
        {opis}
      </SilkTekst>
      <Vod tacke={`250,${y} ${CIP.x},${y}`} debljina={4} />
    </g>
  );
}

function PanelNapona({ teceStruja }: { teceStruja: boolean }) {
  const redovi = [
    { naziv: 'ulaz', vrijednost: NAPON.ulaz, boja: 'var(--bakar-struja)' },
    { naziv: 'na motoru', vrijednost: teceStruja ? NAPON.naMotoru : 0, boja: 'var(--djeluj)' },
    { naziv: 'u toplotu', vrijednost: teceStruja ? NAPON.padNaDrajveru : 0, boja: 'var(--silkscreen-tih)' },
  ];

  return (
    <g>
      <SilkTekst x={PANEL_X} y={124} velicina={24} boja="var(--silkscreen)">
        Napon
      </SilkTekst>
      <Vod tacke={`${PANEL_X},142 ${PANEL_DESNO},142`} debljina={3} />

      {redovi.map((r, i) => (
        <g key={r.naziv}>
          <SilkTekst x={PANEL_X} y={200 + i * 58} velicina={21} boja="var(--silkscreen-tih)">
            {r.naziv}
          </SilkTekst>
          <text
            x={PANEL_DESNO}
            y={206 + i * 58}
            textAnchor="end"
            fontSize={34}
            fontWeight={700}
            fill={r.boja}
            style={{ fontFamily: 'var(--font-mono), ui-monospace, monospace' }}
          >
            {r.vrijednost.toFixed(1)} V
          </text>
        </g>
      ))}

      <SilkTekst x={PANEL_X} y={410} velicina={17} boja="var(--silkscreen-tih)" debljina={400}>
        dva volta se pretvore
      </SilkTekst>
      <SilkTekst x={PANEL_X} y={436} velicina={17} boja="var(--silkscreen-tih)" debljina={400}>
        u toplotu na drajveru
      </SilkTekst>
    </g>
  );
}

function TabelaL298N({ ulazi }: { ulazi: { in1: boolean; in2: boolean; en: boolean } }) {
  const aktivan = redTabele(ulazi.in1, ulazi.in2, ulazi.en);
  const bit = (v: boolean | null) => (v === null ? '–' : v ? '1' : '0');

  return (
    <g>
      <SilkTekst x={PANEL_X} y={124} velicina={24} boja="var(--silkscreen)">
        Tabela
      </SilkTekst>
      <Vod tacke={`${PANEL_X},142 ${PANEL_DESNO},142`} debljina={3} />

      {['EN', 'IN1', 'IN2'].map((naziv, i) => (
        <SilkTekst key={naziv} x={PANEL_X + i * 58} y={182} velicina={18} boja="var(--silkscreen-tih)">
          {naziv}
        </SilkTekst>
      ))}

      {TABELA_L298N.map((red, i) => {
        const y = 228 + i * 48;
        const istaknut = i === aktivan;
        return (
          <g key={`${red.en}-${red.in1}-${red.in2}`}>
            {istaknut && (
              <rect x={PANEL_X - 12} y={y - 30} width={PANEL_DESNO - PANEL_X + 24} height={42} rx={5} fill="var(--odluci)" opacity={0.2} />
            )}
            {[red.en, red.in1, red.in2].map((v, k) => (
              <text
                key={k}
                x={PANEL_X + k * 58}
                y={y}
                fontSize={26}
                fontWeight={700}
                fill={istaknut ? 'var(--odluci)' : 'var(--silkscreen-tih)'}
                style={{ fontFamily: 'var(--font-mono), ui-monospace, monospace' }}
              >
                {bit(v)}
              </text>
            ))}
            <SilkTekst
              x={PANEL_X + 196}
              y={y}
              velicina={20}
              boja={istaknut ? 'var(--silkscreen)' : 'var(--silkscreen-tih)'}
            >
              {red.ishod}
            </SilkTekst>
          </g>
        );
      })}

      <SilkTekst x={PANEL_X} y={504} velicina={17} boja="var(--odluci)" debljina={400}>
        jedan ulaz drži obje sklopke
      </SilkTekst>
      <SilkTekst x={PANEL_X} y={530} velicina={17} boja="var(--odluci)" debljina={400}>
        na svojoj nozi, i uvijek
      </SilkTekst>
      <SilkTekst x={PANEL_X} y={556} velicina={17} boja="var(--odluci)" debljina={400}>
        suprotne — zato kratak
      </SilkTekst>
      <SilkTekst x={PANEL_X} y={582} velicina={17} boja="var(--odluci)" debljina={400}>
        spoj ovdje nije moguć
      </SilkTekst>
    </g>
  );
}

function porukaL298N({ in1, in2, en }: { in1: boolean; in2: boolean; en: boolean }) {
  if (!en) return 'EN je 0: čip je isključen i motor slobodno staje sam od sebe.';
  if (in1 && !in2) return 'EN=1, IN1=1, IN2=0: čip pali S1 i S4, točak se vrti naprijed.';
  if (!in1 && in2) return 'EN=1, IN1=0, IN2=1: čip pali S2 i S3, točak se vrti nazad.';
  return 'IN1 i IN2 su isti: oba kraja motora idu na istu stranu i motor koči.';
}
