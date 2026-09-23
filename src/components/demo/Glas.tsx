'use client';

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useAnimacija } from '@/lib/animacija';
import { broj } from '@/lib/format';
import {
  DB_MAX,
  DB_MIN,
  F_MAX,
  F_MIN,
  FFT,
  MAGMA,
  najjacaHz,
  napraviPaletu,
  nivoDbfs,
  okidanje,
  osnovniTon,
  OZNAKE_HZ,
  PRAG_GOVORA_DB,
  redZaHz,
  sintetizujGovor,
  spektarDb,
  uRedove,
} from '@/lib/spektar';
import type { Poruka } from '@/lib/h-most';
import {
  Napomena,
  Ocitavanja,
  Ocitavanje,
  Okvir,
  PanelKontrola,
  StatusLinija,
  Taster,
  instrumentStil,
} from '@/components/instrument/Okvir';
import { Oscilloskop, Snimak, type Kanal, type Uzorak } from '@/components/instrument/Oscilloskop';
import gl from './glas.module.css';

/*
  Tvoj glas uživo.

  Mikrofon se čita preko AnalyserNode-a i nigdje se ne spaja na zvučnik:
  zato nema zavijanja u sali, i zato je tvrdnja „ništa se ne snima" tačna.
  Ovdje ne postoji ni MediaRecorder ni ijedan mrežni poziv, samo odsječak
  od 2048 uzoraka koji se svaki kadar prepiše preko prethodnog.

  Kad mikrofona nema, ilustracija govora prolazi kroz isti FFT (lib/spektar.ts).
*/

/** Kolona spektrograma po sekundi, i koliko ih stane: 6 s na ekranu. */
const KOLONA_PO_S = 100;
const KOLONA = 600;
const SEKUNDI = KOLONA / KOLONA_PO_S;
const REDOVA = 256;

/** Talas na osciloskopu: 40 ms poslije okidanja. */
const PROZOR_MS = 40;
const TACAKA_TALASA = 480;

/** Ilustracija se računa kao da je uzorkovana na 48 kHz, kao većina mikrofona. */
const UZORKOVANJE_ILUSTRACIJE = 48000;

/** Osvježavanje brojeva na strani, u kadrovima. Brže od toga oko ne stiže da pročita. */
const SVAKI_KADAR = 8;

const KANALI: readonly Kanal[] = [{ boja: 'osjeti', natpis: 'CH1 mikrofon, 10 % punog opsega/pod.', skala: 10 }];

type Stanje = 'ilustracija' | 'trazim' | 'uzivo' | 'odbijeno' | 'nemoguce';
type Mjerenje = { nivo: number; ton: number | null; najjaca: number | null; uzorkovanje: number };

/** useSyncExternalStore traži stabilnu referencu, a ovdje nema šta da se mijenja. */
function prazanUpis() {
  return () => {};
}

function mikrofonMoguc() {
  return typeof navigator.mediaDevices?.getUserMedia === 'function' && window.isSecureContext;
}

function porukaZa(stanje: Stanje, govori: boolean): Poruka {
  switch (stanje) {
    case 'uzivo':
      return govori
        ? {
            sta: 'To si ti: gore je talas u vremenu, dolje koje su visine jake.',
            zasto: 'Vodoravne pruge su harmonici tvog tona, svaki je cijeli umnožak osnovnog.',
          }
        : {
            sta: 'Mikrofon radi. Reci nešto ili otpjevaj jedan ton.',
            zasto: 'Jedan ton daje ravne pruge; kad mijenjaš visinu, sve pruge idu gore i dolje zajedno.',
          };
    case 'trazim':
      return { sta: 'Tražim dozvolu za mikrofon.', zasto: 'Zvuk se samo crta: ne snima se i ne šalje se nikuda.' };
    case 'odbijeno':
      return {
        sta: 'Mikrofon nije dozvoljen, pa je prikazana ilustracija govora.',
        zasto: 'Ilustracija prolazi kroz isti račun kao mikrofon, pa izgleda kao pravi glas.',
      };
    case 'nemoguce':
      return {
        sta: 'Ovaj uređaj ne daje mikrofon ovoj strani, pa je prikazana ilustracija govora.',
        zasto: 'Vodoravne pruge su harmonici osnovnog tona, a svijetle zone su formanti: rezonancije usta.',
      };
    default:
      return {
        sta: 'Ovo je ilustracija govora, izračunata istim FFT-om kao i mikrofon.',
        zasto: 'Vodoravne pruge su harmonici osnovnog tona, a svijetle zone su formanti: rezonancije usta.',
      };
  }
}

