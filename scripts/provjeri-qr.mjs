import { napraviQr } from './qr.mjs';

/*
  QR koji se ne skenira gori je nego nikakav QR, a na sajmu nema druge šanse.
  Zato se enkoder provjerava tako što se kod pročita nazad, istim putem kojim
  ga čita telefon: format, maska, redosljed modula, raspletanje blokova,
  Reed-Solomon sindromi, pa dekodiranje bajtova.

  Ako round-trip vrati polazni tekst i svi sindromi su nula, greška u
  enkoderu je praktično isključena.
*/

const PODACI_M = [16, 28, 44, 64, 86, 108, 124, 154, 182, 216];
const ISPRAVKA_PO_BLOKU_M = [10, 16, 26, 18, 24, 16, 18, 22, 22, 26];
const BLOKOVI_M = [
  [1, 0], [1, 0], [1, 0], [2, 0], [2, 0],
  [4, 0], [4, 0], [2, 2], [3, 2], [4, 1],
];
const PORAVNANJE = [
  [], [6, 18], [6, 22], [6, 26], [6, 30],
  [6, 34], [6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50],
];

const EKSP = new Uint8Array(512);
const LOG = new Uint8Array(256);
(() => {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    EKSP[i] = x;
    LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) EKSP[i] = EKSP[i - 255];
})();
const pomnozi = (a, b) => (a === 0 || b === 0 ? 0 : EKSP[LOG[a] + LOG[b]]);

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

/** Ista mapa fiksnih polja koju koristi enkoder, izvedena iz veličine matrice. */
function mapaSlobodnih(verzija) {
  const n = 17 + verzija * 4;
  const zauzeto = Array.from({ length: n }, () => new Array(n).fill(false));
  const oznaci = (r, c, w, h) => {
    for (let dr = 0; dr < h; dr++)
      for (let dc = 0; dc < w; dc++) {
        const rr = r + dr;
        const cc = c + dc;
        if (rr >= 0 && cc >= 0 && rr < n && cc < n) zauzeto[rr][cc] = true;
      }
  };

  oznaci(0, 0, 9, 9);
  oznaci(0, n - 8, 8, 9);
  oznaci(n - 8, 0, 9, 8);
  for (let i = 0; i < n; i++) {
    zauzeto[6][i] = true;
    zauzeto[i][6] = true;
  }

  const centri = PORAVNANJE[verzija - 1];
  for (const r of centri)
    for (const c of centri) {
      const uTragacu =
        (r <= 8 && c <= 8) || (r <= 8 && c >= n - 9) || (r >= n - 9 && c <= 8);
      if (!uTragacu) oznaci(r - 2, c - 2, 5, 5);
    }

  if (verzija >= 7) {
    oznaci(0, n - 11, 3, 6);
    oznaci(n - 11, 0, 6, 3);
  }

  return zauzeto.map((red) => red.map((v) => !v));
}

function citajFormat(m) {
  let sirovi = 0;
  for (let i = 0; i < 15; i++) {
    let bit;
    if (i < 6) bit = m[8][i];
    else if (i === 6) bit = m[8][7];
    else if (i === 7) bit = m[8][8];
    else if (i === 8) bit = m[7][8];
    else bit = m[14 - i][8];
    sirovi |= bit << i;
  }
  const podaci = (sirovi ^ 0b101010000010010) >> 10;
  return { nivo: podaci >> 3, maska: podaci & 0b111 };
}

function citajKodneRijeci(m, slobodno) {
  const n = m.length;
  const bitovi = [];
  let nagore = true;
  for (let desnaKolona = n - 1; desnaKolona > 0; desnaKolona -= 2) {
    if (desnaKolona === 6) desnaKolona--;
    for (let korak = 0; korak < n; korak++) {
      const red = nagore ? n - 1 - korak : korak;
      for (const kolona of [desnaKolona, desnaKolona - 1]) {
        if (slobodno[red][kolona]) bitovi.push(m[red][kolona]);
      }
    }
    nagore = !nagore;
  }

  const rijeci = [];
  for (let i = 0; i + 8 <= bitovi.length; i += 8) {
    let b = 0;
    for (let j = 0; j < 8; j++) b = (b << 1) | bitovi[i + j];
    rijeci.push(b);
  }
  return rijeci;
}

/** Sindromi bloka: svi nula znači da ispravka odgovara podacima. */
function sindromiNula(blok, brojIspravki) {
  for (let i = 0; i < brojIspravki; i++) {
    let s = 0;
    for (const bajt of blok) s = pomnozi(s, EKSP[i]) ^ bajt;
    if (s !== 0) return false;
  }
  return true;
}

