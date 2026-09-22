'use client';

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useAnimacija } from '@/lib/animacija';
import {
  TRAKA,
  ilustrativniSpektar,
  ilustrativniTalas,
  jacina,
  napraviPaletu,
} from '@/lib/spektar';
import { OkvirDemonstracije } from './OkvirDemonstracije';
import stil from './demo.module.css';
import svoj from './glas.module.css';

/*
  Tvoj glas uživo.

  Mikrofon se čita preko AnalyserNode-a i nigdje se ne spaja na zvučnik —
  zato nema zavijanja u sali, i zato je tvrdnja „ništa se ne snima" tačna:
  ovdje ne postoji ni MediaRecorder ni ijedan mrežni poziv, samo dva niza
  bajtova koji se svaki kadar prepišu preko prethodnih.

  Kad mikrofona nema, crta se ilustrativni govor. On je označen kao
  ilustracija jer nije ničiji snimak.
*/

/** Unutrašnja rezolucija spektrograma. CSS ga razvuče na ekran. */
const PLATNO_S = 1000;
const PLATNO_V = 300;
/** Koliko piksela istorije uđe u jedan kadar. */
const POMAK = 3;

const UZORAKA_TALASA = 512;
const FFT = 2048;

/** Iznad ovoga je „govori", ispod „tiho". Razmak sprečava treperenje poruke. */
const PRAG_GORE = 0.16;
const PRAG_DOLJE = 0.08;

const STANICE_PALETE = ['--maska-duboka', '--osjeti', '--odluci', '--bakar-struja', '--silkscreen'];

type Stanje = 'ilustracija' | 'trazim' | 'uzivo' | 'odbijeno' | 'nemoguce';

/** useSyncExternalStore traži stabilnu referencu, a ovdje nema šta da se mijenja. */
function prazanUpis() {
  return () => {};
}

function mikrofonMoguc() {
  return typeof navigator.mediaDevices?.getUserMedia === 'function' && window.isSecureContext;
}

/** Upisuje jednu kolonu spektrograma na zadato mjesto. */
function upisiKolonu(
  ctx: CanvasRenderingContext2D,
  kolona: ImageData,
  paleta: Uint8ClampedArray,
  spektar: Uint8Array,
  x: number,
) {
  const d = kolona.data;
  for (let y = 0; y < PLATNO_V; y++) {
    const kanta = Math.min(TRAKA - 1, Math.floor((1 - y / PLATNO_V) * TRAKA));
    const v = spektar[kanta];
    const r = paleta[v * 3];
    const g = paleta[v * 3 + 1];
    const b = paleta[v * 3 + 2];
    for (let k = 0; k < POMAK; k++) {
      const i = (y * POMAK + k) * 4;
      d[i] = r;
      d[i + 1] = g;
      d[i + 2] = b;
      d[i + 3] = 255;
    }
  }
  ctx.putImageData(kolona, x, 0);
}

/**
  Popunjava spektrogram ilustrativnom istorijom unaprijed.
  Prazno platno koje se puni deset sekundi na štandu izgleda pokvareno.
*/
function popuniIstoriju(ctx: CanvasRenderingContext2D, kolona: ImageData, paleta: Uint8ClampedArray) {
  const privremeni = new Uint8Array(TRAKA);
  const kolona_ukupno = Math.ceil(PLATNO_S / POMAK);
  for (let i = 0; i < kolona_ukupno; i++) {
    /* Unazad u vremenu, otprilike koliko bi stalo kadrova. */
    ilustrativniSpektar(-(kolona_ukupno - i) / 60, privremeni);
    upisiKolonu(ctx, kolona, paleta, privremeni, i * POMAK);
  }
}

