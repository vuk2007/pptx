'use client';

import { useRef, useState } from 'react';
import { useAnimacija } from '@/lib/animacija';
import { broj } from '@/lib/format';
import { slucajno, type Slucajno } from '@/lib/fizika/slucajno';
import {
  brojUnutra,
  izgladi,
  korak,
  napraviStanje,
  strujaVan,
  type Oblik,
  type Polje,
  type Rezim,
  type Stanje,
} from '@/lib/fizika/kontinuitet';
import { Ocitavanja, Ocitavanje, StatusLinija, Taster } from '@/components/instrument/Okvir';
import { Laboratorija, RedDugmadi } from '@/components/faks/Laboratorija';
import { useSmanjenPokret } from '@/components/faks/pokret';
import { Strelica } from '@/components/faks/svg';
import s from '@/components/faks/sema.module.css';
import f from '@/components/faks/faks.module.css';

/*
  Svaka tačka je 1 nC pozitivnog naboja. Puna tačka je unutra, prazan
  kružić vani: mjesto se crta oblikom, jer boja ovdje nosi predznak.
*/

const POLJE: Polje = { sirina: 680, visina: 330, cx: 340, cy: 165, r: 95 };
const N = 150;
const SJEME = 3;
/** Ispod ovoga se struja van čita kao nula: šum lutanja. */
const PRAG = 1.5;

const REZIMI: { id: Rezim; natpis: string }[] = [
  { id: 'izlazi', natpis: 'Naboj izlazi' },
  { id: 'ulazi', natpis: 'Naboj ulazi' },
  { id: 'prolazi', natpis: 'Naboj prolazi kroz' },
];

function novo(oblik: Oblik, rezim: Rezim): { stanje: Stanje; rnd: Slucajno } {
  const rnd = slucajno(SJEME);
  return { stanje: napraviStanje(oblik, rezim, POLJE, N, rnd), rnd };
}