function dekodiraj(tekstZaProvjeru) {
  const { matrica, verzija } = napraviQr(tekstZaProvjeru);
  const n = matrica.length;
  const slobodno = mapaSlobodnih(verzija);

  const { nivo, maska } = citajFormat(matrica);
  if (nivo !== 0b00) throw new Error(`Format nosi pogrešan nivo ispravke: ${nivo}`);

  const bezMaske = matrica.map((red, r) =>
    red.map((v, c) => (slobodno[r][c] && MASKE[maska](r, c) ? v ^ 1 : v)),
  );

  const isprepletene = citajKodneRijeci(bezMaske, slobodno);

  // raspletanje nazad u blokove
  const [brojBlokova1, brojBlokova2] = BLOKOVI_M[verzija - 1];
  const ukupnoBlokova = brojBlokova1 + brojBlokova2;
  const brojIspravki = ISPRAVKA_PO_BLOKU_M[verzija - 1];
  const ukupnoPodataka = PODACI_M[verzija - 1];
  const kratki = Math.floor(ukupnoPodataka / ukupnoBlokova);

  const duzine = [];
  for (let i = 0; i < ukupnoBlokova; i++) duzine.push(i < brojBlokova1 ? kratki : kratki + 1);

  const blokovi = duzine.map(() => []);
  let indeks = 0;
  const najduzi = Math.max(...duzine);
  for (let i = 0; i < najduzi; i++) {
    for (let b = 0; b < ukupnoBlokova; b++) {
      if (i < duzine[b]) blokovi[b].push(isprepletene[indeks++]);
    }
  }
  const ispravke = blokovi.map(() => []);
  for (let i = 0; i < brojIspravki; i++) {
    for (let b = 0; b < ukupnoBlokova; b++) ispravke[b].push(isprepletene[indeks++]);
  }

  for (let b = 0; b < ukupnoBlokova; b++) {
    if (!sindromiNula([...blokovi[b], ...ispravke[b]], brojIspravki)) {
      throw new Error(`Reed-Solomon sindrom nije nula u bloku ${b} (verzija ${verzija})`);
    }
  }

  const podaci = blokovi.flat();

  // bajt režim: 4 bita režima, brojač dužine, pa bajtovi
  let bitPozicija = 0;
  const uzmi = (koliko) => {
    let v = 0;
    for (let i = 0; i < koliko; i++) {
      const bajt = podaci[bitPozicija >> 3];
      const bit = (bajt >> (7 - (bitPozicija & 7))) & 1;
      v = (v << 1) | bit;
      bitPozicija++;
    }
    return v;
  };

  const rezim = uzmi(4);
  if (rezim !== 0b0100) throw new Error(`Očekivan bajt režim, dobijen ${rezim}`);
  const duzina = uzmi(verzija <= 9 ? 8 : 16);
  const izlaz = [];
  for (let i = 0; i < duzina; i++) izlaz.push(uzmi(8));

  return { tekst: new TextDecoder().decode(new Uint8Array(izlaz)), verzija, maska, velicina: n };
}

// ------------------------------------------------------------------ provjera

const PRIMJERI = [
  'https://example.com',
  'HELLO WORLD',
  'a',
  'https://praktikum.me/pocni',
  'Čćđšž — dijakritika u UTF-8',
  'https://github.com/vuk2007/pptx',
  'x'.repeat(100),
  'x'.repeat(150),
  'x'.repeat(213), // tačno koliko staje u verziju 10, nivo M
];

let palo = 0;
for (const primjer of PRIMJERI) {
  const prikaz = primjer.length > 34 ? `${primjer.slice(0, 31)}…` : primjer;
  try {
    const { tekst, verzija, maska, velicina } = dekodiraj(primjer);
    if (tekst !== primjer) {
      console.log(`  PAD  "${prikaz}" → vraćeno "${tekst.slice(0, 40)}"`);
      palo++;
    } else {
      console.log(`  OK   "${prikaz}"  v${verzija}, maska ${maska}, ${velicina}×${velicina}`);
    }
  } catch (greska) {
    console.log(`  PAD  "${prikaz}" → ${greska.message}`);
    palo++;
  }
}

/* Preduga poruka mora glasno pasti, a ne tiho proizvesti kod koji se ne skenira. */
try {
  dekodiraj('x'.repeat(214));
  console.log('  PAD  poruka od 214 bajtova je prošla, a ne staje u verziju 10');
  palo++;
} catch (greska) {
  if (greska.message.includes('preduga')) {
    console.log('  OK   poruka preko kapaciteta pada sa jasnom porukom');
  } else {
    console.log(`  PAD  pogrešna greška za predugu poruku: ${greska.message}`);
    palo++;
  }
}

const ukupnoProvjera = PRIMJERI.length + 1;
console.log(`\n  ${ukupnoProvjera - palo}/${ukupnoProvjera} prošlo round-trip provjeru\n`);
process.exit(palo ? 1 : 0);
