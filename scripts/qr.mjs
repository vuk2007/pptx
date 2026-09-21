/*
  QR enkoder, bajt režim, nivo ispravke M, verzije 1 do 10.
  Napisan ovdje da sajt nema nijednu zavisnost, ni pri buildu.

  Redosljed posla je onaj iz standarda:
  podaci -> kodne riječi -> Reed-Solomon -> preplitanje -> matrica -> maska -> format.
*/

// ---------------------------------------------------------------- tabele

/** Broj kodnih riječi podataka po verziji, za nivo M. */
const PODACI_M = [16, 28, 44, 64, 86, 108, 124, 154, 182, 216];

/** Broj kodnih riječi ispravke po bloku, za nivo M. */
const ISPRAVKA_PO_BLOKU_M = [10, 16, 26, 18, 24, 16, 18, 22, 22, 26];

/** Broj blokova [grupa 1, grupa 2], za nivo M. */
const BLOKOVI_M = [
  [1, 0], [1, 0], [1, 0], [2, 0], [2, 0],
  [4, 0], [4, 0], [2, 2], [3, 2], [4, 1],
];

/** Pozicije centara poravnavajućih uzoraka, po verziji. */
const PORAVNANJE = [
  [], [6, 18], [6, 22], [6, 26], [6, 30],
  [6, 34], [6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50],
];

/** Nivo ispravke M u dva bita, kako ga traži format. */
const BITOVI_NIVOA_M = 0b00;

// ---------------------------------------------------- Galoaovo polje GF(256)

const EKSP = new Uint8Array(512);
const LOG = new Uint8Array(256);
(() => {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    EKSP[i] = x;
    LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d; // generatorski polinom polja
  }
  for (let i = 255; i < 512; i++) EKSP[i] = EKSP[i - 255];
})();

const pomnozi = (a, b) => (a === 0 || b === 0 ? 0 : EKSP[LOG[a] + LOG[b]]);

/** Generatorski polinom za n kodnih riječi ispravke. */
function generator(n) {
  let g = [1];
  for (let i = 0; i < n; i++) {
    const sljedeci = new Array(g.length + 1).fill(0);
    for (let j = 0; j < g.length; j++) {
      sljedeci[j] ^= g[j];
      sljedeci[j + 1] ^= pomnozi(g[j], EKSP[i]);
    }
    g = sljedeci;
  }
  return g;
}

/** Reed-Solomon ostatak: kodne riječi ispravke za jedan blok. */
function ispravka(podaci, brojIspravki) {
  const g = generator(brojIspravki);
  const ostatak = new Array(brojIspravki).fill(0);
  for (const bajt of podaci) {
    const vodeci = bajt ^ ostatak[0];
    ostatak.shift();
    ostatak.push(0);
    if (vodeci !== 0) {
      for (let i = 0; i < brojIspravki; i++) {
        ostatak[i] ^= pomnozi(g[i + 1], vodeci);
      }
    }
  }
  return ostatak;
}

// ------------------------------------------------------------- BCH za format

function bch(vrijednost, generatorPolinom, bitova) {
  let v = vrijednost << bitova;
  const duzinaG = generatorPolinom.toString(2).length;
  while (v.toString(2).length - bitova >= duzinaG - bitova) {
    const pomak = v.toString(2).length - duzinaG;
    if (pomak < 0) break;
    v ^= generatorPolinom << pomak;
  }
  return v;
}

/** 15 bita formata: nivo ispravke, maska, BCH ostatak, pa XOR sa maskom standarda. */
function bitoviFormata(maska) {
  const podaci = (BITOVI_NIVOA_M << 3) | maska;
  const ostatak = bch(podaci, 0b10100110111, 10);
  return ((podaci << 10) | ostatak) ^ 0b101010000010010;
}

/** 18 bita verzije, potrebno od verzije 7 naviše. */
function bitoviVerzije(verzija) {
  const ostatak = bch(verzija, 0b1111100100101, 12);
  return (verzija << 12) | ostatak;
}

// ------------------------------------------------------------ tok bitova

