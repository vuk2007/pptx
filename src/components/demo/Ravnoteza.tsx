'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useAnimacija } from '@/lib/animacija';
import { broj } from '@/lib/format';
import {
  greska,
  izmjereni,
  K_MAX,
  K_MIN,
  korakRavnoteze,
  MAX_NAGIB,
  MAX_ZELJENI,
  pao,
  POCETNO_RAVNOTEZA,
  porukaRavnoteze,
  preskok,
  zeta,
  type StanjeRavnoteze,
} from '@/lib/ravnoteza';
import {
  Klizac,
  Napomena,
  Ocitavanja,
  Ocitavanje,
  Okvir,
  PanelKontrola,
  Rezimi,
  StatusLinija,
  Taster,
} from '@/components/instrument/Okvir';
import { Oscilloskop, Snimak, type Kanal } from '@/components/instrument/Oscilloskop';
import stil from './sema.module.css';
import rv from './ravnoteza.module.css';

/*
  Povratna sprega na XGO psu, sa dvije strane: lijevo pas na nagnutoj
  platformi (bočni pogled), desno ista stvar kao blok dijagram, sa
  vrijednošću na svakoj žici. Fizika je u lib/ravnoteza.ts.
*/

/** Koliko sekundi stane na ekran osciloskopa. */
const PROZOR = 6;

const KANALI: readonly Kanal[] = [
  { boja: 'odluci', natpis: 'CH1 željeni nagib r, 10°/pod.', skala: 10, nula: 1.5 },
  { boja: 'osjeti', natpis: 'CH2 izmjereni nagib y, 10°/pod.', skala: 10, nula: 1.5 },
  { boja: 'ch1', natpis: 'CH3 greška e, 10°/pod.', skala: 10, nula: -2.5 },
];

const REZIMI = [
  { id: 'sprega', natpis: 'Sa povratnom spregom' },
  { id: 'bez', natpis: 'Bez sprege' },
] as const;

const ugao = (v: number) => `${broj(v, 1)}°`;

/** useSyncExternalStore traži stabilnu referencu, a ovdje nema šta da se mijenja. */
function prazanUpis() {
  return () => {};
}

/*
  Dugme za nagib uređaja ne smije da se pojavi na TV-u ni na laptopu.
  Sama provjera dozvole nije dovoljna: Chrome na desktopu takođe ima
  requestPermission, pa se traži i da uređaj bude na dodir.
*/
function imaSenzorZaNagib() {
  const dogadjaj = window.DeviceOrientationEvent as typeof window.DeviceOrientationEvent & {
    requestPermission?: () => Promise<string>;
  };
  if (typeof dogadjaj?.requestPermission !== 'function') return false;
  return navigator.maxTouchPoints > 0 && window.matchMedia('(pointer: coarse)').matches;
}

