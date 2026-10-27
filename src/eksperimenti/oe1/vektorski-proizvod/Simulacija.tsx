'use client';

import { useState } from 'react';
import { broj } from '@/lib/format';
import { iznos, ugao, v3, vektorski, type V3 } from '@/lib/fizika/vektori';
import { Klizac, Ocitavanja, Ocitavanje, StatusLinija, Taster } from '@/components/instrument/Okvir';
import { Laboratorija, RedDugmadi } from '@/components/faks/Laboratorija';
import { Strelica } from '@/components/faks/svg';
import s from '@/components/faks/sema.module.css';
import f from '@/components/faks/faks.module.css';

/*
  Kosi pogled: w i B leže u vodoravnoj ravni (xy), proizvod je uspravan
  (z). Osjenčeni paralelogram ima površinu |w × B|. Dugme mijenja
  redoslijed: B × w gleda na suprotnu stranu. Sila na naboj je
  F = Q(w × B), pa i predznak naboja okreće smjer.
*/

const W = 1000;
const H = 560;
const O = { x: 430, y: 300 };
const PX_W = 52;
const PX_B = 110;
/** Piksela po V/m za proizvod, ali strelica nikad duža od 230 px. */
const PX_F = 26;
const NAJDUZA_F = 230;

/** Projekcija tačke (x, y, z): x udesno, y u dubinu (koso), z naviše. */
function p3(v: V3, k: number) {
  return { x: O.x + k * (v.x + 0.55 * v.y * Math.cos(Math.PI / 6)), y: O.y - k * (v.z + 0.55 * v.y * Math.sin(Math.PI / 6)) };
}

