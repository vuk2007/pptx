'use client';

import { useEffect, useRef, useState } from 'react';
import { XGO_RADIO, XGO_SIGURNOST } from '@/config/cinjenice';
import { useAnimacija } from '@/lib/animacija';
import { broj } from '@/lib/format';
import {
  aktivnaVeza,
  BLOKOVI,
  korakKomande,
  MJESTO_KOMANDE,
  odbacen,
  PAKET,
  POCETNO_KOMANDA,
  porukaKomande,
  posalji,
  primljeniPaket,
  RIJEC,
  sjeo,
  VEZE,
  type Blok,
  type StanjeKomande,
} from '@/lib/komanda';
import { BAJTOVI_SU_ILUSTRATIVNI, racunChecksuma, uHeks } from '@/lib/xgo-paket';
import {
  Napomena,
  Ocitavanja,
  Ocitavanje,
  Okvir,
  PanelKontrola,
  Rezimi,
  StatusLinija,
  Taster,
  instrumentStil,
} from '@/components/instrument/Okvir';
import stil from './sema.module.css';
import km from './komanda.module.css';

/*
  Put komande kao blok dijagram: šest blokova, pet veza, i na svakoj vezi
  bajtovi koji njome stvarno idu. Logika je u lib/komanda.ts.
*/

const REZIMI = [
  { id: 'ispravno', natpis: 'Ispravan paket' },
  { id: 'smetnja', natpis: 'Smetnja na serijskoj vezi' },
] as const;

/* ------------------------------------------------------------------ raspored */

const SIRINA = 130;
const VISINA = 64;
const RED_1 = 120;
const RED_2 = 410;

/** Lijeva ivica i red svakog bloka, redom kao u BLOKOVI. */
const MJESTA = [
  { x: 20, y: RED_1 },
  { x: 400, y: RED_1 },
  { x: 830, y: RED_1 },
  { x: 830, y: RED_2 },
  { x: 370, y: RED_2 },
  { x: 20, y: RED_2 },
];

type T = { x: number; y: number };

/** Početak i kraj svake veze: od ivice jednog bloka do ivice sljedećeg. */
function krajeviVeze(i: number): [T, T] {
  const a = MJESTA[i];
  const b = MJESTA[i + 1];
  if (a.y === b.y) {
    const desno = b.x > a.x;
    return [
      { x: desno ? a.x + SIRINA : a.x, y: a.y },
      { x: desno ? b.x : b.x + SIRINA, y: b.y },
    ];
  }
  return [
    { x: a.x + SIRINA / 2, y: a.y + VISINA / 2 },
    { x: b.x + SIRINA / 2, y: b.y - VISINA / 2 },
  ];
}

