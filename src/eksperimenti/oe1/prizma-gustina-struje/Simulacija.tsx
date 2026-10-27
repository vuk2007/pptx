'use client';

import { useEffect, useRef, useState } from 'react';
import { useAnimacija } from '@/lib/animacija';
import { broj } from '@/lib/format';
import { slucajno } from '@/lib/fizika/slucajno';
import {
  PX_PO_CM,
  napraviMrezu,
  nabojPoFormuli,
  pomjeri,
  smjer,
  uPrizmi,
  vrhoviPrizme,
  type Mreza,
  type Prozor,
} from '@/lib/fizika/prizma';
import { Klizac, Ocitavanja, Ocitavanje, StatusLinija, Taster } from '@/components/instrument/Okvir';
import { Laboratorija, RedDugmadi } from '@/components/faks/Laboratorija';
import { useSmanjenPokret } from '@/components/faks/pokret';
import { Strelica } from '@/components/faks/svg';
import s from '@/components/faks/sema.module.css';
import f from '@/components/faks/faks.module.css';

/*
  Naboji su na platnu (do 2500 tačaka, SVG bi zapeo), a prozorčić,
  prizma i strelice u SVG-u preko njega, u istim koordinatama.
*/

const W = 1000;
const H = 620;
/* Prizma ide dolje lijevo; za najduži put (8 cm pri 75°) i dalje staje u crtež. */
const PROZOR: Prozor = { x: 800, y1: 130, y2: 290 };
const DA_CM = (PROZOR.y2 - PROZOR.y1) / PX_PO_CM;
const STEPEN = Math.PI / 180;
const SJEME = 42;

const POCETNO = { rho: 1.5, w: 2, alfa: 30, dt: 1.5 };

