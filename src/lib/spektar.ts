/*
  Računski dio demonstracije glasa, odvojen od crtanja.

  I živi mikrofon i ilustracija prolaze kroz isti put: odsječak signala
  (brojevi od −1 do 1) → Hannov prozor → FFT → decibeli → redovi
  spektrograma na logaritamskoj osi frekvencija. Zato ilustracija
  izgleda kao pravi govor: to je zbir harmonika osnovnog tona, oblikovan
  formantima, izračunat istim FFT-om kao i mikrofon.

  Ako bilo šta ovdje da NaN, spektrogram postane crna mrlja, a na štandu
  to izgleda kao da sajt ne radi. Zato sve ima provjeru.
*/

/** Dužina odsječka za FFT, uzoraka. Na 48 kHz to je 42,7 ms. */
export const FFT = 2048;

/** Opseg spektrograma: od ispod najnižeg muškog glasa do sibilanata. */
export const F_MIN = 80;
export const F_MAX = 8000;

/** Opseg boja: ispod DB_MIN je crno, na DB_MAX je najsvjetlije. */
export const DB_MIN = -95;
export const DB_MAX = -25;

/** Oznake na osi frekvencija. */
export const OZNAKE_HZ = [100, 200, 500, 1000, 2000, 5000] as const;

/* ------------------------------------------------------------ FFT */

/** Radix-2 FFT na mjestu. Dužina mora biti stepen dvojke. */
export function fft(re: Float64Array, im: Float64Array): void {
  const n = re.length;
  if (n !== im.length || (n & (n - 1)) !== 0) throw new Error('FFT traži dužinu koja je stepen dvojke');
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      [re[i], re[j]] = [re[j], re[i]];
      [im[i], im[j]] = [im[j], im[i]];
    }
  }
  for (let duz = 2; duz <= n; duz <<= 1) {
    const ug = (-2 * Math.PI) / duz;
    const wr = Math.cos(ug);
    const wi = Math.sin(ug);
    for (let i = 0; i < n; i += duz) {
      let cr = 1;
      let ci = 0;
      for (let k = 0; k < duz / 2; k++) {
        const a = i + k;
        const b = a + duz / 2;
        const tr = re[b] * cr - im[b] * ci;
        const ti = re[b] * ci + im[b] * cr;
        re[b] = re[a] - tr;
        im[b] = im[a] - ti;
        re[a] += tr;
        im[a] += ti;
        const s = cr * wr - ci * wi;
        ci = cr * wi + ci * wr;
        cr = s;
      }
    }
  }
}

const re = new Float64Array(FFT);
const im = new Float64Array(FFT);
const HANN = Float64Array.from({ length: FFT }, (_, i) => 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (FFT - 1)));

/**
  Spektar u decibelima punog opsega: sinus amplitude 1 daje 0 dB.
  Sa Hannovim prozorom vrh takvog sinusa je N/4, pa se dijeli sa tim.
*/
export function spektarDb(signal: ArrayLike<number>, izlaz: Float32Array): void {
  for (let i = 0; i < FFT; i++) {
    const v = signal[i];
    re[i] = (Number.isFinite(v) ? v : 0) * HANN[i];
    im[i] = 0;
  }
  fft(re, im);
  const norma = FFT / 4;
  for (let k = 0; k < FFT / 2; k++) {
    const m = Math.hypot(re[k], im[k]) / norma;
    izlaz[k] = m > 1e-12 ? 20 * Math.log10(m) : -240;
  }
}

/* ------------------------------------------------------------ logaritamska osa */

/** Frekvencija na sredini reda y (0 je gore, najviša frekvencija). */
export function hzZaRed(y: number, redova: number): number {
  const udio = 1 - (y + 0.5) / redova;
  return F_MIN * (F_MAX / F_MIN) ** udio;
}

/** Red (može biti razlomak) na kojem stoji data frekvencija. */
export function redZaHz(f: number, redova: number): number {
  const udio = Math.log(f / F_MIN) / Math.log(F_MAX / F_MIN);
  return (1 - udio) * redova - 0.5;
}