export function Ravnoteza() {
  const stanje = useRef<StanjeRavnoteze>(POCETNO_RAVNOTEZA);
  const [st, postavi] = useState<StanjeRavnoteze>(POCETNO_RAVNOTEZA);
  const [snimak] = useState(() => new Snimak(PROZOR));
  const vrijeme = useRef(0);
  const kadar = useRef(0);

  const [senzorUkljucen, postaviSenzorUkljucen] = useState(false);
  const [senzorCuti, postaviSenzorCuti] = useState(false);
  const senzorMoguc = useSyncExternalStore(prazanUpis, imaSenzorZaNagib, () => false);
  const stigloSaSenzora = useRef(false);

  function promijeni(novo: (s: StanjeRavnoteze) => StanjeRavnoteze) {
    stanje.current = novo(stanje.current);
    postavi(stanje.current);
  }

  useAnimacija((dt) => {
    let s = stanje.current;
    /* Četiri manja koraka, da i najveće pojačanje ostane stabilno kad kadar potraje. */
    for (let i = 0; i < 4; i++) s = korakRavnoteze(s, dt / 4);
    stanje.current = s;
    vrijeme.current += dt;
    snimak.dodaj(vrijeme.current, [s.zeljeni, izmjereni(s), greska(s)], pao(s));
    if (++kadar.current % 5 === 0 || pao(s) !== pao(st)) postavi(s);
  });

  useEffect(() => {
    const naTaster = (e: KeyboardEvent) => {
      const cilj = e.target as HTMLElement | null;
      if (cilj?.tagName === 'INPUT' || e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key.toLowerCase();
      const ogranici = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
      if (k === 'arrowright') promijeni((s) => ({ ...s, platforma: ogranici(s.platforma + 2, -MAX_NAGIB, MAX_NAGIB) }));
      else if (k === 'arrowleft') promijeni((s) => ({ ...s, platforma: ogranici(s.platforma - 2, -MAX_NAGIB, MAX_NAGIB) }));
      else if (k === 'arrowup') promijeni((s) => ({ ...s, K: ogranici(s.K + 1, K_MIN, K_MAX) }));
      else if (k === 'arrowdown') promijeni((s) => ({ ...s, K: ogranici(s.K - 1, K_MIN, K_MAX) }));
      else if (k === 'm') promijeni((s) => ({ ...s, sprega: !s.sprega }));
      else if (k === 'r') naResetuj();
      else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', naTaster);
    return () => window.removeEventListener('keydown', naTaster);
    // Stanje se čita kroz ref, pa se slušalac postavlja jednom.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function naResetuj() {
    promijeni(() => POCETNO_RAVNOTEZA);
    snimak.ocisti();
  }

  /* Nagib iPada: dozvola se mora tražiti iz dodira, ne iz efekta. */
  async function ukljuciSenzor() {
    const dogadjaj = window.DeviceOrientationEvent as typeof window.DeviceOrientationEvent & {
      requestPermission?: () => Promise<string>;
    };
    try {
      const odgovor = await dogadjaj.requestPermission?.();
      if (odgovor !== 'granted') return;
    } catch {
      return;
    }
    window.addEventListener('deviceorientation', naOrijentaciju);
    postaviSenzorUkljucen(true);
    postaviSenzorCuti(false);

    /* Dozvola ne znači da senzor postoji. Ako ništa ne javi, to se kaže. */
    stigloSaSenzora.current = false;
    setTimeout(() => {
      if (!stigloSaSenzora.current) {
        window.removeEventListener('deviceorientation', naOrijentaciju);
        postaviSenzorUkljucen(false);
        postaviSenzorCuti(true);
      }
    }, 1500);
  }

  function naOrijentaciju(dogadjaj: DeviceOrientationEvent) {
    const { beta, gamma } = dogadjaj;
    if (beta === null || gamma === null) return;
    stigloSaSenzora.current = true;
    /*
      beta i gamma su vezani za uređaj, ne za ekran. U landscape-u se
      nagib koji korisnik vidi kao lijevo-desno nalazi u beta, sa znakom
      koji zavisi od toga na koju je stranu ekran okrenut.
    */
    const ugaoEkrana = window.screen.orientation?.angle ?? 0;
    const nagib = ugaoEkrana === 90 ? beta : ugaoEkrana === 270 ? -beta : ugaoEkrana === 180 ? -gamma : gamma;
    promijeni((s) => ({ ...s, platforma: Math.max(-MAX_NAGIB, Math.min(MAX_NAGIB, nagib)) }));
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => () => window.removeEventListener('deviceorientation', naOrijentaciju), []);

  const poruka = porukaRavnoteze(st);
  const y = izmjereni(st);
  const e = greska(st);
  const prevrnut = pao(st);

  return (
    <Okvir
      nazad={{ naziv: 'XGO psi', putanja: '/xgo' }}
      naslov="Povratna sprega"
      uvod="IMU mjeri nagib tijela, regulator računa grešku, a noge je ispravljaju."
      rezimi={
        <Rezimi
          opis="Povratna sprega"
          opcije={REZIMI}
          izabran={st.sprega ? 'sprega' : 'bez'}
          onIzbor={(id) => promijeni((s) => ({ ...s, sprega: id === 'sprega' }))}
        />
      }
      onResetuj={naResetuj}
      status={<StatusLinija sta={poruka.sta} zasto={poruka.zasto} greska={poruka.greska} />}
      osciloskop={
        <Oscilloskop
          kanali={KANALI}
          snimak={snimak}
          desno={`${PROZOR} s na ekranu, ${broj(PROZOR / 10, 1)} s/pod.`}
          opis="Osciloskop: željeni nagib, izmjereni nagib i greška kroz vrijeme"
        />
      }
      sema={
        <svg viewBox="0 0 1000 540" role="img" aria-label="Pas na nagnutoj platformi i blok dijagram povratne sprege">
          <Pas stanje={stanje} />
          <Dijagram st={st} />
        </svg>
      }
      strana={
        <>
          <Ocitavanja>
            <Ocitavanje natpis="Izmjereni nagib y" vrijednost={broj(y, 1)} jedinica="°" pod={`želi se ${ugao(st.zeljeni)}`} />
            <Ocitavanje natpis="Greška e" vrijednost={broj(e, 1)} jedinica="°" pod="e = r − y" />
            <Ocitavanje
              natpis="Pojačanje K"
              vrijednost={String(Math.round(st.K))}
              jedinica="1/s²"
              pod={`ζ = ${broj(zeta(st.K), 2)}, preskok ${Math.round(preskok(st.K) * 100)} %`}
            />
            <Ocitavanje
              natpis="Nagib platforme p"
              vrijednost={broj(st.platforma, 1)}
              jedinica="°"
              pod={prevrnut ? 'pas se prevrnuo' : senzorUkljucen ? 'sa nagiba iPada' : ''}
              vruce={prevrnut}
            />
          </Ocitavanja>

          <PanelKontrola>
            <Klizac
              id="nagib-platforme"
              natpis="Nagib platforme p"
              vrijednost={Math.round(st.platforma)}
              prikaz={ugao(st.platforma)}
              min={-MAX_NAGIB}
              max={MAX_NAGIB}
              boja="text"
              onPromjena={(v) => promijeni((s) => ({ ...s, platforma: v }))}
            />
            <Klizac
              id="zeljeni-nagib"
              natpis="Željeni nagib r"
              vrijednost={st.zeljeni}
              prikaz={ugao(st.zeljeni)}
              min={-MAX_ZELJENI}
              max={MAX_ZELJENI}
              boja="odluci"
              onPromjena={(v) => promijeni((s) => ({ ...s, zeljeni: v }))}
            />
            <Klizac
              id="pojacanje"
              natpis="Pojačanje K"
              vrijednost={st.K}
              prikaz={`${Math.round(st.K)} 1/s²`}
              min={K_MIN}
              max={K_MAX}
              boja="odluci"
              onPromjena={(v) => promijeni((s) => ({ ...s, K: v }))}
            />
            {senzorMoguc && !senzorUkljucen && !senzorCuti && <Taster onClick={ukljuciSenzor}>Koristi nagib iPada</Taster>}
          </PanelKontrola>

          <Napomena>
            {senzorCuti ? 'Senzor nagiba se ne javlja na ovom uređaju, pa koristi klizač. ' : ''}
            Model je ilustrativan: pravi pas ima složeniji regulator, a granica prevrtanja je izabrana za prikaz.
          </Napomena>
        </>
      }
    />
  );
}

/* ------------------------------------------------------------------ pas na platformi */

const OSLONAC = { x: 220, y: 430 };
const POLA_PLATFORME = 190;
const TIJELO = { x: 220, y: 262, pola: 150, visina: 40 };
/** Kukovi i stopala su ovoliko od sredine, duž tijela i duž platforme. */
const RASKORAK = 110;
/** Dužina natkoljenice i potkoljenice. */
const SEGMENT = 96;

type T = { x: number; y: number };

const rad = (st: number) => (st * Math.PI) / 180;
/** Pravac duž nagnute linije i normala nadolje (SVG: y raste nadolje, pozitivan ugao je u smjeru kazaljke). */
const duz = (ug: number): T => ({ x: Math.cos(rad(ug)), y: Math.sin(rad(ug)) });
const dolje = (ug: number): T => ({ x: -Math.sin(rad(ug)), y: Math.cos(rad(ug)) });

/** Koljeno dvodjelne noge: presjek dva kruga, uvijek na stražnjoj strani. */
function koljeno(kuk: T, stopalo: T): T {
  const dx = stopalo.x - kuk.x;
  const dy = stopalo.y - kuk.y;
  const d = Math.hypot(dx, dy) || 1;
  const pola = Math.min(d / 2, SEGMENT);
  const h = Math.sqrt(Math.max(0, SEGMENT * SEGMENT - pola * pola));
  const s = { x: kuk.x + (dx / d) * pola, y: kuk.y + (dy / d) * pola };
  return { x: s.x + (-dy / d) * h, y: s.y + (dx / d) * h };
}

/** Pas se crta u svakom kadru, jer se tijelo pomjera glatko. */
function Pas({ stanje }: { stanje: React.RefObject<StanjeRavnoteze> }) {
  const [st, postavi] = useState<StanjeRavnoteze>(POCETNO_RAVNOTEZA);
  useAnimacija(() => postavi(stanje.current));

  const p = st.platforma;
  const prevrnut = pao(st);
  /* Prevrnut pas stoji koliko i platforma; crta se oboren preko nižeg stopala. */
  const y = izmjereni(st);
  const up = duz(p);
  const ut = duz(y);
  const nt = dolje(y);
  const stopala = [-1, 1].map((s) => ({ x: OSLONAC.x + s * RASKORAK * up.x, y: OSLONAC.y + s * RASKORAK * up.y }));
  const kukovi = [-1, 1].map((s) => ({
    x: TIJELO.x + s * RASKORAK * ut.x + (TIJELO.visina / 2) * nt.x,
    y: TIJELO.y + s * RASKORAK * ut.y + (TIJELO.visina / 2) * nt.y,
  }));
  const koljena = kukovi.map((k, i) => koljeno(k, stopala[i]));
  const niza = stopala[p >= 0 ? 1 : 0];
  const obaranje = prevrnut ? `rotate(${Math.sign(p) * 58} ${niza.x} ${niza.y})` : undefined;

  return (
    <g>
      <text x={24} y={40} className={stil.tekst}>
        bočni pogled
      </text>

      {/* tlo i oslonac platforme */}
      <line x1={60} y1={500} x2={380} y2={500} className={stil.zica} />
      {Array.from({ length: 16 }, (_, i) => (
        <line key={i} x1={72 + i * 20} y1={502} x2={60 + i * 20} y2={514} className={stil.zicaTanka} />
      ))}
      <polygon points={`${OSLONAC.x},${OSLONAC.y + 8} ${OSLONAC.x - 34},500 ${OSLONAC.x + 34},500`} className={stil.blok} />

      {/* vodoravne pomoćne linije i lukovi uglova */}
      <line x1={OSLONAC.x - POLA_PLATFORME - 16} y1={OSLONAC.y} x2={OSLONAC.x + POLA_PLATFORME + 16} y2={OSLONAC.y} className={rv.pomocna} />
      <Luk x={OSLONAC.x} y={OSLONAC.y} r={POLA_PLATFORME + 6} ugao={p} oznaka="p" />

      <g transform={`rotate(${p} ${OSLONAC.x} ${OSLONAC.y})`}>
        <rect x={OSLONAC.x - POLA_PLATFORME} y={OSLONAC.y} width={POLA_PLATFORME * 2} height={14} rx={2} className={rv.platforma} />
      </g>
      <circle cx={OSLONAC.x} cy={OSLONAC.y + 7} r={4} className={stil.cvor} />

      {!prevrnut && (
        <>
          <line x1={TIJELO.x - TIJELO.pola - 20} y1={TIJELO.y} x2={TIJELO.x + TIJELO.pola + 20} y2={TIJELO.y} className={rv.pomocna} />
          <Luk x={TIJELO.x} y={TIJELO.y} r={TIJELO.pola + 12} ugao={y} oznaka="y" />
        </>
      )}

      <g transform={obaranje}>
        {kukovi.map((k, i) => (
          <g key={i}>
            <polyline points={`${k.x},${k.y} ${koljena[i].x},${koljena[i].y} ${stopala[i].x},${stopala[i].y}`} className={rv.noga} />
            <circle cx={k.x} cy={k.y} r={4.5} className={stil.cvor} />
            <circle cx={koljena[i].x} cy={koljena[i].y} r={4.5} className={stil.cvor} />
            <circle cx={stopala[i].x} cy={stopala[i].y} r={4.5} className={stil.cvor} />
          </g>
        ))}
        <g transform={`rotate(${y} ${TIJELO.x} ${TIJELO.y})`}>
          <rect
            x={TIJELO.x - TIJELO.pola}
            y={TIJELO.y - TIJELO.visina / 2}
            width={TIJELO.pola * 2}
            height={TIJELO.visina}
            rx={4}
            className={prevrnut ? rv.tijeloPalo : rv.tijelo}
          />
          <rect x={TIJELO.x - 26} y={TIJELO.y - 12} width={52} height={24} rx={2} className={rv.imu} />
          <text x={TIJELO.x} y={TIJELO.y + 5} textAnchor="middle" className={rv.imuTekst}>
            IMU
          </text>
        </g>
      </g>

      {prevrnut && (
        <text x={p > 0 ? 40 : 400} y={150} textAnchor={p > 0 ? 'start' : 'end'} className={stil.greska}>
          prevrnuo se
        </text>
      )}
    </g>
  );
}

/** Luk ugla od vodoravne pomoćne linije do nagnute, na desnom kraju. */
function Luk({ x, y, r, ugao: u, oznaka }: { x: number; y: number; r: number; ugao: number; oznaka: string }) {
  if (Math.abs(u) < 0.3) return null;
  const kraj = { x: x + r * Math.cos(rad(u)), y: y + r * Math.sin(rad(u)) };
  return (
    <g>
      <path d={`M${x + r},${y} A${r},${r} 0 0 ${u > 0 ? 1 : 0} ${kraj.x},${kraj.y}`} className={rv.luk} />
      <text x={x + r + 10} y={y + (u > 0 ? 22 : -10)} className={rv.natpisUgla}>
        {oznaka}
      </text>
    </g>
  );
}

/* ------------------------------------------------------------------ blok dijagram */

const RED = 170;
const S1 = { x: 500, y: RED };
const S2 = { x: 960, y: RED };
const R_ZBIRA = 16;
const REGULATOR = { x: 590, w: 110 };
const NOGE = { x: 790, w: 80 };
const BLOK_V = 64;
const IMU_BLOK = { x: 690, w: 110, y: 330 };

/** Vrh strelice na kraju žice, u pravcu kretanja signala. */
function Strelica({ x, y, smjer }: { x: number; y: number; smjer: 'desno' | 'lijevo' | 'gore' | 'dolje' }) {
  const ug = { desno: 0, dolje: 90, lijevo: 180, gore: 270 }[smjer];
  return <polygon points="0,0 -11,-5.5 -11,5.5" transform={`translate(${x} ${y}) rotate(${ug})`} className={rv.strelica} />;
}

function Blok({ x, w, y, naslov, uloga, klasa, klasaUloge }: { x: number; w: number; y: number; naslov: string; uloga: string; klasa: string; klasaUloge: string }) {
  return (
    <g>
      <text x={x + w / 2} y={y - BLOK_V / 2 - 10} textAnchor="middle" className={klasaUloge}>
        {uloga}
      </text>
      <rect x={x} y={y - BLOK_V / 2} width={w} height={BLOK_V} rx={4} className={klasa} />
      <text x={x + w / 2} y={y + 7} textAnchor="middle" className={stil.tekstVeliki}>
        {naslov}
      </text>
    </g>
  );
}

/** Natpis žice: simbol iznad, vrijednost ispod. */
function Natpis({ x, y, simbol, vrijednost }: { x: number; y: number; simbol: string; vrijednost: string }) {
  return (
    <g>
      <text x={x} y={y - 10} textAnchor="middle" className={rv.simbol}>
        {simbol}
      </text>
      <text x={x} y={y + 24} textAnchor="middle" className={rv.vrijednost}>
        {vrijednost}
      </text>
    </g>
  );
}

function Dijagram({ st }: { st: StanjeRavnoteze }) {
  const y = izmjereni(st);
  const e = greska(st);
  const komanda = st.sprega ? st.K * e : 0;
  const zatvoreno = st.sprega;
  const zica = zatvoreno ? stil.zica : rv.iskljuceno;
  const yDno = IMU_BLOK.y;

  return (
    <g>
      <text x={470} y={40} className={stil.tekst}>
        blok dijagram
      </text>

      {/* ulaz r */}
      <line x1={S1.x} y1={70} x2={S1.x} y2={S1.y - R_ZBIRA} className={stil.zica} />
      <Strelica x={S1.x} y={S1.y - R_ZBIRA} smjer="dolje" />
      <text x={S1.x + 12} y={86} className={rv.simbolOdluci}>
        r, željeni
      </text>
      <text x={S1.x + 12} y={110} className={rv.vrijednost}>
        {ugao(st.zeljeni)}
      </text>

      {/* sabirač 1 */}
      <circle cx={S1.x} cy={S1.y} r={R_ZBIRA} className={rv.zbir} />
      <text x={S1.x - 26} y={S1.y - 16} className={rv.znak}>
        +
      </text>
      <text x={S1.x - 26} y={S1.y + 36} className={rv.znak}>
        −
      </text>

      {/* e → regulator */}
      <line x1={S1.x + R_ZBIRA} y1={RED} x2={REGULATOR.x} y2={RED} className={zica} />
      <Strelica x={REGULATOR.x} y={RED} smjer="desno" />
      <Natpis x={(S1.x + R_ZBIRA + REGULATOR.x) / 2} y={RED} simbol="e" vrijednost={zatvoreno ? ugao(e) : ''} />
      <Blok x={REGULATOR.x} w={REGULATOR.w} y={RED} naslov="K · e" uloga="odluči" klasa={rv.regulator} klasaUloge={rv.ulogaOdluci} />

      {/* regulator → noge */}
      <line x1={REGULATOR.x + REGULATOR.w} y1={RED} x2={NOGE.x} y2={RED} className={zica} />
      <Strelica x={NOGE.x} y={RED} smjer="desno" />
      <Natpis
        x={(REGULATOR.x + REGULATOR.w + NOGE.x) / 2}
        y={RED}
        simbol="komanda"
        vrijednost={zatvoreno ? `${broj(komanda, 0)} °/s²` : '0 °/s²'}
      />
      <Blok x={NOGE.x} w={NOGE.w} y={RED} naslov="noge" uloga="djeluj" klasa={rv.noge} klasaUloge={rv.ulogaDjeluj} />

      {/* noge → sabirač 2 */}
      <line x1={NOGE.x + NOGE.w} y1={RED} x2={S2.x - R_ZBIRA} y2={RED} className={stil.zica} />
      <Strelica x={S2.x - R_ZBIRA} y={RED} smjer="desno" />
      <Natpis x={(NOGE.x + NOGE.w + S2.x - R_ZBIRA) / 2} y={RED} simbol="ispravka" vrijednost={ugao(st.ispravka)} />

      {/* ulaz p */}
      <line x1={S2.x} y1={70} x2={S2.x} y2={S2.y - R_ZBIRA} className={stil.zica} />
      <Strelica x={S2.x} y={S2.y - R_ZBIRA} smjer="dolje" />
      <text x={S2.x - 12} y={86} textAnchor="end" className={rv.simbol}>
        p, platforma
      </text>
      <text x={S2.x - 12} y={110} textAnchor="end" className={rv.vrijednost}>
        {ugao(st.platforma)}
      </text>

      {/* sabirač 2: y = p − ispravka */}
      <circle cx={S2.x} cy={S2.y} r={R_ZBIRA} className={rv.zbir} />
      <text x={S2.x + 12} y={S2.y - 22} className={rv.znak}>
        +
      </text>
      <text x={S2.x - 32} y={S2.y + 36} className={rv.znak}>
        −
      </text>

      {/* izlaz y, dolje do IMU-a */}
      <line x1={S2.x} y1={S2.y + R_ZBIRA} x2={S2.x} y2={yDno} className={stil.zica} />
      <line x1={S2.x} y1={yDno} x2={IMU_BLOK.x + IMU_BLOK.w} y2={yDno} className={stil.zica} />
      <Strelica x={IMU_BLOK.x + IMU_BLOK.w} y={yDno} smjer="lijevo" />
      <text x={S2.x - 12} y={250} textAnchor="end" className={rv.simbolOsjeti}>
        y, tijelo
      </text>
      <text x={S2.x - 12} y={274} textAnchor="end" className={rv.vrijednost}>
        {ugao(y)}
      </text>
      <Blok x={IMU_BLOK.x} w={IMU_BLOK.w} y={yDno} naslov="IMU" uloga="osjeti" klasa={rv.imuBlok} klasaUloge={rv.ulogaOsjeti} />

      {/* povratak: IMU → prekidač → sabirač 1 */}
      <line x1={IMU_BLOK.x} y1={yDno} x2={640} y2={yDno} className={stil.zica} />
      <Prekidac x1={640} x2={590} y={yDno} zatvoren={zatvoreno} />
      <line x1={590} y1={yDno} x2={S1.x} y2={yDno} className={zica} />
      <line x1={S1.x} y1={yDno} x2={S1.x} y2={S1.y + R_ZBIRA} className={zica} />
      <Strelica x={S1.x} y={S1.y + R_ZBIRA} smjer="gore" />
      <text x={615} y={yDno + 40} textAnchor="middle" className={zatvoreno ? rv.simbol : stil.greska}>
        {zatvoreno ? 'sprega zatvorena' : 'sprega otvorena'}
      </text>

      <text x={470} y={450} className={stil.tih}>
        e = r − y, a y = p − ispravka.
      </text>
      <text x={470} y={476} className={stil.tih}>
        Noge imaju masu, pa ispravka kasni za komandom.
      </text>
    </g>
  );
}

/** Prekidač u povratnoj grani, kao na šemi: dvije tačke i poluga. */
function Prekidac({ x1, x2, y, zatvoren }: { x1: number; x2: number; y: number; zatvoren: boolean }) {
  return (
    <g>
      <circle cx={x1} cy={y} r={4} className={stil.cvor} />
      <circle cx={x2} cy={y} r={4} className={stil.cvor} />
      <line x1={x1} y1={y} x2={zatvoren ? x2 : x2 + 8} y2={zatvoren ? y : y - 26} className={zatvoren ? stil.zica : rv.polugaOtvorena} />
    </g>
  );
}
