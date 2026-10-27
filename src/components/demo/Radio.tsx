'use client';

import { useEffect, useRef, useState } from 'react';
import { FAILSAFE_MS, RADIO_VEZE } from '@/config/cinjenice';
import { useAnimacija } from '@/lib/animacija';
import { broj } from '@/lib/format';
import { FORMAT_JE_ILUSTRATIVAN, koraciXor, uBinarno, xor } from '@/lib/paket';
import {
  ISTORIJA_MS,
  korakRadija,
  odPosljednjeg,
  POCETNO_RADIO,
  postaviSignal,
  RAZMAK_MS,
  roverStao,
  udariMunjom,
  type Prijem,
  type StanjeRadija,
} from '@/lib/radio';
import type { Poruka } from '@/lib/h-most';
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
import radio from './radio.module.css';

/** Usporenje za ekran: paket stiže svakih 40 ms, ovdje svakih 400 ms. */
const USPORENO = 10;

const MHZ = RADIO_VEZE.find((v) => v.naziv.startsWith('Komande za Perjanika'))?.mhz ?? null;

const REZIMI = [
  { id: 'jedna', natpis: 'Jedna munja' },
  { id: 'dvije', natpis: 'Dvije munje, isti bit' },
] as const;

const heks = (b: number) => `0x${b.toString(16).toUpperCase().padStart(2, '0')}`;

function porukaZa(st: StanjeRadija, dvije: boolean): Poruka {
  if (!st.signal) {
    if (roverStao(st)) {
      return {
        sta: `Nema ispravnog paketa ${FAILSAFE_MS} ms, pa je rover sam stao.`,
        zasto: 'Bez ovoga bi rover nastavio sa posljednjom komandom i otišao van kontrole.',
      };
    }
    return {
      sta: 'Signal je prekinut: paketi ne stižu, a rover broji vrijeme bez komande.',
      zasto: `Ako za ${FAILSAFE_MS} ms ne stigne ispravan paket, rover sam stane.`,
    };
  }
  const p = st.prikazan;
  if (p?.ishod === 'odbacen') {
    return {
      sta: 'Munja je promijenila jedan bit, XOR se ne slaže i paket je odbačen.',
      zasto: `Rover ignoriše tu komandu i čeka sljedeću, koja stiže za ${RAZMAK_MS} ms.`,
    };
  }
  if (p?.ishod === 'pokvarenProsao') {
    return {
      sta: 'Dvije munje su promijenile isti bit u dva bajta, a XOR se ipak slaže.',
      zasto: 'Dvije promjene se u XOR-u ponište, pa zato ozbiljniji protokoli koriste CRC.',
    };
  }
  return {
    sta: `Paket stiže svakih ${RAZMAK_MS} ms i XOR se slaže, pa rover prihvata komandu.`,
    zasto: dvije
      ? 'Sad munja mijenja isti bit u dva bajta: gledaj šta će XOR reći.'
      : 'Pritisni Munja: jedan pokvaren bit mijenja XOR i prijemnik to vidi.',
  };
}

type Prikaz = { stanje: StanjeRadija };

