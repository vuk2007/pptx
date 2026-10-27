'use client';

import { useEffect, useRef, useState } from 'react';
import { broj } from '@/lib/format';
import {
  BEDRO,
  NAJDALJE,
  direktno,
  inverzno,
  koljenoZa,
  porukaNoge,
  razlozenKuk,
  uDuzinamaBedra,
  type Tacka,
  type Uglovi,
} from '@/lib/noga';
import {
  Klizac,
  Napomena,
  Ocitavanja,
  Ocitavanje,
  Okvir,
  PanelKontrola,
  Rezimi,
  StatusLinija,
} from '@/components/instrument/Okvir';
import stil from './sema.module.css';
import ng from './noga.module.css';

/*
  Inverzna kinematika kao tehnički crtež: kote a, b i d, lukovi uglova
  θ1 i θ2, i osjenčena zona dokle stopalo može da dohvati. Desno je
  zakon kosinusa sa brojevima koji se upravo računaju.

  Dužine su ilustrativne, pa se mjere u dužinama bedra (a = 1).
*/

const REZIMI = [
  { id: 'inverzno', natpis: 'Inverzno: vučeš stopalo' },
  { id: 'direktno', natpis: 'Direktno: zadaješ uglove' },
] as const;

type Rezim = (typeof REZIMI)[number]['id'];

/** Razmjera crteža: piksela po jedinici modela. */
const R = 1.05;
const KUK = { x: 360, y: 330 };
const POCETNI_CILJ: Tacka = { x: 40, y: 220 };
const POCETNI_UGLOVI: Uglovi = { kuk: 18, koljeno: 120 };
/** Korak strelica: cilj za 0,1 a, ugao za 5°. */
const KORAK_CILJA = BEDRO / 10;

const uCrtez = (t: Tacka): Tacka => ({ x: KUK.x + t.x * R, y: KUK.y + t.y * R });
const a = (v: number, dec = 2) => broj(uDuzinamaBedra(v), dec);
const ogranici = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
const GRANICA_CILJA = NAJDALJE * 1.1;

