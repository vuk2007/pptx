'use client';

import { useState, type KeyboardEvent, type ReactNode } from 'react';
import { broj } from '@/lib/format';
import type { Grana } from '@/lib/fizika/kirchhoff';
import { nabojUnutra, promjena, strujaKrozPovrsinu, uloga, type Promjena } from '@/lib/fizika/predznaci';
import { Klizac, Ocitavanja, Ocitavanje, Taster } from '@/components/instrument/Okvir';
import { Laboratorija, RedDugmadi } from '@/components/faks/Laboratorija';
import { Ose, kriva, skala, type Okvir, type Raspon } from '@/components/faks/Graf';
import { Strelica } from '@/components/faks/svg';
import s from '@/components/faks/sema.module.css';
import f from '@/components/faks/faks.module.css';

/*
  Tijelo sa jednom do tri žice. Strelica na žici se okreće klikom (ili
  Enterom kad je u fokusu). Pet koraka vode od strelica do Q_not(t);
  četvrti traži da se prvo odgovori, pa tek onda pokaže tačno.
*/

const W = 1000;
const H = 480;
const TIJELO = { cx: 330, cy: 240, rx: 150, ry: 115 };
/** Uglovi žica, redom: lijevo, desno gore, desno dolje. */
const UGLOVI = [Math.PI, -Math.PI / 5, Math.PI / 5];
const DUZINA_ZICE = 120;
const GRAF: Okvir = { x: 640, y: 50, w: 320, h: 330 };
const Q0 = 10;
const T_MAX = 5;
const INDEKS = ['₁', '₂', '₃'];

const POCETNO: Grana[] = [
  { i: 3, orijentacija: 'iz' },
  { i: 5, orijentacija: 'u' },
  { i: 2, orijentacija: 'iz' },
];

const Qn = (
  <>
    Q<sub>not</sub>
  </>
);
const QnSvg = (
  <>
    Q
    <tspan baselineShift="sub" fontSize="0.7em">
      not
    </tspan>
  </>
);

const IZBORI: { id: Promjena; natpis: ReactNode }[] = [
  { id: 'raste', natpis: <>{Qn} raste</> },
  { id: 'opada', natpis: <>{Qn} opada</> },
  { id: 'stalno', natpis: 'ne mijenja se' },
];

function tackaNaRubu(ugao: number, dodatak = 0) {
  return {
    x: TIJELO.cx + (TIJELO.rx + dodatak) * Math.cos(ugao),
    y: TIJELO.cy + (TIJELO.ry + dodatak) * Math.sin(ugao),
  };
}