export default function Simulacija() {
  const [wIznos, postaviW] = useState(3);
  const [bIznos, postaviB] = useState(1.5);
  const [fiW, postaviFiW] = useState(0);
  const [fiB, postaviFiB] = useState(70);
  const [obrnuto, postaviObrnuto] = useState(false);
  const [negativan, postaviNegativan] = useState(false);

  const w = v3(wIznos * Math.cos((fiW * Math.PI) / 180), wIznos * Math.sin((fiW * Math.PI) / 180));
  const B = v3(bIznos * Math.cos((fiB * Math.PI) / 180), bIznos * Math.sin((fiB * Math.PI) / 180));
  const proizvod = obrnuto ? vektorski(B, w) : vektorski(w, B);
  const Q = negativan ? -1 : 1;
  const F = { x: Q * proizvod.x, y: Q * proizvod.y, z: Q * proizvod.z };
  const alfa = (ugao(w, B) * 180) / Math.PI;

  const pw = p3(w, PX_W);
  const pB = p3(B, PX_B);
  const pZbir = { x: pw.x + pB.x - O.x, y: pw.y + pB.y - O.y };
  const pF = p3(F, Math.min(PX_F, NAJDUZA_F / Math.max(iznos(F), 1e-9)));
  const gore = F.z >= 0;

  /* Ravan xy kao paralelogram, da se vidi gdje leže w i B. */
  const ravan = [p3(v3(-4, -4), 70), p3(v3(4, -4), 70), p3(v3(4, 4), 70), p3(v3(-4, 4), 70)]
    .map((t) => `${t.x},${t.y}`)
    .join(' ');

  return (
    <Laboratorija
      crtez={
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${obrnuto ? 'B × w' : 'w × B'} gleda ${gore ? 'naviše' : 'naniže'}, iznos ${broj(iznos(proizvod), 2)} V/m.`}>
          <polygon points={ravan} className={f.ravanXY} />
          <polygon points={`${O.x},${O.y} ${pw.x},${pw.y} ${pZbir.x},${pZbir.y} ${pB.x},${pB.y}`} className={f.paralelogram} />
          <Strelica x1={O.x} y1={O.y} x2={pw.x} y2={pw.y} boja="brzina" velicina={18} debljina={4} />
          <Strelica x1={O.x} y1={O.y} x2={pB.x} y2={pB.y} boja="normala" velicina={18} debljina={4} />
          {iznos(F) > 0.01 && <Strelica x1={O.x} y1={O.y} x2={pF.x} y2={pF.y} boja="sila" velicina={20} debljina={5} />}
          <text x={pw.x + 14} y={pw.y + 26} className={`${s.simbol} ${s.brzina} ${f.naCrtezu}`}>
            w
          </text>
          <text x={pB.x + 14} y={pB.y - 8} className={`${s.simbol} ${s.normala} ${f.naCrtezu}`}>
            B
          </text>
          {iznos(F) > 0.01 && (
            <text x={pF.x + 16} y={pF.y + (gore ? 10 : 6)} className={`${s.simbol} ${f.naCrtezu}`}>
              {negativan ? '−' : ''}
              {obrnuto ? 'B × w' : 'w × B'}
            </text>
          )}
          <circle cx={O.x} cy={O.y} r={6} className={s.neutralno} />
          <text x={60} y={H - 30} className={s.tih}>
            ravan u kojoj leže w i B; proizvod je okomit na nju
          </text>
        </svg>
      }
      kontrole={
        <>
          <RedDugmadi opis="Redoslijed i naboj">
            <Taster pritisnut={!obrnuto} onClick={() => postaviObrnuto(false)}>
              w × B
            </Taster>
            <Taster pritisnut={obrnuto} onClick={() => postaviObrnuto(true)}>
              B × w
            </Taster>
            <Taster pritisnut={negativan} boja="naboj-minus" onClick={() => postaviNegativan(!negativan)}>
              Negativan naboj
            </Taster>
          </RedDugmadi>
          <Klizac id="w" natpis="brzina w" vrijednost={wIznos} prikaz={`${broj(wIznos, 1)} m/s`} min={0.5} max={5} korak={0.5} boja="brzina" onPromjena={postaviW} />
          <Klizac id="fw" natpis="smjer w" vrijednost={fiW} prikaz={`${fiW}°`} min={-180} max={180} korak={5} boja="brzina" onPromjena={postaviFiW} />
          <Klizac id="b" natpis="indukcija B" vrijednost={bIznos} prikaz={`${broj(bIznos, 1)} T`} min={0.5} max={2} korak={0.1} boja="normala" onPromjena={postaviB} />
          <Klizac id="fb" natpis="smjer B" vrijednost={fiB} prikaz={`${fiB}°`} min={-180} max={180} korak={5} boja="normala" onPromjena={postaviFiB} />
        </>
      }
      ocitavanja={
        <Ocitavanja>
          <Ocitavanje natpis="Ugao α" vrijednost={broj(alfa, 0)} jedinica="°" pod={`sin α = ${broj(Math.sin((alfa * Math.PI) / 180), 3)}`} />
          <Ocitavanje natpis={obrnuto ? '|B × w|' : '|w × B|'} vrijednost={broj(iznos(proizvod), 2)} jedinica="V/m" pod="w B sin α, površina paralelograma" />
          <Ocitavanje natpis="Smjer sile na naboj" vrijednost={gore ? 'naviše' : 'naniže'} jedinica="" pod={`F = ${negativan ? '−' : ''}|Q|(${obrnuto ? 'B × w' : 'w × B'})`} />
          <Ocitavanje natpis="z-komponenta" vrijednost={broj(F.z, 2)} jedinica="V/m" pod="po jedinici naboja" />
        </Ocitavanja>
      }
      status={
        <StatusLinija
          sta={`${obrnuto ? 'B × w' : 'w × B'} gleda ${proizvod.z >= 0 ? 'naviše' : 'naniže'}, iznos ${broj(iznos(proizvod), 2)} V/m.`}
          zasto={
            obrnuto
              ? 'Zamjena redoslijeda okreće smjer: B × w = −(w × B). Lorentzova sila je Q(w × B), pa ovaj redoslijed daje pogrešan smjer.'
              : 'Pravilo desne ruke: prsti od w ka B (kraćim putem), palac pokazuje smjer w × B. Negativan naboj dobija silu na suprotnu stranu.'
          }
        />
      }
    />
  );
}
