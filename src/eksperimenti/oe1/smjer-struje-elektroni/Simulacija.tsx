'use client';

import { useRef, useState } from 'react';
import { useAnimacija } from '@/lib/animacija';
import { broj } from '@/lib/format';
import { slucajno } from '@/lib/fizika/slucajno';
import { izgladi } from '@/lib/fizika/kontinuitet';
import { NULA, korak, napraviNosioce, prenesenoUdesno, saberi, type Nosilac, type Prelazi, type Vrsta } from '@/lib/fizika/nosioci';
import { Klizac, Ocitavanja, Ocitavanje, StatusLinija, Taster } from '@/components/instrument/Okvir';
import { Laboratorija, RedDugmadi } from '@/components/faks/Laboratorija';
import { useSmanjenPokret } from '@/components/faks/pokret';
import { Strelica } from '@/components/faks/svg';
import s from '@/components/faks/sema.module.css';
import f from '@/components/faks/faks.module.css';

/*
  Žica sa nosiocima i presjekom u sredini. Svaki nosilac je 1 nC.
  Struja je naboj koji pređe presjek udesno u sekundi; tabela ispod
  crteža broji šta je prešlo i kako se promijenio naboj lijevo i desno.
*/

const W = 1000;
const H = 420;
const ZICA = { x: 40, y: 150, w: 920, h: 120 };
const PRESJEK = ZICA.w / 2;
const BROJ = 110;
const PX_PO_CM = 40;
const SJEME = 5;

const VRSTE: { id: Vrsta; natpis: string }[] = [
  { id: 'elektroni', natpis: 'Elektroni (metal)' },
  { id: 'ioni', natpis: 'Pozitivni ioni' },
  { id: 'oba', natpis: 'Oba (elektrolit)' },
];

function nove(vrsta: Vrsta) {
  return napraviNosioce(vrsta, BROJ, ZICA.w, ZICA.h - 24, slucajno(SJEME));
}