export function Radio() {
  const stanje = useRef<StanjeRadija>(POCETNO_RADIO);
  const [prikaz, postaviPrikaz] = useState<Prikaz>({ stanje: POCETNO_RADIO });
  const [dvije, postaviDvije] = useState(false);
  const kadar = useRef(0);

  function promijeni(novo: (st: StanjeRadija) => StanjeRadija) {
    stanje.current = novo(stanje.current);
    postaviPrikaz({ stanje: stanje.current });
  }

  useAnimacija((dt) => {
    const prije = stanje.current;
    const st = korakRadija(prije, (dt * 1000) / USPORENO, Math.random);
    stanje.current = st;
    kadar.current++;
    if (st.prikazan !== prije.prikazan || roverStao(st) !== roverStao(prije) || kadar.current % 5 === 0) {
      postaviPrikaz({ stanje: st });
    }
  });

  const dvijeRef = useRef(dvije);
  useEffect(() => {
    dvijeRef.current = dvije;
  }, [dvije]);

  /* Tastatura: 1 munja, 2 signal, M vrsta munje, R reset. */
  useEffect(() => {
    const naTaster = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key.toLowerCase();
      if (k === '1') promijeni((s) => udariMunjom(s, dvijeRef.current));
      else if (k === '2') promijeni((s) => postaviSignal(s, !s.signal));
      else if (k === 'm') postaviDvije((d) => !d);
      else if (k === 'r') naResetuj();
    };
    window.addEventListener('keydown', naTaster);
    return () => window.removeEventListener('keydown', naTaster);
    // Stanje se čita kroz ref, pa se slušalac postavlja jednom.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function naResetuj() {
    promijeni(() => ({ ...POCETNO_RADIO }));
  }

  const st = prikaz.stanje;
  const poruka = porukaZa(st, dvije);
  const stao = roverStao(st);
  const bez = Math.min(odPosljednjeg(st), FAILSAFE_MS);

  return (
    <Okvir
      nazad={{ naziv: 'Perjanik', putanja: '/sajam/perjanik' }}
      naslov="Radio paket"
      uvod="Svaki paket nosi provjeru: prijemnik računa XOR i baca paket koji se ne slaže."
      rezimi={<Rezimi opis="Vrsta smetnje" opcije={REZIMI} izabran={dvije ? 'dvije' : 'jedna'} onIzbor={(id) => postaviDvije(id === 'dvije')} />}
      onResetuj={naResetuj}
      status={<StatusLinija sta={poruka.sta} zasto={poruka.zasto} greska={stao} />}
      osciloskop={<VremenskaLinija stanje={stanje} />}
      sema={<Tabela prijem={st.prikazan} signal={st.signal} />}
      strana={
        <>
          <Ocitavanja>
            <Ocitavanje natpis="Prihvaćeno" vrijednost={String(st.brojac.prihvacen)} jedinica="paketa" />
            <Ocitavanje natpis="Odbačeno" vrijednost={String(st.brojac.odbacen)} jedinica="paketa" pod="XOR se nije slagao" />
            <Ocitavanje
              natpis="Prošlo pokvareno"
              vrijednost={String(st.brojac.pokvarenProsao)}
              jedinica="paketa"
              pod={st.brojac.pokvarenProsao ? 'XOR ih nije vidio' : ''}
              vruce={st.brojac.pokvarenProsao > 0}
            />
            <Ocitavanje
              natpis="Bez ispravnog paketa"
              vrijednost={String(Math.round(bez))}
              jedinica="ms"
              pod={stao ? 'rover stoji' : `rover staje na ${FAILSAFE_MS} ms`}
              vruce={stao}
            />
          </Ocitavanja>

          <PanelKontrola>
            <div className={instrumentStil.redTastera}>
              <Taster
                boja="fault"
                disabled={!st.signal || st.munja !== 'nema'}
                onClick={() => promijeni((s) => udariMunjom(s, dvije))}
              >
                Munja
              </Taster>
              <Taster pritisnut={!st.signal} onClick={() => promijeni((s) => postaviSignal(s, !s.signal))}>
                {st.signal ? 'Prekini signal' : 'Vrati signal'}
              </Taster>
            </div>
          </PanelKontrola>

          <Napomena>
            Usporeno {USPORENO} puta: paket stiže svakih {RAZMAK_MS} ms, a ovdje svakih {broj((RAZMAK_MS * USPORENO) / 1000, 1)} s.
            {FORMAT_JE_ILUSTRATIVAN ? ' Format paketa je ilustrativan dok se pravi ne potvrdi.' : ''}
          </Napomena>
        </>
      }
    />
  );
}

/* ------------------------------------------------------------------ tabela */

const X_NAZIV = 190;
const X_HEKS = 250;
const X_BITOVI = 330;
const CELIJA = 44;
const RAZMAK = 6;
const X_XOR = X_BITOVI + 8 * (CELIJA + RAZMAK) + 30;
const Y_PRVI = 190;
const RED = 56;

