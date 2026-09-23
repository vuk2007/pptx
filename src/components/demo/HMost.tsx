'use client';

import { useEffect, useRef, useState } from 'react';
import { MOTOR, PWM_STVARNO_HZ } from '@/config/cinjenice';
import { broj } from '@/lib/format';
import { useAnimacija } from '@/lib/animacija';
import {
  korak,
  ocitavanjaZa,
  porukaZa,
  POCETNO,
  postaviRezim,
  prebaci,
  PROZOR,
  redTabele,
  resetuj,
  TABELA_L298N,
  type OcitavanjaHMosta,
  type Poruka,
  type Prekidaci,
  type StanjeHMosta,
  type TrenutnoHMosta,
} from '@/lib/h-most';
import { brzinaCestica, BRZINA_KRATKOG, jacinaToka, napraviPutanju, type Putanja } from '@/lib/tok';
import {
  KarticaTocka,
  Ocitavanja,
  Ocitavanje,
  Okvir,
  Rezimi,
  StatusLinija,
  instrumentStil,
} from '@/components/instrument/Okvir';
import { Oscilloskop, Snimak, type Kanal } from '@/components/instrument/Oscilloskop';
import { TokStruje, type Tok } from '@/components/instrument/TokStruje';
import stil from './hmost.module.css';

/* ------------------------------------------------ geometrija šeme (iz reference) */

const XL = 240;
const XR = 560;
const YT = 70;
const YB = 490;
const YM = 280;
const BX = 60;
const MX = 400;

const SKLOPKE = [
  { kljuc: 's1', ime: 'S1', x: XL, y1: 118, y2: 192, ulaz: 'IN1' },
  { kljuc: 's2', ime: 'S2', x: XR, y1: 118, y2: 192, ulaz: 'IN2' },
  { kljuc: 's3', ime: 'S3', x: XL, y1: 368, y2: 442, ulaz: 'ne IN1' },
  { kljuc: 's4', ime: 'S4', x: XR, y1: 368, y2: 442, ulaz: 'ne IN2' },
] as const satisfies readonly { kljuc: keyof Prekidaci; ime: string; x: number; y1: number; y2: number; ulaz: string }[];

const PUTANJE = {
  naprijed: napraviPutanju([[BX, YB], [BX, YT], [XL, YT], [XL, YM], [XR, YM], [XR, YB], [BX, YB]]),
  nazad: napraviPutanju([[BX, YB], [BX, YT], [XR, YT], [XR, YM], [XL, YM], [XL, YB], [BX, YB]]),
  kratakLijevo: napraviPutanju([[BX, YB], [BX, YT], [XL, YT], [XL, YB], [BX, YB]]),
  kratakDesno: napraviPutanju([[BX, YB], [BX, YT], [XR, YT], [XR, YB], [BX, YB]]),
  kocenjeGore: napraviPutanju([[XL, YM], [XR, YM], [XR, YT], [XL, YT], [XL, YM]]),
  kocenjeDolje: napraviPutanju([[XL, YM], [XR, YM], [XR, YB], [XL, YB], [XL, YM]]),
};

const KANALI: readonly Kanal[] = [
  { boja: 'ch1', natpis: 'CH1 napon na motoru, 4 V/pod.', skala: 4, stepenasto: true },
  { boja: 'current', natpis: 'CH2 struja, 1 A/pod.', skala: 1 },
];

const REZIMI = [
  { id: 'prekidaci', natpis: 'Prekidači' },
  { id: 'cip', natpis: 'Unutar L298N' },
] as const;

/** Struja kratkog spoja na osciloskopu: van ekrana, jer je van svake skale. */
const VAN_SKALE = 99;

type Prikaz = {
  stanje: StanjeHMosta;
  sklopke: Prekidaci;
  ziva: boolean;
  ocitavanja: OcitavanjaHMosta;
  poruka: Poruka;
};

function prikazZa(st: StanjeHMosta, tr: TrenutnoHMosta): Prikaz {
  return {
    stanje: st,
    sklopke: tr.sklopke,
    ziva: Math.abs(tr.strujaTrenutna) > 0.02 || tr.kratak,
    ocitavanja: ocitavanjaZa(st, tr),
    poruka: porukaZa(st, tr),
  };
}

