'use client';

import { useEffect, useRef, useState } from 'react';
import { MOTOR, PWM_STVARNO_HZ } from '@/config/cinjenice';
import { broj } from '@/lib/format';
import { useAnimacija } from '@/lib/animacija';
import { PROZOR, type TrenutnoHMosta } from '@/lib/h-most';
import { kontraNapon } from '@/lib/motor';
import {
  BLIZU_GRANICE,
  PUN_NAPON,
  korakPwm,
  POCETNO_PWM,
  porukaPwm,
  postaviRampu,
  rampaRadi,
  resetujPwm,
  zadaj,
  type StanjePwm,
} from '@/lib/pwm';
import { brzinaCestica, jacinaToka, napraviPutanju, type Tacka } from '@/lib/tok';
import {
  KarticaTocka,
  Klizac,
  Napomena,
  Ocitavanja,
  Ocitavanje,
  Okvir,
  PanelKontrola,
  Rezimi,
  StatusLinija,
  Taster,
  instrumentStil,
} from '@/components/instrument/Okvir';
import { Oscilloskop, Snimak, type Kanal } from '@/components/instrument/Oscilloskop';
import { TokStruje, type Tok } from '@/components/instrument/TokStruje';
import stil from './sema.module.css';

/* ------------------------------------------------ geometrija šeme */

const BX = 110;
const Y_GORE = 150;
const Y_DOLE = 310;
const Y_BAT = 230;
const CIP = { x: 280, y: 110, w: 200, h: 240 };
const X_UNUTRA = 400;
const Y_OUT1 = 170;
const Y_OUT2 = 290;
const MX = 640;
const MY = 230;
const MR = 44;
const Y_EN = 58;
const X_EN = 330;

/* Put struje dok je most uključen: od plusa kroz čip, motor, nazad kroz čip na minus. */
const PUT: Tacka[] = [
  [BX, Y_BAT - 30],
  [BX, Y_GORE],
  [CIP.x, Y_GORE],
  [X_UNUTRA, Y_GORE],
  [X_UNUTRA, Y_OUT1],
  [MX, Y_OUT1],
  [MX, MY - MR],
  [MX, MY + MR],
  [MX, Y_OUT2],
  [X_UNUTRA, Y_OUT2],
  [X_UNUTRA, Y_DOLE],
  [BX, Y_DOLE],
  [BX, Y_BAT + 30],
];
const PUTANJA = napraviPutanju(PUT);

const KANALI: readonly Kanal[] = [
  { boja: 'ch1', natpis: 'CH1 napon na motoru, 4 V/pod.', skala: 4, stepenasto: true },
  { boja: 'current', natpis: 'CH2 struja, 1 A/pod.', skala: 1 },
];

const REZIMI = [
  { id: 'skok', natpis: 'Skok' },
  { id: 'rampa', natpis: 'Rampa' },
] as const;

type Prikaz = { stanje: StanjePwm; ukljucen: boolean };