class TokBita {
  constructor() {
    this.bitovi = [];
  }
  dodaj(vrijednost, duzina) {
    for (let i = duzina - 1; i >= 0; i--) this.bitovi.push((vrijednost >> i) & 1);
  }
  get duzina() {
    return this.bitovi.length;
  }
}

/** Najmanja verzija u koju staje poruka. */
function odaberiVerziju(brojBajtova) {
  for (let v = 1; v <= 10; v++) {
    const brojacDuzine = v <= 9 ? 8 : 16;
    const potrebnoBita = 4 + brojacDuzine + brojBajtova * 8;
    if (potrebnoBita <= PODACI_M[v - 1] * 8) return v;
  }
  throw new Error(`Poruka je preduga za verziju 10 (${brojBajtova} bajtova).`);
}

function kodneRijeci(bajtovi, verzija) {
  const ukupnoPodataka = PODACI_M[verzija - 1];
  const tok = new TokBita();
  tok.dodaj(0b0100, 4); // bajt režim
  tok.dodaj(bajtovi.length, verzija <= 9 ? 8 : 16);
  for (const b of bajtovi) tok.dodaj(b, 8);

  // završetak, pa dopuna do cijelog bajta
  tok.dodaj(0, Math.min(4, ukupnoPodataka * 8 - tok.duzina));
  while (tok.duzina % 8 !== 0) tok.bitovi.push(0);

  const rijeci = [];
  for (let i = 0; i < tok.duzina; i += 8) {
    let b = 0;
    for (let j = 0; j < 8; j++) b = (b << 1) | tok.bitovi[i + j];
    rijeci.push(b);
  }

  // ostatak se puni naizmjenično sa 0xEC i 0x11, kako standard propisuje
  const dopuna = [0xec, 0x11];
  let i = 0;
  while (rijeci.length < ukupnoPodataka) rijeci.push(dopuna[i++ % 2]);
  return rijeci;
}

/** Dijeli podatke na blokove, računa ispravku i preplice ih. */
function prepleteneRijeci(podaci, verzija) {
  const [brojBlokova1, brojBlokova2] = BLOKOVI_M[verzija - 1];
  const ukupnoBlokova = brojBlokova1 + brojBlokova2;
  const brojIspravki = ISPRAVKA_PO_BLOKU_M[verzija - 1];

  const kratki = Math.floor(podaci.length / ukupnoBlokova);
  const blokovi = [];
  let pozicija = 0;
  for (let i = 0; i < ukupnoBlokova; i++) {
    // Grupa 2 ima po jednu kodnu riječ više od grupe 1.
    const duzina = i < brojBlokova1 ? kratki : kratki + 1;
    blokovi.push(podaci.slice(pozicija, pozicija + duzina));
    pozicija += duzina;
  }

  const ispravke = blokovi.map((b) => ispravka(b, brojIspravki));

  const izlaz = [];
  const najduzi = Math.max(...blokovi.map((b) => b.length));
  for (let i = 0; i < najduzi; i++) {
    for (const b of blokovi) if (i < b.length) izlaz.push(b[i]);
  }
  for (let i = 0; i < brojIspravki; i++) {
    for (const e of ispravke) izlaz.push(e[i]);
  }
  return izlaz;
}

// --------------------------------------------------------------- matrica

function praznaMatrica(velicina) {
  return Array.from({ length: velicina }, () => new Array(velicina).fill(null));
}

