'use client';

import { useMemo, useRef, useState } from 'react';
import { broj } from '@/lib/format';
import { EPS0, linijePolja } from '@/lib/fizika/elektrostatika';
import { fluksNaObodu, fluksNaboja, jeUnutra, type Elipsoid, type Naboj3 } from '@/lib/fizika/gaussPovrsina';
import { Klizac, Ocitavanja, Ocitavanje, StatusLinija, Taster } from '@/components/instrument/Okvir';
import { Laboratorija, RedDugmadi } from '@/components/faks/Laboratorija';
import { usePrevlacenje, type Tacka } from '@/components/faks/prevlacenje';
import { NabojTacka } from '@/components/faks/svg';
import s from '@/components/faks/sema.module.css';
import f from '@/components/faks/faks.module.css';

/*
  Presjek Gaussove površine (obrtni elipsoid) i naboja u ravni crteža.
  Fluks se računa po cijeloj prostornoj površini, ne po presjeku. Obod
  je pun gdje polje izlazi, isprekidan gdje ulazi: za naboj vani isti
  fluks uđe sa jedne strane i izađe sa druge.
*/

const W = 1000;
const H = 560;
const PX_PO_CM = 20;
const INDEKS = ['₁', '₂', '₃'];

type Stavka = Tacka & { Q: number };

const uSI = (p: Tacka) => ({ x: p.x / PX_PO_CM / 100, y: p.y / PX_PO_CM / 100 });
const uPx = (p: Tacka) => ({ x: p.x * 100 * PX_PO_CM, y: p.y * 100 * PX_PO_CM });