export default function Simulacija() {
  const [oblik, postaviOblik] = useState<Oblik>('zatvorena');
  const [rezim, postaviRezim] = useState<Rezim>('izlazi');
  const [normala, postaviNormalu] = useState<1 | -1>(1);
  const smanjen = useSmanjenPokret();
  const [pauza, postaviPauzu] = useState<boolean | null>(null);
  const stoji = pauza ?? smanjen;

  /*
    Isti objekat živi u stanju (da ga render nacrta) i u refu (da ga petlja
    pomjera). Petlja mijenja položaje u mjestu; render ih samo pročita.
  */
  const [pocetak, postaviPocetak] = useState(() => novo('zatvorena', 'izlazi'));
  const sim = useRef(pocetak);
  const tacke = useRef<(SVGCircleElement | null)[]>([]);
  /* Izglađena struja van (normala prema van) i izglađeno dQ_not/dt. */
  const van = useRef(0);
  const dq = useRef(0);
  const kadar = useRef(0);
  const [prikaz, postaviPrikaz] = useState(() => ({ unutra: brojUnutra(pocetak.stanje), van: 0, dq: 0 }));

  function pocni(o: Oblik, r: Rezim) {
    const nov = novo(o, r);
    sim.current = nov;
    postaviPocetak(nov);
    van.current = 0;
    dq.current = 0;
    postaviPrikaz({ unutra: brojUnutra(nov.stanje), van: 0, dq: 0 });
  }

  useAnimacija((dt) => {
    const { stanje, rnd } = sim.current;
    if (!stoji && dt > 0) {
      const prije = brojUnutra(stanje);
      const pr = korak(stanje, dt, rnd);
      van.current = izgladi(van.current, strujaVan(pr, dt, 1), dt);
      dq.current = izgladi(dq.current, (brojUnutra(stanje) - prije) / dt, dt);
    }
    stanje.naboji.forEach((n, i) => {
      const el = tacke.current[i];
      if (!el) return;
      el.setAttribute('cx', n.x.toFixed(1));
      el.setAttribute('cy', n.y.toFixed(1));
      el.setAttribute('data-unutra', oblik === 'zatvorena' && n.unutra ? '1' : '0');
    });
    kadar.current++;
    if (kadar.current % 6 === 0) {
      postaviPrikaz({ unutra: brojUnutra(stanje), van: van.current, dq: dq.current });
    }
  });

  const zatvorena = oblik === 'zatvorena';
  const prikazanaStruja = normala * prikaz.van;
  const efektivni = zatvorena ? rezim : 'prolazi';

  function izaberiOblik(o: Oblik) {
    postaviOblik(o);
    const r = o === 'ravan' ? 'prolazi' : rezim;
    postaviRezim(r);
    pocni(o, r);
  }

  function izaberiRezim(r: Rezim) {
    postaviRezim(r);
    pocni(oblik, r);
  }

  let poruka: { sta: string; zasto: string };
  if (!zatvorena) {
    poruka = {
      sta: `Kroz ravan teče ${broj(prikazanaStruja, 1)} nA, ali nema „unutra“ ni „vani“.`,
      zasto: 'Ravan nije zatvorena, pa nema naboja unutra ni vani, ni jednačine kontinuiteta: mjeri se samo koliko naboja pređe s jedne strane na drugu.',
    };
  } else if (Math.abs(prikaz.van) < PRAG) {
    poruka = {
      sta: 'Struja van je skoro nula: koliko naboja uđe, toliko i izađe.',
      zasto: 'Naboj unutra se ne mijenja, pa prostor unutra nije ni izvor ni ponor.',
    };
  } else if (prikaz.van > 0) {
    poruka = {
      sta: 'Naboj izlazi: struja van je pozitivna, a naboja unutra je sve manje.',
      zasto: 'Prostor unutra je izvor. Zato u jednačini stoji minus: pozitivna struja van znači da naboja unutra ima sve manje.',
    };
  } else {
    poruka = {
      sta: 'Naboj ulazi: struja van je negativna, a naboja unutra je sve više.',
      zasto: 'Prostor unutra je ponor. Naboja vani je manje tačno onoliko koliko ga je unutra više.',
    };
  }

  return (
    <Laboratorija
      crtez={
        <>
          <svg
            viewBox={`0 0 ${POLJE.sirina} ${POLJE.visina}`}
            role="img"
            aria-label={
              zatvorena
                ? `Zatvorena površina; unutra ${prikaz.unutra} nC, vani ${N - prikaz.unutra} nC.`
                : 'Otvorena ravan kroz koju naboji prolaze sa lijeva na desno.'
            }
          >
            {zatvorena ? (
              <circle cx={POLJE.cx} cy={POLJE.cy} r={POLJE.r} className={s.isprekidana} />
            ) : (
              <line x1={POLJE.cx} y1={16} x2={POLJE.cx} y2={POLJE.visina - 16} className={s.isprekidana} />
            )}
            <Normale zatvorena={zatvorena} normala={normala} />
            <g className={f.naboji}>
              {pocetak.stanje.naboji.map((n, i) => (
                <circle
                  key={`${oblik}-${efektivni}-${i}`}
                  ref={(el) => {
                    tacke.current[i] = el;
                  }}
                  cx={n.x}
                  cy={n.y}
                  r={4}
                  data-unutra={zatvorena && n.unutra ? '1' : '0'}
                />
              ))}
            </g>
            {zatvorena && (
              <>
                <text x={POLJE.cx} y={POLJE.cy + 8} textAnchor="middle" className={`${f.oznakaPodrucja} ${f.naCrtezu}`}>
                  Q
                  <tspan baselineShift="sub" fontSize="0.7em">
                    not
                  </tspan>
                </text>
                <text x={20} y={34} className={`${f.oznakaPodrucja} ${f.naCrtezu}`}>
                  Q
                  <tspan baselineShift="sub" fontSize="0.7em">
                    zun
                  </tspan>
                </text>
              </>
            )}
          </svg>
          <p className={f.jednacina}>
            {zatvorena ? (
              normala === 1 ? (
                <>
                  ∮<b>J</b>·d<b>a</b> = {broj(prikazanaStruja, 1)} nA ≈ −dQ<sub>not</sub>/dt = {broj(-prikaz.dq, 1)} nA
                </>
              ) : (
                <>
                  normala unutra: ∮<b>J</b>·d<b>a</b> = {broj(prikazanaStruja, 1)} nA ≈ +dQ<sub>not</sub>/dt ={' '}
                  {broj(prikaz.dq, 1)} nA, bez minusa
                </>
              )
            ) : (
              <>
                ∫<b>J</b>·d<b>a</b> = {broj(prikazanaStruja, 1)} nA; zatvorenog integrala ∮ ovdje nema
              </>
            )}
          </p>
        </>
      }
      kontrole={
        <>
          <RedDugmadi opis="Površina">
            <Taster pritisnut={zatvorena} onClick={() => izaberiOblik('zatvorena')}>
              Zatvorena površina
            </Taster>
            <Taster pritisnut={!zatvorena} onClick={() => izaberiOblik('ravan')}>
              Otvorena ravan
            </Taster>
          </RedDugmadi>
          {zatvorena && (
            <RedDugmadi opis="Kretanje naboja">
              {REZIMI.map((r) => (
                <Taster key={r.id} pritisnut={rezim === r.id} onClick={() => izaberiRezim(r.id)}>
                  {r.natpis}
                </Taster>
              ))}
            </RedDugmadi>
          )}
          <RedDugmadi opis="Normala i vrijeme">
            <Taster pritisnut={normala === -1} boja="normala" onClick={() => postaviNormalu(normala === 1 ? -1 : 1)}>
              Okreni normalu
            </Taster>
            <Taster pritisnut={stoji} onClick={() => postaviPauzu(!stoji)}>
              {stoji ? 'Pokreni' : 'Zaustavi'}
            </Taster>
            <Taster onClick={() => pocni(oblik, rezim)}>Počni ispočetka</Taster>
          </RedDugmadi>
        </>
      }
      ocitavanja={
        <Ocitavanja>
          <Ocitavanje natpis={<>Q<sub>not</sub>, unutra</>} vrijednost={zatvorena ? String(prikaz.unutra) : '—'} jedinica={zatvorena ? 'nC' : ''} />
          <Ocitavanje natpis={<>Q<sub>zun</sub>, vani</>} vrijednost={zatvorena ? String(N - prikaz.unutra) : '—'} jedinica={zatvorena ? 'nC' : ''} />
          <Ocitavanje natpis={<>Q<sub>not</sub> + Q<sub>zun</sub></>} vrijednost={zatvorena ? String(N) : '—'} jedinica={zatvorena ? 'nC' : ''} pod={zatvorena ? 'uvijek isto' : ''} />
          <Ocitavanje
            natpis={zatvorena ? 'Struja van ∮J·da' : 'Struja kroz ravan ∫J·da'}
            vrijednost={broj(prikazanaStruja, 1)}
            jedinica="nA"
            pod={zatvorena ? (normala === 1 ? 'normala prema van' : 'normala prema unutra, protiv dogovora') : 'normala udesno'}
          />
        </Ocitavanja>
      }
      status={<StatusLinija sta={poruka.sta} zasto={poruka.zasto} />}
    />
  );
}

function Normale({ zatvorena, normala }: { zatvorena: boolean; normala: 1 | -1 }) {
  const D = 34;
  if (!zatvorena) {
    return (
      <>
        {[70, 165, 260].map((y) => (
          <Strelica key={y} x1={POLJE.cx} y1={y} x2={POLJE.cx + normala * D} y2={y} boja="normala" velicina={12} />
        ))}
      </>
    );
  }
  return (
    <>
      {Array.from({ length: 8 }, (_, k) => {
        const a = (k * Math.PI) / 4 + Math.PI / 8;
        const c = Math.cos(a);
        const si = Math.sin(a);
        const r2 = POLJE.r + normala * D;
        return (
          <Strelica
            key={k}
            x1={POLJE.cx + POLJE.r * c}
            y1={POLJE.cy + POLJE.r * si}
            x2={POLJE.cx + r2 * c}
            y2={POLJE.cy + r2 * si}
            boja="normala"
            velicina={12}
          />
        );
      })}
    </>
  );
}