function postaviFiksne(m, verzija) {
  const n = m.length;

  const tragac = (r, c) => {
    for (let dr = -1; dr <= 7; dr++) {
      for (let dc = -1; dc <= 7; dc++) {
        const rr = r + dr;
        const cc = c + dc;
        if (rr < 0 || cc < 0 || rr >= n || cc >= n) continue;
        const uOkviru = dr >= 0 && dr <= 6 && dc >= 0 && dc <= 6;
        const crn =
          uOkviru &&
          ((dr === 0 || dr === 6 || dc === 0 || dc === 6) ||
            (dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4));
        m[rr][cc] = crn ? 1 : 0;
      }
    }
  };
  tragac(0, 0);
  tragac(0, n - 7);
  tragac(n - 7, 0);

  // tajming
  for (let i = 8; i < n - 8; i++) {
    m[6][i] = i % 2 === 0 ? 1 : 0;
    m[i][6] = i % 2 === 0 ? 1 : 0;
  }

  /*
    Poravnanje. Izostavlja se samo tamo gdje bi palo preko tragača u uglu.
    Tamo gdje siječe tajming liniju se CRTA — uzorci se poklapaju, jer i jedan
    i drugi na tom redu daju isti niz 1,0,1,0,1.
  */
  const centri = PORAVNANJE[verzija - 1];
  for (const r of centri) {
    for (const c of centri) {
      const uTragacu = (r <= 8 && c <= 8) || (r <= 8 && c >= n - 9) || (r >= n - 9 && c <= 8);
      if (uTragacu) continue;
      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          const ivica = Math.max(Math.abs(dr), Math.abs(dc));
          m[r + dr][c + dc] = ivica === 1 ? 0 : 1;
        }
      }
    }
  }

  m[n - 8][8] = 1; // uvijek tamni modul

  // mjesta za format se rezervišu nulama, prave vrijednosti dolaze kasnije
  for (let i = 0; i < 9; i++) {
    if (m[8][i] === null) m[8][i] = 0;
    if (m[i][8] === null) m[i][8] = 0;
  }
  for (let i = 0; i < 8; i++) {
    if (m[8][n - 1 - i] === null) m[8][n - 1 - i] = 0;
    if (m[n - 1 - i][8] === null) m[n - 1 - i][8] = 0;
  }

  if (verzija >= 7) {
    const bitovi = bitoviVerzije(verzija);
    for (let i = 0; i < 18; i++) {
      const bit = (bitovi >> i) & 1;
      const r = Math.floor(i / 3);
      const c = i % 3;
      m[r][n - 11 + c] = bit;
      m[n - 11 + c][r] = bit;
    }
  }
}

/** Mapa polja koja nose podatke, da se maska ne primijeni na fiksne uzorke. */
function mapaPodataka(verzija) {
  const n = 17 + verzija * 4;
  const m = praznaMatrica(n);
  postaviFiksne(m, verzija);
  return m.map((red) => red.map((v) => v === null));
}

function upisiPodatke(m, rijeci, slobodno) {
  const n = m.length;
  const bitovi = [];
  for (const b of rijeci) for (let i = 7; i >= 0; i--) bitovi.push((b >> i) & 1);

  let indeks = 0;
  let nagore = true;
  for (let desnaKolona = n - 1; desnaKolona > 0; desnaKolona -= 2) {
    if (desnaKolona === 6) desnaKolona--; // kolona tajminga se preskače
    for (let korak = 0; korak < n; korak++) {
      const red = nagore ? n - 1 - korak : korak;
      for (const kolona of [desnaKolona, desnaKolona - 1]) {
        if (!slobodno[red][kolona]) continue;
        m[red][kolona] = indeks < bitovi.length ? bitovi[indeks] : 0;
        indeks++;
      }
    }
    nagore = !nagore;
  }
}

const MASKE = [
  (r, c) => (r + c) % 2 === 0,
  (r) => r % 2 === 0,
  (_r, c) => c % 3 === 0,
  (r, c) => (r + c) % 3 === 0,
  (r, c) => (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0,
  (r, c) => ((r * c) % 2) + ((r * c) % 3) === 0,
  (r, c) => (((r * c) % 2) + ((r * c) % 3)) % 2 === 0,
  (r, c) => (((r + c) % 2) + ((r * c) % 3)) % 2 === 0,
];

function primijeniMasku(m, slobodno, maska) {
  const n = m.length;
  const kopija = m.map((red) => red.slice());
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (slobodno[r][c] && MASKE[maska](r, c)) kopija[r][c] ^= 1;
    }
  }
  return kopija;
}

function upisiFormat(m, maska) {
  const n = m.length;
  const bitovi = bitoviFormata(maska);
  for (let i = 0; i < 15; i++) {
    const bit = (bitovi >> i) & 1;
    // prva kopija, oko gornjeg lijevog tragača
    if (i < 6) m[8][i] = bit;
    else if (i === 6) m[8][7] = bit;
    else if (i === 7) m[8][8] = bit;
    else if (i === 8) m[7][8] = bit;
    else m[14 - i][8] = bit;
    // druga kopija, podijeljena na dva ugla
    if (i < 8) m[n - 1 - i][8] = bit;
    else m[8][n - 15 + i] = bit;
  }
}

