'use client';

import { useState } from 'react';
import { broj } from '@/lib/format';
import { kocka, kutija, poljePrave, poljeRavni, valjak } from '@/lib/fizika/izborPovrsine';
import { Klizac, Ocitavanja, Ocitavanje, StatusLinija, Taster } from '@/components/instrument/Okvir';
import { Laboratorija, RedDugmadi } from '@/components/faks/Laboratorija';
import { Strelica } from '@/components/faks/svg';
import s from '@/components/faks/sema.module.css';
import f from '@/components/faks/faks.module.css';

/*
  Tri izbora Gaussove površine. Valjak oko prave i kutija oko ravni imaju
  dijelove gdje je E okomito i stalno, i dijelove gdje je E paralelno
  (fluks nula). Kocka oko prave daje isti ukupan fluks, ali E·n na strani
  nije stalno, pa se iz fluksa ne može izvući E.
*/

const W = 1000;
const H = 560;
const q = 5e-9;
const SIGMA = 10e-9;
const PX_PO_CM = 12;

type Rezim = 'valjak' | 'kocka' | 'kutija';
const REZIMI: { id: Rezim; natpis: string }[] = [
  { id: 'valjak', natpis: 'Prava i valjak' },
  { id: 'kocka', natpis: 'Prava i kocka' },
  { id: 'kutija', natpis: 'Ravan i kutija' },
];

export default function Simulacija() {
  const [rezim, postaviRezim] = useState<Rezim>('valjak');
  const [rhoCm, postaviRho] = useState(8);
  const [LCm, postaviL] = useState(20);
  const [sCm, postaviS] = useState(8);
  const [aCm, postaviA] = useState(8);
  const [hCm, postaviH] = useState(12);

  const v = valjak(q, rhoCm / 100, LCm / 100);
  const k = kocka(q, sCm / 100, LCm / 100);
  const kt = kutija(SIGMA, (aCm / 100) ** 2);

  let poruka: { sta: string; zasto: string };
  if (rezim === 'valjak') {
    const E = v.plast / (2 * Math.PI * (rhoCm / 100) * (LCm / 100));
    poruka = {
      sta: `Sav fluks ide kroz plašt: ${broj(v.plast, 1)} V·m, pa je E = Φ/(2πρL) = ${broj(E, 0)} V/m.`,
      zasto: 'Na plaštu je E okomito i isto u svakoj tački, a na osnovicama leži u ravni osnovice, pa kroz njih nema fluksa.',
    };
  } else if (rezim === 'kocka') {
    poruka = {
      sta: `Ukupan fluks je opet qL/ε₀ = ${broj(k.ukupno, 1)} V·m, ali E·n na strani se mijenja ${broj(k.odnos, 2)} puta.`,
      zasto: 'Gaussov zakon i dalje važi, ali bez stalnog E·n fluks ne može da se podijeli površinom: iz njega ne izlazi polje.',
    };
  } else {
    poruka = {
      sta: `Kroz svaku osnovicu ${broj(kt.osnovica, 2)} V·m, kroz bočne strane nula: E = σ/(2ε₀) = ${broj(poljeRavni(SIGMA), 0)} V/m.`,
      zasto: 'Visina kutije ne mijenja ništa: polje beskonačne ravni ne zavisi od udaljenosti, a bočne strane su paralelne sa njim.',
    };
  }

  return (
    <Laboratorija
      crtez={
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={REZIMI.find((r) => r.id === rezim)?.natpis}>
          {rezim === 'valjak' && <Valjak rhoCm={rhoCm} LCm={LCm} />}
          {rezim === 'kocka' && <Kocka sCm={sCm} />}
          {rezim === 'kutija' && <Kutija aCm={aCm} hCm={hCm} />}
        </svg>
      }
      kontrole={
        <>
          <RedDugmadi opis="Izbor površine">
            {REZIMI.map((r) => (
              <Taster key={r.id} pritisnut={rezim === r.id} onClick={() => postaviRezim(r.id)}>
                {r.natpis}
              </Taster>
            ))}
          </RedDugmadi>
          {rezim === 'valjak' && (
            <>
              <Klizac id="rho" natpis="poluprečnik ρ" vrijednost={rhoCm} prikaz={`${broj(rhoCm, 0)} cm`} min={3} max={16} korak={1} boja="text" onPromjena={postaviRho} />
              <Klizac id="L" natpis="visina L" vrijednost={LCm} prikaz={`${broj(LCm, 0)} cm`} min={6} max={32} korak={1} boja="text" onPromjena={postaviL} />
            </>
          )}
          {rezim === 'kocka' && (
            <Klizac id="s" natpis="pola stranice s" vrijednost={sCm} prikaz={`${broj(sCm, 0)} cm`} min={3} max={16} korak={1} boja="text" onPromjena={postaviS} />
          )}
          {rezim === 'kutija' && (
            <>
              <Klizac id="a" natpis="stranica osnovice" vrijednost={aCm} prikaz={`${broj(aCm, 0)} cm`} min={3} max={14} korak={1} boja="text" onPromjena={postaviA} />
              <Klizac id="h" natpis="visina kutije" vrijednost={hCm} prikaz={`${broj(hCm, 0)} cm`} min={4} max={30} korak={1} boja="text" onPromjena={postaviH} />
            </>
          )}
        </>
      }
      ocitavanja={
        rezim === 'valjak' ? (
          <Ocitavanja>
            <Ocitavanje natpis="Kroz plašt" vrijednost={broj(v.plast, 1)} jedinica="V·m" pod="E·2πρL" />
            <Ocitavanje natpis="Kroz osnovice" vrijednost={broj(v.osnovice, 1)} jedinica="V·m" pod="E paralelno" />
            <Ocitavanje natpis="Ukupno" vrijednost={broj(v.ukupno, 1)} jedinica="V·m" pod="qL/ε₀" />
            <Ocitavanje natpis="E iz Gaussa" vrijednost={broj(poljePrave(q, rhoCm / 100), 0)} jedinica="V/m" pod="q/(2πε₀ρ)" />
          </Ocitavanja>
        ) : rezim === 'kocka' ? (
          <Ocitavanja>
            <Ocitavanje natpis="Kroz jednu stranu" vrijednost={broj(k.strana, 1)} jedinica="V·m" />
            <Ocitavanje natpis="Ukupno" vrijednost={broj(k.ukupno, 1)} jedinica="V·m" pod="isto kao valjak" />
            <Ocitavanje natpis="E·n na sredini" vrijednost={broj(poljePrave(q, sCm / 100), 0)} jedinica="V/m" />
            <Ocitavanje natpis="E·n u uglu" vrijednost={broj(poljePrave(q, sCm / 100) / 2, 0)} jedinica="V/m" pod="dva puta manje" />
          </Ocitavanja>
        ) : (
          <Ocitavanja>
            <Ocitavanje natpis="Gornja osnovica" vrijednost={broj(kt.osnovica, 2)} jedinica="V·m" pod="E·A" />
            <Ocitavanje natpis="Donja osnovica" vrijednost={broj(kt.osnovica, 2)} jedinica="V·m" pod="E·A" />
            <Ocitavanje natpis="Bočne strane" vrijednost={broj(kt.bocno, 2)} jedinica="V·m" pod="E paralelno" />
            <Ocitavanje natpis="E iz Gaussa" vrijednost={broj(poljeRavni(SIGMA), 0)} jedinica="V/m" pod="σ/(2ε₀)" />
          </Ocitavanja>
        )
      }
      status={<StatusLinija sta={poruka.sta} zasto={poruka.zasto} />}
    />
  );
}