function tokZa(tr: TrenutnoHMosta): Tok | null {
  const r = tr.trenutni;
  let putanja: Putanja;
  let smjer: number;
  if (r === 'naprijed' || r === 'nazad') {
    putanja = r === 'naprijed' ? PUTANJE.naprijed : PUTANJE.nazad;
    smjer = Math.sign(tr.strujaTrenutna * (r === 'naprijed' ? 1 : -1)) || 1;
  } else if (r === 'kocenjeGore' || r === 'kocenjeDolje') {
    putanja = PUTANJE[r];
    smjer = tr.strujaTrenutna >= 0 ? 1 : -1;
  } else if (r === 'kratakSpoj') {
    putanja = tr.sklopke.s1 && tr.sklopke.s3 ? PUTANJE.kratakLijevo : PUTANJE.kratakDesno;
    return { putanja, brzina: BRZINA_KRATKOG, jacina: 0.35 + 0.25 * Math.sin(performance.now() / 1000 * 28), greska: true };
  } else {
    return null;
  }
  return {
    putanja,
    brzina: smjer * brzinaCestica(tr.strujaTrenutna),
    jacina: jacinaToka(tr.strujaTrenutna),
    greska: false,
  };
}

const POCETNO_TRENUTNO = korak(POCETNO, 0).trenutno;