/**
  Spektar u redove spektrograma, kao bajtove 0–255 za paletu.
  Dolje jedan red pokriva manje od jedne kante, pa se kante interpoliraju;
  gore jedan red pokriva više kanti, pa se uzima najjača.
*/
export function uRedove(db: Float32Array, uzorkovanje: number, izlaz: Uint8Array): void {
  const redova = izlaz.length;
  const hzPoKanti = uzorkovanje / FFT;
  const zadnja = db.length - 1;
  for (let y = 0; y < redova; y++) {
    const gore = hzZaRed(y - 0.5, redova) / hzPoKanti;
    const dolje = hzZaRed(y + 0.5, redova) / hzPoKanti;
    let v: number;
    if (gore - dolje < 1) {
      const k = Math.min(zadnja, (gore + dolje) / 2);
      const k0 = Math.floor(k);
      const k1 = Math.min(zadnja, k0 + 1);
      v = db[k0] + (db[k1] - db[k0]) * (k - k0);
    } else {
      v = -Infinity;
      for (let k = Math.ceil(dolje); k <= Math.min(zadnja, Math.floor(gore)); k++) v = Math.max(v, db[k]);
    }
    const udio = (v - DB_MIN) / (DB_MAX - DB_MIN);
    izlaz[y] = Number.isFinite(udio) ? Math.round(255 * Math.max(0, Math.min(1, udio))) : 0;
  }
}

/* ------------------------------------------------------------ paleta */

/** Stanice palete nalik na „magma": od skoro crne preko ljubičaste i crvene do svijetložute. */
export const MAGMA = ['#000004', '#1c1044', '#4f127b', '#812581', '#b5367a', '#e55064', '#fb8761', '#fec287', '#fcfdbf'];