/** Četiri kazne iz standarda; bira se maska sa najmanjim zbirom. */
function kazna(m) {
  const n = m.length;
  let ukupno = 0;

  const uNizu = (uzmi) => {
    for (let a = 0; a < n; a++) {
      let duzina = 1;
      for (let b = 1; b < n; b++) {
        if (uzmi(a, b) === uzmi(a, b - 1)) {
          duzina++;
        } else {
          if (duzina >= 5) ukupno += 3 + (duzina - 5);
          duzina = 1;
        }
      }
      if (duzina >= 5) ukupno += 3 + (duzina - 5);
    }
  };
  uNizu((r, c) => m[r][c]);
  uNizu((c, r) => m[r][c]);

  for (let r = 0; r < n - 1; r++) {
    for (let c = 0; c < n - 1; c++) {
      const v = m[r][c];
      if (v === m[r][c + 1] && v === m[r + 1][c] && v === m[r + 1][c + 1]) ukupno += 3;
    }
  }

  const SABLON = [1, 0, 1, 1, 1, 0, 1];
  const nadjiSablon = (uzmi) => {
    for (let a = 0; a < n; a++) {
      for (let b = 0; b <= n - 7; b++) {
        let poklapa = true;
        for (let k = 0; k < 7; k++) {
          if (uzmi(a, b + k) !== SABLON[k]) {
            poklapa = false;
            break;
          }
        }
        if (!poklapa) continue;
        const prije = b >= 4 && [0, 1, 2, 3].every((k) => uzmi(a, b - 1 - k) === 0);
        const poslije = b + 10 < n && [0, 1, 2, 3].every((k) => uzmi(a, b + 7 + k) === 0);
        if (prije || poslije) ukupno += 40;
      }
    }
  };
  nadjiSablon((r, c) => m[r][c]);
  nadjiSablon((c, r) => m[r][c]);

  let tamnih = 0;
  for (const red of m) for (const v of red) tamnih += v;
  const procenat = (tamnih * 100) / (n * n);
  ukupno += Math.floor(Math.abs(procenat - 50) / 5) * 10;

  return ukupno;
}

// ------------------------------------------------------------------ javno

/** Vraća matricu 0/1, gdje 1 znači tamni modul. */
export function napraviQr(tekst) {
  const bajtovi = Array.from(new TextEncoder().encode(tekst));
  const verzija = odaberiVerziju(bajtovi.length);
  const podaci = kodneRijeci(bajtovi, verzija);
  const rijeci = prepleteneRijeci(podaci, verzija);

  const slobodno = mapaPodataka(verzija);
  const osnova = praznaMatrica(17 + verzija * 4);
  postaviFiksne(osnova, verzija);
  upisiPodatke(osnova, rijeci, slobodno);

  let najbolja = null;
  let najmanjaKazna = Infinity;
  for (let maska = 0; maska < 8; maska++) {
    const kandidat = primijeniMasku(osnova, slobodno, maska);
    upisiFormat(kandidat, maska);
    const bodovi = kazna(kandidat);
    if (bodovi < najmanjaKazna) {
      najmanjaKazna = bodovi;
      najbolja = kandidat;
    }
  }

  return { matrica: najbolja, verzija };
}

/** QR kao SVG. Tiha zona od 4 modula je dio standarda, bez nje se ne skenira. */
export function qrUSvg(tekst, { tihaZona = 4 } = {}) {
  const { matrica } = napraviQr(tekst);
  const n = matrica.length;
  const ukupno = n + tihaZona * 2;

  const dijelovi = [];
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (matrica[r][c]) dijelovi.push(`M${c + tihaZona} ${r + tihaZona}h1v1h-1z`);
    }
  }

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${ukupno} ${ukupno}" shape-rendering="crispEdges" role="img" aria-label="QR kod">`,
    `<rect width="${ukupno}" height="${ukupno}" fill="#ffffff"/>`,
    `<path d="${dijelovi.join('')}" fill="#061a13"/>`,
    `</svg>`,
  ].join('');
}