export default function Simulacija() {
  const [vrsta, postaviVrstu] = useState<Vrsta>('elektroni');
  const [polje, postaviPolje] = useState<1 | -1>(1);
  const [w, postaviW] = useState(1);
  const smanjen = useSmanjenPokret();
  const [pauza, postaviPauzu] = useState<boolean | null>(null);
  const stoji = pauza ?? smanjen;

  const [nosioci, postaviNosioce] = useState<Nosilac[]>(() => nove('elektroni'));
  const tekuci = useRef(nosioci);
  const elementi = useRef<(SVGGElement | null)[]>([]);
  const ukupno = useRef<Prelazi>(NULA);
  const struja = useRef(0);
  const kadar = useRef(0);
  const [prikaz, postaviPrikaz] = useState({ ukupno: NULA, struja: 0 });

  function pocni(v: Vrsta) {
    const n = nove(v);
    tekuci.current = n;
    postaviNosioce(n);
    ukupno.current = NULA;
    struja.current = 0;
    postaviPrikaz({ ukupno: NULA, struja: 0 });
  }

  useAnimacija((dt) => {
    if (!stoji && dt > 0) {
      const p = korak(tekuci.current, polje, w * PX_PO_CM, dt, PRESJEK, ZICA.w);
      ukupno.current = saberi(ukupno.current, p);
      struja.current = izgladi(struja.current, prenesenoUdesno(p) / dt, dt, 0.8);
    }
    tekuci.current.forEach((n, i) => {
      elementi.current[i]?.setAttribute('transform', `translate(${(ZICA.x + n.x).toFixed(1)} ${(ZICA.y + 12 + n.y).toFixed(1)})`);
    });
    kadar.current++;
    if (kadar.current % 6 === 0) postaviPrikaz({ ukupno: ukupno.current, struja: struja.current });
  });

  const imaPlus = vrsta !== 'elektroni';
  const imaMinus = vrsta !== 'ioni';
  const u = prikaz.ukupno;
  const udesno = prenesenoUdesno(u);
  const plusNeto = u.plusDesno - u.plusLijevo;
  const minusNeto = u.minusDesno - u.minusLijevo;
  const sredina = ZICA.x + PRESJEK;
  const L = 120;

  return (
    <Laboratorija
      crtez={
        <>
          <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Žica sa nosiocima; struja teče ${polje === 1 ? 'udesno' : 'ulijevo'}.`}>
            <rect x={ZICA.x} y={ZICA.y} width={ZICA.w} height={ZICA.h} rx={10} className={f.zicaPresjek} />
            <line x1={sredina} y1={ZICA.y - 26} x2={sredina} y2={ZICA.y + ZICA.h + 26} className={s.isprekidana} />
            <text x={sredina} y={ZICA.y - 36} textAnchor="middle" className={s.tih}>
              presjek
            </text>
            <text x={ZICA.x + 10} y={ZICA.y - 36} className={s.tih}>
              lijevo
            </text>
            <text x={ZICA.x + ZICA.w - 10} y={ZICA.y - 36} textAnchor="end" className={s.tih}>
              desno
            </text>

            {/* Strelica struje iznad žice: ista za sve nosioce. */}
            <Strelica x1={sredina - (polje * L) / 2} y1={70} x2={sredina + (polje * L) / 2} y2={70} boja="struja" velicina={20} debljina={5} />
            <text x={sredina + (polje * L) / 2 + polje * 18} y={80} textAnchor={polje === 1 ? 'start' : 'end'} className={`${s.simbol} ${s.struja}`}>
              i
            </text>

            <g>
              {nosioci.map((n, i) => (
                <g
                  key={`${vrsta}-${i}`}
                  ref={(el) => {
                    elementi.current[i] = el;
                  }}
                  transform={`translate(${ZICA.x + n.x} ${ZICA.y + 12 + n.y})`}
                  className={n.q > 0 ? s.plus : s.minus}
                >
                  <circle r={n.q > 0 ? 9 : 6} className={f.nosilac} />
                  <line x1={-4} y1={0} x2={4} y2={0} className={f.znakNosioca} />
                  {n.q > 0 && <line x1={0} y1={-4} x2={0} y2={4} className={f.znakNosioca} />}
                </g>
              ))}
            </g>

            {/* Brzine nosilaca ispod žice: pozitivni niz polje, negativni protiv. */}
            {imaPlus && (
              <g>
                <Strelica x1={ZICA.x + 130 - (polje * 70) / 2} y1={316} x2={ZICA.x + 130 + (polje * 70) / 2} y2={316} boja="plus" />
                <text x={ZICA.x + 190} y={324} className={`${s.tih}`}>
                  w pozitivnih
                </text>
              </g>
            )}
            {imaMinus && (
              <g>
                <Strelica x1={ZICA.x + 560 + (polje * 70) / 2} y1={316} x2={ZICA.x + 560 - (polje * 70) / 2} y2={316} boja="minus" />
                <text x={ZICA.x + 620} y={324} className={s.tih}>
                  w elektrona
                </text>
              </g>
            )}
            <Strelica x1={sredina - (polje * 90) / 2} y1={378} x2={sredina + (polje * 90) / 2} y2={378} boja="polje" />
            <text x={sredina + 70} y={388} className={`${s.simbol} ${s.polje}`}>
              E
            </text>
          </svg>
          <table className={f.tabela}>
            <caption>Bilans od početka, preko presjeka</caption>
            <thead>
              <tr>
                <th scope="col">nosioci</th>
                <th scope="col">kroz presjek</th>
                <th scope="col">lijevo</th>
                <th scope="col">desno</th>
              </tr>
            </thead>
            <tbody>
              {imaPlus && (
                <tr>
                  <th scope="row">pozitivni</th>
                  <td>
                    {broj(Math.abs(plusNeto), 0)} nC {plusNeto >= 0 ? 'udesno' : 'ulijevo'}
                  </td>
                  <td>{broj(-plusNeto, 0)} nC</td>
                  <td>{broj(plusNeto, 0)} nC</td>
                </tr>
              )}
              {imaMinus && (
                <tr>
                  <th scope="row">elektroni</th>
                  <td>
                    {broj(-Math.abs(minusNeto), 0)} nC {minusNeto >= 0 ? 'udesno' : 'ulijevo'}
                  </td>
                  <td>{broj(minusNeto, 0)} nC</td>
                  <td>{broj(-minusNeto, 0)} nC</td>
                </tr>
              )}
              <tr className={f.zbirRed}>
                <th scope="row">ukupno</th>
                <td>{broj(udesno, 0)} nC udesno</td>
                <td>{broj(-udesno, 0)} nC</td>
                <td>{broj(udesno, 0)} nC</td>
              </tr>
            </tbody>
          </table>
        </>
      }
      kontrole={
        <>
          <RedDugmadi opis="Nosioci naboja">
            {VRSTE.map((v) => (
              <Taster
                key={v.id}
                pritisnut={vrsta === v.id}
                onClick={() => {
                  postaviVrstu(v.id);
                  pocni(v.id);
                }}
              >
                {v.natpis}
              </Taster>
            ))}
          </RedDugmadi>
          <Klizac id="w" natpis="brzina nosilaca w" vrijednost={w} prikaz={`${broj(w, 2)} cm/s`} min={0.25} max={2} korak={0.25} boja="brzina" onPromjena={postaviW} />
          <RedDugmadi opis="Izvor i vrijeme">
            <Taster pritisnut={polje === -1} boja="polje" onClick={() => postaviPolje(polje === 1 ? -1 : 1)}>
              Okreni izvor
            </Taster>
            <Taster pritisnut={stoji} onClick={() => postaviPauzu(!stoji)}>
              {stoji ? 'Pokreni' : 'Zaustavi'}
            </Taster>
            <Taster onClick={() => pocni(vrsta)}>Počni ispočetka</Taster>
          </RedDugmadi>
        </>
      }
      ocitavanja={
        <Ocitavanja>
          <Ocitavanje natpis="Struja kroz presjek" vrijednost={broj(prikaz.struja, 1)} jedinica="nA" pod="+ znači udesno" />
          <Ocitavanje natpis="Prešlo udesno" vrijednost={broj(udesno, 0)} jedinica="nC" pod="od početka" />
        </Ocitavanja>
      }
      status={
        <StatusLinija
          sta={
            vrsta === 'elektroni'
              ? `Elektroni idu ${polje === 1 ? 'ulijevo' : 'udesno'}, a struja teče ${polje === 1 ? 'udesno' : 'ulijevo'}.`
              : vrsta === 'ioni'
                ? `Pozitivni ioni idu ${polje === 1 ? 'udesno' : 'ulijevo'}, i struja teče isto ${polje === 1 ? 'udesno' : 'ulijevo'}.`
                : `Ioni i elektroni idu na suprotne strane, a oba doprinose struji ${polje === 1 ? 'udesno' : 'ulijevo'}.`
          }
          zasto={
            vrsta === 'ioni'
              ? 'Smjer struje je po dogovoru smjer kretanja pozitivnog naboja, pa se ovdje poklapa sa nosiocima.'
              : 'Negativan naboj koji ide ulijevo ostavi lijevu stranu sa manje naboja, a desnu sa više: isto kao pozitivan naboj koji ide udesno.'
          }
        />
      }
    />
  );
}