export function HMost() {
  const stanje = useRef<StanjeHMosta>(POCETNO);
  const trenutno = useRef<TrenutnoHMosta>(POCETNO_TRENUTNO);
  const [snimak] = useState(() => new Snimak(PROZOR));
  const [prikaz, postaviPrikaz] = useState<Prikaz>(() => prikazZa(POCETNO, POCETNO_TRENUTNO));

  const tocakRef = useRef<SVGGElement | null>(null);
  const rotorRef = useRef<SVGCircleElement | null>(null);
  const varniceRef = useRef<(SVGLineElement | null)[]>([]);
  const ugao = useRef(0);
  const kadar = useRef(0);

  /** Promjena stanja iz kontrole: odmah se vidi, ne čeka sljedeće osvježavanje. */
  function promijeni(novo: (st: StanjeHMosta) => StanjeHMosta) {
    stanje.current = novo(stanje.current);
    const { trenutno: tr } = korak(stanje.current, 0);
    trenutno.current = tr;
    postaviPrikaz(prikazZa(stanje.current, tr));
  }

  function naResetuj() {
    snimak.ocisti();
    promijeni(resetuj);
  }

  useAnimacija((dt) => {
    const prethodno = trenutno.current;
    const { stanje: st, trenutno: tr } = korak(stanje.current, dt);
    stanje.current = st;
    trenutno.current = tr;

    snimak.dodaj(st.t, [tr.naponTrenutni, tr.kratak ? VAN_SKALE : tr.strujaTrenutna], tr.kratak);

    ugao.current += st.brzina * 6 * dt * 0.22;
    tocakRef.current?.style.setProperty('transform', `rotate(${ugao.current}deg)`);
    rotorRef.current?.style.setProperty('transform', `rotate(${ugao.current * 3}deg)`);

    /* Varnice na nozi u kratkom spoju. */
    const x = tr.sklopke.s1 && tr.sklopke.s3 ? XL : XR;
    varniceRef.current.forEach((v, i, sve) => {
      if (!v) return;
      if (!tr.kratak) {
        v.setAttribute('opacity', '0');
        return;
      }
      const a = (i / sve.length) * Math.PI * 2 + st.t * 9;
      const r1 = 9 + Math.random() * 4;
      const r2 = 18 + Math.random() * 16;
      v.setAttribute('x1', String(x + r1 * Math.cos(a)));
      v.setAttribute('y1', String(YM + r1 * Math.sin(a)));
      v.setAttribute('x2', String(x + r2 * Math.cos(a)));
      v.setAttribute('y2', String(YM + r2 * Math.sin(a)));
      v.setAttribute('opacity', Math.random() > 0.35 ? '1' : '0');
    });

    /* Brojevi se osvježavaju dvanaest puta u sekundi, sklopke čim se pomjere. */
    kadar.current++;
    const pomjerene = (Object.keys(tr.sklopke) as (keyof Prekidaci)[]).some((k) => tr.sklopke[k] !== prethodno.sklopke[k]);
    if (pomjerene || kadar.current % 5 === 0 || st.prekidaci !== prikaz.stanje.prekidaci) {
      postaviPrikaz(prikazZa(st, tr));
    }
  });

  /* Tastatura: 1-4 sklopke, M režim, R reset; u čipu 1 i 2 ulazi, strelice EN. */
  useEffect(() => {
    const naTaster = (e: KeyboardEvent) => {
      const cilj = e.target as HTMLElement | null;
      if (cilj?.tagName === 'INPUT' || e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key.toLowerCase();
      const cip = stanje.current.rezim === 'cip';
      const pomjeriEN = (za: number) =>
        promijeni((st) => ({ ...st, popuna: Math.min(1, Math.max(0, Math.round(st.popuna * 100 + za) / 100)) }));

      if (!cip && ['1', '2', '3', '4'].includes(k)) {
        promijeni((st) => prebaci(st, SKLOPKE[Number(k) - 1].kljuc));
      } else if (cip && k === '1') {
        promijeni((st) => ({ ...st, in1: !st.in1 }));
      } else if (cip && k === '2') {
        promijeni((st) => ({ ...st, in2: !st.in2 }));
      } else if (cip && (k === 'arrowup' || k === 'arrowright')) {
        pomjeriEN(5);
        e.preventDefault();
      } else if (cip && (k === 'arrowdown' || k === 'arrowleft')) {
        pomjeriEN(-5);
        e.preventDefault();
      } else if (k === 'r') {
        naResetuj();
      } else if (k === 'm') {
        promijeni((st) => postaviRezim(st, cip ? 'prekidaci' : 'cip'));
      }
    };
    window.addEventListener('keydown', naTaster);
    return () => window.removeEventListener('keydown', naTaster);
    // Stanje se čita kroz ref, pa se slušalac postavlja jednom.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const st = prikaz.stanje;
  const cip = st.rezim === 'cip';
  const o = prikaz.ocitavanja;
  const aktivniRed = redTabele(st.in1, st.in2, st.popuna > 0);

  return (
    <Okvir
      nazad={{ naziv: 'Perjanik', putanja: '/perjanik' }}
      naslov="H-most"
      uvod="Četiri prekidača odlučuju u kom smjeru struja teče kroz motor."
      rezimi={
        <Rezimi
          opis="Prikaz"
          opcije={REZIMI}
          izabran={st.rezim}
          onIzbor={(id) => promijeni((s) => postaviRezim(s, id))}
        />
      }
      onResetuj={naResetuj}
      status={<StatusLinija sta={prikaz.poruka.sta} zasto={prikaz.poruka.zasto} greska={prikaz.poruka.greska} />}
      osciloskop={
        <Oscilloskop
          kanali={KANALI}
          snimak={snimak}
          desno={
            cip
              ? `${PROZOR} s na ekranu. PWM je usporen: stvarno se pali i gasi oko ${PWM_STVARNO_HZ} puta u sekundi.`
              : `${PROZOR} s na ekranu`
          }
          opis="Osciloskop: napon i struja motora kroz vrijeme"
        />
      }
      sema={
        <Sema
          prikaz={prikaz}
          cip={cip}
          onPrebaci={(k) => promijeni((s) => prebaci(s, k))}
          citajTok={() => tokZa(trenutno.current)}
          rotorRef={rotorRef}
          varniceRef={varniceRef}
        />
      }
      strana={
        <>
          <KarticaTocka natpis="Točak, motor sa reduktorom" obrtaja={o.obrtaja} smjer={o.smjer} tocakRef={tocakRef} />

          <Ocitavanja>
            <Ocitavanje natpis="Napon na motoru" vrijednost={o.napon} jedinica="V" pod={o.naponPod} />
            <Ocitavanje natpis="Struja kroz motor" vrijednost={o.struja} jedinica="A" pod={o.strujaPod} vruce={o.strujaVruca} />
            <Ocitavanje natpis="Kontra-napon motora" vrijednost={o.kontraNapon} jedinica="V" pod="raste sa brzinom" />
            <Ocitavanje natpis="Toplota u drajveru" vrijednost={o.toplota} jedinica="W" pod={o.toplotaPod} />
          </Ocitavanja>

          {cip && (
            <div className={`${instrumentStil.panel} ${stil.panelCipa}`}>
              <div className={stil.ulazi}>
                <button className={stil.ulaz} aria-pressed={st.in1} onClick={() => promijeni((s) => ({ ...s, in1: !s.in1 }))}>
                  IN1 = {+st.in1}
                </button>
                <button className={stil.ulaz} aria-pressed={st.in2} onClick={() => promijeni((s) => ({ ...s, in2: !s.in2 }))}>
                  IN2 = {+st.in2}
                </button>
              </div>
              <div className={stil.en}>
                <label htmlFor="en-pwm">
                  EN, PWM <span>{Math.round(st.popuna * 100)} %</span>
                </label>
                <input
                  id="en-pwm"
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={Math.round(st.popuna * 100)}
                  aria-valuetext={`${Math.round(st.popuna * 100)} %`}
                  onChange={(e) => {
                    const popuna = Number(e.target.value) / 100;
                    promijeni((s) => ({ ...s, popuna }));
                  }}
                />
              </div>
              <table className={stil.tabela} aria-label="Tabela istine L298N">
                <thead>
                  <tr>
                    <th>EN</th>
                    <th>IN1</th>
                    <th>IN2</th>
                    <th>Motor</th>
                  </tr>
                </thead>
                <tbody>
                  {TABELA_L298N.map((red, i) => (
                    <tr key={red.kljuc} className={i === aktivniRed ? stil.redAktivan : undefined}>
                      <td>{+red.en}</td>
                      <td>{red.in1 === null ? '–' : +red.in1}</td>
                      <td>{red.in2 === null ? '–' : +red.in2}</td>
                      <td>{red.ishod}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <p className={stil.napomena}>
            Parametri motora su ilustrativni: ponašanje je tačno, brojevi nijesu izmjereni na Perjaniku.
          </p>
        </>
      }
    />
  );
}

/* ------------------------------------------------------------------ šema */

function Z({ x1, y1, x2, y2, klasa = stil.zica }: { x1: number; y1: number; x2: number; y2: number; klasa?: string }) {
  return <line x1={x1} y1={y1} x2={x2} y2={y2} className={klasa} />;
}

function Sema({
  prikaz,
  cip,
  onPrebaci,
  citajTok,
  rotorRef,
  varniceRef,
}: {
  prikaz: Prikaz;
  cip: boolean;
  onPrebaci: (k: keyof Prekidaci) => void;
  citajTok: () => Tok | null;
  rotorRef: React.RefObject<SVGCircleElement | null>;
  varniceRef: React.RefObject<(SVGLineElement | null)[]>;
}) {
  return (
    <svg
      viewBox="0 0 620 560"
      className={cip ? stil.brzo : undefined}
      role="img"
      aria-label="Šema H-mosta sa baterijom, četiri prekidača i motorom"
    >
      {/* žice */}
      <g>
        <Z x1={BX} y1={YT} x2={BX} y2={258} />
        <Z x1={BX} y1={302} x2={BX} y2={YB} />
        <Z x1={BX} y1={YT} x2={XR} y2={YT} />
        <Z x1={BX} y1={YB} x2={XR} y2={YB} />
        {[XL, XR].map((x) => (
          <g key={x}>
            <Z x1={x} y1={YT} x2={x} y2={118} />
            <Z x1={x} y1={192} x2={x} y2={368} />
            <Z x1={x} y1={442} x2={x} y2={YB} />
          </g>
        ))}
        <Z x1={XL} y1={YM} x2={MX - 44} y2={YM} />
        <Z x1={MX + 44} y1={YM} x2={XR} y2={YM} />
        {/* masa */}
        <Z x1={MX} y1={YB} x2={MX} y2={508} />
        <Z x1={MX - 24} y1={508} x2={MX + 24} y2={508} />
        <Z x1={MX - 14} y1={517} x2={MX + 14} y2={517} />
        <Z x1={MX - 5} y1={526} x2={MX + 5} y2={526} />
      </g>

      <TokStruje citaj={citajTok}>
      {/* baterija */}
      <Z x1={36} y1={258} x2={84} y2={258} klasa={stil.baterijaDuga} />
      <Z x1={48} y1={270} x2={72} y2={270} klasa={stil.baterijaKratka} />
      <Z x1={36} y1={290} x2={84} y2={290} klasa={stil.baterijaDuga} />
      <Z x1={48} y1={302} x2={72} y2={302} klasa={stil.baterijaKratka} />
      <text x={92} y={254} className={stil.tekst}>
        +
      </text>
      <text x={96} y={286} className={stil.tekst}>
        {broj(MOTOR.napajanje, 1)} V
      </text>
      <text x={96} y={308} className={stil.tihTekst}>
        3S LiPo
      </text>

      {/* čvorovi */}
      {[
        [XL, YM],
        [XR, YM],
        [XL, YT],
        [XR, YT],
        [XL, YB],
        [XR, YB],
        [MX, YB],
      ].map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r={5} className={stil.cvor} />
      ))}

      {/* L298N: dvije strane čipa. Natpis je unutar okvira, lijevo od žice noge, da ga žica ne presijeca. */}
      {cip && (
        <g>
          <rect x={156} y={100} width={146} height={360} rx={6} className={stil.cip} />
          <rect x={476} y={100} width={138} height={360} rx={6} className={stil.cip} />
          <text x={164} y={236} className={stil.natpisCipa}>
            L298N
          </text>
          <text x={164} y={254} className={stil.natpisCipa}>
            strana A
          </text>
          <text x={484} y={236} className={stil.natpisCipa}>
            L298N
          </text>
          <text x={484} y={254} className={stil.natpisCipa}>
            strana B
          </text>
        </g>
      )}

      {/* motor */}
      <circle cx={MX} cy={YM} r={44} className={stil.motor} />
      <text x={MX} y={YM + 11} textAnchor="middle" className={stil.slovoMotora}>
        M
      </text>
      <circle
        ref={rotorRef}
        cx={MX}
        cy={YM - 32}
        r={4.5}
        fill="var(--djeluj)"
        style={{ transformOrigin: `${MX}px ${YM}px`, transformBox: 'view-box' }}
      />
      <text x={MX} y={YM + 74} textAnchor="middle" className={stil.tihTekst}>
        motor
      </text>

      {/* prekidači */}
      {SKLOPKE.map((s) => {
        const zatvoren = prikaz.sklopke[s.kljuc];
        const sredina = (s.y1 + s.y2) / 2;
        const zadat = prikaz.stanje.prekidaci[s.kljuc];
        return (
          <g key={s.kljuc}>
            <circle cx={s.x} cy={s.y1} r={5} className={stil.prikljucak} />
            <circle cx={s.x} cy={s.y2} r={5} className={stil.prikljucak} />
            <line
              x1={s.x}
              y1={s.y1}
              x2={s.x}
              y2={s.y2 - 5}
              className={`${stil.poluga} ${zatvoren && prikaz.ziva ? stil.polugaZiva : ''}`}
              style={{ transformOrigin: `${s.x}px ${s.y1}px`, transform: zatvoren ? 'rotate(0deg)' : 'rotate(-26deg)' }}
            />
            <text x={s.x - 20} y={sredina + 4} textAnchor="end" className={stil.oznakaSklopke}>
              {s.ime}
            </text>
            {cip && (
              <text x={s.x - 20} y={sredina + 26} textAnchor="end" className={stil.ulazSklopke}>
                {s.ulaz}
              </text>
            )}
            {!cip && (
              <rect
                x={s.x - 44}
                y={s.y1 - 16}
                width={96}
                height={s.y2 - s.y1 + 32}
                rx={6}
                className={stil.meta}
                tabIndex={0}
                role="button"
                aria-label={`Prekidač ${s.ime}`}
                aria-pressed={zadat}
                onClick={() => onPrebaci(s.kljuc)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    e.stopPropagation();
                    onPrebaci(s.kljuc);
                  }
                }}
              />
            )}
          </g>
        );
      })}

      </TokStruje>

      <text x={310} y={548} textAnchor="middle" className={stil.tihTekst}>
        Tačke pokazuju smjer struje, od plusa ka masi. Brže tačke znače jaču struju.
      </text>

      {/* varnice */}
      <g>
        {Array.from({ length: 9 }, (_, i) => (
          <line
            key={i}
            ref={(el) => {
              varniceRef.current[i] = el;
            }}
            className={stil.varnica}
            x1={0}
            y1={0}
            x2={0}
            y2={0}
            opacity={0}
          />
        ))}
      </g>
    </svg>
  );
}