export function Pwm() {
  const stanje = useRef<StanjePwm>(POCETNO_PWM);
  const trenutno = useRef<TrenutnoHMosta | null>(null);
  const [snimak] = useState(() => new Snimak(PROZOR));
  const [prikaz, postaviPrikaz] = useState<Prikaz>({ stanje: POCETNO_PWM, ukljucen: false });
  const tocakRef = useRef<SVGGElement | null>(null);
  const rotorRef = useRef<SVGCircleElement | null>(null);
  const ugao = useRef(0);
  const kadar = useRef(0);

  function promijeni(novo: (st: StanjePwm) => StanjePwm) {
    stanje.current = novo(stanje.current);
    postaviPrikaz({ stanje: stanje.current, ukljucen: trenutno.current?.pwmUkljucen ?? false });
  }

  function naResetuj() {
    snimak.ocisti();
    promijeni(resetujPwm);
  }

  useAnimacija((dt) => {
    const prije = trenutno.current;
    const { stanje: st, trenutno: tr } = korakPwm(stanje.current, dt);
    stanje.current = st;
    trenutno.current = tr;
    snimak.dodaj(st.most.t, [tr.naponTrenutni, tr.strujaTrenutna]);

    ugao.current += st.most.brzina * 6 * dt * 0.22;
    tocakRef.current?.style.setProperty('transform', `rotate(${ugao.current}deg)`);
    rotorRef.current?.style.setProperty('transform', `rotate(${ugao.current * 3}deg)`);

    kadar.current++;
    const ukljucen = tr.pwmUkljucen && st.most.popuna > 0;
    if (kadar.current % 5 === 0 || (prije && prije.pwmUkljucen !== tr.pwmUkljucen)) {
      postaviPrikaz({ stanje: st, ukljucen });
    }
  });

  /* Tastatura: strelice mijenjaju popunu, M uključuje rampu, R resetuje. */
  useEffect(() => {
    const naTaster = (e: KeyboardEvent) => {
      const cilj = e.target as HTMLElement | null;
      if (cilj?.tagName === 'INPUT' || e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key.toLowerCase();
      if (k === 'arrowup' || k === 'arrowright') {
        promijeni((st) => zadaj(st, Math.round(st.zadato * 100 + 5) / 100));
        e.preventDefault();
      } else if (k === 'arrowdown' || k === 'arrowleft') {
        promijeni((st) => zadaj(st, Math.round(st.zadato * 100 - 5) / 100));
        e.preventDefault();
      } else if (k === 'm') {
        promijeni((st) => postaviRampu(st, !st.rampa));
      } else if (k === 'r') {
        naResetuj();
      }
    };
    window.addEventListener('keydown', naTaster);
    return () => window.removeEventListener('keydown', naTaster);
    // Stanje se čita kroz ref, pa se slušalac postavlja jednom.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const st = prikaz.stanje;
  const poruka = porukaPwm(st);
  const zadato = Math.round(st.zadato * 100);
  const primijenjeno = Math.round(st.most.popuna * 100);
  const obrtaja = Math.abs(st.most.brzina);

  function citajTok(): Tok | null {
    const tr = trenutno.current;
    if (!tr || tr.trenutni !== 'naprijed') return null;
    return {
      putanja: PUTANJA,
      brzina: Math.sign(tr.strujaTrenutna || 1) * brzinaCestica(tr.strujaTrenutna),
      jacina: jacinaToka(tr.strujaTrenutna),
      greska: false,
    };
  }

  return (
    <Okvir
      nazad={{ naziv: 'Perjanik', putanja: '/perjanik' }}
      naslov="PWM"
      uvod="Motor se ne prigušuje: most se pali i gasi, a popuna određuje srednji napon."
      rezimi={
        <Rezimi
          opis="Kako popuna stiže na motor"
          opcije={REZIMI}
          izabran={st.rampa ? 'rampa' : 'skok'}
          onIzbor={(id) => promijeni((s) => postaviRampu(s, id === 'rampa'))}
        />
      }
      onResetuj={naResetuj}
      status={<StatusLinija sta={poruka.sta} zasto={poruka.zasto} />}
      osciloskop={
        <Oscilloskop
          kanali={KANALI}
          snimak={snimak}
          desno={`${PROZOR} s na ekranu. PWM je usporen: stvarno oko ${PWM_STVARNO_HZ} puta u sekundi.`}
          opis="Osciloskop: napon i struja motora kroz vrijeme"
        />
      }
      sema={
        <svg viewBox="0 0 760 420" role="img" aria-label="Šema: Arduino šalje PWM na EN ulaz L298N, koji napaja motor iz baterije">
          {/* Arduino i EN */}
          <rect x={40} y={30} width={170} height={56} rx={4} className={stil.blok} />
          <text x={125} y={64} textAnchor="middle" className={stil.tekst}>
            Arduino
          </text>
          <polyline
            points={`210,${Y_EN} ${X_EN},${Y_EN} ${X_EN},${CIP.y}`}
            className={prikaz.ukljucen ? stil.logikaVisoko : stil.logikaNisko}
          />
          <text x={222} y={Y_EN - 10} className={stil.oznakaLogike}>
            EN = {prikaz.ukljucen ? 1 : 0}
          </text>
          <text x={X_EN + 14} y={CIP.y - 12} className={stil.tih}>
            IN1 = 1, IN2 = 0
          </text>

          {/* žice */}
          <polyline points={`${BX},${Y_BAT - 30} ${BX},${Y_GORE} ${CIP.x},${Y_GORE}`} className={stil.zica} />
          <polyline points={`${BX},${Y_BAT + 30} ${BX},${Y_DOLE} ${CIP.x},${Y_DOLE}`} className={stil.zica} />
          <polyline points={`${CIP.x + CIP.w},${Y_OUT1} ${MX},${Y_OUT1} ${MX},${MY - MR}`} className={stil.zica} />
          <polyline points={`${CIP.x + CIP.w},${Y_OUT2} ${MX},${Y_OUT2} ${MX},${MY + MR}`} className={stil.zica} />
          {/* masa */}
          <line x1={BX} y1={Y_DOLE} x2={BX} y2={Y_DOLE + 24} className={stil.zica} />
          <line x1={BX - 22} y1={Y_DOLE + 24} x2={BX + 22} y2={Y_DOLE + 24} className={stil.zica} />
          <line x1={BX - 13} y1={Y_DOLE + 32} x2={BX + 13} y2={Y_DOLE + 32} className={stil.zica} />
          <line x1={BX - 5} y1={Y_DOLE + 40} x2={BX + 5} y2={Y_DOLE + 40} className={stil.zica} />

          <TokStruje citaj={citajTok}>
            {/* baterija */}
            <line x1={BX - 24} y1={Y_BAT - 30} x2={BX + 24} y2={Y_BAT - 30} className={stil.baterijaDuga} />
            <line x1={BX - 12} y1={Y_BAT - 18} x2={BX + 12} y2={Y_BAT - 18} className={stil.baterijaKratka} />
            <line x1={BX - 24} y1={Y_BAT + 18} x2={BX + 24} y2={Y_BAT + 18} className={stil.baterijaDuga} />
            <line x1={BX - 12} y1={Y_BAT + 30} x2={BX + 12} y2={Y_BAT + 30} className={stil.baterijaKratka} />
            <line x1={BX} y1={Y_BAT - 18} x2={BX} y2={Y_BAT + 18} className={stil.zicaTanka} />
            <text x={BX - 34} y={Y_BAT - 30} textAnchor="end" className={stil.tekst}>
              +
            </text>
            <text x={BX - 34} y={Y_BAT + 6} textAnchor="end" className={stil.tekst}>
              {broj(MOTOR.napajanje, 1)} V
            </text>

            {/* L298N */}
            <rect x={CIP.x} y={CIP.y} width={CIP.w} height={CIP.h} rx={4} className={stil.cip} />
            <text x={CIP.x + CIP.w / 2} y={CIP.y + CIP.h / 2 - 6} textAnchor="middle" className={stil.naslovCipa}>
              L298N
            </text>
            <text x={CIP.x + CIP.w / 2} y={CIP.y + CIP.h / 2 + 20} textAnchor="middle" className={prikaz.ukljucen ? stil.stanjeUkljuceno : stil.tih}>
              most {prikaz.ukljucen ? 'uključen' : 'isključen'}
            </text>
            <text x={CIP.x - 8} y={Y_GORE - 12} textAnchor="end" className={stil.pin}>
              VS
            </text>
            <text x={CIP.x - 8} y={Y_DOLE - 12} textAnchor="end" className={stil.pin}>
              GND
            </text>
            <text x={CIP.x + CIP.w + 8} y={Y_OUT1 - 12} textAnchor="start" className={stil.pin}>
              OUT1
            </text>
            <text x={CIP.x + CIP.w + 8} y={Y_OUT2 - 12} textAnchor="start" className={stil.pin}>
              OUT2
            </text>

            {/* motor */}
            <circle cx={MX} cy={MY} r={MR} className={stil.motor} />
            <text x={MX} y={MY + 11} textAnchor="middle" className={stil.slovoMotora}>
              M
            </text>
            <circle
              ref={rotorRef}
              cx={MX}
              cy={MY - 32}
              r={4.5}
              fill="var(--djeluj)"
              style={{ transformOrigin: `${MX}px ${MY}px`, transformBox: 'view-box' }}
            />

            {[
              [BX, Y_GORE],
              [BX, Y_DOLE],
            ].map(([x, y]) => (
              <circle key={`${x}-${y}`} cx={x} cy={y} r={5} className={stil.cvor} />
            ))}
          </TokStruje>

          <text x={380} y={404} textAnchor="middle" className={stil.tih}>
            Tačke teku samo dok je most uključen. Brže tačke znače jaču struju.
          </text>
        </svg>
      }
      strana={
        <>
          <KarticaTocka
            natpis="Točak, motor sa reduktorom"
            obrtaja={Math.round(obrtaja)}
            smjer={obrtaja < 1 ? 'stoji' : 'naprijed'}
            tocakRef={tocakRef}
          />

          <Ocitavanja>
            <Ocitavanje
              natpis="Srednji napon"
              vrijednost={broj(st.most.popuna * PUN_NAPON, 1)}
              jedinica="V"
              pod={`${primijenjeno} % × ${broj(PUN_NAPON, 1)} V${rampaRadi(st) ? `, rampa ide ka ${zadato} %` : ''}`}
            />
            <Ocitavanje natpis="Struja kroz motor" vrijednost={broj(st.most.struja, 2)} jedinica="A" pod="srednja vrijednost" />
            <Ocitavanje
              natpis="Vrh struje poslije promjene"
              vrijednost={broj(st.vrh, 2)}
              jedinica="A"
              pod={`granica L298N ${broj(MOTOR.granicaL298N, 0)} A po kanalu`}
              vruce={st.vrh > BLIZU_GRANICE}
            />
            <Ocitavanje natpis="Kontra-napon motora" vrijednost={broj(kontraNapon(st.most.brzina), 1)} jedinica="V" pod="raste sa brzinom" />
          </Ocitavanja>

          <PanelKontrola>
            <Klizac
              id="popuna"
              natpis="Popuna, EN"
              vrijednost={zadato}
              prikaz={`${zadato} %`}
              onPromjena={(v) => promijeni((s) => zadaj(s, v / 100))}
            />
            <div className={instrumentStil.redTastera}>
              {[0, 50, 100].map((p) => (
                <Taster key={p} boja="odluci" pritisnut={zadato === p} onClick={() => promijeni((s) => zadaj(s, p / 100))}>
                  {p} %
                </Taster>
              ))}
            </div>
          </PanelKontrola>

          <Napomena>Parametri motora su ilustrativni: ponašanje je tačno, brojevi nijesu izmjereni na Perjaniku.</Napomena>
        </>
      }
    />
  );
}