export default function Simulacija() {
  const [brojZica, postaviBroj] = useState(2);
  const [grane, postaviGrane] = useState<Grana[]>(POCETNO);
  const [normala, postaviNormalu] = useState<1 | -1>(1);
  const [korak, postaviKorak] = useState(1);
  const [odgovor, postaviOdgovor] = useState<Promjena | null>(null);

  const aktivne = grane.slice(0, brojZica);
  const van = strujaKrozPovrsinu(aktivne, 1);
  const krozPovrsinu = strujaKrozPovrsinu(aktivne, normala);
  const u = uloga(aktivne);
  const p = promjena(aktivne);

  /* Kad se tijelo promijeni, odgovor iz koraka 4 više ne važi. */
  function izmijeni(nove: Grana[], noviBroj = brojZica) {
    postaviGrane(nove);
    postaviBroj(noviBroj);
    if (korak > 3) postaviKorak(4);
    postaviOdgovor(null);
  }

  function okreni(k: number) {
    izmijeni(grane.map((g, j) => (j === k ? { ...g, orijentacija: g.orijentacija === 'u' ? 'iz' : 'u' } : g)));
  }

  const izraz = aktivne
    .map((g, k) => {
      const znak = (g.orijentacija === 'iz' ? 1 : -1) * normala;
      return `${znak > 0 ? '+' : '−'} i${INDEKS[k]}`;
    })
    .join(' ');
  const brojevi = aktivne
    .map((g) => {
      const znak = (g.orijentacija === 'iz' ? 1 : -1) * normala;
      return `${znak > 0 ? '+' : '−'} ${broj(g.i, 0)}`;
    })
    .join(' ');
  const imeStruje = (
    <>
      i<sub>{normala === 1 ? 'van' : 'unutra'}</sub>
    </>
  );

  const qKraj = nabojUnutra(T_MAX, Q0, aktivne);
  const yr: Raspon = [Math.min(0, Q0, qKraj) - 4, Math.max(Q0, qKraj) + 4];
  const xr: Raspon = [0, T_MAX];
  const sk = skala(GRAF, xr, yr);

  const KORACI = [
    {
      naslov: 'Smjer',
      tekst: (
        <>
          {aktivne.map((g, k) => `i${INDEKS[k]} ${g.orijentacija === 'iz' ? 'iz tijela' : 'u tijelo'}`).join(', ')}. Klikni na
          strelicu da je okreneš.
        </>
      ),
    },
    {
      naslov: normala === 1 ? 'Struja van sa predznakom' : 'Struja sa predznakom, normala unutra',
      tekst: (
        <>
          {imeStruje} = {izraz.replace(/^\+ /, '')} = {brojevi.replace(/^\+ /, '')} = <b>{broj(krozPovrsinu, 0)} A</b>
          {normala === 1
            ? '. Plus za strelicu prema van, minus prema unutra.'
            : '. Normala gleda unutra, pa su svi predznaci obrnuti; to je protiv dogovora.'}
        </>
      ),
    },
    {
      naslov: 'Izvor ili ponor',
      tekst:
        u === 'izvor'
          ? `Struja van je ${broj(van, 0)} A, pozitivna: više izlazi nego što ulazi, pa je tijelo izvor.`
          : u === 'ponor'
            ? `Struja van je ${broj(van, 0)} A, negativna: više ulazi nego što izlazi, pa je tijelo ponor.`
            : 'Struja van je nula: koliko uđe, toliko izađe. Tijelo nije ni izvor ni ponor.',
    },
    {
      naslov: 'Raste ili opada',
      tekst:
        odgovor === null ? (
          'Prvo izaberi: šta se dešava sa nabojem unutra?'
        ) : (
          <>
            {odgovor === p ? 'Tačno. ' : 'Nije tako. '}
            {Qn} {p === 'raste' ? 'raste' : p === 'opada' ? 'opada' : 'se ne mijenja'}: d{Qn}/dt = −i<sub>van</sub> ={' '}
            {broj(-van, 0)} A.
          </>
        ),
    },
    {
      naslov: 'Naboj unutra kroz vrijeme',
      tekst: (
        <>
          {Qn}(t) = {broj(Q0, 0)} C {van <= 0 ? '+' : '−'} {broj(Math.abs(van), 0)} A · t. Poslije {T_MAX} s: {broj(qKraj, 0)} C.
        </>
      ),
    },
  ];

  return (
    <Laboratorija
      crtez={
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Tijelo sa ${brojZica} žice; struja van ${broj(van, 0)} A.`}>
          <ellipse cx={TIJELO.cx} cy={TIJELO.cy} rx={TIJELO.rx} ry={TIJELO.ry} className={f.tijelo} />
          <text x={TIJELO.cx} y={TIJELO.cy + 10} textAnchor="middle" className={f.oznakaPodrucja}>
            Q
            <tspan baselineShift="sub" fontSize="0.7em">
              not
            </tspan>
          </text>

          {/* Normale na rubu, između žica. */}
          {[-Math.PI / 2, Math.PI / 2, (-3 * Math.PI) / 4, (3 * Math.PI) / 4, 0].map((ugao) => {
            const a = tackaNaRubu(ugao);
            const b = tackaNaRubu(ugao, normala * 34);
            return <Strelica key={ugao} x1={a.x} y1={a.y} x2={b.x} y2={b.y} boja="normala" velicina={12} />;
          })}

          {aktivne.map((g, k) => {
            const ugao = UGLOVI[k];
            const a = tackaNaRubu(ugao);
            const kraj = tackaNaRubu(ugao, DUZINA_ZICE);
            const sredina = tackaNaRubu(ugao, DUZINA_ZICE / 2);
            const ux = Math.cos(ugao);
            const uy = Math.sin(ugao);
            const smjer = g.orijentacija === 'iz' ? 1 : -1;
            const d = 26;
            const naKlik = () => okreni(k);
            const naTaster = (e: KeyboardEvent) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                okreni(k);
              }
            };
            const natpis = {
              x: kraj.x + ux * 14,
              y: kraj.y + uy * 14 + (uy < 0 ? -10 : uy > 0 ? 30 : -24),
            };
            return (
              <g key={k}>
                <line x1={a.x} y1={a.y} x2={kraj.x} y2={kraj.y} className={f.zica} />
                <g
                  role="button"
                  tabIndex={0}
                  aria-label={`Okreni strelicu i${INDEKS[k]}, sada ${g.orijentacija === 'iz' ? 'iz tijela' : 'u tijelo'}`}
                  onClick={naKlik}
                  onKeyDown={naTaster}
                  className={f.klikStrelica}
                >
                  <circle cx={sredina.x} cy={sredina.y} r={34} className={f.metaKlika} />
                  <Strelica
                    x1={sredina.x - ux * d * smjer}
                    y1={sredina.y - uy * d * smjer}
                    x2={sredina.x + ux * d * smjer}
                    y2={sredina.y + uy * d * smjer}
                    boja="struja"
                    velicina={18}
                    debljina={5}
                  />
                </g>
                <text x={natpis.x} y={natpis.y} textAnchor={ux < -0.5 ? 'start' : ux > 0.5 ? 'end' : 'middle'} className={s.tekst}>
                  i{INDEKS[k]} = {broj(g.i, 0)} A
                </text>
              </g>
            );
          })}

          {korak >= 5 ? (
            <Ose okvir={GRAF} xr={xr} yr={yr} xNatpis="t / s" yNatpis={<>{QnSvg} / C</>} xCilj={5}>
              <polyline points={kriva((t) => nabojUnutra(t, Q0, aktivne), sk, 0, T_MAX, 2)} className={f.kriva} />
              <circle cx={sk.x(0)} cy={sk.y(Q0)} r={6} className={s.neutralno} />
            </Ose>
          ) : (
            <text x={GRAF.x + GRAF.w / 2} y={GRAF.y + GRAF.h / 2} textAnchor="middle" className={s.tih}>
              {QnSvg}(t) u koraku 5
            </text>
          )}
        </svg>
      }
      kontrole={
        <>
          <RedDugmadi opis="Broj žica">
            {[1, 2, 3].map((n) => (
              <Taster key={n} pritisnut={brojZica === n} onClick={() => izmijeni(grane, n)}>
                {n} {n === 1 ? 'žica' : 'žice'}
              </Taster>
            ))}
          </RedDugmadi>
          {aktivne.map((g, k) => (
            <div key={k} className={f.grana}>
              <Klizac
                id={`p${k}`}
                natpis={`i${INDEKS[k]}`}
                vrijednost={g.i}
                prikaz={`${broj(g.i, 0)} A`}
                min={0}
                max={6}
                korak={1}
                boja="current"
                onPromjena={(i) => izmijeni(grane.map((x, j) => (j === k ? { ...x, i } : x)))}
              />
              <Taster onClick={() => okreni(k)}>{g.orijentacija === 'iz' ? 'iz tijela' : 'u tijelo'}</Taster>
            </div>
          ))}
          <RedDugmadi opis="Normala">
            <Taster pritisnut={normala === -1} boja="normala" onClick={() => postaviNormalu(normala === 1 ? -1 : 1)}>
              Okreni normalu
            </Taster>
          </RedDugmadi>
        </>
      }
      ocitavanja={
        <Ocitavanja>
          <Ocitavanje
            natpis={normala === 1 ? 'Struja van' : 'Struja, normala unutra'}
            vrijednost={broj(krozPovrsinu, 0)}
            jedinica="A"
            pod={normala === 1 ? 'normala prema van' : 'protiv dogovora'}
          />
          <Ocitavanje natpis={<>Q<sub>not</sub>(0)</>} vrijednost={broj(Q0, 0)} jedinica="C" pod="naboj na početku" />
        </Ocitavanja>
      }
      status={
        <ol className={f.koraci}>
          {KORACI.map((k, i) => {
            const redni = i + 1;
            const vidljiv = redni <= korak;
            return (
              <li key={k.naslov} data-buduci={!vidljiv || undefined}>
                <span className={f.brojKoraka}>{redni}</span>
                <div>
                  <p className={f.naslovKoraka}>{k.naslov}</p>
                  {vidljiv && <p className={f.tekstKoraka}>{k.tekst}</p>}
                  {vidljiv && redni === 4 && odgovor === null && (
                    <RedDugmadi opis="Tvoj odgovor">
                      {IZBORI.map((x) => (
                        <Taster key={x.id} onClick={() => postaviOdgovor(x.id)}>
                          {x.natpis}
                        </Taster>
                      ))}
                    </RedDugmadi>
                  )}
                </div>
              </li>
            );
          })}
          <li className={f.daljeKoraci}>
            {korak < 5 ? (
              <Taster disabled={korak === 4 && odgovor === null} onClick={() => postaviKorak(korak + 1)}>
                Sljedeći korak
              </Taster>
            ) : (
              <Taster
                onClick={() => {
                  postaviKorak(1);
                  postaviOdgovor(null);
                }}
              >
                Ispočetka
              </Taster>
            )}
          </li>
        </ol>
      }
    />
  );
}
