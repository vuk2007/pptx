'use client';

import { useRef, useState } from 'react';
import { useAnimacija } from '@/lib/animacija';
import { broj } from '@/lib/format';
import { izjednaci, promjenaNaboja, stvarniSmjer, zbir, type Grana, type Orijentacija } from '@/lib/fizika/kirchhoff';
import { Klizac, Ocitavanja, Ocitavanje, StatusLinija, Taster } from '@/components/instrument/Okvir';
import { Laboratorija, RedDugmadi } from '@/components/faks/Laboratorija';
import { useSmanjenPokret } from '@/components/faks/pokret';
import { Strelica } from '@/components/faks/svg';
import s from '@/components/faks/sema.module.css';
import f from '@/components/faks/faks.module.css';

/*
  Strelica na žici je orijentacija: dogovor od kojeg zavisi predznak.
  Tačkice koje teku su stvarni smjer pozitivnog naboja. Dvije stvari se
  crtaju odvojeno jer se ne moraju slagati: −3 A sa strelicom iz čvora
  teče u čvor.
*/

const W = 1000;
const H = 500;
const CVOR = { x: 520, y: 250 };
/* Strana žice na kojoj stoje strelica i natpis: gore ili dolje, van ugla između žica. */
const KRAJEVI = [
  { x: 60, y: 70, gore: true },
  { x: 60, y: 430, gore: false },
  { x: 960, y: 250, gore: true },
];
const INDEKS = ['₁', '₂', '₃'];
/** Piksela u sekundi po amperu, za tačkice struje. */
const BRZINA = 14;

const POCETNO: Grana[] = [
  { i: 4, orijentacija: 'u' },
  { i: 1, orijentacija: 'u' },
  { i: 3, orijentacija: 'iz' },
];

