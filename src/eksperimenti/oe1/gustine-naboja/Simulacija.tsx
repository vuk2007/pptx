'use client';

import { useMemo, useState } from 'react';
import { broj, NBSP } from '@/lib/format';
import { slucajno } from '@/lib/fizika/slucajno';
import { KVADAR, dimenzije, gustine, procjena, razbaci, uKvadratu, type Model } from '@/lib/fizika/gustine';
import { Klizac, Ocitavanja, Ocitavanje, StatusLinija, Taster } from '@/components/instrument/Okvir';
import { Laboratorija, RedDugmadi } from '@/components/faks/Laboratorija';
import { Ose, skala, type Okvir, type Raspon } from '@/components/faks/Graf';
import s from '@/components/faks/sema.module.css';
import f from '@/components/faks/faks.module.css';

/*
  Isti kvadar sa istim nabojem, stanjen u ploču, žicu ili tačku. Crtež
  ne može biti u razmjeri kad je debljina 0,02 cm, pa se tanke ivice
  crtaju bar nekoliko piksela debele; prave dimenzije su u kotama.

  Peti režim zumira u naboje: prebrojani naboj u prozoru, podijeljen
  površinom prozora, skače za mali prozor, a za veliki se smiri.
*/

const W = 1000;
const H = 520;
const PX = 95;
const KOSO = { x: Math.cos(Math.PI / 6) * 0.5, y: -Math.sin(Math.PI / 6) * 0.5 };
const POCETAK = { x: 190, y: 440 };

type Rezim = Model | 'atomi';
const REZIMI: { id: Rezim; natpis: string }[] = [
  { id: 'zapremina', natpis: 'Zapremina' },
  { id: 'ploca', natpis: 'Ploča' },
  { id: 'zica', natpis: 'Žica' },
  { id: 'tacka', natpis: 'Tačka' },
  { id: 'atomi', natpis: 'Od atoma do kontinuuma' },
];

/* --- zum: polje od 40 nm sa 2400 naboja, 1,5 naboja po nm² --- */
const POLJE_NM = 40;
const BROJ_NABOJA = 2400;
const PROSJEK = BROJ_NABOJA / POLJE_NM ** 2;
const KVADRAT_PX = 460;
const NM_PX = KVADRAT_PX / POLJE_NM;
const POLJE_X = 30;
const POLJE_Y = 30;
const TACKE = razbaci(BROJ_NABOJA, POLJE_NM, slucajno(8));
const GRAF: Okvir = { x: 620, y: 40, w: 350, h: 380 };

const EKSPONENT = '⁰¹²³⁴⁵⁶⁷⁸⁹';

/**
  Broj sa razumnim brojem cifara: velike vrijednosti u grupama po tri,
  a vrlo male kao 2,4 · 10⁻⁵, da 0,00 ne sakrije da nešto postoji.
*/
function gustinaTekst(v: number) {
  if (v >= 1000) return Math.round(v).toString().replace(/\B(?=(\d{3})+(?!\d))/g, NBSP);
  if (v > 0 && v < 0.01) {
    const e = Math.floor(Math.log10(v));
    const stepen = String(-e).split('').map((c) => EKSPONENT[Number(c)]).join('');
    return `${broj(v / 10 ** e, 1)} · 10⁻${stepen}`;
  }
  return broj(v, v >= 100 ? 0 : v >= 10 ? 1 : 2);
}

function cm(v: number) {
  return `${broj(v, v < 0.1 ? 3 : v < 1 ? 2 : 0)} cm`;
}