function Tabela({ prijem, signal }: { prijem: Prijem | null; signal: boolean }) {
  const primljeni = prijem?.primljeni ?? [];
  const poslati = prijem?.poslati ?? [];
  const podaci = primljeni.slice(0, -1);
  const izracunati = xor(podaci);
  const primljeniXor = primljeni.at(-1) ?? 0;
  const slaze = izracunati === primljeniXor;

  const redovi = koraciXor(podaci).map((k, i) => ({
    naziv: k.naziv,
    bajt: k.vrijednost,
    bilo: poslati[i],
    medju: k.medjurezultat,
  }));

  const yRacunati = Y_PRVI + redovi.length * RED + 26;
  const yPrimljeni = yRacunati + RED;
  const ishod = prijem?.ishod;

  return (
    <svg viewBox="0 0 900 540" role="img" aria-label="Tabela primljenog paketa: bajtovi, bitovi i XOR red po red">
      {/* veza: palica šalje, Perjanik prima */}
      <rect x={40} y={24} width={150} height={52} rx={4} className={stil.blok} />
      <text x={115} y={56} textAnchor="middle" className={stil.tekst}>
        Palica, TX
      </text>
      <rect x={710} y={24} width={150} height={52} rx={4} className={stil.blok} />
      <text x={785} y={56} textAnchor="middle" className={stil.tekst}>
        Perjanik, RX
      </text>
      <line x1={190} y1={50} x2={710} y2={50} className={signal ? stil.zica : stil.isprekidano} />
      <text x={450} y={40} textAnchor="middle" className={stil.tih}>
        {MHZ ? `${MHZ} MHz, ` : ''}
        {signal ? `paket svakih ${RAZMAK_MS} ms` : 'signal prekinut'}
      </text>

      {/* zaglavlje kolona */}
      <text x={X_NAZIV} y={Y_PRVI - 44} textAnchor="end" className={stil.tih}>
        polje
      </text>
      <text x={X_HEKS} y={Y_PRVI - 44} className={stil.tih}>
        heks
      </text>
      {Array.from({ length: 8 }, (_, i) => (
        <text key={i} x={X_BITOVI + i * (CELIJA + RAZMAK) + CELIJA / 2} y={Y_PRVI - 44} textAnchor="middle" className={stil.tih}>
          bit {7 - i}
        </text>
      ))}
      <text x={X_XOR} y={Y_PRVI - 44} className={stil.tih}>
        XOR do sada
      </text>

      {redovi.map((r, i) => (
        <RedBajta
          key={r.naziv}
          y={Y_PRVI + i * RED}
          naziv={r.naziv}
          bajt={r.bajt}
          bilo={r.bilo}
          desno={heks(r.medju)}
        />
      ))}

      <line x1={X_BITOVI} y1={yRacunati - 38} x2={X_BITOVI + 8 * (CELIJA + RAZMAK) - RAZMAK} y2={yRacunati - 38} className={stil.zica} />

      <RedBajta y={yRacunati} naziv="XOR računati" bajt={izracunati} bilo={izracunati} desno="" />
      <RedBajta y={yPrimljeni} naziv="XOR primljeni" bajt={primljeniXor} bilo={poslati.at(-1) ?? primljeniXor} desno="" />

      {prijem && (
        <text
          x={X_XOR}
          y={yPrimljeni - 18}
          className={slaze && ishod === 'prihvacen' ? radio.slaze : radio.neSlaze}
        >
          {slaze ? 'slaže se' : 'ne slaže se'}
        </text>
      )}
      {prijem && (
        <text x={X_XOR} y={yPrimljeni + 6} className={ishod === 'prihvacen' ? stil.tih : stil.greska}>
          {ishod === 'prihvacen' ? 'komanda prihvaćena' : ishod === 'odbacen' ? 'paket odbačen' : 'a paket je pokvaren'}
        </text>
      )}
    </svg>
  );
}

/** Jedan red: naziv, heks, osam bitova. Bit koji se razlikuje od poslatog je u boji greške. */
function RedBajta({ y, naziv, bajt, bilo, desno }: { y: number; naziv: string; bajt: number; bilo: number; desno: string }) {
  const bitovi = uBinarno(bajt);
  const pogodjen = bajt !== bilo;
  return (
    <g>
      <text x={X_NAZIV} y={y + 6} textAnchor="end" className={stil.tekst}>
        {naziv}
      </text>
      <text x={X_HEKS} y={y + (pogodjen ? -2 : 6)} className={pogodjen ? radio.heksGreska : radio.heks}>
        {heks(bajt)}
      </text>
      {bitovi.split('').map((znak, i) => {
        const promijenjen = ((bajt ^ bilo) >> (7 - i)) & 1;
        const x = X_BITOVI + i * (CELIJA + RAZMAK);
        return (
          <g key={i}>
            <rect
              x={x}
              y={y - CELIJA / 2}
              width={CELIJA}
              height={CELIJA}
              rx={3}
              className={promijenjen ? radio.celijaGreska : znak === '1' ? radio.celijaJedan : radio.celija}
            />
            <text
              x={x + CELIJA / 2}
              y={y + 8}
              textAnchor="middle"
              className={promijenjen || znak === '1' ? radio.bitSvijetao : radio.bit}
            >
              {znak}
            </text>
          </g>
        );
      })}
      {desno && (
        <text x={X_XOR} y={y + 6} className={radio.heks}>
          {desno}
        </text>
      )}
      {pogodjen && (
        <text x={X_HEKS} y={y + 27} className={radio.bilo}>
          bilo {heks(bilo)}
        </text>
      )}
    </g>
  );
}