const hz = (f: number) => (f >= 1000 ? `${broj(f / 1000, f >= 10000 ? 0 : 1)} kHz` : `${Math.round(f)} Hz`);

export function Glas() {
  const moguc = useSyncExternalStore(prazanUpis, mikrofonMoguc, () => false);

  const [stanje, postaviStanje] = useState<Stanje>('ilustracija');
  const [govori, postaviGovori] = useState(false);
  const [mjerenje, postaviMjerenje] = useState<Mjerenje>({ nivo: -Infinity, ton: null, najjaca: null, uzorkovanje: UZORKOVANJE_ILUSTRACIJE });

  const [snimak] = useState(() => new Snimak(PROZOR_MS));
  const t = useRef(0);
  const kolone = useRef(0);
  const kadar = useRef(0);
  const signal = useRef(new Float32Array(FFT));
  const db = useRef(new Float32Array(FFT / 2));
  const redovi = useRef(new Uint8Array(REDOVA));
  const govoriRef = useRef(false);

  const strujaRef = useRef<MediaStream | null>(null);
  const kontekstRef = useRef<AudioContext | null>(null);
  const analizatorRef = useRef<AnalyserNode | null>(null);

  const platnoRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const slikaRef = useRef<ImageData | null>(null);
  const paleta = useRef(napraviPaletu(MAGMA));

  const ugasiMikrofon = useCallback(() => {
    strujaRef.current?.getTracks().forEach((s) => s.stop());
    strujaRef.current = null;
    analizatorRef.current = null;
    void kontekstRef.current?.close();
    kontekstRef.current = null;
  }, []);

  useEffect(() => ugasiMikrofon, [ugasiMikrofon]);

  /** Jedan korak: odsječak signala → spektar → redovi. */
  const izracunaj = useCallback((uzorkovanje: number) => {
    spektarDb(signal.current, db.current);
    uRedove(db.current, uzorkovanje, redovi.current);
  }, []);

  /** Upisuje n novih kolona desno, pošto se slika pomjeri ulijevo. */
  const upisiKolone = useCallback((n: number) => {
    const ctx = ctxRef.current;
    const platno = platnoRef.current;
    if (!ctx || !platno || n <= 0) return;
    if (!slikaRef.current || slikaRef.current.width !== n) slikaRef.current = ctx.createImageData(n, REDOVA);
    const d = slikaRef.current.data;
    const p = paleta.current;
    for (let y = 0; y < REDOVA; y++) {
      const v = redovi.current[y];
      for (let k = 0; k < n; k++) {
        const i = (y * n + k) * 4;
        d[i] = p[v * 3];
        d[i + 1] = p[v * 3 + 1];
        d[i + 2] = p[v * 3 + 2];
        d[i + 3] = 255;
      }
    }
    ctx.drawImage(platno, -n, 0);
    ctx.putImageData(slikaRef.current, KOLONA - n, 0);
  }, []);

  /* Prazno platno koje se puni šest sekundi na štandu izgleda pokvareno, pa se istorija popuni ilustracijom. */
  const popuniIstoriju = useCallback(() => {
    for (let i = 0; i < KOLONA; i++) {
      sintetizujGovor(t.current - SEKUNDI + i / KOLONA_PO_S, UZORKOVANJE_ILUSTRACIJE, signal.current);
      izracunaj(UZORKOVANJE_ILUSTRACIJE);
      upisiKolone(1);
    }
  }, [izracunaj, upisiKolone]);

  useEffect(() => {
    const platno = platnoRef.current;
    const ctx = platno?.getContext('2d', { alpha: false });
    if (!platno || !ctx) return;
    platno.width = KOLONA;
    platno.height = REDOVA;
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = MAGMA[0];
    ctx.fillRect(0, 0, KOLONA, REDOVA);
    ctxRef.current = ctx;
    popuniIstoriju();
  }, [popuniIstoriju]);

  useAnimacija((dt) => {
    t.current += dt;
    const analizator = analizatorRef.current;
    const uzorkovanje = analizator ? analizator.context.sampleRate : UZORKOVANJE_ILUSTRACIJE;
    if (analizator) analizator.getFloatTimeDomainData(signal.current);
    else sintetizujGovor(t.current, UZORKOVANJE_ILUSTRACIJE, signal.current);

    izracunaj(uzorkovanje);

    /* Spektrogram ide po vremenu, ne po kadrovima: 100 kolona u sekundi na svakom ekranu. */
    kolone.current += dt * KOLONA_PO_S;
    const n = Math.floor(kolone.current);
    kolone.current -= n;
    upisiKolone(Math.min(n, KOLONA));

    /* Talas: okinut na prolazu kroz nulu, 40 ms od tog mjesta. */
    const s = signal.current;
    const duzina = Math.min(s.length - 1, Math.round((PROZOR_MS / 1000) * uzorkovanje));
    const pocetak = okidanje(s, s.length - duzina);
    const uzorci: Uzorak[] = [];
    for (let j = 0; j <= TACAKA_TALASA; j++) {
      const i = pocetak + Math.round((j / TACAKA_TALASA) * duzina);
      uzorci.push({ t: (j / TACAKA_TALASA) * PROZOR_MS, v: [s[i] * 100], greska: false });
    }
    snimak.zamijeni(uzorci, PROZOR_MS);

    const nivo = nivoDbfs(s);
    const glasno = nivo > PRAG_GOVORA_DB;
    if (glasno !== govoriRef.current && (glasno || nivo < PRAG_GOVORA_DB - 6)) {
      govoriRef.current = glasno;
      postaviGovori(glasno);
    }
    if (++kadar.current % SVAKI_KADAR === 0) {
      postaviMjerenje({
        nivo,
        ton: glasno ? osnovniTon(s, uzorkovanje) : null,
        najjaca: glasno ? najjacaHz(db.current, uzorkovanje) : null,
        uzorkovanje,
      });
    }
  });

  async function ukljuciMikrofon() {
    postaviStanje('trazim');
    try {
      const struja = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      });
      const Konstruktor =
        window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Konstruktor) throw new Error('nema AudioContext');
      const kontekst = new Konstruktor();
      await kontekst.resume();
      const analizator = kontekst.createAnalyser();
      analizator.fftSize = FFT;
      /* Namjerno bez spajanja na zvučnik: inače bi sala zaurlala. */
      kontekst.createMediaStreamSource(struja).connect(analizator);
      strujaRef.current = struja;
      kontekstRef.current = kontekst;
      analizatorRef.current = analizator;
      postaviStanje('uzivo');
    } catch {
      ugasiMikrofon();
      postaviStanje('odbijeno');
    }
  }

  function iskljuciMikrofon() {
    ugasiMikrofon();
    postaviStanje('ilustracija');
  }

  function naResetuj() {
    iskljuciMikrofon();
    t.current = 0;
    popuniIstoriju();
  }

  /* Tastatura: M uključuje i isključuje mikrofon, R resetuje. */
  const stanjeRef = useRef(stanje);
  useEffect(() => {
    stanjeRef.current = stanje;
  }, [stanje]);
  useEffect(() => {
    const naTaster = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key.toLowerCase();
      if (k === 'm') {
        if (stanjeRef.current === 'uzivo') iskljuciMikrofon();
        else if (mikrofonMoguc() && stanjeRef.current !== 'trazim') void ukljuciMikrofon();
      } else if (k === 'r') naResetuj();
      else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', naTaster);
    return () => window.removeEventListener('keydown', naTaster);
    // Stanje se čita kroz ref, pa se slušalac postavlja jednom.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stvarno: Stanje = !moguc && stanje === 'ilustracija' ? 'nemoguce' : stanje;
  const uzivo = stvarno === 'uzivo';
  const poruka = porukaZa(stvarno, govori);
  const izvor = uzivo ? 'tvoj glas' : 'ilustracija';

  return (
    <Okvir
      nazad={{ naziv: 'Jarvis', putanja: '/jarvis' }}
      naslov="Tvoj glas uživo"
      uvod="Zvuk je talas, a talas je zbir tonova: spektrogram pokazuje koliko je koji ton jak."
      onResetuj={naResetuj}
      status={<StatusLinija sta={poruka.sta} zasto={poruka.zasto} />}
      sema={
        <div className={gl.okvir}>
          <Oscilloskop
            kanali={KANALI}
            snimak={snimak}
            desno={`${PROZOR_MS} ms na ekranu, ${PROZOR_MS / 10} ms/pod., okinuto na nuli`}
            opis="Osciloskop: talas zvuka u vremenu"
          />
          <section className={`${instrumentStil.panel} ${gl.spektrogram}`}>
            <div className={gl.legenda}>
              <span>
                Spektrogram, {izvor}: logaritamska osa {F_MIN} Hz do {hz(F_MAX)}
              </span>
              <span className={gl.skalaBoja}>
                {broj(DB_MIN, 0)} dBFS
                <i style={{ background: `linear-gradient(90deg, ${MAGMA.join(', ')})` }} />
                {broj(DB_MAX, 0)} dBFS
              </span>
            </div>
            <div className={gl.mreza}>
              <div className={gl.osaHz} aria-hidden="true">
                {OZNAKE_HZ.map((f) => (
                  <span key={f} style={{ top: `${((redZaHz(f, REDOVA) + 0.5) / REDOVA) * 100}%` }}>
                    {hz(f)}
                  </span>
                ))}
              </div>
              <div className={gl.slika}>
                <canvas ref={platnoRef} className={gl.platno} role="img" aria-label={`Spektrogram, ${izvor}, posljednjih ${SEKUNDI} sekundi`} />
                {OZNAKE_HZ.map((f) => (
                  <i key={f} className={gl.linijaHz} style={{ top: `${((redZaHz(f, REDOVA) + 0.5) / REDOVA) * 100}%` }} />
                ))}
              </div>
              <div className={gl.osaT} aria-hidden="true">
                {Array.from({ length: SEKUNDI + 1 }, (_, i) => (
                  <span key={i} style={{ left: `${(i / SEKUNDI) * 100}%` }}>
                    {i === SEKUNDI ? 'sada' : `−${SEKUNDI - i} s`}
                  </span>
                ))}
              </div>
            </div>
          </section>
        </div>
      }
      strana={
        <>
          <Ocitavanja>
            <Ocitavanje
              natpis="Glasnoća"
              vrijednost={Number.isFinite(mjerenje.nivo) ? broj(Math.max(-99, mjerenje.nivo), 0) : '−∞'}
              jedinica="dBFS"
              pod={govori ? 'govor' : 'tišina sobe'}
            />
            <Ocitavanje
              natpis="Osnovni ton"
              vrijednost={mjerenje.ton === null ? '—' : String(Math.round(mjerenje.ton))}
              jedinica="Hz"
              pod={mjerenje.ton === null ? 'nema jasnog tona' : 'razmak između pruga'}
            />
            <Ocitavanje
              natpis="Najjača frekvencija"
              vrijednost={mjerenje.najjaca === null ? '—' : String(Math.round(mjerenje.najjaca))}
              jedinica="Hz"
              pod={mjerenje.najjaca === null ? '' : 'najsvjetlija pruga'}
            />
            <Ocitavanje
              natpis="Uzorkovanje"
              vrijednost={broj(mjerenje.uzorkovanje / 1000, 1)}
              jedinica="kHz"
              pod={`FFT od ${FFT} uzoraka`}
            />
          </Ocitavanja>

          <PanelKontrola>
            <div className={instrumentStil.redTastera}>
              {uzivo ? (
                <Taster pritisnut onClick={iskljuciMikrofon} boja="osjeti">
                  Isključi mikrofon
                </Taster>
              ) : (
                <Taster onClick={() => void ukljuciMikrofon()} boja="osjeti" disabled={!moguc || stvarno === 'trazim'}>
                  {stvarno === 'trazim' ? 'Čekam dozvolu' : 'Uključi mikrofon'}
                </Taster>
              )}
            </div>
          </PanelKontrola>

          <Napomena>
            Zvuk se ovdje samo gleda: ne snima se, ne šalje se nikuda i mikrofon nije spojen na zvučnik. Bez mikrofona je prikazana ilustracija
            govora, a ne ničiji snimak. dBFS znači decibele ispod najglasnijeg zvuka koji mikrofon može da da.
          </Napomena>
        </>
      }
    />
  );
}