export function Komanda() {
  const stanje = useRef<StanjeKomande>(POCETNO_KOMANDA);
  const [st, postavi] = useState<StanjeKomande>(POCETNO_KOMANDA);
  const kadar = useRef(0);
  const porukaRef = useRef<SVGRectElement | null>(null);

  function promijeni(novo: (s: StanjeKomande) => StanjeKomande) {
    stanje.current = novo(stanje.current);
    postavi(stanje.current);
  }

  useAnimacija((dt) => {
    const prije = stanje.current;
    const s = korakKomande(prije, dt);
    stanje.current = s;

    /* Poruka putuje duž aktivne veze. */
    const i = aktivnaVeza(s);
    if (i !== null && porukaRef.current) {
      const [a, b] = krajeviVeze(i);
      const t = s.napredak - i;
      porukaRef.current.setAttribute('transform', `translate(${a.x + (b.x - a.x) * t} ${a.y + (b.y - a.y) * t})`);
    }
    if (aktivnaVeza(s) !== aktivnaVeza(prije) || s.ide !== prije.ide || ++kadar.current % 5 === 0) postavi(s);
  });

  useEffect(() => {
    const naTaster = (e: KeyboardEvent) => {
      const cilj = e.target as HTMLElement | null;
      if (cilj?.tagName === 'INPUT' || e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key.toLowerCase();
      if (k === 'arrowright' || k === 'pagedown' || k === '1') {
        if (!stanje.current.ide) promijeni(posalji);
      } else if (k === 'm') promijeni((s) => ({ ...POCETNO_KOMANDA, pokvaren: !s.pokvaren }));
      else if (k === 'r') promijeni(() => POCETNO_KOMANDA);
      else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', naTaster);
    return () => window.removeEventListener('keydown', naTaster);
  }, []);

  const poruka = porukaKomande(st);
  const aktivna = aktivnaVeza(st);
  /** Do kojeg bloka je poruka stigla (uključivo). */
  const stigla = st.poslata ? Math.floor(st.napredak) : -1;

  return (
    <Okvir
      nazad={{ naziv: 'XGO psi', putanja: '/xgo' }}
      naslov="Put komande"
      uvod={`Na svakoj od pet veza riječ „${RIJEC}” ima drugi oblik, dok ne postane pokret.`}
      rezimi={
        <Rezimi
          opis="Serijska veza"
          opcije={REZIMI}
          izabran={st.pokvaren ? 'smetnja' : 'ispravno'}
          onIzbor={(id) => promijeni(() => ({ ...POCETNO_KOMANDA, pokvaren: id === 'smetnja' }))}
        />
      }
      onResetuj={() => promijeni(() => POCETNO_KOMANDA)}
      status={<StatusLinija sta={poruka.sta} zasto={poruka.zasto} greska={poruka.greska} />}
      osciloskop={<Checksum st={st} />}
      sema={
        <svg viewBox="0 0 1000 540" role="img" aria-label="Blok dijagram puta komande, sa bajtovima na svakoj vezi">
          {VEZE.map((v, i) => (
            <VezaCrtez key={i} i={i} st={st} stanje={i === aktivna ? 'aktivna' : i < stigla ? 'prosla' : 'ceka'} />
          ))}

          {BLOKOVI.map((b, i) => (
            <BlokCrtez
              key={i}
              blok={b}
              x={MJESTA[i].x}
              y={MJESTA[i].y}
              dosla={stigla >= i}
              ispod={
                i === 4 && odbacen(st)
                  ? { tekst: 'paket odbačen', klasa: stil.greska }
                  : i === 5 && sjeo(st)
                    ? { tekst: 'pas sjeda', klasa: km.pokret }
                    : null
              }
            />
          ))}

          {/* poruka na putu */}
          <rect
            ref={porukaRef}
            x={-8}
            y={-8}
            width={16}
            height={16}
            rx={2}
            className={km.poruka}
            visibility={st.ide ? 'visible' : 'hidden'}
            transform={`translate(${MJESTA[0].x + SIRINA} ${RED_1})`}
          />
        </svg>
      }
      strana={
        <>
          <Ocitavanja>
            <Ocitavanje natpis="Radio do psa" vrijednost={String(XGO_RADIO.mhz)} jedinica="MHz" pod={`grupa ${XGO_RADIO.grupa}`} />
            <Ocitavanje natpis="Serijski paket" vrijednost={String(PAKET.length)} jedinica="bajtova" pod="okvir 0x55 0x00 … 0x00 0xAA" />
            <Ocitavanje natpis="Pas staje bez komande" vrijednost={String(XGO_SIGURNOST.pasStajeBezKomande)} jedinica="ms" pod="prva kočnica" />
            <Ocitavanje
              natpis="Most šalje stop"
              vrijednost={broj(XGO_SIGURNOST.mostSaljeStopAkoLaptopCuti / 1000, 0)}
              jedinica="s"
              pod="ako laptop toliko ćuti"
            />
          </Ocitavanja>

          <PanelKontrola>
            <div className={instrumentStil.redTastera}>
              <Taster boja="odluci" disabled={st.ide} onClick={() => promijeni(posalji)}>
                Pošalji „{RIJEC}”
              </Taster>
            </div>
          </PanelKontrola>

          <Napomena>
            Treća kočnica je fizički taster za stop, mimo AI-ja. Put je usporen da se svaka veza vidi; na prve tri veze prikazana je sama
            riječ, bez okvira koji dodaju USB i radio.
            {BAJTOVI_SU_ILUSTRATIVNI ? ' Okvir i checksum serijskog paketa su pravi, a vrijednosti komande su ilustrativne dok se ne potvrde.' : ''}
          </Napomena>
        </>
      }
    />
  );
}

/* ------------------------------------------------------------------ blokovi i veze */

const KLASA_ULOGE: Record<string, string> = { osjeti: km.blokOsjeti, odluci: km.blokOdluci, djeluj: km.blokDjeluj };

function BlokCrtez({
  blok,
  x,
  y,
  dosla,
  ispod,
}: {
  blok: Blok;
  x: number;
  y: number;
  dosla: boolean;
  ispod: { tekst: string; klasa: string } | null;
}) {
  return (
    <g>
      <rect
        x={x}
        y={y - VISINA / 2}
        width={SIRINA}
        height={VISINA}
        rx={4}
        className={`${blok.uloga ? KLASA_ULOGE[blok.uloga] : stil.blok} ${dosla ? km.blokDosla : ''}`}
      />
      <text x={x + SIRINA / 2} y={y + 2} textAnchor="middle" className={stil.tekstVeliki}>
        {blok.naziv}
      </text>
      <text x={x + SIRINA / 2} y={y + 22} textAnchor="middle" className={stil.tih}>
        {blok.oznaka}
      </text>
      {ispod && (
        <text x={x + SIRINA / 2} y={y + VISINA / 2 + 26} textAnchor="middle" className={ispod.klasa}>
          {ispod.tekst}
        </text>
      )}
    </g>
  );
}

const CELIJA = 34;
const RAZMAK = 3;

/** Mjesto reda bajtova za svaku vezu: lijeva ivica i y gornje ivice ćelija. */
function mjestoBajtova(i: number, broj: number): T {
  const [a, b] = krajeviVeze(i);
  const sirina = broj * CELIJA + (broj - 1) * RAZMAK;
  if (a.y === b.y) return { x: (a.x + b.x) / 2 - sirina / 2, y: a.y + 18 };
  /* Radio veza je uspravna: bajtovi stoje lijevo od nje. */
  return { x: a.x - 26 - sirina, y: (a.y + b.y) / 2 - 6 };
}

function VezaCrtez({ i, st, stanje }: { i: number; st: StanjeKomande; stanje: 'aktivna' | 'prosla' | 'ceka' }) {
  const v = VEZE[i];
  const [a, b] = krajeviVeze(i);
  const uspravna = a.x === b.x;
  const radio = i === 2;
  const zicaKlasa = stanje === 'aktivna' ? km.zicaAktivna : stanje === 'prosla' ? stil.zica : km.zicaCeka;

  /* Smetnja se vidi tek kad paket krene serijskom vezom. */
  const bajtovi = i === 3 && stanje !== 'ceka' ? primljeniPaket(st) : v.bajtovi;
  const m = bajtovi ? mjestoBajtova(i, bajtovi.length) : null;

  return (
    <g className={stanje === 'ceka' ? km.ceka : undefined}>
      {radio ? (
        <>
          <Antena x={a.x} y={a.y} dolje />
          <Antena x={b.x} y={b.y} />
          <line x1={a.x} y1={a.y + 44} x2={b.x} y2={b.y - 44} className={km.vazduh} />
        </>
      ) : (
        <>
          <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} className={zicaKlasa} />
          <polygon
            points="0,0 -11,-5.5 -11,5.5"
            transform={`translate(${b.x} ${b.y}) rotate(${uspravna ? 90 : b.x > a.x ? 0 : 180})`}
            className={km.strelica}
          />
        </>
      )}

      {/* ime veze iznad žice, ili iznad bajtova kod radija */}
      <text
        x={m && uspravna ? m.x : (a.x + b.x) / 2}
        y={m && uspravna ? m.y - 14 : a.y - 12}
        textAnchor={uspravna ? 'start' : 'middle'}
        className={km.imeVeze}
      >
        {v.naziv}
      </text>

      {bajtovi && m ? (
        bajtovi.map((bajt, j) => {
          const pokvaren = i === 3 && bajt !== PAKET[j];
          const x = m.x + j * (CELIJA + RAZMAK);
          return (
            <g key={j}>
              <rect x={x} y={m.y} width={CELIJA} height={CELIJA} rx={3} className={pokvaren ? km.celijaGreska : km.celija} />
              <text x={x + CELIJA / 2} y={m.y + 23} textAnchor="middle" className={pokvaren ? km.heksSvijetao : km.heks}>
                {bajt.toString(16).toUpperCase().padStart(2, '0')}
              </text>
              <text x={x + CELIJA / 2} y={m.y + CELIJA + 18} textAnchor="middle" className={pokvaren ? stil.greska : km.ispod}>
                {v.ispod[j]}
              </text>
              {pokvaren && j === MJESTO_KOMANDE && (
                <text x={x + CELIJA / 2} y={m.y + CELIJA + 38} textAnchor="middle" className={km.bilo}>
                  bilo {PAKET[j].toString(16).toUpperCase()}
                </text>
              )}
            </g>
          );
        })
      ) : (
        <text x={(a.x + b.x) / 2} y={a.y + 30} textAnchor="middle" className={km.ispod}>
          {v.opis}
        </text>
      )}

      {bajtovi && m && !uspravna && (
        <text x={(a.x + b.x) / 2} y={m.y + CELIJA + (i === 3 && st.pokvaren && stanje !== 'ceka' ? 60 : 42)} textAnchor="middle" className={km.opisVeze}>
          heks; {v.opis}
        </text>
      )}
      {bajtovi && m && uspravna && (
        <text x={m.x} y={m.y + CELIJA + 42} className={km.opisVeze}>
          heks; {v.opis}
        </text>
      )}
    </g>
  );
}

/** Simbol antene: stub i trougao, kao na šemi. */
function Antena({ x, y, dolje = false }: { x: number; y: number; dolje?: boolean }) {
  const s = dolje ? 1 : -1;
  return (
    <g>
      <line x1={x} y1={y} x2={x} y2={y + s * 44} className={stil.zica} />
      <polyline points={`${x - 14},${y + s * 44} ${x},${y + s * 26} ${x + 14},${y + s * 44}`} className={stil.zica} />
    </g>
  );
}

/* ------------------------------------------------------------------ checksum */

function Checksum({ st }: { st: StanjeKomande }) {
  const p = PAKET;
  const poslati = racunChecksuma(p[2], p[3], p[4], p.slice(5, p.length - 3));
  const r = primljeniPaket(st);
  const primljeni = racunChecksuma(r[2], r[3], r[4], r.slice(5, r.length - 3));
  const stigao = st.poslata && st.napredak >= 4;
  const slaze = primljeni.checksum === r[r.length - 3];
  const zbir = (racun: typeof poslati) => racun.sabirci.map((s) => uHeks(s.vrijednost)).join(' + ');

  return (
    <section className={`${instrumentStil.panel} ${km.checksum}`}>
      <p className={km.naslovRacuna}>Checksum serijskog paketa: invertovan najniži bajt zbira</p>
      <p className={km.red}>
        <span className={km.ko}>micro:bit šalje</span>
        <span>
          {zbir(poslati)} = {uHeks(poslati.najniziBajt)}, invertovano <b>{uHeks(poslati.checksum)}</b>
        </span>
      </p>
      <p className={km.red}>
        <span className={km.ko}>ESP32 računa</span>
        {stigao ? (
          <span className={slaze ? undefined : km.neSlaze}>
            {zbir(primljeni)} = {uHeks(primljeni.najniziBajt)}, invertovano <b>{uHeks(primljeni.checksum)}</b>
            {slaze ? `, slaže se sa ${uHeks(r[r.length - 3])}` : `, a stiglo je ${uHeks(r[r.length - 3])}`}
          </span>
        ) : (
          <span className={km.ceka}>čeka paket</span>
        )}
      </p>
    </section>
  );
}