/* ------------------------------------------------------------------ vremenska linija */

const VL_SIRINA = 440;
const VL_X0 = 10;
const VL_X1 = VL_SIRINA - 10;
const VL_Y = 52;

/**
  Posljednja sekunda prijema, pravo vrijeme na osi: paket na svakih 40 ms,
  odbačeni u boji greške. Ispod je failsafe kao traka koja se prazni sa
  svakim ispravnim paketom.
*/
function VremenskaLinija({ stanje }: { stanje: React.RefObject<StanjeRadija> }) {
  const [st, postavi] = useState<StanjeRadija>(POCETNO_RADIO);
  useAnimacija(() => postavi(stanje.current));

  const X = (t: number) => VL_X1 - ((st.t - t) / ISTORIJA_MS) * (VL_X1 - VL_X0);
  const bez = Math.min(odPosljednjeg(st), FAILSAFE_MS);
  const stao = roverStao(st);
  const udio = bez / FAILSAFE_MS;

  const podjele: number[] = [];
  const prva = Math.ceil((st.t - ISTORIJA_MS) / RAZMAK_MS) * RAZMAK_MS;
  for (let t = prva; t <= st.t; t += RAZMAK_MS) podjele.push(t);

  return (
    <section className={`${instrumentStil.panel} ${radio.linija}`}>
      <div className={radio.legenda}>
        <span>Prijem, posljednja sekunda; podjela je {RAZMAK_MS} ms</span>
        <span className={radio.kljucGreska}>odbačen</span>
      </div>
      <svg viewBox={`0 0 ${VL_SIRINA} 120`} role="img" aria-label="Vremenska linija prijema paketa i failsafe tajmer">
        <line x1={VL_X0} y1={VL_Y} x2={VL_X1} y2={VL_Y} className={stil.zicaTanka} />
        {podjele.map((t) => (
          <line key={t} x1={X(t)} y1={VL_Y - 4} x2={X(t)} y2={VL_Y + 4} className={stil.zicaTanka} />
        ))}
        {[0, 250, 500, 750, 1000].map((ms) => (
          <text
            key={ms}
            x={VL_X1 - (ms / ISTORIJA_MS) * (VL_X1 - VL_X0)}
            y={VL_Y + 24}
            textAnchor={ms === 0 ? 'end' : ms === ISTORIJA_MS ? 'start' : 'middle'}
            className={radio.osa}
          >
            {ms === 0 ? 'sada' : `−${ms} ms`}
          </text>
        ))}
        {st.prijemi.map((p) => (
          <rect
            key={p.t}
            x={X(p.t) - 3}
            y={VL_Y - 34}
            width={5}
            height={30}
            rx={1}
            className={p.ishod === 'prihvacen' ? radio.paket : p.ishod === 'odbacen' ? radio.paketOdbacen : radio.paketPokvaren}
          />
        ))}

        {/* failsafe */}
        <rect x={VL_X0} y={96} width={VL_X1 - VL_X0} height={16} rx={3} className={radio.trakaOkvir} />
        <rect x={VL_X0} y={96} width={(VL_X1 - VL_X0) * udio} height={16} rx={3} className={stao ? radio.trakaStao : radio.traka} />
      </svg>
      <p className={stao ? radio.failsafeStao : radio.failsafe}>
        failsafe: {Math.round(bez)} od {FAILSAFE_MS} ms bez ispravnog paketa
      </p>
    </section>
  );
}