/* Kosi pogled na valjak: elipse su osnovice, uspravna linija je prava sa nabojem. */
function Valjak({ rhoCm, LCm }: { rhoCm: number; LCm: number }) {
  const cx = 360;
  const cy = 280;
  const r = rhoCm * PX_PO_CM;
  const ry = r * 0.3;
  const pola = (LCm * PX_PO_CM) / 2;
  const gore = cy - pola;
  const dolje = cy + pola;
  const visine = [gore + pola * 0.45, cy, dolje - pola * 0.45];
  const uglovi = [0, Math.PI / 3, (2 * Math.PI) / 3, Math.PI, (4 * Math.PI) / 3, (5 * Math.PI) / 3];
  return (
    <g>
      <line x1={cx} y1={20} x2={cx} y2={H - 20} className={f.duz} />
      <ellipse cx={cx} cy={dolje} rx={r} ry={ry} className={f.osnovica} />
      <line x1={cx - r} y1={gore} x2={cx - r} y2={dolje} className={s.linija} />
      <line x1={cx + r} y1={gore} x2={cx + r} y2={dolje} className={s.linija} />
      {visine.map((y) =>
        uglovi.map((u) => {
          const px = cx + r * Math.cos(u);
          const py = y + ry * Math.sin(u);
          const dx = px - cx;
          const dy = py - y;
          const d = Math.hypot(dx, dy) || 1;
          const iza = Math.sin(u) < -0.1;
          return (
            <g key={`${y}-${u}`} opacity={iza ? 0.4 : 1}>
              <Strelica x1={px - (dx / d) * 12} y1={py - (dy / d) * 12} x2={px + (dx / d) * 46} y2={py + (dy / d) * 46} boja="polje" velicina={12} debljina={2.5} />
            </g>
          );
        }),
      )}
      <ellipse cx={cx} cy={gore} rx={r} ry={ry} className={f.osnovica} />
      {/* Polje u tačkama osnovice leži u njenoj ravni. */}
      {[-0.55, 0.55].map((k) => (
        <Strelica key={k} x1={cx + k * r * 0.25} y1={gore} x2={cx + k * r * 0.95} y2={gore} boja="polje" velicina={10} debljina={2} />
      ))}
      <text x={cx + r + 60} y={gore + 8} className={`${s.tih} ${f.naCrtezu}`}>
        osnovica: Φ = 0
      </text>
      <text x={cx + r + 60} y={cy + 8} className={`${s.tih} ${f.naCrtezu}`}>
        plašt: Φ = E·2πρL
      </text>
      <text x={cx + 14} y={34} className={`${s.tih} ${f.naCrtezu}`}>
        prava, q
      </text>
    </g>
  );
}