export function Noga() {
  const [rezim, postaviRezim] = useState<Rezim>('inverzno');
  const [cilj, postaviCilj] = useState<Tacka>(POCETNI_CILJ);
  const [rucni, postaviRucne] = useState<Uglovi>(POCETNI_UGLOVI);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const vuce = useRef(false);

  const inverzni = rezim === 'inverzno';
  const rjesenje = inverzno(cilj);
  const uglovi = inverzni ? rjesenje.uglovi : rucni;
  const stopalo = inverzni ? rjesenje.stopalo : direktno(rucni);
  const koljeno = koljenoZa(uglovi);
  const uDometu = inverzni ? rjesenje.uDometu : true;
  const poruka = porukaNoge(inverzni, uglovi, stopalo, uDometu);
  const d = Math.hypot(stopalo.x, stopalo.y);

  function naResetuj() {
    postaviRezim('inverzno');
    postaviCilj(POCETNI_CILJ);
    postaviRucne(POCETNI_UGLOVI);
  }

  function pomjeriCilj(t: Tacka) {
    postaviCilj({ x: ogranici(t.x, -GRANICA_CILJA, GRANICA_CILJA), y: ogranici(t.y, -GRANICA_CILJA, GRANICA_CILJA) });
  }

  function vuci(klijentX: number, klijentY: number) {
    const matrica = svgRef.current?.getScreenCTM();
    if (!matrica) return;
    const t = new DOMPoint(klijentX, klijentY).matrixTransform(matrica.inverse());
    pomjeriCilj({ x: (t.x - KUK.x) / R, y: (t.y - KUK.y) / R });
  }

  /* Strelice: u inverznom pomjeraju cilj, u direktnom mijenjaju uglove. M mijenja režim, R resetuje. */
  const rezimRef = useRef(rezim);
  useEffect(() => {
    rezimRef.current = rezim;
  }, [rezim]);
  useEffect(() => {
    const naTaster = (e: KeyboardEvent) => {
      const meta = e.target as HTMLElement | null;
      if (meta?.tagName === 'INPUT' || e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key.toLowerCase();
      const pomak: Record<string, [number, number]> = { arrowleft: [-1, 0], arrowright: [1, 0], arrowup: [0, -1], arrowdown: [0, 1] };
      if (pomak[k]) {
        const [dx, dy] = pomak[k];
        if (rezimRef.current === 'inverzno') {
          postaviCilj((c) => ({
            x: ogranici(c.x + dx * KORAK_CILJA, -GRANICA_CILJA, GRANICA_CILJA),
            y: ogranici(c.y + dy * KORAK_CILJA, -GRANICA_CILJA, GRANICA_CILJA),
          }));
        } else {
          postaviRucne((u) => ({ kuk: ogranici(u.kuk + dx * 5, -80, 80), koljeno: ogranici(u.koljeno - dy * 5, 10, 180) }));
        }
      } else if (k === 'm') postaviRezim((r) => (r === 'inverzno' ? 'direktno' : 'inverzno'));
      else if (k === 'r') naResetuj();
      else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', naTaster);
    return () => window.removeEventListener('keydown', naTaster);
  }, []);

  const K = uCrtez(koljeno);
  const S = uCrtez(stopalo);
  const C = uCrtez(cilj);

  return (
    <Okvir
      nazad={{ naziv: 'XGO psi', putanja: '/sajam/xgo' }}
      naslov="Noga"
      uvod="Znaš gdje hoćeš stopalo, a tražiš uglove kuka i koljena: to je inverzna kinematika."
      rezimi={<Rezimi opis="Smjer računa" opcije={REZIMI} izabran={rezim} onIzbor={postaviRezim} />}
      onResetuj={naResetuj}
      status={<StatusLinija sta={poruka.sta} zasto={poruka.zasto} greska={poruka.greska} />}
      sema={
        <svg
          ref={svgRef}
          viewBox="0 0 1000 680"
          role="img"
          aria-label="Noga sa strane: kote, uglovi kuka i koljena i zona dometa"
          onPointerDown={(e) => {
            if (!inverzni) return;
            vuce.current = true;
            (e.target as Element).setPointerCapture?.(e.pointerId);
            vuci(e.clientX, e.clientY);
          }}
          onPointerMove={(e) => vuce.current && vuci(e.clientX, e.clientY)}
          onPointerUp={() => (vuce.current = false)}
          onPointerCancel={() => (vuce.current = false)}
        >
          <defs>
            <pattern id="srafura-dometa" width={12} height={12} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1={0} y1={0} x2={0} y2={12} className={ng.srafura} />
            </pattern>
          </defs>

          <text x={24} y={40} className={stil.tekst}>
            bočni pogled
          </text>

          {/* zona dometa */}
          <circle cx={KUK.x} cy={KUK.y} r={NAJDALJE * R} fill="url(#srafura-dometa)" className={ng.zona} />
          <Kota od={KUK} ugao={-35} duzina={NAJDALJE * R} natpis="a + b = 2 a" />
          <text x={KUK.x - NAJDALJE * R} y={KUK.y + NAJDALJE * R - 6} className={stil.tih}>
            zona dometa
          </text>

          {/* tijelo i kuk */}
          <rect x={KUK.x - 250} y={KUK.y - 70} width={300} height={58} rx={4} className={stil.blok} />
          <text x={KUK.x - 100} y={KUK.y - 35} textAnchor="middle" className={stil.tih}>
            tijelo
          </text>

          {/* pomoćna vertikala za θ1 */}
          <line x1={KUK.x} y1={KUK.y} x2={KUK.x} y2={KUK.y + 86} className={ng.pomocna} />

          {/* kote segmenata i d */}
          <KotaSegmenta p={KUK} q={K} dalje={S} natpis="a" />
          <KotaSegmenta p={K} q={S} dalje={KUK} natpis="b" />
          {d * R > 40 && <KotaD kuk={KUK} stopalo={S} koljeno={K} natpis={`d = ${a(d)} a`} />}

          {/* noga */}
          <line x1={KUK.x} y1={KUK.y} x2={K.x} y2={K.y} className={ng.segment} />
          <line x1={K.x} y1={K.y} x2={S.x} y2={S.y} className={ng.segment} />

          {/* uglovi */}
          <LukUgla centar={KUK} od={{ x: 0, y: 1 }} do={{ x: K.x - KUK.x, y: K.y - KUK.y }} r={52} natpis="θ1" />
          <LukUgla centar={K} od={{ x: KUK.x - K.x, y: KUK.y - K.y }} do={{ x: S.x - K.x, y: S.y - K.y }} r={38} natpis="θ2" />

          <circle cx={KUK.x} cy={KUK.y} r={7} className={ng.zglob} />
          <circle cx={K.x} cy={K.y} r={7} className={ng.zglob} />

          {/* cilj van dometa */}
          {!uDometu && (
            <g>
              <line x1={S.x} y1={S.y} x2={C.x} y2={C.y} className={ng.vanDometa} />
              <Krstic x={C.x} y={C.y} />
            </g>
          )}

          {/* stopalo: meta za prst i tastaturu u inverznom režimu */}
          <circle cx={S.x} cy={S.y} r={9} className={uDometu ? ng.stopalo : ng.stopaloGreska} />
          {inverzni && (
            <circle
              cx={S.x}
              cy={S.y}
              r={34}
              className={`${stil.meta} ${ng.meta}`}
              tabIndex={0}
              role="application"
              aria-label="Stopalo: vuci ga ili pomjeraj strelicama"
            />
          )}

          <Kosinus uglovi={uglovi} stopalo={stopalo} inverzni={inverzni} />
        </svg>
      }
      strana={
        <>
          <Ocitavanja>
            <Ocitavanje natpis="Kuk θ1" vrijednost={broj(uglovi.kuk, 0)} jedinica="°" pod="od vertikale, naprijed +" />
            <Ocitavanje natpis="Koljeno θ2" vrijednost={broj(uglovi.koljeno, 0)} jedinica="°" pod="180° je ispružena" />
            <Ocitavanje natpis="Udaljenost d" vrijednost={a(d)} jedinica="a" pod="domet je 2 a" vruce={!uDometu} />
            <Ocitavanje natpis="Stopalo x i y" vrijednost={`${a(stopalo.x, 1)} i ${a(stopalo.y, 1)}`} jedinica="a" pod="naprijed i nadolje od kuka" />
          </Ocitavanja>

          <PanelKontrola>
            {inverzni ? (
              <>
                <Klizac
                  id="cilj-x"
                  natpis="Cilj x, naprijed"
                  vrijednost={Math.round(uDuzinamaBedra(cilj.x) * 20) / 20}
                  prikaz={`${a(cilj.x)} a`}
                  min={-2.2}
                  max={2.2}
                  korak={0.05}
                  onPromjena={(v) => pomjeriCilj({ ...cilj, x: v * BEDRO })}
                />
                <Klizac
                  id="cilj-y"
                  natpis="Cilj y, nadolje"
                  vrijednost={Math.round(uDuzinamaBedra(cilj.y) * 20) / 20}
                  prikaz={`${a(cilj.y)} a`}
                  min={-2.2}
                  max={2.2}
                  korak={0.05}
                  onPromjena={(v) => pomjeriCilj({ ...cilj, y: v * BEDRO })}
                />
              </>
            ) : (
              <>
                <Klizac
                  id="ugao-kuka"
                  natpis="Kuk θ1"
                  vrijednost={rucni.kuk}
                  prikaz={`${broj(rucni.kuk, 0)}°`}
                  min={-80}
                  max={80}
                  boja="djeluj"
                  onPromjena={(v) => postaviRucne((u) => ({ ...u, kuk: v }))}
                />
                <Klizac
                  id="ugao-koljena"
                  natpis="Koljeno θ2"
                  vrijednost={rucni.koljeno}
                  prikaz={`${broj(rucni.koljeno, 0)}°`}
                  min={10}
                  max={180}
                  boja="djeluj"
                  onPromjena={(v) => postaviRucne((u) => ({ ...u, koljeno: v }))}
                />
              </>
            )}
          </PanelKontrola>

          <Napomena>
            Dužine su ilustrativne, pa se mjere u dužinama bedra a. Prava noga ima i treći motor koji je pomjera u stranu; on se sa strane ne vidi.
          </Napomena>
        </>
      }
    />
  );
}

/* ------------------------------------------------------------------ elementi crteža */

const jedinicni = (v: Tacka): Tacka => {
  const d = Math.hypot(v.x, v.y) || 1;
  return { x: v.x / d, y: v.y / d };
};

/** Vrh strelice kote, okrenut u pravcu `u`. */
function VrhKote({ t, u }: { t: Tacka; u: Tacka }) {
  const ug = (Math.atan2(u.y, u.x) * 180) / Math.PI;
  return <polygon points="0,0 -10,-4 -10,4" transform={`translate(${t.x} ${t.y}) rotate(${ug})`} className={ng.vrhKote} />;
}

/** Kota iz tačke, pod uglom (stepeni, SVG), sa strelicama na oba kraja. */
function Kota({ od, ugao, duzina, natpis }: { od: Tacka; ugao: number; duzina: number; natpis: string }) {
  const u = { x: Math.cos((ugao * Math.PI) / 180), y: Math.sin((ugao * Math.PI) / 180) };
  const kraj = { x: od.x + u.x * duzina, y: od.y + u.y * duzina };
  const sredina = { x: (od.x + kraj.x) / 2, y: (od.y + kraj.y) / 2 };
  return (
    <g>
      <line x1={od.x} y1={od.y} x2={kraj.x} y2={kraj.y} className={ng.kota} />
      <VrhKote t={kraj} u={u} />
      <text x={sredina.x - 14} y={sredina.y - 14} textAnchor="middle" className={ng.natpisKote}>
        {natpis}
      </text>
    </g>
  );
}

/**
  Kota segmenta: paralelna linija odmaknuta od segmenta, sa pomoćnim
  linijama do krajeva. Odmiče se na stranu dalje od `dalje` tačke,
  da ne pređe preko ugla između segmenata.
*/
function KotaSegmenta({ p, q, dalje, natpis }: { p: Tacka; q: Tacka; dalje: Tacka; natpis: string }) {
  const u = jedinicni({ x: q.x - p.x, y: q.y - p.y });
  let n = { x: -u.y, y: u.x };
  const sredina = { x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 };
  const prema = n.x * (dalje.x - sredina.x) + n.y * (dalje.y - sredina.y);
  /* Ispružena noga: nema „dalje" strane, pa kote a i b idu gore, a kota d dolje. */
  if (Math.abs(prema) < 12 ? n.y > 0 : prema > 0) n = { x: -n.x, y: -n.y };
  const O = 26;
  const p2 = { x: p.x + n.x * O, y: p.y + n.y * O };
  const q2 = { x: q.x + n.x * O, y: q.y + n.y * O };
  return (
    <g>
      <line x1={p.x + n.x * 8} y1={p.y + n.y * 8} x2={p.x + n.x * (O + 6)} y2={p.y + n.y * (O + 6)} className={ng.pomocnaKote} />
      <line x1={q.x + n.x * 8} y1={q.y + n.y * 8} x2={q.x + n.x * (O + 6)} y2={q.y + n.y * (O + 6)} className={ng.pomocnaKote} />
      <line x1={p2.x} y1={p2.y} x2={q2.x} y2={q2.y} className={ng.kota} />
      <VrhKote t={q2} u={u} />
      <VrhKote t={p2} u={{ x: -u.x, y: -u.y }} />
      <text x={sredina.x + n.x * (O + 16)} y={sredina.y + n.y * (O + 16) + 6} textAnchor="middle" className={ng.natpisKote}>
        {natpis}
      </text>
    </g>
  );
}

/** Kota d od kuka do stopala, isprekidana, sa natpisom na strani suprotnoj od koljena. */
function KotaD({ kuk, stopalo, koljeno, natpis }: { kuk: Tacka; stopalo: Tacka; koljeno: Tacka; natpis: string }) {
  const u = jedinicni({ x: stopalo.x - kuk.x, y: stopalo.y - kuk.y });
  let n = { x: -u.y, y: u.x };
  const sredina = { x: (kuk.x + stopalo.x) / 2, y: (kuk.y + stopalo.y) / 2 };
  const prema = n.x * (koljeno.x - sredina.x) + n.y * (koljeno.y - sredina.y);
  if (Math.abs(prema) < 12 ? n.y < 0 : prema > 0) n = { x: -n.x, y: -n.y };
  const x = sredina.x + n.x * 30;
  return (
    <g>
      <line x1={kuk.x} y1={kuk.y} x2={stopalo.x} y2={stopalo.y} className={ng.kotaD} />
      <VrhKote t={stopalo} u={u} />
      <text x={x} y={sredina.y + n.y * 30 + 6} textAnchor={n.x < -0.3 ? 'end' : n.x > 0.3 ? 'start' : 'middle'} className={ng.natpisD}>
        {natpis}
      </text>
    </g>
  );
}

/** Luk ugla između dva pravca, sa natpisom na simetrali. */
function LukUgla({ centar, od, do: ka, r, natpis }: { centar: Tacka; od: Tacka; do: Tacka; r: number; natpis: string }) {
  const u1 = jedinicni(od);
  const u2 = jedinicni(ka);
  const vektorski = u1.x * u2.y - u1.y * u2.x;
  const skalarni = u1.x * u2.x + u1.y * u2.y;
  if (Math.acos(Math.max(-1, Math.min(1, skalarni))) < 0.03) return null;
  const pocetak = { x: centar.x + u1.x * r, y: centar.y + u1.y * r };
  const kraj = { x: centar.x + u2.x * r, y: centar.y + u2.y * r };
  let s = jedinicni({ x: u1.x + u2.x, y: u1.y + u2.y });
  if (Math.hypot(u1.x + u2.x, u1.y + u2.y) < 1e-6) s = { x: -u1.y, y: u1.x };
  const t = { x: centar.x + s.x * (r + 18), y: centar.y + s.y * (r + 18) };
  return (
    <g>
      <path d={`M${pocetak.x},${pocetak.y} A${r},${r} 0 0 ${vektorski > 0 ? 1 : 0} ${kraj.x},${kraj.y}`} className={ng.luk} />
      <text x={t.x} y={t.y + 6} textAnchor={s.x < -0.3 ? 'end' : s.x > 0.3 ? 'start' : 'middle'} className={ng.natpisUgla}>
        {natpis}
      </text>
    </g>
  );
}

function Krstic({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r={11} className={ng.cilj} />
      <line x1={x - 17} y1={y} x2={x + 17} y2={y} className={ng.cilj} />
      <line x1={x} y1={y - 17} x2={x} y2={y + 17} className={ng.cilj} />
    </g>
  );
}

/* ------------------------------------------------------------------ zakon kosinusa */

const X_RACUN = 690;

function Kosinus({ uglovi, stopalo, inverzni }: { uglovi: Uglovi; stopalo: Tacka; inverzni: boolean }) {
  const d = uDuzinamaBedra(Math.hypot(stopalo.x, stopalo.y));
  const cosK = Math.cos((uglovi.koljeno * Math.PI) / 180);
  const { pravac, alfa } = razlozenKuk(stopalo);
  const redovi = inverzni
    ? [
        { tekst: 'cos θ2 = (a² + b² − d²) / 2ab', klasa: ng.formula },
        { tekst: `= (1 + 1 − ${broj(d, 2)}²) / 2 = ${broj(cosK, 2)}`, klasa: ng.racun },
        { tekst: `θ2 = ${broj(uglovi.koljeno, 0)}°`, klasa: ng.rezultat },
        { tekst: 'θ1 = φ + α', klasa: ng.formula },
        { tekst: `= ${broj(pravac, 0)}° + ${broj(alfa, 0)}°`, klasa: ng.racun },
        { tekst: `θ1 = ${broj(uglovi.kuk, 0)}°`, klasa: ng.rezultat },
      ]
    : [
        { tekst: 'd² = a² + b² − 2ab · cos θ2', klasa: ng.formula },
        { tekst: `= 1 + 1 − 2 · (${broj(cosK, 2)}) = ${broj(d * d, 2)}`, klasa: ng.racun },
        { tekst: `d = ${broj(d, 2)} a`, klasa: ng.rezultat },
        { tekst: 'Smjer stopala daje θ1,', klasa: ng.racun },
        { tekst: 'a udaljenost samo θ2.', klasa: ng.racun },
      ];
  return (
    <g>
      <text x={X_RACUN} y={150} className={stil.tekst}>
        zakon kosinusa
      </text>
      <text x={X_RACUN} y={176} className={stil.tih}>
        a = b = 1, φ je pravac ka stopalu
      </text>
      <line x1={X_RACUN} y1={192} x2={980} y2={192} className={stil.zicaTanka} />
      {redovi.map((r, i) => (
        <text key={i} x={X_RACUN} y={232 + i * 40 + (i >= 3 ? 20 : 0)} className={r.klasa}>
          {r.tekst}
        </text>
      ))}
    </g>
  );
}