export default function Simulacija() {
  const [rezim, postaviRezim] = useState<Rezim>('ploca');
  const [Q, postaviQ] = useState(6);
  const [polozaj, postaviPolozaj] = useState(0);
  const [strana, postaviStranu] = useState(1);
  const [centar, postaviCentar] = useState({ x: 20, y: 20 });
  const [pomak, postaviPomak] = useState(1);

  const tankoca = 10 ** (-2 * polozaj);
  const model: Model = rezim === 'atomi' ? 'zapremina' : rezim;
  const d = dimenzije(model, rezim === 'zapremina' ? 1 : tankoca);
  const g = gustine(Q, d);
  const polazno = gustine(Q, KVADAR);

  /* Crtež: najmanje 4 px po ivici da tanko tijelo ostane vidljivo. */
  const aw = Math.max(4, d.a * PX);
  const ch = Math.max(4, d.c * PX);
  const bd = Math.max(4, d.b * PX);
  const dx = bd * KOSO.x;
  const dy = bd * KOSO.y;
  const o = POCETAK;
  const prednja = `${o.x},${o.y} ${o.x + aw},${o.y} ${o.x + aw},${o.y - ch} ${o.x},${o.y - ch}`;
  const gornja = `${o.x},${o.y - ch} ${o.x + aw},${o.y - ch} ${o.x + aw + dx},${o.y - ch + dy} ${o.x + dx},${o.y - ch + dy}`;
  const bocna = `${o.x + aw},${o.y} ${o.x + aw + dx},${o.y + dy} ${o.x + aw + dx},${o.y - ch + dy} ${o.x + aw},${o.y - ch}`;
  /* Što je gušće, to je tijelo tamnije; logaritamski, jer ρ raste milion puta. */
  const tama = 0.14 + 0.62 * Math.min(1, Math.log10(g.rho / polazno.rho + 1) / 6);

  /* 2400 tačaka se ne mijenja; ne pravi ih ponovo pri svakom pomjeranju klizača. */
  const tackeSvg = useMemo(
    () =>
      TACKE.map((t, i) => <circle key={i} cx={POLJE_X + t.x * NM_PX} cy={POLJE_Y + t.y * NM_PX} r={1.8} className={f.nosilac} />),
    [],
  );
  const nUProzoru = uKvadratu(TACKE, centar, strana);
  const procijenjeno = procjena(TACKE, centar, strana);
  const kriva = useMemo(() => {
    const tacke: { l: number; v: number }[] = [];
    for (let l = 0.25; l <= 20.001; l += 0.25) tacke.push({ l, v: procjena(TACKE, centar, l) });
    return tacke;
  }, [centar]);
  const yMax = Math.max(4, ...kriva.map((t) => t.v));
  const xr: Raspon = [0, 20];
  const yr: Raspon = [0, Math.min(yMax, 40)];
  const sk = skala(GRAF, xr, yr);

  const element =
    model === 'zapremina' ? 'dv' : model === 'ploca' ? 'da' : model === 'zica' ? 'dl' : null;

  let poruka: { sta: string; zasto: string };
  if (rezim === 'atomi') {
    poruka = {
      sta: `U prozoru od ${broj(strana, 2)} nm je ${nUProzoru} naboja: procjena ${broj(procijenjeno, 2)} po nm², prosjek ${broj(PROSJEK, 2)}.`,
      zasto:
        strana < 2
          ? 'Za prozor manji od razmaka među nabojima procjena skače između nule i ogromnog broja: gustina tu nema smisla.'
          : 'Kad je prozor mnogo veći od razmaka među nabojima, procjena se smiri: tek tada naboj možemo gledati kao kontinuum.',
    };
  } else if (rezim === 'zapremina') {
    poruka = {
      sta: `ρ = Q/V = ${gustinaTekst(g.rho)} nC/cm³.`,
      zasto: 'Svaki komadić zapremine dv nosi dQ = ρ·dv; zbir svih komadića je Q.',
    };
  } else if (rezim === 'ploca') {
    poruka = {
      sta: `σ = ${broj(g.sigma, 2)} nC/cm² ne zavisi od debljine, dok je ρ = ${gustinaTekst(g.rho)} nC/cm³.`,
      zasto: 'Kad ploča postane tanka, ρ raste bez granice, ali σ = ρ·c ostaje konačno; zato se za ploču računa sa σ.',
    };
  } else if (rezim === 'zica') {
    poruka = {
      sta: `q = ${broj(g.q, 2)} nC/cm ne zavisi od presjeka, dok je ρ = ${gustinaTekst(g.rho)} nC/cm³.`,
      zasto: 'Kad presjek žice nestaje, ostaje naboj po dužini: q = ρ·b·c.',
    };
  } else {
    poruka = {
      sta: `Q = ${broj(Q, 0)} nC ne zavisi od veličine, dok je ρ = ${gustinaTekst(g.rho)} nC/cm³.`,
      zasto: 'Tijelo malo u odnosu na udaljenost sa koje ga gledamo je „debela tačka“: unutrašnji raspored se ne vidi, pa ostaje samo Q.',
    };
  }

  return (
    <Laboratorija
      crtez={
        rezim === 'atomi' ? (
          <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Naboji u polju od ${POLJE_NM} nm; prozor stranice ${broj(strana, 2)} nm sadrži ${nUProzoru} naboja.`}>
            <rect x={POLJE_X} y={POLJE_Y} width={KVADRAT_PX} height={KVADRAT_PX} className={s.okvir} />
            <g className={s.plus}>{tackeSvg}</g>
            <rect
              x={POLJE_X + (centar.x - strana / 2) * NM_PX}
              y={POLJE_Y + (centar.y - strana / 2) * NM_PX}
              width={strana * NM_PX}
              height={strana * NM_PX}
              className={f.prozorZuma}
            />
            <text x={POLJE_X} y={POLJE_Y + KVADRAT_PX + 30} className={s.tih}>
              {POLJE_NM} nm × {POLJE_NM} nm, svaka tačka je jedan naboj
            </text>

            <Ose okvir={GRAF} xr={xr} yr={yr} xNatpis="stranica prozora / nm" yNatpis="N/l² / nm⁻²" xCilj={4}>
              <line x1={GRAF.x} y1={sk.y(PROSJEK)} x2={GRAF.x + GRAF.w} y2={sk.y(PROSJEK)} className={s.isprekidana} />
              <polyline points={kriva.map((t) => `${sk.x(t.l).toFixed(1)},${sk.y(Math.min(t.v, yr[1])).toFixed(1)}`).join(' ')} className={f.krivaStruje} />
              <circle cx={sk.x(strana)} cy={sk.y(Math.min(procijenjeno, yr[1]))} r={7} className={s.neutralno} />
            </Ose>
          </svg>
        ) : (
          <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Kvadar ${cm(d.a)} × ${cm(d.b)} × ${cm(d.c)} sa nabojem ${broj(Q, 0)} nC.`}>
            <polygon points={prednja} className={s.plus} fillOpacity={tama} strokeWidth={2} />
            <polygon points={gornja} className={s.plus} fillOpacity={tama * 0.7} strokeWidth={2} />
            <polygon points={bocna} className={s.plus} fillOpacity={tama * 0.85} strokeWidth={2} />

            {element === 'dv' && (
              <g>
                <rect x={o.x + aw * 0.42} y={o.y - ch * 0.62} width={34} height={34} className={f.element} />
                <text x={o.x + aw * 0.42 + 44} y={o.y - ch * 0.62 + 26} className={`${s.tekst} ${f.naCrtezu}`}>
                  dv
                </text>
              </g>
            )}
            {element === 'da' && (
              <g>
                <polygon
                  points={`${o.x + aw * 0.45},${o.y - ch + dy * 0.4} ${o.x + aw * 0.45 + 40},${o.y - ch + dy * 0.4} ${o.x + aw * 0.45 + 40 + dx * 0.25},${o.y - ch + dy * 0.65} ${o.x + aw * 0.45 + dx * 0.25},${o.y - ch + dy * 0.65}`}
                  className={f.element}
                />
                <text x={o.x + aw * 0.45 + 52 + dx * 0.25} y={o.y - ch + dy * 0.52 + 8} className={`${s.tekst} ${f.naCrtezu}`}>
                  da
                </text>
              </g>
            )}
            {element === 'dl' && (
              <g>
                <line x1={o.x + aw * 0.45} y1={o.y - ch - 14} x2={o.x + aw * 0.45 + 46} y2={o.y - ch - 14} className={f.elementLinija} />
                <text x={o.x + aw * 0.45 + 8} y={o.y - ch - 28} className={`${s.tekst} ${f.naCrtezu}`}>
                  dl
                </text>
              </g>
            )}

            {/* Kote sa pravim dimenzijama. */}
            {model !== 'tacka' && (
              <>
                <text x={o.x + aw / 2} y={o.y + 40} textAnchor="middle" className={s.tih}>
                  a = {cm(d.a)}
                </text>
                <text x={o.x - 14} y={o.y - ch / 2 + 8} textAnchor="end" className={s.tih}>
                  c = {cm(d.c)}
                </text>
                <text x={o.x + aw + dx + 14} y={o.y - ch + dy / 2} className={s.tih}>
                  b = {cm(d.b)}
                </text>
              </>
            )}
            {model === 'tacka' && (
              <text x={o.x + aw + 24} y={o.y - ch / 2} className={s.tekst}>
                {tankoca < 0.05 ? `Q = ${broj(Q, 0)} nC, veličina ${cm(d.a)}` : `${cm(d.a)} × ${cm(d.b)} × ${cm(d.c)}`}
              </text>
            )}
          </svg>
        )
      }
      kontrole={
        <>
          <RedDugmadi opis="Oblik">
            {REZIMI.map((r) => (
              <Taster key={r.id} pritisnut={rezim === r.id} onClick={() => postaviRezim(r.id)}>
                {r.natpis}
              </Taster>
            ))}
          </RedDugmadi>
          {rezim === 'atomi' ? (
            <>
              <Klizac id="l" natpis="stranica prozora l" vrijednost={strana} prikaz={`${broj(strana, 2)} nm`} min={0.25} max={20} korak={0.25} boja="text" onPromjena={postaviStranu} />
              <RedDugmadi opis="Prozor">
                <Taster
                  onClick={() => {
                    const r = slucajno(100 + pomak);
                    postaviCentar({ x: 10 + r() * 20, y: 10 + r() * 20 });
                    postaviPomak(pomak + 1);
                  }}
                >
                  Pomjeri prozor
                </Taster>
              </RedDugmadi>
            </>
          ) : (
            <>
              <Klizac id="Q" natpis="naboj Q" vrijednost={Q} prikaz={`${broj(Q, 0)} nC`} min={2} max={12} korak={1} boja="naboj-plus" onPromjena={postaviQ} />
              {rezim !== 'zapremina' && (
                <Klizac
                  id="s"
                  natpis={rezim === 'ploca' ? 'stanji debljinu c' : rezim === 'zica' ? 'stanji presjek b × c' : 'smanji cijelo tijelo'}
                  vrijednost={polozaj}
                  prikaz={`${broj(tankoca, tankoca < 0.1 ? 2 : 1)} ×`}
                  min={0}
                  max={1}
                  korak={0.01}
                  boja="text"
                  onPromjena={postaviPolozaj}
                />
              )}
            </>
          )}
        </>
      }
      ocitavanja={
        rezim === 'atomi' ? (
          <Ocitavanja>
            <Ocitavanje natpis="Naboja u prozoru" vrijednost={String(nUProzoru)} jedinica="" pod="N" />
            <Ocitavanje natpis="Procjena N/l²" vrijednost={broj(procijenjeno, 2)} jedinica="nm⁻²" pod={`prosjek ${broj(PROSJEK, 2)} nm⁻²`} />
          </Ocitavanja>
        ) : (
          <Ocitavanja>
            {rezim === 'ploca' && <Ocitavanje natpis="Površinska σ" vrijednost={broj(g.sigma, 2)} jedinica="nC/cm²" pod="σ = Q/(a·b) = ρ·c" />}
            {rezim === 'zica' && <Ocitavanje natpis="Linijska q" vrijednost={broj(g.q, 2)} jedinica="nC/cm" pod="q = Q/a = ρ·b·c" />}
            {rezim === 'tacka' && <Ocitavanje natpis="Naboj Q" vrijednost={broj(Q, 0)} jedinica="nC" pod="ostaje samo on" />}
            <Ocitavanje natpis="Prostorna ρ" vrijednost={gustinaTekst(g.rho)} jedinica="nC/cm³" pod={`${gustinaTekst(g.rho / polazno.rho)} puta od početne`} />
            <Ocitavanje natpis="Zapremina V" vrijednost={gustinaTekst(g.V)} jedinica="cm³" pod={`${cm(d.a)} × ${cm(d.b)} × ${cm(d.c)}`} />
            {rezim === 'zapremina' && <Ocitavanje natpis="Element" vrijednost="dQ = ρ·dv" jedinica="" pod="komadić zapremine" />}
          </Ocitavanja>
        )
      }
      status={<StatusLinija sta={poruka.sta} zasto={poruka.zasto} />}
    />
  );
}