export default function Simulacija() {
  const [grane, postaviGrane] = useState<Grana[]>(POCETNO);
  const smanjen = useSmanjenPokret();
  const [pauza, postaviPauzu] = useState<boolean | null>(null);
  const stoji = pauza ?? smanjen;
  const [naboj, postaviNaboj] = useState(0);

  const Q = useRef(0);
  const pomaci = useRef([0, 0, 0]);
  const linije = useRef<(SVGLineElement | null)[]>([]);
  const kadar = useRef(0);

  const sigma = zbir(grane);
  const dQ = promjenaNaboja(grane);

  useAnimacija((dt) => {
    if (stoji) return;
    Q.current += dQ * dt;
    grane.forEach((g, k) => {
      /* Linija je nacrtana od kraja ka čvoru: manji pomak gura tačkice ka čvoru. */
      pomaci.current[k] += stvarniSmjer(g) * Math.abs(g.i) * BRZINA * dt;
      linije.current[k]?.setAttribute('stroke-dashoffset', pomaci.current[k].toFixed(1));
    });
    kadar.current++;
    if (kadar.current % 5 === 0) postaviNaboj(Q.current);
  });

  function postavi(k: number, izmjena: Partial<Grana>) {
    postaviGrane((gr) => gr.map((g, j) => (j === k ? { ...g, ...izmjena } : g)));
  }

  function isprazni() {
    Q.current = 0;
    postaviNaboj(0);
  }

  const izraz = grane
    .map((g, k) => `${g.orijentacija === 'iz' ? '+' : '−'} i${INDEKS[k]}`)
    .join(' ')
    .replace(/^\+ /, '')
    .replace(/^− /, '−');

  const poluprecnik = 16 + Math.min(Math.abs(naboj), 60) * 0.8;
  const klasaNaboja = Math.abs(naboj) < 0.5 ? s.neutralno : naboj > 0 ? s.plus : s.minus;
  const ravnoteza = Math.abs(sigma) < 1e-9;

  return (
    <Laboratorija
      crtez={
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Čvor sa tri žice; zbir struja ${broj(sigma, 1)} A, naboj u čvoru ${broj(naboj, 1)} C.`}>
          {KRAJEVI.map((k, j) => (
            <line key={`p${j}`} x1={k.x} y1={k.y} x2={CVOR.x} y2={CVOR.y} className={f.zica} />
          ))}
          {KRAJEVI.map((k, j) => (
            <line
              key={`s${j}`}
              ref={(el) => {
                linije.current[j] = el;
              }}
              x1={k.x}
              y1={k.y}
              x2={CVOR.x}
              y2={CVOR.y}
              className={f.tokStruje}
              data-miruje={grane[j].i === 0 || undefined}
            />
          ))}

          <circle cx={CVOR.x} cy={CVOR.y} r={86} className={s.isprekidana} />
          <text x={CVOR.x + 70} y={CVOR.y + 112} className={s.tih}>
            <tspan>zatvorena površina</tspan>
            <tspan x={CVOR.x + 70} dy="1.15em">
              oko čvora
            </tspan>
          </text>
          <circle cx={CVOR.x} cy={CVOR.y} r={poluprecnik} className={`${klasaNaboja} ${f.jezgro}`} />

          {grane.map((g, j) => (
            <Orijentacija key={j} kraj={KRAJEVI[j]} grana={g} indeks={INDEKS[j]} />
          ))}
        </svg>
      }
      kontrole={
        <>
          {grane.map((g, k) => (
            <div key={k} className={f.grana}>
              <Klizac
                id={`i${k + 1}`}
                natpis={`i${INDEKS[k]}`}
                vrijednost={g.i}
                prikaz={`${broj(g.i, 1)} A`}
                min={-6}
                max={6}
                korak={0.5}
                boja="current"
                onPromjena={(i) => postavi(k, { i })}
              />
              <Taster onClick={() => postavi(k, { orijentacija: g.orijentacija === 'u' ? 'iz' : 'u' })}>
                strelica {g.orijentacija === 'u' ? 'u čvor' : 'iz čvora'}
              </Taster>
            </div>
          ))}
          <RedDugmadi opis="Čvor">
            <Taster onClick={() => postavi(2, { i: izjednaci(grane, 2) })}>Izjednači i₃</Taster>
            <Taster onClick={isprazni}>Isprazni čvor</Taster>
            <Taster pritisnut={stoji} onClick={() => postaviPauzu(!stoji)}>
              {stoji ? 'Pokreni' : 'Zaustavi'}
            </Taster>
          </RedDugmadi>
        </>
      }
      ocitavanja={
        <Ocitavanja>
          <Ocitavanje natpis="Σ(±)iₖ" vrijednost={broj(sigma, 1)} jedinica="A" pod={izraz} />
          <Ocitavanje natpis={<>dQ<sub>not</sub>/dt</>} vrijednost={broj(dQ, 1)} jedinica="C/s" pod="= −Σ(±)iₖ" />
          <Ocitavanje natpis="Naboj u čvoru" vrijednost={broj(naboj, 1)} jedinica="C" pod={Math.abs(naboj) >= 60 ? 'crtež ne raste preko 60 C' : ''} />
        </Ocitavanja>
      }
      status={
        ravnoteza ? (
          <StatusLinija
            sta="Σ(±)iₖ = 0: naboj u čvoru se ne mijenja."
            zasto="Koliko naboja uđe, toliko izađe, pa ovo stanje može trajati koliko god hoćeš. Zato je u stalnom stanju zbir uvijek nula."
          />
        ) : (
          <StatusLinija
            greska
            sta={`${dQ > 0 ? 'Ulazi više nego što izlazi: naboj u čvoru raste' : 'Izlazi više nego što ulazi: naboj u čvoru opada'} za ${broj(Math.abs(dQ), 1)} C svake sekunde.`}
            zasto="To ne staje samo od sebe. Čvor sa stalnim strujama ne može da gomila naboj bez kraja, pa ovakvo stanje u kolu ne postoji."
          />
        )
      }
    />
  );
}

function Orijentacija({ kraj, grana, indeks }: { kraj: (typeof KRAJEVI)[number]; grana: Grana; indeks: string }) {
  /* Strelica stoji uz sredinu žice, sa spoljne strane, i pokazuje dogovoreni smjer. */
  const dx = CVOR.x - kraj.x;
  const dy = CVOR.y - kraj.y;
  const d = Math.hypot(dx, dy);
  const ux = dx / d;
  const uy = dy / d;
  /* Normala na žicu, okrenuta na traženu stranu (y raste naniže). */
  const okreni = (ux > 0) === kraj.gore ? -1 : 1;
  const nx = -uy * okreni;
  const ny = ux * okreni;
  const pomak = 34;
  const sx = kraj.x + dx * 0.45 + nx * pomak;
  const sy = kraj.y + dy * 0.45 + ny * pomak;
  const L = 60;
  const ka: Orijentacija = grana.orijentacija;
  const smjer = ka === 'u' ? 1 : -1;
  const x1 = sx - (ux * L * smjer) / 2;
  const y1 = sy - (uy * L * smjer) / 2;
  const x2 = sx + (ux * L * smjer) / 2;
  const y2 = sy + (uy * L * smjer) / 2;
  const natpisY = kraj.gore ? sy - 22 : sy + 46;
  return (
    <g>
      <Strelica x1={x1} y1={y1} x2={x2} y2={y2} boja="neutralno" velicina={14} />
      <text x={sx} y={natpisY} textAnchor="middle" className={s.tekst}>
        i{indeks} = {broj(grana.i, 1)} A
      </text>
    </g>
  );
}