export default function Simulacija() {
  const [naboji, postaviNaboje] = useState<Stavka[]>([
    { x: 430, y: 260, Q: 3 },
    { x: 540, y: 320, Q: -1 },
    { x: 820, y: 200, Q: 4 },
  ]);
  const [centar, postaviCentar] = useState<Tacka>({ x: 480, y: 280 });
  const [rxCm, postaviRx] = useState(9);
  const [ryCm, postaviRy] = useState(7);
  /* Obod se boji po polju svih naboja, ili samo naboja vani, da se vidi gdje njihov fluks ulazi i izlazi. */
  const [samoVani, postaviSamoVani] = useState(true);
  const svg = useRef<SVGSVGElement>(null);
  const { tacka } = usePrevlacenje({
    svg,
    granice: { x0: 30, y0: 30, x1: 970, y1: 530 },
    naPomak: (i, p) => {
      if (i === 9) postaviCentar(p);
      else postaviNaboje((n) => n.map((x, j) => (j === i ? { ...x, ...p } : x)));
    },
  });

  const e: Elipsoid = { cx: centar.x / PX_PO_CM / 100, cy: centar.y / PX_PO_CM / 100, rx: rxCm / 100, ry: ryCm / 100 };
  const si: Naboj3[] = naboji.map((n) => ({ Q: n.Q * 1e-9, ...uSI(n) }));
  const doprinosi = si.map((n) => ({ unutra: jeUnutra(n, e), fluks: fluksNaboja(n, e, 70, 140) }));
  const ukupno = doprinosi.reduce((a, d) => a + d.fluks, 0);
  const Qnot = si.filter((_, k) => doprinosi[k].unutra).reduce((a, n) => a + n.Q, 0);
  const vaniFluks = doprinosi.filter((d) => !d.unutra).reduce((a, d) => a + d.fluks, 0);

  const ima = naboji.some((_, k) => !doprinosi[k].unutra);
  const zaObod = samoVani && ima ? si.filter((_, k) => !doprinosi[k].unutra) : si;
  const obod = fluksNaObodu(zaObod, e, 144);
  const linije = useMemo(() => {
    const s2: Naboj3[] = naboji.map((n) => ({ Q: n.Q * 1e-9, ...uSI(n) }));
    return linijePolja(s2, {
      poJedinici: 3,
      jedinica: 1e-9,
      poluprecnik: 0.009,
      korak: 0.0025,
      granice: { x0: 0, y0: 0, x1: W / PX_PO_CM / 100, y1: H / PX_PO_CM / 100 },
      maxKoraka: 600,
    }).map((l) => l.map(uPx).map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' '));
  }, [naboji]);

  /*
    Obod u nizovima istog predznaka: pun gdje E·n > 0, isprekidan gdje
    E·n < 0. Niz je jedna linija, da se crtice ne prekidaju na svakom
    od 144 komada.
  */
  const nizovi: { van: boolean; tacke: string[] }[] = [];
  const pocetak = Math.max(0, obod.findIndex((t, k) => (t.En >= 0) !== (obod[(k + obod.length - 1) % obod.length].En >= 0)));
  for (let i = 0; i <= obod.length; i++) {
    const t = obod[(pocetak + i) % obod.length];
    const p = uPx(t);
    const tacka = `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
    const van = t.En >= 0;
    const zadnji = nizovi[nizovi.length - 1];
    if (zadnji && zadnji.van === van) zadnji.tacke.push(tacka);
    else {
      if (zadnji) zadnji.tacke.push(tacka);
      if (i < obod.length) nizovi.push({ van, tacke: [tacka] });
    }
  }

  return (
    <Laboratorija
      crtez={
        <svg ref={svg} viewBox={`0 0 ${W} ${H}`} className={s.dodir} role="img" aria-label={`Gaussova površina obuhvata ${broj(Qnot * 1e9, 0)} nC; fluks ${broj(ukupno, 0)} V·m.`}>
          <rect x={10} y={10} width={W - 20} height={H - 20} className={s.okvir} />
          {linije.map((l, i) => (
            <polyline key={i} points={l} className={s.linijaPolja} />
          ))}
          <ellipse cx={centar.x} cy={centar.y} rx={rxCm * PX_PO_CM} ry={ryCm * PX_PO_CM} className={f.gaussUnutra} />
          {nizovi.map((n, k) => (
            <polyline key={k} points={n.tacke.join(' ')} className={n.van ? f.obodVan : f.obodUnutra} />
          ))}
          <g transform={`translate(${centar.x} ${centar.y})`} className={s.rucka} aria-label="Središte Gaussove površine; prevuci ga ili pomjeri strelicama" {...tacka(9, centar)}>
            <circle r={10} className={f.tackaT} />
            <line x1={-5} y1={0} x2={5} y2={0} className={s.linija} />
            <line x1={0} y1={-5} x2={0} y2={5} className={s.linija} />
          </g>
          {naboji.map((n, i) => (
            <NabojTacka
              key={i}
              x={n.x}
              y={n.y}
              Q={n.Q}
              natpis={`Q${INDEKS[i]}`}
              aria-label={`Naboj Q${INDEKS[i]}, ${broj(n.Q, 0)} nC; prevuci ga ili pomjeri strelicama`}
              {...tacka(i, n)}
            />
          ))}
        </svg>
      }
      kontrole={
        <>
          <Klizac id="rx" natpis="poluosa vodoravno" vrijednost={rxCm} prikaz={`${broj(rxCm, 0)} cm`} min={3} max={20} korak={1} boja="text" onPromjena={postaviRx} />
          <Klizac id="ry" natpis="poluosa uspravno" vrijednost={ryCm} prikaz={`${broj(ryCm, 0)} cm`} min={3} max={12} korak={1} boja="text" onPromjena={postaviRy} />
          {naboji.map((n, i) => (
            <Klizac
              key={i}
              id={`gq${i}`}
              natpis={`naboj Q${INDEKS[i]}`}
              vrijednost={n.Q}
              prikaz={`${broj(n.Q, 0)} nC`}
              min={-5}
              max={5}
              korak={1}
              boja={n.Q >= 0 ? 'naboj-plus' : 'naboj-minus'}
              onPromjena={(Q) => postaviNaboje(naboji.map((x, j) => (j === i ? { ...x, Q } : x)))}
            />
          ))}
          <RedDugmadi opis="Obod pokazuje polje">
            <Taster pritisnut={samoVani} onClick={() => postaviSamoVani(true)}>
              Obod: naboji vani
            </Taster>
            <Taster pritisnut={!samoVani} onClick={() => postaviSamoVani(false)}>
              Obod: svi naboji
            </Taster>
          </RedDugmadi>
          <p className={f.uputa}>Prevuci naboje i središte površine (krstić).</p>
        </>
      }
      ocitavanja={
        <Ocitavanja>
          <Ocitavanje natpis="Fluks ∮E·da" vrijednost={broj(ukupno, 0)} jedinica="V·m" pod="brojčano, po cijeloj površini" />
          <Ocitavanje natpis={<>Q<sub>not</sub>/ε₀</>} vrijednost={broj(Qnot / EPS0, 0)} jedinica="V·m" pod={`${broj(Qnot * 1e9, 0)} nC unutra`} />
          <Ocitavanje natpis="Od naboja vani" vrijednost={broj(vaniFluks, 1)} jedinica="V·m" pod={ima ? 'ulazi i izlazi isto' : 'nema naboja vani'} />
          <Ocitavanje natpis="Naboja unutra" vrijednost={String(doprinosi.filter((d) => d.unutra).length)} jedinica="" pod={`od ${naboji.length}`} />
        </Ocitavanja>
      }
      status={
        <StatusLinija
          sta={`Fluks je ${broj(ukupno, 0)} V·m, a Q_not/ε₀ = ${broj(Qnot / EPS0, 0)} V·m.`}
          zasto={
            ima
              ? 'Naboj vani ne doprinosi: njegovo polje uđe kroz bližu stranu (isprekidano) i izađe kroz dalju (puno), sa istim fluksom.'
              : 'Svi naboji su unutra, pa sav njihov fluks izlazi kroz površinu, kakvog god je oblika.'
          }
        />
      }
    />
  );
}