/** #rrggbb u tri broja. Baca ako niz nije boja koju umijemo pročitati. */
export function parsirajHex(boja: string): [number, number, number] {
  const m = /^#([0-9a-f]{6})$/i.exec(boja.trim());
  if (!m) throw new Error(`Nije #rrggbb boja: „${boja}”`);
  const v = parseInt(m[1], 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
}

/** Paleta od 256 boja, linearno između stanica. */
export function napraviPaletu(stanice: readonly string[]): Uint8ClampedArray {
  if (stanice.length < 2) throw new Error('Paleti trebaju bar dvije stanice');
  const tacke = stanice.map(parsirajHex);
  const paleta = new Uint8ClampedArray(256 * 3);
  for (let i = 0; i < 256; i++) {
    const p = (i / 255) * (tacke.length - 1);
    const donja = Math.min(tacke.length - 2, Math.floor(p));
    const dio = p - donja;
    for (let k = 0; k < 3; k++) paleta[i * 3 + k] = tacke[donja][k] + (tacke[donja + 1][k] - tacke[donja][k]) * dio;
  }
  return paleta;
}

/* ------------------------------------------------------------ mjerenja */

/** Glasnoća u decibelima punog opsega (RMS). Tišina daje −Infinity. */
export function nivoDbfs(signal: ArrayLike<number>): number {
  let zbir = 0;
  for (let i = 0; i < signal.length; i++) zbir += signal[i] * signal[i];
  const rms = Math.sqrt(zbir / Math.max(1, signal.length));
  return rms > 0 ? 20 * Math.log10(rms) : -Infinity;
}

/** Ispod ove glasnoće se ne traži ni ton ni najjača frekvencija: to je tišina sobe. */
export const PRAG_GOVORA_DB = -45;

/** Najjača frekvencija u opsegu spektrograma, Hz. */
export function najjacaHz(db: Float32Array, uzorkovanje: number): number {
  const hzPoKanti = uzorkovanje / FFT;
  const od = Math.ceil(F_MIN / hzPoKanti);
  const doK = Math.min(db.length - 2, Math.floor(F_MAX / hzPoKanti));
  let k = od;
  for (let i = od; i <= doK; i++) if (db[i] > db[k]) k = i;
  /* Parabola kroz vrh i dva susjeda daje frekvenciju između kanti. */
  const a = db[k - 1];
  const b = db[k];
  const c = db[k + 1];
  const nazivnik = a - 2 * b + c;
  const pomak = nazivnik !== 0 && Number.isFinite(nazivnik) ? (0.5 * (a - c)) / nazivnik : 0;
  return (k + Math.max(-0.5, Math.min(0.5, pomak))) * hzPoKanti;
}

/** Opseg osnovnog tona koji se traži, Hz: od dubokog muškog do visokog dječjeg glasa. */
export const TON_MIN = 70;
export const TON_MAX = 450;

/**
  Osnovni ton autokorelacijom: signal se uporedi sa sobom pomjerenim za
  jednu periodu. Vraća null kad nema jasne periode (tišina, šum, „s").
*/
export function osnovniTon(signal: ArrayLike<number>, uzorkovanje: number): number | null {
  const n = signal.length;
  const najmanji = Math.floor(uzorkovanje / TON_MAX);
  const najveci = Math.min(Math.ceil(uzorkovanje / TON_MIN), Math.floor(n / 2));
  const duzina = n - najveci;
  let energija = 0;
  for (let i = 0; i < duzina; i++) energija += signal[i] * signal[i];
  if (energija <= 1e-9) return null;

  const r = new Float64Array(najveci + 2);
  for (let lag = najmanji - 1; lag <= najveci + 1; lag++) {
    let s = 0;
    let e2 = 0;
    for (let i = 0; i < duzina; i++) {
      s += signal[i] * signal[i + lag];
      e2 += signal[i + lag] * signal[i + lag];
    }
    r[lag] = s / Math.sqrt(energija * e2 || 1);
  }

  /* Prvi vrh iznad praga, pa najbolji u njegovoj okolini: tako se ne uhvati dvostruka perioda. */
  const najbolji = Math.max(...Array.from(r.subarray(najmanji, najveci + 1)));
  if (najbolji < 0.6) return null;
  let lag = najmanji;
  while (lag < najveci && !(r[lag] >= 0.9 * najbolji && r[lag] >= r[lag - 1] && r[lag] >= r[lag + 1])) lag++;

  const a = r[lag - 1];
  const b = r[lag];
  const c = r[lag + 1];
  const nazivnik = a - 2 * b + c;
  const pomak = nazivnik !== 0 ? (0.5 * (a - c)) / nazivnik : 0;
  return uzorkovanje / (lag + Math.max(-0.5, Math.min(0.5, pomak)));
}

/**
  Mjesto okidanja, kao na osciloskopu: prvi prolaz kroz nulu naviše
  poslije početka. Bez okidanja talas bi skakao svaki kadar.
*/
export function okidanje(signal: ArrayLike<number>, najkasnije: number): number {
  for (let i = 1; i < najkasnije; i++) if (signal[i - 1] < 0 && signal[i] >= 0) return i;
  return 0;
}

/* ------------------------------------------------------------ ilustrativni govor */

/**
  Glasnoća ilustrativnog govora: slogovi sa tišinom između. Mali pod je
  tiha soba; bez njega bi talas u pauzama bio savršeno prava linija.
*/
export function slog(t: number): number {
  const talas = Math.sin(t * 3.4) * 0.5 + Math.sin(t * 1.27 + 1.1) * 0.5;
  return Math.max(0, talas) ** 0.7;
}

/** Osnovni ton ilustrativnog glasa u trenutku t, Hz. */
export function tonIlustracije(t: number): number {
  return 135 + 28 * Math.sin(t * 0.7) + 9 * Math.sin(t * 2.3 + 0.4);
}

/** Formanti (rezonancije usta) koji se lagano šetaju, kao samoglasnici. */
function formanti(t: number) {
  return [
    { f: 520 + 230 * Math.sin(t * 0.9), sirina: 110, jacina: 1 },
    { f: 1500 + 650 * Math.sin(t * 0.63 + 1.7), sirina: 160, jacina: 0.5 },
    { f: 2650 + 150 * Math.sin(t * 0.41 + 3.1), sirina: 220, jacina: 0.25 },
  ];
}

/** Pseudo-slučajan šum sa sjemenom, da ilustracija bude ista na svakom uređaju. */
function sum(n: number) {
  const x = Math.sin(n * 12.9898 + 78.233) * 43758.5453;
  return (x - Math.floor(x)) * 2 - 1;
}

/**
  Odsječak ilustrativnog govora koji počinje u trenutku t: harmonici
  osnovnog tona, svaki pojačan koliko je blizu nekog formanta, i malo
  šuma sobe. Amplituda najviše oko 0,5, da ostane rezerve do punog opsega.
*/
export function sintetizujGovor(t: number, uzorkovanje: number, izlaz: Float32Array): void {
  const f0 = tonIlustracije(t);
  const g = slog(t);
  const fs = formanti(t);
  const harmonici: { w: number; a: number }[] = [];
  for (let k = 1; k * f0 < 5000; k++) {
    const f = k * f0;
    let a = 0;
    for (const fm of fs) a += fm.jacina / (1 + ((f - fm.f) / fm.sirina) ** 2);
    /* Glasnice daju harmonike koji slabe sa visinom, oko 12 dB po oktavi. */
    harmonici.push({ w: (2 * Math.PI * f) / uzorkovanje, a: (a * 0.28) / k });
  }
  const pocetak = Math.round(t * uzorkovanje);
  for (let i = 0; i < izlaz.length; i++) {
    let v = 0;
    const n = pocetak + i;
    for (const h of harmonici) v += h.a * Math.sin(h.w * n);
    izlaz[i] = v * g + 0.0015 * sum(n);
  }
}