/* Pogled odozgo, duž prave: kvadrat oko tačke, E·n na desnoj strani kao trake. */
function Kocka({ sCm }: { sCm: number }) {
  const cx = 330;
  const cy = 280;
  const pola = sCm * PX_PO_CM;
  const tacke = Array.from({ length: 9 }, (_, k) => -1 + (2 * (k + 0.5)) / 9);
  const sredina = poljePrave(q, sCm / 100);
  return (
    <g>
      <rect x={cx - pola} y={cy - pola} width={2 * pola} height={2 * pola} className={f.gaussKocka} />
      {[0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].map((u) =>
        tacke.map((t) => {
          const lx = Math.cos(u);
          const ly = Math.sin(u);
          const px = cx + pola * lx - t * pola * ly;
          const py = cy + pola * ly + t * pola * lx;
          const dx = px - cx;
          const dy = py - cy;
          const d = Math.hypot(dx, dy);
          const L = 60 * (pola / d);
          return <Strelica key={`${u}-${t}`} x1={px} y1={py} x2={px + (dx / d) * L} y2={py + (dy / d) * L} boja="polje" velicina={10} debljina={2} />;
        }),
      )}
      {/* E·n na desnoj strani: trake srazmjerne normalnoj komponenti. */}
      {tacke.map((t) => {
        const y = cy + t * pola;
        const rho = Math.hypot(sCm, t * sCm);
        const En = (poljePrave(q, rho / 100) * sCm) / rho;
        return <rect key={t} x={cx + pola + 120} y={y - 7} width={(En / sredina) * 160} height={14} className={f.trakaEn} />;
      })}
      <line x1={cx + pola + 120} y1={cy - pola - 10} x2={cx + pola + 120} y2={cy + pola + 10} className={s.linija} />
      <text x={cx + pola + 120} y={cy - pola - 22} className={`${s.tih} ${f.naCrtezu}`}>
        E·n duž desne strane
      </text>
      <circle cx={cx} cy={cy} r={9} className={s.plus} />
      <text x={cx} y={cy + 36} textAnchor="middle" className={`${s.tih} ${f.naCrtezu}`}>
        prava (odozgo)
      </text>
    </g>
  );
}

/* Kosi pogled na ravan i kutiju koja je siječe. */
function Kutija({ aCm, hCm }: { aCm: number; hCm: number }) {
  const cx = 380;
  const cy = 300;
  const a = aCm * PX_PO_CM * 1.4;
  const h = hCm * PX_PO_CM;
  const dub = { x: a * 0.45, y: -a * 0.3 };
  const ravan = `${cx - 300},${cy} ${cx + 260},${cy} ${cx + 260 + 160},${cy - 110} ${cx - 300 + 160},${cy - 110}`;
  const kvadrat = (y: number) => `${cx - a / 2},${y} ${cx + a / 2},${y} ${cx + a / 2 + dub.x},${y + dub.y} ${cx - a / 2 + dub.x},${y + dub.y}`;
  const gore = cy - h / 2;
  const dolje = cy + h / 2;
  return (
    <g>
      <polygon points={ravan} className={f.ravanPlus} />
      <text x={cx - 290} y={cy + 30} className={`${s.tih} ${f.naCrtezu}`}>
        ravan, σ
      </text>
      <polygon points={kvadrat(dolje)} className={f.osnovica} />
      <line x1={cx - a / 2} y1={gore} x2={cx - a / 2} y2={dolje} className={s.linija} />
      <line x1={cx + a / 2} y1={gore} x2={cx + a / 2} y2={dolje} className={s.linija} />
      <line x1={cx + a / 2 + dub.x} y1={gore + dub.y} x2={cx + a / 2 + dub.x} y2={dolje + dub.y} className={s.linija} />
      <polygon points={kvadrat(gore)} className={f.osnovica} />
      {[-0.3, 0.3].map((k) => (
        <g key={k}>
          <Strelica x1={cx + k * a + dub.x / 2} y1={gore + dub.y / 2 + 30} x2={cx + k * a + dub.x / 2} y2={gore + dub.y / 2 - 60} boja="polje" velicina={14} debljina={3} />
          <Strelica x1={cx + k * a + dub.x / 2} y1={dolje + dub.y / 2 - 30} x2={cx + k * a + dub.x / 2} y2={dolje + dub.y / 2 + 60} boja="polje" velicina={14} debljina={3} />
        </g>
      ))}
      <text x={cx + a / 2 + dub.x + 20} y={gore + dub.y + 8} className={`${s.tih} ${f.naCrtezu}`}>
        osnovica: Φ = E·A
      </text>
      <text x={cx + a / 2 + dub.x + 20} y={(gore + dolje) / 2 + 40} className={`${s.tih} ${f.naCrtezu}`}>
        bočno: E ∥, Φ = 0
      </text>
      <text x={cx + a / 2 + dub.x + 20} y={dolje + dub.y + 8} className={`${s.tih} ${f.naCrtezu}`}>
        osnovica: Φ = E·A
      </text>
    </g>
  );
}