export default function Simulacija() {
  const [rho, postaviRho] = useState(POCETNO.rho);
  const [w, postaviW] = useState(POCETNO.w);
  const [alfaStep, postaviAlfa] = useState(POCETNO.alfa);
  const [dt, postaviDt] = useState(POCETNO.dt);
  const smanjen = useSmanjenPokret();
  const [pauza, postaviPauzu] = useState<boolean | null>(null);
  const stoji = pauza ?? smanjen;
  const [prebrojano, postaviPrebrojano] = useState(0);

  const platno = useRef<HTMLCanvasElement>(null);
  const mreza = useRef<Mreza | null>(null);
  const kadar = useRef(0);

  useEffect(() => {
    mreza.current = napraviMrezu(rho / PX_PO_CM ** 2, W, H, slucajno(SJEME));
  }, [rho]);

  const alfa = alfaStep * STEPEN;
  const duzina = w * dt * PX_PO_CM;
  const formula = nabojPoFormuli(rho, DA_CM, w, dt, alfa);

  function crtaj() {
    const c = platno.current;
    const m = mreza.current;
    if (!c || !m) return 0;
    const dpr = window.devicePixelRatio || 1;
    const sirina = Math.round(c.clientWidth * dpr);
    const visina = Math.round(c.clientHeight * dpr);
    if (c.width !== sirina || c.height !== visina) {
      c.width = sirina;
      c.height = visina;
    }
    const ctx = c.getContext('2d');
    if (!ctx) return 0;
    ctx.setTransform(c.width / W, 0, 0, c.height / H, 0, 0);
    ctx.clearRect(0, 0, W, H);

    const css = getComputedStyle(c);
    const unutra = css.getPropertyValue('--naboj-plus').trim();
    const van = css.getPropertyValue('--muted').trim();

    let n = 0;
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = van;
    ctx.beginPath();
    for (const t of m.tacke) {
      if (t.x > W || t.y > H) continue;
      if (uPrizmi(t, PROZOR, duzina, alfa)) continue;
      ctx.moveTo(t.x + 3, t.y);
      ctx.arc(t.x, t.y, 3, 0, 2 * Math.PI);
    }
    ctx.fill();

    ctx.globalAlpha = 1;
    ctx.fillStyle = unutra;
    ctx.beginPath();
    for (const t of m.tacke) {
      if (!uPrizmi(t, PROZOR, duzina, alfa)) continue;
      n++;
      ctx.moveTo(t.x + 4.5, t.y);
      ctx.arc(t.x, t.y, 4.5, 0, 2 * Math.PI);
    }
    ctx.fill();
    return n;
  }

  useAnimacija((korak) => {
    const m = mreza.current;
    if (m && !stoji) {
      const u = smjer(alfa);
      const put = w * PX_PO_CM * korak;
      pomjeri(m, u.x * put, u.y * put);
    }
    const n = crtaj();
    kadar.current++;
    if (kadar.current % 5 === 0 || stoji) postaviPrebrojano(n);
  });

  function ispocetka() {
    postaviRho(POCETNO.rho);
    postaviW(POCETNO.w);
    postaviAlfa(POCETNO.alfa);
    postaviDt(POCETNO.dt);
    mreza.current = napraviMrezu(POCETNO.rho / PX_PO_CM ** 2, W, H, slucajno(SJEME));
  }

  const vrhovi = vrhoviPrizme(PROZOR, duzina, alfa);
  const u = smjer(alfa);
  const visinaPrizme = w * dt * Math.cos(alfa);

  /* Mala skica ugla: normala vodoravno, w pod uglom α. */
  const SX = 90;
  const SY = 120;
  const SL = 110;
  const luk = 56;

  return (
    <Laboratorija
      crtez={
        <div className={f.platno} style={{ aspectRatio: `${W} / ${H}` }}>
          <canvas ref={platno} aria-hidden="true" />
          <svg
            viewBox={`0 0 ${W} ${H}`}
            role="img"
            aria-label={`Naboji se kreću brzinom w pod uglom ${alfaStep}° prema normali prozorčića; u kosoj prizmi iza prozorčića ih je ${prebrojano}.`}
          >
            <polygon
              points={vrhovi.map((v) => `${v.x},${v.y}`).join(' ')}
              className={f.prizma}
            />
            <line x1={PROZOR.x} y1={PROZOR.y1} x2={PROZOR.x} y2={PROZOR.y2} className={f.prozor} />
            <text x={PROZOR.x} y={PROZOR.y1 - 18} textAnchor="middle" className={`${s.tekst} ${f.naCrtezu}`}>
              δa = {broj(DA_CM, 0)} cm
            </text>
            <Strelica x1={PROZOR.x + 4} y1={210} x2={PROZOR.x + 100} y2={210} boja="normala" />
            <text x={PROZOR.x + 112} y={220} className={`${s.simbol} ${s.normala} ${f.naCrtezu}`}>
              n
            </text>
            <text
              x={(vrhovi[1].x + vrhovi[2].x) / 2 - 12}
              y={(vrhovi[1].y + vrhovi[2].y) / 2 + 34}
              textAnchor="end"
              className={`${s.tekst} ${f.naCrtezu}`}
            >
              w·δt = {broj(w * dt, 2)} cm
            </text>

            <line x1={SX} y1={SY} x2={SX + SL} y2={SY} className={s.isprekidana} />
            <text x={SX + SL + 10} y={SY + 8} className={`${s.simbol} ${s.normala} ${f.naCrtezu}`}>
              n
            </text>
            <Strelica x1={SX} y1={SY} x2={SX + SL * u.x} y2={SY + SL * u.y} boja="brzina" />
            <text x={SX + (SL + 14) * u.x} y={SY + (SL + 14) * u.y - 6} className={`${s.simbol} ${s.brzina} ${f.naCrtezu}`}>
              w
            </text>
            {alfaStep > 0 && (
              <>
                <path
                  d={`M ${SX + luk} ${SY} A ${luk} ${luk} 0 0 0 ${SX + luk * u.x} ${SY + luk * u.y}`}
                  className={s.linija}
                />
                <text
                  x={SX + (luk + 18) * Math.cos(alfa / 2)}
                  y={SY - (luk + 18) * Math.sin(alfa / 2) + 8}
                  className={`${s.tekst} ${f.naCrtezu}`}
                >
                  α
                </text>
              </>
            )}
          </svg>
        </div>
      }
      kontrole={
        <>
          <Klizac id="rho" natpis="gustina ρ" vrijednost={rho} prikaz={`${broj(rho, 1)} nC/cm²`} min={0.5} max={3} korak={0.5} boja="naboj-plus" onPromjena={postaviRho} />
          <Klizac id="w" natpis="brzina w" vrijednost={w} prikaz={`${broj(w, 1)} cm/s`} min={0.5} max={4} korak={0.5} boja="brzina" onPromjena={postaviW} />
          <Klizac id="alfa" natpis="ugao α prema n" vrijednost={alfaStep} prikaz={`${alfaStep}°`} min={0} max={75} korak={5} boja="normala" onPromjena={postaviAlfa} />
          <Klizac id="dt" natpis="vrijeme δt" vrijednost={dt} prikaz={`${broj(dt, 2)} s`} min={0.5} max={2} korak={0.25} boja="text" onPromjena={postaviDt} />
          <RedDugmadi opis="Kretanje">
            <Taster pritisnut={stoji} onClick={() => postaviPauzu(!stoji)}>
              {stoji ? 'Pokreni' : 'Zaustavi'}
            </Taster>
            <Taster onClick={ispocetka}>Počni ispočetka</Taster>
          </RedDugmadi>
        </>
      }
      ocitavanja={
        <Ocitavanja>
          <Ocitavanje natpis="Prebrojano u prizmi, δQ" vrijednost={String(prebrojano)} jedinica="nC" pod="svaka tačka je 1 nC" />
          <Ocitavanje natpis="Po formuli" vrijednost={broj(formula, 1)} jedinica="nC" pod="ρ·δa·w·δt·cos α" />
          <Ocitavanje natpis="Struja δi = δQ/δt" vrijednost={broj(prebrojano / dt, 1)} jedinica="nA" pod={`po formuli ${broj(formula / dt, 1)} nA`} />
          <Ocitavanje natpis="Gustina struje J = ρw" vrijednost={broj(rho * w, 1)} jedinica="nA/cm" pod="po cm prozorčića" />
        </Ocitavanja>
      }
      status={
        <StatusLinija
          sta={`U prizmi je ${prebrojano} ${prebrojano % 10 === 1 && prebrojano % 100 !== 11 ? 'naboj' : 'naboja'}, a formula daje ${broj(formula, 1)} nC.`}
          zasto={
            alfaStep === 0
              ? 'Pri α = 0° prizma je pravougaonik: visina joj je cijeli put w·δt.'
              : `Prizma je kosa: u smjeru normale visoka je samo w·δt·cos α = ${broj(visinaPrizme, 2)} cm od ${broj(w * dt, 2)} cm puta.`
          }
        />
      }
    />
  );
}