export function Glas() {
  const moguc = useSyncExternalStore(prazanUpis, mikrofonMoguc, () => false);

  const [stanje, postaviStanje] = useState<Stanje>('ilustracija');
  const [govori, postaviGovori] = useState(false);
  /* Gornja granica spektrograma u hercima; poznata tek kad mikrofon proradi. */
  const [gornjiHz, postaviGornjiHz] = useState<number | null>(null);

  const t = useRef(0);
  const spektar = useRef(new Uint8Array(TRAKA));
  const talas = useRef(new Uint8Array(UZORAKA_TALASA));

  const strujaRef = useRef<MediaStream | null>(null);
  const kontekstRef = useRef<AudioContext | null>(null);
  const analizatorRef = useRef<AnalyserNode | null>(null);
  const kanteRef = useRef<Uint8Array | null>(null);
  const zivoRef = useRef(false);
  const govoriRef = useRef(false);

  const platnoRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const kolonaRef = useRef<ImageData | null>(null);
  const paletaRef = useRef<Uint8ClampedArray | null>(null);

  const linijaRef = useRef<SVGPolylineElement | null>(null);
  const nivoRef = useRef<SVGRectElement | null>(null);

  const ugasiMikrofon = useCallback(() => {
    zivoRef.current = false;
    strujaRef.current?.getTracks().forEach((t) => t.stop());
    strujaRef.current = null;
    analizatorRef.current = null;
    kanteRef.current = null;
    void kontekstRef.current?.close();
    kontekstRef.current = null;
    postaviGornjiHz(null);
  }, []);

  /* Platno i paleta se spremaju jednom; paleta se čita iz istih boja kao ostatak sajta. */
  useEffect(() => {
    const platno = platnoRef.current;
    if (!platno) return;

    platno.width = PLATNO_S;
    platno.height = PLATNO_V;

    const ctx = platno.getContext('2d', { alpha: false });
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    ctxRef.current = ctx;
    kolonaRef.current = ctx.createImageData(POMAK, PLATNO_V);

    const tema = getComputedStyle(document.documentElement);
    try {
      paletaRef.current = napraviPaletu(STANICE_PALETE.map((n) => tema.getPropertyValue(n)));
    } catch {
      /* Ako tema nije u očekivanom obliku, spektrogram ide u sivim tonovima. */
      paletaRef.current = napraviPaletu(['#061a13', '#eef4ef']);
    }

    ctx.fillStyle = '#061a13';
    ctx.fillRect(0, 0, PLATNO_S, PLATNO_V);
    popuniIstoriju(ctx, kolonaRef.current, paletaRef.current);
  }, []);

  useEffect(() => ugasiMikrofon, [ugasiMikrofon]);

  function nacrtajTalas(j: number) {
    const linija = linijaRef.current;
    if (linija) {
      const uzorci = talas.current;
      const korak = 2;
      const tacke: string[] = [];
      for (let i = 0; i < uzorci.length; i += korak) {
        const x = (i / (uzorci.length - 1)) * 1000;
        const y = 84 - ((uzorci[i] - 128) / 128) * 72;
        tacke.push(`${x.toFixed(1)},${y.toFixed(1)}`);
      }
      linija.setAttribute('points', tacke.join(' '));
    }
    nivoRef.current?.setAttribute('width', String(Math.max(2, j * 1000)));
  }

  function nacrtajKolonu() {
    const ctx = ctxRef.current;
    const kolona = kolonaRef.current;
    const paleta = paletaRef.current;
    const platno = platnoRef.current;
    if (!ctx || !kolona || !paleta || !platno) return;

    /* Cijela slika se pomjeri ulijevo, pa se desno upiše nova kolona. */
    ctx.drawImage(platno, -POMAK, 0);
    upisiKolonu(ctx, kolona, paleta, spektar.current, PLATNO_S - POMAK);
  }

  useAnimacija((dt) => {
    t.current += dt;

    const analizator = analizatorRef.current;
    const kante = kanteRef.current;
    if (zivoRef.current && analizator && kante) {
      analizator.getByteFrequencyData(kante);
      spektar.current.set(kante.subarray(0, TRAKA));
      analizator.getByteTimeDomainData(talas.current);
    } else {
      ilustrativniSpektar(t.current, spektar.current);
      ilustrativniTalas(t.current, talas.current);
    }

    const j = jacina(talas.current);
    if (!govoriRef.current && j > PRAG_GORE) {
      govoriRef.current = true;
      postaviGovori(true);
    } else if (govoriRef.current && j < PRAG_DOLJE) {
      govoriRef.current = false;
      postaviGovori(false);
    }

    nacrtajTalas(j);
    nacrtajKolonu();
  });

  async function ukljuciMikrofon() {
    postaviStanje('trazim');
    try {
      const struja = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      });

      const Konstruktor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Konstruktor) throw new Error('nema AudioContext');

      const kontekst = new Konstruktor();
      await kontekst.resume();

      const analizator = kontekst.createAnalyser();
      analizator.fftSize = FFT;
      analizator.smoothingTimeConstant = 0.55;

      /* Namjerno bez spajanja na zvučnik — inače bi sala zaurlala. */
      kontekst.createMediaStreamSource(struja).connect(analizator);

      strujaRef.current = struja;
      kontekstRef.current = kontekst;
      analizatorRef.current = analizator;
      kanteRef.current = new Uint8Array(analizator.frequencyBinCount);
      zivoRef.current = true;

      postaviGornjiHz((TRAKA * kontekst.sampleRate) / FFT);
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

  function resetuj() {
    iskljuciMikrofon();
    t.current = 0;
    postaviGovori(false);
    govoriRef.current = false;

    const ctx = ctxRef.current;
    const kolona = kolonaRef.current;
    const paleta = paletaRef.current;
    if (ctx && kolona && paleta) popuniIstoriju(ctx, kolona, paleta);
  }

  const stvarnoStanje: Stanje = !moguc && stanje === 'ilustracija' ? 'nemoguce' : stanje;

  const poruka =
    stvarnoStanje === 'uzivo'
      ? govori
        ? 'To si ti: gore kako talas izgleda u vremenu, dolje koje su visine jake.'
        : 'Mikrofon radi. Reci nešto i gledaj šta se desi.'
      : stvarnoStanje === 'trazim'
        ? 'Tražim dozvolu za mikrofon…'
        : stvarnoStanje === 'odbijeno'
          ? 'Mikrofon nije dozvoljen, pa ide ilustracija govora.'
          : stvarnoStanje === 'nemoguce'
            ? 'Ovaj uređaj ne daje mikrofon ovoj strani, pa ide ilustracija govora.'
            : 'Ovako izgleda govor. Pritisni „Uključi mikrofon” pa pogledaj svoj.';

  const uzivo = stvarnoStanje === 'uzivo';

  return (
    <OkvirDemonstracije
      naslov="Tvoj glas uživo"
      oznaka="JARVIS · zvuk je talas, i talas ima boje"
      nazadPutanja="/jarvis"
      nazadNaziv="Jarvis"
      poruka={poruka}
      napomena="Zvuk se ovdje samo gleda: ne snima se, ne šalje se nikuda i mikrofon nije spojen na zvučnik. Kad mikrofona nema, prikazana je ilustracija govora, a ne ničiji snimak."
      onResetuj={resetuj}
      kontrole={
        uzivo ? (
          <button className={stil.dugme} onClick={iskljuciMikrofon}>
            Isključi mikrofon
          </button>
        ) : (
          <button
            className={stil.dugme}
            onClick={ukljuciMikrofon}
            disabled={!moguc || stvarnoStanje === 'trazim'}
          >
            {stvarnoStanje === 'trazim' ? 'Čekam dozvolu…' : 'Uključi mikrofon'}
          </button>
        )
      }
    >
      <div className={svoj.okvir}>
        <div className={`${svoj.pojas} ${svoj.talas}`}>
          <svg viewBox="0 0 1000 180" preserveAspectRatio="none" aria-hidden="true">
            <line x1={0} y1={84} x2={1000} y2={84} stroke="var(--ivica)" strokeWidth={1} vectorEffect="non-scaling-stroke" />
            <polyline
              ref={linijaRef}
              points=""
              fill="none"
              stroke="var(--osjeti)"
              strokeWidth={4}
              strokeLinejoin="round"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
            <rect x={0} y={166} width={1000} height={10} fill="var(--ivica)" opacity={0.5} />
            <rect ref={nivoRef} x={0} y={166} width={2} height={10} fill="var(--bakar-struja)" />
          </svg>
          <span className={svoj.oznakaPojasa}>
            {uzivo ? 'Talas · tvoj glas u vremenu' : 'Talas · ilustracija govora'}
          </span>
        </div>

        <div className={`${svoj.pojas} ${svoj.spektar}`}>
          <canvas ref={platnoRef} className={svoj.platno} />
          <span className={svoj.oznakaPojasa}>Spektrogram · koje su visine jake</span>
          <div className={svoj.osaVisine}>
            <span>{gornjiHz ? `visoko · ${(gornjiHz / 1000).toFixed(1)} kHz` : 'visoko'}</span>
            <span>{gornjiHz ? 'nisko · 0 Hz' : 'nisko'}</span>
          </div>
          <span className={svoj.privatnost}>
Tvoj glas se ne snima i ne odlazi sa ovog uređaja
          </span>
        </div>
      </div>
    </OkvirDemonstracije>
  );
}
